/**
 * Corrected TokenOps scenario economics — single source of truth for the prototype.
 * Full starting cost includes public-cloud tokens + existing infrastructure.
 * Figures follow Token-Ops-inventory (prices as of 6 November 2026).
 */

/** Named demo client. */
export const CLIENT_NAME = 'Brightsky';

/** Primary Brightsky use case shown across the prototype. */
export const PRIMARY_USE_CASE =
  'AI-powered quality inspection across multiple production lines';

/** Primary routing policy for the quality-inspection demo. */
export const PRIMARY_POLICY_NAME = 'Brightsky Quality Inspection Policy';

/** Primary routing scenario label (workload, not client name). */
export const PRIMARY_ROUTING_SCENARIO = 'Quality inspection';

/**
 * Inventory calculation assumptions (Token-Ops-inventory).
 * Booth monthly figures are CoreWeave rental card basis, not Lenovo list pricing.
 */
export const INVENTORY_ASSUMPTIONS = {
  priceAsOf: '6 November 2026',
  sonnetBlendedPerMillion: 6,
  inputOutputMix: '3:1',
  rentalHoursPerMonth: 730,
  /** ThinkSystem SR780a V3 · 8 × H100 monthly booth. */
  h100BoothMonthly: 30_000,
  /** 8 × H200 monthly booth. */
  h200BoothMonthly: 37_000,
  /** ThinkStation PGX monthly assumption (open vs ~$5,859 purchase listing). */
  pgxMonthly: 4_000,
  pgxPurchaseListingNote: '$5,859 public purchase listing — monthly $4K remains an open question',
  cloudCostMethod:
    'Monthly tokens ÷ 1,000,000 × $6 blended Sonnet rate',
  machineBasis: {
    h100: 'Lenovo ThinkSystem SR780a V3 · 8 × H100 · $30K/mo',
    h200: '8 × H200 system · $37K/mo',
    pgx: 'Lenovo ThinkStation PGX · $4K/mo',
  },
} as const;

export interface ScenarioEconomics {
  id: string;
  name: string;
  workload: string;
  volumeLabel: string;
  tokensPerUnit: number;
  starting: {
    cloudCost: number;
    infrastructureCost: number;
    totalCost: number;
    costPerUnit: number;
    model: string;
    hosting: string;
    /** Short inventory note, e.g. idle booth count. */
    infrastructureNote?: string;
  };
  optimized: {
    totalCost: number;
    costPerUnit: number;
    model: string;
    hosting: string;
    infrastructure: string;
    reductionPercent: number;
    improvementMultiplier: number;
  };
}

/**
 * Brightsky primary scenario.
 * Starting: Sonnet 4.6 public cloud + one idle H100 booth.
 * Optimized: Llama 3.3 70B on two H100 servers (Lenovo infrastructure).
 */
export const brightsky: ScenarioEconomics = {
  id: 'brightsky',
  name: 'Quality inspection',
  workload: 'Quality inspection across production lines',
  volumeLabel: '1,000,000 chats × 35,000 tokens',
  tokensPerUnit: 35_000,
  starting: {
    cloudCost: 210_000,
    infrastructureCost: 30_000,
    totalCost: 240_000,
    costPerUnit: 0.24,
    model: 'Claude Sonnet 4.6',
    hosting: 'Public cloud',
    infrastructureNote: '1 × idle H100 booth ($30K)',
  },
  optimized: {
    totalCost: 60_000,
    costPerUnit: 0.06,
    model: 'Llama 3.3 70B Instruct',
    hosting: 'Lenovo infrastructure',
    infrastructure: '2 × H100 · ThinkSystem SR780a V3',
    reductionPercent: 75,
    improvementMultiplier: 4,
  },
};

/**
 * Super agent — stays on a large model.
 * Starting: Sonnet + five H100 servers.
 * Optimized: Llama 3.1 405B on approximately six H200 servers.
 */
export const superAgent: ScenarioEconomics = {
  id: 'super-agent',
  name: 'Super agent',
  workload: 'Complex multi-step tasks',
  volumeLabel: '500,000 tasks × 150,000 tokens',
  tokensPerUnit: 150_000,
  starting: {
    cloudCost: 450_000,
    infrastructureCost: 150_000,
    totalCost: 600_000,
    costPerUnit: 1.2,
    model: 'Claude Sonnet 4.6',
    hosting: 'Public cloud',
    infrastructureNote: '5 × H100 servers ($150K)',
  },
  optimized: {
    totalCost: 225_000,
    costPerUnit: 0.45,
    model: 'Llama 3.1 405B Instruct',
    hosting: 'Lenovo infrastructure',
    infrastructure: 'approximately 6 × H200',
    reductionPercent: 63,
    improvementMultiplier: 2.7,
  },
};

