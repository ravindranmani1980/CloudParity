import React, { useState, useMemo } from 'react';
import {
  Globe,
  Activity,
  Check,
  Layers,
  Zap,
  ArrowUpDown,
} from 'lucide-react';
import {
  CloudRegionId,
  ProviderComparisonResult,
  WorkloadConfig,
} from '../types/cloud';
import { CLOUD_PROVIDERS, CLOUD_REGIONS, ALL_CLOUD_REGION_IDS } from '../data/cloudData';
import { getActiveRegions, getRegionalComparisonMatrix } from '../utils/calculator';

interface RegionalParityMatrixProps {
  config: WorkloadConfig;
  onChangeConfig: (newConfig: WorkloadConfig) => void;
  results: ProviderComparisonResult[];
}

export const RegionalParityMatrix: React.FC<RegionalParityMatrixProps> = ({
  config,
  onChangeConfig,
  results,
}) => {
  const [showAllGlobalRegions, setShowAllGlobalRegions] = useState<boolean>(true);
  const [costDisplayMode, setCostDisplayMode] = useState<'standalone' | 'allocated'>('standalone');

  const activeRegions = getActiveRegions(config);
  const regionalMatrix = useMemo(() => getRegionalComparisonMatrix(config), [config]);

  const displayedRows = showAllGlobalRegions
    ? regionalMatrix
    : regionalMatrix.filter((r) => r.isSelected);

  const toggleRegion = (regId: CloudRegionId) => {
    const isCurrentlySelected = activeRegions.includes(regId);
    let nextRegions: CloudRegionId[];

    if (isCurrentlySelected) {
      // Prevent deselecting the last remaining region
      if (activeRegions.length <= 1) return;
      nextRegions = activeRegions.filter((r) => r !== regId);
    } else {
      nextRegions = [...activeRegions, regId];
    }

    onChangeConfig({
      ...config,
      region: nextRegions[0],
      regions: nextRegions,
    });
  };

  const applyRegionPreset = (regions: CloudRegionId[]) => {
    onChangeConfig({
      ...config,
      region: regions[0],
      regions,
    });
  };

  const setMultiRegionMode = (mode: 'traffic-split' | 'active-active-replica') => {
    onChangeConfig({
      ...config,
      multiRegionMode: mode,
    });
  };

  const awsRes = results.find((r) => r.provider.id === 'aws');
  const azureRes = results.find((r) => r.provider.id === 'azure');
  const gcpRes = results.find((r) => r.provider.id === 'gcp');

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Section Header */}
      <div className="p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="rm-kicker">02 / Multi-Region Topology, Latency &amp; Tariff Differentials</span>
            <h2 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#3E6E86]" />
              Simultaneous Multi-Region Selection &amp; Cost/Latency Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select one or more global deployment regions simultaneously to evaluate regional tariff surcharges, inter-AZ p99 latency, client edge RTT, and cross-region replication overhead.
            </p>
          </div>

          {/* Topology Architecture Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[#F3F5F1] border border-slate-300 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setMultiRegionMode('traffic-split')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  (config.multiRegionMode || 'traffic-split') === 'traffic-split'
                    ? 'bg-[#0E2238] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Distributed Load Split (1/{activeRegions.length})
              </button>
              <button
                type="button"
                onClick={() => setMultiRegionMode('active-active-replica')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  config.multiRegionMode === 'active-active-replica'
                    ? 'bg-[#0E2238] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active-Active Full Replica ({activeRegions.length}×)
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Select Region Cards Grid */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[#0E2238]">
              Active Deployment Regions ({activeRegions.length} of {ALL_CLOUD_REGION_IDS.length} selected — click any region to toggle):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyRegionPreset(['us-east'])}
                className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#F3F5F1] hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer"
              >
                Single (US East)
              </button>
              <button
                type="button"
                onClick={() => applyRegionPreset(['us-east', 'eu-west'])}
                className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#F3F5F1] hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer"
              >
                US + EU Dual
              </button>
              <button
                type="button"
                onClick={() => applyRegionPreset(['us-east', 'eu-west', 'ap-southeast'])}
                className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#F3F5F1] hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer"
              >
                Global Triad (US + EU + AP)
              </button>
              <button
                type="button"
                onClick={() => applyRegionPreset(ALL_CLOUD_REGION_IDS)}
                className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#F3F5F1] hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer"
              >
                All 6 Regions
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            {ALL_CLOUD_REGION_IDS.map((regId) => {
              const reg = CLOUD_REGIONS[regId];
              const isSelected = activeRegions.includes(regId);
              const avgPremiumPct = Math.round(
                ((reg.priceMultipliers.aws + reg.priceMultipliers.azure + reg.priceMultipliers.gcp) / 3 - 1) * 100
              );
              const minEdgeRtt = Math.min(
                reg.clientEdgeRttMs.aws,
                reg.clientEdgeRttMs.azure,
                reg.clientEdgeRttMs.gcp
              );

              return (
                <button
                  key={regId}
                  type="button"
                  onClick={() => toggleRegion(regId)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#0E2238] border-[#0E2238] text-white shadow-xs'
                      : 'bg-[#F3F5F1]/60 border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-xs truncate">{reg.shortName}</span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 ${
                        isSelected
                          ? 'bg-[#2BB5A0] text-[#04211B]'
                          : 'bg-white border border-slate-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  </div>

                  <div className={`text-[11px] truncate ${isSelected ? 'text-[#A9B7BF]' : 'text-slate-500'}`}>
                    {reg.continent}
                  </div>

                  <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-[10px] font-mono tabular-nums">
                    <span className={isSelected ? 'text-[#5FD3BF]' : 'text-slate-600'}>
                      {avgPremiumPct === 0 ? 'Base 1.0×' : `+${avgPremiumPct}% rate`}
                    </span>
                    <span className={isSelected ? 'text-[#EBC385]' : 'text-slate-500'}>
                      {minEdgeRtt}ms RTT
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Blended Multi-Region Telemetry Bar */}
        <div className="p-3.5 rounded-xl bg-[#0D1C2D] text-[#EEF3F1] border border-[#3E6E86]/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#A9B7BF] block text-[11px]">Active Topology Footprint</span>
            <span className="font-mono font-semibold text-[#5FD3BF]">
              {activeRegions.map((r) => CLOUD_REGIONS[r].shortName).join(' + ')}
            </span>
          </div>

          <div>
            <span className="text-[#A9B7BF] block text-[11px]">Blended Tariff Multiplier (AWS / Az / GCP)</span>
            <span className="font-mono font-semibold text-white tabular-nums">
              {awsRes?.blendedRegionMultiplier.toFixed(2)}× / {azureRes?.blendedRegionMultiplier.toFixed(2)}× / {gcpRes?.blendedRegionMultiplier.toFixed(2)}×
            </span>
          </div>

          <div>
            <span className="text-[#A9B7BF] block text-[11px]">Weighted Edge RTT / Intra-AZ p99</span>
            <span className="font-mono font-semibold text-[#EBC385] tabular-nums">
              {gcpRes?.avgClientRttMs}ms Edge · {gcpRes?.avgIntraAzLatencyMs}ms Intra-AZ
            </span>
          </div>

          <div>
            <span className="text-[#A9B7BF] block text-[11px]">Cross-Region Replication Sync</span>
            <span className="font-mono font-semibold text-[#5FD3BF] tabular-nums">
              {activeRegions.length > 1
                ? `$${gcpRes?.costs.crossRegionReplication.toLocaleString()}/mo (${activeRegions.length - 1} peer link${activeRegions.length > 2 ? 's' : ''})`
                : '$0.00/mo (Single region)'}
            </span>
          </div>
        </div>
      </div>

      {/* Table Filter & View Controls */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#0E2238] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#2BB5A0]" />
            Regional Pricing &amp; Latency Comparison Ledger
          </span>
          <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showAllGlobalRegions}
              onChange={(e) => setShowAllGlobalRegions(e.target.checked)}
              className="rounded accent-[#0E2238]"
            />
            <span>Show all 6 global regions for reference</span>
          </label>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Cost Column Mode:</span>
          <button
            type="button"
            onClick={() => setCostDisplayMode('standalone')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
              costDisplayMode === 'standalone'
                ? 'bg-[#0E2238] text-white'
                : 'bg-white border border-slate-300 text-slate-600'
            }`}
          >
            100% Standalone Regional Cost
          </button>
          <button
            type="button"
            onClick={() => setCostDisplayMode('allocated')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
              costDisplayMode === 'allocated'
                ? 'bg-[#0E2238] text-white'
                : 'bg-white border border-slate-300 text-slate-600'
            }`}
          >
            Allocated Active Share
          </button>
        </div>
      </div>

      {/* Regional Cost & Latency Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Global Region &amp; Datacenter Zones</th>
              <th className="py-3.5 px-4 text-center">Status / Share</th>
              <th className="py-3.5 px-4 text-right">AWS Cost &amp; RTT</th>
              <th className="py-3.5 px-4 text-right">Azure Cost &amp; RTT</th>
              <th className="py-3.5 px-4 text-right">GCP Cost &amp; RTT</th>
              <th className="py-3.5 px-6 text-right">Regional Parity Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
            {displayedRows.map((row) => {
              const costs =
                costDisplayMode === 'standalone' ? row.standaloneCosts : row.allocatedCosts;

              return (
                <tr
                  key={row.region.id}
                  onClick={() => toggleRegion(row.region.id)}
                  className={`transition-colors cursor-pointer ${
                    row.isSelected ? 'bg-emerald-50/35 hover:bg-emerald-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3.5 px-6 font-sans">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          row.isSelected ? 'bg-[#2BB5A0]' : 'bg-slate-300'
                        }`}
                      />
                      <span className="font-semibold text-[#0E2238]">{row.region.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 pl-4">
                      AWS: {row.region.providerZones.aws.split(' ')[0]} · Az: {row.region.providerZones.azure.split(' (')[0]} · GCP: {row.region.providerZones.gcp.split(' ')[0]}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-sans">
                    {row.isSelected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0E2238] text-[#5FD3BF] font-mono text-[11px] font-semibold">
                        Active ({config.multiRegionMode === 'active-active-replica' ? '100%' : `${row.weightPct}%`})
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Benchmark Only</span>
                    )}
                  </td>

                  {/* AWS Column */}
                  <td className="py-3.5 px-4 text-right">
                    <div className={`font-semibold ${row.cheapestProvider === 'aws' ? 'text-emerald-700' : 'text-slate-900'}`}>
                      ${costs.aws.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
                      <span className="text-[10px] text-slate-500 ml-1">
                        ({row.pricePremiumPct.aws === 0 ? 'Base' : `+${row.pricePremiumPct.aws}%`})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {row.clientEdgeRttMs.aws}ms RTT · {row.intraAzLatencyMs.aws}ms AZ
                    </div>
                  </td>

                  {/* Azure Column */}
                  <td className="py-3.5 px-4 text-right">
                    <div className={`font-semibold ${row.cheapestProvider === 'azure' ? 'text-emerald-700' : 'text-slate-900'}`}>
                      ${costs.azure.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
                      <span className="text-[10px] text-slate-500 ml-1">
                        ({row.pricePremiumPct.azure === 0 ? 'Base' : `+${row.pricePremiumPct.azure}%`})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {row.clientEdgeRttMs.azure}ms RTT · {row.intraAzLatencyMs.azure}ms AZ
                    </div>
                  </td>

                  {/* GCP Column */}
                  <td className="py-3.5 px-4 text-right">
                    <div className={`font-semibold ${row.cheapestProvider === 'gcp' ? 'text-emerald-700' : 'text-slate-900'}`}>
                      ${costs.gcp.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
                      <span className="text-[10px] text-slate-500 ml-1">
                        ({row.pricePremiumPct.gcp === 0 ? 'Base' : `+${row.pricePremiumPct.gcp}%`})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {row.clientEdgeRttMs.gcp}ms RTT · {row.intraAzLatencyMs.gcp}ms AZ
                    </div>
                  </td>

                  {/* Verdict Column */}
                  <td className="py-3.5 px-6 text-right font-sans">
                    <div className="font-semibold text-[#0E2238]">
                      Cost: <span className="text-emerald-700">{CLOUD_PROVIDERS[row.cheapestProvider].name}</span>
                      {' · '}
                      Latency: <span className="text-[#3E6E86]">{CLOUD_PROVIDERS[row.fastestLatencyProvider].name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Spread: ${row.maxRegionalSpreadMonthly.toLocaleString()}/mo
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
