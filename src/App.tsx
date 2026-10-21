import React, { useState, useMemo } from 'react';
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Bar adhering to the strict 3-zone contract */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Clean Footer adhering to anti-slop rules (no decorative fake worker engines) */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">CloudParity</span>
            <span aria-hidden="true">&bull;</span>
            <span>Multi-Cloud Cost & Performance Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('calculator')}
              className="hover:text-slate-300 transition-colors"
            >
              Calculator
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className="hover:text-slate-300 transition-colors"
            >
              Live Assessment
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className="hover:text-slate-300 transition-colors"
            >
              Benchmarks
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className="hover:text-slate-300 transition-colors"
            >
              Live Monitoring
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Export Report
            </button>
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
