/**
 * Brightsky Airlines · sample data for TokenOps configuration pages.
 * Deterministic, fictional, and cross-linked by shared IDs.
 */

export const SAMPLE_DATA_NOTE = 'Brightsky Airlines · sample data';

export type ProviderDisplay = 'Provider A' | 'Provider B' | 'Self-hosted (AIC)';

export type IntegrationType =
  | 'Microsoft Foundry'
  | 'AWS Bedrock'
  | 'Self-hosted model on AIC'
  | 'OpenAI API (direct)';

export type HostingType = 'Provider-hosted' | 'Self-hosted';
export type TokenClass = 'Input' | 'Output' | 'Cached input' | 'Reasoning output' | 'Cache write';
export type PriceType = 'List price' | 'Customer override' | 'Internal rate';
export type RateStatus = 'Active' | 'Superseded' | 'Unpriced';
export type ModelStatus = 'Active' | 'Disabled';
export type PricingStatus = 'Complete' | 'Incomplete' | 'Internal rate';
export type ToolSupport = 'Yes' | 'Limited' | 'No';
export type Environment = 'Production' | 'Staging' | 'Development';
export type HealthStatus = 'Healthy' | 'Degraded' | 'Recovering' | 'Needs attention' | 'Warning';
export type ConnectionStatus = 'Enabled' | 'Disabled';
export type AccessKeyStatus = 'Active' | 'Expiring soon' | 'Revoked';
export type QuotaStatus = 'On track' | 'Near limit' | 'Exceeded';
export type QuotaPeriod = 'Daily' | 'Weekly' | 'Monthly';
export type QuotaLimitType = 'Tokens' | 'USD';
export type QuotaScopeKind = 'Provider' | 'Provider and model';

export interface Workspace {
  id: string;
  name: string;
  approvedModelIds: string[];
}

export interface Connection {
  id: string;
  name: string;
  integration: IntegrationType;
  purpose: string;
  status: ConnectionStatus;
  health: HealthStatus;
  modelsDiscovered: number;
  deploymentsDiscovered: number;
  lastSuccessfulRead: string | null;
  lastChecked: string;
  workspaceId: string;
  credentialSaved: boolean;
  syncHistory: { at: string; result: string }[];
}

export interface ModelRecord {
  id: string;
  displayName: string;
  modelId: string;
  provider: ProviderDisplay;
  connectionId: string;
  hosting: HostingType;
  endpointId: string;
  endpoint: string;
  contextLength: string;
  tools: ToolSupport;
  jsonMode: boolean;
  pricingStatus: PricingStatus;
  status: ModelStatus;
  description: string;
  usage: {
    totalRequests: number;
    inputTokens: number;
    outputTokens: number;
    currentPeriodCost: number | null;
  };
}

export interface RateRecord {
  id: string;
  modelId: string;
  provider: ProviderDisplay;
  connectionId: string;
  tokenClass: TokenClass;
  /** null means Unpriced — never treat as $0.00 */
  pricePer1M: number | null;
  currency: 'USD';
  priceType: PriceType;
  effectiveDate: string;
  endDate: string | null;
  status: RateStatus;
  lastUpdated: string;
  lastChangedBy: string;
  changeReason: string;
  notes: string;
  estimatedRecordsAffected: number;
  previousVersionIds: string[];
}

export interface ServerRecord {
  id: string;
  name: string;
  location: string;
  cluster: string;
  gpuIds: string[];
}

export interface GpuRecord {
  id: string;
  label: string;
  serverId: string;
  gpuType: string;
  memoryGb: number;
  serial: string;
  location: string;
  cluster: string;
  monitoringSource: string;
  deploymentId: string | null;
  utilization: number;
  memoryUsedGb: number;
  temperatureC: number;
  powerW: number;
  health: HealthStatus;
  lastTelemetry: string;
  healthEvents: { at: string; message: string; severity: HealthStatus }[];
}

export interface DeploymentRecord {
  id: string;
  name: string;
  modelId: string;
  purpose: string;
  environment: Environment;
  runtime: string;
  version: string;
  replicas: number;
  hosting: HostingType;
  serverId: string | null;
  gpuIds: string[];
  gpuAllocationLabel: string;
  requestPath: string;
  requestsPerMin: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  errorRate: number;
  health: HealthStatus;
  createdDate: string;
  lastHealthCheck: string;
  replicaHealth: { id: string; health: HealthStatus; share: number }[];
  allocatedGpuHours: number;
  usedGpuHours: number;
  internalEstimatedCost: number;
  workload: string;
}

export interface AccessKeyRecord {
  id: string;
  name: string;
  prefix: string;
  workspaceId: string;
  environment: Environment;
  modelIds: string[];
  created: string;
  lastUsed: string | null;
  expires: string | null;
  status: AccessKeyStatus;
  quotaId: string | null;
  requestCount: number;
  recentActivity: { at: string; summary: string }[];
}

