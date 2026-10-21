import { CloudProviderInfo, PerformanceMetric, HistoricalPricePoint, WorkloadPreset } from '../types/cloud';

export const CLOUD_PROVIDERS: Record<'aws' | 'azure' | 'gcp', CloudProviderInfo> = {
  aws: {
    id: 'aws',
    name: 'AWS',
    fullName: 'Amazon Web Services',
    brandColor: '#FF9900',
    logoBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    badgeBorder: 'border-amber-500/30 text-amber-300',
    defaultRegion: 'us-east-1 (N. Virginia)',
  },
  azure: {
    id: 'azure',
    name: 'Azure',
    fullName: 'Microsoft Azure',
    brandColor: '#0089D6',
    logoBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    badgeBorder: 'border-sky-500/30 text-sky-300',
    defaultRegion: 'East US (Virginia)',
  },
  gcp: {
    id: 'gcp',
    name: 'GCP',
    fullName: 'Google Cloud Platform',
    brandColor: '#4285F4',
    logoBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    badgeBorder: 'border-blue-500/30 text-blue-300',
    defaultRegion: 'us-central1 (Iowa)',
  },
};

// Regional pricing multipliers relative to US East baseline
export const REGION_MULTIPLIERS: Record<string, Record<'aws' | 'azure' | 'gcp', number>> = {
  'us-east': { aws: 1.0, azure: 1.0, gcp: 1.0 },
  'us-west': { aws: 1.04, azure: 1.03, gcp: 1.02 },
  'eu-west': { aws: 1.08, azure: 1.09, gcp: 1.07 },
  'ap-southeast': { aws: 1.15, azure: 1.14, gcp: 1.12 },
};

// Commitment discounts multiplier (percentage of on-demand cost)
export const COMMITMENT_MULTIPLIERS = {
  'on-demand': { aws: 1.0, azure: 1.0, gcp: 1.0 },
  '1yr-reserved': { aws: 0.65, azure: 0.62, gcp: 0.63 }, // ~35-38% discount
  '3yr-reserved': { aws: 0.42, azure: 0.40, gcp: 0.41 }, // ~58-60% discount
  'spot': { aws: 0.28, azure: 0.26, gcp: 0.25 }, // ~72-75% discount
};

// Base unit rates per hour or per GB/TB in US East (Baseline 2026 enterprise standard pricing)
export const BASE_PRICING = {
  // Compute rates: per vCPU-hour, per GB RAM-hour
  compute: {
    aws: {
      vCpuHour: 0.0345, // roughly m6i baseline (~$0.096/hr for 2vCPU 8GB)
      ramGbHour: 0.0046,
      windowsSurchargePerHour: 0.046,
    },
    azure: {
      vCpuHour: 0.0332, // roughly Dsv5 baseline
      ramGbHour: 0.0044,
      windowsSurchargePerHour: 0.044,
    },
    gcp: {
      vCpuHour: 0.0316, // roughly N2 standard / E2 standard baseline
      ramGbHour: 0.0042,
      windowsSurchargePerHour: 0.042,
    },
  },
  // Block Storage: $/GB/month
  blockStorage: {
    'standard-ssd': { aws: 0.08, azure: 0.076, gcp: 0.08 }, // gp3, Standard SSD, pd-balanced
    'provisioned-iops': { aws: 0.125, azure: 0.13, gcp: 0.12 }, // io2, Premium SSD v2, pd-ssd
    'extreme-iops': { aws: 0.24, azure: 0.26, gcp: 0.22 }, // io2 Block Express, Ultra Disk, pd-extreme
  },
  // Object Storage: $/TB/month
  objectStorage: {
    hot: { aws: 23.0, azure: 20.8, gcp: 20.0 }, // S3 Standard, Blob Hot, Cloud Storage Standard
    cool: { aws: 12.5, azure: 10.0, gcp: 10.0 }, // S3 Infrequent, Blob Cool, Cloud Storage Nearline
    archive: { aws: 4.0, azure: 2.0, gcp: 2.5 }, // Glacier Instant, Blob Archive, Cloud Storage Archive
  },
  // Managed Relational Database: multiplier on raw compute + DB license & storage
  database: {
    engineMultiplier: {
      postgres: 1.35,
      mysql: 1.35,
      serverless: 1.45,
    },
    storagePerGb: { aws: 0.115, azure: 0.115, gcp: 0.11 },
    multiAzMultiplier: 1.95,
  },
  // Networking Egress: $/TB (blended average above initial free tier)
  networkingEgress: {
    aws: 88.0, // ~$0.088/GB for first 40TB
    azure: 85.0, // ~$0.085/GB
    gcp: 82.0, // ~$0.082/GB Premium tier
  },
  // Kubernetes Control Plane: $/month
  kubernetesControlPlane: {
    aws: 73.0, // EKS $0.10/hr = ~$73/mo per cluster
    azure: 0.0, // AKS Free tier cluster management (standard SLA optional $73)
    gcp: 73.0, // GKE $0.10/hr per cluster beyond free 1st cluster credit
  },
  // GPU Accelerators ($/GPU-hour)
  gpuHourly: {
    t4: { aws: 0.526, azure: 0.51, gcp: 0.45 },
    l4: { aws: 0.85, azure: 0.82, gcp: 0.70 },
    a100: { aws: 3.67, azure: 3.40, gcp: 3.25 },
    h100: { aws: 6.95, azure: 7.10, gcp: 6.20 },
  },
  // Enterprise Support Tier: % of total monthly infrastructure spend
  supportPercentage: {
    aws: 0.07, // 7% business support
    azure: 0.06, // 6% standard/professional direct
    gcp: 0.065, // 6.5% enhanced support
  },
};

