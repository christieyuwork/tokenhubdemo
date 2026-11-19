/**
 * Cross-tab Optimization snapshot for Prompt lab (demo facts only).
 * Kept for other surfaces; Scenario mode uses scenarioEconomics directly.
 */
import {
  listPolicies,
  POLICY_IMPACT_SERIES,
  RECENT_DECISIONS,
  getPolicy,
} from './routingDemo';

export interface OptimizationFact {
  tab:
    | 'Intelligent routing'
    | 'Routing decisions'
    | 'Model analyzer'
    | 'Caching'
    | 'Energy';
  label: string;
  detail: string;
}

export function optimizationBrief(): OptimizationFact[] {
  const policies = listPolicies();
  const latest = RECENT_DECISIONS[0];
  const leading = POLICY_IMPACT_SERIES.reduce((best, item) =>
    item.share > best.share ? item : best,
  );
  const leadingName = leading.name.replace(/\s+\d+%$/, '');

  return [
    {
      tab: 'Intelligent routing',
      label: 'Policies',
      detail: `${policies.length} policies in catalog · ${policies.filter((p) => p.status === 'Active').length} active. Priority runs top-down.`,
    },
    {
      tab: 'Intelligent routing',
      label: 'Traffic mix',
      detail: `Leading model share: ${leadingName} (${Math.round(leading.share * 100)}%).`,
    },
    {
      tab: 'Routing decisions',
      label: 'Latest decision',
      detail: latest
        ? `${latest.workload} → ${latest.selectedModel} on ${latest.hosting} (${getPolicy(latest.policyId).name}). ${latest.routingReason}.`
        : 'No recent decisions.',
    },
    {
      tab: 'Routing decisions',
      label: 'Protected claims',
      detail:
        'Claims with PII route to Llama 3.1 405B Instruct in-country — public cloud is blocked by residency.',
    },
    {
      tab: 'Model analyzer',
      label: 'Price ladder',
      detail:
        'Claude Sonnet 4.6 ≈ $25.32 / 1M · Llama 3.3 70B mid-tier · Qwen 8B lowest for simple lookups.',
    },
    {
      tab: 'Model analyzer',
      label: 'Optimization goal',
      detail:
        'Keep quality while stepping off the highest-priced starting route onto Lenovo infrastructure when residency allows.',
    },
    {
      tab: 'Caching',
      label: 'Hit rate',
      detail: 'Cache hit rate 82% (week of Sep 22–28) · 2.6B prompt tokens reused · ~410 GPU hours saved.',
    },
    {
      tab: 'Caching',
      label: 'Scope',
      detail: '2 deployments with caching on Llama 3.3 70B quality-inspection traffic.',
    },
    {
      tab: 'Energy',
      label: 'GPU power',
      detail: 'Average GPU power 1.96 kW across 8 GPUs · 517 kWh Aug 1–11 · busy ~420 W · idle ~70 W.',
    },
    {
      tab: 'Energy',
      label: 'Placement tip',
      detail:
        'Routing to owned H100/H200 capacity shifts spend from public-cloud tokens into infrastructure + energy you can monitor here.',
    },
  ];
}
