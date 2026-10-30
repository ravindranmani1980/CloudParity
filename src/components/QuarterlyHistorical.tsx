import React, { useState } from 'react';
import {
  History,
  BarChart3,
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

  const maxQuarterVal = Math.max(
    ...quarterlyData.flatMap((q) => [q.aws, q.azure, q.gcp])
  );

  return (
    <div className="space-y-8">
      {/* Signature Postrix XH-Panel Executive Banner */}
      <section className="xh-panel">
        <div className="xh-kicker">
          <span className="k">Fiscal Cadence &amp; Multi-Year Silicon Deflation Curves</span>
          <span className="tag">Q1–Q4 Seasonal Modeling · 5-Year Historical Ledger (2022–2026)</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-[#C9D3D9]/12">
          <div className="flex items-center gap-3.5">
            <div className="rm-mono-mark !w-11 !h-11 !text-base" aria-hidden="true">
              RM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#EEF3F1] leading-snug m-0 font-sans">
                Quarterly Billing Comparisons &amp; Historical Trends
                <span className="block font-mono font-normal text-xs text-[#A9B7BF] mt-0.5">
                  Analyze quarterly fiscal spending across seasonal peak cycles alongside 5-year hardware unit price curves
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTrendMetric('compute')}
              className={`xh-btn !py-1.5 !px-3 !text-xs whitespace-nowrap ${
                activeTrendMetric === 'compute' ? 'primary' : ''
              }`}
            >
              Compute ($/vCPU-hr)
            </button>
            <button
              type="button"
              onClick={() => setActiveTrendMetric('storage')}
              className={`xh-btn !py-1.5 !px-3 !text-xs whitespace-nowrap ${
                activeTrendMetric === 'storage' ? 'primary' : ''
              }`}
            >
              Storage ($/GB-mo)
            </button>
            <button
              type="button"
              onClick={() => setActiveTrendMetric('egress')}
              className={`xh-btn !py-1.5 !px-3 !text-xs whitespace-nowrap ${
                activeTrendMetric === 'egress' ? 'primary' : ''
              }`}
            >
              Egress ($/TB)
            </button>
          </div>
        </div>

        {/* 4 Quarterly XH-Metric Cards inside the Executive Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          {quarterlyData.map((q, idx) => {
            const minSpend = Math.min(q.aws, q.azure, q.gcp);
            const winner = minSpend === q.gcp ? 'GCP' : minSpend === q.azure ? 'Azure' : 'AWS';

            return (
              <div key={q.quarter} className="xh-metric">
                <div className="lbl">
                  <span>0{idx + 1} · {q.quarter}</span>
                  <span className="text-[#EBC385]">+{Math.round((q.seasonalityMultiplier - 1) * 100)}% seasonal</span>
                </div>
                <div className="num hi tabular-nums text-xl">
                  ${minSpend.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[#A9B7BF]">({winner} Lead)</span>
                </div>
                <p className="text-xs mt-1">{q.eventDescription}</p>
                <div className="mt-2 pt-2 border-t border-[#C9D3D9]/12 font-mono text-[11px] text-[#A9B7BF] flex justify-between tabular-nums">
                  <span>AWS ${q.aws.toLocaleString()}</span>
                  <span>Az ${q.azure.toLocaleString()}</span>
                  <span>GCP ${q.gcp.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Part 2: Visual Comparison of Quarters */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="rm-kicker">01 / Fiscal Quarter Variance</span>
            <h3 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#3E6E86]" />
              Quarterly Spend Progression
            </h3>
            <p className="text-xs text-slate-500">
              Visualizing quarterly variance driven by annual business cycles and seasonal concurrency spikes.
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

        <div className="h-56 flex items-end gap-6 pt-4 pb-2 border-b border-slate-200">
          {quarterlyData.map((q) => {
            const hAws = Math.max(10, Math.round((q.aws / maxQuarterVal) * 100));
            const hAzure = Math.max(10, Math.round((q.azure / maxQuarterVal) * 100));
            const hGcp = Math.max(10, Math.round((q.gcp / maxQuarterVal) * 100));

            return (
              <div key={q.quarter} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full max-w-[120px] flex items-end justify-center gap-1.5 sm:gap-2 h-full">
                  <div
                    className="w-1/3 bg-[#D79A45] hover:opacity-90 rounded-t transition-all"
                    style={{ height: `${hAws}%` }}
                    title={`AWS ${q.quarter}: $${q.aws.toLocaleString()}`}
                  />
                  <div
                    className="w-1/3 bg-[#3E6E86] hover:opacity-90 rounded-t transition-all"
                    style={{ height: `${hAzure}%` }}
                    title={`Azure ${q.quarter}: $${q.azure.toLocaleString()}`}
                  />
                  <div
                    className="w-1/3 bg-[#2BB5A0] hover:opacity-90 rounded-t transition-all"
                    style={{ height: `${hGcp}%` }}
                    title={`GCP ${q.quarter}: $${q.gcp.toLocaleString()}`}
                  />
                </div>
                <span className="text-xs font-semibold text-[#0E2238] font-sans">
                  {q.quarter}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Part 3: 5-Year Historical Pricing Trends */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="rm-kicker">02 / Multi-Generation Rate Card History</span>
            <h3 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2">
              <History className="w-5 h-5 text-[#3E6E86]" />
              Historical Unit Price Trend (2022–2026)
            </h3>
            <p className="text-xs text-slate-500">
              Examining price reductions per unit across hardware generations and custom ARM silicon deployments.
            </p>
          </div>

          <div className="text-xs text-slate-600 font-mono bg-[#F3F5F1] px-3 py-1.5 rounded-lg border border-slate-200">
            Metric: {activeTrendMetric === 'compute' ? 'Compute vCPU-hour ($)' : activeTrendMetric === 'storage' ? 'SSD Block Storage ($/GB/mo)' : 'Data Egress ($/TB)'}
          </div>
        </div>

        {/* Historical Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3.5 px-6">Calendar Year</th>
                <th className="py-3.5 px-6 text-right">AWS Rate</th>
                <th className="py-3.5 px-6 text-right">Azure Rate</th>
                <th className="py-3.5 px-6 text-right">GCP Rate</th>
                <th className="py-3.5 px-6 text-right">5-Year Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
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
                  <tr key={row.year} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-6 font-bold text-[#0E2238] font-sans">{row.year}</td>
                    <td className="py-3 px-6 text-right text-slate-700">
                      ${valAws < 1 ? valAws.toFixed(4) : valAws.toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-right text-slate-700">
                      ${valAz < 1 ? valAz.toFixed(4) : valAz.toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-right text-slate-700">
                      ${valGcp < 1 ? valGcp.toFixed(4) : valGcp.toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-right font-semibold text-emerald-700">
                      {deltaPct === 0 ? 'Baseline' : `${deltaPct}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Strategic Analysis Box */}
        <div className="p-6 bg-[#F3F5F1]/60 border-t border-slate-200 text-xs space-y-1.5">
          <div className="font-semibold text-[#0E2238] text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#D79A45]" />
            Key Historical Drivers
          </div>
          <p className="text-slate-600 leading-relaxed">
            Over the past 5 years, compute costs have decreased ~25% in real terms due to the rapid rollout of custom ARM-based silicon (AWS Graviton3/4, GCP Axion, Azure Cobalt) and denser AMD EPYC architectures. Egress bandwidth remains the stickiest line item, experiencing slower price deflation (-16%) than raw silicon and storage.
          </p>
        </div>
      </section>
    </div>
  );
};
