import {
  WorkloadConfig,
  ProviderComparisonResult,
  QuarterlyData,
  CloudProviderId,
  ServiceCostBreakdown,
} from '../types/cloud';
import {
  CLOUD_PROVIDERS,
  BASE_PRICING,
  REGION_MULTIPLIERS,
  COMMITMENT_MULTIPLIERS,
} from '../data/cloudData';

const HOURS_PER_MONTH = 730;

export function calculateProviderCost(
  providerId: CloudProviderId,
  config: WorkloadConfig
): ServiceCostBreakdown {
  const regMult = REGION_MULTIPLIERS[config.region]?.[providerId] ?? 1.0;
  const commitMult = COMMITMENT_MULTIPLIERS[config.commitment]?.[providerId] ?? 1.0;

  // 1. Compute Cost
  const computeBase = BASE_PRICING.compute[providerId];
  let vCpuRate = computeBase.vCpuHour * config.vCpu;
  let ramRate = computeBase.ramGbHour * config.ramGb;
  let osRate = config.os === 'windows' ? computeBase.windowsSurchargePerHour * (config.vCpu / 2) : 0;
  
  const rawComputeHourly = (vCpuRate + ramRate + osRate) * config.instanceCount;
  const computeMonthly = rawComputeHourly * HOURS_PER_MONTH * regMult * commitMult;

  // 2. Block Storage
  const blockRatePerGb = BASE_PRICING.blockStorage[config.blockStorageTier][providerId];
  const blockStorageMonthly = config.blockStorageGb * blockRatePerGb * regMult;

  // 3. Object Storage
  const objectRatePerTb = BASE_PRICING.objectStorage[config.objectStorageTier][providerId];
  const objectStorageMonthly = config.objectStorageTb * objectRatePerTb * regMult;

  // 4. Managed Relational Database
  const dbEngineMult = BASE_PRICING.database.engineMultiplier[config.dbEngine] ?? 1.35;
  const dbMultiAzMult = config.dbMultiAz ? BASE_PRICING.database.multiAzMultiplier : 1.0;
  const dbComputeHourly = (computeBase.vCpuHour * config.dbCpu + computeBase.ramGbHour * config.dbRamGb) * dbEngineMult;
  const dbComputeMonthly = dbComputeHourly * HOURS_PER_MONTH * regMult * commitMult * dbMultiAzMult;
  const dbStorageMonthly = config.dbStorageGb * BASE_PRICING.database.storagePerGb[providerId] * regMult * (config.dbMultiAz ? 2 : 1);
  const databaseMonthly = dbComputeMonthly + dbStorageMonthly;

  // 5. Network Egress
  const egressRatePerTb = BASE_PRICING.networkingEgress[providerId];
  const networkingMonthly = config.egressTb * egressRatePerTb * regMult;

  // 6. Kubernetes Cluster Management
  const k8sBasePerCluster = BASE_PRICING.kubernetesControlPlane[providerId];
  const kubernetesMonthly = config.k8sClusterCount * k8sBasePerCluster;

  // 7. GPU Accelerators
  let gpuMonthly = 0;
  if (config.gpuType !== 'none' && config.gpuCount > 0) {
    const gpuRate = BASE_PRICING.gpuHourly[config.gpuType]?.[providerId] ?? 0;
    gpuMonthly = gpuRate * config.gpuCount * HOURS_PER_MONTH * regMult * commitMult;
  }

  // 8. Infrastructure Subtotal & Enterprise Support
  const subtotalMonthly = 
    computeMonthly +
    blockStorageMonthly +
    objectStorageMonthly +
    databaseMonthly +
    networkingMonthly +
    kubernetesMonthly +
    gpuMonthly;

  const supportMonthly = subtotalMonthly * BASE_PRICING.supportPercentage[providerId];
  const totalMonthly = subtotalMonthly + supportMonthly;
  const totalAnnual = totalMonthly * 12;

  return {
    compute: Math.round(computeMonthly * 100) / 100,
    blockStorage: Math.round(blockStorageMonthly * 100) / 100,
    objectStorage: Math.round(objectStorageMonthly * 100) / 100,
    database: Math.round(databaseMonthly * 100) / 100,
    networking: Math.round(networkingMonthly * 100) / 100,
    kubernetes: Math.round(kubernetesMonthly * 100) / 100,
    gpu: Math.round(gpuMonthly * 100) / 100,
    support: Math.round(supportMonthly * 100) / 100,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalAnnual: Math.round(totalAnnual * 100) / 100,
  };
}

export function getEquivalentInstanceNames(
  config: WorkloadConfig
): Record<CloudProviderId, { compute: string; database: string; storage: string; k8sService: string }> {
  const vCpu = config.vCpu;
  const ram = config.ramGb;
  const sizeSuffix = vCpu >= 64 ? '16xlarge' : vCpu >= 32 ? '8xlarge' : vCpu >= 16 ? '4xlarge' : vCpu >= 8 ? '2xlarge' : 'xlarge';

  return {
    aws: {
      compute: `EC2 m6i.${sizeSuffix} (${vCpu} vCPU, ${ram}GB)`,
      database: `RDS Aurora PostgreSQL db.r6g.${config.dbCpu >= 16 ? '4xlarge' : 'xlarge'}`,
      storage: config.blockStorageTier === 'extreme-iops' ? 'EBS io2 Block Express' : config.blockStorageTier === 'provisioned-iops' ? 'EBS io2 SSD' : 'EBS gp3 General Purpose',
      k8sService: 'Amazon Elastic Kubernetes Service (EKS)',
    },
    azure: {
      compute: `Virtual Machine D${vCpu}s_v5 (${vCpu} vCPU, ${ram}GB)`,
      database: `Azure Database for PostgreSQL Flexible Server (${config.dbCpu} vCPU)`,
      storage: config.blockStorageTier === 'extreme-iops' ? 'Ultra Disk SSD' : config.blockStorageTier === 'provisioned-iops' ? 'Premium SSD v2' : 'Standard SSD Managed Disk',
      k8sService: 'Azure Kubernetes Service (AKS)',
    },
    gcp: {
      compute: `Compute Engine n2-standard-${vCpu} (${vCpu} vCPU, ${ram}GB)`,
      database: `Cloud SQL Enterprise Plus (${config.dbCpu} vCPU, ${config.dbRamGb}GB RAM)`,
      storage: config.blockStorageTier === 'extreme-iops' ? 'Hyperdisk Extreme' : config.blockStorageTier === 'provisioned-iops' ? 'Hyperdisk Balanced / pd-ssd' : 'pd-balanced Standard',
      k8sService: 'Google Kubernetes Engine (GKE Autopilot/Standard)',
    },
  };
}

