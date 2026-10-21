import React, { useState } from 'react';
import {
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Database,
  HardDrive,
  Globe,
  Layers,
  Sparkles,
  Calculator,
} from 'lucide-react';
import {
  CloudProviderId,
  ProviderComparisonResult,
  WorkloadConfig,
} from '../types/cloud';
import { CLOUD_PROVIDERS } from '../data/cloudData';

interface PotentialSavingsVisualProps {
  results: ProviderComparisonResult[];
  config: WorkloadConfig;
}

export const PotentialSavingsVisual: React.FC<PotentialSavingsVisualProps> = ({
  results,
  config,
}) => {
  // Allow user to select which provider they currently run on
  // Default to the highest cost provider or AWS as typical enterprise baseline
  const highestProvider = results.reduce((prev, curr) =>
    curr.costs.totalMonthly > prev.costs.totalMonthly ? curr : prev
  );
  
  const [currentProviderId, setCurrentProviderId] = useState<CloudProviderId>(
    highestProvider.provider.id !== 'aws' ? 'aws' : highestProvider.provider.id
  );

  const [estimatedMigrationCost, setEstimatedMigrationCost] = useState<number>(3000);

  const currentResult = results.find((r) => r.provider.id === currentProviderId)!;
  const cheapestResult = results.reduce((prev, curr) =>
    curr.costs.totalMonthly < prev.costs.totalMonthly ? curr : prev
  );

  const isAlreadyCheapest = currentProviderId === cheapestResult.provider.id;
  
  // Find second cheapest if current is already the cheapest
  const secondCheapest = [...results]
    .sort((a, b) => a.costs.totalMonthly - b.costs.totalMonthly)
    .find((r) => r.provider.id !== currentProviderId);

  const monthlySavings = Math.max(0, currentResult.costs.totalMonthly - cheapestResult.costs.totalMonthly);
  const annualSavings = monthlySavings * 12;
  const savingsPct = currentResult.costs.totalMonthly > 0
    ? Math.round((monthlySavings / currentResult.costs.totalMonthly) * 100)
    : 0;

  // Payback period in months
  const paybackMonths = monthlySavings > 0
    ? (estimatedMigrationCost / monthlySavings).toFixed(1)
    : '0.0';
  
  const threeYearNetSavings = annualSavings * 3 - estimatedMigrationCost;

  // Category delta savings
  const categoryDeltas = [
    {
      category: 'Compute & Instances',
      icon: Cpu,
      current: currentResult.costs.compute,
      cheapest: cheapestResult.costs.compute,
      delta: currentResult.costs.compute - cheapestResult.costs.compute,
    },
    {
      category: 'Managed Relational DB',
      icon: Database,
      current: currentResult.costs.database,
      cheapest: cheapestResult.costs.database,
      delta: currentResult.costs.database - cheapestResult.costs.database,
    },
    {
      category: 'Block & Object Storage',
      icon: HardDrive,
      current: currentResult.costs.blockStorage + currentResult.costs.objectStorage,
      cheapest: cheapestResult.costs.blockStorage + cheapestResult.costs.objectStorage,
      delta: (currentResult.costs.blockStorage + currentResult.costs.objectStorage) - (cheapestResult.costs.blockStorage + cheapestResult.costs.objectStorage),
    },
    {
      category: 'Network Data Egress',
      icon: Globe,
      current: currentResult.costs.networking,
      cheapest: cheapestResult.costs.networking,
      delta: currentResult.costs.networking - cheapestResult.costs.networking,
    },
    {
      category: 'Kubernetes & Support',
      icon: Layers,
      current: currentResult.costs.kubernetes + currentResult.costs.support,
      cheapest: cheapestResult.costs.kubernetes + cheapestResult.costs.support,
      delta: (currentResult.costs.kubernetes + currentResult.costs.support) - (cheapestResult.costs.kubernetes + cheapestResult.costs.support),
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6">
      {/* Header and Current Provider Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>FinOps Migration & Arbitrage Engine</span>
            <span aria-hidden="true">·</span>
            <span>Current vs Optimal Cloud Provider</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-emerald-400" />
            Potential Savings Breakdown
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare your incumbent cloud provider against the most cost-effective alternative identified for this workload.
          </p>
        </div>

        {/* Current Provider Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
            My Current Provider:
          </span>
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            {(['aws', 'azure', 'gcp'] as CloudProviderId[]).map((pid) => {
              const p = CLOUD_PROVIDERS[pid];
              const isSelected = currentProviderId === pid;
              return (
                <button
                  key={pid}
                  onClick={() => setCurrentProviderId(pid)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.brandColor }}
                  />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isAlreadyCheapest ? (
        /* Case: Current provider is already the cheapest */
        <div className="p-5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 space-y-3">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Optimal Provider Validated: You are already on the most cost-effective cloud!</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your current deployment on <strong>{currentResult.provider.fullName}</strong> costs <strong>${currentResult.costs.totalMonthly.toLocaleString()}/mo</strong>, which is currently the lowest-priced option for your configured workload.
            {secondCheapest && (
              <> Moving to {secondCheapest.provider.fullName} would increase your spend by <strong className="text-amber-300 font-mono">+${(secondCheapest.costs.totalMonthly - currentResult.costs.totalMonthly).toFixed(2)}/mo</strong>.</>
            )}
          </p>
          <div className="pt-2 text-xs text-slate-400 flex flex-wrap items-center gap-4 border-t border-emerald-900/40">
            <span>Current Monthly Spend: <strong className="text-white font-mono">${currentResult.costs.totalMonthly.toLocaleString()}</strong></span>
            <span>&bull;</span>
            <span>Annual Run-Rate: <strong className="text-white font-mono">${currentResult.costs.totalAnnual.toLocaleString()}</strong></span>
            <span>&bull;</span>
            <span className="text-emerald-400">Zero platform arbitrage penalty</span>
          </div>
        </div>
      ) : (
        /* Case: There are significant savings by moving to the cheapest alternative */
        <div className="space-y-6">
          {/* Head-to-Head Comparison Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Left: Current Provider */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Current Baseline</span>
                <span className="font-mono text-slate-400">{currentResult.provider.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentResult.provider.brandColor }}
                />
                <h4 className="text-base font-bold text-white tracking-tight">
                  {currentResult.provider.fullName}
                </h4>
              </div>
              <div className="text-2xl font-extrabold text-slate-200 font-mono tabular-nums">
                ${currentResult.costs.totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span className="text-xs text-slate-500 font-sans font-normal"> /mo</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                ${currentResult.costs.totalAnnual.toLocaleString()} /yr
              </div>
            </div>

            {/* Middle: Potential Savings Card */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-950/60 to-slate-950 border border-emerald-500/40 text-center space-y-1 relative shadow-lg shadow-emerald-950/30">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                Net Potential Savings
              </span>
              <div className="text-3xl font-extrabold text-emerald-300 font-mono tabular-nums">
                -${monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span className="text-xs text-emerald-400 font-sans font-normal"> /mo</span>
              </div>
              <div className="text-xs text-emerald-400 font-mono font-semibold">
                Save ${annualSavings.toLocaleString()} / year ({savingsPct}% cut)
              </div>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <span>Migration Payback:</span>
                <span className="font-mono font-bold text-white">~{paybackMonths} months</span>
              </div>
            </div>

            {/* Right: Recommended Cheapest Provider */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2 ring-1 ring-emerald-500/20">
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Optimal Alternative</span>
                <span className="font-mono text-emerald-400 font-bold">{cheapestResult.provider.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cheapestResult.provider.brandColor }}
                />
                <h4 className="text-base font-bold text-white tracking-tight">
                  {cheapestResult.provider.fullName}
                </h4>
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
                ${cheapestResult.costs.totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span className="text-xs text-slate-500 font-sans font-normal"> /mo</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                ${cheapestResult.costs.totalAnnual.toLocaleString()} /yr
              </div>
            </div>
          </div>

          {/* Detailed Category-by-Category Savings Waterfall */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white tracking-tight uppercase tracking-wider text-[11px]">
                Savings Breakdown by Infrastructure Category ($/month)
              </span>
              <span className="text-slate-400 font-mono">
                {currentResult.provider.name} vs {cheapestResult.provider.name}
              </span>
            </div>

            <div className="space-y-3">
              {categoryDeltas.map((cat, idx) => {
                const Icon = cat.icon;
                const isSave = cat.delta > 0;
                const maxBarCost = Math.max(cat.current, cat.cheapest, 1);
                const currentWidth = Math.max(12, Math.round((cat.current / maxBarCost) * 100));
                const cheapestWidth = Math.max(12, Math.round((cat.cheapest / maxBarCost) * 100));

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-200">{cat.category}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-slate-400">
                          {currentResult.provider.name}: ${cat.current.toFixed(2)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-200">
                          {cheapestResult.provider.name}: ${cat.cheapest.toFixed(2)}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            isSave
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isSave ? `Save $${cat.delta.toFixed(2)}/mo` : 'Price Parity'}
                        </span>
                      </div>
                    </div>

                    {/* Dual Horizontal Stacked Representation */}
                    <div className="space-y-1 pt-1">
                      {/* Current provider bar */}
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-12 text-slate-400 font-mono text-right">{currentResult.provider.name}</span>
                        <div className="flex-1 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-slate-500 transition-all duration-300"
                            style={{ width: `${currentWidth}%` }}
                          />
                        </div>
                      </div>
                      {/* Cheapest alternative bar */}
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-12 text-emerald-400 font-mono font-bold text-right">{cheapestResult.provider.name}</span>
                        <div className="flex-1 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${cheapestWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Migration Payback & ROI Estimator */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>Migration Feasibility & Payback Calculator</span>
              </div>
              <p className="text-slate-400 text-xs">
                Estimate how quickly switching providers recoups engineering labor and data migration transfer fees.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Est. 1-Time Migration Cost ($)
                </label>
                <input
                  type="number"
                  step={500}
                  min={0}
                  max={50000}
                  value={estimatedMigrationCost}
                  onChange={(e) => setEstimatedMigrationCost(Math.max(0, Number(e.target.value)))}
                  aria-label="Estimated 1-Time Migration Cost in USD"
                  className="bg-slate-900 border border-slate-700 text-xs text-cyan-400 font-mono font-bold rounded px-2.5 py-1.5 w-28 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="border-l border-slate-800 pl-4 space-y-0.5">
                <div className="text-[11px] text-slate-400">Payback Timeline:</div>
                <div className="font-mono text-emerald-400 font-bold text-sm">
                  {paybackMonths} Months
                </div>
              </div>

              <div className="border-l border-slate-800 pl-4 space-y-0.5">
                <div className="text-[11px] text-slate-400">3-Year Net ROI:</div>
                <div className="font-mono text-emerald-400 font-bold text-sm">
                  +${Math.max(0, threeYearNetSavings).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
