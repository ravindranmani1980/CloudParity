import React, { useState } from 'react';
import {
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  HardDrive,
  Globe,
  Layers,
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
}) => {
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
  
  const secondCheapest = [...results]
    .sort((a, b) => a.costs.totalMonthly - b.costs.totalMonthly)
    .find((r) => r.provider.id !== currentProviderId);

  const monthlySavings = Math.max(0, currentResult.costs.totalMonthly - cheapestResult.costs.totalMonthly);
  const annualSavings = monthlySavings * 12;
  const savingsPct = currentResult.costs.totalMonthly > 0
    ? Math.round((monthlySavings / currentResult.costs.totalMonthly) * 100)
    : 0;

  const paybackMonths = monthlySavings > 0
    ? (estimatedMigrationCost / monthlySavings).toFixed(1)
    : '0.0';
  
  const threeYearNetSavings = annualSavings * 3 - estimatedMigrationCost;

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
    <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      {/* Header and Current Provider Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="rm-kicker">02 / FinOps Migration &amp; Arbitrage Engine</span>
          <h2 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-[#2BB5A0]" />
            Potential Savings Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare your incumbent cloud provider against the most cost-effective alternative identified for this workload.
          </p>
        </div>

        {/* Current Provider Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
            My Current Provider:
          </span>
          <div className="flex items-center gap-1 p-1 bg-[#F3F5F1] border border-slate-300 rounded-lg">
            {(['aws', 'azure', 'gcp'] as CloudProviderId[]).map((pid) => {
              const p = CLOUD_PROVIDERS[pid];
              const isSelected = currentProviderId === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setCurrentProviderId(pid)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#0E2238] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
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
        <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>Optimal Provider Validated: You are already on the most cost-effective cloud!</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Your current deployment on <strong>{currentResult.provider.fullName}</strong> costs <strong className="font-mono">${currentResult.costs.totalMonthly.toLocaleString()}/mo</strong>, which is currently the lowest-priced option for your configured workload.
            {secondCheapest && (
              <> Moving to {secondCheapest.provider.fullName} would increase your spend by <strong className="text-amber-800 font-mono">+${(secondCheapest.costs.totalMonthly - currentResult.costs.totalMonthly).toFixed(2)}/mo</strong>.</>
            )}
          </p>
          <div className="pt-2 text-xs text-slate-600 flex flex-wrap items-center gap-4 border-t border-emerald-200/70">
            <span>Current Monthly Spend: <strong className="text-slate-900 font-mono">${currentResult.costs.totalMonthly.toLocaleString()}</strong></span>
            <span>·</span>
            <span>Annual Run-Rate: <strong className="text-slate-900 font-mono">${currentResult.costs.totalAnnual.toLocaleString()}</strong></span>
            <span>·</span>
            <span className="text-emerald-800 font-medium">Zero platform arbitrage penalty</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Head-to-Head Comparison Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Left: Current Provider */}
            <div className="p-4 rounded-xl bg-[#F3F5F1] border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono font-medium uppercase tracking-wider text-[11px]">Current Baseline</span>
                <span className="font-mono text-slate-600">{currentResult.provider.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentResult.provider.brandColor }}
                />
                <h4 className="text-base font-bold text-[#0E2238]">
                  {currentResult.provider.fullName}
                </h4>
              </div>
              <div className="text-2xl font-bold text-[#0E2238] font-mono tabular-nums">
                ${currentResult.costs.totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span className="text-xs text-slate-500 font-sans font-normal"> /mo</span>
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                ${currentResult.costs.totalAnnual.toLocaleString()} /yr
              </div>
            </div>

            {/* Middle: Potential Savings Card */}
            <div className="p-4 rounded-xl bg-[#0D1C2D] border border-[#2BB5A0]/50 text-center space-y-1 relative shadow-sm">
              <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#5FD3BF]">
                Net Potential Savings
              </span>
              <div className="text-3xl font-bold text-[#5FD3BF] font-mono tabular-nums">
                -${monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span className="text-xs text-[#A9B7BF] font-sans font-normal"> /mo</span>
              </div>
              <div className="text-xs text-[#EEF3F1] font-mono font-medium">
                Save ${annualSavings.toLocaleString()} / year ({savingsPct}% cut)
              </div>
              <div className="pt-2 text-[11px] text-[#A9B7BF] flex items-center justify-center gap-1">
                <span>Migration Payback:</span>
                <span className="font-mono font-semibold text-[#EBC385]">~{paybackMonths} months</span>
              </div>
            </div>

            {/* Right: Recommended Cheapest Provider */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-300 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-800">
                <span className="font-mono font-semibold uppercase tracking-wider text-[11px]">Optimal Alternative</span>
                <span className="font-mono text-emerald-800 font-bold">{cheapestResult.provider.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cheapestResult.provider.brandColor }}
                />
                <h4 className="text-base font-bold text-[#0E2238]">
                  {cheapestResult.provider.fullName}
                </h4>
              </div>
              <div className="text-2xl font-bold text-emerald-800 font-mono tabular-nums">
                ${cheapestResult.costs.totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span className="text-xs text-slate-500 font-sans font-normal"> /mo</span>
              </div>
              <div className="text-xs text-slate-600 font-mono tabular-nums">
                ${cheapestResult.costs.totalAnnual.toLocaleString()} /yr
              </div>
            </div>
          </div>

          {/* Detailed Category-by-Category Savings Waterfall */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0E2238] uppercase tracking-wider text-[11px] font-mono">
                Savings Breakdown by Infrastructure Category ($/month)
              </span>
              <span className="text-slate-500 font-mono">
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
                    className="p-3.5 rounded-lg bg-[#F3F5F1]/60 border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#3E6E86] shrink-0" />
                        <span className="text-xs font-semibold text-[#0E2238]">{cat.category}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                        <span className="text-slate-600">
                          {currentResult.provider.name}: ${cat.current.toFixed(2)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-900 font-semibold">
                          {cheapestResult.provider.name}: ${cat.cheapest.toFixed(2)}
                        </span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            isSave
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isSave ? `Save $${cat.delta.toFixed(2)}/mo` : 'Price Parity'}
                        </span>
                      </div>
                    </div>

                    {/* Dual Horizontal Stacked Representation */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-12 text-slate-500 font-mono text-right">{currentResult.provider.name}</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-slate-500 transition-all duration-300"
                            style={{ width: `${currentWidth}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-12 text-emerald-800 font-mono font-bold text-right">{cheapestResult.provider.name}</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#2BB5A0] transition-all duration-300"
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
          <div className="p-4 rounded-xl bg-[#F3F5F1] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-1.5 font-semibold text-[#0E2238] text-sm">
                <Calculator className="w-4 h-4 text-[#3E6E86]" />
                <span>Migration Feasibility &amp; Payback Calculator</span>
              </div>
              <p className="text-slate-600 text-xs">
                Estimate how quickly switching providers recoups engineering labor and data migration transfer fees.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
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
                  className="bg-white border border-slate-300 text-xs text-[#0E2238] font-mono font-semibold rounded-lg px-2.5 py-1.5 w-28 focus:outline-none focus:border-[#0E2238]"
                />
              </div>

              <div className="border-l border-slate-300 pl-4 space-y-0.5">
                <div className="text-[11px] text-slate-500">Payback Timeline:</div>
                <div className="font-mono text-emerald-800 font-bold text-sm tabular-nums">
                  {paybackMonths} Months
                </div>
              </div>

              <div className="border-l border-slate-300 pl-4 space-y-0.5">
                <div className="text-[11px] text-slate-500">3-Year Net ROI:</div>
                <div className="font-mono text-emerald-800 font-bold text-sm tabular-nums">
                  +${Math.max(0, threeYearNetSavings).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
