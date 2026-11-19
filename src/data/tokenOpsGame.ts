/**
 * What-if scenario economics — illustrative volume × model × cloud/factory
 * mix × optimize. Workloads are starter templates; goals are user-owned.
 */

export type WorkloadId = 'air' | 'dev' | 'sup' | 'clm';

export interface WorkloadScenario {
  id: WorkloadId;
  tag: string;
  who: string;
  task: string;
  unit: string;
  units: string;
  vol: number[];
  volL: string[];
  /** Cloud $ per unit by model index (7B / 70B / 700B). */
  cr: [number, number, number];
  /** Factory power+ops $ per unit by model. */
  fe: [number, number, number];
  /** Factory headroom (units/month) by model. */
  fc: [number, number, number];
  fixed: number;
  lc: [number, number, number];
  lf: [number, number, number];
  minM: number;
  tPer: number;
  tLat: number;
  tRes: number;
  factory: string;
  factoryShort: string;
  factoryCap: string;
  facts: [string, string][];
}

/** User-authored scene — replaces preset workload cards. */
export interface SceneSetup {
  name: string;
  unit: string;
  units: string;
  monthlyVolume: number;
  factory: string;
  factoryShort: string;
  factoryCap: string;
  fixedMonthly: number;
}

export interface ScenarioControls {
  /** Model index 0–2 */
  m: number;
  /** Placement index 0=cloud, 1=hybrid, 2=factory */
  p: number;
  /** TokenOps optimize on/off */
  t: boolean;
}

/** @deprecated Use ScenarioControls */
export type GameControls = ScenarioControls;

export interface ScenarioCalc {
  V: number;
  cs: number;
  fs: number;
  cloud: number;
  energy: number;
  uw: number;
  u: number;
  lat: number;
  bill: number;
  per: number;
  base: number;
}

/** @deprecated Use ScenarioCalc */
export type GameCalc = ScenarioCalc;

/** Targets the user is testing against — seeded from a template, fully editable. */
export interface UserGoals {
  /** Max $ per unit */
  maxPerUnit: number;
  /** Max response time in seconds */
  maxLatency: number;
  /** Min % of work kept on-prem / in-house */
  minResidency: number;
  /** Minimum acceptable model index (0=7B, 1=70B, 2=700B) */
  minModel: number;
}

export const MODEL_LABELS = ['7B', '70B', '700B'] as const;
/** @deprecated Prefer PLACEMENT_CLOUD — kept for any leftover 5-step UIs. */
export const CLOUD_SHARE = [100, 75, 50, 25, 0] as const;
/** Cloud share for simplified placement: Cloud / Hybrid / Factory. */
export const PLACEMENT_CLOUD = [100, 50, 0] as const;
export const PLACEMENT_LABELS = ['Cloud', 'Hybrid', 'Factory'] as const;

export const UNIT_OPTIONS = [
  { value: 'chats', label: 'Chats', unit: 'chat' },
  { value: 'requests', label: 'Requests', unit: 'request' },
  { value: 'tasks', label: 'Tasks', unit: 'task' },
  { value: 'claims', label: 'Claims', unit: 'claim' },
] as const;

/** Share of each factory already busy with other work. */
const BACKGROUND_UTIL = 0.3;