export interface QuotaRecord {
  id: string;
  name: string;
  scopeKind: QuotaScopeKind;
  provider: ProviderDisplay;
  modelId: string | null;
  limitType: QuotaLimitType;
  limitValue: number;
  usedValue: number;
  period: QuotaPeriod;
  resets: string;
  status: QuotaStatus;
  workspaceId: string | null;
  keyId: string | null;
  alertRuleId: string | null;
  usageSource: string;
  dailyUsage: { day: string; value: number }[];
  exceededBehavior: string;
  hasUnpricedUsage: boolean;
}

export const WORKSPACES: Workspace[] = [
  {
    id: 'ws-travel',
    name: 'Travel assistant',
    approvedModelIds: ['model-frontier-l', 'model-open-70b', 'model-mid-m'],
  },
  {
    id: 'ws-ops',
    name: 'Operations AI',
    approvedModelIds: ['model-mid-m', 'model-small-s', 'model-open-70b'],
  },
  {
    id: 'ws-baggage',
    name: 'Baggage services',
    approvedModelIds: ['model-small-s'],
  },
  {
    id: 'ws-crew',
    name: 'Crew scheduling',
    approvedModelIds: ['model-open-70b', 'model-mid-m'],
  },
];

export const CONNECTIONS: Connection[] = [
  {
    id: 'conn-foundry',
    name: 'Brightsky Foundry',
    integration: 'Microsoft Foundry',
    purpose: 'Usage and cost ingestion',
    status: 'Enabled',
    health: 'Healthy',
    modelsDiscovered: 1,
    deploymentsDiscovered: 0,
    lastSuccessfulRead: '4 minutes ago',
    lastChecked: '2 minutes ago',
    workspaceId: 'ws-travel',
    credentialSaved: true,
    syncHistory: [
      { at: 'Today 14:51', result: 'Read 1,240 usage records' },
      { at: 'Today 14:47', result: 'Read 1,180 usage records' },
      { at: 'Today 14:43', result: 'Read 1,205 usage records' },
    ],
  },
  {
    id: 'conn-bedrock',
    name: 'Brightsky Bedrock',
    integration: 'AWS Bedrock',
    purpose: 'Usage and cost ingestion',
    status: 'Enabled',
    health: 'Healthy',
    modelsDiscovered: 2,
    deploymentsDiscovered: 0,
    lastSuccessfulRead: '12 minutes ago',
    lastChecked: '8 minutes ago',
    workspaceId: 'ws-ops',
    credentialSaved: true,
    syncHistory: [
      { at: 'Today 14:43', result: 'Read 860 usage records' },
      { at: 'Today 14:31', result: 'Read 842 usage records' },
    ],
  },
  {
    id: 'conn-aic',
    name: 'AIC production',
    integration: 'Self-hosted model on AIC',
    purpose: 'Model, deployment, and GPU telemetry',
    status: 'Enabled',
    health: 'Healthy',
    modelsDiscovered: 1,
    deploymentsDiscovered: 2,
    lastSuccessfulRead: '2 minutes ago',
    lastChecked: '1 minute ago',
    workspaceId: 'ws-crew',
    credentialSaved: true,
    syncHistory: [
      { at: 'Today 14:53', result: 'Synced 2 deployments and 8 GPUs' },
      { at: 'Today 14:51', result: 'Synced telemetry samples' },
    ],
  },
  {
    id: 'conn-openai-sandbox',
    name: 'OpenAI direct sandbox',
    integration: 'OpenAI API (direct)',
    purpose: 'Development testing',
    status: 'Disabled',
    health: 'Needs attention',
    modelsDiscovered: 0,
    deploymentsDiscovered: 0,
    lastSuccessfulRead: null,
    lastChecked: '3 hours ago',
    workspaceId: 'ws-ops',
    credentialSaved: false,
    syncHistory: [
      { at: 'Yesterday 09:12', result: 'Test failed — credential rejected' },
    ],
  },
];

