import React from 'react';
import {
  Cpu,
  HardDrive,
  Database,
  Globe,
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
import { WORKLOAD_PRESETS, CLOUD_REGIONS } from '../data/cloudData';
import { getActiveRegions } from '../utils/calculator';
import { PotentialSavingsVisual } from './PotentialSavingsVisual';
import { RegionalParityMatrix } from './RegionalParityMatrix';

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
  const awsRes = results.find((r) => r.provider.id === 'aws');
  const azureRes = results.find((r) => r.provider.id === 'azure');
  const gcpRes = results.find((r) => r.provider.id === 'gcp');

  const activeRegions = getActiveRegions(config);
  const activeRegionLabels = activeRegions
    .map((r) => CLOUD_REGIONS[r]?.shortName || r.toUpperCase())
    .join(' + ');

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
      {/* Signature Postrix XH-Panel Executive Overview */}
      <section className="xh-panel">
        <div className="xh-kicker">
          <span className="k">Enterprise Multi-Cloud TCO &amp; Architectural Parity Governance</span>
          <span className="tag">
            {activeRegions.length} Active Region{activeRegions.length > 1 ? 's' : ''} ({activeRegionLabels}) · 2026 Tariff Engine
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-[#C9D3D9]/12">
          <div className="flex items-center gap-3.5">
            <div className="rm-mono-mark !w-11 !h-11 !text-base" aria-hidden="true">
              RM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#EEF3F1] leading-snug m-0 font-sans">
                Cloud Workload Sizing &amp; Total Cost of Ownership Matrix
                <span className="block font-mono font-normal text-xs text-[#A9B7BF] mt-0.5">
                  Regions: {activeRegionLabels} · Mode: {(config.multiRegionMode || 'traffic-split') === 'active-active-replica' ? 'Active-Active Full Replica' : 'Distributed Split'} · Commitment: {config.commitment} · Leader: {lowest?.provider.fullName}
                </span>
              </h1>
            </div>
          </div>

          {/* Quick Presets Segmented Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            {WORKLOAD_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPreset(p.id)}
                className={`xh-btn !py-1.5 !px-3 !text-xs whitespace-nowrap ${
                  activePreset === p.id ? 'primary' : ''
                }`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onSelectPreset('custom')}
              className={`xh-btn !py-1.5 !px-3 !text-xs whitespace-nowrap ${
                activePreset === 'custom' ? 'primary' : ''
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* 4 XH-Metric Executive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          <div className="xh-metric">
            <div className="lbl">
              <span>01 · Cost Efficiency Leader</span>
              <span className="inline-flex items-center gap-1 text-[#5FD3BF]">
                <TrendingDown className="w-3.5 h-3.5" />
                -{lowest?.savingsPercentage}% spread
              </span>
            </div>
            <div className="num hi tabular-nums">
              {lowest?.provider.name}{' '}
              <span className="text-sm font-normal text-[#A9B7BF]">
                (${lowest?.costs.totalMonthly.toLocaleString()}/mo)
              </span>
            </div>
            <p>
              Saves ${(lowest ? lowest.savingsVsHighest * 12 : 0).toLocaleString()}/yr · {lowest?.avgClientRttMs}ms avg RTT
            </p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>02 · Amazon Web Services</span>
              <span className="text-[#EBC385] font-mono">{awsRes?.avgClientRttMs}ms RTT · {awsRes?.blendedRegionMultiplier.toFixed(2)}×</span>
            </div>
            <div className="num tabular-nums">
              ${awsRes?.costs.totalMonthly.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              <span className="text-xs font-normal text-[#A9B7BF] ml-1">/ mo</span>
            </div>
            <p className="font-mono text-xs">
              ${awsRes?.costs.totalAnnual.toLocaleString()}/yr · ${awsRes?.effectiveHourlyRate.toFixed(3)}/hr
            </p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>03 · Microsoft Azure</span>
              <span className="text-[#5FD3BF] font-mono">{azureRes?.avgClientRttMs}ms RTT · {azureRes?.blendedRegionMultiplier.toFixed(2)}×</span>
            </div>
            <div className="num tabular-nums">
              ${azureRes?.costs.totalMonthly.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              <span className="text-xs font-normal text-[#A9B7BF] ml-1">/ mo</span>
            </div>
            <p className="font-mono text-xs">
              ${azureRes?.costs.totalAnnual.toLocaleString()}/yr · ${azureRes?.effectiveHourlyRate.toFixed(3)}/hr
            </p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>04 · Google Cloud Platform</span>
              <span className="text-[#5FD3BF] font-mono">{gcpRes?.avgClientRttMs}ms RTT · {gcpRes?.blendedRegionMultiplier.toFixed(2)}×</span>
            </div>
            <div className="num tabular-nums">
              ${gcpRes?.costs.totalMonthly.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              <span className="text-xs font-normal text-[#A9B7BF] ml-1">/ mo</span>
            </div>
            <p className="font-mono text-xs">
              ${gcpRes?.costs.totalAnnual.toLocaleString()}/yr · ${gcpRes?.effectiveHourlyRate.toFixed(3)}/hr
            </p>
          </div>
        </div>
      </section>

      {/* Primary 3-Provider Architectural Parity Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="rm-kicker">01 / Hyperscaler Architecture Mapping</span>
            <h2 className="text-xl font-semibold text-[#0E2238]">
              Side-by-Side Provider SKU &amp; Multi-Region TCO Comparison
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {results.map((res) => {
            const isWinner = res.isLowestCost;
            const selectedRegBreakdowns = res.regionalBreakdown.filter((b) => b.isSelected);

            return (
              <div
                key={res.provider.id}
                className={`relative rounded-xl border p-6 transition-all bg-white ${
                  isWinner
                    ? 'border-[#2BB5A0] ring-2 ring-[#2BB5A0]/25 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isWinner && (
                  <div className="absolute -top-3 right-4 bg-[#0E2238] text-[#5FD3BF] border border-[#2BB5A0]/50 font-mono font-semibold text-[11px] tracking-wider uppercase px-2.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Optimal TCO Leader
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: res.provider.brandColor }}
                    />
                    <div>
                      <h3 className="text-base font-bold text-[#0E2238] font-sans tracking-tight">
                        {res.provider.fullName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedRegBreakdowns.length} Active Region{selectedRegBreakdowns.length > 1 ? 's' : ''} ({res.blendedRegionMultiplier.toFixed(2)}× avg rate)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      ${res.effectiveHourlyRate.toFixed(3)}/hr
                    </span>
                  </div>
                </div>

                {/* Monthly Cost Readout */}
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Projected Monthly Spend</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-bold text-[#0E2238] font-mono tabular-nums">
                      ${res.costs.totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-slate-500">/mo</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums flex items-center justify-between">
                    <span>${res.costs.totalAnnual.toLocaleString('en-US')} annual TCO</span>
                    <span className="text-[#3E6E86] font-semibold">
                      {res.avgClientRttMs}ms Edge · {res.avgIntraAzLatencyMs}ms AZ
                    </span>
                  </div>
                </div>

                {/* Savings Delta */}
                {isWinner ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 mb-4">
                    Saves approximately <strong className="font-semibold font-mono">${res.savingsVsHighest.toLocaleString()}/mo</strong> ({res.savingsPercentage}%) relative to the highest-cost provider.
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 mb-4 font-mono">
                    +${res.savingsVsHighest > 0 ? (res.costs.totalMonthly - (lowest?.costs.totalMonthly ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}/mo premium vs {lowest?.provider.name}
                  </div>
                )}

                {/* Active Regional Allocation Mini-Breakdown */}
                <div className="space-y-1.5 text-xs mb-4 pb-3 border-b border-slate-100">
                  <div className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] font-mono">
                    Active Regional Cost &amp; Latency Split
                  </div>
                  {selectedRegBreakdowns.map((rb) => (
                    <div key={rb.regionId} className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-slate-600 truncate max-w-[140px]" title={rb.providerZone}>
                        {rb.shortName} ({rb.pricePremiumPct === 0 ? 'Base' : `+${rb.pricePremiumPct}%`})
                      </span>
                      <span className="text-slate-900 font-semibold">
                        ${rb.allocatedMonthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo · {rb.clientEdgeRttMs}ms
                      </span>
                    </div>
                  ))}
                </div>

                {/* Matched Equivalent SKUs */}
                <div className="space-y-2 text-xs">
                  <div className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] font-mono">
                    Matched Equivalent SKUs
                  </div>
                  <div className="flex justify-between text-slate-700 gap-2">
                    <span className="text-slate-500 shrink-0">Compute:</span>
                    <span className="font-mono text-slate-900 text-right truncate" title={res.equivalentInstances.compute}>
                      {res.equivalentInstances.compute}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 gap-2">
                    <span className="text-slate-500 shrink-0">Database:</span>
                    <span className="font-mono text-slate-900 text-right truncate" title={res.equivalentInstances.database}>
                      {res.equivalentInstances.database}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 gap-2">
                    <span className="text-slate-500 shrink-0">Storage:</span>
                    <span className="font-mono text-slate-900 text-right truncate" title={res.equivalentInstances.storage}>
                      {res.equivalentInstances.storage}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Multi-Region Cost & Latency Comparison Matrix */}
      <RegionalParityMatrix
        config={config}
        onChangeConfig={onChangeConfig}
        results={results}
      />

      {/* Potential Savings Breakdown Visual */}
      <PotentialSavingsVisual results={results} config={config} />

      {/* Interactive Sizing Studio */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="rm-kicker">04 / Infrastructure Parameterization</span>
            <h2 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2">
              <Server className="w-5 h-5 text-[#3E6E86]" />
              Workload Configuration Parameters
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust compute, memory, database, and bandwidth parameters to recalculate multi-cloud and multi-region parity in real time.
            </p>
          </div>

          {/* Commitment Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D79A45]" />
              <select
                value={config.commitment}
                onChange={(e) => updateField('commitment', e.target.value as any)}
                aria-label="Commitment Term"
                className="bg-[#F3F5F1] border border-slate-300 text-xs text-slate-900 font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#0E2238]"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Group 1: Compute Sizing */}
          <div className="space-y-4 p-4 rounded-xl bg-[#F3F5F1]/70 border border-slate-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0E2238]">
              <Cpu className="w-4 h-4 text-[#3E6E86]" />
              <span>Compute &amp; Instances</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-700 mb-1">
                <span>vCPUs per Instance:</span>
                <span className="font-mono font-semibold text-[#0E2238] tabular-nums">{config.vCpu} vCPU</span>
              </div>
              <input
                type="range"
                min={2}
                max={128}
                step={2}
                value={config.vCpu}
                onChange={(e) => updateField('vCpu', Number(e.target.value))}
                aria-label="vCPUs per Instance"
                className="w-full accent-[#0E2238] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-700 mb-1">
                <span>RAM per Instance:</span>
                <span className="font-mono font-semibold text-[#0E2238] tabular-nums">{config.ramGb} GB</span>
              </div>
              <input
                type="range"
                min={4}
                max={512}
                step={4}
                value={config.ramGb}
                onChange={(e) => updateField('ramGb', Number(e.target.value))}
                aria-label="RAM per Instance"
                className="w-full accent-[#0E2238] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Instance Count</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={config.instanceCount}
                  onChange={(e) => updateField('instanceCount', Math.max(1, Number(e.target.value)))}
                  aria-label="Instance Count"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Operating System</label>
                <select
                  value={config.os}
                  onChange={(e) => updateField('os', e.target.value as any)}
                  aria-label="Operating System"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5"
                >
                  <option value="linux">Linux (Free OSS)</option>
                  <option value="windows">Windows Server</option>
                </select>
              </div>
            </div>
          </div>

          {/* Group 2: Storage Architecture */}
          <div className="space-y-4 p-4 rounded-xl bg-[#F3F5F1]/70 border border-slate-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0E2238]">
              <HardDrive className="w-4 h-4 text-[#3E6E86]" />
              <span>Storage Systems</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-700 mb-1">
                <span>Block Volume SSD:</span>
                <span className="font-mono font-semibold text-[#0E2238] tabular-nums">{config.blockStorageGb} GB</span>
              </div>
              <input
                type="range"
                min={50}
                max={10000}
                step={50}
                value={config.blockStorageGb}
                onChange={(e) => updateField('blockStorageGb', Number(e.target.value))}
                aria-label="Block Volume SSD Size"
                className="w-full accent-[#0E2238] cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 block mb-1">Block Performance Tier</label>
              <select
                value={config.blockStorageTier}
                onChange={(e) => updateField('blockStorageTier', e.target.value as any)}
                aria-label="Block Storage Performance Tier"
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5"
              >
                <option value="standard-ssd">Standard SSD (gp3 / pd-balanced ~3k IOPS)</option>
                <option value="provisioned-iops">Provisioned IOPS (io2 / Premium SSD v2)</option>
                <option value="extreme-iops">Extreme IOPS (io2 Express / Ultra Disk)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Object Store (TB)</label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={config.objectStorageTb}
                  onChange={(e) => updateField('objectStorageTb', Math.max(0, Number(e.target.value)))}
                  aria-label="Object Storage Size in TB"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5 font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Object Tier</label>
                <select
                  value={config.objectStorageTier}
                  onChange={(e) => updateField('objectStorageTier', e.target.value as any)}
                  aria-label="Object Storage Tier"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5"
                >
                  <option value="hot">Hot (Frequent)</option>
                  <option value="cool">Cool (Infrequent)</option>
                  <option value="archive">Archive (Glacier)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Group 3: Managed Database */}
          <div className="space-y-4 p-4 rounded-xl bg-[#F3F5F1]/70 border border-slate-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0E2238]">
              <Database className="w-4 h-4 text-[#3E6E86]" />
              <span>Managed Relational DB</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">DB Engine</label>
                <select
                  value={config.dbEngine}
                  onChange={(e) => updateField('dbEngine', e.target.value as any)}
                  aria-label="Database Engine"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5"
                >
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="serverless">Serverless Aurora / AlloyDB</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">DB Cores / RAM</label>
                <select
                  value={`${config.dbCpu}-${config.dbRamGb}`}
                  onChange={(e) => {
                    const [c, r] = e.target.value.split('-').map(Number);
                    onChangeConfig({ ...config, dbCpu: c, dbRamGb: r });
                  }}
                  aria-label="Database Cores and RAM"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5"
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
              <div className="flex justify-between text-xs text-slate-700 mb-1">
                <span>DB Storage:</span>
                <span className="font-mono font-semibold text-[#0E2238] tabular-nums">{config.dbStorageGb} GB</span>
              </div>
              <input
                type="range"
                min={20}
                max={5000}
                step={50}
                value={config.dbStorageGb}
                onChange={(e) => updateField('dbStorageGb', Number(e.target.value))}
                aria-label="Database Storage in GB"
                className="w-full accent-[#0E2238] cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={config.dbMultiAz}
                  onChange={(e) => updateField('dbMultiAz', e.target.checked)}
                  aria-label="High Availability Multi-AZ Standby"
                  className="w-4 h-4 rounded accent-[#0E2238]"
                />
                <span>High Availability Multi-AZ Standby (2× replication)</span>
              </label>
            </div>
          </div>

          {/* Group 4: Network Egress & Kubernetes */}
          <div className="space-y-4 p-4 rounded-xl bg-[#F3F5F1]/70 border border-slate-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0E2238]">
              <Globe className="w-4 h-4 text-[#3E6E86]" />
              <span>Network Egress &amp; K8s</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-700 mb-1">
                <span>Monthly Internet Egress:</span>
                <span className="font-mono font-semibold text-[#0E2238] tabular-nums">{config.egressTb} TB/mo</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={config.egressTb}
                onChange={(e) => updateField('egressTb', Number(e.target.value))}
                aria-label="Monthly Internet Egress in TB"
                className="w-full accent-[#0E2238] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">K8s Clusters</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={config.k8sClusterCount}
                  onChange={(e) => updateField('k8sClusterCount', Math.max(0, Number(e.target.value)))}
                  aria-label="Kubernetes Cluster Count"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Cluster Nodes</label>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={config.k8sNodeCount}
                  onChange={(e) => updateField('k8sNodeCount', Math.max(0, Number(e.target.value)))}
                  aria-label="Kubernetes Node Count"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5 font-mono tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Group 5: AI & GPU Accelerators */}
          <div className="space-y-4 p-4 rounded-xl bg-[#F3F5F1]/70 border border-slate-200 md:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0E2238]">
              <Sparkles className="w-4 h-4 text-[#D79A45]" />
              <span>AI Accelerators &amp; GPU Workloads</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600 block mb-1">GPU Accelerator Architecture</label>
                <select
                  value={config.gpuType}
                  onChange={(e) => updateField('gpuType', e.target.value as any)}
                  aria-label="GPU Accelerator Architecture"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5"
                >
                  <option value="none">None (Standard CPU only)</option>
                  <option value="t4">NVIDIA Tesla T4 (Inference entry)</option>
                  <option value="l4">NVIDIA L4 24GB (Modern LLM inference)</option>
                  <option value="a100">NVIDIA A100 80GB (Training &amp; High-res inference)</option>
                  <option value="h100">NVIDIA H100 80GB SXM5 (Cutting-edge frontier)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">GPU Unit Count</label>
                <input
                  type="number"
                  min={0}
                  max={64}
                  disabled={config.gpuType === 'none'}
                  value={config.gpuCount}
                  onChange={(e) => updateField('gpuCount', Math.max(0, Number(e.target.value)))}
                  aria-label="GPU Unit Count"
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5 font-mono tabular-nums disabled:opacity-40"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Itemized Detailed Comparison Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="rm-kicker">05 / Line-Item Tariff Ledger</span>
            <h2 className="text-lg font-semibold text-[#0E2238]">
              Itemized Cost Matrix (Monthly $ USD across {activeRegionLabels})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact category-by-category pricing comparison factoring in {activeRegions.length} active deployment region{activeRegions.length > 1 ? 's' : ''} and commitment discounts.
            </p>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#5E9C97]" />
            <span>Highlighted values indicate lowest cost per line item</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3.5 px-6">Service Category</th>
                <th className="py-3.5 px-6 text-right">AWS ($/mo)</th>
                <th className="py-3.5 px-6 text-right">Azure ($/mo)</th>
                <th className="py-3.5 px-6 text-right">GCP ($/mo)</th>
                <th className="py-3.5 px-6 text-right">Best Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
              {renderTableRow('Compute Instances', 'compute', results)}
              {renderTableRow('Block SSD Storage', 'blockStorage', results)}
              {renderTableRow('Object Storage', 'objectStorage', results)}
              {renderTableRow('Managed Database', 'database', results)}
              {renderTableRow('Internet Egress', 'networking', results)}
              {renderTableRow('Cross-Region Data Replication', 'crossRegionReplication', results)}
              {renderTableRow('Kubernetes Management', 'kubernetes', results)}
              {renderTableRow('GPU Accelerators', 'gpu', results)}
              {renderTableRow('Enterprise Support Tier', 'support', results)}
              
              {/* Total Monthly */}
              <tr className="bg-[#F3F5F1] font-bold text-[#0E2238] text-sm">
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
                <td className="py-3.5 px-6 text-right text-emerald-700 font-sans">
                  {lowest?.provider.name}
                </td>
              </tr>

              {/* Total Annual */}
              <tr className="bg-[#0E2238] text-[#EEF3F1] font-bold">
                <td className="py-3.5 px-6 font-sans">Annualized TCO Run-Rate</td>
                <td className="py-3.5 px-6 text-right">
                  ${results.find((r) => r.provider.id === 'aws')?.costs.totalAnnual.toLocaleString()}
                </td>
                <td className="py-3.5 px-6 text-right">
                  ${results.find((r) => r.provider.id === 'azure')?.costs.totalAnnual.toLocaleString()}
                </td>
                <td className="py-3.5 px-6 text-right">
                  ${results.find((r) => r.provider.id === 'gcp')?.costs.totalAnnual.toLocaleString()}
                </td>
                <td className="py-3.5 px-6 text-right text-[#5FD3BF] font-sans">
                  {lowest?.provider.name}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
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
    <tr key={key} className="hover:bg-slate-50/70 transition-colors">
      <td className="py-3 px-6 font-sans text-slate-900 font-medium">{label}</td>
      <td className={`py-3 px-6 text-right ${awsVal === minVal && awsVal > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
        ${awsVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className={`py-3 px-6 text-right ${azVal === minVal && azVal > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
        ${azVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className={`py-3 px-6 text-right ${gcpVal === minVal && gcpVal > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
        ${gcpVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="py-3 px-6 text-right font-sans text-xs font-semibold text-[#0E2238]">
        {bestName}
      </td>
    </tr>
  );
}