export const WORKLOADS: WorkloadScenario[] = [
  {
    id: 'air',
    tag: 'Featured',
    who: '',
    task: 'Customer service chat',
    unit: 'chat',
    units: 'chats',
    vol: [250e3, 500e3, 1e6, 1.3e6, 2e6],
    volL: ['250K', '500K', '1M', '1.3M', '2M'],
    cr: [0.03, 0.1, 0.21],
    fe: [0.02, 0.05, 0.13],
    fc: [4e6, 6e5, 1.5e5],
    fixed: 30000,
    lc: [0.6, 1.0, 2.2],
    lf: [0.3, 0.6, 1.4],
    minM: 1,
    tPer: 0.08,
    tLat: 1.5,
    tRes: 75,
    factory: 'private AI cluster',
    factoryShort: 'Cluster',
    factoryCap: 'Cluster you own',
    facts: [
      ['Demand', '1M chats a month'],
      ['Data', 'Passenger personal data'],
      ['Speed', 'Fast — passengers are waiting'],
      ['Factory', 'Private AI cluster'],
    ],
  },
  {
    id: 'dev',
    tag: 'Builders',
    who: 'Engineering team',
    task: 'Developer coding agent',
    unit: 'request',
    units: 'requests',
    vol: [50e3, 100e3, 250e3, 500e3, 1e6],
    volL: ['50K', '100K', '250K', '500K', '1M'],
    cr: [0.08, 0.25, 0.6],
    fe: [0.05, 0.12, 0.3],
    fc: [1e6, 2e5, 2e4],
    fixed: 4000,
    lc: [1.0, 1.8, 4.0],
    lf: [0.6, 1.2, 3.0],
    minM: 1,
    tPer: 0.1,
    tLat: 3,
    tRes: 75,
    factory: 'ThinkStation PGX',
    factoryShort: 'PGX',
    factoryCap: 'PGX at the desk',
    facts: [
      ['Demand', '250K requests a month'],
      ['Data', 'Proprietary source code'],
      ['Speed', 'Balanced — keep devs in flow'],
      ['Factory', 'ThinkStation PGX'],
    ],
  },
  {
    id: 'sup',
    tag: 'Enterprise',
    who: 'Whole workforce',
    task: 'Enterprise super agent',
    unit: 'task',
    units: 'tasks',
    vol: [100e3, 250e3, 500e3, 1e6, 2e6],
    volL: ['100K', '250K', '500K', '1M', '2M'],
    cr: [0.1, 0.3, 0.9],
    fe: [0.03, 0.08, 0.25],
    fc: [1e7, 2e6, 6e5],
    fixed: 150000,
    lc: [1.5, 2.5, 5.0],
    lf: [1.0, 1.6, 2.5],
    minM: 2,
    tPer: 0.5,
    tLat: 4,
    tRes: 75,
    factory: 'AI factory',
    factoryShort: 'Factory',
    factoryCap: 'AI factory you own',
    facts: [
      ['Demand', '500K agent tasks a month'],
      ['Data', 'Internal company data'],
      ['Speed', 'Volume over speed'],
      ['Factory', 'Enterprise AI factory'],
    ],
  },
  {
    id: 'clm',
    tag: 'Regulated',
    who: 'Insurance carrier',
    task: 'Claims review assistant',
    unit: 'claim',
    units: 'claims',
    vol: [20e3, 50e3, 100e3, 200e3, 400e3],
    volL: ['20K', '50K', '100K', '200K', '400K'],
    cr: [0.2, 0.6, 1.2],
    fe: [0, 0, 0],
    fc: [2e6, 1.5e5, 3e4],
    fixed: 37000,
    lc: [2.0, 3.0, 6.0],
    lf: [1.5, 2.2, 4.5],
    minM: 1,
    tPer: 0.37,
    tLat: 6,
    tRes: 100,
    factory: 'in-country AI factory',
    factoryShort: 'Factory',
    factoryCap: 'In-country factory',
    facts: [
      ['Demand', '100K claims a month'],
      ['Data', 'Sovereign — stays in-country'],
      ['Speed', 'Relaxed — accuracy first'],
      ['Factory', 'In-country AI factory'],
    ],
  },
];

export const DEFAULT_CONTROLS: ScenarioControls = {
  m: 2,
  p: 0,
  t: false,
};

export function getWorkload(id: WorkloadId): WorkloadScenario {
  return WORKLOADS.find((item) => item.id === id) ?? WORKLOADS[0];
}

/** Map a routing policy / scenario id onto a starter workload template. */
export function workloadForPolicy(policyId: string): WorkloadId {
  if (policyId.includes('protected') || policyId.includes('claim')) return 'clm';
  if (policyId.includes('dev') || policyId.includes('staging')) return 'dev';
  if (policyId.includes('super')) return 'sup';
  return 'air';
}

/** Seed the scene form from a template — name/engine stay blank for the user to fill. */
export function sceneFromWorkload(w: WorkloadScenario): SceneSetup {
  const mid = Math.min(2, w.vol.length - 1);
  return {
    name: '',
    unit: w.unit,
    units: w.units,
    monthlyVolume: w.vol[mid],
    factory: '',
    factoryShort: w.factoryShort,
    factoryCap: w.factoryCap,
    fixedMonthly: w.fixed,
  };
}

/** Apply user scene fields onto a rate template for live economics. */
export function withScene(w: WorkloadScenario, scene: SceneSetup): WorkloadScenario {
  const volume = Math.max(1, scene.monthlyVolume);
  return {
    ...w,
    task: scene.name.trim() || w.task,
    unit: scene.unit.trim() || w.unit,
    units: scene.units.trim() || w.units,
    fixed: Math.max(0, scene.fixedMonthly),
    factory: scene.factory.trim() || w.factory,
    factoryShort: scene.factoryShort.trim() || w.factoryShort,
    factoryCap: scene.factoryCap.trim() || w.factoryCap,
    vol: [volume],
    volL: [formatVolume(volume)],
  };
}