export const MODELS: ModelRecord[] = [
  {
    id: 'model-frontier-l',
    displayName: 'Frontier-L',
    modelId: 'frontier-l-2025',
    provider: 'Provider A',
    connectionId: 'conn-foundry',
    hosting: 'Provider-hosted',
    endpointId: 'ep-frontier-l',
    endpoint: '/v1/frontier-l',
    contextLength: '128K',
    tools: 'Yes',
    jsonMode: true,
    pricingStatus: 'Complete',
    status: 'Active',
    description: 'Primary reasoning model for complex travel and policy questions.',
    usage: {
      totalRequests: 4_820_000,
      inputTokens: 18_400_000_000,
      outputTokens: 2_300_000_000,
      currentPeriodCost: 265_400,
    },
  },
  {
    id: 'model-mid-m',
    displayName: 'Mid-M',
    modelId: 'mid-m-2025',
    provider: 'Provider B',
    connectionId: 'conn-bedrock',
    hosting: 'Provider-hosted',
    endpointId: 'ep-mid-m',
    endpoint: '/v1/mid-m',
    contextLength: '64K',
    tools: 'Yes',
    jsonMode: true,
    pricingStatus: 'Complete',
    status: 'Active',
    description: 'Balanced model for operations workflows and fare-rule lookups.',
    usage: {
      totalRequests: 2_140_000,
      inputTokens: 6_100_000_000,
      outputTokens: 980_000_000,
      currentPeriodCost: 31_200,
    },
  },
  {
    id: 'model-small-s',
    displayName: 'Small-S',
    modelId: 'small-s-2025',
    provider: 'Provider B',
    connectionId: 'conn-bedrock',
    hosting: 'Provider-hosted',
    endpointId: 'ep-small-s',
    endpoint: '/v1/small-s',
    contextLength: '32K',
    tools: 'Limited',
    jsonMode: true,
    pricingStatus: 'Incomplete',
    status: 'Active',
    description: 'Lightweight model for baggage triage and high-volume classification.',
    usage: {
      totalRequests: 980_000,
      inputTokens: 1_900_000_000,
      outputTokens: 420_000_000,
      currentPeriodCost: null,
    },
  },
  {
    id: 'model-open-70b',
    displayName: 'Open-70B',
    modelId: 'open-70b-aic',
    provider: 'Self-hosted (AIC)',
    connectionId: 'conn-aic',
    hosting: 'Self-hosted',
    endpointId: 'ep-open-70b',
    endpoint: '/v1/open-70b',
    contextLength: '128K',
    tools: 'Yes',
    jsonMode: true,
    pricingStatus: 'Internal rate',
    status: 'Active',
    description: 'Self-hosted open model for travel assistant and crew scheduling pools.',
    usage: {
      totalRequests: 3_560_000,
      inputTokens: 2_800_000_000,
      outputTokens: 700_000_000,
      currentPeriodCost: 6_300,
    },
  },
];

/** Historical superseded rates referenced by previousVersionIds. */
export const RATE_HISTORY: RateRecord[] = [
  {
    id: 'rate-frontier-in-prev',
    modelId: 'model-frontier-l',
    provider: 'Provider A',
    connectionId: 'conn-foundry',
    tokenClass: 'Input',
    pricePer1M: 18,
    currency: 'USD',
    priceType: 'List price',
    effectiveDate: '2025-07-01',
    endDate: '2025-09-30',
    status: 'Superseded',
    lastUpdated: '2025-09-30',
    lastChangedBy: 'Maya Chen',
    changeReason: 'Provider list-price reduction',
    notes: '',
    estimatedRecordsAffected: 0,
    previousVersionIds: [],
  },
  {
    id: 'rate-mid-out-prev',
    modelId: 'model-mid-m',
    provider: 'Provider B',
    connectionId: 'conn-bedrock',
    tokenClass: 'Output',
    pricePer1M: 18,
    currency: 'USD',
    priceType: 'List price',
    effectiveDate: '2025-06-01',
    endDate: '2025-08-31',
    status: 'Superseded',
    lastUpdated: '2025-08-31',
    lastChangedBy: 'Jordan Lee',
    changeReason: 'Negotiated list update',
    notes: '',
    estimatedRecordsAffected: 0,
    previousVersionIds: [],
  },
];

