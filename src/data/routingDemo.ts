import { modelChartColors } from './modelColors';
import {
  brightsky,
  claims,
  formatCostPerUnit,
  formatUsd,
  PRIMARY_POLICY_NAME,
  PRIMARY_USE_CASE,
  type ScenarioEconomics,
} from './scenarioEconomics';

export type HostingLabel =
  | 'Public cloud'
  | 'Lenovo infrastructure'
  | 'Self-hosted'
  | 'On premises'
  | 'In-country'
  | 'On device';

export type RoutingStatus =
  | 'Selected'
  | 'Eligible'
  | 'Excluded'
  | 'Blocked by data policy'
  | 'Data residency requirement not met'
  | 'Insufficient quality'
  | 'Higher cost with no measurable benefit'
  | 'Latency threshold exceeded'
  | 'Infrastructure unavailable';

export type PolicyStageResult =
  | 'Passed'
  | 'Applied'
  | 'Restricted'
  | 'Blocked'
  | 'Selected';

export type TestRequestId = 'routine' | 'sensitive';

export type PolicyId = 'brightsky-quality' | 'protected-data' | 'dev-staging';

export type PriorityKey = 'cost' | 'quality' | 'latency';

export type ScenarioId = 'brightsky' | 'claims' | 'super-agent' | 'coding-agent';

export interface Priorities {
  cost: number;
  quality: number;
  latency: number;
}

export interface PolicyStage {
  id: string;
  name: string;
  result: PolicyStageResult;
  explanation: string;
  affectedEligibility: boolean;
}

export interface CandidateRoute {
  id: string;
  model: string;
  hosting: HostingLabel;
  workloadFit: string;
  quality: number;
  latencyMs: number;
  costPerRequest: number;
  securityEligible: boolean;
  status: RoutingStatus;
  exclusionReason?: string;
  /** Higher = preferred when eligible; used with priority weights. */
  baseScore: number;
}

/** @deprecated Prefer CandidateRoute */
export type CandidateModel = CandidateRoute;

export interface PreviousRoute {
  model: string;
  hosting: HostingLabel;
  cloudCost: number;
  infrastructureCost: number;
  totalCost: number;
  costPerUnit: number;
}

export interface OptimizedRoute {
  model: string;
  hosting: HostingLabel;
  infrastructure: string;
  totalCost: number;
  costPerUnit: number;
  reductionPercent: number;
  improvementMultiplier: number;
}

export interface RoutingPolicy {
  id: PolicyId;
  name: string;
  status: 'Active' | 'Inactive';
  scope: string;
  priorityOrder: number;
  eligibleModels: string[];
  eligibleHosting: HostingLabel[];
  securityRules: string[];
  governanceRules: string[];
  dataResidency?: string;
  qualityFloor: number;
  costPreference: string;
  latencyTarget: string;
  infrastructureRequirement: string;
  fallback: string;
  lastModified: string;
  scenarioId: ScenarioId;
  requestsRouted: string;
  averageSavings: string;
  averageSavingsCaption: string;
  defaultTestRequestId: TestRequestId;
}

export interface TestRequest {
  id: TestRequestId;
  label: string;
  policyId: PolicyId;
  request: string;
  complexity: 'Low' | 'High';
  sensitiveData: boolean;
  qualityRequirement: 'Standard' | 'High';
  latencyPriority: 'High' | 'Standard';
  costSensitivity: 'High' | 'Standard';
  dataResidency?: string;
  stages: PolicyStage[];
  candidates: CandidateRoute[];
  defaultSelectedId: string;
  qualityFloor: number;
  previousRoute: PreviousRoute;
  optimizedRoute: OptimizedRoute;
  explanation: (selected: CandidateRoute) => string;
  exclusionExplanation: (selected: CandidateRoute) => string;
  runsOn: string;
  location: HostingLabel;
  decision: string;
}

export interface RoutingDecisionRecord {
  id: string;
  timestamp: string;
  workload: string;
  policyId: PolicyId;
  selectedModel: string;
  routingReason: string;
  hosting: HostingLabel;
  estimatedCost: number;
  latencyMs: number;
  status: 'Completed' | 'Blocked' | 'Fallback';
}

export interface HistoricalRouteRow {
  id: string;
  match: string;
  model: string;
  why: string;
}

export interface PolicyImpactSeries {
  name: string;
  /** CSS custom property for chart fill, e.g. var(--color-badge-indigo) */
  color: string;
  emphasisColor: string;
  share: number;
}

export const DEFAULT_PRIORITIES: Priorities = {
  cost: 55,
  quality: 60,
  latency: 45,
};

function savingsCaption(scenario: ScenarioEconomics): string {
  return `${formatCostPerUnit(scenario.starting.costPerUnit)} → ${formatCostPerUnit(scenario.optimized.costPerUnit)} per unit`;
}

