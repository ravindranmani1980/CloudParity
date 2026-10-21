import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Key,
  ShieldCheck,
  Server,
  Database,
  HardDrive,
  Globe,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Download,
  Sliders,
  Cpu,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  CloudProviderId,
  LiveAssessmentScanResult,
  WorkloadConfig,
  CloudCredentialConfig,
} from '../types/cloud';
import { CLOUD_PROVIDERS } from '../data/cloudData';
import { SAMPLE_LIVE_ASSESSMENTS, IAM_POLICY_TEMPLATES } from '../data/liveAssessmentData';

interface LiveAssessmentProps {
  onImportToCalculator: (config: WorkloadConfig) => void;
  onNavigateToCalculator: () => void;
}

export const LiveAssessment: React.FC<LiveAssessmentProps> = ({
  onImportToCalculator,
  onNavigateToCalculator,
}) => {
  const [activeProvider, setActiveProvider] = useState<CloudProviderId>('aws');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStepLabel, setScanStepLabel] = useState<string>('');
  const [scanResult, setScanResult] = useState<LiveAssessmentScanResult | null>(
    SAMPLE_LIVE_ASSESSMENTS['aws']
  );
  
  // Credentials modal state
  const [isCredModalOpen, setIsCredModalOpen] = useState<boolean>(false);
  const [copiedPolicy, setCopiedPolicy] = useState<boolean>(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Form credentials state
  const [credentialForm, setCredentialForm] = useState<CloudCredentialConfig>({
    provider: 'aws',
    accountId: '849201948212',
    roleArnOrKey: 'arn:aws:iam::849201948212:role/CloudParity-ReadOnlyAssessment',
    region: 'us-east-1',
    authMethod: 'iam-role',
  });

  const handleRunScan = (targetProvider: CloudProviderId = activeProvider) => {
    setIsScanning(true);
    setScanProgress(10);
    setScanStepLabel('Authenticating with cloud provider read-only identity broker...');

    setTimeout(() => {
      setScanProgress(35);
      setScanStepLabel('Scanning active compute instances, vCPU capacity & CloudWatch/Monitor metrics...');
    }, 600);

    setTimeout(() => {
      setScanProgress(65);
      setScanStepLabel('Querying managed relational databases, storage volumes & unattached disks...');
    }, 1200);

    setTimeout(() => {
      setScanProgress(85);
      setScanStepLabel('Synthesizing 30-day billing export consumption & network egress telemetry...');
    }, 1800);

    setTimeout(() => {
      setScanProgress(100);
      setScanStepLabel('Scan complete! Generating multi-cloud parity audit & right-sizing recommendations...');
      setScanResult(SAMPLE_LIVE_ASSESSMENTS[targetProvider]);
      setIsScanning(false);
    }, 2400);
  };

  const handleProviderSelect = (pId: CloudProviderId) => {
    setActiveProvider(pId);
    setCredentialForm((prev) => ({
      ...prev,
      provider: pId,
      accountId: pId === 'aws' ? '849201948212' : pId === 'azure' ? 'sub-09a8f21e-contoso' : 'gcp-prod-infra-8421',
      roleArnOrKey: pId === 'aws' ? 'arn:aws:iam::849201948212:role/CloudParity-ReadOnly' : 'sp-client-secret-key-prod',
      region: pId === 'aws' ? 'us-east-1' : pId === 'azure' ? 'eastus' : 'us-central1',
    }));
    handleRunScan(pId);
  };

  const handleCopyPolicy = () => {
    navigator.clipboard.writeText(IAM_POLICY_TEMPLATES[activeProvider].policyJson);
    setCopiedPolicy(true);
    setTimeout(() => setCopiedPolicy(false), 3000);
  };

  const handleImportInventory = () => {
    if (!scanResult) return;
    const inv = scanResult.discoveredInventory;

    const importedConfig: WorkloadConfig = {
      region: scanResult.provider === 'azure' ? 'us-east' : scanResult.provider === 'gcp' ? 'us-east' : 'us-east',
      os: 'linux',
      commitment: '1yr-reserved',
      vCpu: Math.max(2, Math.round(inv.totalVcpu / inv.instanceCount)),
      ramGb: Math.max(4, Math.round(inv.totalRamGb / inv.instanceCount)),
      instanceCount: inv.instanceCount,
      blockStorageGb: inv.storageGb,
      blockStorageTier: 'provisioned-iops',
      objectStorageTb: 5,
      objectStorageTier: 'hot',
      dbEngine: 'postgres',
      dbCpu: inv.dbVcpu,
      dbRamGb: inv.dbRamGb,
      dbStorageGb: 500,
      dbMultiAz: true,
      egressTb: inv.egressTbMonth,
      k8sClusterCount: 1,
      k8sNodeCount: inv.instanceCount,
      gpuType: 'none',
      gpuCount: 0,
    };

    onImportToCalculator(importedConfig);
    setImportNotification('Live inventory specs successfully imported into the Workload Calculator!');
    setTimeout(() => setImportNotification(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Header section with unboxed metadata */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Live Account Discovery & Auditing</span>
            <span aria-hidden="true">·</span>
            <span>AWS / Azure / GCP Integration</span>
            <span aria-hidden="true">·</span>
            <span>FinOps Read-Only Least Privilege</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Live Cloud Assessment & Account Integration
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-3xl">
            Connect your live AWS, Azure, or GCP environment via read-only credentials to automatically discover active instances, measure real CPU/RAM utilization, detect waste, and benchmark cross-cloud migration savings.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCredModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>Configure Credentials</span>
          </button>

          <button
            onClick={() => handleRunScan()}
            disabled={isScanning}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition-all shadow-sm shadow-cyan-600/30 whitespace-nowrap disabled:opacity-50"
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Run Live Scan</span>
          </button>
        </div>
      </div>

      {importNotification && (
        <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importNotification}</span>
          </div>
          <button
            onClick={onNavigateToCalculator}
            className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors whitespace-nowrap"
          >
            Go to Calculator &rarr;
          </button>
        </div>
      )}

      {/* 3 Hyperscaler Connector Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(['aws', 'azure', 'gcp'] as CloudProviderId[]).map((pId) => {
          const p = CLOUD_PROVIDERS[pId];
          const isSelected = activeProvider === pId;

          return (
            <div
              key={pId}
              onClick={() => handleProviderSelect(pId)}
              className={`rounded-xl border p-5 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900/95 border-cyan-500/60 ring-1 ring-cyan-500/30 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: p.brandColor }}
                  />
                  <h3 className="text-base font-bold text-white">{p.fullName}</h3>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    isSelected
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {isSelected ? 'Active Scan Target' : 'Ready to Connect'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                {pId === 'aws'
                  ? 'Connect via Cross-Account IAM Role ARN with External ID or Read-Only STS tokens.'
                  : pId === 'azure'
                  ? 'Connect via Microsoft Entra Service Principal with Cost Management Reader RBAC.'
                  : 'Connect via GCP Custom FinOps Service Account or Cloud Billing BigQuery export.'}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-500">Method:</span>
                <span className="font-mono text-cyan-400 text-xs font-semibold">
                  {pId === 'aws' ? 'IAM Role ARN' : pId === 'azure' ? 'Entra App / RBAC' : 'Service Account'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scanning Progress Overlay Banner */}
      {isScanning && (
        <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              Scanning {CLOUD_PROVIDERS[activeProvider].fullName}...
            </span>
            <span className="font-mono text-cyan-400 font-bold">{scanProgress}%</span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span className="text-cyan-400">&gt;</span>
            <span>{scanStepLabel}</span>
          </div>
        </div>
      )}

      {/* Scan Results Viewport */}
      {scanResult && !isScanning && (
        <div className="space-y-6">
          {/* Top Discovery Summary Banner */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Live Assessment Report for {scanResult.accountIdentifier}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Region: {scanResult.activeRegion}</span>
                    <span aria-hidden="true">&bull;</span>
                    <span>Scanned: {scanResult.scanTimestamp}</span>
                    <span aria-hidden="true">&bull;</span>
                    <span>Read-Only FinOps Audit</span>
                  </div>
                </div>
              </div>

              {/* Import to Calculator Action */}
              <button
                onClick={handleImportInventory}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Import Specs into Calculator</span>
              </button>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 block">Current Monthly Spend</span>
                <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                  ${scanResult.totalMonthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 block">Actual 30-day run-rate</span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 block">Discovered Compute</span>
                <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                  {scanResult.discoveredInventory.instanceCount} VMs
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {scanResult.discoveredInventory.totalVcpu} vCPUs &bull; {scanResult.discoveredInventory.totalRamGb} GB RAM
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 block">Over-Provisioned Rate</span>
                <span className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
                  {scanResult.overProvisionedPct}%
                </span>
                <span className="text-[10px] text-slate-500 block">Avg CPU &lt; 20% utilization</span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 block">Right-Sizing Savings</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
                  ${scanResult.rightSizingSavingsMonthly.toLocaleString()}/mo
                </span>
                <span className="text-[10px] text-emerald-500/80 block font-semibold">Immediate waste recovery</span>
              </div>
            </div>
          </div>

          {/* Cross-Cloud Migration Arbitrage Callout */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 border border-emerald-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <h4 className="text-sm font-bold text-white">
                  Multi-Cloud Arbitrage for this Scanned Inventory:
                </h4>
              </div>

              <span className="font-mono text-emerald-300 font-bold text-xs px-2.5 py-1 rounded bg-emerald-900/60 border border-emerald-700/60">
                Save ${scanResult.crossCloudSavings.monthlySavingsVsCurrent.toLocaleString()}/mo ({scanResult.crossCloudSavings.percentageSavings}% drop)
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If your current {CLOUD_PROVIDERS[scanResult.provider].name} inventory ({scanResult.discoveredInventory.instanceCount} instances, {scanResult.discoveredInventory.dbCount} databases, and {scanResult.discoveredInventory.storageGb} GB storage) is mapped to equivalent instances on <strong>{CLOUD_PROVIDERS[scanResult.crossCloudSavings.cheapestProvider].fullName}</strong>, your monthly bill drops from <span className="font-mono text-white font-semibold">${scanResult.totalMonthlySpend.toLocaleString()}/mo</span> to <span className="font-mono text-emerald-300 font-semibold">${scanResult.crossCloudSavings.cheapestMonthlyCost.toLocaleString()}/mo</span>, generating approximately <strong className="text-emerald-300 font-mono">${scanResult.crossCloudSavings.annualSavingsVsCurrent.toLocaleString()}</strong> in annual run-rate savings.
            </p>
          </div>

          {/* Discovered Resources Inventory Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Discovered Cloud Resources & Sizing Telemetry
                </h3>
                <p className="text-xs text-slate-400">
                  Live CPU telemetry measured across the last 30 days of active runtime.
                </p>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {scanResult.resourceList.length} audited items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-6">Resource ID / Name</th>
                    <th className="py-3 px-6">Type & SKU</th>
                    <th className="py-3 px-6 text-center">Avg CPU</th>
                    <th className="py-3 px-6 text-right">Current Spend</th>
                    <th className="py-3 px-6">Right-Sizing Recommendation</th>
                    <th className="py-3 px-6 text-right">Optimized Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                  {scanResult.resourceList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-6 font-sans">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.id}</div>
                      </td>

                      <td className="py-3 px-6 text-slate-300">
                        <div className="font-mono">{item.sku}</div>
                        <div className="text-[11px] text-slate-500 font-sans capitalize">{item.type}</div>
                      </td>

                      <td className="py-3 px-6 text-center">
                        {item.avgCpuUtilizationPct > 0 ? (
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                              item.avgCpuUtilizationPct < 20
                                ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                                : 'bg-slate-950 text-slate-300'
                            }`}
                          >
                            {item.avgCpuUtilizationPct}%
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold text-[11px]">0% (Idle)</span>
                        )}
                      </td>

                      <td className="py-3 px-6 text-right text-slate-200">
                        ${item.provisionedCostMonthly.toFixed(2)}
                      </td>

                      <td className="py-3 px-6 font-sans">
                        {item.isOverProvisioned ? (
                          <div className="text-emerald-400 font-medium flex items-center gap-1.5">
                            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.rightSizedSku}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Optimally sized</span>
                        )}
                      </td>

                      <td className="py-3 px-6 text-right">
                        {item.rightSizedCostMonthly !== undefined ? (
                          <span className="text-emerald-400 font-semibold font-mono">
                            ${item.rightSizedCostMonthly.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">
                            ${item.provisionedCostMonthly.toFixed(2)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Security & Zero Data Storage Trust Box */}
      <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-cyan-400 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-white text-sm">
              Enterprise FinOps Security & Least Privilege Guarantee
            </h4>
            <p className="text-slate-400">
              CloudParity operates exclusively with read-only permissions (`DescribeInstances`, `GetMetricData`, `ce:GetCostAndUsage`). No modification permissions, access to data volumes, or root keys are ever requested. Credentials reside solely in browser memory during your active session.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCredModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 border border-cyan-800/60 rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          View IAM Policy Template
        </button>
      </div>

      {/* Credentials Configuration Modal */}
      {isCredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Configure {CLOUD_PROVIDERS[activeProvider].fullName} Live Connection
                </h3>
                <p className="text-xs text-slate-400">
                  Read-only credentials for automated telemetry and inventory discovery.
                </p>
              </div>
              <button
                onClick={() => setIsCredModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {activeProvider === 'aws'
                      ? 'AWS Account ID or Target Role ARN'
                      : activeProvider === 'azure'
                      ? 'Azure Subscription ID'
                      : 'GCP Project ID'}
                  </label>
                  <input
                    type="text"
                    value={credentialForm.accountId}
                    onChange={(e) =>
                      setCredentialForm({ ...credentialForm, accountId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {activeProvider === 'aws'
                      ? 'Cross-Account IAM Role ARN'
                      : activeProvider === 'azure'
                      ? 'App Client ID / Secret'
                      : 'Service Account JSON Key Content'}
                  </label>
                  <input
                    type="text"
                    value={credentialForm.roleArnOrKey}
                    onChange={(e) =>
                      setCredentialForm({ ...credentialForm, roleArnOrKey: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Target Region</label>
                  <input
                    type="text"
                    value={credentialForm.region}
                    onChange={(e) =>
                      setCredentialForm({ ...credentialForm, region: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* IAM Policy Template Box */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">
                    {IAM_POLICY_TEMPLATES[activeProvider].title}
                  </span>
                  <button
                    onClick={handleCopyPolicy}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedPolicy ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPolicy ? 'Copied!' : 'Copy Policy JSON'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-40">
                  {IAM_POLICY_TEMPLATES[activeProvider].policyJson}
                </pre>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsCredModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsCredModalOpen(false);
                  handleRunScan();
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Save & Test Live Scan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