export const RATES: RateRecord[] = [
  {
    id: 'rate-frontier-in',
    modelId: 'model-frontier-l',
    provider: 'Provider A',
    connectionId: 'conn-foundry',
    tokenClass: 'Input',
    pricePer1M: 15,
    currency: 'USD',
    priceType: 'List price',
    effectiveDate: '2025-10-01',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-10-01',
    lastChangedBy: 'Maya Chen',
    changeReason: 'Q4 list price',
    notes: '',
    estimatedRecordsAffected: 1_240_000,
    previousVersionIds: ['rate-frontier-in-prev'],
  },
  {
    id: 'rate-frontier-out',
    modelId: 'model-frontier-l',
    provider: 'Provider A',
    connectionId: 'conn-foundry',
    tokenClass: 'Output',
    pricePer1M: 75,
    currency: 'USD',
    priceType: 'List price',
    effectiveDate: '2025-10-01',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-10-01',
    lastChangedBy: 'Maya Chen',
    changeReason: 'Q4 list price',
    notes: '',
    estimatedRecordsAffected: 1_240_000,
    previousVersionIds: [],
  },
  {
    id: 'rate-frontier-cached',
    modelId: 'model-frontier-l',
    provider: 'Provider A',
    connectionId: 'conn-foundry',
    tokenClass: 'Cached input',
    pricePer1M: 7.5,
    currency: 'USD',
    priceType: 'List price',
    effectiveDate: '2025-10-01',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-10-01',
    lastChangedBy: 'Maya Chen',
    changeReason: 'Q4 list price',
    notes: '',
    estimatedRecordsAffected: 420_000,
    previousVersionIds: [],
  },
  {
    id: 'rate-frontier-reason',
    modelId: 'model-frontier-l',
    provider: 'Provider A',
    connectionId: 'conn-foundry',
    tokenClass: 'Reasoning output',
    pricePer1M: 90,
    currency: 'USD',
    priceType: 'Customer override',
    effectiveDate: '2025-10-15',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-10-15',
    lastChangedBy: 'Priya Nair',
    changeReason: 'Enterprise override',
    notes: 'Brightsky negotiated override',
    estimatedRecordsAffected: 88_000,
    previousVersionIds: [],
  },
  {
    id: 'rate-mid-in',
    modelId: 'model-mid-m',
    provider: 'Provider B',
    connectionId: 'conn-bedrock',
    tokenClass: 'Input',
    pricePer1M: 3,
    currency: 'USD',
    priceType: 'List price',
    effectiveDate: '2025-09-01',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-09-01',
    lastChangedBy: 'Jordan Lee',
    changeReason: 'Bedrock list',
    notes: '',
    estimatedRecordsAffected: 860_000,
    previousVersionIds: [],
  },
  {
    id: 'rate-mid-out',
    modelId: 'model-mid-m',
    provider: 'Provider B',
    connectionId: 'conn-bedrock',
    tokenClass: 'Output',
    pricePer1M: 15,
    currency: 'USD',
    priceType: 'List price',
    effectiveDate: '2025-09-01',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-09-01',
    lastChangedBy: 'Jordan Lee',
    changeReason: 'Bedrock list',
    notes: '',
    estimatedRecordsAffected: 860_000,
    previousVersionIds: ['rate-mid-out-prev'],
  },
  {
    id: 'rate-mid-cached',
    modelId: 'model-mid-m',
    provider: 'Provider B',
    connectionId: 'conn-bedrock',
    tokenClass: 'Cached input',
    pricePer1M: 0.3,
    currency: 'USD',
    priceType: 'List price',
    effectiveDate: '2025-09-01',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-09-01',
    lastChangedBy: 'Jordan Lee',
    changeReason: 'Bedrock list',
    notes: '',
    estimatedRecordsAffected: 210_000,
    previousVersionIds: [],
  },
  {
    id: 'rate-mid-in-override',
    modelId: 'model-mid-m',
    provider: 'Provider B',
    connectionId: 'conn-bedrock',
    tokenClass: 'Input',
    pricePer1M: 2.7,
    currency: 'USD',
    priceType: 'Customer override',
    effectiveDate: '2025-11-01',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-11-01',
    lastChangedBy: 'Priya Nair',
    changeReason: 'Volume discount',
    notes: 'Applies to Operations AI workspace',
    estimatedRecordsAffected: 120_000,
    previousVersionIds: [],
  },
  {
    id: 'rate-small-in',
    modelId: 'model-small-s',
    provider: 'Provider B',
    connectionId: 'conn-bedrock',
    tokenClass: 'Input',
    pricePer1M: 2.4,
    currency: 'USD',
    priceType: 'List price',
    effectiveDate: '2025-09-01',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-09-01',
    lastChangedBy: 'Jordan Lee',
    changeReason: 'Bedrock list',
    notes: '',
    estimatedRecordsAffected: 540_000,
    previousVersionIds: [],
  },
  {
    id: 'rate-small-out',
    modelId: 'model-small-s',
    provider: 'Provider B',
    connectionId: 'conn-bedrock',
    tokenClass: 'Output',
    pricePer1M: 12,
    currency: 'USD',
    priceType: 'List price',
    effectiveDate: '2025-09-01',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-09-01',
    lastChangedBy: 'Jordan Lee',
    changeReason: 'Bedrock list',
    notes: '',
    estimatedRecordsAffected: 540_000,
    previousVersionIds: [],
  },
  {
    id: 'rate-small-cached-unpriced',
    modelId: 'model-small-s',
    provider: 'Provider B',
    connectionId: 'conn-bedrock',
    tokenClass: 'Cached input',
    pricePer1M: null,
    currency: 'USD',
    priceType: 'List price',
    effectiveDate: '2025-09-01',
    endDate: null,
    status: 'Unpriced',
    lastUpdated: '2025-11-10',
    lastChangedBy: 'System',
    changeReason: 'Token class observed in usage without a rate',
    notes: 'Do not treat as $0.00',
    estimatedRecordsAffected: 64_000,
    previousVersionIds: [],
  },
  {
    id: 'rate-small-out-override',
    modelId: 'model-small-s',
    provider: 'Provider B',
    connectionId: 'conn-bedrock',
    tokenClass: 'Output',
    pricePer1M: 10.5,
    currency: 'USD',
    priceType: 'Customer override',
    effectiveDate: '2025-10-20',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-10-20',
    lastChangedBy: 'Priya Nair',
    changeReason: 'Baggage services override',
    notes: '',
    estimatedRecordsAffected: 95_000,
    previousVersionIds: [],
  },
  {
    id: 'rate-open-blended',
    modelId: 'model-open-70b',
    provider: 'Self-hosted (AIC)',
    connectionId: 'conn-aic',
    tokenClass: 'Input',
    pricePer1M: 1.8,
    currency: 'USD',
    priceType: 'Internal rate',
    effectiveDate: '2025-08-01',
    endDate: null,
    status: 'Active',
    lastUpdated: '2025-08-01',
    lastChangedBy: 'Alex Rivera',
    changeReason: 'Internal blended GPU rate',
    notes: 'Applies to all Open-70B token classes as blended internal rate',
    estimatedRecordsAffected: 3_560_000,
    previousVersionIds: [],
  },
];

