import React, { useState } from 'react';
import {
  CalendarDays,
  History,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { QuarterlyData } from '../types/cloud';
import { HISTORICAL_PRICE_TRENDS } from '../data/cloudData';

interface QuarterlyHistoricalProps {
  quarterlyData: QuarterlyData[];
}

export const QuarterlyHistorical: React.FC<QuarterlyHistoricalProps> = ({
  quarterlyData,
}) => {
  const [activeTrendMetric, setActiveTrendMetric] = useState<'compute' | 'storage' | 'egress'>('compute');

  // Compute maximum quarterly spend for visual bar scaling
  const maxQuarterVal = Math.max(
    ...quarterlyData.flatMap((q) => [q.aws, q.azure, q.gcp])
  );

  return (
    <div className="space-y-8">
      {/* Header section with clean unboxed metadata */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Fiscal Cadence & Multi-Year Trends</span>
            <span aria-hidden="true">·</span>
            <span>Q1–Q4 Seasonal Modeling</span>
            <span aria-hidden="true">·</span>
            <span>5-Year Price History (2022–2026)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Quarterly Billing Comparisons & Historical Trends
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-3xl">
            Analyze quarterly fiscal spending variations across seasonal peak cycles, alongside multi-year hardware deflation curves across AWS, Azure, and GCP.
          </p>
        </div>

        {/* Historical metric toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTrendMetric('compute')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap ${
              activeTrendMetric === 'compute'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Compute ($/vCPU-hr)
          </button>
          <button
            onClick={() => setActiveTrendMetric('storage')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap ${
              activeTrendMetric === 'storage'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Storage ($/GB-mo)
          </button>
          <button
            onClick={() => setActiveTrendMetric('egress')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap ${
              activeTrendMetric === 'egress'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Egress ($/TB)
          </button>
        </div>
      </div>

      {/* Part 1: Quarterly Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {quarterlyData.map((q) => {
          const minSpend = Math.min(q.aws, q.azure, q.gcp);
          const winner = minSpend === q.gcp ? 'GCP' : minSpend === q.azure ? 'Azure' : 'AWS';

          return (
            <div
              key={q.quarter}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-cyan-400" />
                    {q.quarter}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                    +{Math.round((q.seasonalityMultiplier - 1) * 100)}% seasonal
                  </span>
                </div>
                <p className="text-xs text-slate-400 min-h-[32px]">{q.eventDescription}</p>

                {/* Quarterly Provider Numbers */}
                <div className="mt-4 space-y-2 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      AWS
                    </span>
                    <span className="font-mono font-semibold text-slate-200">
                      ${q.aws.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      Azure
                    </span>
                    <span className="font-mono font-semibold text-slate-200">
                      ${q.azure.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      GCP
                    </span>
                    <span className="font-mono font-semibold text-slate-200">
                      ${q.gcp.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Quarterly Advantage:</span>
                <span className="text-emerald-400 font-bold font-sans">{winner}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Part 2: Visual Comparison of Quarters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Quarterly Spend Progression
            </h3>
            <p className="text-xs text-slate-400">
              Visualizing quarterly variance driven by annual business cycles and seasonal concurrency spikes.
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

        <div className="h-56 flex items-end gap-6 pt-4 pb-2 border-b border-slate-800">
          {quarterlyData.map((q) => {
            const hAws = Math.max(10, Math.round((q.aws / maxQuarterVal) * 100));
            const hAzure = Math.max(10, Math.round((q.azure / maxQuarterVal) * 100));
            const hGcp = Math.max(10, Math.round((q.gcp / maxQuarterVal) * 100));

            return (
              <div key={q.quarter} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full max-w-[120px] flex items-end justify-center gap-1.5 sm:gap-2 h-full">
                  <div
                    className="w-1/3 bg-amber-500/80 hover:bg-amber-400 rounded-t transition-all"
                    style={{ height: `${hAws}%` }}
                    title={`AWS ${q.quarter}: $${q.aws.toLocaleString()}`}
                  />
                  <div
                    className="w-1/3 bg-sky-500/80 hover:bg-sky-400 rounded-t transition-all"
                    style={{ height: `${hAzure}%` }}
                    title={`Azure ${q.quarter}: $${q.azure.toLocaleString()}`}
                  />
                  <div
                    className="w-1/3 bg-blue-500/80 hover:bg-blue-400 rounded-t transition-all"
                    style={{ height: `${hGcp}%` }}
                    title={`GCP ${q.quarter}: $${q.gcp.toLocaleString()}`}
                  />
                </div>
                <span className="text-xs font-bold text-slate-300 font-sans">
                  {q.quarter}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 3: 5-Year Historical Pricing Trends */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Historical Unit Price Trend (2022–2026)
            </h3>
            <p className="text-xs text-slate-400">
              Examining price reductions per unit across hardware generations and custom silicon deployments.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Metric: {activeTrendMetric === 'compute' ? 'Compute vCPU-hour ($)' : activeTrendMetric === 'storage' ? 'SSD Block Storage ($/GB/mo)' : 'Data Egress ($/TB)'}
          </div>
        </div>

        {/* Historical Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Calendar Year</th>
                <th className="py-3 px-6 text-right">AWS Rate</th>
                <th className="py-3 px-6 text-right">Azure Rate</th>
                <th className="py-3 px-6 text-right">GCP Rate</th>
                <th className="py-3 px-6 text-right">5-Year Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {HISTORICAL_PRICE_TRENDS.map((row) => {
                const getVal = (p: 'aws' | 'azure' | 'gcp') => {
                  if (activeTrendMetric === 'compute') return row.computeCostPerHour[p];
                  if (activeTrendMetric === 'storage') return row.storageCostPerGb[p];
                  return row.egressCostPerTb[p];
                };

                const valAws = getVal('aws');
                const valAz = getVal('azure');
                const valGcp = getVal('gcp');

                const initialAws = activeTrendMetric === 'compute' ? HISTORICAL_PRICE_TRENDS[0].computeCostPerHour.aws : activeTrendMetric === 'storage' ? HISTORICAL_PRICE_TRENDS[0].storageCostPerGb.aws : HISTORICAL_PRICE_TRENDS[0].egressCostPerTb.aws;
                const deltaPct = Math.round(((valAws - initialAws) / initialAws) * 100);

                return (
                  <tr key={row.year} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-white font-sans">{row.year}</td>
                    <td className="py-3 px-6 text-right text-slate-200">
                      ${valAws < 1 ? valAws.toFixed(4) : valAws.toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-right text-slate-200">
                      ${valAz < 1 ? valAz.toFixed(4) : valAz.toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-right text-slate-200">
                      ${valGcp < 1 ? valGcp.toFixed(4) : valGcp.toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-right font-semibold text-emerald-400">
                      {deltaPct === 0 ? 'Baseline' : `${deltaPct}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Strategic Analysis Box */}
        <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-2">
          <div className="font-bold text-cyan-400 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Key Historical Drivers
          </div>
          <p className="text-slate-300 leading-relaxed">
            Over the past 5 years, compute costs have decreased ~25% in real terms due to the rapid rollout of custom ARM-based silicon (AWS Graviton3/4, GCP Axion, Azure Cobalt) and denser AMD EPYC architectures. Egress bandwidth remains the stickiest line item, experiencing slower price deflation (-16%) than raw silicon and storage.
          </p>
        </div>
      </div>
    </div>
  );
};
