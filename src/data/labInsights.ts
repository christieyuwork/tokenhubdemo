import {
  formatCostPerUnit,
  inventoryCostVerdict,
  scenarioById,
} from './scenarioEconomics';
import { getPolicy, type PromptEvaluation } from './routingDemo';
import {
  MODEL_LABELS,
  calc,
  dollars,
  evaluateGoals,
  explain,
  formatVolume,
  money,
  placementLabel,
  type ScenarioControls,
  type UserGoals,
  type WorkloadScenario,
} from './tokenOpsGame';

/** Shared AI insights shape across Prompt lab modes. */
export interface LabInsights {
  /** Labeled “Insights” in the UI. */
  observations: string[];
  /** Labeled “Recommendations” in the UI. */
  recommendations: string[];
}

/** @deprecated Prefer LabInsights — same shape. */
export type TryInsights = LabInsights;

/** TokenOps AI-style summary from a Test a Prompt / Scenario evaluation. */
export function buildTryInsights(evaluation: PromptEvaluation): LabInsights {
  const observations: string[] = [];
  const recommendations: string[] = [];
  const policy = getPolicy(evaluation.policyId);
  const scenario = scenarioById(policy.scenarioId);
  const routed = evaluation.lanes.find((lane) => lane.isRouted);
  const blocked = evaluation.lanes.filter(
    (lane) =>
      lane.nodes.security === 'Blocked' || lane.nodes.governance === 'Blocked',
  );
  const judgement = evaluation.judgement;

  if (!routed) {
    observations.push(
      evaluation.statusMessage ||
        'No route was selected — every candidate was blocked before cost/quality.',
    );
    if (judgement.securityPatterns !== 'none') {
      recommendations.push(
        'Clear or loosen Security patterns if this request should be allowed to route.',
      );
    }
    if (judgement.piiDetector === 'webhook') {
      recommendations.push(
        'Switch PII detection to semantic routing to keep inside models instead of rejecting.',
      );
    }
    recommendations.push(
      'Adjust Advanced settings, then re-check the lane map — judgement changes reshuffle eligibility live.',
    );
    return { observations, recommendations };
  }

  observations.push(
    `Routed to ${routed.model} on ${routed.hosting} at ${formatCostPerUnit(routed.costPerRequest)} / request.`,
  );

  if (blocked.length > 0) {
    observations.push(
      `${blocked.length} of ${evaluation.lanes.length} candidates blocked before cost/quality.`,
    );
  }

  if (evaluation.sensitive) {
    observations.push(
      judgement.governance === 'pii-inside-only'
        ? 'Protected data kept on inside hosting — public-cloud lanes were closed.'
        : 'Sensitive content present; governance is not forcing inside-only placement.',
    );
  } else if (judgement.piiDetector === 'none') {
    observations.push('PII detector is off — residency gates are not applying to this request.');
  }

  if (judgement.costQuality === 'always-cheap') {
    observations.push('Cost/quality objective is pinned to the cheapest eligible model.');
  } else if (judgement.costQuality === 'always-one') {
    observations.push('Cost/quality objective is pinned to a single high-quality model.');
  } else {
    observations.push('Balanced objective: easy work prefers cheap; harder work prefers quality.');
  }

  if (scenario) {
    const verdict = inventoryCostVerdict(routed.costPerRequest, scenario);
    if (verdict === 'good') {
      observations.push(
        `Unit cost aligns with the optimized ${scenario.name} scenario (${formatCostPerUnit(scenario.optimized.costPerUnit)}).`,
      );
    } else if (verdict === 'bad') {
      observations.push(
        `Unit cost still looks like the starting ${scenario.name} route (${formatCostPerUnit(scenario.starting.costPerUnit)}).`,
      );
      recommendations.push(
        `Prefer Lenovo / in-country eligible models to approach ${formatCostPerUnit(scenario.optimized.costPerUnit)} per unit.`,
      );
    }
  }

  if (routed.hosting === 'Public cloud' && !evaluation.sensitive) {
    recommendations.push(
      'Try Always cheapest or raise cost priority — an inside model may cut spend without losing the floor.',
    );
  }

  if (evaluation.sensitive && judgement.governance === 'off') {
    recommendations.push(
      'Turn on “If PII, keep only inside models” before promoting this judgement to a policy.',
    );
  }

  if (routed.quality < policy.qualityFloor) {
    recommendations.push(
      `Selected quality ${routed.quality} is below the policy floor (≥ ${policy.qualityFloor}) — switch to Always one model or Easy→cheap/else quality.`,
    );
  } else {
    recommendations.push(
      `Quality ${routed.quality} meets the ${policy.name} floor (≥ ${policy.qualityFloor}).`,
    );
  }

  recommendations.push(
    'Save this judgement with Make a new policy when the lane map matches how you want production to behave.',
  );

  return {
    observations: observations.slice(0, 4),
    recommendations: recommendations.slice(0, 4),
  };
}

/** TokenOps AI-style summary from the What if scene + levers. */
export function buildWhatIfInsights(
  workload: WorkloadScenario,
  controls: ScenarioControls,
  goals: UserGoals,
  lastKey: keyof ScenarioControls | null,
): LabInsights {
  const result = calc(workload, controls);
  const goalChecks = evaluateGoals(workload, controls, goals);
  const coach = explain(workload, controls, lastKey, goals);
  const observations: string[] = [coach];
  const recommendations: string[] = [];

  const unmet = goalChecks.filter((item) => !item.ok);
  if (unmet.length === 0) {
    observations.push(
      `All ${goalChecks.length} goals are met at ${money(result.bill)}/mo (${dollars(result.per)} per ${workload.unit}).`,
    );
    recommendations.push(
      'Stress volume or model size next — or carry this placement into Test a Prompt / Scenario.',
    );
  } else {
    observations.push(
      `${unmet.length} of ${goalChecks.length} goals still open · ${formatVolume(result.V)} ${workload.units}/mo on ${MODEL_LABELS[controls.m]} · ${placementLabel(controls.p)}.`,
    );
  }

  for (const check of unmet) {
    if (check.id === 'cost') {
      recommendations.push(
        `Lower cost per ${workload.unit}: shrink model size, move more work to your factory, or turn TokenOps optimize on.`,
      );
    } else if (check.id === 'latency') {
      recommendations.push(
        'Improve response time: use a smaller model, reduce factory overload, or shift some traffic to cloud.',
      );
    } else if (check.id === 'residency') {
      recommendations.push(
        'Raise data in-house: move placement toward Factory / Hybrid so more work stays on your engines.',
      );
    } else if (check.id === 'model') {
      recommendations.push(
        `Meet the model floor: step up to at least ${MODEL_LABELS[goals.minModel]}.`,
      );
    }
  }

  if (result.uw > 1) {
    recommendations.push(
      'Factory is over capacity — turn optimize on or send some load back to cloud.',
    );
  }

  return {
    observations: observations.slice(0, 4),
    recommendations: dedupe(recommendations).slice(0, 4),
  };
}

/** Lightweight planning insights for Scenario chat replies (no evaluation yet). */
export function buildScenarioPlanInsights(lines: {
  summary: string;
  next?: string;
}): LabInsights {
  return {
    observations: [lines.summary],
    recommendations: lines.next
      ? [lines.next]
      : [
          'Ask to compare starting vs optimized, stress 2× volume, or test a matching prompt on the map.',
        ],
  };
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}