export function compareAllProviders(config: WorkloadConfig): ProviderComparisonResult[] {
  const providers: CloudProviderId[] = ['aws', 'azure', 'gcp'];
  const instanceNames = getEquivalentInstanceNames(config);

  const rawResults = providers.map((id) => {
    const costs = calculateProviderCost(id, config);
    return {
      provider: CLOUD_PROVIDERS[id],
      costs,
      equivalentInstances: instanceNames[id],
      effectiveHourlyRate: Math.round((costs.totalMonthly / HOURS_PER_MONTH) * 1000) / 1000,
    };
  });

  const highestMonthly = Math.max(...rawResults.map((r) => r.costs.totalMonthly));
  const lowestMonthly = Math.min(...rawResults.map((r) => r.costs.totalMonthly));

  return rawResults.map((r) => {
    const isLowestCost = r.costs.totalMonthly === lowestMonthly;
    const savingsVsHighest = Math.max(0, highestMonthly - r.costs.totalMonthly);
    const savingsPercentage = highestMonthly > 0 ? Math.round((savingsVsHighest / highestMonthly) * 100) : 0;

    return {
      ...r,
      savingsVsHighest: Math.round(savingsVsHighest * 100) / 100,
      savingsPercentage,
      isLowestCost,
    };
  });
}

// Generate quarterly billing distribution for the current year
export function getQuarterlyBillingData(config: WorkloadConfig): QuarterlyData[] {
  const results = compareAllProviders(config);
  const awsBase = results.find((r) => r.provider.id === 'aws')?.costs.totalMonthly ?? 1000;
  const azureBase = results.find((r) => r.provider.id === 'azure')?.costs.totalMonthly ?? 1000;
  const gcpBase = results.find((r) => r.provider.id === 'gcp')?.costs.totalMonthly ?? 1000;

  // Realistic quarters factoring in seasonal workload shifts:
  // Q1: Post-holiday baseline (3 months)
  // Q2: Spring release & scale (+6%)
  // Q3: Summer usage normalization (+10%)
  // Q4: High-volume peak & end-of-year batch jobs (+22%)
  const quarters = [
    {
      quarter: 'Q1 2026',
      mult: 1.0,
      eventDescription: 'Baseline infrastructure launch & new fiscal cycle',
    },
    {
      quarter: 'Q2 2026',
      mult: 1.07,
      eventDescription: 'Mid-year feature release & customer concurrency growth',
    },
    {
      quarter: 'Q3 2026',
      mult: 1.14,
      eventDescription: 'Data pipeline scale & international expansion',
    },
    {
      quarter: 'Q4 2026',
      mult: 1.25,
      eventDescription: 'Peak traffic surge & end-of-year batch indexing',
    },
  ];

  return quarters.map((q) => ({
    quarter: q.quarter,
    aws: Math.round(awsBase * 3 * q.mult),
    azure: Math.round(azureBase * 3 * q.mult),
    gcp: Math.round(gcpBase * 3 * q.mult),
    seasonalityMultiplier: q.mult,
    eventDescription: q.eventDescription,
  }));
}

// 12-Month to 36-Month Forecast with Growth & Commitment Amortization
export interface ForecastProjection {
  month: number;
  label: string;
  awsCost: number;
  azureCost: number;
  gcpCost: number;
  growthFactor: number;
}

export function generateForecastProjections(
  config: WorkloadConfig,
  annualGrowthRatePercent: number = 20,
  monthsCount: number = 12
): ForecastProjection[] {
  const results = compareAllProviders(config);
  const awsBase = results.find((r) => r.provider.id === 'aws')?.costs.totalMonthly ?? 1000;
  const azureBase = results.find((r) => r.provider.id === 'azure')?.costs.totalMonthly ?? 1000;
  const gcpBase = results.find((r) => r.provider.id === 'gcp')?.costs.totalMonthly ?? 1000;

  const monthlyGrowthRate = Math.pow(1 + annualGrowthRatePercent / 100, 1 / 12) - 1;

  const projections: ForecastProjection[] = [];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  for (let i = 1; i <= monthsCount; i++) {
    const factor = Math.pow(1 + monthlyGrowthRate, i - 1);
    const mIdx = (i - 1) % 12;
    const yearOffset = Math.floor((i - 1) / 12);
    const label = `${monthNames[mIdx]} '26${yearOffset > 0 ? ` +${yearOffset}y` : ''}`;

    projections.push({
      month: i,
      label,
      awsCost: Math.round(awsBase * factor),
      azureCost: Math.round(azureBase * factor),
      gcpCost: Math.round(gcpBase * factor),
      growthFactor: Math.round(factor * 100) / 100,
    });
  }

  return projections;
}
