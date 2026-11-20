import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Check, X } from 'lucide-react';
import styled, { css, keyframes } from 'styled-components';
import { modelBadgeColor, modelChartColors } from '../../data/modelColors';
import {
  ROUTER_COLUMNS,
  idleLanesForPolicy,
  type HostingLabel,
  type LaneNodeState,
  type PolicyId,
  type PromptEvaluation,
  type RouterColumn,
  type RouterLaneResult,
} from '../../data/routingDemo';
import { CellBadge } from '../../pages/ReportPage';

const VIEW_W = 920;
const SIDE_PAD = 28;
const REQUEST_R = 18;
const REQUEST_HIT_R = 24;
const REQUEST_X = SIDE_PAD + REQUEST_R;
const CARD_W = 220;
const CARD_X = VIEW_W - SIDE_PAD - CARD_W;
/** Columns sit fully between request and result cards — no overlap. */
const COL_AREA_LEFT = REQUEST_X + REQUEST_R + 36;
const COL_AREA_RIGHT = CARD_X - 24;
const COL_COUNT = 4;
const COL_W = (COL_AREA_RIGHT - COL_AREA_LEFT) / COL_COUNT;
const STAGE_X = [
  COL_AREA_LEFT + COL_W * 0.5,
  COL_AREA_LEFT + COL_W * 1.5,
  COL_AREA_LEFT + COL_W * 2.5,
  COL_AREA_LEFT + COL_W * 3.5,
] as const;
const BAND_W = COL_W - 10;
const LANE_GAP = 100;
const LANE_GAP_COMPACT = 72;
/** Room for column titles above the gray bands. */
const LABEL_AREA = 56;
const LABEL_AREA_COMPACT = 48;
const TOP_PAD = 78;
const TOP_PAD_COMPACT = 68;
const BOTTOM_PAD = 16;
const BOTTOM_PAD_COMPACT = 12;
const NODE_R = 12;
const NODE_HIT_R = 20;
const NODE_RING_R = 17;
const CASCADE_STEP_MS = 180;
const CASCADE_SETTLE_MS = 220;
const SETTLED_COLUMN = ROUTER_COLUMNS.length;

const STAGE_META: {
  id: RouterColumn;
  label: string;
  caption: string;
}[] = [
  { id: 'policy', label: 'Policy', caption: 'Acceptable use' },
  { id: 'security', label: 'Security', caption: 'Data & PII' },
  { id: 'governance', label: 'Governance', caption: 'Approved for task' },
  { id: 'costQuality', label: 'Cost / quality', caption: 'Best fit wins' },
];

type NodeVisual = 'idle' | 'pass' | 'green' | 'red' | 'grey';

interface ActiveNode {
  candidateId: string;
  stage: RouterColumn;
}

const requestPulse = keyframes`
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.88;
  }
`;

const sheenTravel = keyframes`
  0% {
    stroke-dashoffset: 48;
  }
  100% {
    stroke-dashoffset: -48;
  }
`;

const routedPop = keyframes`
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.22);
  }
  100% {
    transform: scale(1);
  }
`;

const Wrap = styled.section`
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  gap: var(--space-150);
  align-items: stretch;
  justify-content: flex-start;
  box-sizing: border-box;
  width: 100%;
  height: auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-100) var(--space-200);
  width: 100%;
`;

const HeaderText = styled.div`
  display: flex;
  flex: 1 1 14rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-050) var(--space-150);
  min-width: 0;
`;

const Title = styled.h3`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-helper);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-050) var(--space-100);
  width: 100%;
`;

const MetaChip = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.3;
`;

const TIP_W = 248;
const TIP_H = 76;
const TIP_LINE_H = 14;
const TIP_PAD_Y = 34;

const TipPanel = styled.rect`
  fill: var(--color-surfaces-container);
  stroke: var(--color-stroke-border);
  stroke-width: 1;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.12));
  pointer-events: none;
`;

const TipTitle = styled.text`
  fill: var(--color-text-icon-secondary);
  font-size: 10px;
  font-weight: 700;
  pointer-events: none;
`;

const TipBody = styled.text`
  fill: var(--color-text-icon-primary);
  font-size: 11px;
  font-weight: 500;
  pointer-events: none;
`;

const Graph = styled.div`
  display: flex;
  flex: 0 1 auto;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  width: 100%;
  overflow: hidden;
`;

const Svg = styled.svg`
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: auto;
  max-width: none;
  max-height: 100%;
  margin-inline: 0;
  overflow: visible;
`;

const ChartFooter = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-100) var(--space-200);
  width: 100%;
`;

const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  flex: 0 1 auto;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-050) var(--space-150);
  margin: 0 0 0 auto;
  padding: 0;
  list-style: none;