export const SERVERS: ServerRecord[] = [
  {
    id: 'srv-dc1-01',
    name: 'srv-dc1-01',
    location: 'Brightsky data center 1',
    cluster: 'aic-prod-a',
    gpuIds: ['gpu-1', 'gpu-2', 'gpu-3', 'gpu-4'],
  },
  {
    id: 'srv-dc1-02',
    name: 'srv-dc1-02',
    location: 'Brightsky data center 1',
    cluster: 'aic-prod-a',
    gpuIds: ['gpu-5', 'gpu-6', 'gpu-7', 'gpu-8'],
  },
];

export const DEPLOYMENTS: DeploymentRecord[] = [
  {
    id: 'dep-travel',
    name: 'Open-70B · Travel assistant',
    modelId: 'model-open-70b',
    purpose: 'Travel assistant and fare-rule processing',
    environment: 'Production',
    runtime: 'vLLM',
    version: 'v0.6.2',
    replicas: 4,
    hosting: 'Self-hosted',
    serverId: 'srv-dc1-02',
    gpuIds: ['gpu-5', 'gpu-6', 'gpu-7', 'gpu-8'],
    gpuAllocationLabel: 'GPUs 5–8',
    requestPath: '/v1/travel-assistant',
    requestsPerMin: 1240,
    p50LatencyMs: 410,
    p95LatencyMs: 820,
    errorRate: 0.4,
    health: 'Healthy',
    createdDate: '2025-08-12',
    lastHealthCheck: '1 minute ago',
    replicaHealth: [
      { id: 'r1', health: 'Healthy', share: 26 },
      { id: 'r2', health: 'Healthy', share: 25 },
      { id: 'r3', health: 'Healthy', share: 24 },
      { id: 'r4', health: 'Healthy', share: 25 },
    ],
    allocatedGpuHours: 2880,
    usedGpuHours: 1510,
    internalEstimatedCost: 4200,
    workload: 'Repeated travel-assistant and fare-rule processing',
  },
  {
    id: 'dep-crew',
    name: 'Open-70B · Crew scheduling',
    modelId: 'model-open-70b',
    purpose: 'Crew-scheduling recommendations',
    environment: 'Production',
    runtime: 'vLLM',
    version: 'v0.6.2',
    replicas: 4,
    hosting: 'Self-hosted',
    serverId: 'srv-dc1-01',
    gpuIds: ['gpu-1', 'gpu-2', 'gpu-3', 'gpu-4'],
    gpuAllocationLabel: 'GPUs 1–4',
    requestPath: '/v1/crew-scheduling',
    requestsPerMin: 420,
    p50LatencyMs: 620,
    p95LatencyMs: 1100,
    errorRate: 0.6,
    health: 'Healthy',
    createdDate: '2025-08-12',
    lastHealthCheck: '2 minutes ago',
    replicaHealth: [
      { id: 'r1', health: 'Healthy', share: 28 },
      { id: 'r2', health: 'Healthy', share: 24 },
      { id: 'r3', health: 'Healthy', share: 23 },
      { id: 'r4', health: 'Healthy', share: 25 },
    ],
    allocatedGpuHours: 2880,
    usedGpuHours: 1760,
    internalEstimatedCost: 4800,
    workload: 'Crew-scheduling recommendations',
  },
  {
    id: 'dep-baggage',
    name: 'Small-S · Baggage triage',
    modelId: 'model-small-s',
    purpose: 'Baggage triage classification',
    environment: 'Staging',
    runtime: 'Provider-hosted',
    version: '2025.09',
    replicas: 2,
    hosting: 'Provider-hosted',
    serverId: null,
    gpuIds: [],
    gpuAllocationLabel: 'No dedicated GPU allocation',
    requestPath: '/v1/baggage-triage',
    requestsPerMin: 180,
    p50LatencyMs: 980,
    p95LatencyMs: 1800,
    errorRate: 3.2,
    health: 'Degraded',
    createdDate: '2025-10-03',
    lastHealthCheck: '4 minutes ago',
    replicaHealth: [
      { id: 'r1', health: 'Degraded', share: 62 },
      { id: 'r2', health: 'Healthy', share: 38 },
    ],
    allocatedGpuHours: 0,
    usedGpuHours: 0,
    internalEstimatedCost: 410,
    workload: 'Baggage triage staging traffic',
  },
];

