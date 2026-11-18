import type { BadgeColor } from '@cake-admin/cakeand';

/**
 * Canonical model → cake& badge color + chart fills.
 * Chart hex values are the resolved `--color-badge-*` tokens (ECharts cannot use CSS vars).
 * Match by family so short names ("Llama 3.3 70B") and full names
 * ("Llama 3.3 70B Instruct") share one color across tables and charts.
 */

export interface ModelChartColors {
  color: string;
  emphasisColor: string;
}

interface ModelSwatch {
  badge: BadgeColor;
  chart: ModelChartColors;
}

/** Order matters: more specific keys first (405B before 70B, Qwen 32 before Qwen). */
const MODEL_SWATCHES: { match: (name: string) => boolean; swatch: ModelSwatch }[] = [
  {
    match: (n) => /405b/i.test(n),
    swatch: {
      badge: 'magenta',
      chart: { color: '#cf29b7', emphasisColor: '#cf29b7' }, // badge-magenta
    },
  },
  {
    match: (n) => /70b|open-70b/i.test(n),
    swatch: {
      badge: 'cyan',
      chart: { color: '#009ebd', emphasisColor: '#00829b' }, // badge-cyan
    },
  },
  {
    match: (n) => /claude/i.test(n),
    swatch: {
      badge: 'indigo',
      chart: { color: '#7586ff', emphasisColor: '#5066ff' }, // badge-indigo
    },
  },
  {
    match: (n) => /qwen\s*32/i.test(n),
    swatch: {
      badge: 'gold',
      chart: { color: '#be8704', emphasisColor: '#9c6e00' }, // badge-gold
    },
  },
  {
    match: (n) => /qwen/i.test(n),
    swatch: {
      badge: 'yellow',
      chart: { color: '#a69100', emphasisColor: '#897700' }, // badge-yellow
    },
  },
  {
    match: (n) => /gpt|gpt-4o/i.test(n),
    swatch: {
      badge: 'purple',
      chart: { color: '#ca61fa', emphasisColor: '#b539e9' }, // badge-purple
    },
  },
  {
    match: (n) => /coding|thinkstation|pgx/i.test(n),
    swatch: {
      badge: 'orange',
      chart: { color: '#f36420', emphasisColor: '#cf4b00' }, // badge-orange
    },
  },
  {
    match: (n) => /frontier/i.test(n),
    swatch: {
      badge: 'violet',
      chart: { color: '#a078ff', emphasisColor: '#8952ff' }, // badge-violet
    },
  },
  {
    match: (n) => /mid-m|mid\s*m/i.test(n),
    swatch: {
      badge: 'blue',
      chart: { color: '#3b92f9', emphasisColor: '#0077dc' }, // badge-blue
    },
  },
  {
    match: (n) => /small-s|small\s*s/i.test(n),
    swatch: {
      badge: 'teal',
      chart: { color: '#16a28c', emphasisColor: '#108673' }, // badge-teal
    },
  },
];

const FALLBACK: ModelSwatch = {
  badge: 'secondary',
  chart: { color: '#8d8f98', emphasisColor: '#5d5e67' },
};

function resolveSwatch(modelName: string): ModelSwatch {
  const name = modelName.trim();
  if (!name || name === '—') return FALLBACK;
  for (const entry of MODEL_SWATCHES) {
    if (entry.match(name)) return entry.swatch;
  }
  return FALLBACK;
}

/** cake& Badge `color` for a model label (any length / alias). */
export function modelBadgeColor(modelName: string): BadgeColor {
  return resolveSwatch(modelName).badge;
}

/** ECharts fill + emphasis for the same model. */
export function modelChartColors(modelName: string): ModelChartColors {
  return resolveSwatch(modelName).chart;
}