`;

const StageLabel = styled.text`
  fill: var(--color-text-icon-primary);
  font-size: var(--type-size-helper);
  font-weight: 700;
`;

const StageCaption = styled.text`
  fill: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: 500;
`;

const RequestHit = styled.g<{ $pulse?: boolean; $active?: boolean }>`
  cursor: pointer;
  transform-box: fill-box;
  transform-origin: center;

  &:focus {
    outline: none;
  }

  ${({ $pulse }) =>
    $pulse
      ? css`
          animation: ${requestPulse} 2.4s ease-in-out infinite;

          @media (prefers-reduced-motion: reduce) {
            animation: none;
          }
        `
      : undefined}

  .request-ring {
    stroke: ${({ $active }) =>
      $active ? 'var(--color-primary-primary)' : 'transparent'};
    stroke-opacity: ${({ $active }) => ($active ? 1 : 0)};
  }

  &:focus-visible .request-ring {
    stroke: var(--color-primary-primary);
    stroke-opacity: 1;
  }

  &:hover .request-fill {
    fill: var(--color-primary-primary-hover);
  }
`;

const RequestLabel = styled.text`
  fill: var(--color-text-icon-secondary);
  font-size: 10px;
  font-weight: 600;
`;

const BlockNote = styled.text`
  fill: var(--color-error-error);
  font-size: 9px;
  font-weight: 600;
`;

const CardTitle = styled.text<{ $muted?: boolean; $fill: string }>`
  fill: ${({ $muted, $fill }) =>
    $muted ? 'var(--color-text-icon-placeholder)' : $fill};
  font-size: var(--type-size-helper);
  font-weight: 700;
`;

const CardMeta = styled.text`
  fill: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: 500;
`;

const CardStatus = styled.text<{ $tone: 'routed' | 'blocked' | 'idle' }>`
  fill: ${({ $tone }) =>
    $tone === 'routed'
      ? 'var(--color-success-success)'
      : $tone === 'blocked'
        ? 'var(--color-error-error)'
        : 'var(--color-text-icon-placeholder)'};
  font-size: var(--type-size-caption);
  font-weight: 700;
`;

const NodeGroup = styled.g`
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:focus-visible .node-ring {
    stroke: var(--color-primary-primary);
    stroke-opacity: 1;
  }
`;

const NodeDot = styled.circle<{ $pop?: boolean }>`
  transform-box: fill-box;
  transform-origin: center;
  ${({ $pop }) =>
    $pop
      ? css`
          animation: ${routedPop} 420ms ease-out 1;

          @media (prefers-reduced-motion: reduce) {
            animation: none;
          }
        `
      : undefined}
`;

const BasePath = styled.path`
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const SheenPath = styled.path<{ $delayMs: number }>`
  fill: none;
  stroke: var(--color-primary-primary);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-opacity: 0.28;
  stroke-dasharray: 10 28;
  animation: ${sheenTravel} 2.8s linear infinite;
  animation-delay: ${({ $delayMs }) => `${$delayMs}ms`};
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    stroke-opacity: 0;
  }
`;

const LegendItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: var(--space-050);
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
`;

const Swatch = styled.span<{ $visual: NodeVisual }>`
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-1000);
  background: ${({ $visual }) => {
    if ($visual === 'green') return 'var(--color-success-success)';
    if ($visual === 'red') return 'var(--color-error-error)';
    if ($visual === 'pass') return 'var(--color-text-icon-primary)';
    if ($visual === 'idle' || $visual === 'grey') {
      return 'var(--color-surfaces-on-container-low)';
    }
    return 'transparent';
  }};
  border: ${({ $visual }) =>
    $visual === 'grey' || $visual === 'idle'
      ? 'var(--stroke-100) solid var(--color-stroke-border-high)'
      : 'none'};
  color: var(--color-text-icon-inverse);
`;

const Footnote = styled.p`
  flex: 1 1 12rem;
  margin: 0;
  min-width: 0;
  color: var(--color-text-icon-placeholder);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const LEGEND: { visual: NodeVisual; label: string; icon?: 'check' | 'x' }[] = [
  { visual: 'pass', label: 'Passed', icon: 'check' },
  { visual: 'green', label: 'Routed' },
  { visual: 'red', label: 'Blocked', icon: 'x' },
  { visual: 'grey', label: 'Not selected' },
];

const STAGE_REASON_PREFIX: Record<RouterColumn, string> = {
  policy: 'policy',
  security: 'security',
  governance: 'governance',
  costQuality: 'cost/quality',
};