function gpuBase(
  id: string,
  label: string,
  serverId: string,
  deploymentId: string,
  utilization: number,
  temperatureC: number,
  powerW: number,
  health: HealthStatus,
  events: GpuRecord['healthEvents'] = [],
): GpuRecord {
  return {
    id,
    label,
    serverId,
    gpuType: 'NVIDIA H100 80GB',
    memoryGb: 80,
    serial: `BS-H100-${id.toUpperCase()}`,
    location: 'Brightsky data center 1',
    cluster: 'aic-prod-a',
    monitoringSource: 'AIC telemetry',
    deploymentId,
    utilization,
    memoryUsedGb: Math.round(utilization * 0.72),
    temperatureC,
    powerW,
    health,
    lastTelemetry: '45 seconds ago',
    healthEvents:
      events.length > 0
        ? events
        : [{ at: 'Today 12:00', message: 'Telemetry nominal', severity: 'Healthy' }],
  };
}

export const GPUS: GpuRecord[] = [
  gpuBase('gpu-1', 'GPU 1', 'srv-dc1-01', 'dep-crew', 61, 68, 520, 'Healthy'),
  gpuBase('gpu-2', 'GPU 2', 'srv-dc1-01', 'dep-crew', 58, 67, 510, 'Healthy'),
  gpuBase('gpu-3', 'GPU 3', 'srv-dc1-01', 'dep-crew', 64, 70, 535, 'Healthy'),
  gpuBase('gpu-4', 'GPU 4', 'srv-dc1-01', 'dep-crew', 60, 69, 525, 'Healthy'),
  gpuBase('gpu-5', 'GPU 5', 'srv-dc1-02', 'dep-travel', 48, 66, 480, 'Healthy'),
  gpuBase('gpu-6', 'GPU 6', 'srv-dc1-02', 'dep-travel', 52, 71, 495, 'Healthy'),
  gpuBase('gpu-7', 'GPU 7', 'srv-dc1-02', 'dep-travel', 55, 84, 560, 'Warning', [
    {
      at: 'Today 14:22',
      message: 'Elevated temperature — noncritical; cooling within range',
      severity: 'Warning',
    },
    { at: 'Today 13:10', message: 'Telemetry nominal', severity: 'Healthy' },
  ]),
  gpuBase('gpu-8', 'GPU 8', 'srv-dc1-02', 'dep-travel', 42, 65, 470, 'Healthy'),
];

