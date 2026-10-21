export type CloudProviderId = 'aws' | 'azure' | 'gcp';

export interface CloudProviderInfo {
  id: CloudProviderId;
  name: string;
  fullName: string;
  brandColor: string;
  logoBg: string;
  badgeBorder: string;
  defaultRegion: string;
}

export type WorkloadPresetId = 
  | 'saas-microservices'
  | 'data-ai-workload'
  | 'enterprise-db'
  | 'startup-web'
  | 'custom';

export interface WorkloadPreset {
  id: WorkloadPresetId;
  name: string;
  description: string;
  specs: WorkloadConfig;
}

export interface WorkloadConfig {
  region: 'us-east' | 'us-west' | 'eu-west' | 'ap-southeast';
  os: 'linux' | 'windows';
  commitment: 'on-demand' | '1yr-reserved' | '3yr-reserved' | 'spot';
  // Compute
  vCpu: number;
  ramGb: number;
  instanceCount: number;
  // Storage
  blockStorageGb: number;
  blockStorageTier: 'standard-ssd' | 'provisioned-iops' | 'extreme-iops';
  objectStorageTb: number;
  objectStorageTier: 'hot' | 'cool' | 'archive';
  // Database
  dbEngine: 'postgres' | 'mysql' | 'serverless';
  dbCpu: number;
  dbRamGb: number;
  dbStorageGb: number;
  dbMultiAz: boolean;
  // Networking
  egressTb: number;
  // Kubernetes
  k8sClusterCount: number;
  k8sNodeCount: number;
  // AI Accelerators
  gpuType: 'none' | 't4' | 'l4' | 'a100' | 'h100';
  gpuCount: number;
}

export interface ServiceCostBreakdown {
  compute: number;
  blockStorage: number;
  objectStorage: number;
  database: number;
  networking: number;
  kubernetes: number;
  gpu: number;
  support: number;
  totalMonthly: number;
  totalAnnual: number;
}

export interface ProviderComparisonResult {
  provider: CloudProviderInfo;
  costs: ServiceCostBreakdown;
  equivalentInstances: {
    compute: string;
    database: string;
    storage: string;
    k8sService: string;
  };
  effectiveHourlyRate: number;
  savingsVsHighest: number;
  savingsPercentage: number;
  isLowestCost: boolean;
}

export interface PerformanceMetric {
  category: string;
  metric: string;
  unit: string;
  higherIsBetter: boolean;
  awsValue: number | string;
  azureValue: number | string;
  gcpValue: number | string;
  description: string;
}

export interface QuarterlyData {
  quarter: string; // e.g., 'Q1 2026', 'Q2 2026'
  aws: number;
  azure: number;
  gcp: number;
  seasonalityMultiplier: number;
  eventDescription: string;
}

export interface HistoricalPricePoint {
  year: number;
  metric: string; // e.g. "vCPU-hour equivalent ($)", "GB SSD Storage ($/mo)"
  aws: number;
  azure: number;
  gcp: number;
}

export interface AnomalyAlert {
  id: string;
  timestamp: string;
  provider: CloudProviderId;
  severity: 'low' | 'medium' | 'high';
  service: string;
  region: string;
  title: string;
  description: string;
  impactAmount: number;
}

export interface RealtimeTelemetry {
  currentSpendMonthToDate: number;
  projectedMonthEnd: number;
  monthlyBudget: number;
  burnRateHourly: number;
  dailyTrend: number; // percentage change vs last day
  activeInstances: number;
  anomalies: AnomalyAlert[];
  regionDistribution: { region: string; percentage: number; cost: number }[];
  serviceDistribution: { service: string; percentage: number; cost: number }[];
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface CloudCredentialConfig {
  provider: CloudProviderId;
  accountId: string; // AWS Account ID, Azure Subscription ID, or GCP Project ID
  roleArnOrKey: string; // AWS Role ARN, Azure Client Secret, GCP Service Account
  tenantOrOrg?: string; // Azure Tenant ID or GCP Org ID
  region: string;
  authMethod: 'iam-role' | 'service-principal' | 'service-account' | 'api-key';
}

export interface DiscoveredResourceItem {
  id: string;
  name: string;
  type: 'compute' | 'database' | 'storage' | 'network';
  sku: string;
  vCpu: number;
  ramGb: number;
  avgCpuUtilizationPct: number;
  provisionedCostMonthly: number;
  isOverProvisioned: boolean;
  rightSizedSku?: string;
  rightSizedCostMonthly?: number;
}

export interface LiveAssessmentScanResult {
  provider: CloudProviderId;
  scanTimestamp: string;
  accountIdentifier: string;
  activeRegion: string;
  totalMonthlySpend: number;
  discoveredInventory: {
    instanceCount: number;
    totalVcpu: number;
    totalRamGb: number;
    storageGb: number;
    dbCount: number;
    dbVcpu: number;
    dbRamGb: number;
    egressTbMonth: number;
  };
  resourceList: DiscoveredResourceItem[];
  idleWasteCostMonthly: number;
  overProvisionedPct: number;
  rightSizingSavingsMonthly: number;
  crossCloudSavings: {
    cheapestProvider: CloudProviderId;
    cheapestMonthlyCost: number;
    monthlySavingsVsCurrent: number;
    annualSavingsVsCurrent: number;
    percentageSavings: number;
  };
}
