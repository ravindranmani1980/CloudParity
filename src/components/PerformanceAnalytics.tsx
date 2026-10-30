import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
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
      {/* Signature Postrix XH-Panel Executive Banner */}
      <section className="xh-panel">
        <div className="xh-kicker">
          <span className="k">Hardware Benchmarks &amp; Architectural Telemetry</span>
          <span className="tag">SPEC · Geekbench 6 · FIO · iperf3 · p99 Tail Latency</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-[#C9D3D9]/12">
          <div className="flex items-center gap-3.5">
            <div className="rm-mono-mark !w-11 !h-11 !text-base" aria-hidden="true">
              RM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#EEF3F1] leading-snug m-0 font-sans">
                Performance &amp; Architectural Analytics
                <span className="block font-mono font-normal text-xs text-[#A9B7BF] mt-0.5">
                  Empirical hardware benchmarks comparing throughput, IOPS, memory bandwidth, and inter-zone latency across 16–32 vCPU topologies
                </span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`xh-btn !py-1.5 !px-3 !text-xs whitespace-nowrap ${
                  selectedCategory === c.id ? 'primary' : ''
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Architectural Profiles inside XH-Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-5">
          <div className="xh-metric">
            <div className="lbl">
              <span>01 · AWS Nitro Architecture</span>
              <span className="text-[#EBC385]">ASIC Offload</span>
            </div>
            <div className="num text-base font-sans font-semibold text-[#EEF3F1]">
              Zero-Jitter Virtualization
            </div>
            <p>
              Offloads storage &amp; security to dedicated Nitro cards. Max IOPS: 64k (io2) / 256k (io2 Block Express).
            </p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>02 · Azure Accelerated Net</span>
              <span className="text-[#5FD3BF]">FPGA SmartNIC</span>
            </div>
            <div className="num text-base font-sans font-semibold text-[#EEF3F1]">
              SR-IOV Direct Memory Access
            </div>
            <p>
              Exceptional disk I/O elasticity with Ultra Disk live dynamic throttling. Max IOPS: 80k–160k.
            </p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>03 · GCP Andromeda &amp; Jupiter</span>
              <span className="text-[#5FD3BF]">Global Fiber SDN</span>
            </div>
            <div className="num text-base font-sans font-semibold text-[#EEF3F1]">
              50–100 Gbps VM Bandwidth
            </div>
            <p>
              Private global fiber backbone with lowest intra-region ping (0.54ms p99) and Hyperdisk Extreme (100k+ IOPS).
            </p>
          </div>
        </div>
      </section>

      {/* Benchmarks Grid */}
      <section className="space-y-3">
        <div>
          <span className="rm-kicker">01 / Empirical Hardware Telemetry</span>
          <h2 className="text-xl font-semibold text-[#0E2238]">
            Side-by-Side Benchmark Results
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMetrics.map((metric, idx) => (
            <BenchmarkCard key={idx} metric={metric} />
          ))}
        </div>
      </section>

      {/* SLA & Availability Guarantee Comparison */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <span className="rm-kicker">02 / Contractual Availability Governance</span>
        <h3 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-[#3E6E86]" />
          Service Level Agreement (SLA) &amp; Financial Credit Framework
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Standard contractual downtime thresholds and financial credit escalations for multi-AZ architectures across hyperscalers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F3F5F1] border border-slate-200 space-y-2">
            <div className="font-bold text-[#0E2238] text-sm">AWS SLA Terms</div>
            <div className="text-slate-700">
              <span className="font-mono text-[#0E2238] font-bold">99.99%</span> monthly uptime
            </div>
            <ul className="text-slate-600 space-y-1">
              <li>· &lt; 99.99% to 99.0%: 10% credit</li>
              <li>· &lt; 99.0% to 95.0%: 25% credit</li>
              <li>· &lt; 95.0%: 100% full billing credit</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#F3F5F1] border border-slate-200 space-y-2">
            <div className="font-bold text-[#0E2238] text-sm">Azure SLA Terms</div>
            <div className="text-slate-700">
              <span className="font-mono text-[#0E2238] font-bold">99.99%</span> multi-zone VM uptime
            </div>
            <ul className="text-slate-600 space-y-1">
              <li>· &lt; 99.99% to 99.0%: 10% credit</li>
              <li>· &lt; 99.0% to 95.0%: 25% credit</li>
              <li>· &lt; 95.0%: 100% full billing credit</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#F3F5F1] border border-slate-200 space-y-2">
            <div className="font-bold text-[#0E2238] text-sm">GCP SLA Terms</div>
            <div className="text-slate-700">
              <span className="font-mono text-[#0E2238] font-bold">99.99%</span> multi-zone compute
            </div>
            <ul className="text-slate-600 space-y-1">
              <li>· &lt; 99.99% to 99.0%: 10% credit</li>
              <li>· &lt; 99.0% to 95.0%: 25% credit</li>
              <li>· &lt; 95.0%: 50% credit (100% on &lt; 90%)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

const BenchmarkCard: React.FC<{ metric: PerformanceMetric }> = ({ metric }) => {
  const isNumeric = typeof metric.awsValue === 'number';

  const awsNum = isNumeric ? (metric.awsValue as number) : 100;
  const azNum = isNumeric ? (metric.azureValue as number) : 100;
  const gcpNum = isNumeric ? (metric.gcpValue as number) : 100;

  const maxVal = Math.max(awsNum, azNum, gcpNum);

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
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rm-kicker !mb-0.5">{metric.category}</span>
          <h4 className="text-base font-semibold text-[#0E2238] font-sans">{metric.metric}</h4>
        </div>
        <span className="text-xs font-mono text-slate-600 px-2 py-0.5 rounded bg-[#F3F5F1] border border-slate-200">
          {metric.unit}
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">{metric.description}</p>

      {/* Visual Comparison Bars */}
      <div className="space-y-3 pt-1">
        {/* AWS Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-700 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF9900]" />
              AWS
            </span>
            <span className="font-mono text-slate-900 font-semibold tabular-nums">
              {metric.awsValue} {metric.unit}
              {winner === 'aws' && <span className="text-emerald-700 ml-1.5 font-sans text-[11px] font-bold">Leader</span>}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                winner === 'aws' ? 'bg-[#0E2238]' : 'bg-slate-400'
              }`}
              style={{ width: isNumeric ? getBarWidth(awsNum) : '90%' }}
            />
          </div>
        </div>

        {/* Azure Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-700 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0089D6]" />
              Azure
            </span>
            <span className="font-mono text-slate-900 font-semibold tabular-nums">
              {metric.azureValue} {metric.unit}
              {winner === 'azure' && <span className="text-emerald-700 ml-1.5 font-sans text-[11px] font-bold">Leader</span>}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                winner === 'azure' ? 'bg-[#0E2238]' : 'bg-slate-400'
              }`}
              style={{ width: isNumeric ? getBarWidth(azNum) : '90%' }}
            />
          </div>
        </div>

        {/* GCP Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-700 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
              GCP
            </span>
            <span className="font-mono text-slate-900 font-semibold tabular-nums">
              {metric.gcpValue} {metric.unit}
              {winner === 'gcp' && <span className="text-emerald-700 ml-1.5 font-sans text-[11px] font-bold">Leader</span>}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                winner === 'gcp' ? 'bg-[#2BB5A0]' : 'bg-slate-400'
              }`}
              style={{ width: isNumeric ? getBarWidth(gcpNum) : '90%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