function fillFor(visual: NodeVisual): string {
  switch (visual) {
    case 'green':
      return 'var(--color-success-success)';
    case 'red':
      return 'var(--color-error-error)';
    case 'pass':
      return 'var(--color-text-icon-primary)';
    case 'grey':
      return 'var(--color-surfaces-on-container-low)';
    case 'idle':
    default:
      return 'var(--color-surfaces-on-container-low)';
  }
}

function strokeFor(visual: NodeVisual): string {
  if (visual === 'idle') return 'var(--color-stroke-border-high)';
  if (visual === 'grey') return 'var(--color-stroke-border)';
  if (visual === 'green') return 'var(--color-success-success)';
  if (visual === 'red') return 'var(--color-error-error)';
  return 'var(--color-text-icon-secondary)';
}

function nodeStroke(visual: NodeVisual, isActive: boolean): string {
  if (visual === 'idle' || visual === 'grey') {
    return 'var(--color-stroke-border-high)';
  }
  if (isActive) return 'var(--color-surfaces-container)';
  return 'transparent';
}

function nodeVisual(
  state: LaneNodeState,
  idle: boolean,
  laneRouted: boolean,
): NodeVisual {
  if (idle) return 'idle';
  if (laneRouted && (state === 'Eligible' || state === 'Routed')) return 'green';
  switch (state) {
    case 'Routed':
      return 'green';
    case 'Blocked':
      return 'red';
    case 'NotSelected':
      return 'grey';
    case 'Eligible':
    default:
      return 'pass';
  }
}

function statusLabel(state: LaneNodeState, idle: boolean) {
  if (idle) return 'Idle';
  if (state === 'Eligible') return 'Passed';
  if (state === 'NotSelected') return 'Not selected';
  return state;
}

function laneYs(count: number, topPad: number, laneGap: number): number[] {
  if (count <= 0) return [topPad];
  return Array.from({ length: count }, (_, i) => topPad + i * laneGap);
}

function lanePathD(
  requestX: number,
  requestY: number,
  stageXs: readonly number[],
  laneY: number,
): string {
  const firstX = stageXs[0];
  const midX = requestX + (firstX - requestX) * 0.55;
  const parts = [
    `M ${requestX} ${requestY}`,
    `C ${midX} ${requestY}, ${midX} ${laneY}, ${firstX} ${laneY}`,
  ];
  for (let i = 1; i < stageXs.length; i += 1) {
    parts.push(`L ${stageXs[i]} ${laneY}`);
  }
  parts.push(`L ${CARD_X - 8} ${laneY}`);
  return parts.join(' ');
}

function lanePathThroughSeg(
  requestX: number,
  requestY: number,
  stageXs: readonly number[],
  laneY: number,
  seg: number,
): string {
  const firstX = stageXs[0];
  const midX = requestX + (firstX - requestX) * 0.55;
  if (seg <= 0) {
    return `M ${requestX} ${requestY} C ${midX} ${requestY}, ${midX} ${laneY}, ${firstX} ${laneY}`;
  }
  const parts = [
    `M ${requestX} ${requestY}`,
    `C ${midX} ${requestY}, ${midX} ${laneY}, ${firstX} ${laneY}`,
  ];
  for (let i = 1; i <= Math.min(seg, stageXs.length - 1); i += 1) {
    parts.push(`L ${stageXs[i]} ${laneY}`);
  }
  return parts.join(' ');
}

function stageReason(
  lane: RouterLaneResult,
  stage: RouterColumn,
  idle: boolean,
): string {
  if (idle) return 'Run a prompt to evaluate this stage.';

  const state = lane.nodes[stage];
  const prefix = STAGE_REASON_PREFIX[stage];
  const matched = lane.reasons.find((reason) =>
    reason.toLowerCase().startsWith(`${prefix}:`),
  );
  if (matched) {
    return matched.replace(/^[^:]+:\s*/i, '').replace(/^./, (c) => c.toUpperCase());
  }

  const label = ROUTER_COLUMNS.find((col) => col.id === stage)?.label ?? stage;
  if (state === 'Eligible') return `Passed ${label.toLowerCase()} checks for this path.`;
  if (state === 'Routed') return `Selected at ${label.toLowerCase()}.`;
  if (state === 'Blocked') return `Blocked at ${label.toLowerCase()}.`;
  return `Not evaluated — an earlier stage stopped this path.`;
}

/** Short callout under a blocked node. */
function blockAnnotation(lane: RouterLaneResult, stage: RouterColumn): string | null {
  if (lane.nodes[stage] !== 'Blocked') return null;
  const detail = stageReason(lane, stage, false);
  if (/pii/i.test(detail) && stage === 'governance') return 'Not approved for PII';
  if (/pii|public-cloud|hosting/i.test(detail) && stage === 'security') {
    return 'No PII-safe hosting';
  }
  if (/residency/i.test(detail)) return 'Residency not met';
  if (/quality/i.test(detail)) return 'Below quality floor';
  const clipped = detail.length > 28 ? `${detail.slice(0, 27)}…` : detail;
  return clipped;
}