export function formatVolume(n: number): string {
  if (n >= 1e6) {
    const m = n / 1e6;
    return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (n >= 1e3) {
    const k = n / 1e3;
    return Number.isInteger(k) ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(Math.round(n));
}

/** Seed editable goals from a workload template’s suggested targets. */
export function goalsFromWorkload(w: WorkloadScenario): UserGoals {
  return {
    maxPerUnit: w.tPer,
    maxLatency: w.tLat,
    minResidency: w.tRes,
    minModel: w.minM,
  };
}

export function calc(w: WorkloadScenario, controls: ScenarioControls): ScenarioCalc {
  const { m, p, t } = controls;
  const V = w.vol[0];
  const cs = PLACEMENT_CLOUD[p] / 100;
  const fs = 1 - cs;
  const eff = t ? 0.6 : 1;
  const cloud = V * cs * w.cr[m] * eff;
  const energy = V * fs * w.fe[m] * eff;
  const uw = V * fs / (w.fc[m] / eff);
  const over = uw > 1 ? 1 + 8 * (uw - 1) : 1;
  const lat =
    cs * w.lc[m] * (t ? 0.8 : 1) + fs * w.lf[m] * (t ? 0.8 : 1) * over;
  const bill = cloud + w.fixed + energy;
  return {
    V,
    cs,
    fs,
    cloud,
    energy,
    uw,
    u: BACKGROUND_UTIL + (1 - BACKGROUND_UTIL) * uw,
    lat,
    bill,
    per: bill / V,
    base: w.fixed + V * w.cr[2],
  };
}

export interface GoalCheck {
  id: 'cost' | 'latency' | 'residency' | 'model';
  label: string;
  actual: string;
  target: string;
  ok: boolean;
}

/** Compare the live setup against the user’s goals — not a fixed win condition. */
export function evaluateGoals(
  w: WorkloadScenario,
  controls: ScenarioControls,
  goals: UserGoals,
): GoalCheck[] {
  const r = calc(w, controls);
  return [
    {
      id: 'cost',
      label: `Cost per ${w.unit}`,
      actual: dollars(r.per),
      target: `≤ ${dollars(goals.maxPerUnit)}`,
      ok: r.per <= goals.maxPerUnit + 1e-9,
    },
    {
      id: 'latency',
      label: 'Response time',
      actual: `${r.lat.toFixed(1)}s`,
      target: `≤ ${goals.maxLatency.toFixed(1)}s`,
      ok: r.lat <= goals.maxLatency,
    },
    {
      id: 'residency',
      label: 'Data in-house',
      actual: `${Math.round(r.fs * 100)}%`,
      target: `≥ ${Math.round(goals.minResidency)}%`,
      ok: r.fs * 100 >= goals.minResidency,
    },
    {
      id: 'model',
      label: 'Model floor',
      actual: MODEL_LABELS[controls.m],
      target: `≥ ${MODEL_LABELS[goals.minModel]}`,
      ok: controls.m >= goals.minModel,
    },
  ];
}

export function money(x: number): string {
  if (x >= 1e6) return `$${(x / 1e6).toFixed(2)}M`;
  return `$${Math.round(x / 1000)}K`;
}

export function dollars(x: number): string {
  return `$${x.toFixed(2)}`;
}

export function placementLabel(p: number): string {
  return PLACEMENT_LABELS[p] ?? PLACEMENT_LABELS[0];
}

/** Neutral readout of what the current levers are doing. */
export function explain(
  w: WorkloadScenario,
  controls: ScenarioControls,
  lastKey: keyof ScenarioControls | null,
  goals?: UserGoals,
): string {
  const r = calc(w, controls);
  const minM = goals?.minModel ?? w.minM;

  if (r.uw > 1) {
    return `The ${w.factoryShort.toLowerCase()} is over capacity — work is queuing. Turn on optimize, or send some load back to cloud.`;
  }
  if (lastKey === 'm') {
    if (controls.m < minM) {
      return `${MODEL_LABELS[controls.m]} is cheaper, but below the model floor you set (${MODEL_LABELS[minM]}).`;
    }
    if (controls.m > minM) {
      return `${MODEL_LABELS[controls.m]} costs more than the floor you set — useful if quality needs headroom.`;
    }
    return `${MODEL_LABELS[controls.m]} matches your model floor.`;
  }
  if (lastKey === 'p') {
    return controls.p === 0
      ? 'All cloud: every token is billed, and data leaves your walls.'
      : controls.p === 2
        ? `All on your ${w.factory} — data stays with you; watch GPU capacity.`
        : `${Math.round(r.fs * 100)}% on your ${w.factory}, ${Math.round(r.cs * 100)}% in public cloud.`;
  }
  if (lastKey === 't') {
    return controls.t
      ? 'Optimize on: easier requests shift to smaller models and cache — about 40% fewer tokens.'
      : 'Optimize off: every request runs on the model you picked, from scratch.';
  }
  return `Running ${formatVolume(r.V)} ${w.units}/mo on ${MODEL_LABELS[controls.m]} · ${placementLabel(controls.p)}. Edit the scene and levers to match what you’re testing.`;
}
