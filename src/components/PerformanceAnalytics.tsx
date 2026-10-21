import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { PERFORMANCE_BENCHMARKS } from '../data/cloudData';
import { PerformanceMetric } from '../types/cloud';

export const PerformanceAnalytics: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Benchmarks' },
    { id: 'Compute & CPU', label: 'Compute & CPU' },
    { id: 'Storage & I/O', label: 'Storage & I/O' },
    { id: 'Networking', label: 'Networking' },
    { id: 'Reliability & SLA', label: 'Reliability & SLA' },
  ];

  const filteredMetrics =
    selectedCategory === 'all'
      ? PERFORMANCE_BENCHMARKS
      : PERFORMANCE_BENCHMARKS.filter((m) => m.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Header section with unboxed metadata */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Hardware Benchmarks & Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>SPEC / Geekbench / FIO / iperf3</span>
            <span aria-hidden="true">·</span>
            <span>p99 Latency & SLA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Performance & Architectural Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-3xl">
            Empirical hardware benchmarks comparing throughput, IOPS, memory bandwidth, and networking latency across comparable 16–32 vCPU instance topologies.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap ${
                selectedCategory === c.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Provider Architectural Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            AWS Nitro Architecture
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Offloads virtualization, storage, and networking to dedicated Nitro ASIC cards. Delivers virtually zero CPU jitter and rock-solid p99 tail latency under extreme concurrency.
          </p>
          <div className="text-xs text-slate-300 font-mono space-y-1 pt-2 border-t border-slate-800">
            <div>Best suited for: Ultra-stable tail latency & RDS scale</div>
            <div className="text-slate-500">Max IOPS: 64k (io2) / 256k (io2 Block Express)</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            Azure Accelerated Networking
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Utilizes FPGA SmartNICs for SR-IOV direct memory access. Exceptional disk I/O elasticity with Ultra Disk, allowing live dynamic throttling and burst IOPS adjustments.
          </p>
          <div className="text-xs text-slate-300 font-mono space-y-1 pt-2 border-t border-slate-800">
            <div>Best suited for: Microsoft stacks, SQL Server & Ultra Disk</div>
            <div className="text-slate-500">Max IOPS: 80k (Premium SSD v2) / 160k (Ultra)</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            GCP Andromeda & Jupiter SDN
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Global private fiber backbone with software-defined networking. Leads in raw network bandwidth per VM (up to 50–100 Gbps on standard compute) and lowest intra-region ping.
          </p>
          <div className="text-xs text-slate-300 font-mono space-y-1 pt-2 border-t border-slate-800">
            <div>Best suited for: High-throughput microservices & AI clusters</div>
            <div className="text-slate-500">Max IOPS: 100k+ (Hyperdisk Extreme)</div>
          </div>
        </div>
      </div>

      {/* Benchmarks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMetrics.map((metric, idx) => (
          <BenchmarkCard key={idx} metric={metric} />
        ))}
      </div>

      {/* SLA & Availability Guarantee Comparison */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          Service Level Agreement (SLA) & Financial Credit Framework
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Standard contractual downtime thresholds and financial credit escalations for multi-AZ architectures across hyperscalers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="font-bold text-amber-400 text-sm">AWS SLA Terms</div>
            <div className="text-slate-300">
              <span className="font-mono text-slate-100 font-bold">99.99%</span> monthly uptime
            </div>
            <ul className="text-slate-400 space-y-1">
              <li>&bull; &lt; 99.99% to 99.0%: 10% credit</li>
              <li>&bull; &lt; 99.0% to 95.0%: 25% credit</li>
              <li>&bull; &lt; 95.0%: 100% full billing credit</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="font-bold text-sky-400 text-sm">Azure SLA Terms</div>
            <div className="text-slate-300">
              <span className="font-mono text-slate-100 font-bold">99.99%</span> multi-zone VM uptime
            </div>
            <ul className="text-slate-400 space-y-1">
              <li>&bull; &lt; 99.99% to 99.0%: 10% credit</li>
              <li>&bull; &lt; 99.0% to 95.0%: 25% credit</li>
              <li>&bull; &lt; 95.0%: 100% full billing credit</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="font-bold text-blue-400 text-sm">GCP SLA Terms</div>
            <div className="text-slate-300">
              <span className="font-mono text-slate-100 font-bold">99.99%</span> multi-zone compute
            </div>
            <ul className="text-slate-400 space-y-1">
              <li>&bull; &lt; 99.99% to 99.0%: 10% credit</li>
              <li>&bull; &lt; 99.0% to 95.0%: 25% credit</li>
              <li>&bull; &lt; 95.0%: 50% credit (100% on &lt; 90%)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const BenchmarkCard: React.FC<{ metric: PerformanceMetric }> = ({ metric }) => {
  const isNumeric = typeof metric.awsValue === 'number';

  // Compute maximum for relative bar width
  const awsNum = isNumeric ? (metric.awsValue as number) : 100;
  const azNum = isNumeric ? (metric.azureValue as number) : 100;
  const gcpNum = isNumeric ? (metric.gcpValue as number) : 100;

  let maxVal = Math.max(awsNum, azNum, gcpNum);
  let minVal = Math.min(awsNum, azNum, gcpNum);

  // Determine winner
  let winner: 'aws' | 'azure' | 'gcp' | 'tie' = 'tie';
  if (isNumeric) {
    if (metric.higherIsBetter) {
      if (awsNum > azNum && awsNum > gcpNum) winner = 'aws';
      else if (azNum > awsNum && azNum > gcpNum) winner = 'azure';
      else if (gcpNum > awsNum && gcpNum > azNum) winner = 'gcp';
    } else {
      if (awsNum < azNum && awsNum < gcpNum) winner = 'aws';
      else if (azNum < awsNum && azNum < gcpNum) winner = 'azure';
      else if (gcpNum < awsNum && gcpNum < azNum) winner = 'gcp';
    }
  }

  const getBarWidth = (val: number) => {
    if (!isNumeric || maxVal === 0) return '80%';
    const pct = Math.max(15, Math.round((val / maxVal) * 100));
    return `${pct}%`;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 block mb-0.5">
            {metric.category}
          </span>
          <h4 className="text-sm font-bold text-white">{metric.metric}</h4>
        </div>
        <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
          {metric.unit}
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">{metric.description}</p>

      {/* Visual Comparison Bars */}
      <div className="space-y-2.5 pt-1">
        {/* AWS Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              AWS
            </span>
            <span className="font-mono text-slate-200 font-semibold">
              {metric.awsValue} {metric.unit}
              {winner === 'aws' && <span className="text-emerald-400 ml-1.5 font-sans text-[11px] font-bold">Leader</span>}
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                winner === 'aws' ? 'bg-amber-400' : 'bg-amber-500/50'
              }`}
              style={{ width: isNumeric ? getBarWidth(awsNum) : '90%' }}
            />
          </div>
        </div>

        {/* Azure Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Azure
            </span>
            <span className="font-mono text-slate-200 font-semibold">
              {metric.azureValue} {metric.unit}
              {winner === 'azure' && <span className="text-emerald-400 ml-1.5 font-sans text-[11px] font-bold">Leader</span>}
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                winner === 'azure' ? 'bg-sky-400' : 'bg-sky-500/50'
              }`}
              style={{ width: isNumeric ? getBarWidth(azNum) : '90%' }}
            />
          </div>
        </div>

        {/* GCP Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              GCP
            </span>
            <span className="font-mono text-slate-200 font-semibold">
              {metric.gcpValue} {metric.unit}
              {winner === 'gcp' && <span className="text-emerald-400 ml-1.5 font-sans text-[11px] font-bold">Leader</span>}
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                winner === 'gcp' ? 'bg-blue-400' : 'bg-blue-500/50'
              }`}
              style={{ width: isNumeric ? getBarWidth(gcpNum) : '90%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