function sameNode(a: ActiveNode | null, b: ActiveNode): boolean {
  return Boolean(a && a.candidateId === b.candidateId && a.stage === b.stage);
}

function tipOrigin(cx: number, cy: number, viewH: number, tipH = TIP_H) {
  const tipX =
    cx + NODE_HIT_R + 8 + TIP_W <= VIEW_W
      ? cx + NODE_HIT_R + 8
      : cx - NODE_HIT_R - 8 - TIP_W;
  const tipY =
    cy - tipH / 2 < 4
      ? 4
      : cy + tipH / 2 > viewH - 4
        ? viewH - tipH - 4
        : cy - tipH / 2;
  return { tipX, tipY };
}

function tipHeight(lineCount: number) {
  return Math.max(TIP_H, TIP_PAD_Y + lineCount * TIP_LINE_H + 10);
}

function wrapTipLines(text: string, maxChars = 34): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function GlyphCheck({ cx, cy }: { cx: number; cy: number }) {
  return (
    <path
      d={`M ${cx - 4} ${cy + 0.5} L ${cx - 1.2} ${cy + 3.4} L ${cx + 4.5} ${cy - 3.2}`}
      fill="none"
      stroke="var(--color-text-icon-inverse)"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      pointerEvents="none"
    />
  );
}

function GlyphX({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g
      stroke="var(--color-text-icon-inverse)"
      strokeWidth={2.25}
      strokeLinecap="round"
      pointerEvents="none"
    >
      <line x1={cx - 3.5} y1={cy - 3.5} x2={cx + 3.5} y2={cy + 3.5} />
      <line x1={cx + 3.5} y1={cy - 3.5} x2={cx - 3.5} y2={cy + 3.5} />
    </g>
  );
}

function GlyphArrow({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g
      fill="none"
      stroke="var(--color-text-icon-inverse)"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      pointerEvents="none"
    >
      <line x1={cx - 5} y1={cy} x2={cx + 4} y2={cy} />
      <polyline points={`${cx + 1},${cy - 4} ${cx + 5},${cy} ${cx + 1},${cy + 4}`} />
    </g>
  );
}

function modelProvider(model: string): string {
  if (/claude/i.test(model)) return 'Anthropic';
  if (/llama/i.test(model)) return 'Meta';
  if (/qwen/i.test(model)) return 'Alibaba';
  if (/gpt/i.test(model)) return 'OpenAI';
  return 'Model';
}

function hostingShort(hosting: HostingLabel): string {
  switch (hosting) {
    case 'Public cloud':
      return 'API';
    case 'Lenovo infrastructure':
      return 'Lenovo';
    case 'Self-hosted':
      return 'Self-hosted';
    case 'On premises':
      return 'On-prem';
    case 'In-country':
      return 'In-country';
    default:
      return hosting;
  }
}

function costTier(cost: number, costs: number[]): string {
  if (costs.length === 0) return '$';
  const sorted = [...costs].sort((a, b) => a - b);
  const idx = sorted.indexOf(cost);
  if (idx <= 0) return '$';
  if (idx >= sorted.length - 1) return '$$$';
  return '$$';
}

function blockedStage(lane: RouterLaneResult): RouterColumn | null {
  for (const col of ROUTER_COLUMNS) {
    if (lane.nodes[col.id] === 'Blocked') return col.id;
  }
  return null;
}

function decidedStage(evaluation: PromptEvaluation | null): string {
  if (!evaluation) return '—';
  const routed = evaluation.lanes.find((lane) => lane.isRouted);
  if (routed) {
    for (const col of ROUTER_COLUMNS) {
      if (routed.nodes[col.id] === 'Routed') return col.label;
    }
    return 'Cost / quality';
  }
  const blocked = evaluation.lanes
    .map((lane) => blockedStage(lane))
    .find(Boolean);
  if (blocked) {
    return ROUTER_COLUMNS.find((col) => col.id === blocked)?.label ?? '—';
  }
  return '—';
}

function firstDeadSeg(lane: RouterLaneResult): number {
  for (let i = 0; i < ROUTER_COLUMNS.length; i += 1) {
    const state = lane.nodes[ROUTER_COLUMNS[i].id];
    if (state === 'Blocked' || state === 'NotSelected') return i;
  }
  return ROUTER_COLUMNS.length;
}

interface RouterLaneGraphProps {
  policyId: PolicyId;
  evaluation: PromptEvaluation | null;
  compact?: boolean;
  prompt?: string;
}

