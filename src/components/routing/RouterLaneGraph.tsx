import { useId, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import styled from 'styled-components';
import { modelBadgeColor, modelChartColors } from '../../data/modelColors';
import {
  ROUTER_COLUMNS,
  idleLanesForPolicy,
  type LaneNodeState,
  type PolicyId,
  type PromptEvaluation,
  type RouterColumn,
  type RouterLaneResult,
} from '../../data/routingDemo';
import { CellBadge } from '../../pages/ReportPage';

const STAGE_X = [200, 320, 440, 560] as const;
const STAR_X = 28;
const MODEL_X = 590;
const VIEW_W = 820;
const LANE_GAP = 52;
const LANE_GAP_COMPACT = 30;
/** Room under stage labels so Policy / Security / … clear the first dots. */
const TOP_PAD = 36;
const TOP_PAD_COMPACT = 22;
/** Clearance under the last lane for model label / star caption. */
const BOTTOM_PAD = 14;
const BOTTOM_PAD_COMPACT = 8;
const NODE_R = 8;
const NODE_HIT_R = 16;
const NODE_RING_R = 12;

type NodeVisual = 'idle' | 'pass' | 'green' | 'red' | 'grey';

interface ActiveNode {
  candidateId: string;
  stage: RouterColumn;
}

const Wrap = styled.section`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-150);
  align-items: stretch;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
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
  flex: 1 1 12rem;
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

const TIP_W = 228;
const TIP_H = 76;

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
  flex: 1 1 auto;
  align-items: center;
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
  max-width: 60rem;
  max-height: 100%;
  margin-inline: auto;
  overflow: visible;
`;

const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  flex: 0 1 auto;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-050) var(--space-150);
  max-width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const StageLabel = styled.text`
  fill: var(--color-text-icon-secondary);
  font-size: 10px;
  font-weight: 600;
`;

const Star = styled.polygon`
  fill: var(--color-primary-primary);
`;

const StarLabel = styled.text`
  fill: var(--color-text-icon-secondary);
  font-size: 10px;
  font-weight: 600;
`;

const ModelLabel = styled.text<{ $idle?: boolean; $fill: string }>`
  fill: ${({ $idle, $fill }) => ($idle ? 'var(--color-text-icon-placeholder)' : $fill)};
  font-size: 11px;
  font-weight: ${({ $idle }) => ($idle ? 600 : 700)};
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

const LegendItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: var(--space-050);
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
`;

const Swatch = styled.span<{ $visual: NodeVisual }>`
  width: 10px;
  height: 10px;
  border-radius: var(--radius-1000);
  background: ${({ $visual }) => fillFor($visual)};
  border: ${({ $visual }) =>
    $visual === 'grey'
      ? 'var(--stroke-100) solid var(--color-stroke-border-high)'
      : 'none'};
`;

const LEGEND: { visual: NodeVisual; label: string }[] = [
  { visual: 'pass', label: 'Eligible' },
  { visual: 'green', label: 'Routed' },
  { visual: 'red', label: 'Blocked' },
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
      return 'var(--color-text-icon-secondary)';
    case 'grey':
      return 'var(--color-surfaces-on-container-low)';
    case 'idle':
    default:
      return 'var(--color-stroke-border-high)';
  }
}

function strokeFor(visual: NodeVisual): string {
  if (visual === 'idle') return 'var(--color-stroke-border-high)';
  if (visual === 'grey') return 'var(--color-stroke-border)';
  return 'var(--color-text-icon-secondary)';
}

function nodeVisual(state: LaneNodeState, idle: boolean): NodeVisual {
  if (idle) return 'idle';
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
  if (state === 'NotSelected') return 'Not selected';
  return state;
}

/** Incoming line uses pass while the request is still alive; idle/grey after a stop. */
function lineVisual(dest: LaneNodeState, idle: boolean): NodeVisual {
  if (idle) return 'idle';
  if (dest === 'NotSelected') return 'pass';
  if (dest === 'Eligible' || dest === 'Routed' || dest === 'Blocked') return 'pass';
  return 'idle';
}

function starPoints(cx: number, cy: number, outer = 9, inner = 3.8): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    points.push(`${(cx + Math.cos(angle) * r).toFixed(2)},${(cy + Math.sin(angle) * r).toFixed(2)}`);
  }
  return points.join(' ');
}