// Preset Architecture Configurations
export const WORKLOAD_PRESETS: WorkloadPreset[] = [
  {
    id: 'saas-microservices',
    name: 'SaaS Microservices Web Scale',
    description: 'High-availability containerized microservices with managed Postgres, Redis, and high egress.',
    specs: {
      region: 'us-east',
      os: 'linux',
      commitment: '1yr-reserved',
      vCpu: 64,
      ramGb: 256,
      instanceCount: 8,
      blockStorageGb: 1200,
      blockStorageTier: 'provisioned-iops',
      objectStorageTb: 8,
      objectStorageTier: 'hot',
      dbEngine: 'postgres',
      dbCpu: 16,
      dbRamGb: 64,
      dbStorageGb: 800,
      dbMultiAz: true,
      egressTb: 25,
      k8sClusterCount: 1,
      k8sNodeCount: 8,
      gpuType: 'none',
      gpuCount: 0,
    },
  },
  {
    id: 'data-ai-workload',
    name: 'AI Inference & Data Pipeline',
    description: 'GPU-accelerated vector search, model fine-tuning, and large petabyte-scale lakehouse.',
    specs: {
      region: 'us-east',
      os: 'linux',
      commitment: '1yr-reserved',
      vCpu: 96,
      ramGb: 384,
      instanceCount: 6,
      blockStorageGb: 3000,
      blockStorageTier: 'extreme-iops',
      objectStorageTb: 50,
      objectStorageTier: 'cool',
      dbEngine: 'postgres',
      dbCpu: 32,
      dbRamGb: 128,
      dbStorageGb: 2000,
      dbMultiAz: true,
      egressTb: 40,
      k8sClusterCount: 1,
      k8sNodeCount: 6,
      gpuType: 'a100',
      gpuCount: 4,
    },
  },
  {
    id: 'enterprise-db',
    name: 'Enterprise ERP & High-Throughput DB',
    description: 'Mission-critical database tier with Windows Server support, multi-region replication, and ultra disks.',
    specs: {
      region: 'us-east',
      os: 'windows',
      commitment: '3yr-reserved',
      vCpu: 128,
      ramGb: 512,
      instanceCount: 4,
      blockStorageGb: 4000,
      blockStorageTier: 'extreme-iops',
      objectStorageTb: 20,
      objectStorageTier: 'cool',
      dbEngine: 'postgres',
      dbCpu: 64,
      dbRamGb: 256,
      dbStorageGb: 3500,
      dbMultiAz: true,
      egressTb: 15,
      k8sClusterCount: 0,
      k8sNodeCount: 0,
      gpuType: 'none',
      gpuCount: 0,
    },
  },
  {
    id: 'startup-web',
    name: 'Startup MVP / API Backend',
    description: 'Lean web application tier with modest database and container cluster optimized for low burn rate.',
    specs: {
      region: 'us-east',
      os: 'linux',
      commitment: 'on-demand',
      vCpu: 16,
      ramGb: 64,
      instanceCount: 2,
      blockStorageGb: 300,
      blockStorageTier: 'standard-ssd',
      objectStorageTb: 2,
      objectStorageTier: 'hot',
      dbEngine: 'postgres',
      dbCpu: 4,
      dbRamGb: 16,
      dbStorageGb: 150,
      dbMultiAz: false,
      egressTb: 5,
      k8sClusterCount: 1,
      k8sNodeCount: 2,
      gpuType: 'none',
      gpuCount: 0,
    },
  },
];