export function RouterLaneGraph({
  policyId,
  evaluation,
  compact = false,
  prompt,
}: RouterLaneGraphProps) {
  const idle = !evaluation;
  const [hovered, setHovered] = useState<ActiveNode | null>(null);
  const [pinned, setPinned] = useState<ActiveNode | null>(null);
  const [requestHovered, setRequestHovered] = useState(false);
  const [requestPinned, setRequestPinned] = useState(false);
  const [revealColumn, setRevealColumn] = useState(() =>
    idle || prefersReducedMotion() ? SETTLED_COLUMN : -1,
  );
  const [routedPopDone, setRoutedPopDone] = useState(false);

  const topPad = compact ? TOP_PAD_COMPACT : TOP_PAD;
  const laneGap = compact ? LANE_GAP_COMPACT : LANE_GAP;
  const bottomPad = compact ? BOTTOM_PAD_COMPACT : BOTTOM_PAD;
  const labelArea = compact ? LABEL_AREA_COMPACT : LABEL_AREA;
  const cardH = compact ? 68 : 78;
  const cardPadY = compact ? 18 : 22;
  const cardLineGap = compact ? 16 : 18;

  const lanes: RouterLaneResult[] = useMemo(
    () => evaluation?.lanes ?? idleLanesForPolicy(policyId),
    [evaluation, policyId],
  );

  const costs = lanes.map((lane) => lane.costPerRequest);
  const ys = laneYs(lanes.length, topPad, laneGap);
  const requestY = ys.length === 1 ? ys[0] : (ys[0] + ys[ys.length - 1]) / 2;
  const viewH =
    Math.max(ys[ys.length - 1] ?? topPad, requestY + REQUEST_R) +
    cardH / 2 +
    bottomPad;
  const routedLane = evaluation?.lanes.find((lane) => lane.isRouted);
  const eligibleCount = evaluation
    ? evaluation.lanes.filter((lane) => {
        const dead = firstDeadSeg(lane);
        return dead >= ROUTER_COLUMNS.length - 1 || lane.isRouted;
      }).length
    : 0;
  const promptText = evaluation?.prompt?.trim() || prompt?.trim() || '';

  const settled = idle || revealColumn >= SETTLED_COLUMN;
  const revealing = !idle && !settled;
  const requestActive = requestPinned || requestHovered;

  useEffect(() => {
    if (idle) {
      setRevealColumn(SETTLED_COLUMN);
      setRoutedPopDone(false);
      return;
    }

    if (prefersReducedMotion()) {
      setRevealColumn(SETTLED_COLUMN);
      setRoutedPopDone(true);
      return;
    }

    setRevealColumn(-1);
    setRoutedPopDone(false);

    const timers: number[] = [];
    for (let col = 0; col < ROUTER_COLUMNS.length; col += 1) {
      timers.push(
        window.setTimeout(() => setRevealColumn(col), CASCADE_STEP_MS * (col + 1)),
      );
    }
    timers.push(
      window.setTimeout(() => {
        setRevealColumn(SETTLED_COLUMN);
      }, CASCADE_STEP_MS * ROUTER_COLUMNS.length + CASCADE_SETTLE_MS),
    );
    timers.push(
      window.setTimeout(
        () => setRoutedPopDone(true),
        CASCADE_STEP_MS * ROUTER_COLUMNS.length + CASCADE_SETTLE_MS + 450,
      ),
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [idle, evaluation?.selectedId, evaluation?.statusMessage]);

  const active = requestActive ? null : pinned ?? hovered;
  const activeLane = active
    ? lanes.find((lane) => lane.candidateId === active.candidateId)
    : null;
  const activeLaneIndex = active
    ? lanes.findIndex((lane) => lane.candidateId === active.candidateId)
    : -1;
  const activeStageIndex = active
    ? ROUTER_COLUMNS.findIndex((col) => col.id === active.stage)
    : -1;
  const activeStageMeta =
    activeStageIndex >= 0 ? STAGE_META[activeStageIndex] : null;
  const activeCx = activeStageIndex >= 0 ? STAGE_X[activeStageIndex] : 0;
  const activeCy = activeLaneIndex >= 0 ? ys[activeLaneIndex] : 0;
  const tipIdle = idle || (revealing && activeStageIndex > revealColumn);
  const requestLines = wrapTipLines(
    promptText || 'Type a prompt above to light these lanes.',
    36,
  );
  const requestTipH = tipHeight(requestLines.length);
  const nodeTipLines =
    active && activeLane && activeStageMeta
      ? wrapTipLines(stageReason(activeLane, active.stage, tipIdle))
      : [];
  const nodeTipH = tipHeight(nodeTipLines.length);
  const activeTip = requestActive
    ? {
        ...tipOrigin(REQUEST_X, requestY, viewH, requestTipH),
        tipH: requestTipH,
        title: 'Request',
        lines: requestLines,
      }
    : active && activeLane && activeStageMeta
      ? {
          ...tipOrigin(activeCx, activeCy, viewH, nodeTipH),
          tipH: nodeTipH,
          title: `${activeStageMeta.label} · ${statusLabel(activeLane.nodes[active.stage], tipIdle)}`,
          lines: nodeTipLines,
        }
      : null;

  function activate(node: ActiveNode) {
    setRequestPinned(false);
    setPinned((current) => (sameNode(current, node) ? null : node));
  }

  function activateRequest() {
    setPinned(null);
    setRequestPinned((current) => !current);
  }

  function onNodeKeyDown(event: ReactKeyboardEvent, node: ActiveNode) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(node);
    }
  }

  function onRequestKeyDown(event: ReactKeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateRequest();
    }
  }

  function visualForStage(lane: RouterLaneResult, stageIndex: number): NodeVisual {
    const stageId = ROUTER_COLUMNS[stageIndex].id;
    if (idle) return 'idle';
    if (revealing && stageIndex > revealColumn) return 'idle';
    return nodeVisual(lane.nodes[stageId], false, lane.isRouted);
  }

  return (
    <Wrap aria-label="Router evaluation">
      <Header>
        <HeaderText>
          <Title>Route</Title>
          {!idle && settled && evaluation?.selectedModel ? (
            <CellBadge
              color={modelBadgeColor(evaluation.selectedModel)}
              tone="subtle"
              dot={false}
            >
              {evaluation.selectedModel}
            </CellBadge>
          ) : null}
          <Subtitle>
            {idle
              ? 'Try a request to light the lanes.'
              : revealing
                ? 'Evaluating stages…'
                : evaluation?.statusMessage ?? 'Selected route'}
          </Subtitle>
          {!idle && settled ? (
            <MetaRow>
              <MetaChip>
                {eligibleCount} of {lanes.length} eligible
              </MetaChip>
              <MetaChip>·</MetaChip>
              <MetaChip>decided at {decidedStage(evaluation)}</MetaChip>
              {routedLane ? (
                <>
                  <MetaChip>·</MetaChip>
                  <MetaChip>{routedLane.latencyMs} ms</MetaChip>
                </>
              ) : null}
            </MetaRow>
          ) : null}
        </HeaderText>
      </Header>

      <Graph>
        <Svg
          viewBox={`0 0 ${VIEW_W} ${viewH}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={
            idle
              ? 'Incoming request fans out to one line per model'
              : `Routed to ${evaluation?.selectedModel ?? 'a model'}`
          }
        >
          {STAGE_META.map((col, index) => (
            <rect
              key={`band-${col.id}`}
              x={STAGE_X[index] - BAND_W / 2}
              y={labelArea}
              width={BAND_W}
              height={Math.max(0, viewH - labelArea - 4)}
              rx={10}
              fill="var(--color-surfaces-on-container-low)"
              opacity={0.65}
            />
          ))}

          {STAGE_META.map((col, index) => (
            <g key={col.id} opacity={idle || settled || revealColumn >= index ? 1 : 0.35}>
              <StageLabel x={STAGE_X[index]} y={compact ? 18 : 20} textAnchor="middle">
                {col.label}
              </StageLabel>
              <StageCaption
                x={STAGE_X[index]}
                y={compact ? 34 : 38}
                textAnchor="middle"
              >
                {col.caption}
              </StageCaption>
            </g>
          ))}

          {lanes.map((lane, laneIndex) => {
            const y = ys[laneIndex];
            const stages = ROUTER_COLUMNS.map((col) => col.id);
            const modelFill = modelChartColors(lane.model).color;
            const fullPath = lanePathD(REQUEST_X, requestY, STAGE_X, y);
            const deadSeg = idle ? ROUTER_COLUMNS.length : firstDeadSeg(lane);
            const visibleSeg =
              settled || idle ? STAGE_X.length - 1 : Math.max(0, revealColumn);
            const livePath = lanePathThroughSeg(
              REQUEST_X,
              requestY,
              STAGE_X,
              y,
              Math.min(visibleSeg, Math.max(0, deadSeg)),
            );
            const afterBlock =
              settled &&
              !idle &&
              deadSeg < ROUTER_COLUMNS.length - 1;
            const dashedPath = afterBlock
              ? `M ${STAGE_X[deadSeg]} ${y} L ${CARD_X - 8} ${y}`
              : null;
            const pathStroke = idle
              ? strokeFor('idle')
              : lane.isRouted
                ? 'var(--color-success-success)'
                : strokeFor('pass');
            const showSheen = idle;
            const blocked = blockedStage(lane);
            const statusTone: 'routed' | 'blocked' | 'idle' = idle || revealing
              ? 'idle'
              : lane.isRouted
                ? 'routed'
                : blocked
                  ? 'blocked'
                  : 'idle';
            const statusText = idle || revealing
              ? 'Waiting'
              : lane.isRouted
                ? 'Routed'
                : blocked
                  ? `Blocked · ${STAGE_META.find((s) => s.id === blocked)?.label ?? ''}`
                  : 'Not selected';
            const cardY = y - cardH / 2;
            const cardSolid =
              lane.isRouted && settled
                ? 'var(--color-badge-green-light)'
                : 'var(--color-surfaces-container)';


            return (
              <g
                key={lane.candidateId}
                data-testid={`lane-${lane.candidateId}`}
                data-terminal={idle ? 'idle' : lane.isRouted ? 'routed' : 'done'}
              >
                <BasePath
                  d={livePath}
                  stroke={pathStroke}
                  strokeWidth={lane.isRouted && settled ? 3 : 2.25}
                />
                {dashedPath ? (
                  <BasePath
                    d={dashedPath}
                    stroke="var(--color-stroke-border-high)"
                    strokeWidth={2}
                    strokeDasharray="5 6"
                    opacity={0.7}
                  />
                ) : null}
                {settled && !idle && !lane.isRouted && deadSeg >= ROUTER_COLUMNS.length - 1 ? (
                  <BasePath
                    d={`M ${STAGE_X[STAGE_X.length - 1]} ${y} L ${CARD_X - 8} ${y}`}
                    stroke="var(--color-stroke-border)"
                    strokeWidth={2}
                    strokeDasharray="5 6"
                    opacity={0.75}
                  />
                ) : null}
                {settled && !idle && lane.isRouted ? (
                  <BasePath
                    d={`M ${STAGE_X[STAGE_X.length - 1]} ${y} L ${CARD_X - 8} ${y}`}
                    stroke="var(--color-success-success)"
                    strokeWidth={3}
                  />
                ) : null}

                {showSheen ? (
                  <SheenPath d={fullPath} $delayMs={laneIndex * 220} />
                ) : null}

                {stages.map((stageId, stageIndex) => {
                  const visual = visualForStage(lane, stageIndex);
                  const cx = STAGE_X[stageIndex];
                  const node: ActiveNode = {
                    candidateId: lane.candidateId,
                    stage: stageId as RouterColumn,
                  };
                  const isActive = sameNode(active, node);
                  const stageLabel =
                    STAGE_META[stageIndex]?.label ?? String(stageId);
                  const state = lane.nodes[node.stage];
                  const nodeStillIdle =
                    idle || (revealing && stageIndex > revealColumn);
                  const detail = stageReason(lane, node.stage, nodeStillIdle);
                  const isRoutedTerminal =
                    !idle &&
                    settled &&
                    lane.isRouted &&
                    stageIndex === stages.length - 1 &&
                    visual === 'green';
                  const note =
                    !idle && settled
                      ? blockAnnotation(lane, node.stage)
                      : null;
                  const showGlyph =
                    visual === 'pass' || visual === 'green' || visual === 'red';

                  return (
                    <NodeGroup
                      key={`${lane.candidateId}-${stageId}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      aria-label={`${lane.model}, ${stageLabel}: ${statusLabel(state, nodeStillIdle)}. ${detail}`}
                      onMouseEnter={() => setHovered(node)}
                      onMouseLeave={() =>
                        setHovered((current) =>
                          sameNode(current, node) ? null : current,
                        )
                      }
                      onFocus={() => setHovered(node)}
                      onBlur={() =>
                        setHovered((current) =>
                          sameNode(current, node) ? null : current,
                        )
                      }
                      onClick={() => activate(node)}
                      onKeyDown={(event) => onNodeKeyDown(event, node)}
                    >
                      <circle
                        className="node-ring"
                        cx={cx}
                        cy={y}
                        r={NODE_RING_R}
                        fill="transparent"
                        stroke={
                          isActive
                            ? 'var(--color-primary-primary)'
                            : 'transparent'
                        }
                        strokeWidth={2}
                        strokeOpacity={isActive ? 1 : 0}
                        pointerEvents="none"
                      />
                      <circle cx={cx} cy={y} r={NODE_HIT_R} fill="transparent" />
                      <NodeDot
                        cx={cx}
                        cy={y}
                        r={NODE_R}
                        fill={fillFor(visual)}
                        stroke={nodeStroke(visual, isActive)}
                        strokeWidth={
                          visual === 'idle' || visual === 'grey' || isActive
                            ? 1.75
                            : 1
                        }
                        $pop={isRoutedTerminal && !routedPopDone}
                      />
                      {showGlyph && visual === 'red' ? (
                        <GlyphX cx={cx} cy={y} />
                      ) : null}
                      {showGlyph && (visual === 'pass' || visual === 'green') ? (
                        <GlyphCheck cx={cx} cy={y} />
                      ) : null}
                      {note ? (
                        <BlockNote x={cx} y={y + NODE_R + 14} textAnchor="middle">
                          {note}
                        </BlockNote>
                      ) : null}
                    </NodeGroup>
                  );
                })}

                <g>
                  <rect
                    x={CARD_X}
                    y={cardY}
                    width={CARD_W}
                    height={cardH}
                    rx={10}
                    fill={cardSolid}
                    stroke={
                      lane.isRouted && settled
                        ? 'var(--color-success-success)'
                        : 'var(--color-stroke-border)'
                    }
                    strokeWidth={lane.isRouted && settled ? 1.75 : 1}
                  />
                  <CardTitle
                    x={CARD_X + 12}
                    y={cardY + cardPadY}
                    $muted={false}
                    $fill={modelFill}
                  >
                    {lane.model.length > 26
                      ? `${lane.model.slice(0, 25)}…`
                      : lane.model}
                  </CardTitle>
                  <CardMeta x={CARD_X + 12} y={cardY + cardPadY + cardLineGap}>
                    {`${modelProvider(lane.model)} · ${hostingShort(lane.hosting)} · ${costTier(lane.costPerRequest, costs)}`}
                  </CardMeta>
                  <CardStatus
                    x={CARD_X + 12}
                    y={cardY + cardPadY + cardLineGap * 2}
                    $tone={statusTone}
                  >
                    {statusText}
                  </CardStatus>
                </g>
              </g>
            );
          })}

          <RequestHit
            $pulse={idle && !requestActive}
            $active={requestActive}
            role="button"
            tabIndex={0}
            aria-pressed={requestPinned}
            aria-label={
              promptText
                ? `Request prompt: ${promptText}`
                : 'Request — no prompt yet. Type above to start.'
            }
            onMouseEnter={() => setRequestHovered(true)}
            onMouseLeave={() => setRequestHovered(false)}
            onFocus={() => setRequestHovered(true)}
            onBlur={() => setRequestHovered(false)}
            onClick={activateRequest}
            onKeyDown={onRequestKeyDown}
          >
            <circle
              className="request-ring"
              cx={REQUEST_X}
              cy={requestY}
              r={REQUEST_HIT_R + 2}
              fill="transparent"
              strokeWidth={2}
              pointerEvents="none"
            />
            <circle
              cx={REQUEST_X}
              cy={requestY}
              r={REQUEST_HIT_R}
              fill="transparent"
            />
            <circle
              className="request-fill"
              cx={REQUEST_X}
              cy={requestY}
              r={REQUEST_R}
              fill="var(--color-primary-primary)"
            />
            <GlyphArrow cx={REQUEST_X} cy={requestY} />
          </RequestHit>
          <RequestLabel x={REQUEST_X} y={requestY + REQUEST_R + 14} textAnchor="middle">
            Request
          </RequestLabel>

          {activeTip ? (
            <g pointerEvents="none" aria-hidden>
              <TipPanel
                x={activeTip.tipX}
                y={activeTip.tipY}
                width={TIP_W}
                height={activeTip.tipH}
                rx={8}
                ry={8}
              />
              <TipTitle x={activeTip.tipX + 10} y={activeTip.tipY + 16}>
                {activeTip.title}
              </TipTitle>
              {activeTip.lines.map((line, index) => (
                <TipBody
                  key={`active-tip-${index}`}
                  x={activeTip.tipX + 10}
                  y={activeTip.tipY + TIP_PAD_Y + index * TIP_LINE_H}
                >
                  {line}
                </TipBody>
              ))}
            </g>
          ) : null}
        </Svg>
      </Graph>

      <ChartFooter>
        <Footnote>
          Each request passes four checks left to right. The first failing check
          stops a lane.
        </Footnote>
        {!idle ? (
          <Legend aria-label="Router legend">
            {LEGEND.map((item) => (
              <LegendItem key={item.visual}>
                <Swatch $visual={item.visual} aria-hidden>
                  {item.icon === 'check' ? (
                    <Check size={9} strokeWidth={3} />
                  ) : null}
                  {item.icon === 'x' ? <X size={9} strokeWidth={3} /> : null}
                </Swatch>
                {item.label}
              </LegendItem>
            ))}
          </Legend>
        ) : null}
      </ChartFooter>
    </Wrap>
  );
}