export const ACCESS_KEYS: AccessKeyRecord[] = [
  {
    id: 'key-travel',
    name: 'Travel assistant live',
    prefix: 'tok_live_bs_travel_••••8D2A',
    workspaceId: 'ws-travel',
    environment: 'Production',
    modelIds: ['model-frontier-l', 'model-open-70b'],
    created: '2025-08-15',
    lastUsed: '2 minutes ago',
    expires: '2026-08-15',
    status: 'Active',
    quotaId: 'quota-frontier-tokens',
    requestCount: 6_400_000,
    recentActivity: [
      { at: 'Today 14:52', summary: '1,240 requests · Travel assistant' },
      { at: 'Today 14:40', summary: '1,180 requests · Travel assistant' },
    ],
  },
  {
    id: 'key-ops',
    name: 'Operations AI live',
    prefix: 'tok_live_bs_ops_••••3K9Q',
    workspaceId: 'ws-ops',
    environment: 'Production',
    modelIds: ['model-mid-m', 'model-small-s'],
    created: '2025-07-02',
    lastUsed: '18 minutes ago',
    expires: '2026-02-01',
    status: 'Expiring soon',
    quotaId: 'quota-provider-b-spend',
    requestCount: 3_100_000,
    recentActivity: [
      { at: 'Today 14:36', summary: '420 requests · Operations AI' },
    ],
  },
  {
    id: 'key-baggage',
    name: 'Baggage triage test',
    prefix: 'tok_test_bs_baggage_••••1P7M',
    workspaceId: 'ws-baggage',
    environment: 'Staging',
    modelIds: ['model-small-s'],
    created: '2025-10-04',
    lastUsed: '6 minutes ago',
    expires: '2026-04-04',
    status: 'Active',
    quotaId: 'quota-baggage-daily',
    requestCount: 890_000,
    recentActivity: [
      { at: 'Today 14:48', summary: '180 requests · Baggage triage' },
    ],
  },
  {
    id: 'key-crew',
    name: 'Crew scheduling live',
    prefix: 'tok_live_bs_crew_••••6V4C',
    workspaceId: 'ws-crew',
    environment: 'Production',
    modelIds: ['model-open-70b'],
    created: '2025-08-20',
    lastUsed: '5 minutes ago',
    expires: '2026-08-20',
    status: 'Active',
    quotaId: 'quota-open70b-tokens',
    requestCount: 2_210_000,
    recentActivity: [
      { at: 'Today 14:50', summary: '420 requests · Crew scheduling' },
    ],
  },
  {
    id: 'key-legacy',
    name: 'Legacy sandbox',
    prefix: 'tok_test_bs_legacy_••••9X2R',
    workspaceId: 'ws-ops',
    environment: 'Development',
    modelIds: ['model-mid-m'],
    created: '2025-03-11',
    lastUsed: '2025-09-02',
    expires: '2025-10-01',
    status: 'Revoked',
    quotaId: null,
    requestCount: 42_000,
    recentActivity: [
      { at: '2025-09-02', summary: 'Key revoked after sandbox retirement' },
    ],
  },
];

