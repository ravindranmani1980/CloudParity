import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  CheckCircle,
  Flame,
  PieChart,
  TrendingUp,
  Activity,
  Radio,
  ShieldCheck,
  Clock,
  Unplug,
  Lock,
  BellRing,
  Gauge,
  X,
} from 'lucide-react';
import { AnomalyAlert, CloudProviderId } from '../types/cloud';

interface RealTimeMonitoringProps {
  baseMonthlySpend: number;
}

type ChartViewMode = 'cumulative' | 'daily';
type SpikeScenarioId = 'organic' | 'gpu-batch' | 'failover-surge';
type StreamCadenceMs = 1000 | 3000 | 5000;

interface EphemeralRealtimeConnection {
  isConnected: boolean;
  provider: CloudProviderId | 'custom-ws';
  streamName: string;
  endpointUri: string;
  ephemeralToken: string;
  cadenceMs: StreamCadenceMs;
  connectedAt: string | null;
  packetsReceived: number;
  lastLatencyMs: number;
}

interface TelemetryPoint {
  day: number;
  dateLabel: string;
  isHistorical: boolean;
  dailyBaseline: number;
  dailyActual?: number;
  dailyPredictedSpike?: number;
  dailyUpperBound?: number;
  dailyLowerBound?: number;
  cumulativeBaseline: number;
  cumulativeActual?: number;
  cumulativePredictedSpike?: number;
  cumulativeUpperBound?: number;
  cumulativeLowerBound?: number;
  isSpikeWindow: boolean;
  spikeAnnotation?: string;
}

const SPIKE_SCENARIOS: {
  id: SpikeScenarioId;
  label: string;
  multiplier: number;
  peakDays: [number, number];
  annotation: string;
}[] = [
  {
    id: 'organic',
    label: 'Organic EOM Traffic Burst (+28%)',
    multiplier: 1.28,
    peakDays: [24, 28],
    annotation: 'End-of-month billing batch & NAT Gateway egress surge',
  },
  {
    id: 'gpu-batch',
    label: 'AI / GPU Fine-Tuning Window (+68%)',
    multiplier: 1.68,
    peakDays: [23, 27],
    annotation: 'Scheduled multi-node GPU cluster burst & checkpoint I/O',
  },
  {
    id: 'failover-surge',
    label: 'Multi-Region Active Failover (+95%)',
    multiplier: 1.95,
    peakDays: [22, 26],
    annotation: 'Cross-region standby scale-out & synchronous DB replication spike',
  },
];

const STREAM_PRESETS: Record<
  CloudProviderId | 'custom-ws',
  { label: string; defaultEndpoint: string; protocol: string }
> = {
  aws: {
    label: 'AWS Cost & Usage EventBridge Stream',
    defaultEndpoint: 'wss://ce-stream.us-east-1.amazonaws.com/v2/cost-telemetry',
    protocol: 'AWS STS Ephemeral Stream',
  },
  azure: {
    label: 'Azure Cost Management Event Hub',
    defaultEndpoint: 'wss://maniq-finops.servicebus.windows.net/cost-stream',
    protocol: 'Azure AD Managed Identity Stream',
  },
  gcp: {
    label: 'GCP Cloud Billing BigQuery Live Export',
    defaultEndpoint: 'wss://billing-telemetry.googleapis.com/v1/projects/prod/stream',
    protocol: 'GCP Short-Lived OAuth Token',
  },
  'custom-ws': {
    label: 'Custom OpenCost / Prometheus WebSocket',
    defaultEndpoint: 'wss://telemetry.internal.enterprise.io/v1/cloud-burn',
    protocol: 'WebSocket TLS (Zero-Persistence)',
  },
};

