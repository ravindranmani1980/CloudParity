import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
} from 'lucide-react';
import { WorkloadConfig, ProviderComparisonResult } from '../types/cloud';
import { generateForecastProjections } from '../utils/calculator';

interface PricingForecastsProps {
  config: WorkloadConfig;
  results: ProviderComparisonResult[];
}

export const PricingForecasts: React.FC<PricingForecastsProps> = ({
  config,
}) => {
  const [growthRate, setGrowthRate] = useState<number>(20);
  const [forecastMonths, setForecastMonths] = useState<number>(12);

  const projections = useMemo(() => {
    return generateForecastProjections(config, growthRate, forecastMonths);
  }, [config, growthRate, forecastMonths]);

  const totalAws = useMemo(() => projections.reduce((acc, p) => acc + p.awsCost, 0), [projections]);
  const totalAzure = useMemo(() => projections.reduce((acc, p) => acc + p.azureCost, 0), [projections]);
  const totalGcp = useMemo(() => projections.reduce((acc, p) => acc + p.gcpCost, 0), [projections]);

  const minTotal = Math.min(totalAws, totalAzure, totalGcp);
  const maxTotal = Math.max(totalAws, totalAzure, totalGcp);
  const cumulativeSavings = maxTotal - minTotal;

  const maxMonthlyVal = Math.max(
    ...projections.flatMap((p) => [p.awsCost, p.azureCost, p.gcpCost])
  );

  return (
    <div className="space-y-8">
      {/* Signature Postrix XH-Panel Executive Banner */}
      <section className="xh-panel">
        <div className="xh-kicker">
          <span className="k">Financial Modeling &amp; Multi-Year Runway Projections</span>
          <span className="tag">Compounding Growth · Commitment Amortization · 12–36 Mo</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-[#C9D3D9]/12">
          <div className="flex items-center gap-3.5">
            <div className="rm-mono-mark !w-11 !h-11 !text-base" aria-hidden="true">
              RM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#EEF3F1] leading-snug m-0 font-sans">
                Pricing Forecasts &amp; Multi-Year Projections
                <span className="block font-mono font-normal text-xs text-[#A9B7BF] mt-0.5">
                  Horizon: {forecastMonths} Months · Annual Workload Growth: +{growthRate}% YoY · Cumulative Spread: ${cumulativeSavings.toLocaleString()}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[12, 24, 36].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForecastMonths(m)}
                className={`xh-btn !py-1.5 !px-3 !text-xs whitespace-nowrap ${
                  forecastMonths === m ? 'primary' : ''
                }`}
              >
                {m} Months
              </button>
            ))}
          </div>
        </div>

        {/* 4 XH-Metric Executive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          <div className="xh-metric">
            <div className="lbl">
              <span>01 · YoY Growth Slider</span>
              <span className="text-[#EBC385] font-mono">+{growthRate}% / yr</span>
            </div>
            <div className="pt-2">
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                aria-label="Annual Workload Growth Rate"
                className="w-full accent-[#5FD3BF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#A9B7BF] font-mono mt-1">
                <span>0% Flat</span>
                <span>30% Scale</span>
                <span>60% Hyper</span>
              </div>
            </div>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>02 · AWS Cumulative ({forecastMonths}m)</span>
              <span className="text-[#EBC385]">Total TCO</span>
            </div>
            <div className="num tabular-nums">
              ${totalAws.toLocaleString()}
            </div>
            <p className="font-mono text-xs">
              End-of-period: ${projections[projections.length - 1]?.awsCost.toLocaleString()}/mo
            </p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>03 · Azure Cumulative ({forecastMonths}m)</span>
              <span className="text-[#5FD3BF]">Total TCO</span>
            </div>
            <div className="num tabular-nums">
              ${totalAzure.toLocaleString()}
            </div>
            <p className="font-mono text-xs">
              End-of-period: ${projections[projections.length - 1]?.azureCost.toLocaleString()}/mo
            </p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>04 · GCP Cumulative ({forecastMonths}m)</span>
              <span className="text-[#5FD3BF]">Total TCO</span>
            </div>
            <div className="num hi tabular-nums">
              ${totalGcp.toLocaleString()}
            </div>
            <p className="font-mono text-xs">
              End-of-period: ${projections[projections.length - 1]?.gcpCost.toLocaleString()}/mo
            </p>
          </div>
        </div>
      </section>

      {/* Visual Timeline Bar Chart */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="rm-kicker">01 / Multi-Month Spend Trajectory</span>
            <h3 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#3E6E86]" />
              Monthly Spend Trajectory Over Time
            </h3>
            <p className="text-xs text-slate-500">
              Side-by-side monthly spending as capacity automatically compounds at +{growthRate}% annual rate.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#D79A45]" /> AWS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#3E6E86]" /> Azure
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#2BB5A0]" /> GCP
            </span>
          </div>
        </div>

        {/* Visual Bar Columns */}
        <div className="h-64 flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-slate-200 overflow-x-auto">
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
                    className="w-1/3 bg-[#D79A45] hover:opacity-90 rounded-t-xs transition-all"
                    style={{ height: `${hAws}%` }}
                    title={`AWS ${p.label}: $${p.awsCost.toLocaleString()}`}
                  />
                  <div
                    className="w-1/3 bg-[#3E6E86] hover:opacity-90 rounded-t-xs transition-all"
                    style={{ height: `${hAzure}%` }}
                    title={`Azure ${p.label}: $${p.azureCost.toLocaleString()}`}
                  />
                  <div
                    className="w-1/3 bg-[#2BB5A0] hover:opacity-90 rounded-t-xs transition-all"
                    style={{ height: `${hGcp}%` }}
                    title={`GCP ${p.label}: $${p.gcpCost.toLocaleString()}`}
                  />
                </div>
                <span className="text-[10px] text-slate-600 font-mono tracking-tighter truncate w-full text-center">
                  {p.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-slate-600 flex items-center justify-between">
          <span>Month 1 Baseline</span>
          <span className="text-emerald-800 font-semibold font-mono">
            Cumulative hyperscaler spread: ${cumulativeSavings.toLocaleString()} over {forecastMonths} months
          </span>
          <span>Month {forecastMonths} Horizon</span>
        </div>
      </section>

      {/* Commitment Break-Even Matrix */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <span className="rm-kicker">02 / Commitment Amortization Thresholds</span>
        <h3 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-[#3E6E86]" />
          Commitment Model Break-Even Analysis
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Understanding the ROI threshold: at which month does committing to a 1-Year or 3-Year term save more money than remaining on On-Demand flexibility?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="p-4 rounded-xl bg-[#F3F5F1] border border-slate-200 space-y-2">
            <div className="font-bold text-[#0E2238] text-sm">On-Demand Baseline</div>
            <p className="text-slate-600">
              100% full elasticity. Zero termination penalties or financial lock-in. Ideal for seasonal experimental spikes or workloads with &lt; 6 months lifespan.
            </p>
            <div className="font-mono text-slate-700 pt-2 border-t border-slate-200">
              Break-Even: Month 0 (Pure pay-as-you-go)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F3F5F1] border border-slate-200 space-y-2">
            <div className="font-bold text-[#0E2238] text-sm">1-Year Savings Plan / CUD</div>
            <p className="text-slate-600">
              Averages ~35–38% discount. If your workload runs for at least <strong>7.5 months</strong>, committing to 1 year is strictly cheaper than running on-demand for the same period.
            </p>
            <div className="font-mono text-emerald-800 pt-2 border-t border-slate-200 font-semibold">
              Break-Even Threshold: Month 7.8
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F3F5F1] border border-slate-200 space-y-2">
            <div className="font-bold text-[#0E2238] text-sm">3-Year Reserved / CUD</div>
            <p className="text-slate-600">
              Averages ~58–60% discount. If your core baseline infrastructure runs for at least <strong>14.2 months</strong>, committing to 3 years yields net-positive financial returns.
            </p>
            <div className="font-mono text-emerald-800 pt-2 border-t border-slate-200 font-semibold">
              Break-Even Threshold: Month 14.2
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
