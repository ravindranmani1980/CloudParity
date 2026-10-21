import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { WorkloadConfig, ProviderComparisonResult } from '../types/cloud';
import { generateForecastProjections } from '../utils/calculator';

interface PricingForecastsProps {
  config: WorkloadConfig;
  results: ProviderComparisonResult[];
}

export const PricingForecasts: React.FC<PricingForecastsProps> = ({
  config,
  results,
}) => {
  const [growthRate, setGrowthRate] = useState<number>(20);
  const [forecastMonths, setForecastMonths] = useState<number>(12);

  const projections = useMemo(() => {
    return generateForecastProjections(config, growthRate, forecastMonths);
  }, [config, growthRate, forecastMonths]);

  // Compute cumulative forecast totals
  const totalAws = useMemo(() => projections.reduce((acc, p) => acc + p.awsCost, 0), [projections]);
  const totalAzure = useMemo(() => projections.reduce((acc, p) => acc + p.azureCost, 0), [projections]);
  const totalGcp = useMemo(() => projections.reduce((acc, p) => acc + p.gcpCost, 0), [projections]);

  const minTotal = Math.min(totalAws, totalAzure, totalGcp);
  const maxTotal = Math.max(totalAws, totalAzure, totalGcp);
  const cumulativeSavings = maxTotal - minTotal;

  // Maximum monthly spend for bar chart scaling
  const maxMonthlyVal = Math.max(
    ...projections.flatMap((p) => [p.awsCost, p.azureCost, p.gcpCost])
  );

  return (
    <div className="space-y-8">
      {/* Header section with unboxed metadata */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Financial Modeling & Runway Projections</span>
            <span aria-hidden="true">·</span>
            <span>Organic Growth Sizing</span>
            <span aria-hidden="true">·</span>
            <span>Commitment Amortization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Pricing Forecasts & Multi-Year Projections
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-3xl">
            Simulate your infrastructure budget across 12, 24, and 36 months factoring in organic workload expansion, compounding growth, and multi-cloud cost divergence.
          </p>
        </div>

        {/* Forecast horizon segmented buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {[12, 24, 36].map((m) => (
            <button
              key={m}
              onClick={() => setForecastMonths(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap ${
                forecastMonths === m
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {m} Months
            </button>
          ))}
        </div>
      </div>

      {/* Growth Slider & Cumulative Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Growth Rate Control */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Annual Growth Assumption</span>
          </div>
          <p className="text-xs text-slate-400">
            Projected annual increase in user requests, database records, and compute nodes.
          </p>
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">YoY Traffic Growth:</span>
              <span className="font-mono font-bold text-cyan-400">+{growthRate}% / yr</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
              aria-label="Annual Workload Growth Rate"
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% Flat</span>
              <span>30% Moderate</span>
              <span>60% Hyper</span>
            </div>
          </div>
        </div>

        {/* AWS Cumulative */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            AWS Total ({forecastMonths} Mo)
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            ${totalAws.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">
            End-of-period run-rate: <span className="font-mono text-slate-300 font-semibold">${projections[projections.length - 1]?.awsCost.toLocaleString()}/mo</span>
          </p>
        </div>

        {/* Azure Cumulative */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            Azure Total ({forecastMonths} Mo)
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            ${totalAzure.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">
            End-of-period run-rate: <span className="font-mono text-slate-300 font-semibold">${projections[projections.length - 1]?.azureCost.toLocaleString()}/mo</span>
          </p>
        </div>

        {/* GCP Cumulative */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            GCP Total ({forecastMonths} Mo)
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            ${totalGcp.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">
            End-of-period run-rate: <span className="font-mono text-slate-300 font-semibold">${projections[projections.length - 1]?.gcpCost.toLocaleString()}/mo</span>
          </p>
        </div>
      </div>

      {/* Visual Timeline Bar Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Monthly Spend Trajectory Over Time
            </h3>
            <p className="text-xs text-slate-400">
              Side-by-side monthly spending as capacity automatically compounds at +{growthRate}% annual rate.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> AWS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> Azure
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> GCP
            </span>
          </div>
        </div>

        {/* Visual Bar Columns */}
        <div className="h-64 flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-slate-800 overflow-x-auto">
          {projections.map((p) => {
            const hAws = Math.max(8, Math.round((p.awsCost / maxMonthlyVal) * 100));
            const hAzure = Math.max(8, Math.round((p.azureCost / maxMonthlyVal) * 100));
            const hGcp = Math.max(8, Math.round((p.gcpCost / maxMonthlyVal) * 100));

            return (
              <div
                key={p.month}
                className="flex-1 min-w-[28px] max-w-[56px] flex flex-col items-center gap-1 h-full justify-end group"
              >
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                  <div
                    className="w-1/3 bg-amber-500/80 hover:bg-amber-400 rounded-t-sm transition-all"
                    style={{ height: `${hAws}%` }}
                    title={`AWS ${p.label}: $${p.awsCost.toLocaleString()}`}
                  />
                  <div
                    className="w-1/3 bg-sky-500/80 hover:bg-sky-400 rounded-t-sm transition-all"
                    style={{ height: `${hAzure}%` }}
                    title={`Azure ${p.label}: $${p.azureCost.toLocaleString()}`}
                  />
                  <div
                    className="w-1/3 bg-blue-500/80 hover:bg-blue-400 rounded-t-sm transition-all"
                    style={{ height: `${hGcp}%` }}
                    title={`GCP ${p.label}: $${p.gcpCost.toLocaleString()}`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-tighter truncate w-full text-center">
                  {p.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between">
          <span>Month 1 Baseline</span>
          <span className="text-emerald-400 font-medium">
            Cumulative hyperscaler spread: ${cumulativeSavings.toLocaleString()} over {forecastMonths} months
          </span>
          <span>Month {forecastMonths} Horizon</span>
        </div>
      </div>

      {/* Commitment Break-Even Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Commitment Model Break-Even Analysis
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Understanding the ROI threshold: at which month does committing to a 1-Year or 3-Year term save more money than remaining on On-Demand flexibility?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200 text-sm">On-Demand Baseline</div>
            <p className="text-slate-400">
              100% full elasticity. Zero termination penalties or financial lock-in. Ideal for seasonal experimental spikes or workloads with &lt; 6 months lifespan.
            </p>
            <div className="font-mono text-slate-300 pt-2 border-t border-slate-800">
              Break-Even: Month 0 (Pure pay-as-you-go)
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="font-bold text-cyan-400 text-sm">1-Year Savings Plan / CUD</div>
            <p className="text-slate-400">
              Averages ~35–38% discount. If your workload runs for at least <strong>7.5 months</strong>, committing to 1 year is strictly cheaper than running on-demand for the same period.
            </p>
            <div className="font-mono text-emerald-400 pt-2 border-t border-slate-800 font-semibold">
              Break-Even Threshold: Month 7.8
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-400 text-sm">3-Year Reserved / CUD</div>
            <p className="text-slate-400">
              Averages ~58–60% discount. If your core baseline infrastructure runs for at least <strong>14.2 months</strong>, committing to 3 years yields net-positive financial returns.
            </p>
            <div className="font-mono text-emerald-400 pt-2 border-t border-slate-800 font-semibold">
              Break-Even Threshold: Month 14.2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