// Detailed Performance Benchmarks
export const PERFORMANCE_BENCHMARKS: PerformanceMetric[] = [
  {
    category: 'Compute & CPU',
    metric: 'Geekbench 6 Multi-Core Per $1/hr',
    unit: 'Score / $',
    higherIsBetter: true,
    awsValue: 1420,
    azureValue: 1390,
    gcpValue: 1510,
    description: 'Efficiency metric calculated on general-purpose 16vCPU instance families (AWS m6i vs Azure D16sv5 vs GCP n2-standard-16).',
  },
  {
    category: 'Compute & CPU',
    metric: 'Memory Bandwidth (STREAM)',
    unit: 'GB/s',
    higherIsBetter: true,
    awsValue: 204.5,
    azureValue: 198.2,
    gcpValue: 216.0,
    description: 'Aggregate memory throughput for high-performance memory-bound calculations on 4th Gen Xeon/EPYC processors.',
  },
  {
    category: 'Storage & I/O',
    metric: 'Max Block Storage IOPS (Tier 2)',
    unit: 'IOPS',
    higherIsBetter: true,
    awsValue: 64000,
    azureValue: 80000,
    gcpValue: 100000,
    description: 'Maximum guaranteed IOPS for enterprise SSD storage volumes (AWS io2 vs Azure Ultra Disk vs GCP Hyperdisk Extreme).',
  },
  {
    category: 'Storage & I/O',
    metric: 'Storage Read Latency p99',
    unit: 'ms',
    higherIsBetter: false,
    awsValue: 0.85,
    azureValue: 0.92,
    gcpValue: 0.78,
    description: '99th percentile random 4KB read latency measured in identical primary US East zones.',
  },
  {
    category: 'Networking',
    metric: 'Intra-Region Latency p99',
    unit: 'ms',
    higherIsBetter: false,
    awsValue: 0.62,
    azureValue: 0.71,
    gcpValue: 0.54,
    description: 'Inter-zone round-trip time across primary availability zones using Andromeda/Jupiter SDN backbones.',
  },
  {
    category: 'Networking',
    metric: 'Max VM Network Egress Bandwidth',
    unit: 'Gbps',
    higherIsBetter: true,
    awsValue: 32.0,
    azureValue: 30.0,
    gcpValue: 50.0,
    description: 'Peak provisioned network interface bandwidth for 16vCPU instance classes with accelerated networking enabled.',
  },
  {
    category: 'Reliability & SLA',
    metric: 'Multi-AZ Compute Uptime SLA',
    unit: '%',
    higherIsBetter: true,
    awsValue: '99.99%',
    azureValue: '99.99%',
    gcpValue: '99.99%',
    description: 'Contractual monthly uptime commitment with standard service credit escalations.',
  },
  {
    category: 'Sustainability',
    metric: 'Carbon Efficiency Index (US East)',
    unit: 'gCO2e/kWh',
    higherIsBetter: false,
    awsValue: 312,
    azureValue: 285,
    gcpValue: 240,
    description: 'Average grid carbon intensity factor with matched renewable energy certificates (GCP has 24/7 carbon-free energy pledge).',
  },
];

// Historical Data Points (2022 - 2026) for price trend tracking
export const HISTORICAL_PRICE_TRENDS: {
  year: number;
  computeCostPerHour: { aws: number; azure: number; gcp: number };
  storageCostPerGb: { aws: number; azure: number; gcp: number };
  egressCostPerTb: { aws: number; azure: number; gcp: number };
}[] = [
  {
    year: 2022,
    computeCostPerHour: { aws: 0.046, azure: 0.044, gcp: 0.041 },
    storageCostPerGb: { aws: 0.10, azure: 0.095, gcp: 0.095 },
    egressCostPerTb: { aws: 105, azure: 98, gcp: 95 },
  },
  {
    year: 2023,
    computeCostPerHour: { aws: 0.042, azure: 0.040, gcp: 0.038 },
    storageCostPerGb: { aws: 0.095, azure: 0.090, gcp: 0.090 },
    egressCostPerTb: { aws: 98, azure: 92, gcp: 90 },
  },
  {
    year: 2024,
    computeCostPerHour: { aws: 0.039, azure: 0.037, gcp: 0.035 },
    storageCostPerGb: { aws: 0.090, azure: 0.084, gcp: 0.085 },
    egressCostPerTb: { aws: 92, azure: 88, gcp: 85 },
  },
  {
    year: 2025,
    computeCostPerHour: { aws: 0.036, azure: 0.0345, gcp: 0.033 },
    storageCostPerGb: { aws: 0.085, azure: 0.080, gcp: 0.082 },
    egressCostPerTb: { aws: 90, azure: 86, gcp: 83 },
  },
  {
    year: 2026,
    computeCostPerHour: { aws: 0.0345, azure: 0.0332, gcp: 0.0316 },
    storageCostPerGb: { aws: 0.080, azure: 0.076, gcp: 0.080 },
    egressCostPerTb: { aws: 88, azure: 85, gcp: 82 },
  },
];
