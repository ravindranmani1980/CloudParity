export type CloudProviderId = 'aws' | 'azure' | 'gcp';

export type CloudRegionId =
  | 'us-east'
  | 'us-west'
  | 'eu-west'
  | 'ap-southeast'
  | 'ap-northeast'
  | 'sa-east';

export interface CloudRegionInfo {
  id: CloudRegionId;
  name: string;
  shortName: string;
  continent: string;
  providerZones: Record<CloudProviderId, string>;
  priceMultipliers: Record<CloudProviderId, number>;
  intraAzLatencyMs: Record<CloudProviderId, number>;
  clientEdgeRttMs: Record<CloudProviderId, number>;
  crossRegionRttFromUsEastMs: Record<CloudProviderId, number>;
  crossRegionReplicationPerGb: Record<CloudProviderId, number>;
}

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
  region: CloudRegionId;
  regions: CloudRegionId[];
  multiRegionMode?: 'traffic-split' | 'active-active-replica';
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
  crossRegionReplication: number;
  kubernetes: number;
  gpu: number;
  support: number;
  totalMonthly: number;
  totalAnnual: number;
}

export interface RegionalProviderBreakdown {
  regionId: CloudRegionId;
  regionName: string;
  shortName: string;
  providerZone: string;
  isSelected: boolean;
  weightPct: number;
  priceMultiplier: number;
  pricePremiumPct: number;
  allocatedMonthlyCost: number;
  standaloneMonthlyCost: number;
  intraAzLatencyMs: number;
  clientEdgeRttMs: number;
  crossRegionRttMs: number;
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
  blendedRegionMultiplier: number;
  avgClientRttMs: number;
  avgIntraAzLatencyMs: number;
  regionalBreakdown: RegionalProviderBreakdown[];
}

export interface RegionalComparisonSummaryRow {
  region: CloudRegionInfo;
  isSelected: boolean;
  weightPct: number;
  allocatedCosts: Record<CloudProviderId, number>;
  standaloneCosts: Record<CloudProviderId, number>;
  pricePremiumPct: Record<CloudProviderId, number>;
  clientEdgeRttMs: Record<CloudProviderId, number>;
  intraAzLatencyMs: Record<CloudProviderId, number>;
  cheapestProvider: CloudProviderId;
  fastestLatencyProvider: CloudProviderId;
  maxRegionalSpreadMonthly: number;
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
  quarter: string;
  aws: number;
  azure: number;
  gcp: number;
  seasonalityMultiplier: number;
  eventDescription: string;
}

export interface HistoricalPricePoint {
  year: number;
  metric: string;
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
  dailyTrend: number;
  activeInstances: number;
  anomalies: AnomalyAlert[];
  regionDistribution: { region: string; percentage: number; cost: number }[];
  serviceDistribution: { service: string; percentage: number; cost: number }[];
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface CloudCredentialConfig {
  provider: CloudProviderId;
  accountId: string;
  roleArnOrKey: string;
  tenantOrOrg?: string;
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