export const QUOTAS: QuotaRecord[] = [
  {
    id: 'quota-provider-a-spend',
    name: 'Provider A monthly spend',
    scopeKind: 'Provider',
    provider: 'Provider A',
    modelId: null,
    limitType: 'USD',
    limitValue: 300_000,
    usedValue: 265_400,
    period: 'Monthly',
    resets: '2025-12-01',
    status: 'Near limit',
    workspaceId: 'ws-travel',
    keyId: 'key-travel',
    alertRuleId: 'quota-80',
    usageSource: 'Brightsky Foundry usage ingest',
    dailyUsage: [
      { day: 'Mon', value: 9200 },
      { day: 'Tue', value: 9800 },
      { day: 'Wed', value: 10100 },
      { day: 'Thu', value: 9400 },
      { day: 'Fri', value: 8800 },
      { day: 'Sat', value: 6100 },
      { day: 'Sun', value: 5400 },
    ],
    exceededBehavior:
      'When exceeded, TokenOps flags the quota and can notify alert rules. Live traffic blocking is illustrative in this prototype.',
    hasUnpricedUsage: false,
  },
  {
    id: 'quota-frontier-tokens',
    name: 'Frontier-L monthly token quota',
    scopeKind: 'Provider and model',
    provider: 'Provider A',
    modelId: 'model-frontier-l',
    limitType: 'Tokens',
    limitValue: 22_000_000_000,
    usedValue: 20_700_000_000,
    period: 'Monthly',
    resets: '2025-12-01',
    status: 'Near limit',
    workspaceId: 'ws-travel',
    keyId: 'key-travel',
    alertRuleId: 'quota-100',
    usageSource: 'Brightsky Foundry usage ingest',
    dailyUsage: [
      { day: 'Mon', value: 720_000_000 },
      { day: 'Tue', value: 760_000_000 },
      { day: 'Wed', value: 790_000_000 },
      { day: 'Thu', value: 740_000_000 },
      { day: 'Fri', value: 700_000_000 },
      { day: 'Sat', value: 480_000_000 },
      { day: 'Sun', value: 410_000_000 },
    ],
    exceededBehavior:
      'When exceeded, TokenOps marks the model near capacity and can trigger linked alert rules.',
    hasUnpricedUsage: false,
  },
  {
    id: 'quota-provider-b-spend',
    name: 'Provider B monthly spend',
    scopeKind: 'Provider',
    provider: 'Provider B',
    modelId: null,
    limitType: 'USD',
    limitValue: 60_000,
    usedValue: 48_400,
    period: 'Monthly',
    resets: '2025-12-01',
    status: 'On track',
    workspaceId: 'ws-ops',
    keyId: 'key-ops',
    alertRuleId: null,
    usageSource: 'Brightsky Bedrock usage ingest',
    dailyUsage: [
      { day: 'Mon', value: 1600 },
      { day: 'Tue', value: 1720 },
      { day: 'Wed', value: 1680 },
      { day: 'Thu', value: 1550 },
      { day: 'Fri', value: 1490 },
      { day: 'Sat', value: 980 },
      { day: 'Sun', value: 860 },
    ],
    exceededBehavior:
      'When exceeded, TokenOps can notify owners. Enforcement of live traffic is simulated in this demo.',
    hasUnpricedUsage: true,
  },
  {
    id: 'quota-open70b-tokens',
    name: 'Open-70B monthly token quota',
    scopeKind: 'Provider and model',
    provider: 'Self-hosted (AIC)',
    modelId: 'model-open-70b',
    limitType: 'Tokens',
    limitValue: 5_000_000_000,
    usedValue: 3_500_000_000,
    period: 'Monthly',
    resets: '2025-12-01',
    status: 'On track',
    workspaceId: 'ws-crew',
    keyId: 'key-crew',
    alertRuleId: null,
    usageSource: 'AIC production telemetry',
    dailyUsage: [
      { day: 'Mon', value: 120_000_000 },
      { day: 'Tue', value: 128_000_000 },
      { day: 'Wed', value: 132_000_000 },
      { day: 'Thu', value: 126_000_000 },
      { day: 'Fri', value: 118_000_000 },
      { day: 'Sat', value: 90_000_000 },
      { day: 'Sun', value: 82_000_000 },
    ],
    exceededBehavior:
      'When exceeded, TokenOps surfaces capacity pressure for self-hosted pools.',
    hasUnpricedUsage: false,
  },
  {
    id: 'quota-baggage-daily',
    name: 'Baggage triage daily token quota',
    scopeKind: 'Provider and model',
    provider: 'Provider B',
    modelId: 'model-small-s',
    limitType: 'Tokens',
    limitValue: 120_000_000,
    usedValue: 128_000_000,
    period: 'Daily',
    resets: 'Tomorrow 00:00 UTC',
    status: 'Exceeded',
    workspaceId: 'ws-baggage',
    keyId: 'key-baggage',
    alertRuleId: null,
    usageSource: 'Brightsky Bedrock usage ingest',
    dailyUsage: [
      { day: 'Mon', value: 98_000_000 },
      { day: 'Tue', value: 112_000_000 },
      { day: 'Wed', value: 128_000_000 },
      { day: 'Thu', value: 0 },
      { day: 'Fri', value: 0 },
      { day: 'Sat', value: 0 },
      { day: 'Sun', value: 0 },
    ],
    exceededBehavior:
      'Quota is exceeded. This prototype shows the breach; live blocking is simulated only.',
    hasUnpricedUsage: true,
  },
  {
    id: 'quota-travel-weekly',
    name: 'Travel assistant weekly spend',
    scopeKind: 'Provider and model',
    provider: 'Provider A',
    modelId: 'model-frontier-l',
    limitType: 'USD',
    limitValue: 80_000,
    usedValue: 52_400,
    period: 'Weekly',
    resets: '2025-11-24',
    status: 'On track',
    workspaceId: 'ws-travel',
    keyId: 'key-travel',
    alertRuleId: null,
    usageSource: 'Brightsky Foundry usage ingest',
    dailyUsage: [
      { day: 'Mon', value: 8200 },
      { day: 'Tue', value: 8600 },
      { day: 'Wed', value: 9100 },
      { day: 'Thu', value: 8400 },
      { day: 'Fri', value: 7800 },
      { day: 'Sat', value: 5200 },
      { day: 'Sun', value: 5100 },
    ],
    exceededBehavior:
      'When exceeded, TokenOps can notify finance and platform owners.',
    hasUnpricedUsage: false,
  },
];

export function modelById(id: string) {
  return MODELS.find((m) => m.id === id);
}

export function connectionById(id: string) {
  return CONNECTIONS.find((c) => c.id === id);
}

export function deploymentById(id: string) {
  return DEPLOYMENTS.find((d) => d.id === id);
}

export function workspaceById(id: string) {
  return WORKSPACES.find((w) => w.id === id);
}

export function serverById(id: string) {
  return SERVERS.find((s) => s.id === id);
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatPricePer1M(value: number | null) {
  if (value === null) return 'Unpriced';
  return `${formatUsd(value)} per 1M`;
}

export function formatTokens(value: number) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return String(value);
}

export function quotaRemaining(quota: QuotaRecord) {
  return Math.max(0, quota.limitValue - quota.usedValue);
}

export function quotaUsagePercent(quota: QuotaRecord) {
  if (quota.limitValue <= 0) return 0;
  return Math.round((quota.usedValue / quota.limitValue) * 100);
}

export function formatQuotaAmount(value: number, limitType: QuotaLimitType) {
  return limitType === 'USD' ? formatUsd(value) : formatTokens(value);
}

export function scopeLabel(quota: QuotaRecord) {
  if (!quota.modelId) return quota.provider;
  const model = modelById(quota.modelId);
  return `${quota.provider} / ${model?.displayName ?? quota.modelId}`;
}

export function cloneSeed<T>(items: T[]): T[] {
  return items.map((item) => structuredClone(item));
}
