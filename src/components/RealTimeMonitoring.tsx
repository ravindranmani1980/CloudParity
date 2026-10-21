import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  CheckCircle,
  TrendingUp,
  ShieldAlert,
  Flame,
  PieChart,
} from 'lucide-react';
import { AnomalyAlert } from '../types/cloud';

interface RealTimeMonitoringProps {
  baseMonthlySpend: number;
}

export const RealTimeMonitoring: React.FC<RealTimeMonitoringProps> = ({
  baseMonthlySpend,
}) => {
  const [isLiveRunning, setIsLiveRunning] = useState<boolean>(true);
  const [budgetThreshold, setBudgetThreshold] = useState<number>(Math.round(baseMonthlySpend * 1.15));
  
  // Real-time simulated spend that increments live
  const initialMtd = Math.round(baseMonthlySpend * 0.68); // ~day 21 of month
  const [currentMtd, setCurrentMtd] = useState<number>(initialMtd);
  
  const hourlyBurn = Math.round((baseMonthlySpend / 730) * 100) / 100;
  const [burnRate, setBurnRate] = useState<number>(hourlyBurn);

  const [alerts, setAlerts] = useState<AnomalyAlert[]>([
    {
      id: 'alt-1',
      timestamp: '14 mins ago',
      provider: 'aws',
      severity: 'high',
      service: 'Amazon EC2 & NAT Gateway',
      region: 'us-east-1',
      title: 'Unusual NAT Gateway Egress Spike',
      description: 'Data outbound exceeded baseline 30-day p95 by 440% across 2 availability zones.',
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
      description: '4 SSD volumes (1,200 GB total) remain detached for > 14 days without active I/O.',
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
      description: 'Database instance averaging < 4% CPU utilization over the past 7 days.',
      impactAmount: 142.0,
    },
  ]);

  // Real-time spend ticker effect
  useEffect(() => {
    if (!isLiveRunning) return;

    const interval = setInterval(() => {
      // Simulate live sub-second micro burn increment
      // Hourly burn divided by ~3600 seconds * tick rate
      const microIncrement = (burnRate / 3600) * 2.5;
      setCurrentMtd((prev) => prev + microIncrement);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveRunning, burnRate]);

  // Compute month-end projection
  const daysInMonth = 30.5;
  const currentDay = 21;
  const projectedMonthEnd = Math.round(currentMtd + burnRate * 24 * (daysInMonth - currentDay));
  const budgetUtilization = Math.min(100, Math.round((currentMtd / budgetThreshold) * 100));
  const isBudgetWarning = budgetUtilization >= 80;
  const isBudgetCritical = budgetUtilization >= 95;

  const triggerSpikeSimulation = () => {
    setBurnRate((prev) => Math.round((prev * 1.65) * 100) / 100);
    const newAlert: AnomalyAlert = {
      id: `alt-${Date.now()}`,
      timestamp: 'Just now',
      provider: 'aws',
      severity: 'high',
      service: 'Compute & Auto-Scaling',
      region: 'us-east-1',
      title: 'Synthetic Workload Surge Injected',
      description: 'Auto-scaling cluster scaled up 8 additional compute nodes due to sudden queue depth.',
      impactAmount: 240.0,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const resetSimulation = () => {
    setCurrentMtd(initialMtd);
    setBurnRate(hourlyBurn);
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header section with unboxed metadata */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Continuous Cost Intelligence</span>
            <span aria-hidden="true">·</span>
            <span>Sub-Second Telemetry Simulation</span>
            <span aria-hidden="true">·</span>
            <span>Real-Time Anomaly Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Real-Time Cost Monitoring & Burn Rate
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-3xl">
            Live telemetry stream tracking sub-second cloud consumption, active budget threshold health, and automated cost anomaly alarms.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLiveRunning(!isLiveRunning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              isLiveRunning
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/80'
                : 'bg-amber-950/80 text-amber-400 border border-amber-800/60 hover:bg-amber-900/80'
            }`}
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
            onClick={triggerSpikeSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Traffic Surge</span>
          </button>

          <button
            onClick={resetSimulation}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Reset telemetry counters"
            aria-label="Reset telemetry counters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Month to Date */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="text-xs text-slate-400">Month-to-Date Spend</div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
            ${currentMtd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>Day 21 of 30.5</span>
            <span className="text-cyan-400 font-mono">Live ticking</span>
          </div>
        </div>

        {/* Card 2: Projected Month-End */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="text-xs text-slate-400">Projected Month-End Spend</div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
            ${projectedMonthEnd.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>Run-rate velocity</span>
            <span className={projectedMonthEnd > budgetThreshold ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
              {projectedMonthEnd > budgetThreshold ? 'Exceeds budget' : 'Under budget'}
            </span>
          </div>
        </div>

        {/* Card 3: Hourly Burn Rate */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="text-xs text-slate-400">Current Burn Rate</div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
            ${burnRate.toFixed(2)}
            <span className="text-xs text-slate-400 font-sans font-normal">/hr</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>Daily: ${(burnRate * 24).toFixed(0)}/day</span>
            <span className="text-slate-400 font-mono">730 hrs/mo</span>
          </div>
        </div>

        {/* Card 4: Budget Threshold Health */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="text-xs text-slate-400 flex justify-between items-center">
            <span>Budget Utilization</span>
            <span className="font-mono text-slate-300 font-bold">{budgetUtilization}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isBudgetCritical
                  ? 'bg-rose-500'
                  : isBudgetWarning
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetUtilization}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 flex justify-between items-center pt-1">
            <span>Target: ${budgetThreshold.toLocaleString()}</span>
            <span className={isBudgetCritical ? 'text-rose-400 font-bold' : isBudgetWarning ? 'text-amber-400' : 'text-emerald-400'}>
              {isBudgetCritical ? 'Critical' : isBudgetWarning ? 'Warning' : 'Healthy'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Budget Threshold Adjuster */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Dynamic Monthly Budget Guardrail
            </h3>
            <p className="text-xs text-slate-400">
              Set automated alert notifications when projected run-rate exceeds your targeted threshold.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Threshold:</span>
            <input
              type="number"
              step={500}
              min={1000}
              max={500000}
              value={budgetThreshold}
              onChange={(e) => setBudgetThreshold(Math.max(1000, Number(e.target.value)))}
              aria-label="Monthly Budget Target in USD"
              className="bg-slate-950 border border-slate-700 text-sm text-cyan-400 font-mono font-bold rounded px-3 py-1.5 w-36"
            />
          </div>
        </div>
      </div>

      {/* Anomaly Alerts Feed & Resource Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Active Anomaly Alerts */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Active Anomaly Detections & Cost Leaks
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {alerts.length} active issues
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              Zero cost anomalies detected. All resources operating within baseline parameters.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-5 hover:bg-slate-800/30 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          alert.severity === 'high'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            : alert.severity === 'medium'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="font-mono text-rose-400 font-bold text-xs">
                        +${alert.impactAmount.toFixed(2)}/mo
                      </span>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>{alert.service}</span>
                    <span>&bull;</span>
                    <span>{alert.region}</span>
                    <span>&bull;</span>
                    <span>{alert.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 col: Live Resource Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Spend by Infrastructure Category
            </h3>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <CategoryShareBar label="Compute Instances" percentage={52} color="bg-cyan-500" />
            <CategoryShareBar label="Managed Relational DB" percentage={22} color="bg-blue-500" />
            <CategoryShareBar label="Block & Object Storage" percentage={14} color="bg-emerald-500" />
            <CategoryShareBar label="Data Egress & CDN" percentage={8} color="bg-amber-500" />
            <CategoryShareBar label="Kubernetes & Clusters" percentage={4} color="bg-purple-500" />
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300">Live Regional Burn:</div>
            <div className="flex justify-between font-mono">
              <span>US East (N. Virginia):</span>
              <span className="text-slate-200">64%</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Europe West (Frankfurt):</span>
              <span className="text-slate-200">22%</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Asia Pacific (Singapore):</span>
              <span className="text-slate-200">14%</span>
            </div>
          </div>
        </div>
      </div>
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
      <div className="flex justify-between text-slate-300 font-medium">
        <span>{label}</span>
        <span className="font-mono text-slate-400">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
