import { SAMPLE_PROMPTS } from './routingDemo';
import {
  buildScenarioPlanInsights,
  type LabInsights,
} from './labInsights';
import {
  brightsky,
  claims,
  codingAgent,
  formatCostPerUnit,
  formatUsd,
  scenarios,
  superAgent,
  type ScenarioEconomics,
} from './scenarioEconomics';

export type PromptLabMode = 'test' | 'whatIf' | 'scenario';

/**
 * In-chat actions for the Scenario planner.
 * Engagement stays on Scenario — never navigates to other lab tabs.
 */
export interface ChatAction {
  type: 'evaluatePrompt';
  prompt: string;
}

export interface ChatReply {
  text: string;
  actions?: ChatAction[];
  /** Structured AI insights — same shape as Test a Prompt / What if. */
  insights?: LabInsights;
}

/** Suggestion card for the Scenario planner landing (mirrors Test a Prompt library). */
export interface ScenarioSuggestion {
  id: string;
  title: string;
  summary: string;
  /** User message sent when the card is clicked. */
  message: string;
}

export const SCENARIO_SUGGESTIONS: ScenarioSuggestion[] = [
  {
    id: 'quality',
    title: 'Plan quality inspection',
    summary: '1M chats · production lines · 75% cost reduction path',
    message: 'Help me plan the quality inspection scenario.',
  },
  {
    id: 'claims',
    title: 'Plan claims with PII',
    summary: 'In-country hosting · public cloud blocked',
    message: 'Help me plan the claims scenario with PII.',
  },
  {
    id: 'compare',
    title: 'Compare starting vs optimized',
    summary: 'Side-by-side economics for the focused workload',
    message: 'Compare starting vs optimized for quality inspection.',
  },
  {
    id: 'volume',
    title: 'Stress volume 2×',
    summary: 'What if quality inspection doubles',
    message: 'What if quality inspection volume doubles?',
  },
  {
    id: 'test-scenario',
    title: 'Test a matching prompt',
    summary: 'Run a protected claim through the routing map here',
    message:
      'Test this prompt: Analyze claim CLM-48219 for ada@lovelace.com and recommend next action.',
  },
  {
    id: 'catalog',
    title: 'Show scenario catalog',
    summary: 'Quality, claims, super agent, coding agent',
    message: 'List all scenarios in the portfolio.',
  },
];

function moneyLine(scenario: ScenarioEconomics): string {
  return (
    `Starting ${formatUsd(scenario.starting.totalCost)}/mo ` +
    `(${formatCostPerUnit(scenario.starting.costPerUnit)} per unit) → ` +
    `optimized ${formatUsd(scenario.optimized.totalCost)}/mo ` +
    `(${formatCostPerUnit(scenario.optimized.costPerUnit)} per unit)` +
    (scenario.optimized.reductionPercent > 0
      ? ` · ${scenario.optimized.reductionPercent}% lower`
      : ' · no change')
  );
}

function scenarioBrief(scenario: ScenarioEconomics): string {
  return [
    `${scenario.name} — ${scenario.workload}`,
    `Volume: ${scenario.volumeLabel}`,
    `Route: ${scenario.starting.model} on ${scenario.starting.hosting} → ${scenario.optimized.model} on ${scenario.optimized.hosting}`,
    moneyLine(scenario),
  ].join('\n');
}

function matchScenario(q: string): ScenarioEconomics | undefined {
  if (q.includes('claim') || q.includes('pii') || q.includes('in-country')) return claims;
  if (q.includes('super agent') || q.includes('enterprise')) return superAgent;
  if (q.includes('coding') || q.includes('developer') || q.includes('pgx')) return codingAgent;
  if (
    q.includes('quality') ||
    q.includes('brightsky') ||
    q.includes('inspection') ||
    q.includes('production line')
  ) {
    return brightsky;
  }
  return undefined;
}

function nextSteps(scenario: ScenarioEconomics): string {
  return (
    `Next, I can compare starting vs optimized, stress 2× volume, ` +
    `or test a matching prompt for ${scenario.name} right here in chat.`
  );
}

function evaluateAction(prompt: string): ChatAction {
  return { type: 'evaluatePrompt', prompt };
}