export const ROUTING_POLICIES: RoutingPolicy[] = [
  {
    id: 'brightsky-quality',
    name: PRIMARY_POLICY_NAME,
    status: 'Active',
    scope: PRIMARY_USE_CASE,
    priorityOrder: 1,
    eligibleModels: [
      'Llama 3.3 70B Instruct',
      'Claude Sonnet 4.6',
      'Qwen 8B',
      'Llama 3.1 405B Instruct',
    ],
    eligibleHosting: ['Lenovo infrastructure', 'Public cloud', 'Self-hosted', 'In-country'],
    securityRules: [
      'No hard block on public cloud when prompt has no protected data',
      'Block public cloud when PII or protected factory data is present',
    ],
    governanceRules: [
      'Prefer approved Lenovo infrastructure for routine inspection',
      'Sensitive customer data must remain in controlled environments',
    ],
    qualityFloor: 80,
    costPreference: 'Prefer lower estimated cost when quality and latency are met',
    latencyTarget: 'High priority for routine inspection',
    infrastructureRequirement: 'H100 capacity on Lenovo infrastructure',
    fallback: 'Escalate to Llama 3.1 405B in-country when self-hosted capacity is unavailable',
    lastModified: 'Nov 17, 2026 · 09:14 EST',
    scenarioId: 'brightsky',
    requestsRouted: '1.0M',
    averageSavings: `${brightsky.optimized.reductionPercent}%`,
    averageSavingsCaption: savingsCaption(brightsky),
    defaultTestRequestId: 'routine',
  },
  {
    id: 'protected-data',
    name: 'Protected Data Routing Policy',
    status: 'Active',
    scope: 'Claims processing · protected customer data',
    priorityOrder: 2,
    eligibleModels: ['Llama 3.1 405B Instruct', 'GPT-4o', 'Claude Sonnet 4.6', 'Llama 3.3 70B Instruct'],
    eligibleHosting: ['In-country', 'Public cloud', 'Lenovo infrastructure'],
    securityRules: [
      'Block public-cloud routes when email, customer, or other PII is detected',
      'Permit external routes only when no sensitive data is present',
    ],
    governanceRules: [
      'Protected claims data must remain in approved in-country environments',
      'Data residency cannot be overridden by cost or latency preferences',
    ],
    dataResidency: 'Must remain in the approved in-country environment',
    qualityFloor: 90,
    costPreference: 'Quality and residency over cost',
    latencyTarget: 'Standard',
    infrastructureRequirement: 'In-country H200 capacity',
    fallback: 'Llama 3.1 405B on Lenovo infrastructure if in-country capacity is unavailable',
    lastModified: 'Nov 16, 2026 · 14:02 EST',
    scenarioId: 'claims',
    requestsRouted: '100K',
    averageSavings: `${claims.optimized.reductionPercent}%`,
    averageSavingsCaption: savingsCaption(claims),
    defaultTestRequestId: 'sensitive',
  },
  {
    id: 'dev-staging',
    name: 'Dev / Staging Soft Policy',
    status: 'Inactive',
    scope: 'Allowlisted test tenants',
    priorityOrder: 3,
    eligibleModels: ['Qwen 8B', 'Qwen 32B', 'Llama 3.3 70B Instruct'],
    eligibleHosting: ['Self-hosted', 'Lenovo infrastructure'],
    securityRules: ['Warn on PII · do not hard-block in staging'],
    governanceRules: ['Allowlisted test tenants only'],
    qualityFloor: 70,
    costPreference: 'Minimize cost',
    latencyTarget: 'High',
    infrastructureRequirement: 'Any available self-hosted capacity',
    fallback: 'Qwen 8B self-hosted',
    lastModified: 'Nov 10, 2026 · 11:20 EST',
    scenarioId: 'brightsky',
    requestsRouted: '12K',
    averageSavings: '—',
    averageSavingsCaption: 'Staging only · not production economics',
    defaultTestRequestId: 'routine',
  },
];

