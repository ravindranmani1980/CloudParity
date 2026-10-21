import React from 'react';
import {
  Cpu,
  HardDrive,
  Database,
  Globe,
  Layers,
  Sparkles,
  Server,
  Zap,
  TrendingDown,
  Info,
} from 'lucide-react';
import {
  WorkloadConfig,
  ProviderComparisonResult,
  WorkloadPresetId,
} from '../types/cloud';
import { WORKLOAD_PRESETS } from '../data/cloudData';
import { PotentialSavingsVisual } from './PotentialSavingsVisual';

interface WorkloadCalculatorProps {
  config: WorkloadConfig;
  onChangeConfig: (newConfig: WorkloadConfig) => void;
  results: ProviderComparisonResult[];
  activePreset: WorkloadPresetId;
  onSelectPreset: (presetId: WorkloadPresetId) => void;
}

export const WorkloadCalculator: React.FC<WorkloadCalculatorProps> = ({
  config,
  onChangeConfig,
  results,
  activePreset,
  onSelectPreset,
}) => {
  const lowest = results.find((r) => r.isLowestCost);

  const updateField = <K extends keyof WorkloadConfig>(
    key: K,
    val: WorkloadConfig[K]
  ) => {
    onChangeConfig({
      ...config,
      [key]: val,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header section with clean unboxed metadata */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Enterprise Multi-Cloud Comparison</span>
            <span aria-hidden="true">·</span>
            <span>AWS / Azure / GCP</span>
            <span aria-hidden="true">·</span>
            <span>2026 Live Tariff Model</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Cloud Workload Sizing & TCO Comparison
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-3xl">
            Configure your infrastructure requirements to dynamically benchmark pricing, instance equivalents, and total cost of ownership across major hyperscalers.
          </p>
        </div>

        {/* Quick Presets Segmented Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {WORKLOAD_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap ${
                activePreset === p.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
          <button
            onClick={() => onSelectPreset('custom')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap ${
              activePreset === 'custom'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Primary 3-Provider Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {results.map((res) => {
          const isWinner = res.isLowestCost;
          return (
            <div
              key={res.provider.id}
              className={`relative rounded-xl border p-5 transition-all ${
                isWinner
                  ? 'bg-slate-900/95 border-emerald-500/50 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isWinner && (
                <div className="absolute -top-3 right-4 bg-emerald-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded shadow-md flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Most Cost-Effective
                </div>
              )}

              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: res.provider.brandColor }}
                  />
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {res.provider.fullName}
                    </h3>
                    <p className="text-xs text-slate-400">{res.provider.name} Hyperscaler</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">
                    ${res.effectiveHourlyRate.toFixed(3)}/hr
                  </span>
                </div>
              </div>

              {/* Monthly Cost Readout */}
              <div className="mb-4">
                <div className="text-xs text-slate-400">Projected Monthly Spend</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                    ${res.costs.totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400">/mo</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  ${res.costs.totalAnnual.toLocaleString('en-US')} annual TCO
                </div>
              </div>

              {/* Savings Delta */}
              {isWinner ? (
                <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 mb-4">
                  Saves approximately <strong className="font-semibold">${res.savingsVsHighest.toLocaleString()}/mo</strong> ({res.savingsPercentage}%) relative to the highest-cost provider.
                </div>
              ) : (
                <div className="p-2.5 rounded bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 mb-4 font-mono">
                  +${res.savingsVsHighest > 0 ? (res.costs.totalMonthly - (lowest?.costs.totalMonthly ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}/mo vs {lowest?.provider.name}
                </div>
              )}

              {/* Matched Equivalent SKUs */}
              <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-3">
                <div className="text-slate-400 font-medium mb-1">Architecture Mapping:</div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Compute:</span>
                  <span className="font-mono text-slate-300 text-right truncate max-w-[190px]" title={res.equivalentInstances.compute}>
                    {res.equivalentInstances.compute}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Database:</span>
                  <span className="font-mono text-slate-300 text-right truncate max-w-[190px]" title={res.equivalentInstances.database}>
                    {res.equivalentInstances.database}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Storage:</span>
                  <span className="font-mono text-slate-300 text-right truncate max-w-[190px]" title={res.equivalentInstances.storage}>
                    {res.equivalentInstances.storage}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Potential Savings Breakdown Visual */}
      <PotentialSavingsVisual results={results} config={config} />

      {/* Interactive Sizing Studio */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              Workload Configuration Parameters
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust compute, memory, database, and bandwidth parameters to see cost updates in real time.
            </p>
          </div>

          {/* Region and Commitment Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <select
                value={config.region}
                onChange={(e) => updateField('region', e.target.value as any)}
                aria-label="Deployment Region"
                className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="us-east">US East (N. Virginia / Iowa)</option>
                <option value="us-west">US West (Oregon)</option>
                <option value="eu-west">Europe West (Frankfurt / Ireland)</option>
                <option value="ap-southeast">Asia Pacific (Singapore)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-400" />
              <select
                value={config.commitment}
                onChange={(e) => updateField('commitment', e.target.value as any)}
                aria-label="Commitment Term"
                className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="on-demand">On-Demand (No Commitment)</option>
                <option value="1yr-reserved">1-Year Savings Plan / Reserved (~35% off)</option>
                <option value="3yr-reserved">3-Year Savings Plan / Reserved (~60% off)</option>
                <option value="spot">Spot / Preemptible VMs (~72% off)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Group 1: Compute Sizing */}
          <div className="space-y-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Compute & Instances</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>vCPUs per Instance:</span>
                <span className="font-mono font-bold text-cyan-400">{config.vCpu} vCPU</span>
              </div>
              <input
                type="range"
                min={2}
                max={128}
                step={2}
                value={config.vCpu}
                onChange={(e) => updateField('vCpu', Number(e.target.value))}
                aria-label="vCPUs per Instance"
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>RAM per Instance:</span>
                <span className="font-mono font-bold text-cyan-400">{config.ramGb} GB</span>
              </div>
              <input
                type="range"
                min={4}
                max={512}
                step={4}
                value={config.ramGb}
                onChange={(e) => updateField('ramGb', Number(e.target.value))}
                aria-label="RAM per Instance"
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Instance Count</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={config.instanceCount}
                  onChange={(e) => updateField('instanceCount', Math.max(1, Number(e.target.value)))}
                  aria-label="Instance Count"
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Operating System</label>
                <select
                  value={config.os}
                  onChange={(e) => updateField('os', e.target.value as any)}
                  aria-label="Operating System"
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5"
                >
                  <option value="linux">Linux (Free OSS)</option>
                  <option value="windows">Windows Server</option>
                </select>
              </div>
            </div>
          </div>

          {/* Group 2: Storage Architecture */}
          <div className="space-y-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>Storage Systems</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Block Volume SSD:</span>
                <span className="font-mono font-bold text-cyan-400">{config.blockStorageGb} GB</span>
              </div>
              <input
                type="range"
                min={50}
                max={10000}
                step={50}
                value={config.blockStorageGb}
                onChange={(e) => updateField('blockStorageGb', Number(e.target.value))}
                aria-label="Block Volume SSD Size"
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Block Performance Tier</label>
              <select
                value={config.blockStorageTier}
                onChange={(e) => updateField('blockStorageTier', e.target.value as any)}
                aria-label="Block Storage Performance Tier"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5"
              >
                <option value="standard-ssd">Standard SSD (gp3 / pd-balanced ~3k IOPS)</option>
                <option value="provisioned-iops">Provisioned IOPS (io2 / Premium SSD v2)</option>
                <option value="extreme-iops">Extreme IOPS (io2 Express / Ultra Disk)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Object Store (TB)</label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={config.objectStorageTb}
                  onChange={(e) => updateField('objectStorageTb', Math.max(0, Number(e.target.value)))}
                  aria-label="Object Storage Size in TB"
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Object Tier</label>
                <select
                  value={config.objectStorageTier}
                  onChange={(e) => updateField('objectStorageTier', e.target.value as any)}
                  aria-label="Object Storage Tier"
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5"
                >
                  <option value="hot">Hot (Frequent)</option>
                  <option value="cool">Cool (Infrequent)</option>
                  <option value="archive">Archive (Glacier)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Group 3: Managed Database */}
          <div className="space-y-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Managed Relational DB</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">DB Engine</label>
                <select
                  value={config.dbEngine}
                  onChange={(e) => updateField('dbEngine', e.target.value as any)}
                  aria-label="Database Engine"
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5"
                >
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="serverless">Serverless Aurora / AlloyDB</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">DB Cores / RAM</label>
                <select
                  value={`${config.dbCpu}-${config.dbRamGb}`}
                  onChange={(e) => {
                    const [c, r] = e.target.value.split('-').map(Number);
                    onChangeConfig({ ...config, dbCpu: c, dbRamGb: r });
                  }}
                  aria-label="Database Cores and RAM"
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5"
                >
                  <option value="4-16">4 vCPU / 16 GB</option>
                  <option value="8-32">8 vCPU / 32 GB</option>
                  <option value="16-64">16 vCPU / 64 GB</option>
                  <option value="32-128">32 vCPU / 128 GB</option>
                  <option value="64-256">64 vCPU / 256 GB</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>DB Storage:</span>
                <span className="font-mono font-bold text-cyan-400">{config.dbStorageGb} GB</span>
              </div>
              <input
                type="range"
                min={20}
                max={5000}
                step={50}
                value={config.dbStorageGb}
                onChange={(e) => updateField('dbStorageGb', Number(e.target.value))}
                aria-label="Database Storage in GB"
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={config.dbMultiAz}
                  onChange={(e) => updateField('dbMultiAz', e.target.checked)}
                  aria-label="High Availability Multi-AZ Standby"
                  className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                />
                <span>High Availability Multi-AZ Standby (2x replication)</span>
              </label>
            </div>
          </div>

          {/* Group 4: Network Egress & Kubernetes */}
          <div className="space-y-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Network Egress & K8s</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Monthly Internet Egress:</span>
                <span className="font-mono font-bold text-cyan-400">{config.egressTb} TB/mo</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={config.egressTb}
                onChange={(e) => updateField('egressTb', Number(e.target.value))}
                aria-label="Monthly Internet Egress in TB"
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">K8s Clusters</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={config.k8sClusterCount}
                  onChange={(e) => updateField('k8sClusterCount', Math.max(0, Number(e.target.value)))}
                  aria-label="Kubernetes Cluster Count"
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Cluster Nodes</label>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={config.k8sNodeCount}
                  onChange={(e) => updateField('k8sNodeCount', Math.max(0, Number(e.target.value)))}
                  aria-label="Kubernetes Node Count"
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Group 5: AI & GPU Accelerators */}
          <div className="space-y-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 md:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Accelerators & GPU Workloads</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">GPU Accelerator Architecture</label>
                <select
                  value={config.gpuType}
                  onChange={(e) => updateField('gpuType', e.target.value as any)}
                  aria-label="GPU Accelerator Architecture"
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5"
                >
                  <option value="none">None (Standard CPU only)</option>
                  <option value="t4">NVIDIA Tesla T4 (Inference entry)</option>
                  <option value="l4">NVIDIA L4 24GB (Modern LLM inference)</option>
                  <option value="a100">NVIDIA A100 80GB (Training & High-res inference)</option>
                  <option value="h100">NVIDIA H100 80GB SXM5 (Cutting-edge frontier)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">GPU Unit Count</label>
                <input
                  type="number"
                  min={0}
                  max={64}
                  disabled={config.gpuType === 'none'}
                  value={config.gpuCount}
                  onChange={(e) => updateField('gpuCount', Math.max(0, Number(e.target.value)))}
                  aria-label="GPU Unit Count"
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 font-mono disabled:opacity-40"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Detailed Comparison Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Itemized Cost Matrix (Monthly $ USD)
            </h3>
            <p className="text-xs text-slate-400">
              Exact category-by-category pricing comparison for the selected region and commitment.
            </p>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Green indicates lowest cost category</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Service Category</th>
                <th className="py-3 px-6 text-right">AWS ($/mo)</th>
                <th className="py-3 px-6 text-right">Azure ($/mo)</th>
                <th className="py-3 px-6 text-right">GCP ($/mo)</th>
                <th className="py-3 px-6 text-right">Best Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {renderTableRow('Compute Instances', 'compute', results)}
              {renderTableRow('Block SSD Storage', 'blockStorage', results)}
              {renderTableRow('Object Storage', 'objectStorage', results)}
              {renderTableRow('Managed Database', 'database', results)}
              {renderTableRow('Internet Egress', 'networking', results)}
              {renderTableRow('Kubernetes Management', 'kubernetes', results)}
              {renderTableRow('GPU Accelerators', 'gpu', results)}
              {renderTableRow('Enterprise Support Tier', 'support', results)}
              
              {/* Total Monthly */}
              <tr className="bg-slate-950/90 font-bold text-slate-100 text-sm">
                <td className="py-3.5 px-6 font-sans">Total Monthly Spend</td>
                <td className="py-3.5 px-6 text-right">
                  ${results.find((r) => r.provider.id === 'aws')?.costs.totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-6 text-right">
                  ${results.find((r) => r.provider.id === 'azure')?.costs.totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-6 text-right">
                  ${results.find((r) => r.provider.id === 'gcp')?.costs.totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-6 text-right text-emerald-400 font-sans">
                  {lowest?.provider.name}
                </td>
              </tr>

              {/* Total Annual */}
              <tr className="bg-slate-950 text-slate-200 font-bold">
                <td className="py-3 px-6 font-sans">Annualized TCO Run-Rate</td>
                <td className="py-3 px-6 text-right">
                  ${results.find((r) => r.provider.id === 'aws')?.costs.totalAnnual.toLocaleString()}
                </td>
                <td className="py-3 px-6 text-right">
                  ${results.find((r) => r.provider.id === 'azure')?.costs.totalAnnual.toLocaleString()}
                </td>
                <td className="py-3 px-6 text-right">
                  ${results.find((r) => r.provider.id === 'gcp')?.costs.totalAnnual.toLocaleString()}
                </td>
                <td className="py-3 px-6 text-right text-emerald-400 font-sans">
                  {lowest?.provider.name}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function renderTableRow(
  label: string,
  key: keyof ProviderComparisonResult['costs'],
  results: ProviderComparisonResult[]
) {
  const awsVal = results.find((r) => r.provider.id === 'aws')?.costs[key] as number;
  const azVal = results.find((r) => r.provider.id === 'azure')?.costs[key] as number;
  const gcpVal = results.find((r) => r.provider.id === 'gcp')?.costs[key] as number;

  const minVal = Math.min(awsVal, azVal, gcpVal);
  let bestName = 'Tie';
  if (minVal === gcpVal && minVal !== awsVal && minVal !== azVal) bestName = 'GCP';
  else if (minVal === azVal && minVal !== awsVal && minVal !== gcpVal) bestName = 'Azure';
  else if (minVal === awsVal && minVal !== azVal && minVal !== gcpVal) bestName = 'AWS';

  return (
    <tr key={key} className="hover:bg-slate-800/30 transition-colors">
      <td className="py-2.5 px-6 font-sans text-slate-300 font-medium">{label}</td>
      <td className={`py-2.5 px-6 text-right ${awsVal === minVal && awsVal > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-300'}`}>
        ${awsVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className={`py-2.5 px-6 text-right ${azVal === minVal && azVal > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-300'}`}>
        ${azVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className={`py-2.5 px-6 text-right ${gcpVal === minVal && gcpVal > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-300'}`}>
        ${gcpVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="py-2.5 px-6 text-right font-sans text-xs font-semibold text-cyan-400">
        {bestName}
      </td>
    </tr>
  );
}