export const RealTimeMonitoring: React.FC<RealTimeMonitoringProps> = ({
  baseMonthlySpend,
}) => {
  const [isLiveRunning, setIsLiveRunning] = useState<boolean>(true);
  const [budgetThreshold, setBudgetThreshold] = useState<number>(
    Math.round(baseMonthlySpend * 1.15)
  );

  const initialMtd = Math.round(baseMonthlySpend * 0.68);
  const [currentMtd, setCurrentMtd] = useState<number>(initialMtd);

  const hourlyBurn = Math.round((baseMonthlySpend / 730) * 100) / 100;
  const [burnRate, setBurnRate] = useState<number>(hourlyBurn);
  const [surgeCount, setSurgeCount] = useState<number>(0);

  // Ephemeral Real-Time Connection State (NEVER stored in localStorage, sessionStorage, cookies, or backend)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [selectedStreamProvider, setSelectedStreamProvider] = useState<
    CloudProviderId | 'custom-ws'
  >('aws');
  const [formEndpoint, setFormEndpoint] = useState<string>(
    STREAM_PRESETS.aws.defaultEndpoint
  );
  const [formEphemeralToken, setFormEphemeralToken] = useState<string>('');
  const [formCadenceMs, setFormCadenceMs] = useState<StreamCadenceMs>(1000);
  const [isConnectingStream, setIsConnectingStream] = useState<boolean>(false);

  const [realtimeConn, setRealtimeConn] = useState<EphemeralRealtimeConnection>({
    isConnected: false,
    provider: 'aws',
    streamName: STREAM_PRESETS.aws.label,
    endpointUri: '',
    ephemeralToken: '',
    cadenceMs: 1000,
    connectedAt: null,
    packetsReceived: 0,
    lastLatencyMs: 24,
  });

  // D3 Chart Controls & Hover State
  const [chartMode, setChartMode] = useState<ChartViewMode>('cumulative');
  const [spikeScenario, setSpikeScenario] = useState<SpikeScenarioId>('gpu-batch');
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);
  const [svgWidth, setSvgWidth] = useState<number>(860);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Sync when baseMonthlySpend changes from calculator
  useEffect(() => {
    setBudgetThreshold(Math.round(baseMonthlySpend * 1.15));
    setCurrentMtd(Math.round(baseMonthlySpend * 0.68));
    setBurnRate(Math.round((baseMonthlySpend / 730) * 100) / 100);
    setSurgeCount(0);
  }, [baseMonthlySpend]);

  // Ensure ephemeral connection state is wiped on unmount
  useEffect(() => {
    return () => {
      setFormEphemeralToken('');
      setFormEndpoint('');
    };
  }, []);

  // Responsive container observer for D3 SVG
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 240) {
        setSvgWidth(Math.floor(rect.width));
      }
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [alerts, setAlerts] = useState<AnomalyAlert[]>([
    {
      id: 'alt-1',
      timestamp: '14 mins ago',
      provider: 'aws',
      severity: 'high',
      service: 'Amazon EC2 & NAT Gateway',
      region: 'us-east-1',
      title: 'Unusual NAT Gateway Egress Spike',
      description:
        'Data outbound exceeded baseline 30-day p95 by 440% across 2 availability zones.',
      impactAmount: 184.5,
    },
    {
      id: 'alt-2',
      timestamp: '2 hours ago',
      provider: 'gcp',
      severity: 'medium',
      service: 'Cloud Storage',
      region: 'us-central1',
      title: 'Unattached Persistent Disks',
      description:
        '4 SSD volumes (1,200 GB total) remain detached for > 14 days without active I/O.',
      impactAmount: 96.0,
    },
    {
      id: 'alt-3',
      timestamp: '5 hours ago',
      provider: 'azure',
      severity: 'low',
      service: 'Azure SQL Database',
      region: 'East US',
      title: 'Underutilized vCore Provisioning',
      description:
        'Database instance averaging < 4% CPU utilization over the past 7 days.',
      impactAmount: 142.0,
    },
  ]);

  // Live stream interval (incorporates connected cadence & jitter when realtimeConn.isConnected)
  useEffect(() => {
    if (!isLiveRunning) return;

    const tickMs = realtimeConn.isConnected ? realtimeConn.cadenceMs : 1000;

    const interval = setInterval(() => {
      const jitter = realtimeConn.isConnected
        ? 0.92 + Math.random() * 0.18
        : 1.0;
      const microIncrement = (burnRate / 3600) * (tickMs / 1000) * 2.5 * jitter;
      setCurrentMtd((prev) => prev + microIncrement);

      if (realtimeConn.isConnected) {
        setRealtimeConn((prev) => ({
          ...prev,
          packetsReceived: prev.packetsReceived + 1,
          lastLatencyMs: Math.round(18 + Math.random() * 14),
        }));
      }
    }, tickMs);

    return () => clearInterval(interval);
  }, [isLiveRunning, burnRate, realtimeConn.isConnected, realtimeConn.cadenceMs]);

  const handleSelectStreamProvider = (p: CloudProviderId | 'custom-ws') => {
    setSelectedStreamProvider(p);
    setFormEndpoint(STREAM_PRESETS[p].defaultEndpoint);
  };

  const handleConnectRealtimeStream = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnectingStream(true);

    setTimeout(() => {
      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setRealtimeConn({
        isConnected: true,
        provider: selectedStreamProvider,
        streamName: STREAM_PRESETS[selectedStreamProvider].label,
        endpointUri: formEndpoint.trim() || STREAM_PRESETS[selectedStreamProvider].defaultEndpoint,
        // Mask token in active memory and immediately wipe raw input
        ephemeralToken: formEphemeralToken ? '••••••••-ephemeral' : 'ephemeral-session',
        cadenceMs: formCadenceMs,
        connectedAt: nowStr,
        packetsReceived: 1,
        lastLatencyMs: 21,
      });
      // Immediately clear raw input state so credentials are never retained
      setFormEphemeralToken('');
      setIsConnectingStream(false);
      setIsConnectModalOpen(false);
      setIsLiveRunning(true);
    }, 550);
  };

  const handleDisconnectRealtimeStream = () => {
    // Purge all ephemeral connection values from memory
    setRealtimeConn({
      isConnected: false,
      provider: 'aws',
      streamName: STREAM_PRESETS.aws.label,
      endpointUri: '',
      ephemeralToken: '',
      cadenceMs: 1000,
      connectedAt: null,
      packetsReceived: 0,
      lastLatencyMs: 0,
    });
    setFormEphemeralToken('');
    setFormEndpoint(STREAM_PRESETS.aws.defaultEndpoint);
  };

  const daysInMonth = 30;
  const currentDay = 21;
  const remainingCycleDays = daysInMonth - currentDay; // 9 days
  const remainingCycleHours = remainingCycleDays * 24; // 216 hours

  // Build 30-day historical usage + predicted cost spike telemetry dataset for D3
  const telemetryData = useMemo<TelemetryPoint[]>(() => {
    const activeScenario =
      SPIKE_SCENARIOS.find((s) => s.id === spikeScenario) || SPIKE_SCENARIOS[0];
    const baseDaily = baseMonthlySpend / daysInMonth;
    const liveBurnRatio = burnRate / Math.max(0.01, hourlyBurn);

    // Deterministic daily historical shape factors (Days 1..21)
    const historicalFactors = [
      0.92, 0.95, 0.98, 0.94, 1.01, 0.89, 0.87, 1.24, 1.06, 0.97,
      0.99, 1.03, 0.91, 1.34, 1.12, 0.96, 1.02, 1.05, 0.98, 1.09, 1.14,
    ];

    const rawDailyActuals = historicalFactors.map((f) => f * baseDaily);
    const rawSum = rawDailyActuals.reduce((acc, v) => acc + v, 0);
    const scaleFactor = currentMtd / Math.max(1, rawSum);

    const points: TelemetryPoint[] = [];
    let cumBaseline = 0;
    let cumActual = 0;
    let cumPredicted = 0;
    let cumUpper = 0;
    let cumLower = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const baselineWave = 1 + Math.sin(day * 0.55) * 0.04;
      const dailyBaseline = Math.round(baseDaily * baselineWave * 100) / 100;
      cumBaseline += dailyBaseline;

      const dateLabel = `Oct ${day < 10 ? `0${day}` : day}`;

      if (day <= currentDay) {
        const dailyActual =
          Math.round(rawDailyActuals[day - 1] * scaleFactor * 100) / 100;
        cumActual += dailyActual;

        const isHistSpike = day === 8 || day === 14;
        const histAnnotation =
          day === 8
            ? 'Historical Analytics Compaction Burst (+24%)'
            : day === 14
            ? 'Observed NAT Gateway Cross-AZ Egress Anomaly (+34%)'
            : undefined;

        points.push({
          day,
          dateLabel,
          isHistorical: true,
          dailyBaseline,
          dailyActual,
          dailyPredictedSpike: day === currentDay ? dailyActual : undefined,
          dailyUpperBound: day === currentDay ? dailyActual : undefined,
          dailyLowerBound: day === currentDay ? dailyActual : undefined,
          cumulativeBaseline: Math.round(cumBaseline),
          cumulativeActual: Math.round(cumActual),
          cumulativePredictedSpike:
            day === currentDay ? Math.round(cumActual) : undefined,
          cumulativeUpperBound:
            day === currentDay ? Math.round(cumActual) : undefined,
          cumulativeLowerBound:
            day === currentDay ? Math.round(cumActual) : undefined,
          isSpikeWindow: isHistSpike,
          spikeAnnotation: histAnnotation,
        });

        if (day === currentDay) {
          cumPredicted = cumActual;
          cumUpper = cumActual;
          cumLower = cumActual;
        }
      } else {
        const [peakStart, peakEnd] = activeScenario.peakDays;
        const inPeakWindow = day >= peakStart && day <= peakEnd;

        let spikeFactor = 1.06;
        if (inPeakWindow) {
          const center = (peakStart + peakEnd) / 2;
          const halfSpan = Math.max(1, (peakEnd - peakStart) / 2 + 0.8);
          const dist = Math.abs(day - center) / halfSpan;
          const bell = Math.max(0.35, Math.cos(dist * (Math.PI / 2)));
          spikeFactor =
            1 + (activeScenario.multiplier - 1) * (0.65 + 0.55 * bell);
        } else if (day > peakEnd) {
          spikeFactor = 1.18 + (activeScenario.multiplier - 1) * 0.22;
        }

        const effectiveMultiplier =
          spikeFactor * (1 + (liveBurnRatio - 1) * 0.55);
        const dailyPredictedSpike =
          Math.round(dailyBaseline * effectiveMultiplier * 100) / 100;

        const horizonSpread = 0.06 + ((day - currentDay) / 9) * 0.14;
        const dailyUpperBound =
          Math.round(dailyPredictedSpike * (1 + horizonSpread) * 100) / 100;
        const dailyLowerBound =
          Math.round(
            Math.max(
              dailyBaseline * 0.92,
              dailyPredictedSpike * (1 - horizonSpread * 0.8)
            ) * 100
          ) / 100;

        cumPredicted += dailyPredictedSpike;
        cumUpper += dailyUpperBound;
        cumLower += dailyLowerBound;

        points.push({
          day,
          dateLabel,
          isHistorical: false,
          dailyBaseline,
          dailyPredictedSpike,
          dailyUpperBound,
          dailyLowerBound,
          cumulativeBaseline: Math.round(cumBaseline),
          cumulativePredictedSpike: Math.round(cumPredicted),
          cumulativeUpperBound: Math.round(cumUpper),
          cumulativeLowerBound: Math.round(cumLower),
          isSpikeWindow: inPeakWindow,
          spikeAnnotation: inPeakWindow ? activeScenario.annotation : undefined,
        });
      }
    }

    return points;
  }, [baseMonthlySpend, currentMtd, burnRate, hourlyBurn, spikeScenario]);

  const finalPoint = telemetryData[telemetryData.length - 1];
  const projectedMonthEnd =
    finalPoint?.cumulativePredictedSpike ??
    Math.round(currentMtd + burnRate * 24 * (daysInMonth - currentDay));
  const projectedOverage = Math.max(0, projectedMonthEnd - budgetThreshold);
  const firstBreachPoint = telemetryData.find(
    (p) =>
      (p.cumulativeActual ?? p.cumulativePredictedSpike ?? 0) > budgetThreshold
  );

  // Budget Threshold & Estimated Time-to-Limit (TTL) Calculations
  const remainingBudget = Math.max(0, budgetThreshold - currentMtd);
  const isAlreadyBreached = currentMtd >= budgetThreshold;
  const rawHoursToLimit =
    burnRate > 0 ? remainingBudget / burnRate : Infinity;
  const daysToLimit = Math.floor(rawHoursToLimit / 24);
  const hoursRemainder = Math.floor(rawHoursToLimit % 24);
  const minutesRemainder = Math.floor((rawHoursToLimit * 60) % 60);

  const formattedTimeToLimit = isAlreadyBreached
    ? '0d 00h 00m (Limit Reached)'
    : `${daysToLimit}d ${hoursRemainder}h ${minutesRemainder}m`;

  const estimatedExhaustionDate = useMemo(() => {
    if (isAlreadyBreached) return 'Threshold Already Breached';
    if (!isFinite(rawHoursToLimit)) return 'N/A';
    const d = new Date(Date.now() + rawHoursToLimit * 3600 * 1000);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [isAlreadyBreached, rawHoursToLimit]);

  const willBreachBeforeCycleEnd =
    isAlreadyBreached || rawHoursToLimit < remainingCycleHours;
  const hoursDeltaVsCycleEnd = Math.round(
    Math.abs(remainingCycleHours - rawHoursToLimit)
  );
  const safeTargetHourlyBurn =
    remainingCycleHours > 0
      ? Math.max(0, remainingBudget / remainingCycleHours)
      : 0;
  const requiredHourlyReduction = Math.max(0, burnRate - safeTargetHourlyBurn);

  const budgetUtilization = Math.min(
    100,
    Math.round((currentMtd / Math.max(1, budgetThreshold)) * 100)
  );
  const isBudgetWarning = budgetUtilization >= 80 || willBreachBeforeCycleEnd;
  const isBudgetCritical =
    budgetUtilization >= 95 || isAlreadyBreached || projectedOverage > 0;

  // Render D3 Multi-Series Line & Overage Area Chart
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || telemetryData.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const height = 350;
    const margin = { top: 26, right: 28, bottom: 38, left: 68 };
    const innerWidth = Math.max(180, svgWidth - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    const dailyBudgetGuardrail =
      Math.round((budgetThreshold / daysInMonth) * 100) / 100;
    const activeThreshold =
      chartMode === 'cumulative' ? budgetThreshold : dailyBudgetGuardrail;

    const getBaseline = (d: TelemetryPoint) =>
      chartMode === 'cumulative' ? d.cumulativeBaseline : d.dailyBaseline;
    const getActual = (d: TelemetryPoint) =>
      chartMode === 'cumulative' ? d.cumulativeActual : d.dailyActual;
    const getPredicted = (d: TelemetryPoint) =>
      chartMode === 'cumulative'
        ? d.cumulativePredictedSpike
        : d.dailyPredictedSpike;
    const getUpper = (d: TelemetryPoint) =>
      chartMode === 'cumulative' ? d.cumulativeUpperBound : d.dailyUpperBound;
    const getLower = (d: TelemetryPoint) =>
      chartMode === 'cumulative' ? d.cumulativeLowerBound : d.dailyLowerBound;

    const allValues: number[] = [activeThreshold * 1.08];
    telemetryData.forEach((d) => {
      allValues.push(getBaseline(d));
      const act = getActual(d);
      const pred = getPredicted(d);
      const up = getUpper(d);
      if (act !== undefined) allValues.push(act);
      if (pred !== undefined) allValues.push(pred);
      if (up !== undefined) allValues.push(up);
    });

    const maxY = (d3.max(allValues) ?? activeThreshold) * 1.06;

    const xScale = d3
      .scaleLinear()
      .domain([1, daysInMonth])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxY])
      .nice()
      .range([innerHeight, 0]);

    const defs = svg.append('defs');

    defs
      .append('clipPath')
      .attr('id', 'overage-clip-above-threshold')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', Math.max(0, yScale(activeThreshold)));

    const histGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-hist-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    histGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2BB5A0')
      .attr('stop-opacity', 0.22);
    histGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#2BB5A0')
      .attr('stop-opacity', 0.01);

    const overageGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-overage-fill-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    overageGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#DC2626')
      .attr('stop-opacity', 0.34);
    overageGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#D79A45')
      .attr('stop-opacity', 0.12);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const todayX = xScale(currentDay);
    g.append('rect')
      .attr('x', todayX)
      .attr('y', 0)
      .attr('width', Math.max(0, innerWidth - todayX))
      .attr('height', innerHeight)
      .attr('fill', '#F8FAFC');

    const spikeDays = telemetryData.filter(
      (d) => !d.isHistorical && d.isSpikeWindow
    );
    if (spikeDays.length > 0) {
      const startDay = spikeDays[0].day - 0.4;
      const endDay = spikeDays[spikeDays.length - 1].day + 0.4;
      g.append('rect')
        .attr('x', xScale(startDay))
        .attr('y', 0)
        .attr('width', Math.max(0, xScale(endDay) - xScale(startDay)))
        .attr('height', innerHeight)
        .attr('fill', '#FEF3C7')
        .attr('opacity', 0.42);
    }

    const yTicks = yScale.ticks(5);
    g.selectAll('.grid-line')
      .data(yTicks)
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#E2E8F0')
      .attr('stroke-dasharray', '3,3');

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(10)
      .tickFormat((d) => `Day ${d}`);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => {
        const val = Number(d);
        if (val >= 1000)
          return `$${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
        return `$${val}`;
      });

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);
    xAxisGroup.select('.domain').attr('stroke', '#CBD5E1');
    xAxisGroup
      .selectAll('text')
      .attr('fill', '#64748B')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-size', '10px');

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').remove();
    yAxisGroup.selectAll('.tick line').remove();
    yAxisGroup
      .selectAll('text')
      .attr('fill', '#64748B')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-size', '10px');

    const historicalData = telemetryData.filter(
      (d) => getActual(d) !== undefined
    );
    const predictedData = telemetryData.filter(
      (d) => getPredicted(d) !== undefined
    );

    const histArea = d3
      .area<TelemetryPoint>()
      .x((d) => xScale(d.day))
      .y0(innerHeight)
      .y1((d) => yScale(getActual(d) ?? 0))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(historicalData)
      .attr('fill', 'url(#d3-hist-area-grad)')
      .attr('d', histArea);

    const confidenceArea = d3
      .area<TelemetryPoint>()
      .x((d) => xScale(d.day))
      .y0((d) => yScale(getLower(d) ?? 0))
      .y1((d) => yScale(getUpper(d) ?? 0))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(predictedData)
      .attr('fill', '#D79A45')
      .attr('opacity', 0.16)
      .attr('d', confidenceArea);

    const overageArea = d3
      .area<TelemetryPoint>()
      .x((d) => xScale(d.day))
      .y0(yScale(activeThreshold))
      .y1((d) => yScale(getPredicted(d) ?? getActual(d) ?? 0))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(telemetryData)
      .attr('clip-path', 'url(#overage-clip-above-threshold)')
      .attr('fill', 'url(#d3-overage-fill-grad)')
      .attr('d', overageArea);

    const baselineLine = d3
      .line<TelemetryPoint>()
      .x((d) => xScale(d.day))
      .y((d) => yScale(getBaseline(d)))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(telemetryData)
      .attr('fill', 'none')
      .attr('stroke', '#94A3B8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('d', baselineLine);

    const actualLine = d3
      .line<TelemetryPoint>()
      .x((d) => xScale(d.day))
      .y((d) => yScale(getActual(d) ?? 0))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(historicalData)
      .attr('fill', 'none')
      .attr('stroke', '#0E2238')
      .attr('stroke-width', 2.5)
      .attr('d', actualLine);

    const predictedLine = d3
      .line<TelemetryPoint>()
      .x((d) => xScale(d.day))
      .y((d) => yScale(getPredicted(d) ?? 0))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(predictedData)
      .attr('fill', 'none')
      .attr('stroke', '#DC2626')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '6,3')
      .attr('d', predictedLine);

    const thresholdY = yScale(activeThreshold);
    if (thresholdY >= 0 && thresholdY <= innerHeight) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', thresholdY)
        .attr('y2', thresholdY)
        .attr('stroke', '#DC2626')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,4');

      g.append('rect')
        .attr('x', 8)
        .attr('y', Math.max(2, thresholdY - 18))
        .attr('width', 210)
        .attr('height', 16)
        .attr('rx', 3)
        .attr('fill', '#FEF2F2')
        .attr('stroke', '#FECACA');

      g.append('text')
        .attr('x', 14)
        .attr('y', Math.max(13, thresholdY - 7))
        .attr('fill', '#991B1B')
        .attr('font-family', 'IBM Plex Mono, monospace')
        .attr('font-size', '9.5px')
        .attr('font-weight', '600')
        .text(
          chartMode === 'cumulative'
            ? `BUDGET GUARDRAIL: $${budgetThreshold.toLocaleString()}`
            : `DAILY CEILING: $${dailyBudgetGuardrail.toFixed(0)}/day`
        );
    }

    g.append('line')
      .attr('x1', todayX)
      .attr('x2', todayX)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#0E2238')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '2,2');

    g.append('text')
      .attr('x', todayX - 6)
      .attr('y', 12)
      .attr('text-anchor', 'end')
      .attr('fill', '#0E2238')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-size', '9.5px')
      .attr('font-weight', '600')
      .text('◄ HISTORICAL ACTUALS');

    g.append('text')
      .attr('x', todayX + 6)
      .attr('y', 12)
      .attr('text-anchor', 'start')
      .attr('fill', '#B45309')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-size', '9.5px')
      .attr('font-weight', '600')
      .text('PREDICTED COST SPIKES ►');

    const notablePoints = telemetryData.filter(
      (d) => d.isSpikeWindow || d.day === currentDay || d.day === daysInMonth
    );

    g.selectAll('.notable-dot')
      .data(notablePoints)
      .join('circle')
      .attr('class', 'notable-dot')
      .attr('cx', (d) => xScale(d.day))
      .attr('cy', (d) =>
        yScale(
          d.isHistorical ? (getActual(d) ?? 0) : (getPredicted(d) ?? 0)
        )
      )
      .attr('r', (d) => (d.day === currentDay ? 4.5 : 3.5))
      .attr('fill', (d) => {
        const val = d.isHistorical
          ? (getActual(d) ?? 0)
          : (getPredicted(d) ?? 0);
        if (val > activeThreshold) return '#DC2626';
        return d.isHistorical ? '#2BB5A0' : '#D79A45';
      })
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 1.5);

    const hoverGroup = g.append('g').style('display', 'none');

    const hoverLine = hoverGroup
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#0E2238')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    const hoverPrimaryCircle = hoverGroup
      .append('circle')
      .attr('r', 5.5)
      .attr('fill', '#0E2238')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2);

    const hoverBaselineCircle = hoverGroup
      .append('circle')
      .attr('r', 4)
      .attr('fill', '#94A3B8')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 1.5);

    const bisectDay = d3.bisector<TelemetryPoint, number>((d) => d.day).left;

    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mouseenter', () => {
        hoverGroup.style('display', null);
      })
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const hoveredDayVal = xScale.invert(mx);
        const idx = bisectDay(telemetryData, hoveredDayVal, 1);
        const d0 = telemetryData[idx - 1];
        const d1 = telemetryData[idx] || d0;
        const d =
          hoveredDayVal - d0.day > d1.day - hoveredDayVal ? d1 : d0;

        const cx = xScale(d.day);
        const primaryVal = d.isHistorical
          ? (getActual(d) ?? 0)
          : (getPredicted(d) ?? 0);
        const cy = yScale(primaryVal);

        hoverLine.attr('x1', cx).attr('x2', cx);
        hoverPrimaryCircle
          .attr('cx', cx)
          .attr('cy', cy)
          .attr(
            'fill',
            primaryVal > activeThreshold
              ? '#DC2626'
              : d.isHistorical
              ? '#0E2238'
              : '#D79A45'
          );
        hoverBaselineCircle
          .attr('cx', cx)
          .attr('cy', yScale(getBaseline(d)));

        setHoveredPoint(d);
      })
      .on('mouseleave', () => {
        hoverGroup.style('display', 'none');
        setHoveredPoint(null);
      });
  }, [telemetryData, budgetThreshold, chartMode, svgWidth]);

  const triggerSpikeSimulation = () => {
    setBurnRate((prev) => Math.round(prev * 1.35 * 100) / 100);
    setSurgeCount((prev) => prev + 1);
    const newAlert: AnomalyAlert = {
      id: `alt-${Date.now()}`,
      timestamp: 'Just now',
      provider: realtimeConn.isConnected && realtimeConn.provider !== 'custom-ws'
        ? realtimeConn.provider
        : 'aws',
      severity: 'high',
      service: 'Compute & Auto-Scaling',
      region: 'us-east-1',
      title: 'Synthetic Workload Surge Injected',
      description:
        'Auto-scaling cluster scaled up 8 additional compute nodes due to sudden queue depth, accelerating time-to-budget-limit.',
      impactAmount: 240.0,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const resetSimulation = () => {
    setCurrentMtd(initialMtd);
    setBurnRate(hourlyBurn);
    setSurgeCount(0);
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const inspectedPoint =
    hoveredPoint ||
    telemetryData.find((p) => p.day === 25) ||
    telemetryData[telemetryData.length - 1];

  return (
    <div className="space-y-8">
      {/* Signature Postrix XH-Panel Executive Banner */}
      <section className="xh-panel">
        <div className="xh-kicker">
          <span className="k">
            Continuous Cost Intelligence &amp; Real-Time Anomaly Telemetry
          </span>
          <span className="tag">
            {realtimeConn.isConnected
              ? `LIVE STREAM: ${realtimeConn.streamName.toUpperCase()} (${realtimeConn.lastLatencyMs}ms)`
              : 'Sub-Second Spend Stream · Budget Time-to-Limit · D3 Spike Forecasting'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-[#C9D3D9]/12">
          <div className="flex items-center gap-3.5">
            <div
              className="rm-mono-mark !w-11 !h-11 !text-base"
              aria-hidden="true"
            >
              RM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#EEF3F1] leading-snug m-0 font-sans">
                Real-Time Cost Monitoring &amp; Burn Rate
                <span className="block font-mono font-normal text-xs text-[#A9B7BF] mt-0.5">
                  Stream: {isLiveRunning ? 'ACTIVE' : 'PAUSED'} · Burn: $
                  {burnRate.toFixed(2)}/hr · Time to Limit:{' '}
                  <strong className="text-[#5FD3BF]">
                    {formattedTimeToLimit}
                  </strong>
                </span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ephemeral Real-Time Connection Trigger / Status */}
            {realtimeConn.isConnected ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="xh-btn !border-[#5FD3BF]/60 !bg-[#2BB5A0]/15 text-[#5FD3BF]"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse text-[#5FD3BF]" />
                  <span>
                    Live: {realtimeConn.provider.toUpperCase()} (#{realtimeConn.packetsReceived})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectRealtimeStream}
                  className="xh-btn !px-2.5 text-red-300 hover:!border-red-400"
                  title="Disconnect & purge ephemeral connection state"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(true)}
                className="xh-btn !border-[#5FD3BF]/50"
              >
                <Radio className="w-3.5 h-3.5 text-[#5FD3BF]" />
                <span>Realtime Connection</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsLiveRunning(!isLiveRunning)}
              className={`xh-btn ${isLiveRunning ? 'primary' : ''}`}
            >
              {isLiveRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Stream Active</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Stream Paused</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={triggerSpikeSimulation}
              className="xh-btn"
            >
              <Flame className="w-3.5 h-3.5 text-[#EBC385]" />
              <span>
                Simulate Surge{surgeCount > 0 ? ` (+${surgeCount})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={resetSimulation}
              className="xh-btn !px-2.5"
              title="Reset telemetry counters"
              aria-label="Reset telemetry counters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ephemeral Connection Status Strip (when connected) */}
        {realtimeConn.isConnected && (
          <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-[#081420]/90 border border-[#5FD3BF]/35 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-[#EEF3F1] font-mono">
              <Radio className="w-3.5 h-3.5 text-[#5FD3BF] animate-pulse" />
              <span>CONNECTED: {realtimeConn.streamName}</span>
              <span className="text-[#3E6E86]">·</span>
              <span className="text-[#A9B7BF] truncate max-w-[280px]">
                {realtimeConn.endpointUri}
              </span>
              <span className="text-[#3E6E86]">·</span>
              <span className="text-[#5FD3BF]">
                Cadence: {realtimeConn.cadenceMs / 1000}s · Latency: {realtimeConn.lastLatencyMs}ms
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#EBC385]">
              <Lock className="w-3 h-3" />
              <span>Ephemeral In-Memory Session (Zero Storage Persistence)</span>
            </div>
          </div>
        )}

        {/* 4 XH-Metric Executive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          <div className="xh-metric">
            <div className="lbl">
              <span>01 · Month-to-Date Spend</span>
              <span className="text-[#5FD3BF]">Day 21 / 30</span>
            </div>
            <div className="num hi tabular-nums">
              $
              {currentMtd.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p>
              Remaining budget runway: $
              {remainingBudget.toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>02 · Est. Time to Budget Limit</span>
              <span
                className={
                  willBreachBeforeCycleEnd ? 'text-red-400' : 'text-[#5FD3BF]'
                }
              >
                {isAlreadyBreached
                  ? 'LIMIT BREACHED'
                  : willBreachBeforeCycleEnd
                  ? 'Breaches Before Reset'
                  : 'Safe Past Cycle End'}
              </span>
            </div>
            <div className="num tabular-nums text-xl sm:text-2xl">
              {isAlreadyBreached
                ? '0d 00h 00m'
                : `${daysToLimit}d ${hoursRemainder}h ${minutesRemainder}m`}
            </div>
            <p>Est. exhaustion: {estimatedExhaustionDate}</p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>03 · Current vs Safe Burn</span>
              <span className="text-[#EBC385]">
                Safe: ${safeTargetHourlyBurn.toFixed(2)}/hr
              </span>
            </div>
            <div className="num tabular-nums">
              ${burnRate.toFixed(2)}
              <span className="text-xs font-normal text-[#A9B7BF] ml-1">
                / hr
              </span>
            </div>
            <p>
              {requiredHourlyReduction > 0
                ? `Reduce by $${requiredHourlyReduction.toFixed(2)}/hr to avoid breach`
                : `Operating $${(safeTargetHourlyBurn - burnRate).toFixed(2)}/hr below ceiling`}
            </p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>04 · Budget Utilization</span>
              <span className="font-mono text-[#EEF3F1]">
                {budgetUtilization}%
              </span>
            </div>
            <div className="w-full bg-[#081420] rounded-full h-2.5 border border-[#C9D3D9]/20 overflow-hidden my-2">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isBudgetCritical
                    ? 'bg-red-500'
                    : isBudgetWarning
                    ? 'bg-[#D79A45]'
                    : 'bg-[#2BB5A0]'
                }`}
                style={{ width: `${budgetUtilization}%` }}
              />
            </div>
            <p>
              Status:{' '}
              {isAlreadyBreached
                ? 'Threshold Exceeded'
                : isBudgetCritical
                ? 'Critical Overage Risk'
                : isBudgetWarning
                ? 'Warning (>80%)'
                : 'Nominal Operation'}
            </p>
          </div>
        </div>
      </section>

      {/* Monthly Budget Threshold Governance & Time-to-Limit Alert Engine */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="rm-kicker">
              01 / Automated Budget Threshold &amp; Time-to-Limit Forecasting
            </span>
            <h3 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#3E6E86]" />
              Monthly Budget Threshold &amp; Exhaustion Countdown
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Configure your monthly spend ceiling to compute real-time time-to-limit (TTL) countdowns, safe burn velocities, and visual threshold alerts.
            </p>
          </div>

          {/* Threshold Input + Quick Guardrail Presets */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setBudgetThreshold(Math.round(currentMtd * 0.96))}
                className="px-2.5 py-1 text-xs rounded-md bg-[#F3F5F1] border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Test Breach (-4%)
              </button>
              <button
                type="button"
                onClick={() => setBudgetThreshold(Math.round(baseMonthlySpend * 1.0))}
                className="px-2.5 py-1 text-xs rounded-md bg-[#F3F5F1] border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Strict (1.0× Base)
              </button>
              <button
                type="button"
                onClick={() => setBudgetThreshold(Math.round(baseMonthlySpend * 1.15))}
                className="px-2.5 py-1 text-xs rounded-md bg-[#F3F5F1] border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Standard (+15%)
              </button>
              <button
                type="button"
                onClick={() => setBudgetThreshold(Math.round(baseMonthlySpend * 1.35))}
                className="px-2.5 py-1 text-xs rounded-md bg-[#F3F5F1] border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Buffer (+35%)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="monthly-budget-input"
                className="text-xs text-slate-700 font-semibold whitespace-nowrap"
              >
                Monthly Limit ($):
              </label>
              <input
                id="monthly-budget-input"
                type="number"
                step={250}
                min={500}
                max={1000000}
                value={budgetThreshold}
                onChange={(e) =>
                  setBudgetThreshold(Math.max(500, Number(e.target.value)))
                }
                aria-label="Monthly Budget Target in USD"
                className="bg-[#F3F5F1] border border-slate-300 text-sm text-[#0E2238] font-mono font-bold rounded-lg px-3 py-1.5 w-36 focus:outline-none focus:border-[#0E2238]"
              />
            </div>
          </div>
        </div>

        {/* Interactive Threshold Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
            <span>
              Min Guardrail: ${Math.round(baseMonthlySpend * 0.5).toLocaleString()}
            </span>
            <span className="font-semibold text-[#0E2238]">
              Active Threshold: ${budgetThreshold.toLocaleString()} / mo
            </span>
            <span>
              Max Guardrail: ${Math.round(baseMonthlySpend * 2.0).toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={Math.max(500, Math.round(baseMonthlySpend * 0.5))}
            max={Math.max(5000, Math.round(baseMonthlySpend * 2.0))}
            step={100}
            value={budgetThreshold}
            onChange={(e) => setBudgetThreshold(Number(e.target.value))}
            aria-label="Adjust Monthly Budget Threshold Slider"
            className="w-full accent-[#0E2238] cursor-pointer"
          />
        </div>

        {/* Dynamic Visual Alert Banner based on Time-to-Limit & Threshold State */}
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isAlreadyBreached
              ? 'bg-red-50 border-red-300 text-red-950'
              : willBreachBeforeCycleEnd || projectedOverage > 0
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <BellRing
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                isAlreadyBreached
                  ? 'text-red-700'
                  : willBreachBeforeCycleEnd || projectedOverage > 0
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            />
            <div className="space-y-1">
              <div className="text-sm font-semibold flex flex-wrap items-center gap-2">
                {isAlreadyBreached ? (
                  <span>
                    CRITICAL BUDGET BREACH: Current MTD spend ($
                    {currentMtd.toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    })}
                    ) has exceeded your ${budgetThreshold.toLocaleString()} threshold by $
                    {Math.round(currentMtd - budgetThreshold).toLocaleString()}!
                  </span>
                ) : willBreachBeforeCycleEnd ? (
                  <span>
                    IMMINENT THRESHOLD BREACH ALERT: At current burn (${burnRate.toFixed(2)}/hr), budget limit will be reached in{' '}
                    <u className="font-mono">{formattedTimeToLimit}</u> ({Math.round(hoursDeltaVsCycleEnd / 24 * 10) / 10} days before month-end reset).
                  </span>
                ) : projectedOverage > 0 ? (
                  <span>
                    SPIKE OVERAGE WARNING: Linear burn is within range, but upcoming predicted workload spikes will breach budget on Day{' '}
                    {firstBreachPoint?.day ?? 26} (+${projectedOverage.toLocaleString()} overage).
                  </span>
                ) : (
                  <span>
                    GUARDRAIL HEALTHY: At current burn rate (${burnRate.toFixed(2)}/hr), estimated time to reach limit is{' '}
                    <strong className="font-mono">{formattedTimeToLimit}</strong> — safely extending{' '}
                    {Math.round((hoursDeltaVsCycleEnd / 24) * 10) / 10} days beyond billing cycle closure.
                  </span>
                )}
              </div>
              <p className="text-xs opacity-85">
                {isAlreadyBreached
                  ? 'Recommended Remediation: Throttle non-production auto-scaling groups, pause spot batch queues, or raise your monthly threshold guardrail.'
                  : requiredHourlyReduction > 0
                  ? `To prevent breaching your $${budgetThreshold.toLocaleString()} limit before Day 30, reduce hourly consumption by at least $${requiredHourlyReduction.toFixed(2)}/hr (down to $${safeTargetHourlyBurn.toFixed(2)}/hr).`
                  : `You have $${remainingBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })} in remaining budget runway for the final ${remainingCycleDays} days (${remainingCycleHours} hours) of the billing cycle.`}
              </p>
            </div>
          </div>

          <div className="shrink-0 bg-white/85 border border-slate-200 rounded-lg px-3.5 py-2 text-right font-mono">
            <div className="text-[10px] uppercase text-slate-500">
              Est. Time to Limit
            </div>
            <div
              className={`text-sm font-bold tabular-nums ${
                isAlreadyBreached
                  ? 'text-red-700'
                  : willBreachBeforeCycleEnd
                  ? 'text-amber-800'
                  : 'text-emerald-800'
              }`}
            >
              {formattedTimeToLimit}
            </div>
            <div className="text-[10px] text-slate-500">
              {estimatedExhaustionDate}
            </div>
          </div>
        </div>

        {/* 3-Card Time-to-Limit & Burn Runway Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-[#F3F5F1]/70 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0E2238]" />
                TIME TO REACH LIMIT
              </span>
              <span>{Math.max(0, Math.round(rawHoursToLimit))} hrs left</span>
            </div>
            <div className="text-lg font-bold font-mono text-[#0E2238] tabular-nums">
              {formattedTimeToLimit}
            </div>
            <div className="text-xs text-slate-600">
              Billing cycle closes in{' '}
              <strong className="font-mono text-[#0E2238]">
                {remainingCycleDays}d 00h ({remainingCycleHours} hrs)
              </strong>
            </div>
          </div>

          <div className="bg-[#F3F5F1]/70 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#3E6E86]" />
                REMAINING BUDGET RUNWAY
              </span>
              <span>{100 - budgetUtilization}% unspent</span>
            </div>
            <div className="text-lg font-bold font-mono text-[#0E2238] tabular-nums">
              $
              {remainingBudget.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-xs text-slate-600">
              Daily allowance remaining:{' '}
              <strong className="font-mono text-[#0E2238]">
                ${(remainingBudget / remainingCycleDays).toFixed(2)}/day
              </strong>
            </div>
          </div>

          <div className="bg-[#F3F5F1]/70 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2BB5A0]" />
                SAFE BURN CEILING
              </span>
              <span>Target Velocity</span>
            </div>
            <div className="text-lg font-bold font-mono text-[#0E2238] tabular-nums">
              ${safeTargetHourlyBurn.toFixed(2)}/hr{' '}
              <span className="text-xs font-normal text-slate-500">
                (vs ${burnRate.toFixed(2)}/hr actual)
              </span>
            </div>
            <div className="text-xs text-slate-600">
              {requiredHourlyReduction > 0 ? (
                <span className="text-red-700 font-medium">
                  Exceeding safe pace by +${requiredHourlyReduction.toFixed(2)}/hr
                </span>
              ) : (
                <span className="text-emerald-800 font-medium">
                  Within safe hourly threshold margin
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* D3 Historical Usage Trends vs. Predicted Cost Spikes & Overage Visualizer */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="rm-kicker">
              02 / D3 Telemetry &amp; Predictive Overage Engine
            </span>
            <h3 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2BB5A0]" />
              Historical Usage Trends vs. Predicted Cost Spikes
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Maps 21-day observed consumption against 9-day predictive spike trajectories and highlights potential budget guardrail overages.
            </p>
          </div>

          {/* Interactive Scenario & View Mode Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="spike-scenario-select"
                className="text-xs font-medium text-slate-600"
              >
                Spike Forecast Model:
              </label>
              <select
                id="spike-scenario-select"
                value={spikeScenario}
                onChange={(e) =>
                  setSpikeScenario(e.target.value as SpikeScenarioId)
                }
                className="bg-[#F3F5F1] border border-slate-300 text-xs text-[#0E2238] font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0E2238]"
              >
                {SPIKE_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#F3F5F1] border border-slate-200 rounded-lg">
              <button
                type="button"
                onClick={() => setChartMode('cumulative')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  chartMode === 'cumulative'
                    ? 'bg-[#0E2238] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cumulative Run-Rate
              </button>
              <button
                type="button"
                onClick={() => setChartMode('daily')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  chartMode === 'daily'
                    ? 'bg-[#0E2238] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily Burn Velocity
              </button>
            </div>
          </div>
        </div>

        {/* Legend & Live Overage Callout Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F3F5F1] border border-slate-200 rounded-lg px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-700">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-3 h-0.5 bg-[#0E2238] inline-block" />
              Observed Historical (Days 1–21)
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-3 h-0.5 bg-red-600 border-b border-dashed border-red-600 inline-block" />
              Predicted Cost Spike (Days 21–30)
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-3 h-0.5 bg-slate-400 border-b border-dashed border-slate-400 inline-block" />
              Planned Baseline
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-3 h-2.5 bg-red-500/25 border border-red-400 rounded-xs inline-block" />
              Potential Overage Zone
            </span>
          </div>

          <div className="font-mono text-xs">
            {projectedOverage > 0 ? (
              <span className="text-red-700 font-semibold">
                ALERT: Projected +${projectedOverage.toLocaleString()} Overage (Breach on Day{' '}
                {firstBreachPoint?.day ?? 26})
              </span>
            ) : (
              <span className="text-emerald-800 font-semibold">
                NOMINAL: Forecast remains $
                {(budgetThreshold - projectedMonthEnd).toLocaleString()} below guardrail
              </span>
            )}
          </div>
        </div>

        {/* D3 SVG Canvas */}
        <div ref={chartContainerRef} className="w-full overflow-hidden">
          <svg
            ref={svgRef}
            width={svgWidth}
            height={350}
            className="w-full select-none overflow-visible"
            role="img"
            aria-label="D3 line chart comparing historical usage trends against predicted cost spikes and budget overages"
          />
        </div>

        {/* Interactive Telemetry Scrubber Readout Footer */}
        {inspectedPoint && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200 text-xs">
            <div className="bg-[#F3F5F1]/70 border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] font-mono uppercase text-slate-500">
                Inspected Cycle Day
              </div>
              <div className="text-sm font-semibold text-[#0E2238] font-mono mt-0.5">
                Day {inspectedPoint.day} ({inspectedPoint.dateLabel}) ·{' '}
                <span
                  className={
                    inspectedPoint.isHistorical
                      ? 'text-teal-700'
                      : 'text-amber-700'
                  }
                >
                  {inspectedPoint.isHistorical
                    ? 'Observed Actual'
                    : 'Predicted Forecast'}
                </span>
              </div>
            </div>

            <div className="bg-[#F3F5F1]/70 border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] font-mono uppercase text-slate-500">
                {chartMode === 'cumulative'
                  ? 'Cumulative Spend vs Baseline'
                  : 'Daily Spend vs Baseline'}
              </div>
              <div className="text-sm font-semibold text-[#0E2238] font-mono mt-0.5 tabular-nums">
                $
                {(chartMode === 'cumulative'
                  ? (inspectedPoint.cumulativeActual ??
                      inspectedPoint.cumulativePredictedSpike ??
                      0)
                  : (inspectedPoint.dailyActual ??
                      inspectedPoint.dailyPredictedSpike ??
                      0)
                ).toLocaleString()}{' '}
                <span className="text-slate-500 font-normal">
                  vs $
                  {(chartMode === 'cumulative'
                    ? inspectedPoint.cumulativeBaseline
                    : inspectedPoint.dailyBaseline
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-[#F3F5F1]/70 border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] font-mono uppercase text-slate-500">
                Variance / Confidence Band
              </div>
              <div className="text-sm font-semibold text-[#0E2238] font-mono mt-0.5 tabular-nums">
                {inspectedPoint.isHistorical ? (
                  <span className="text-slate-700">
                    Metered Billing Lock (±0.0%)
                  </span>
                ) : (
                  <span className="text-amber-800">
                    $
                    {(chartMode === 'cumulative'
                      ? (inspectedPoint.cumulativeLowerBound ?? 0)
                      : (inspectedPoint.dailyLowerBound ?? 0)
                    ).toLocaleString()}{' '}
                    – $
                    {(chartMode === 'cumulative'
                      ? (inspectedPoint.cumulativeUpperBound ?? 0)
                      : (inspectedPoint.dailyUpperBound ?? 0)
                    ).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#F3F5F1]/70 border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] font-mono uppercase text-slate-500">
                Telemetry Driver / Status
              </div>
              <div
                className="text-xs font-medium text-[#0E2238] mt-0.5 truncate"
                title={
                  inspectedPoint.spikeAnnotation ||
                  'Steady-state multi-cloud workload consumption'
                }
              >
                <Activity className="w-3.5 h-3.5 inline-block mr-1 text-[#2BB5A0]" />
                {inspectedPoint.spikeAnnotation ||
                  'Steady-state workload consumption'}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Anomaly Alerts Feed & Resource Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Active Anomaly Alerts */}
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span className="rm-kicker">03 / FinOps Anomaly Queue</span>
              <h3 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#D79A45]" />
                Active Anomaly Detections &amp; Cost Leaks
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {alerts.length} active issues
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-600 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
              Zero cost anomalies detected. All resources operating within
              baseline parameters.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                          alert.severity === 'high'
                            ? 'text-red-800'
                            : alert.severity === 'medium'
                            ? 'text-amber-800'
                            : 'text-slate-600'
                        }`}
                      >
                        [{alert.severity}]
                      </span>
                      <h4 className="text-sm font-semibold text-[#0E2238] font-sans">
                        {alert.title}
                      </h4>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="font-mono text-red-700 font-bold text-xs tabular-nums">
                        +${alert.impactAmount.toFixed(2)}/mo
                      </span>
                      <button
                        type="button"
                        onClick={() => dismissAlert(alert.id)}
                        className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>{alert.service}</span>
                    <span>·</span>
                    <span>{alert.region}</span>
                    <span>·</span>
                    <span>{alert.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right 1 col: Live Resource Breakdown */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <span className="rm-kicker">04 / Allocation Breakdown</span>
            <h3 className="text-base font-semibold text-[#0E2238] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#3E6E86]" />
              Spend by Infrastructure Category
            </h3>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <CategoryShareBar
              label="Compute Instances"
              percentage={52}
              color="bg-[#0E2238]"
            />
            <CategoryShareBar
              label="Managed Relational DB"
              percentage={22}
              color="bg-[#3E6E86]"
            />
            <CategoryShareBar
              label="Block & Object Storage"
              percentage={14}
              color="bg-[#2BB5A0]"
            />
            <CategoryShareBar
              label="Data Egress & CDN"
              percentage={8}
              color="bg-[#D79A45]"
            />
            <CategoryShareBar
              label="Kubernetes & Clusters"
              percentage={4}
              color="bg-[#5E9C97]"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-[#0E2238]">
              Live Regional Burn:
            </div>
            <div className="flex justify-between font-mono tabular-nums">
              <span>US East (N. Virginia):</span>
              <span className="text-slate-900 font-semibold">64%</span>
            </div>
            <div className="flex justify-between font-mono tabular-nums">
              <span>Europe West (Frankfurt):</span>
              <span className="text-slate-900 font-semibold">22%</span>
            </div>
            <div className="flex justify-between font-mono tabular-nums">
              <span>Asia Pacific (Singapore):</span>
              <span className="text-slate-900 font-semibold">14%</span>
            </div>
          </div>
        </section>
      </div>

      {/* Ephemeral Real-Time Telemetry Connection Modal (Zero Storage Persistence) */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F3F5F1]">
              <div className="flex items-center gap-3">
                <span
                  className="rm-mono-mark !w-8 !h-8 !text-xs"
                  aria-hidden="true"
                >
                  RM
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[#0E2238]">
                    Ephemeral Real-Time Telemetry Connection
                  </h3>
                  <p className="text-xs text-slate-600">
                    Stream live billing &amp; consumption events from AWS, Azure, GCP, or custom WebSocket endpoints.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormEphemeralToken('');
                  setIsConnectModalOpen(false);
                }}
                className="p-1 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleConnectRealtimeStream}
              autoComplete="off"
              className="p-6 space-y-4"
            >
              {/* Zero-Persistence Security Notice */}
              <div className="p-3 rounded-lg bg-teal-50/80 border border-teal-300 text-xs text-teal-950 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">
                    Strict Zero-Persistence Policy:
                  </strong>{' '}
                  Connection endpoints and session tokens are never stored in browser storage (`localStorage` / `sessionStorage`), cookies, or databases. Values exist strictly in volatile memory for the active stream and are purged immediately upon disconnect or tab close.
                </div>
              </div>

              {/* Stream Source Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Telemetry Stream Source
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'aws', label: 'AWS Stream' },
                      { id: 'azure', label: 'Azure Hub' },
                      { id: 'gcp', label: 'GCP Billing' },
                      { id: 'custom-ws', label: 'Custom WSS' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectStreamProvider(item.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        selectedStreamProvider === item.id
                          ? 'bg-[#0E2238] text-white border-[#0E2238]'
                          : 'bg-[#F3F5F1] text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Endpoint URI */}
              <div>
                <label
                  htmlFor="ephemeral-endpoint-input"
                  className="text-xs font-semibold text-slate-700 block mb-1"
                >
                  WebSocket / Event Stream Endpoint URI
                </label>
                <input
                  id="ephemeral-endpoint-input"
                  type="text"
                  autoComplete="off"
                  value={formEndpoint}
                  onChange={(e) => setFormEndpoint(e.target.value)}
                  placeholder="wss://..."
                  className="w-full bg-[#F3F5F1] border border-slate-300 text-xs font-mono text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0E2238]"
                />
              </div>

              {/* Ephemeral Session Token */}
              <div>
                <label
                  htmlFor="ephemeral-token-input"
                  className="text-xs font-semibold text-slate-700 block mb-1"
                >
                  Ephemeral Read-Only Session Token (Optional for Sandbox Stream)
                </label>
                <input
                  id="ephemeral-token-input"
                  type="password"
                  autoComplete="new-password"
                  value={formEphemeralToken}
                  onChange={(e) => setFormEphemeralToken(e.target.value)}
                  placeholder="Transient STS / Bearer token (never persisted)..."
                  className="w-full bg-[#F3F5F1] border border-slate-300 text-xs font-mono text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0E2238]"
                />
              </div>

              {/* Telemetry Cadence */}
              <div>
                <label
                  htmlFor="stream-cadence-select"
                  className="text-xs font-semibold text-slate-700 block mb-1"
                >
                  Stream Tick Cadence
                </label>
                <select
                  id="stream-cadence-select"
                  value={formCadenceMs}
                  onChange={(e) =>
                    setFormCadenceMs(Number(e.target.value) as StreamCadenceMs)
                  }
                  className="w-full bg-[#F3F5F1] border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0E2238]"
                >
                  <option value={1000}>1.0s Sub-Second High-Frequency Stream</option>
                  <option value={3000}>3.0s Near-Real-Time Micro-Batch</option>
                  <option value={5000}>5.0s Standard FinOps Polling Interval</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                {realtimeConn.isConnected && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDisconnectRealtimeStream();
                      setIsConnectModalOpen(false);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer mr-auto"
                  >
                    Disconnect &amp; Purge Session
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFormEphemeralToken('');
                    setIsConnectModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnectingStream}
                  className="xh-btn primary disabled:opacity-50"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>
                    {isConnectingStream
                      ? 'Establishing Handshake...'
                      : 'Establish Ephemeral Stream'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryShareBar: React.FC<{
  label: string;
  percentage: number;
  color: string;
}> = ({ label, percentage, color }) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-slate-700 font-medium">
        <span>{label}</span>
        <span className="font-mono text-slate-600 tabular-nums">
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
