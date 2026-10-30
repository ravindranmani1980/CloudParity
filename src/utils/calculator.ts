import {
  WorkloadConfig,
  ProviderComparisonResult,
  QuarterlyData,
  CloudProviderId,
  CloudRegionId,
  ServiceCostBreakdown,
  RegionalProviderBreakdown,
  RegionalComparisonSummaryRow,
} from '../types/cloud';
import {
  CLOUD_PROVIDERS,
  CLOUD_REGIONS,
  ALL_CLOUD_REGION_IDS,
  BASE_PRICING,
  REGION_MULTIPLIERS,
  COMMITMENT_MULTIPLIERS,
} from '../data/cloudData';

const HOURS_PER_MONTH = 730;

export function getActiveRegions(config: WorkloadConfig): CloudRegionId[] {
  if (config.regions && config.regions.length > 0) {
    return config.regions;
  }
  return [config.region || 'us-east'];
}

export function calculateSingleRegionProviderCost(
  providerId: CloudProviderId,
  config: WorkloadConfig,
  regionId: CloudRegionId
): ServiceCostBreakdown {
  const regMult = REGION_MULTIPLIERS[regionId]?.[providerId] ?? 1.0;
  const commitMult = COMMITMENT_MULTIPLIERS[config.commitment]?.[providerId] ?? 1.0;

  // 1. Compute Cost
  const computeBase = BASE_PRICING.compute[providerId];
  const vCpuRate = computeBase.vCpuHour * config.vCpu;
  const ramRate = computeBase.ramGbHour * config.ramGb;
  const osRate = config.os === 'windows' ? computeBase.windowsSurchargePerHour * (config.vCpu / 2) : 0;

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
    crossRegionReplication: 0,
    kubernetes: Math.round(kubernetesMonthly * 100) / 100,
    gpu: Math.round(gpuMonthly * 100) / 100,
    support: Math.round(supportMonthly * 100) / 100,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalAnnual: Math.round(totalAnnual * 100) / 100,
  };
}

