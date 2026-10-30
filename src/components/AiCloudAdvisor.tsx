import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Brain,
  Cpu,
  Layers,
  Zap,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { WorkloadConfig, ProviderComparisonResult } from '../types/cloud';

interface AiCloudAdvisorProps {
  config: WorkloadConfig;
  results: ProviderComparisonResult[];
}

export const AiCloudAdvisor: React.FC<AiCloudAdvisorProps> = ({
  config,
  results,
}) => {
  const [promptInput, setPromptInput] = useState<string>('');
  const [analysisOutput, setAnalysisOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const lowest = results.find((r) => r.isLowestCost);

  const handleGenerateAdvice = async (customPrompt?: string) => {
    setIsLoading(true);

    const query = customPrompt || promptInput || 'Evaluate current workload architecture and optimize total cost of ownership across AWS, Azure, and GCP.';

    const systemPrompt = `You are a Principal Cloud Enterprise Architect & FinOps Specialist for Maniq CloudParity.
Analyze the following multi-cloud infrastructure requirements and cost models:
- Active Regions: ${(config.regions && config.regions.length > 0 ? config.regions : [config.region]).join(', ')} (${(config.regions?.length ?? 1) > 1 ? config.multiRegionMode || 'traffic-split' : 'single-region'})
- OS: ${config.os}
- Commitment Term: ${config.commitment}
- Primary Compute: ${config.instanceCount}x instances (${config.vCpu} vCPU, ${config.ramGb} GB RAM each)
- Storage: ${config.blockStorageGb} GB Block (${config.blockStorageTier}), ${config.objectStorageTb} TB Object (${config.objectStorageTier})
- Database: ${config.dbEngine.toUpperCase()} (${config.dbCpu} vCPU, ${config.dbRamGb} GB RAM, ${config.dbStorageGb} GB Storage, Multi-AZ: ${config.dbMultiAz})
- Monthly Egress: ${config.egressTb} TB/month
- Kubernetes: ${config.k8sClusterCount} cluster(s), ${config.k8sNodeCount} worker node(s)
- AI Accelerators: ${config.gpuType !== 'none' ? `${config.gpuCount}x ${config.gpuType.toUpperCase()}` : 'None'}

Current calculated monthly costs:
- AWS: $${results.find((r) => r.provider.id === 'aws')?.costs.totalMonthly.toLocaleString()}/mo
- Azure: $${results.find((r) => r.provider.id === 'azure')?.costs.totalMonthly.toLocaleString()}/mo
- GCP: $${results.find((r) => r.provider.id === 'gcp')?.costs.totalMonthly.toLocaleString()}/mo
- Current Lowest-Cost: ${lowest?.provider.fullName} (saving $${lowest?.savingsVsHighest.toLocaleString()}/mo)

User Question / Scenario: "${query}"

Provide a concise, high-impact executive architectural advisory report structured with:
1. Executive Decision & Hyperscaler Recommendation (Which cloud provider wins and why)
2. Specific SKU & Instance Family Advice (e.g., Graviton/Axion ARM vs x86, ephemeral local NVMe vs persistent disk)
3. FinOps Savings Levers (Spot orchestration, Compute Savings Plans vs CUDs, egress optimization via CDN)
4. Hidden Costs & Gotchas (NAT Gateway data processing, Inter-AZ replication latency/fees, snapshot storage).
Keep formatting clean, professional, and dense with concrete numbers and engineering reasoning.`;

    try {
      const apiKey =
        (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
        (import.meta as any).env?.VITE_GEMINI_API_KEY ||
        '';

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        await new Promise((r) => setTimeout(r, 800));
        setAnalysisOutput(generateAlgorithmicAdvisory(config, results));
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: systemPrompt,
      });

      if (response.text) {
        setAnalysisOutput(response.text);
      } else {
        setAnalysisOutput(generateAlgorithmicAdvisory(config, results));
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to local analytical engine:', err);
      setAnalysisOutput(generateAlgorithmicAdvisory(config, results));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Signature Postrix XH-Panel Executive Banner */}
      <section className="xh-panel">
        <div className="xh-kicker">
          <span className="k">AI Cloud Architecture &amp; FinOps Remediation Blueprints</span>
          <span className="tag">Gemini 3.8 Flash · SKU Optimization · Egress &amp; Silicon Advisory</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-[#C9D3D9]/12">
          <div className="flex items-center gap-3.5">
            <div className="rm-mono-mark !w-11 !h-11 !text-base" aria-hidden="true">
              RM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#EEF3F1] leading-snug m-0 font-sans">
                AI Cloud Architecture &amp; FinOps Advisor
                <span className="block font-mono font-normal text-xs text-[#A9B7BF] mt-0.5">
                  Evaluate multi-cloud trade-offs, custom ARM silicon migration, and hidden architectural gotchas
                </span>
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGenerateAdvice()}
            disabled={isLoading}
            className="xh-btn primary disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Analyze Current Sizing</span>
          </button>
        </div>

        {/* 3 Permanent Architecture Insights inside XH-Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-5">
          <div className="xh-metric">
            <div className="lbl">
              <span>01 · Custom ARM Silicon</span>
              <span className="text-[#5FD3BF]">+18–22% Perf/$</span>
            </div>
            <div className="num text-base font-sans font-semibold text-[#EEF3F1]">
              Graviton4 · Axion · Cobalt
            </div>
            <p>
              Transitioning stateless services from x86 to ARM yields immediate compute savings with lower thermal draw.
            </p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>02 · Storage Lifecycle Tiering</span>
              <span className="text-[#EBC385]">-55% Bucket Cost</span>
            </div>
            <div className="num text-base font-sans font-semibold text-[#EEF3F1]">
              {config.objectStorageTb} TB Object Policy
            </div>
            <p>
              Transitioning objects older than 30 days to Cool / Nearline / Glacier Instant cuts raw storage overhead in half.
            </p>
          </div>

          <div className="xh-metric">
            <div className="lbl">
              <span>03 · Egress &amp; Edge Caching</span>
              <span className="text-[#5FD3BF]">-40% Egress Rate</span>
            </div>
            <div className="num text-base font-sans font-semibold text-[#EEF3F1]">
              {config.egressTb} TB/mo Bandwidth
            </div>
            <p>
              Routing outbound traffic through CloudFront, Cloud CDN, or Azure Front Door reduces per-GB egress tariffs.
            </p>
          </div>
        </div>
      </section>

      {/* Custom Prompt Input Box */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="rm-kicker">01 / Interactive FinOps Inquiry</span>
            <label className="text-base font-semibold text-[#0E2238] flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#3E6E86]" />
              Custom Architecture Question or Workload Constraint
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const q = 'How can we minimize egress costs and optimize multi-region database latency?';
                setPromptInput(q);
                handleGenerateAdvice(q);
              }}
              className="px-2.5 py-1 text-xs rounded-md bg-[#F3F5F1] border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Optimize Egress &amp; Multi-Region DB
            </button>
            <button
              type="button"
              onClick={() => {
                const q = 'Should we use Spot / Preemptible VMs for worker nodes and what is the fault tolerance risk?';
                setPromptInput(q);
                handleGenerateAdvice(q);
              }}
              className="px-2.5 py-1 text-xs rounded-md bg-[#F3F5F1] border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Spot Instances &amp; Fault Tolerance
            </button>
            <button
              type="button"
              onClick={() => {
                const q = 'Evaluate migrating from x86 Intel to custom ARM silicon (AWS Graviton vs GCP Axion vs Azure Cobalt).';
                setPromptInput(q);
                handleGenerateAdvice(q);
              }}
              className="px-2.5 py-1 text-xs rounded-md bg-[#F3F5F1] border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              x86 vs Custom ARM Silicon
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGenerateAdvice();
            }}
            placeholder="e.g., We run microservices on Kubernetes with a heavy read-write PostgreSQL database and need 99.99% uptime..."
            className="flex-1 bg-[#F3F5F1] border border-slate-300 text-xs text-slate-900 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#0E2238]"
          />
          <button
            type="button"
            onClick={() => handleGenerateAdvice()}
            disabled={isLoading}
            className="xh-btn primary disabled:opacity-50 shrink-0"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Consult AI</span>
          </button>
        </div>
      </section>

      {/* Analysis Output Container */}
      {analysisOutput && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="rm-kicker">02 / Architectural Remediation Deliverable</span>
              <h3 className="text-lg font-semibold text-[#0E2238] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D79A45]" />
                Architectural Advisory &amp; FinOps Analysis
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Evaluated for {lowest?.provider.fullName} vs Competitors
            </span>
          </div>

          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans bg-[#F3F5F1]/60 p-5 rounded-xl border border-slate-200">
            {analysisOutput}
          </div>
        </section>
      )}
    </div>
  );
};

