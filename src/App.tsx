import React, { useState, useMemo } from 'react';
import { Server, Layers } from 'lucide-react';
import { TopNav, ActiveTab } from './components/TopNav';
import { WorkloadCalculator } from './components/WorkloadCalculator';
import { LiveAssessment } from './components/LiveAssessment';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { PricingForecasts } from './components/PricingForecasts';
import { QuarterlyHistorical } from './components/QuarterlyHistorical';
import { RealTimeMonitoring } from './components/RealTimeMonitoring';
import { AiCloudAdvisor } from './components/AiCloudAdvisor';
import { ExportModal } from './components/ExportModal';
import {
  WorkloadConfig,
  WorkloadPresetId,
} from './types/cloud';
import { WORKLOAD_PRESETS, PERFORMANCE_BENCHMARKS } from './data/cloudData';
import {
  compareAllProviders,
  getQuarterlyBillingData,
} from './utils/calculator';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [activePreset, setActivePreset] = useState<WorkloadPresetId>('saas-microservices');
  
  // Workload configuration initialized with the SaaS preset
  const [config, setConfig] = useState<WorkloadConfig>(
    WORKLOAD_PRESETS[0].specs
  );

  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Dynamic calculations based on current config
  const results = useMemo(() => {
    return compareAllProviders(config);
  }, [config]);

  const quarterlyData = useMemo(() => {
    return getQuarterlyBillingData(config);
  }, [config]);

  const handleSelectPreset = (presetId: WorkloadPresetId) => {
    setActivePreset(presetId);
    if (presetId !== 'custom') {
      const preset = WORKLOAD_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setConfig(preset.specs);
      }
    }
  };

  const handleConfigChange = (newConfig: WorkloadConfig) => {
    setConfig(newConfig);
    setActivePreset('custom');
  };

  const lowest = results.find((r) => r.isLowestCost);
  const currentPresetLabel =
    WORKLOAD_PRESETS.find((p) => p.id === activePreset)?.name || 'Custom Architecture Profile';

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F5F1] text-[#16232F]">
      {/* Top Bar adhering to the strict 3-zone contract */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Secondary Context Bar matching Postrix aesthetic */}
      <div className="bg-[#0D1C2D] text-[#EEF3F1] border-b border-[#3E6E86]/35 px-6 py-2.5">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-[#EEF3F1]">
              <Server className="w-3.5 h-3.5 text-[#5FD3BF] shrink-0" />
              <span className="font-sans text-[#A9B7BF]">Active Profile:</span>
              <strong className="font-semibold text-white">{currentPresetLabel}</strong>
              <span className="text-[#5FD3BF] font-semibold tabular-nums">
                ({lowest?.provider.name} Optimal · ${lowest?.costs.totalMonthly.toLocaleString()}/mo)
              </span>
            </div>
            <span className="text-[#3E6E86]">·</span>
            <div className="text-[#C6D1D6]">
              <span className="text-[#A9B7BF]">Regions ({config.regions?.length || 1}):</span>{' '}
              <strong className="font-mono font-medium text-white uppercase">
                {(config.regions && config.regions.length > 0 ? config.regions : [config.region]).join(' + ')}
              </strong>
              <span className="font-mono text-[#A9B7BF]"> ({config.commitment})</span>
            </div>
            <span className="text-[#3E6E86] hidden lg:inline">·</span>
            <div className="hidden lg:flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#5FD3BF] shrink-0" />
              <span className="text-[#A9B7BF]">Baseline:</span>
              <span className="font-mono text-[#EEF3F1] tabular-nums">
                {config.instanceCount}× ({config.vCpu} vCPU / {config.ramGb}GB) · DB {config.dbCpu} vCPU
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#A9B7BF]">Switch Architecture Preset:</span>
            <select
              aria-label="Switch Architecture Preset"
              value={activePreset}
              onChange={(e) => handleSelectPreset(e.target.value as WorkloadPresetId)}
              className="bg-[#102236] border border-[#3E6E86]/50 text-[#EEF3F1] text-xs rounded px-2.5 py-1 font-medium focus:outline-none focus:border-[#5FD3BF]"
            >
              {WORKLOAD_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="custom">Custom Sizing Profile</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'calculator' && (
          <WorkloadCalculator
            config={config}
            onChangeConfig={handleConfigChange}
            results={results}
            activePreset={activePreset}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {activeTab === 'assessment' && (
          <LiveAssessment
            onImportToCalculator={(importedConfig) => {
              setConfig(importedConfig);
              setActivePreset('custom');
            }}
            onNavigateToCalculator={() => setActiveTab('calculator')}
          />
        )}

        {activeTab === 'performance' && (
          <PerformanceAnalytics />
        )}

        {activeTab === 'forecasts' && (
          <PricingForecasts
            config={config}
            results={results}
          />
        )}

        {activeTab === 'quarterly' && (
          <QuarterlyHistorical
            quarterlyData={quarterlyData}
          />
        )}

        {activeTab === 'monitoring' && (
          <RealTimeMonitoring
            baseMonthlySpend={lowest?.costs.totalMonthly ?? 1000}
          />
        )}

        {activeTab === 'advisor' && (
          <AiCloudAdvisor
            config={config}
            results={results}
          />
        )}
      </main>

      {/* Postrix-styled Footer with RM mark and Maniq CloudParity branding */}
      <footer className="bg-[#081420] text-[#B9C4CC] border-t border-[#3E6E86]/35 px-6 py-6 mt-auto">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="rm-mono-mark !w-6 !h-6 !text-[11px]" aria-hidden="true">
              RM
            </span>
            <span>
              <strong className="font-serif text-sm font-semibold text-[#F3F5F1]">
                Maniq <span className="text-[#D79A45]">CloudParity</span>
              </strong>{' '}
              — Multi-Cloud Cost, Performance &amp; FinOps Parity Platform
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span>
              Author: <strong className="font-medium text-[#F3F5F1]">Ravindran Mani</strong>
            </span>
            <span className="text-[#3E6E86]">·</span>
            <a
              href="https://ravindran.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[#5FD3BF] hover:text-[#EBC385] underline underline-offset-4 transition-colors"
            >
              ravindran.in
            </a>
            <span className="text-[#3E6E86]">·</span>
            <a
              href="https://ravindran.in/support.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-medium text-[#EBC385] hover:text-[#D79A45] underline underline-offset-4 transition-colors"
            >
              Support to Author
            </a>
          </div>
        </div>
      </footer>

      {/* Export Modal for PDF and Excel */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        config={config}
        results={results}
        quarterly={quarterlyData}
        benchmarks={PERFORMANCE_BENCHMARKS}
      />
    </div>
  );
}