/** Keyword router for Prompt lab scenario planning (demo). */
export function replyToPromptLab(input: string): ChatReply {
  const q = input.trim().toLowerCase();

  if (!q) {
    return {
      text: 'Describe a workload or pick a starter — I’ll help you plan the scenario, then we can test a prompt or stress volume in this chat.',
      insights: buildScenarioPlanInsights({
        summary: 'Scenario chat plans economics and can test a matching prompt on the routing map.',
        next: 'Pick a starter below, or describe quality inspection, claims, super agent, or coding agent.',
      }),
    };
  }

  const seedMatch = q.match(/test this prompt:\s*(.+)$/i) ?? q.match(/^test:\s*(.+)$/i);
  if (seedMatch?.[1] || q.includes('test this scenario') || q.includes('test a pii')) {
    const prompt = seedMatch?.[1]?.trim() || SAMPLE_PROMPTS.pii;
    return {
      text: 'Here’s how that request routes on the map — scores update with the selected path.',
      actions: [evaluateAction(prompt)],
    };
  }

  if (
    (q.includes('what if') || q.includes('double') || q.includes('2×') || q.includes('2x')) &&
    (q.includes('volume') || q.includes('quality') || q.includes('scale'))
  ) {
    return {
      text:
        `Scenario stress — 2× volume\n` +
        `Quality inspection at 2M units would roughly double cloud-side spend if you stay on ${brightsky.starting.model}. ` +
        `TokenOps keeps unit cost near ${formatCostPerUnit(brightsky.optimized.costPerUnit)} by staying on Lenovo infrastructure.\n\n` +
        `Ask me to test a matching prompt, or open the What if tab when you want interactive dials.`,
      insights: buildScenarioPlanInsights({
        summary: `At 2× volume, staying on ${brightsky.starting.model} roughly doubles cloud spend; Lenovo placement holds unit cost near ${formatCostPerUnit(brightsky.optimized.costPerUnit)}.`,
        next: 'Test a matching prompt here, or open What if for interactive volume and placement dials.',
      }),
    };
  }

  if (q.includes('open what if') || (q.includes('what if') && q.includes('open'))) {
    return {
      text:
        `What if lives as its own lab tab when you want interactive volume, model, and placement dials.\n\n` +
        `Here I can still stress 2× volume in chat, compare starting vs optimized, or test a prompt on the routing map.`,
      insights: buildScenarioPlanInsights({
        summary: 'What if is a separate lab tab for interactive dials; Scenario keeps planning and prompt tests in chat.',
        next: 'Ask to stress 2× volume, compare starting vs optimized, or test a scenario prompt on the map.',
      }),
    };
  }

  if (
    q.includes('compare') ||
    q.includes('starting vs') ||
    q.includes('before vs') ||
    q.includes('optimized')
  ) {
    const scenario = matchScenario(q) ?? brightsky;
    return {
      text:
        `Starting vs optimized — ${scenario.name}\n` +
        `${scenarioBrief(scenario)}\n\n` +
        `Say “test this scenario prompt” to see the routing map here, or ask what happens if volume doubles.`,
      insights: buildScenarioPlanInsights({
        summary: moneyLine(scenario),
        next: `Test a matching prompt for ${scenario.name}, or ask what happens if volume doubles.`,
      }),
    };
  }

  if (
    (q.includes('plan') || q.includes('process') || q.includes('help')) &&
    (q.includes('claim') || q.includes('pii'))
  ) {
    return {
      text:
        `Planning claims scenario\n${scenarioBrief(claims)}\n\n` +
        `PII forces in-country hosting — public cloud is blocked. ` +
        `Running a protected claim through the routing map below.`,
      actions: [evaluateAction(SAMPLE_PROMPTS.pii)],
      insights: buildScenarioPlanInsights({
        summary: `Claims keep PII in-country — ${moneyLine(claims)}.`,
        next: 'Review the routing map below, then adjust judgement in Test a Prompt if you want a policy.',
      }),
    };
  }

  if (
    q.includes('plan') ||
    q.includes('walk') ||
    q.includes('run ') ||
    q.includes('process') ||
    q.includes('help me') ||
    q.includes('scenario') ||
    matchScenario(q)
  ) {
    const scenario = matchScenario(q) ?? brightsky;
    const openTest = q.includes('claim') || q.includes('pii') || q.includes('test');
    return {
      text:
        `Scenario plan — ${scenario.name}\n${scenarioBrief(scenario)}\n\n` +
        (openTest
          ? 'Here’s a matching request on the routing map.'
          : nextSteps(scenario)),
      actions: openTest
        ? [
            evaluateAction(
              scenario.id === 'claims' ? SAMPLE_PROMPTS.pii : SAMPLE_PROMPTS.routine,
            ),
          ]
        : undefined,
      insights: buildScenarioPlanInsights({
        summary: moneyLine(scenario),
        next: openTest
          ? 'Check the lane map below — then ask to compare starting vs optimized or stress volume.'
          : nextSteps(scenario),
      }),
    };
  }

  if (q.includes('list') || q.includes('all scenario') || q.includes('portfolio') || q.includes('catalog')) {
    return {
      text:
        `Scenario catalog\n` +
        scenarios.map((s) => `• ${s.name}: ${moneyLine(s)}`).join('\n') +
        `\n\nPick one to plan, or ask for starting vs optimized.`,
      insights: buildScenarioPlanInsights({
        summary: `${scenarios.length} portfolio scenarios with starting vs optimized economics.`,
        next: 'Pick one to plan, or ask for starting vs optimized on a named workload.',
      }),
    };
  }

  return {
    text:
      `I help plan scenarios here — quality inspection, claims, super agent, coding agent.\n\n` +
      `Try “Help me plan the quality inspection scenario” or pick a suggestion.\n\n` +
      `Featured:\n${scenarioBrief(brightsky)}`,
    insights: buildScenarioPlanInsights({
      summary: moneyLine(brightsky),
      next: 'Try “Help me plan the quality inspection scenario” or pick a suggestion card.',
    }),
  };
}
