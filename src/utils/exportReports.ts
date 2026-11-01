import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  WorkloadConfig,
  ProviderComparisonResult,
  QuarterlyData,
  PerformanceMetric,
} from '../types/cloud';

export interface ExportReportOptions {
  companyName: string;
  preparedBy: string;
  notes?: string;
  includeQuarterly: boolean;
  includePerformance: boolean;
  includeForecasting: boolean;
}

export function exportToExcel(
  config: WorkloadConfig,
  results: ProviderComparisonResult[],
  quarterly: QuarterlyData[],
  benchmarks: PerformanceMetric[],
  options: ExportReportOptions
) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];

  // 1. Sheet: Executive Summary
  const lowestProvider = results.find((r) => r.isLowestCost);
  const highestCost = Math.max(...results.map((r) => r.costs.totalAnnual));
  const lowestCost = Math.min(...results.map((r) => r.costs.totalAnnual));
  const annualSavings = highestCost - lowestCost;

  const summaryData = [
    ['Maniq | Compare - Multi-Cloud TCO & Cost Optimization Report'],
    ['Generated On', dateStr],
    ['Target Organization', options.companyName || 'Enterprise Cloud Architecture Team'],
    ['Prepared By', options.preparedBy || 'Maniq | Compare Analytical Engine'],
    [],
    ['EXECUTIVE SUMMARY'],
    ['Most Cost-Effective Provider', lowestProvider?.provider.fullName ?? 'N/A'],
    ['Annual Projected Savings', `$${annualSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Regions Evaluated', (config.regions && config.regions.length > 0 ? config.regions : [config.region]).map((r) => r.toUpperCase()).join(', ')],
    ['Multi-Region Topology Mode', (config.regions?.length ?? 1) > 1 ? (config.multiRegionMode === 'active-active-replica' ? 'Active-Active Full Replica' : 'Distributed Load Split') : 'Single Region'],
    ['Operating System', config.os.toUpperCase()],
    ['Commitment Term', config.commitment.toUpperCase()],
    [],
    ['WORKLOAD SPECIFICATION'],
    ['Compute vCPU Cores', config.vCpu],
    ['Compute RAM (GB)', config.ramGb],
    ['Primary Instance Count', config.instanceCount],
    ['Block Storage (GB)', config.blockStorageGb],
    ['Block Storage Tier', config.blockStorageTier],
    ['Object Storage (TB)', config.objectStorageTb],
    ['Database Engine', config.dbEngine.toUpperCase()],
    ['Database vCPU / RAM (GB)', `${config.dbCpu} vCPU / ${config.dbRamGb} GB`],
    ['Database Storage (GB)', config.dbStorageGb],
    ['Database Multi-AZ', config.dbMultiAz ? 'Enabled' : 'Disabled'],
    ['Network Egress (TB/mo)', config.egressTb],
    ['Managed Kubernetes Clusters', config.k8sClusterCount],
    ['AI GPU Accelerators', config.gpuType !== 'none' ? `${config.gpuCount}x ${config.gpuType.toUpperCase()}` : 'None'],
  ];

  if (options.notes) {
    summaryData.push([], ['Analyst Notes', options.notes]);
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // 2. Sheet: Provider Cost Breakdown
  const aws = results.find((r) => r.provider.id === 'aws')!;
  const azure = results.find((r) => r.provider.id === 'azure')!;
  const gcp = results.find((r) => r.provider.id === 'gcp')!;

  const breakdownRows = [
    ['Service Category', 'AWS ($/mo)', 'Azure ($/mo)', 'GCP ($/mo)', 'Lowest Provider'],
    ['Virtual Compute Instances', aws.costs.compute, azure.costs.compute, gcp.costs.compute, getMinService(aws.costs.compute, azure.costs.compute, gcp.costs.compute)],
    ['Block Storage Volumes', aws.costs.blockStorage, azure.costs.blockStorage, gcp.costs.blockStorage, getMinService(aws.costs.blockStorage, azure.costs.blockStorage, gcp.costs.blockStorage)],
    ['Object Storage (Blob/S3/GCS)', aws.costs.objectStorage, azure.costs.objectStorage, gcp.costs.objectStorage, getMinService(aws.costs.objectStorage, azure.costs.objectStorage, gcp.costs.objectStorage)],
    ['Managed Relational Database', aws.costs.database, azure.costs.database, gcp.costs.database, getMinService(aws.costs.database, azure.costs.database, gcp.costs.database)],
    ['Network Egress Bandwidth', aws.costs.networking, azure.costs.networking, gcp.costs.networking, getMinService(aws.costs.networking, azure.costs.networking, gcp.costs.networking)],
    ['Cross-Region Data Replication', aws.costs.crossRegionReplication || 0, azure.costs.crossRegionReplication || 0, gcp.costs.crossRegionReplication || 0, getMinService(aws.costs.crossRegionReplication || 0, azure.costs.crossRegionReplication || 0, gcp.costs.crossRegionReplication || 0)],
    ['Kubernetes Control Plane', aws.costs.kubernetes, azure.costs.kubernetes, gcp.costs.kubernetes, getMinService(aws.costs.kubernetes, azure.costs.kubernetes, gcp.costs.kubernetes)],
    ['AI / GPU Accelerators', aws.costs.gpu, azure.costs.gpu, gcp.costs.gpu, getMinService(aws.costs.gpu, azure.costs.gpu, gcp.costs.gpu)],
    ['Enterprise Support Tier', aws.costs.support, azure.costs.support, gcp.costs.support, getMinService(aws.costs.support, azure.costs.support, gcp.costs.support)],
    [],
    ['TOTAL MONTHLY COST ($)', aws.costs.totalMonthly, azure.costs.totalMonthly, gcp.costs.totalMonthly, lowestProvider?.provider.name ?? ''],
    ['TOTAL ANNUAL RUN-RATE ($)', aws.costs.totalAnnual, azure.costs.totalAnnual, gcp.costs.totalAnnual, lowestProvider?.provider.name ?? ''],
    ['Effective Hourly Rate ($/hr)', aws.effectiveHourlyRate, azure.effectiveHourlyRate, gcp.effectiveHourlyRate, ''],
    [],
    ['RECOMMENDED INSTANCE EQUIVALENT'],
    ['Compute SKU', aws.equivalentInstances.compute, azure.equivalentInstances.compute, gcp.equivalentInstances.compute],
    ['Database SKU', aws.equivalentInstances.database, azure.equivalentInstances.database, gcp.equivalentInstances.database],
    ['Storage Tier', aws.equivalentInstances.storage, azure.equivalentInstances.storage, gcp.equivalentInstances.storage],
    ['Kubernetes Service', aws.equivalentInstances.k8sService, azure.equivalentInstances.k8sService, gcp.equivalentInstances.k8sService],
  ];

  const wsBreakdown = XLSX.utils.aoa_to_sheet(breakdownRows);
  XLSX.utils.book_append_sheet(wb, wsBreakdown, 'Cost Comparison');

  // 2b. Sheet: Regional Cost & Latency
  if (aws.regionalBreakdown && aws.regionalBreakdown.length > 0) {
    const regRows: (string | number)[][] = [
      [
        'Region ID',
        'Region Name',
        'AWS Standalone ($/mo)',
        'Azure Standalone ($/mo)',
        'GCP Standalone ($/mo)',
        'AWS Allocated ($/mo)',
        'Azure Allocated ($/mo)',
        'GCP Allocated ($/mo)',
        'AWS Client RTT (ms)',
        'Azure Client RTT (ms)',
        'GCP Client RTT (ms)',
      ],
    ];
    aws.regionalBreakdown.forEach((awsReg, idx) => {
      const azReg = azure.regionalBreakdown?.[idx];
      const gcpReg = gcp.regionalBreakdown?.[idx];
      regRows.push([
        awsReg.regionId.toUpperCase(),
        awsReg.regionName,
        awsReg.standaloneMonthlyCost,
        azReg?.standaloneMonthlyCost ?? 0,
        gcpReg?.standaloneMonthlyCost ?? 0,
        awsReg.allocatedMonthlyCost,
        azReg?.allocatedMonthlyCost ?? 0,
        gcpReg?.allocatedMonthlyCost ?? 0,
        awsReg.clientEdgeRttMs,
        azReg?.clientEdgeRttMs ?? 0,
        gcpReg?.clientEdgeRttMs ?? 0,
      ]);
    });
    const wsRegional = XLSX.utils.aoa_to_sheet(regRows);
    XLSX.utils.book_append_sheet(wb, wsRegional, 'Regional Cost & Latency');
  }

  // 3. Sheet: Quarterly Projections
  if (options.includeQuarterly) {
    const qRows = [
      ['Quarter', 'AWS Total ($)', 'Azure Total ($)', 'GCP Total ($)', 'Seasonal Multiplier', 'Business Cycle Event'],
      ...quarterly.map((q) => [
        q.quarter,
        q.aws,
        q.azure,
        q.gcp,
        `${Math.round((q.seasonalityMultiplier - 1) * 100)}%`,
        q.eventDescription,
      ]),
    ];
    const wsQuarterly = XLSX.utils.aoa_to_sheet(qRows);
    XLSX.utils.book_append_sheet(wb, wsQuarterly, 'Quarterly Billing');
  }

  // 4. Sheet: Performance Benchmarks
  if (options.includePerformance) {
    const pRows = [
      ['Category', 'Benchmark Metric', 'Unit', 'AWS', 'Azure', 'GCP', 'Direction', 'Benchmark Methodology'],
      ...benchmarks.map((b) => [
        b.category,
        b.metric,
        b.unit,
        b.awsValue,
        b.azureValue,
        b.gcpValue,
        b.higherIsBetter ? 'Higher is better' : 'Lower is better',
        b.description,
      ]),
    ];
    const wsPerf = XLSX.utils.aoa_to_sheet(pRows);
    XLSX.utils.book_append_sheet(wb, wsPerf, 'Performance Analytics');
  }

  // Write file
  const filename = `Maniq_Compare_Comparison_${options.companyName.replace(/\s+/g, '_') || 'Report'}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function getMinService(aws: number, azure: number, gcp: number): string {
  const min = Math.min(aws, azure, gcp);
  if (min === gcp) return 'GCP';
  if (min === azure) return 'Azure';
  return 'AWS';
}

export function exportToPdf(
  config: WorkloadConfig,
  results: ProviderComparisonResult[],
  quarterly: QuarterlyData[],
  benchmarks: PerformanceMetric[],
  options: ExportReportOptions
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let y = 40;

  // Header Bar (#081420 Postrix navy-deep)
  doc.setFillColor(8, 20, 32);
  doc.rect(0, 0, pageWidth, 75, 'F');

  doc.setTextColor(238, 243, 241);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Maniq | Compare Multi-Cloud Comparative Report', 40, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(169, 183, 191);
  doc.text(`AWS vs Microsoft Azure vs Google Cloud Platform | Generated: ${dateStr}`, 40, 54);

  y = 100;

  // Metadata block
  doc.setFontSize(9);
  doc.setTextColor(22, 35, 47);
  doc.text(`Organization: ${options.companyName || 'Cloud Strategy Team'}`, 40, y);
  doc.text(`Prepared By: ${options.preparedBy || 'Maniq | Compare Engine'}`, 240, y);
  doc.text(`Regions: ${(config.regions && config.regions.length > 0 ? config.regions : [config.region]).map((r) => r.toUpperCase()).join(', ')} | Term: ${config.commitment}`, 390, y);
  y += 20;

  // Executive Callout Box
  const lowestProvider = results.find((r) => r.isLowestCost);
  const highestCost = Math.max(...results.map((r) => r.costs.totalAnnual));
  const lowestCost = Math.min(...results.map((r) => r.costs.totalAnnual));
  const annualSavings = highestCost - lowestCost;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(40, y, pageWidth - 80, 52, 4, 4, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(40, y, pageWidth - 80, 52, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Recommended Cloud Provider: ${lowestProvider?.provider.fullName.toUpperCase()}`, 55, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Provides the lowest annual total cost of ownership at $${lowestCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}/yr, saving approximately $${annualSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}/yr (${lowestProvider?.savingsPercentage}% delta).`,
    55,
    y + 38
  );

  y += 75;

  // Section 1: Workload Specifications
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Workload & Infrastructure Baseline', 40, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const specLine1 = `Compute: ${config.instanceCount}x instances (${config.vCpu} vCPU, ${config.ramGb}GB RAM, ${config.os.toUpperCase()}) | Block Storage: ${config.blockStorageGb} GB (${config.blockStorageTier})`;
  const specLine2 = `Database: ${config.dbEngine.toUpperCase()} (${config.dbCpu} vCPU, ${config.dbRamGb}GB RAM, ${config.dbStorageGb}GB storage, Multi-AZ: ${config.dbMultiAz ? 'Yes' : 'No'})`;
  const specLine3 = `Object Storage: ${config.objectStorageTb} TB (${config.objectStorageTier}) | Egress: ${config.egressTb} TB/mo | K8s: ${config.k8sClusterCount} cluster(s) | GPU: ${config.gpuType !== 'none' ? `${config.gpuCount}x ${config.gpuType.toUpperCase()}` : 'None'}`;
  doc.text(specLine1, 40, y);
  y += 13;
  doc.text(specLine2, 40, y);
  y += 13;
  doc.text(specLine3, 40, y);
  y += 22;

  // Section 2: Detailed Cost Comparison Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Cost Breakdown by Service Category ($ USD)', 40, y);
  y += 14;

  const colX = [40, 200, 290, 380, 470];
  const aws = results.find((r) => r.provider.id === 'aws')!;
  const azure = results.find((r) => r.provider.id === 'azure')!;
  const gcp = results.find((r) => r.provider.id === 'gcp')!;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(40, y, pageWidth - 80, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Service Item', colX[0] + 5, y + 12);
  doc.text('AWS ($/mo)', colX[1], y + 12);
  doc.text('Azure ($/mo)', colX[2], y + 12);
  doc.text('GCP ($/mo)', colX[3], y + 12);
  doc.text('Advantage', colX[4], y + 12);
  y += 20;

  const tableRows = [
    { label: 'Compute Instances', a: aws.costs.compute, az: azure.costs.compute, g: gcp.costs.compute },
    { label: 'Block Storage (EBS/Disk)', a: aws.costs.blockStorage, az: azure.costs.blockStorage, g: gcp.costs.blockStorage },
    { label: 'Object Storage (S3/Blob/GCS)', a: aws.costs.objectStorage, az: azure.costs.objectStorage, g: gcp.costs.objectStorage },
    { label: 'Managed Relational Database', a: aws.costs.database, az: azure.costs.database, g: gcp.costs.database },
    { label: 'Network Data Egress', a: aws.costs.networking, az: azure.costs.networking, g: gcp.costs.networking },
    { label: 'Kubernetes Management', a: aws.costs.kubernetes, az: azure.costs.kubernetes, g: gcp.costs.kubernetes },
    { label: 'GPU Accelerators', a: aws.costs.gpu, az: azure.costs.gpu, g: gcp.costs.gpu },
    { label: 'Enterprise Support', a: aws.costs.support, az: azure.costs.support, g: gcp.costs.support },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  tableRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(40, y - 2, pageWidth - 80, 15, 'F');
    }
    const minVal = Math.min(row.a, row.az, row.g);
    const win = minVal === row.g ? 'GCP' : minVal === row.az ? 'Azure' : 'AWS';

    doc.setTextColor(51, 65, 85);
    doc.text(row.label, colX[0] + 5, y + 9);
    doc.text(`$${row.a.toFixed(2)}`, colX[1], y + 9);
    doc.text(`$${row.az.toFixed(2)}`, colX[2], y + 9);
    doc.text(`$${row.g.toFixed(2)}`, colX[3], y + 9);
    doc.setFont('helvetica', 'bold');
    doc.text(win, colX[4], y + 9);
    doc.setFont('helvetica', 'normal');
    y += 15;
  });

  // Table Totals
  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, pageWidth - 80, 32, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  doc.text('TOTAL MONTHLY SPEND', colX[0] + 5, y + 13);
  doc.text(`$${aws.costs.totalMonthly.toFixed(2)}`, colX[1], y + 13);
  doc.text(`$${azure.costs.totalMonthly.toFixed(2)}`, colX[2], y + 13);
  doc.text(`$${gcp.costs.totalMonthly.toFixed(2)}`, colX[3], y + 13);

  doc.text('ANNUAL RUN-RATE (TCO)', colX[0] + 5, y + 26);
  doc.text(`$${aws.costs.totalAnnual.toLocaleString()}`, colX[1], y + 26);
  doc.text(`$${azure.costs.totalAnnual.toLocaleString()}`, colX[2], y + 26);
  doc.text(`$${gcp.costs.totalAnnual.toLocaleString()}`, colX[3], y + 26);

  y += 48;

  // Section 3: Quarterly Breakdown
  if (options.includeQuarterly && y < 700) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Quarterly Billing Trajectory', 40, y);
    y += 14;

    doc.setFontSize(8);
    quarterly.forEach((q) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(q.quarter, 45, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`AWS: $${q.aws.toLocaleString()}  |  Azure: $${q.azure.toLocaleString()}  |  GCP: $${q.gcp.toLocaleString()}  (${q.eventDescription})`, 110, y);
      y += 13;
    });
    y += 10;
  }

  // Section 4: Analyst Notes if present
  if (options.notes && y < 740) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Analyst Comments & Strategic Recommendations:', 40, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(options.notes, pageWidth - 80);
    doc.text(splitNotes, 40, y);
  }

  // Footer on page 1
  doc.setFontSize(7.5);
  doc.setTextColor(127, 144, 154);
  doc.text('Generated by Maniq | Compare (Author: Ravindran Mani — ravindran.in). Based on 2026 public enterprise cloud tariffs.', 40, 815);
  doc.text('Page 1 of 1', pageWidth - 85, 815);

  const filename = `Maniq_Compare_Report_${options.companyName.replace(/\s+/g, '_') || 'Cloud'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