function laneYs(count: number, topPad: number, laneGap: number): number[] {
  if (count <= 0) return [topPad];
  return Array.from({ length: count }, (_, i) => topPad + i * laneGap);
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

function sameNode(a: ActiveNode | null, b: ActiveNode): boolean {
  return Boolean(a && a.candidateId === b.candidateId && a.stage === b.stage);
}

function tipOrigin(cx: number, cy: number, viewH: number) {
  const tipX =
    cx + NODE_HIT_R + 8 + TIP_W <= VIEW_W
      ? cx + NODE_HIT_R + 8
      : cx - NODE_HIT_R - 8 - TIP_W;
  const tipY =
    cy - TIP_H / 2 < 4
      ? 4
      : cy + TIP_H / 2 > viewH - 4
        ? viewH - TIP_H - 4
        : cy - TIP_H / 2;
  return { tipX, tipY };
}

/** Rough SVG text wrap for the hover tip body. */
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

interface RouterLaneGraphProps {
  policyId: PolicyId;
  evaluation: PromptEvaluation | null;
  /** Denser lanes for constrained slots (e.g. expanded table rows). */
  compact?: boolean;
}

export function RouterLaneGraph({
  policyId,
  evaluation,
  compact = false,
}: RouterLaneGraphProps) {
  const uid = useId().replace(/:/g, '');
  const idle = !evaluation;
  const [hovered, setHovered] = useState<ActiveNode | null>(null);
  const [pinned, setPinned] = useState<ActiveNode | null>(null);

  const topPad = compact ? TOP_PAD_COMPACT : TOP_PAD;
  const laneGap = compact ? LANE_GAP_COMPACT : LANE_GAP;
  const bottomPad = compact ? BOTTOM_PAD_COMPACT : BOTTOM_PAD;

  const lanes: RouterLaneResult[] = useMemo(
    () => evaluation?.lanes ?? idleLanesForPolicy(policyId),
    [evaluation, policyId],
  );

  const ys = laneYs(lanes.length, topPad, laneGap);
  const starY = ys.length === 1 ? ys[0] : (ys[0] + ys[ys.length - 1]) / 2;
  // Last lane sits at topPad + (n-1)*laneGap — do not add another full lane gap.
  const viewH = Math.max(ys[ys.length - 1] ?? topPad, starY + 20) + bottomPad;
  const routedLane = evaluation?.lanes.find((lane) => lane.isRouted);
  const routedHint = routedLane?.reasons[0]
    ?.replace(/^(policy|security|governance|cost\/quality|router):\s*/i, '')
    .trim();

  const active = pinned ?? hovered;
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
    activeStageIndex >= 0 ? ROUTER_COLUMNS[activeStageIndex] : null;
  const activeCx = activeStageIndex >= 0 ? STAGE_X[activeStageIndex] : 0;
  const activeCy = activeLaneIndex >= 0 ? ys[activeLaneIndex] : 0;
  const activeTip =
    active && activeLane && activeStageMeta
      ? {
          ...tipOrigin(activeCx, activeCy, viewH),
          title: `${activeStageMeta.label} · ${statusLabel(activeLane.nodes[active.stage], idle)}`,
          lines: wrapTipLines(stageReason(activeLane, active.stage, idle)),
        }
      : null;

  function activate(node: ActiveNode) {
    setPinned((current) => (sameNode(current, node) ? null : node));
  }

  function onNodeKeyDown(event: ReactKeyboardEvent, node: ActiveNode) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(node);
    }
  }

  return (
    <Wrap aria-label="Router evaluation">
      <Header>
        <HeaderText>
          <Title>Route</Title>
          {!idle && evaluation?.selectedModel ? (
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
              : routedHint
                ? routedHint.charAt(0).toUpperCase() + routedHint.slice(1)
                : 'Selected route'}
          </Subtitle>
        </HeaderText>
        <Legend aria-label="Router legend">
          {LEGEND.map((item) => (
            <LegendItem key={item.visual}>
              <Swatch $visual={item.visual} aria-hidden />
              {item.label}
            </LegendItem>
          ))}
        </Legend>
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
          <defs>
            {lanes.map((lane, index) => (
              <linearGradient
                key={lane.candidateId}
                id={`${uid}-fade-${index}`}
                gradientUnits="userSpaceOnUse"
                x1={STAGE_X[2]}
                y1={ys[index]}
                x2={STAGE_X[3]}
                y2={ys[index]}
              >
                <stop offset="0%" stopColor="var(--color-text-icon-secondary)" />
                <stop offset="100%" stopColor="var(--color-stroke-border)" />
              </linearGradient>
            ))}
          </defs>

          {ROUTER_COLUMNS.map((col, index) => (
            <StageLabel
              key={col.id}
              x={STAGE_X[index]}
              y={compact ? 10 : 12}
              textAnchor="middle"
            >
              {col.label}
            </StageLabel>
          ))}

          {lanes.map((lane, laneIndex) => {
            const y = ys[laneIndex];
            const stages = ROUTER_COLUMNS.map((col) => col.id);
            const visuals = stages.map((id) =>
              nodeVisual(lane.nodes[id as RouterColumn], idle),
            );
            const modelFill = modelChartColors(lane.model).color;

            const pointsX = [STAR_X, ...STAGE_X];
            const pointsY = [starY, y, y, y, y];

            return (
              <g
                key={lane.candidateId}
                data-testid={`lane-${lane.candidateId}`}
                data-terminal={idle ? 'idle' : lane.isRouted ? 'routed' : 'done'}
              >
                {pointsX.slice(0, -1).map((_, seg) => {
                  const destState = lane.nodes[stages[Math.max(0, seg)] as RouterColumn];
                  const visual = lineVisual(destState, idle);
                  const useFade =
                    !idle &&
                    seg === pointsX.length - 2 &&
                    (lane.nodes.costQuality === 'NotSelected' ||
                      lane.nodes.costQuality === 'Blocked');
                  return (
                    <line
                      key={`${lane.candidateId}-seg-${seg}`}
                      x1={pointsX[seg]}
                      y1={pointsY[seg]}
                      x2={pointsX[seg + 1]}
                      y2={pointsY[seg + 1]}
                      stroke={
                        useFade
                          ? `url(#${uid}-fade-${laneIndex})`
                          : strokeFor(visual)
                      }
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  );
                })}

                {stages.map((stageId, stageIndex) => {
                  const visual = visuals[stageIndex];
                  const cx = STAGE_X[stageIndex];
                  const node: ActiveNode = {
                    candidateId: lane.candidateId,
                    stage: stageId as RouterColumn,
                  };
                  const isActive = sameNode(active, node);
                  const stageLabel =
                    ROUTER_COLUMNS[stageIndex]?.label ?? String(stageId);
                  const state = lane.nodes[node.stage];
                  const detail = stageReason(lane, node.stage, idle);

                  return (
                    <NodeGroup
                      key={`${lane.candidateId}-${stageId}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      aria-label={`${lane.model}, ${stageLabel}: ${statusLabel(state, idle)}. ${detail}`}
                      onMouseEnter={() => setHovered(node)}
                      onMouseLeave={() =>
                        setHovered((current) => (sameNode(current, node) ? null : current))
                      }
                      onFocus={() => setHovered(node)}
                      onBlur={() =>
                        setHovered((current) => (sameNode(current, node) ? null : current))
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
                      <circle
                        cx={cx}
                        cy={y}
                        r={NODE_R}
                        fill={fillFor(visual)}
                        stroke={
                          visual === 'grey'
                            ? 'var(--color-stroke-border-high)'
                            : isActive
                              ? 'var(--color-surfaces-container)'
                              : 'transparent'
                        }
                        strokeWidth={isActive || visual === 'grey' ? 1.5 : 1}
                      />
                    </NodeGroup>
                  );
                })}

                <ModelLabel x={MODEL_X} y={y + 3.5} $idle={idle} $fill={modelFill}>
                  {lane.model}
                </ModelLabel>
              </g>
            );
          })}

          <Star points={starPoints(STAR_X, starY)} />
          <StarLabel x={STAR_X} y={starY + 20} textAnchor="middle">
            Request
          </StarLabel>

          {activeTip ? (
            <g pointerEvents="none" aria-hidden>
              <TipPanel
                x={activeTip.tipX}
                y={activeTip.tipY}
                width={TIP_W}
                height={TIP_H}
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
                  y={activeTip.tipY + 34 + index * 14}
                >
                  {line}
                </TipBody>
              ))}
            </g>
          ) : null}
        </Svg>
      </Graph>
    </Wrap>
  );
}