export function getPolicy(id: PolicyId): RoutingPolicy {
  const found = ROUTING_POLICIES.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown routing policy: ${id}`);
  return found;
}

export function listPolicies(): RoutingPolicy[] {
  return [...ROUTING_POLICIES].sort((a, b) => a.priorityOrder - b.priorityOrder);
}

/** @deprecated Use getPolicy / listPolicies */
export const POLICY = getPolicy('brightsky-quality');

const NINE_STAGE_NAMES = [
  'Request received',
  'Policy lookup',
  'Security',
  'Governance',
  'Workload complexity',
  'Cost, quality, and latency',
  'Infrastructure availability',
  'Model and hosting selected',
  'Response returned',
] as const;

function stages(
  rows: Array<Omit<PolicyStage, 'name'> & { name?: string }>,
): PolicyStage[] {
  return rows.map((row, index) => ({
    ...row,
    name: row.name ?? NINE_STAGE_NAMES[index],
  }));
}

const routineCandidates: CandidateRoute[] = [
  {
    id: 'llama-70b',
    model: 'Llama 3.3 70B Instruct',
    hosting: 'Lenovo infrastructure',
    workloadFit: 'Routine inspection',
    quality: 88,
    latencyMs: 320,
    costPerRequest: brightsky.optimized.costPerUnit,
    securityEligible: true,
    status: 'Selected',
    baseScore: 92,
  },
  {
    id: 'claude-sonnet',
    model: 'Claude Sonnet 4.6',
    hosting: 'Public cloud',
    workloadFit: 'Previous / starting route',
    quality: 94,
    latencyMs: 520,
    costPerRequest: brightsky.starting.costPerUnit,
    securityEligible: true,
    status: 'Eligible',
    exclusionReason: 'Higher cost with no measurable benefit',
    baseScore: 55,
  },
  {
    id: 'qwen-8b',
    model: 'Qwen 8B',
    hosting: 'Self-hosted',
    workloadFit: 'Simple classification',
    quality: 72,
    latencyMs: 180,
    costPerRequest: 0.02,
    securityEligible: true,
    status: 'Insufficient quality',
    exclusionReason: 'Quality threshold not met',
    baseScore: 40,
  },
];

const sensitiveCandidates: CandidateRoute[] = [
  {
    id: 'llama-405b',
    model: 'Llama 3.1 405B Instruct',
    hosting: 'In-country',
    workloadFit: 'High-complexity / protected data',
    quality: 96,
    latencyMs: 780,
    costPerRequest: claims.optimized.costPerUnit,
    securityEligible: true,
    status: 'Selected',
    baseScore: 95,
  },
  {
    id: 'gpt-4o',
    model: 'GPT-4o',
    hosting: 'Public cloud',
    workloadFit: 'Frontier when permitted',
    quality: 95,
    latencyMs: 480,
    costPerRequest: 0.28,
    securityEligible: false,
    status: 'Blocked by data policy',
    exclusionReason: 'Blocked by data policy',
    baseScore: 0,
  },
  {
    id: 'claude-sonnet',
    model: 'Claude Sonnet 4.6',
    hosting: 'Public cloud',
    workloadFit: 'Previous / starting route',
    quality: 94,
    latencyMs: 520,
    costPerRequest: claims.starting.costPerUnit,
    securityEligible: false,
    status: 'Blocked by data policy',
    exclusionReason: 'Data residency requirement not met',
    baseScore: 0,
  },
  {
    id: 'llama-70b',
    model: 'Llama 3.3 70B Instruct',
    hosting: 'Lenovo infrastructure',
    workloadFit: 'Routine inspection',
    quality: 88,
    latencyMs: 320,
    costPerRequest: brightsky.optimized.costPerUnit,
    securityEligible: true,
    status: 'Insufficient quality',
    exclusionReason: 'Quality threshold not met',
    baseScore: 45,
  },
];

export const TEST_REQUESTS: Record<TestRequestId, TestRequest> = {
  routine: {
    id: 'routine',
    label: 'Routine inspection',
    policyId: 'brightsky-quality',
    request: 'Classify a routine quality-inspection result.',
    complexity: 'Low',
    sensitiveData: false,
    qualityRequirement: 'Standard',
    latencyPriority: 'High',
    costSensitivity: 'High',
    qualityFloor: 80,
    defaultSelectedId: 'llama-70b',
    runsOn: 'Lenovo ThinkSystem SR780a V3 · 2 × H100',
    location: 'Lenovo infrastructure',
    decision: 'Meets quality without the more expensive public-cloud route',
    previousRoute: {
      model: brightsky.starting.model,
      hosting: 'Public cloud',
      cloudCost: brightsky.starting.cloudCost,
      infrastructureCost: brightsky.starting.infrastructureCost,
      totalCost: brightsky.starting.totalCost,
      costPerUnit: brightsky.starting.costPerUnit,
    },
    optimizedRoute: {
      model: brightsky.optimized.model,
      hosting: 'Lenovo infrastructure',
      infrastructure: brightsky.optimized.infrastructure,
      totalCost: brightsky.optimized.totalCost,
      costPerUnit: brightsky.optimized.costPerUnit,
      reductionPercent: brightsky.optimized.reductionPercent,
      improvementMultiplier: brightsky.optimized.improvementMultiplier,
    },
    stages: stages([
      {
        id: 'received',
        result: 'Passed',
        explanation: 'Routine classification · low complexity · no PII detected',
        affectedEligibility: false,
      },
      {
        id: 'policy',
        result: 'Applied',
        explanation: `${PRIMARY_POLICY_NAME} matched`,
        affectedEligibility: false,
      },
      {
        id: 'security',
        result: 'Passed',
        explanation: 'No sensitive or customer data in prompt',
        affectedEligibility: false,
      },
      {
        id: 'governance',
        result: 'Passed',
        explanation: 'Allowed by governance · manufacturing scope confirmed',
        affectedEligibility: false,
      },
      {
        id: 'complexity',
        result: 'Applied',
        explanation: 'Standard quality floor (≥ 80) · Qwen 8B below threshold',
        affectedEligibility: true,
      },
      {
        id: 'cql',
        result: 'Applied',
        explanation: 'Cost and latency prioritized within quality floor',
        affectedEligibility: true,
      },
      {
        id: 'infra',
        result: 'Passed',
        explanation: 'H100 capacity available on Lenovo infrastructure',
        affectedEligibility: false,
      },
      {
        id: 'selected',
        result: 'Selected',
        explanation: 'Llama 3.3 70B Instruct · Lenovo infrastructure · 2 × H100',
        affectedEligibility: true,
      },
      {
        id: 'response',
        result: 'Passed',
        explanation: 'Completion returned to quality-inspection workload',
        affectedEligibility: false,
      },
    ]),
    candidates: routineCandidates,
    explanation: (selected) =>
      `This request was routed to ${selected.model} because it met the quality floor without using the more expensive public-cloud starting route, and Lenovo infrastructure capacity was available.`,
    exclusionExplanation: () =>
      `Claude Sonnet 4.6 remained eligible but was not selected — higher estimated cost with no measurable quality benefit for this routine workload. Qwen 8B was excluded because it did not meet the quality threshold.`,
  },
  sensitive: {
    id: 'sensitive',
    label: 'Protected claims request',
    policyId: 'protected-data',
    request:
      'Analyze claim CLM-48219 for ada@lovelace.com and recommend next action with supporting evidence.',
    complexity: 'High',
    sensitiveData: true,
    qualityRequirement: 'High',
    latencyPriority: 'Standard',
    costSensitivity: 'Standard',
    dataResidency: 'Must remain in the approved in-country environment',
    qualityFloor: 90,
    defaultSelectedId: 'llama-405b',
    runsOn: 'In-country H200 cluster',
    location: 'In-country',
    decision: 'Preserves data controls while meeting high quality requirements',
    previousRoute: {
      model: claims.starting.model,
      hosting: 'Public cloud',
      cloudCost: claims.starting.cloudCost,
      infrastructureCost: claims.starting.infrastructureCost,
      totalCost: claims.starting.totalCost,
      costPerUnit: claims.starting.costPerUnit,
    },
    optimizedRoute: {
      model: claims.optimized.model,
      hosting: 'In-country',
      infrastructure: claims.optimized.infrastructure,
      totalCost: claims.optimized.totalCost,
      costPerUnit: claims.optimized.costPerUnit,
      reductionPercent: claims.optimized.reductionPercent,
      improvementMultiplier: claims.optimized.improvementMultiplier,
    },
    stages: stages([
      {
        id: 'received',
        result: 'Passed',
        explanation: 'High complexity · email address and claim fields present',
        affectedEligibility: false,
      },
      {
        id: 'policy',
        result: 'Applied',
        explanation: 'Protected Data Routing Policy matched',
        affectedEligibility: false,
      },
      {
        id: 'security',
        result: 'Restricted',
        explanation: 'PII detected — public-cloud models blocked',
        affectedEligibility: true,
      },
      {
        id: 'governance',
        result: 'Restricted',
        explanation:
          'Protected claims data must stay in the controlled in-country environment',
        affectedEligibility: true,
      },
      {
        id: 'complexity',
        result: 'Applied',
        explanation: 'High quality floor (≥ 90) — mid-tier models insufficient',
        affectedEligibility: true,
      },
      {
        id: 'cql',
        result: 'Applied',
        explanation: 'Quality prioritized among security-eligible models only',
        affectedEligibility: true,
      },
      {
        id: 'infra',
        result: 'Passed',
        explanation: 'In-country H200 capacity available',
        affectedEligibility: false,
      },
      {
        id: 'selected',
        result: 'Selected',
        explanation: 'Llama 3.1 405B Instruct · in-country',
        affectedEligibility: true,
      },
      {
        id: 'response',
        result: 'Passed',
        explanation: 'Completion returned to claims workload',
        affectedEligibility: false,
      },
    ]),
    candidates: sensitiveCandidates,
    explanation: (selected) =>
      `This request was routed to ${selected.model} because governance blocked public-cloud routes after detecting protected customer data, and the model met the high quality threshold in the approved in-country environment.`,
    exclusionExplanation: () =>
      `GPT-4o and Claude Sonnet 4.6 were blocked because the policy does not permit protected customer data to leave the controlled environment. Llama 3.3 70B was excluded for insufficient quality.`,
  },
};

const HARD_BLOCKED: RoutingStatus[] = [
  'Blocked by data policy',
  'Data residency requirement not met',
  'Insufficient quality',
  'Infrastructure unavailable',
  'Latency threshold exceeded',
];

function isHardBlocked(c: CandidateRoute): boolean {
  return !c.securityEligible || HARD_BLOCKED.includes(c.status);
}

function isRankable(c: CandidateRoute, qualityFloor: number): boolean {
  if (isHardBlocked(c)) return false;
  if (c.quality < qualityFloor) return false;
  return true;
}

/**
 * Re-rank eligible candidates from Cost / Quality / Latency priorities.
 * Hard constraints never become Selected. Soft “higher cost” routes stay Eligible.
 */
export function rankCandidates(
  candidates: CandidateRoute[],
  priorities: Priorities,
  fallbackSelectedId: string,
  qualityFloor = 80,
): { ranked: CandidateRoute[]; selectedId: string; selectionUnchangedNote?: string } {
  const costW = priorities.cost / 100;
  const qualityW = priorities.quality / 100;
  const latencyW = priorities.latency / 100;

  const scored = candidates.map((c) => {
    if (!isRankable(c, qualityFloor)) {
      return { ...c, _score: -1 };
    }
    const costScore = 1 - Math.min(c.costPerRequest / 0.5, 1);
    const qualityScore = c.quality / 100;
    const latencyScore = 1 - Math.min(c.latencyMs / 1000, 1);
    // baseScore bias keeps Llama 70B ahead of Claude under default priorities
    const weighted =
      costScore * costW + qualityScore * qualityW + latencyScore * latencyW + c.baseScore / 100;
    return { ...c, _score: weighted };
  });

  const eligible = scored.filter((c) => c._score >= 0).sort((a, b) => b._score - a._score);
  const best = eligible[0];
  const selectedId = best?.id ?? fallbackSelectedId;

  const ranked: CandidateRoute[] = candidates.map((c) => {
    if (isHardBlocked(c)) return c;
    if (c.quality < qualityFloor) {
      return {
        ...c,
        status: 'Insufficient quality' as const,
        exclusionReason: c.exclusionReason ?? 'Quality threshold not met',
      };
    }
    if (c.id === selectedId) {
      return { ...c, status: 'Selected' as const, exclusionReason: undefined };
    }
    return {
      ...c,
      status: 'Eligible' as const,
      exclusionReason:
        c.costPerRequest > (best?.costPerRequest ?? 0) * 1.5
          ? 'Higher cost with no measurable benefit'
          : c.exclusionReason,
    };
  });

  const selectionUnchangedNote =
    selectedId === fallbackSelectedId
      ? 'Current selection remains the best eligible route under these priorities.'
      : undefined;

  return { ranked, selectedId, selectionUnchangedNote };
}

/** Router graph columns (screenshot interaction model). */
export type RouterColumn = 'policy' | 'security' | 'governance' | 'costQuality';

export type LaneNodeState = 'Eligible' | 'Routed' | 'Blocked' | 'NotSelected';

export const ROUTER_COLUMNS: { id: RouterColumn; label: string }[] = [
  { id: 'policy', label: 'Policy' },
  { id: 'security', label: 'Security' },
  { id: 'governance', label: 'Governance' },
  { id: 'costQuality', label: 'Cost / quality' },
];

export interface RouterLaneResult {
  candidateId: string;
  model: string;
  hosting: HostingLabel;
  quality: number;
  latencyMs: number;
  costPerRequest: number;
  nodes: Record<RouterColumn, LaneNodeState>;
  reasons: string[];
  isRouted: boolean;
}

export interface PromptEvaluation {
  prompt: string;
  policyId: PolicyId;
  testRequestId: TestRequestId;
  sensitive: boolean;
  selectedId: string;
  selectedModel: string;
  lanes: RouterLaneResult[];
  statusMessage: string;
  judgement: TryJudgement;
}

/**
 * Idle fan-out lanes for a policy — one line per candidate, no verdict yet.
 * Matches the Tokenops LHCP routing graph before “Try a request”.
 */
export function idleLanesForPolicy(policyId: PolicyId): RouterLaneResult[] {
  const policy = getPolicy(policyId);
  const request = TEST_REQUESTS[policy.defaultTestRequestId];
  return request.candidates.map((candidate) => ({
    candidateId: candidate.id,
    model: candidate.model,
    hosting: candidate.hosting,
    quality: candidate.quality,
    latencyMs: candidate.latencyMs,
    costPerRequest: candidate.costPerRequest,
    nodes: {
      policy: 'Eligible',
      security: 'Eligible',
      governance: 'Eligible',
      costQuality: 'Eligible',
    },
    reasons: [],
    isRouted: false,
  }));
}

export const SAMPLE_PROMPTS = {
  routine: 'Classify a routine quality-inspection result across production lines.',
  pii: 'Analyze claim CLM-48219 for ada@lovelace.com and recommend next action.',
  sku: 'Look up defect code DEF-204 for SKU A-118 and return the standard disposition.',
  escalation:
    'Summarize why this non-sensitive inspection failed three times and recommend next engineering steps.',
} as const;

export interface PromptLibraryItem {
  id: string;
  title: string;
  summary: string;
  prompt: string;
  kind: 'routine' | 'pii' | 'simple' | 'escalation';
}

/** Demo prompt library — pick one to simulate a request (not pre-filled). */
export const PROMPT_LIBRARY: PromptLibraryItem[] = [
  {
    id: 'lib-routine',
    title: 'Summarize a routine inspection',
    summary: 'Low complexity · no PII · quality floor standard',
    prompt: SAMPLE_PROMPTS.routine,
    kind: 'routine',
  },
  {
    id: 'lib-pii',
    title: 'Handle a protected claim with PII',
    summary: 'Includes email PII · public-cloud routes blocked',
    prompt: SAMPLE_PROMPTS.pii,
    kind: 'pii',
  },
  {
    id: 'lib-sku',
    title: 'Classify a SKU defect',
    summary: 'Simple classification · latency-friendly',
    prompt: SAMPLE_PROMPTS.sku,
    kind: 'simple',
  },
  {
    id: 'lib-escalation',
    title: 'Escalate an engineering issue',
    summary: 'Non-sensitive · deeper reasoning allowed',
    prompt: SAMPLE_PROMPTS.escalation,
    kind: 'escalation',
  },
];

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const SSN_RE = /\b(?:\d{3}-\d{2}-\d{4}|social security|ssn)\b/i;
const CC_RE = /\b(?:\d[ -]*?){13,19}\b|\bcredit card\b/i;
const PII_HINT_RE = /\b(ssn|social security|passport|claim\s*#?\s*\d+|pii|customer data|protected)\b/i;

/** Try-a-prompt judgement controls (Tokenops LHCP policy strip). */
export type SecurityPatternChoice = 'none' | 'email' | 'ssn' | 'cc' | 'all';
export type GovernanceChoice = 'off' | 'pii-inside-only';
export type CostQualityChoice =
  | 'easy-cheap-else-quality'
  | 'always-cheap'
  | 'always-one';
export type PiiDetectorChoice = 'semantic' | 'webhook' | 'none';

export interface TryJudgement {
  securityPatterns: SecurityPatternChoice;
  governance: GovernanceChoice;
  costQuality: CostQualityChoice;
  piiDetector: PiiDetectorChoice;
}

export const DEFAULT_TRY_JUDGEMENT: TryJudgement = {
  securityPatterns: 'none',
  governance: 'pii-inside-only',
  costQuality: 'easy-cheap-else-quality',
  piiDetector: 'semantic',
};

export const SECURITY_PATTERN_OPTIONS = [
  { value: 'none', label: 'No security patterns' },
  { value: 'email', label: 'Email address' },
  { value: 'ssn', label: 'US Social Security number' },
  { value: 'cc', label: 'Credit card number' },
  { value: 'all', label: 'Email + SSN + credit card' },
] as const;

export const GOVERNANCE_OPTIONS = [
  { value: 'off', label: 'No governance gate' },
  {
    value: 'pii-inside-only',
    label: 'If PII, keep only inside models',
  },
] as const;

export const COST_QUALITY_OPTIONS = [
  {
    value: 'easy-cheap-else-quality',
    label: 'Easy → cheapest · else highest quality',
  },
  { value: 'always-cheap', label: 'Always use the cheapest model' },
  { value: 'always-one', label: 'Always use the highest-quality model' },
] as const;

export const PII_DETECTOR_OPTIONS = [
  { value: 'semantic', label: 'vLLM Semantic Router classifies PII' },
  { value: 'webhook', label: 'Governance webhook rejects the request' },
  { value: 'none', label: 'No PII detector' },
] as const;

export function detectSensitive(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  return EMAIL_RE.test(text) || PII_HINT_RE.test(text);
}

function securityPatternHit(prompt: string, choice: SecurityPatternChoice): string | null {
  const text = prompt.trim();
  if (!text || choice === 'none') return null;
  const checkEmail = choice === 'email' || choice === 'all';
  const checkSsn = choice === 'ssn' || choice === 'all';
  const checkCc = choice === 'cc' || choice === 'all';
  if (checkEmail && EMAIL_RE.test(text)) return 'Email address';
  if (checkSsn && SSN_RE.test(text)) return 'US Social Security number';
  if (checkCc && CC_RE.test(text)) return 'Credit card number';
  return null;
}

function detectPiiWithJudgement(prompt: string, judgement: TryJudgement): boolean {
  if (judgement.piiDetector === 'none') return false;
  return detectSensitive(prompt);
}

function isInsideHosting(hosting: HostingLabel): boolean {
  return (
    hosting === 'Lenovo infrastructure' ||
    hosting === 'In-country' ||
    hosting === 'Self-hosted' ||
    hosting === 'On premises' ||
    hosting === 'On device'
  );
}

function applyJudgementToCandidates(
  candidates: CandidateRoute[],
  _prompt: string,
  judgement: TryJudgement,
  pii: boolean,
): CandidateRoute[] {
  return candidates.map((c) => {
    let next = { ...c };
    if (
      judgement.governance === 'pii-inside-only' &&
      pii &&
      !isInsideHosting(c.hosting)
    ) {
      next = {
        ...next,
        securityEligible: false,
        status: 'Blocked by data policy',
        exclusionReason: 'PII must stay on inside models',
      };
    }
    return next;
  });
}

function selectByObjective(
  eligible: CandidateRoute[],
  fallbackSelectedId: string,
  objective: CostQualityChoice,
  request: TestRequest,
): string {
  if (eligible.length === 0) return fallbackSelectedId;
  if (objective === 'always-one') {
    // Always pin to the single highest-quality eligible model.
    return [...eligible].sort(
      (a, b) => b.quality - a.quality || a.costPerRequest - b.costPerRequest,
    )[0].id;
  }
  if (objective === 'always-cheap') {
    return [...eligible].sort((a, b) => a.costPerRequest - b.costPerRequest)[0].id;
  }
  // easy-cheap-else-quality
  if (request.complexity === 'Low') {
    return [...eligible].sort((a, b) => a.costPerRequest - b.costPerRequest)[0].id;
  }
  return (
    eligible.find((c) => c.id === fallbackSelectedId)?.id ??
    [...eligible].sort((a, b) => b.quality - a.quality)[0].id
  );
}

function resolveTestRequestId(policyId: PolicyId, sensitive: boolean): TestRequestId {
  if (policyId === 'protected-data' || sensitive) return 'sensitive';
  return 'routine';
}

function laneForCandidate(
  candidate: CandidateRoute,
  selectedId: string,
  sensitive: boolean,
  qualityFloor: number,
): RouterLaneResult {
  const isSelected = candidate.id === selectedId;
  const securityBlocked = !candidate.securityEligible;
  const residencyBlocked = candidate.status === 'Data residency requirement not met';
  const qualityBlocked =
    candidate.quality < qualityFloor || candidate.status === 'Insufficient quality';
  const policyBlocked = false;

  const nodes: Record<RouterColumn, LaneNodeState> = {
    policy: 'Eligible',
    security: 'Eligible',
    governance: 'Eligible',
    costQuality: 'Eligible',
  };
  const reasons: string[] = [];

  if (policyBlocked) {
    nodes.policy = 'Blocked';
    nodes.security = 'NotSelected';
    nodes.governance = 'NotSelected';
    nodes.costQuality = 'NotSelected';
    reasons.push('policy: not matched for this request');
  } else if (securityBlocked) {
    nodes.security = 'Blocked';
    nodes.governance = 'NotSelected';
    nodes.costQuality = 'NotSelected';
    reasons.push(
      sensitive
        ? `security: Message contains PII. Public-cloud route blocked for ${candidate.model}`
        : `security: ${candidate.exclusionReason ?? 'Blocked by data policy'}`,
    );
    reasons.push(`router: not selected; chose alternate eligible route`);
  } else if (residencyBlocked) {
    nodes.governance = 'Blocked';
    nodes.costQuality = 'NotSelected';
    reasons.push('governance: Data residency requirement not met');
    reasons.push('router: not selected; protected data must stay in-country');
  } else if (qualityBlocked) {
    nodes.costQuality = 'NotSelected';
    reasons.push('governance: allowed by governance');
    reasons.push(
      `cost/quality: Insufficient quality · below floor (≥ ${qualityFloor})`,
    );
  } else if (isSelected) {
    nodes.costQuality = 'Routed';
    reasons.push('governance: allowed by governance');
    reasons.push(`router: selected ${candidate.model}`);
  } else {
    nodes.costQuality = 'NotSelected';
    reasons.push('governance: allowed by governance');
    reasons.push(
      candidate.exclusionReason
        ? `router: not selected; ${candidate.exclusionReason}`
        : 'router: not selected',
    );
  }

  return {
    candidateId: candidate.id,
    model: candidate.model,
    hosting: candidate.hosting,
    quality: candidate.quality,
    latencyMs: candidate.latencyMs,
    costPerRequest: candidate.costPerRequest,
    nodes,
    reasons,
    isRouted: isSelected,
  };
}

function rejectedEvaluation(
  prompt: string,
  policyId: PolicyId,
  testRequestId: TestRequestId,
  sensitive: boolean,
  candidates: CandidateRoute[],
  judgement: TryJudgement,
  blockAt: 'security' | 'governance',
  statusMessage: string,
  reasons: string[],
): PromptEvaluation {
  const lanes = candidates.map((c) => {
    const nodes: Record<RouterColumn, LaneNodeState> = {
      policy: 'Eligible',
      security: blockAt === 'security' ? 'Blocked' : 'Eligible',
      governance: blockAt === 'governance' ? 'Blocked' : 'NotSelected',
      costQuality: 'NotSelected',
    };
    if (blockAt === 'security') {
      nodes.governance = 'NotSelected';
    }
    return {
      candidateId: c.id,
      model: c.model,
      hosting: c.hosting,
      quality: c.quality,
      latencyMs: c.latencyMs,
      costPerRequest: c.costPerRequest,
      nodes,
      reasons,
      isRouted: false,
    } satisfies RouterLaneResult;
  });

  return {
    prompt,
    policyId,
    testRequestId,
    sensitive,
    selectedId: '',
    selectedModel: '—',
    lanes,
    statusMessage,
    judgement,
  };
}

/**
 * Deterministic try-request evaluation for the router overlay.
 * Maps free-text prompts onto inventory candidate pools (no live API).
 */
export function evaluatePrompt(
  prompt: string,
  policyId: PolicyId,
  priorities: Priorities = DEFAULT_PRIORITIES,
  judgement: TryJudgement = DEFAULT_TRY_JUDGEMENT,
): PromptEvaluation {
  const trimmed = prompt.trim() || SAMPLE_PROMPTS.routine;
  const hasPii = detectPiiWithJudgement(trimmed, judgement);
  const sensitivePath = hasPii || policyId === 'protected-data';
  const testRequestId = resolveTestRequestId(policyId, hasPii);
  const request = TEST_REQUESTS[testRequestId];
  const known = ROUTING_POLICIES.find((p) => p.id === policyId);
  const resolvedPolicyId = known?.id ?? request.policyId;

  const patternHit = securityPatternHit(trimmed, judgement.securityPatterns);
  if (patternHit) {
    return rejectedEvaluation(
      trimmed,
      resolvedPolicyId,
      testRequestId,
      sensitivePath,
      request.candidates,
      judgement,
      'security',
      `Security rejected the request (${patternHit}).`,
      [
        `security: ${patternHit} matched — request rejected`,
        'router: not selected; security pattern blocked the request',
      ],
    );
  }

  // Webhook detector rejects PII outright (semantic routes to inside models instead).
  if (hasPii && judgement.piiDetector === 'webhook') {
    return rejectedEvaluation(
      trimmed,
      resolvedPolicyId,
      testRequestId,
      sensitivePath,
      request.candidates,
      judgement,
      'governance',
      'Governance webhook rejected the request (PII).',
      [
        'governance: webhook signaled PII — request rejected',
        'router: not selected; switch to semantic PII detection to route inside models',
      ],
    );
  }

  const adjusted = applyJudgementToCandidates(
    request.candidates,
    trimmed,
    judgement,
    hasPii,
  );

  const { ranked, selectedId: prioritySelectedId } = rankCandidates(
    adjusted,
    priorities,
    request.defaultSelectedId,
    request.qualityFloor,
  );

  const eligible = ranked.filter(
    (c) => c.status === 'Selected' || c.status === 'Eligible',
  );
  const selectedId = selectByObjective(
    eligible,
    prioritySelectedId,
    judgement.costQuality,
    request,
  );

  const rankedForObjective: CandidateRoute[] = ranked.map((c) => {
    if (isHardBlocked(c) || c.quality < request.qualityFloor) return c;
    if (c.id === selectedId) {
      return { ...c, status: 'Selected' as const, exclusionReason: undefined };
    }
    if (c.status === 'Selected') {
      return {
        ...c,
        status: 'Eligible' as const,
        exclusionReason:
          judgement.costQuality === 'always-cheap'
            ? 'Higher cost with no measurable benefit'
            : judgement.costQuality === 'always-one'
              ? 'Not the pinned model for this objective'
              : c.exclusionReason ?? 'Not selected by cost / quality objective',
      };
    }
    return c;
  });

  const selected = rankedForObjective.find((c) => c.id === selectedId);
  const lanes = rankedForObjective.map((c) =>
    laneForCandidate(
      c,
      selectedId,
      sensitivePath,
      request.qualityFloor,
    ),
  );

  return {
    prompt: trimmed,
    policyId: resolvedPolicyId,
    testRequestId,
    sensitive: sensitivePath,
    selectedId,
    selectedModel: selected?.model ?? '—',
    lanes,
    statusMessage: buildStatusMessage(hasPii, judgement, selected?.model),
    judgement,
  };
}

function buildStatusMessage(
  hasPii: boolean,
  judgement: TryJudgement,
  selectedModel: string | undefined,
): string {
  const model = selectedModel ?? 'an eligible model';
  const objective =
    judgement.costQuality === 'always-cheap'
      ? 'Always cheapest'
      : judgement.costQuality === 'always-one'
        ? 'Single high-quality model'
        : 'Easy → cheap · else quality';

  if (hasPii && judgement.governance === 'pii-inside-only') {
    return `PII detected — ${objective} routed to ${model} on inside hosting.`;
  }
  if (hasPii && judgement.governance === 'off') {
    return `PII present but governance is off — ${objective} routed to ${model}.`;
  }
  if (judgement.piiDetector === 'none') {
    return `PII detector off — ${objective} routed to ${model}.`;
  }
  return `${objective} routed to ${model}.`;
}

/** Re-rank an existing evaluation when Cost / Quality / Latency priorities change. */
export function applyPrioritiesToEvaluation(
  evaluation: PromptEvaluation,
  priorities: Priorities,
  judgement: TryJudgement = evaluation.judgement ?? DEFAULT_TRY_JUDGEMENT,
): PromptEvaluation {
  return evaluatePrompt(
    evaluation.prompt,
    evaluation.policyId,
    priorities,
    judgement,
  );
}

/** Sample prompt for inspecting a historical decision row. */
export function promptForDecision(row: RoutingDecisionRecord): string {
  return samplePromptForPolicy(row.policyId);
}

export function samplePromptForPolicy(policyId: PolicyId): string {
  const policy = ROUTING_POLICIES.find((p) => p.id === policyId);
  const requestId = policy?.defaultTestRequestId ?? 'routine';
  return requestId === 'sensitive' ? SAMPLE_PROMPTS.pii : SAMPLE_PROMPTS.routine;
}

export function routeSummary(selected: CandidateRoute, request: TestRequest): string {
  const policy = getPolicy(request.policyId);
  return `Request → ${policy.name} → Security and governance → ${selected.model} → ${selected.hosting}`;
}

export function formatRouteEconomics(route: PreviousRoute | OptimizedRoute): string {
  if ('cloudCost' in route) {
    return `${formatUsd(route.totalCost)} total · ${formatCostPerUnit(route.costPerUnit)} per unit (${formatUsd(route.cloudCost)} cloud + ${formatUsd(route.infrastructureCost)} infrastructure)`;
  }
  return `${formatUsd(route.totalCost)} total · ${formatCostPerUnit(route.costPerUnit)} per unit · ${route.infrastructure}`;
}

export const RECENT_DECISIONS: RoutingDecisionRecord[] = [
  {
    id: 'rd-1',
    timestamp: 'Nov 18, 10:05',
    workload: 'Claims processing',
    policyId: 'protected-data',
    selectedModel: 'Llama 3.1 405B Instruct',
    routingReason: 'PII blocked public cloud · in-country',
    hosting: 'In-country',
    estimatedCost: claims.optimized.costPerUnit,
    latencyMs: 780,
    status: 'Completed',
  },
  {
    id: 'rd-2',
    timestamp: 'Nov 18, 09:14',
    workload: 'Quality inspection',
    policyId: 'brightsky-quality',
    selectedModel: 'Llama 3.3 70B Instruct',
    routingReason: 'Met quality · lower cost vs public cloud',
    hosting: 'Lenovo infrastructure',
    estimatedCost: brightsky.optimized.costPerUnit,
    latencyMs: 320,
    status: 'Completed',
  },
  {
    id: 'rd-3',
    timestamp: 'Nov 18, 09:02',
    workload: 'Quality inspection',
    policyId: 'brightsky-quality',
    selectedModel: 'Llama 3.3 70B Instruct',
    routingReason: 'Best balance for routine inspection',
    hosting: 'Lenovo infrastructure',
    estimatedCost: brightsky.optimized.costPerUnit,
    latencyMs: 310,
    status: 'Completed',
  },
  {
    id: 'rd-4',
    timestamp: 'Nov 17, 16:22',
    workload: 'Claims processing',
    policyId: 'protected-data',
    selectedModel: 'Llama 3.1 405B Instruct',
    routingReason: 'Protected data · high quality · in-country',
    hosting: 'In-country',
    estimatedCost: claims.optimized.costPerUnit,
    latencyMs: 790,
    status: 'Completed',
  },
  {
    id: 'rd-5',
    timestamp: 'Nov 17, 14:48',
    workload: 'Quality inspection',
    policyId: 'brightsky-quality',
    selectedModel: 'Llama 3.3 70B Instruct',
    routingReason: 'Cost and latency within quality floor',
    hosting: 'Lenovo infrastructure',
    estimatedCost: brightsky.optimized.costPerUnit,
    latencyMs: 305,
    status: 'Completed',
  },
  {
    id: 'rd-6',
    timestamp: 'Nov 17, 11:05',
    workload: 'Quality inspection',
    policyId: 'brightsky-quality',
    selectedModel: 'Qwen 8B',
    routingReason: 'Low complexity · latency prioritized',
    hosting: 'Lenovo infrastructure',
    estimatedCost: brightsky.optimized.costPerUnit * 0.4,
    latencyMs: 140,
    status: 'Completed',
  },
  {
    id: 'rd-7',
    timestamp: 'Nov 16, 15:40',
    workload: 'Claims processing',
    policyId: 'protected-data',
    selectedModel: 'Llama 3.1 405B Instruct',
    routingReason: 'Security pattern blocked public cloud',
    hosting: 'In-country',
    estimatedCost: claims.starting.costPerUnit,
    latencyMs: 0,
    status: 'Blocked',
  },
  {
    id: 'rd-8',
    timestamp: 'Nov 16, 13:22',
    workload: 'Quality inspection',
    policyId: 'dev-staging',
    selectedModel: 'Claude Sonnet 4.6',
    routingReason: 'Soft policy · frontier model allowed in staging',
    hosting: 'Public cloud',
    estimatedCost: brightsky.starting.costPerUnit,
    latencyMs: 410,
    status: 'Completed',
  },
  {
    id: 'rd-9',
    timestamp: 'Nov 15, 18:01',
    workload: 'Quality inspection',
    policyId: 'brightsky-quality',
    selectedModel: 'Claude Sonnet 4.6',
    routingReason: 'Fallback after primary capacity soft limit',
    hosting: 'Public cloud',
    estimatedCost: brightsky.starting.costPerUnit,
    latencyMs: 455,
    status: 'Fallback',
  },
  {
    id: 'rd-10',
    timestamp: 'Nov 15, 09:33',
    workload: 'Claims processing',
    policyId: 'protected-data',
    selectedModel: 'Llama 3.1 405B Instruct',
    routingReason: 'Residency gate · in-country H200',
    hosting: 'In-country',
    estimatedCost: claims.optimized.costPerUnit,
    latencyMs: 760,
    status: 'Completed',
  },
  {
    id: 'rd-11',
    timestamp: 'Nov 14, 16:12',
    workload: 'Quality inspection',
    policyId: 'dev-staging',
    selectedModel: 'Llama 3.3 70B Instruct',
    routingReason: 'Staging soft constraints · cost preferred',
    hosting: 'Lenovo infrastructure',
    estimatedCost: brightsky.optimized.costPerUnit,
    latencyMs: 290,
    status: 'Completed',
  },
];

export const POLICY_IMPACT_CATEGORIES = ['Oct 20-26', 'Oct 27-Nov 2', 'Nov 3-9', 'Nov 10-16'];

export const POLICY_IMPACT_WEEKLY_TOTALS = [0.92, 0.98, 1.05, 1.12];

/** Chart fills mirror cake& badge tokens via modelColors (ECharts needs resolved colors). */
export const POLICY_IMPACT_SERIES: PolicyImpactSeries[] = [
  {
    name: 'Claude Sonnet 4.6 22%',
    ...modelChartColors('Claude Sonnet 4.6'),
    share: 0.22,
  },
  {
    name: 'Llama 3.3 70B 48%',
    ...modelChartColors('Llama 3.3 70B'),
    share: 0.48,
  },
  {
    name: 'Llama 3.1 405B 18%',
    ...modelChartColors('Llama 3.1 405B'),
    share: 0.18,
  },
  {
    name: 'Qwen 8B 12%',
    ...modelChartColors('Qwen 8B'),
    share: 0.12,
  },
];

export const HISTORICAL_ROUTES: HistoricalRouteRow[] = [
  {
    id: 'routine-classify',
    match: 'Routine quality-inspection classification',
    model: 'Llama 3.3 70B Instruct',
    why: 'Meets quality floor at lower cost on Lenovo infrastructure',
  },
  {
    id: 'simple-lookup',
    match: 'Simple defect code / SKU lookup',
    model: 'Qwen 8B',
    why: 'Low complexity · latency prioritized',
  },
  {
    id: 'sensitive-analysis',
    match: 'Complex issues with customer or production data',
    model: 'Llama 3.1 405B Instruct',
    why: 'Blocked from public cloud · in-country H200',
  },
  {
    id: 'escalation',
    match: 'Escalations requiring frontier reasoning (non-sensitive)',
    model: 'Claude Sonnet 4.6',
    why: 'Quality priority · security permits external route',
  },
];

export function decisionsForPolicy(policyId: PolicyId): RoutingDecisionRecord[] {
  return RECENT_DECISIONS.filter((d) => d.policyId === policyId);
}

/** Empty `policyIds` means all policies (no filter). */
export function decisionsForPolicies(policyIds: PolicyId[]): RoutingDecisionRecord[] {
  if (policyIds.length === 0) return [...RECENT_DECISIONS];
  const allowed = new Set(policyIds);
  return RECENT_DECISIONS.filter((d) => allowed.has(d.policyId));
}

/**
 * Relative weekly traffic weight per policy — used to scale the impact chart
 * when filtering. Shares sum to 1 across seeded policies.
 */
export const POLICY_TRAFFIC_SHARE: Record<PolicyId, number> = {
  'brightsky-quality': 0.85,
  'protected-data': 0.12,
  'dev-staging': 0.03,
};

export function trafficShareForPolicies(policyIds: PolicyId[]): number {
  if (policyIds.length === 0) return 1;
  return policyIds.reduce((sum, id) => sum + (POLICY_TRAFFIC_SHARE[id] ?? 0), 0);
}

export function parseRequestsRouted(value: string): number {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.endsWith('M')) return (parseFloat(trimmed) || 0) * 1_000_000;
  if (trimmed.endsWith('K')) return (parseFloat(trimmed) || 0) * 1_000;
  return parseFloat(trimmed.replace(/,/g, '')) || 0;
}

export function formatRequestsRouted(total: number): string {
  if (total >= 1_000_000) {
    const millions = total / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (total >= 1_000) {
    const thousands = total / 1_000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
  }
  return String(Math.round(total));
}

export function aggregatePolicyMetrics(policies: RoutingPolicy[]): {
  requestsRouted: string;
  averageSavings: string;
  averageSavingsCaption: string;
  scopeCaption: string;
} {
  if (policies.length === 0) {
    return {
      requestsRouted: '—',
      averageSavings: '—',
      averageSavingsCaption: 'No policies in filter',
      scopeCaption: 'No policies selected',
    };
  }
  if (policies.length === 1) {
    const only = policies[0];
    return {
      requestsRouted: only.requestsRouted,
      averageSavings: only.averageSavings,
      averageSavingsCaption: only.averageSavingsCaption,
      scopeCaption: only.scope,
    };
  }

  const requests = policies.reduce(
    (sum, policy) => sum + parseRequestsRouted(policy.requestsRouted),
    0,
  );
  const weighted = policies.reduce(
    (acc, policy) => {
      const weight = parseRequestsRouted(policy.requestsRouted);
      const pct = parseFloat(policy.averageSavings);
      if (!Number.isFinite(pct) || weight <= 0) return acc;
      return { sum: acc.sum + pct * weight, weight: acc.weight + weight };
    },
    { sum: 0, weight: 0 },
  );

  return {
    requestsRouted: formatRequestsRouted(requests),
    averageSavings:
      weighted.weight > 0 ? `${Math.round(weighted.sum / weighted.weight)}%` : 'Mixed',
    averageSavingsCaption: `Across ${policies.length} filtered policies`,
    scopeCaption: `${policies.length} policies in filter`,
  };
}

export function decisionsForRequest(requestId: TestRequestId): RoutingDecisionRecord[] {
  const policyId = TEST_REQUESTS[requestId].policyId;
  return decisionsForPolicy(policyId);
}
