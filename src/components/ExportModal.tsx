import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Check,
  Building,
  User,
  MessageSquare,
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
  const [companyName, setCompanyName] = useState<string>('Acme Global Enterprises');
  const [preparedBy, setPreparedBy] = useState<string>('Mani Ravindran — Cloud Architecture Lead');
  const [notes, setNotes] = useState<string>(
    'Evaluated based on production high-availability baseline with multi-AZ relational databases, premium storage IOPS, and 1-year reserved commitment terms.'
  );

  const [includeQuarterly, setIncludeQuarterly] = useState<boolean>(true);
  const [includePerformance, setIncludePerformance] = useState<boolean>(true);
  const [includeForecasting, setIncludeForecasting] = useState<boolean>(true);

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F3F5F1]">
          <div className="flex items-center gap-3">
            <span className="rm-mono-mark !w-8 !h-8 !text-xs" aria-hidden="true">
              RM
            </span>
            <div>
              <h3 className="text-base font-semibold text-[#0E2238]">
                Export Maniq | Compare Executive Report
              </h3>
              <p className="text-xs text-slate-600">
                Generate boardroom-ready executive PDF and audit-ready Excel spreadsheets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {downloadSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Report Customization Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#3E6E86]" />
                Company / Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full bg-[#F3F5F1] border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0E2238]"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#3E6E86]" />
                Prepared By (Lead Architect / Analyst)
              </label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="e.g. Platform Engineering Team"
                className="w-full bg-[#F3F5F1] border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0E2238]"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#3E6E86]" />
                Analyst Notes / Strategic Context
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add contextual remarks or migration caveats..."
                className="w-full bg-[#F3F5F1] border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0E2238]"
              />
            </div>
          </div>

          {/* Section Inclusions Checkboxes */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <span className="text-xs text-slate-700 font-semibold block mb-1">
              Include Data Sections in Report:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeQuarterly}
                  onChange={(e) => setIncludeQuarterly(e.target.checked)}
                  className="rounded accent-[#0E2238]"
                />
                <span>Quarterly Trajectory</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePerformance}
                  onChange={(e) => setIncludePerformance(e.target.checked)}
                  className="rounded accent-[#0E2238]"
                />
                <span>Hardware Benchmarks</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeForecasting}
                  onChange={(e) => setIncludeForecasting(e.target.checked)}
                  className="rounded accent-[#0E2238]"
                />
                <span>Multi-Year Forecasts</span>
              </label>
            </div>
          </div>

          {/* Summary Preview Banner */}
          <div className="p-3.5 rounded-xl bg-[#F3F5F1] border border-slate-200 text-xs space-y-1">
            <div className="text-slate-500 font-mono uppercase tracking-wider text-[10px]">Report Key Takeaway</div>
            <div className="text-slate-800">
              <strong className="text-emerald-800 font-bold">{lowest?.provider.fullName}</strong> is the most cost-effective provider at <span className="font-mono font-semibold">${lowest?.costs.totalMonthly.toLocaleString()}/mo</span> (${lowest?.costs.totalAnnual.toLocaleString()}/yr), saving up to <span className="font-mono text-emerald-800 font-bold">${lowest?.savingsVsHighest.toLocaleString()}/mo</span> vs peers.
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-[#F3F5F1] flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0E2238] hover:bg-[#16232F] rounded-lg transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#5FD3BF]" />
            <span>Download Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="w-full sm:w-auto xh-btn primary justify-center"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
