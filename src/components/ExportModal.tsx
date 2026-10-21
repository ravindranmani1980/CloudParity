import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Check,
  Building,
  User,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  WorkloadConfig,
  ProviderComparisonResult,
  QuarterlyData,
  PerformanceMetric,
} from '../types/cloud';
import { exportToExcel, exportToPdf, ExportReportOptions } from '../utils/exportReports';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WorkloadConfig;
  results: ProviderComparisonResult[];
  quarterly: QuarterlyData[];
  benchmarks: PerformanceMetric[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  config,
  results,
  quarterly,
  benchmarks,
}) => {
  if (!isOpen) return null;

  const [companyName, setCompanyName] = useState<string>('Acme Global Enterprises');
  const [preparedBy, setPreparedBy] = useState<string>('Cloud Infrastructure Architecture Team');
  const [notes, setNotes] = useState<string>(
    'Evaluated based on production high-availability baseline with multi-AZ relational databases, premium storage IOPS, and 1-year reserved commitment terms.'
  );

  const [includeQuarterly, setIncludeQuarterly] = useState<boolean>(true);
  const [includePerformance, setIncludePerformance] = useState<boolean>(true);
  const [includeForecasting, setIncludeForecasting] = useState<boolean>(true);

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleExportExcel = () => {
    const options: ExportReportOptions = {
      companyName,
      preparedBy,
      notes,
      includeQuarterly,
      includePerformance,
      includeForecasting,
    };
    exportToExcel(config, results, quarterly, benchmarks, options);
    setDownloadSuccess('Excel workbook generated & downloaded successfully!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleExportPdf = () => {
    const options: ExportReportOptions = {
      companyName,
      preparedBy,
      notes,
      includeQuarterly,
      includePerformance,
      includeForecasting,
    };
    exportToPdf(config, results, quarterly, benchmarks, options);
    setDownloadSuccess('Executive PDF report generated & downloaded successfully!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const lowest = results.find((r) => r.isLowestCost);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Export Customized Cloud Cost Report
            </h3>
            <p className="text-xs text-slate-400">
              Generate boardroom-ready executive PDF and audit-ready Excel spreadsheets.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {downloadSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Report Customization Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-400" />
                Company / Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Prepared By (Lead Architect / Analyst)
              </label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="e.g. Platform Engineering Team"
                className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                Analyst Notes / Strategic Context
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add contextual remarks or migration caveats..."
                className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Section Inclusions Checkboxes */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-medium block mb-1">
              Include Data Sections in Report:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeQuarterly}
                  onChange={(e) => setIncludeQuarterly(e.target.checked)}
                  className="rounded text-cyan-600 bg-slate-950 border-slate-700 focus:ring-cyan-500"
                />
                <span>Quarterly Trajectory</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePerformance}
                  onChange={(e) => setIncludePerformance(e.target.checked)}
                  className="rounded text-cyan-600 bg-slate-950 border-slate-700 focus:ring-cyan-500"
                />
                <span>Hardware Benchmarks</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeForecasting}
                  onChange={(e) => setIncludeForecasting(e.target.checked)}
                  className="rounded text-cyan-600 bg-slate-950 border-slate-700 focus:ring-cyan-500"
                />
                <span>Multi-Year Forecasts</span>
              </label>
            </div>
          </div>

          {/* Summary Preview Banner */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="text-slate-400">Report Key Takeaway:</div>
            <div className="text-slate-200">
              <strong className="text-emerald-400 font-bold">{lowest?.provider.fullName}</strong> is the most cost-effective provider at <span className="font-mono font-semibold">${lowest?.costs.totalMonthly.toLocaleString()}/mo</span> (${lowest?.costs.totalAnnual.toLocaleString()}/yr), saving up to <span className="font-mono text-emerald-400 font-bold">${lowest?.savingsVsHighest.toLocaleString()}/mo</span> vs peers.
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-md transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-md transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
