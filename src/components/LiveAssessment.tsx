import React, { useState } from 'react';
import {
  CheckCircle2,
  Play,
  Key,
  ShieldCheck,
  TrendingDown,
  Copy,
  Check,
  Sliders,
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
  
  const [isCredModalOpen, setIsCredModalOpen] = useState<boolean>(false);
  const [copiedPolicy, setCopiedPolicy] = useState<boolean>(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

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
      region: 'us-east',
      regions: ['us-east'],
      multiRegionMode: 'traffic-split',
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
      {/* Signature Postrix XH-Panel Executive Banner */}
      <section className="xh-panel">
        <div className="xh-kicker">
          <span className="k">Live Cloud Account Discovery &amp; Right-Sizing Telemetry</span>
          <span className="tag">Read-Only Least Privilege · IAM Role / RBAC / Service Account</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-[#C9D3D9]/12">
          <div className="flex items-center gap-3.5">
            <div className="rm-mono-mark !w-11 !h-11 !text-base" aria-hidden="true">
              RM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#EEF3F1] leading-snug m-0 font-sans">
                Live Cloud Assessment &amp; Account Integration
                <span className="block font-mono font-normal text-xs text-[#A9B7BF] mt-0.5">
                  Active Target: {scanResult?.accountIdentifier || CLOUD_PROVIDERS[activeProvider].fullName} · Region: {scanResult?.activeRegion || 'us-east-1'}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCredModalOpen(true)}
              className="xh-btn"
            >
              <Key className="w-3.5 h-3.5 text-[#5FD3BF]" />
              <span>Configure Credentials</span>
            </button>

            <button
              type="button"
              onClick={() => handleRunScan()}
              disabled={isScanning}
              className="xh-btn primary disabled:opacity-50"
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

        {/* 4 XH-Metric Executive Cards */}
        {scanResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
            <div className="xh-metric">
              <div className="lbl">
                <span>01 · Audited Monthly Spend</span>
                <span className="text-[#5FD3BF]">30-day actual</span>
              </div>
              <div className="num tabular-nums">
                ${scanResult.totalMonthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p>Scanned across {scanResult.activeRegion}</p>
            </div>

            <div className="xh-metric">
              <div className="lbl">
                <span>02 · Discovered Compute</span>
                <span className="text-[#EBC385]">{scanResult.discoveredInventory.totalVcpu} vCPU</span>
              </div>
              <div className="num tabular-nums">
                {scanResult.discoveredInventory.instanceCount} VMs
              </div>
              <p>{scanResult.discoveredInventory.totalRamGb} GB RAM · {scanResult.discoveredInventory.storageGb} GB Block</p>
            </div>

            <div className="xh-metric">
              <div className="lbl">
                <span>03 · Over-Provisioned Rate</span>
                <span className="text-[#EBC385]">CPU &lt; 20%</span>
              </div>
              <div className="num tabular-nums text-[#EBC385]">
                {scanResult.overProvisionedPct}%
              </div>
              <p>Idle &amp; underutilized capacity</p>
            </div>

            <div className="xh-metric">
              <div className="lbl">
                <span>04 · Right-Sizing Recovery</span>
                <span className="text-[#5FD3BF]">Immediate ROI</span>
              </div>
              <div className="num hi tabular-nums">
                ${scanResult.rightSizingSavingsMonthly.toLocaleString()}/mo
              </div>
              <p>Saves ${(scanResult.rightSizingSavingsMonthly * 12).toLocaleString()}/yr in waste</p>
            </div>
          </div>
        )}
      </section>

      {importNotification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{importNotification}</span>
          </div>
          <button
            type="button"
            onClick={onNavigateToCalculator}
            className="px-3 py-1.5 text-xs font-semibold bg-[#0E2238] hover:bg-[#16232F] text-white rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Go to Calculator &rarr;
          </button>
        </div>
      )}

      {/* 3 Hyperscaler Connector Selector Cards */}
      <section className="space-y-3">
        <div>
          <span className="rm-kicker">01 / Hyperscaler Identity Connectors</span>
          <h2 className="text-xl font-semibold text-[#0E2238]">
            Select Cloud Environment to Audit
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['aws', 'azure', 'gcp'] as CloudProviderId[]).map((pId) => {
            const p = CLOUD_PROVIDERS[pId];
            const isSelected = activeProvider === pId;

            return (
              <div
                key={pId}
                onClick={() => handleProviderSelect(pId)}
                className={`rounded-xl border p-5 cursor-pointer transition-all bg-white ${
                  isSelected
                    ? 'border-[#0E2238] ring-2 ring-[#0E2238]/15 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.brandColor }}
                    />
                    <h3 className="text-base font-bold text-[#0E2238] font-sans">{p.fullName}</h3>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                      isSelected
                        ? 'bg-[#0E2238] text-[#5FD3BF]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isSelected ? 'Active Scan Target' : 'Ready to Connect'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {pId === 'aws'
                    ? 'Connect via Cross-Account IAM Role ARN with External ID or Read-Only STS tokens.'
                    : pId === 'azure'
                    ? 'Connect via Microsoft Entra Service Principal with Cost Management Reader RBAC.'
                    : 'Connect via GCP Custom FinOps Service Account or Cloud Billing BigQuery export.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Auth Protocol:</span>
                  <span className="font-mono text-[#0E2238] font-semibold">
                    {pId === 'aws' ? 'IAM Role ARN' : pId === 'azure' ? 'Entra App / RBAC' : 'Service Account'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Scanning Progress Overlay Banner */}
      {isScanning && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#0E2238] flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#2BB5A0] animate-spin" />
              Scanning {CLOUD_PROVIDERS[activeProvider].fullName}...
            </span>
            <span className="font-mono text-[#0E2238] font-bold">{scanProgress}%</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className="bg-[#2BB5A0] h-full rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>

          <div className="text-xs text-slate-600 font-mono flex items-center gap-2">
            <span className="text-[#2BB5A0] font-bold">&gt;</span>
            <span>{scanStepLabel}</span>
          </div>
        </div>
      )}

      {/* Scan Results Viewport */}
      {scanResult && !isScanning && (
        <div className="space-y-6">
          {/* Cross-Cloud Migration Arbitrage Callout */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="rm-kicker">02 / Multi-Cloud Arbitrage Discovery</span>
                <h3 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D79A45] shrink-0" />
                  Cross-Cloud Parity Findings for {scanResult.accountIdentifier}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-emerald-900 font-semibold text-xs px-3 py-1 rounded-md bg-emerald-100 border border-emerald-300">
                  Save ${scanResult.crossCloudSavings.monthlySavingsVsCurrent.toLocaleString()}/mo ({scanResult.crossCloudSavings.percentageSavings}% drop)
                </span>
                <button
                  type="button"
                  onClick={handleImportInventory}
                  className="xh-btn primary"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Import Specs into Calculator</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              If your current {CLOUD_PROVIDERS[scanResult.provider].name} inventory ({scanResult.discoveredInventory.instanceCount} instances, {scanResult.discoveredInventory.dbCount} databases, and {scanResult.discoveredInventory.storageGb} GB storage) is mapped to equivalent instances on <strong>{CLOUD_PROVIDERS[scanResult.crossCloudSavings.cheapestProvider].fullName}</strong>, your monthly bill drops from <span className="font-mono text-[#0E2238] font-semibold">${scanResult.totalMonthlySpend.toLocaleString()}/mo</span> to <span className="font-mono text-emerald-800 font-semibold">${scanResult.crossCloudSavings.cheapestMonthlyCost.toLocaleString()}/mo</span>, generating approximately <strong className="text-emerald-800 font-mono">${scanResult.crossCloudSavings.annualSavingsVsCurrent.toLocaleString()}</strong> in annual run-rate savings.
            </p>
          </div>

          {/* Discovered Resources Inventory Table */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="rm-kicker">03 / Resource Utilization &amp; Right-Sizing Ledger</span>
                <h3 className="text-lg font-semibold text-[#0E2238]">
                  Discovered Cloud Resources &amp; Sizing Telemetry
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live CPU telemetry measured across the last 30 days of active runtime.
                </p>
              </div>

              <span className="text-xs text-slate-500 font-mono">
                {scanResult.resourceList.length} audited items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-3.5 px-6">Resource ID / Name</th>
                    <th className="py-3.5 px-6">Type &amp; SKU</th>
                    <th className="py-3.5 px-6 text-center">Avg CPU</th>
                    <th className="py-3.5 px-6 text-right">Current Spend</th>
                    <th className="py-3.5 px-6">Right-Sizing Recommendation</th>
                    <th className="py-3.5 px-6 text-right">Optimized Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                  {scanResult.resourceList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-sans">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.id}</div>
                      </td>

                      <td className="py-3.5 px-6 text-slate-700">
                        <div className="font-mono text-slate-900">{item.sku}</div>
                        <div className="text-[11px] text-slate-500 font-sans capitalize">{item.type}</div>
                      </td>

                      <td className="py-3.5 px-6 text-center">
                        {item.avgCpuUtilizationPct > 0 ? (
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                              item.avgCpuUtilizationPct < 20
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.avgCpuUtilizationPct}%
                          </span>
                        ) : (
                          <span className="text-red-700 font-bold text-[11px]">0% (Idle)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right text-slate-800">
                        ${item.provisionedCostMonthly.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-6 font-sans">
                        {item.isOverProvisioned ? (
                          <div className="text-emerald-800 font-semibold flex items-center gap-1.5">
                            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.rightSizedSku}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Optimally sized</span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        {item.rightSizedCostMonthly !== undefined ? (
                          <span className="text-emerald-800 font-bold font-mono">
                            ${item.rightSizedCostMonthly.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">
                            ${item.provisionedCostMonthly.toFixed(2)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Security & Zero Data Storage Trust Box */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3.5">
          <ShieldCheck className="w-8 h-8 text-[#3E6E86] shrink-0" />
          <div className="space-y-0.5">
            <h4 className="font-semibold text-[#0E2238] text-sm font-sans">
              Enterprise FinOps Security &amp; Least Privilege Guarantee
            </h4>
            <p className="text-slate-600">
              Maniq CloudParity operates exclusively with read-only permissions (<code>DescribeInstances</code>, <code>GetMetricData</code>, <code>ce:GetCostAndUsage</code>). No modification permissions, access to data volumes, or root keys are ever requested.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCredModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-[#0E2238] bg-[#F3F5F1] hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          View IAM Policy Template
        </button>
      </div>

      {/* Credentials Configuration Modal */}
      {isCredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F3F5F1]">
              <div>
                <h3 className="text-base font-semibold text-[#0E2238]">
                  Configure {CLOUD_PROVIDERS[activeProvider].fullName} Live Connection
                </h3>
                <p className="text-xs text-slate-600">
                  Read-only credentials for automated telemetry and inventory discovery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCredModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 p-1 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
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
                    className="w-full bg-[#F3F5F1] border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-[#0E2238]"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
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
                    className="w-full bg-[#F3F5F1] border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-[#0E2238]"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Target Region</label>
                  <input
                    type="text"
                    value={credentialForm.region}
                    onChange={(e) =>
                      setCredentialForm({ ...credentialForm, region: e.target.value })
                    }
                    className="w-full bg-[#F3F5F1] border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-[#0E2238]"
                  />
                </div>
              </div>

              {/* IAM Policy Template Box */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#0E2238] font-semibold">
                    {IAM_POLICY_TEMPLATES[activeProvider].title}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPolicy}
                    className="flex items-center gap-1 text-[11px] font-medium text-[#3E6E86] hover:text-[#0E2238] cursor-pointer"
                  >
                    {copiedPolicy ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPolicy ? 'Copied!' : 'Copy Policy JSON'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#081420] rounded-lg border border-slate-800 text-[11px] font-mono text-[#EEF3F1] overflow-x-auto max-h-40">
                  {IAM_POLICY_TEMPLATES[activeProvider].policyJson}
                </pre>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-[#F3F5F1] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCredModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCredModalOpen(false);
                  handleRunScan();
                }}
                className="xh-btn primary"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Save &amp; Test Live Scan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