export function calculateProviderCost(
  providerId: CloudProviderId,
  config: WorkloadConfig
): ServiceCostBreakdown {
  const activeRegions = getActiveRegions(config);
  const regionCount = activeRegions.length;
  const mode = config.multiRegionMode || 'traffic-split';
  // In traffic-split mode, each region carries 1/N of the workload; in active-active-replica mode, each region carries 100% replica
  const perRegionWeight = mode === 'active-active-replica' ? 1.0 : 1.0 / regionCount;

  let compute = 0;
  let blockStorage = 0;
  let objectStorage = 0;
  let database = 0;
  let networking = 0;
  let kubernetes = 0;
  let gpu = 0;

  activeRegions.forEach((regId) => {
    const single = calculateSingleRegionProviderCost(providerId, config, regId);
    compute += single.compute * perRegionWeight;
    blockStorage += single.blockStorage * perRegionWeight;
    objectStorage += single.objectStorage * perRegionWeight;
    database += single.database * perRegionWeight;
    networking += single.networking * perRegionWeight;
    // Kubernetes control plane runs at least 1 cluster per active region if k8sClusterCount > 0
    const k8sPerReg =
      config.k8sClusterCount > 0
        ? Math.max(
            BASE_PRICING.kubernetesControlPlane[providerId],
            single.kubernetes * perRegionWeight
          )
        : 0;
    kubernetes += k8sPerReg;
    gpu += single.gpu * perRegionWeight;
  });

  // Cross-region replication traffic when deployed across multiple regions
  // Replicating database WAL + object storage deltas across (N - 1) peer regions
  let crossRegionReplication = 0;
  if (regionCount > 1) {
    const syncedDataGbPerRegion =
      config.dbStorageGb * 0.35 + config.objectStorageTb * 1024 * 0.15 + config.egressTb * 1024 * 0.1;
    activeRegions.slice(1).forEach((regId) => {
      const repRate = CLOUD_REGIONS[regId]?.crossRegionReplicationPerGb[providerId] ?? 0.02;
      crossRegionReplication += syncedDataGbPerRegion * repRate;
    });
  }

  const subtotalMonthly =
    compute +
    blockStorage +
    objectStorage +
    database +
    networking +
    crossRegionReplication +
    kubernetes +
    gpu;

  const support = subtotalMonthly * BASE_PRICING.supportPercentage[providerId];
  const totalMonthly = subtotalMonthly + support;
  const totalAnnual = totalMonthly * 12;

  return {
    compute: Math.round(compute * 100) / 100,
    blockStorage: Math.round(blockStorage * 100) / 100,
    objectStorage: Math.round(objectStorage * 100) / 100,
    database: Math.round(database * 100) / 100,
    networking: Math.round(networking * 100) / 100,
    crossRegionReplication: Math.round(crossRegionReplication * 100) / 100,
    kubernetes: Math.round(kubernetes * 100) / 100,
    gpu: Math.round(gpu * 100) / 100,
    support: Math.round(support * 100) / 100,
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
  const activeRegions = getActiveRegions(config);
  const mode = config.multiRegionMode || 'traffic-split';
  const perRegionWeight = mode === 'active-active-replica' ? 1.0 : 1.0 / activeRegions.length;

  const rawResults = providers.map((id) => {
    const costs = calculateProviderCost(id, config);

    const regionalBreakdown: RegionalProviderBreakdown[] = ALL_CLOUD_REGION_IDS.map((regId) => {
      const regInfo = CLOUD_REGIONS[regId];
      const isSelected = activeRegions.includes(regId);
      const standalone = calculateSingleRegionProviderCost(id, config, regId);
      const weightPct = isSelected ? Math.round((100 / activeRegions.length) * 10) / 10 : 0;
      const allocatedMonthlyCost = isSelected
        ? Math.round(standalone.totalMonthly * perRegionWeight * 100) / 100
        : 0;
      const mult = regInfo.priceMultipliers[id];

      return {
        regionId: regId,
        regionName: regInfo.name,
        shortName: regInfo.shortName,
        providerZone: regInfo.providerZones[id],
        isSelected,
        weightPct,
        priceMultiplier: mult,
        pricePremiumPct: Math.round((mult - 1) * 100),
        allocatedMonthlyCost,
        standaloneMonthlyCost: standalone.totalMonthly,
        intraAzLatencyMs: regInfo.intraAzLatencyMs[id],
        clientEdgeRttMs: regInfo.clientEdgeRttMs[id],
        crossRegionRttMs: regInfo.crossRegionRttFromUsEastMs[id],
      };
    });

    const selectedBreakdowns = regionalBreakdown.filter((b) => b.isSelected);
    const blendedRegionMultiplier =
      Math.round(
        (selectedBreakdowns.reduce((acc, b) => acc + b.priceMultiplier, 0) /
          selectedBreakdowns.length) *
          1000
      ) / 1000;
    const avgClientRttMs =
      Math.round(
        (selectedBreakdowns.reduce((acc, b) => acc + b.clientEdgeRttMs, 0) /
          selectedBreakdowns.length) *
          10
      ) / 10;
    const avgIntraAzLatencyMs =
      Math.round(
        (selectedBreakdowns.reduce((acc, b) => acc + b.intraAzLatencyMs, 0) /
          selectedBreakdowns.length) *
          100
      ) / 100;

    return {
      provider: CLOUD_PROVIDERS[id],
      costs,
      equivalentInstances: instanceNames[id],
      effectiveHourlyRate: Math.round((costs.totalMonthly / HOURS_PER_MONTH) * 1000) / 1000,
      blendedRegionMultiplier,
      avgClientRttMs,
      avgIntraAzLatencyMs,
      regionalBreakdown,
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

export function getRegionalComparisonMatrix(
  config: WorkloadConfig
): RegionalComparisonSummaryRow[] {
  const activeRegions = getActiveRegions(config);
  const mode = config.multiRegionMode || 'traffic-split';
  const perRegionWeight = mode === 'active-active-replica' ? 1.0 : 1.0 / activeRegions.length;

  return ALL_CLOUD_REGION_IDS.map((regId) => {
    const reg = CLOUD_REGIONS[regId];
    const isSelected = activeRegions.includes(regId);
    const weightPct = isSelected ? Math.round((100 / activeRegions.length) * 10) / 10 : 0;

    const awsSingle = calculateSingleRegionProviderCost('aws', config, regId).totalMonthly;
    const azureSingle = calculateSingleRegionProviderCost('azure', config, regId).totalMonthly;
    const gcpSingle = calculateSingleRegionProviderCost('gcp', config, regId).totalMonthly;

    const standaloneCosts: Record<CloudProviderId, number> = {
      aws: awsSingle,
      azure: azureSingle,
      gcp: gcpSingle,
    };

    const allocatedCosts: Record<CloudProviderId, number> = {
      aws: isSelected ? Math.round(awsSingle * perRegionWeight * 100) / 100 : 0,
      azure: isSelected ? Math.round(azureSingle * perRegionWeight * 100) / 100 : 0,
      gcp: isSelected ? Math.round(gcpSingle * perRegionWeight * 100) / 100 : 0,
    };

    const pricePremiumPct: Record<CloudProviderId, number> = {
      aws: Math.round((reg.priceMultipliers.aws - 1) * 100),
      azure: Math.round((reg.priceMultipliers.azure - 1) * 100),
      gcp: Math.round((reg.priceMultipliers.gcp - 1) * 100),
    };

    const minCost = Math.min(awsSingle, azureSingle, gcpSingle);
    const maxCost = Math.max(awsSingle, azureSingle, gcpSingle);
    const cheapestProvider: CloudProviderId =
      minCost === gcpSingle ? 'gcp' : minCost === azureSingle ? 'azure' : 'aws';

    const minRtt = Math.min(
      reg.clientEdgeRttMs.aws,
      reg.clientEdgeRttMs.azure,
      reg.clientEdgeRttMs.gcp
    );
    const fastestLatencyProvider: CloudProviderId =
      minRtt === reg.clientEdgeRttMs.gcp
        ? 'gcp'
        : minRtt === reg.clientEdgeRttMs.aws
        ? 'aws'
        : 'azure';

    return {
      region: reg,
      isSelected,
      weightPct,
      allocatedCosts,
      standaloneCosts,
      pricePremiumPct,
      clientEdgeRttMs: reg.clientEdgeRttMs,
      intraAzLatencyMs: reg.intraAzLatencyMs,
      cheapestProvider,
      fastestLatencyProvider,
      maxRegionalSpreadMonthly: Math.round((maxCost - minCost) * 100) / 100,
    };
  });
}

// Generate quarterly billing distribution for the current year
export function getQuarterlyBillingData(config: WorkloadConfig): QuarterlyData[] {
  const results = compareAllProviders(config);
  const awsBase = results.find((r) => r.provider.id === 'aws')?.costs.totalMonthly ?? 1000;
  const azureBase = results.find((r) => r.provider.id === 'azure')?.costs.totalMonthly ?? 1000;
  const gcpBase = results.find((r) => r.provider.id === 'gcp')?.costs.totalMonthly ?? 1000;

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