/**
 * Claims — same H200 booth before/after; model and residency change.
 * Starting: Sonnet + one idle H200.
 * Optimized: Llama 3.1 405B on that same H200, in-country.
 */
export const claims: ScenarioEconomics = {
  id: 'claims',
  name: 'Claims',
  workload: 'Claims processing',
  volumeLabel: '100,000 claims × 200,000 tokens',
  tokensPerUnit: 200_000,
  starting: {
    cloudCost: 120_000,
    infrastructureCost: 37_000,
    totalCost: 157_000,
    costPerUnit: 1.57,
    model: 'Claude Sonnet 4.6',
    hosting: 'Public cloud',
    infrastructureNote: '1 × idle H200 booth ($37K)',
  },
  optimized: {
    totalCost: 37_000,
    costPerUnit: 0.37,
    model: 'Llama 3.1 405B Instruct',
    hosting: 'In-country',
    infrastructure: 'existing H200',
    reductionPercent: 76,
    improvementMultiplier: 4.2,
  },
};

/**
 * Coding agent — remains on ThinkStation PGX; no 2 × H100 optimization.
 * $150K cloud + $4K PGX = $154K · $0.62 per request.
 */
export const codingAgent: ScenarioEconomics = {
  id: 'coding-agent',
  name: 'Coding agent',
  workload: 'Code assist requests',
  volumeLabel: '250,000 requests',
  tokensPerUnit: 0,
  starting: {
    cloudCost: 150_000,
    infrastructureCost: 4_000,
    totalCost: 154_000,
    costPerUnit: 0.62,
    model: 'Cloud coding model',
    hosting: 'Public cloud',
    infrastructureNote: 'ThinkStation PGX ($4K/mo)',
  },
  optimized: {
    totalCost: 154_000,
    costPerUnit: 0.62,
    model: 'Cloud coding model + ThinkStation PGX',
    hosting: 'Hybrid',
    infrastructure: 'ThinkStation PGX $4K/mo',
    reductionPercent: 0,
    improvementMultiplier: 1,
  },
};

export const scenarios = [brightsky, superAgent, claims, codingAgent] as const;

export function formatUsd(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return Number.isInteger(m) ? `$${m}M` : `$${m.toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return Number.isInteger(k) ? `$${k}K` : `$${k.toFixed(1)}K`;
  }
  return `$${amount.toFixed(2)}`;
}

export function formatCostPerUnit(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Inventory-framed cost outcome. Null when the doc does not label the value good/bad. */
export type InventoryCostVerdict = 'good' | 'bad';

/**
 * Categorize a unit cost against Token-Ops-inventory before/optimized figures.
 * Optimized unit cost → good; starting (cloud + idle) unit cost → bad.
 * Omit when the scenario has no change (coding agent) or the value is not an
 * explicit inventory endpoint.
 */
export function inventoryCostVerdict(
  costPerUnit: number,
  scenario: ScenarioEconomics,
): InventoryCostVerdict | null {
  if (
    scenario.optimized.reductionPercent === 0 ||
    scenario.starting.costPerUnit === scenario.optimized.costPerUnit
  ) {
    return null;
  }

  const near = (a: number, b: number) => Math.abs(a - b) < 0.005;
  if (near(costPerUnit, scenario.optimized.costPerUnit)) return 'good';
  if (near(costPerUnit, scenario.starting.costPerUnit)) return 'bad';
  return null;
}

export function scenarioById(id: string): ScenarioEconomics | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}

/** Aggregated monthly starting spend across named workloads (demo headline). */
export const portfolioStartingTotal =
  brightsky.starting.totalCost +
  superAgent.starting.totalCost +
  claims.starting.totalCost +
  codingAgent.starting.totalCost;

export const portfolioOptimizedTotal =
  brightsky.optimized.totalCost +
  superAgent.optimized.totalCost +
  claims.optimized.totalCost +
  codingAgent.optimized.totalCost;

export const portfolioReductionPercent = Math.round(
  ((portfolioStartingTotal - portfolioOptimizedTotal) / portfolioStartingTotal) * 100,
);