function generateAlgorithmicAdvisory(
  config: WorkloadConfig,
  results: ProviderComparisonResult[]
): string {
  const lowest = results.find((r) => r.isLowestCost);
  const highest = results.reduce((prev, curr) =>
    curr.costs.totalMonthly > prev.costs.totalMonthly ? curr : prev
  );
  const savings = Math.max(0, highest.costs.totalMonthly - (lowest?.costs.totalMonthly ?? 0));
  const savingsAnnual = savings * 12;

  return `EXECUTIVE ARCHITECTURAL ADVISORY & FINOPS ASSESSMENT

1. HYPERSCALER TCO VERDICT:
- Recommended Primary Provider: ${lowest?.provider.fullName.toUpperCase()}
- Monthly Run-Rate: $${lowest?.costs.totalMonthly.toLocaleString()}/mo ($${lowest?.costs.totalAnnual.toLocaleString()}/yr)
- Net Financial Advantage: Saves ~$${savings.toLocaleString()}/mo (~$${savingsAnnual.toLocaleString()}/yr) compared to ${highest.provider.name} for equivalent vCPU, RAM, and IOPS specifications.
- Key Value Factor: ${lowest?.provider.id === 'gcp' ? 'GCP delivers superior sustained memory bandwidth and cost efficiency on standard compute (n2) with zero cluster management fees for primary GKE clusters.' : lowest?.provider.id === 'azure' ? 'Azure provides free control-plane tier on AKS and excellent cost parity for Enterprise SQL/PostgreSQL workloads.' : 'AWS provides unmatched mature ecosystem integration with Nitro-backed low tail latencies and granular Reserved Instance secondary marketplaces.'}

2. INSTANCE SIZING & SILICON RECOMMENDATIONS:
- Recommended Compute SKU: ${lowest?.equivalentInstances.compute}
- Architectural Recommendation: If your software runtime is language-interpreted or compiled for multi-arch (Node.js, Go, Python, Java 17+), consider adopting custom ARM silicon (AWS Graviton4 / GCP Axion / Azure Cobalt). This yields an immediate 18% to 22% reduction in compute line items without loss of single-thread IPC.
- Memory/vCPU Ratio: Current sizing provides ${(config.ramGb / config.vCpu).toFixed(1)} GB per vCPU. This falls right into standard general-purpose workload balance (1:4 ratio).

3. DATABASE & STORAGE OPTIMIZATION:
- Database Tier: Configured with ${config.dbCpu} vCPU, ${config.dbRamGb} GB RAM and ${config.dbStorageGb} GB storage (Multi-AZ: ${config.dbMultiAz ? 'Enabled' : 'Disabled'}).
- Storage Recommendation: For ${config.blockStorageGb} GB in the ${config.blockStorageTier} tier, ensure auto-scaling storage is enabled rather than statically over-provisioning max volumes.
- Object Storage: For ${config.objectStorageTb} TB of object storage, configure lifecycle rules to automatically transition cold objects after 30 days.

4. HIDDEN COST WARNINGS & GOTCHAS:
- NAT Gateways & Cross-AZ Egress: In multi-AZ deployments, data transfer between AZs costs $0.01/GB. For ${config.egressTb} TB egress, ensure microservices communicating internally use VPC peering or private service endpoints to avoid accidental public NAT processing charges ($0.045/GB).
- Kubernetes Management: While AKS offers a free cluster tier, AWS EKS and GCP GKE incur a $73/mo ($0.10/hr) control-plane charge per cluster. Consolidating environments onto fewer larger clusters with namespace isolation saves multiple cluster fees.
- Spot/Preemptible Potential: If your batch or background worker nodes can tolerate interruptions, leveraging Spot instances can reduce worker compute burn by 70–75%.`;
}
