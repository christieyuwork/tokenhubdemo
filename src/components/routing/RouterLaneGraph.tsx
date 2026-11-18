import { useId, useMemo } from 'react';
import styled from 'styled-components';
import {
  ROUTER_COLUMNS,
  idleLanesForPolicy,
  type LaneNodeState,
  type PolicyId,
  type PromptEvaluation,
  type RouterColumn,
  type RouterLaneResult,
} from '../../data/routingDemo';

const STAGE_X = [220, 360, 500, 640] as const;
const STAR_X = 36;
const MODEL_X = 668;
const VIEW_W = 920;
const LANE_GAP = 56;
const TOP_PAD = 28;
/** Clearance under the last lane for model label / star caption. */
const BOTTOM_PAD = 16;

type NodeVisual = 'idle' | 'pass' | 'green' | 'red' | 'grey';

const Wrap = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-150);
  min-width: 0;
`;

const Header = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-100) var(--space-200);
`;

const HeaderText = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-100) var(--space-200);
  min-width: 0;
`;

const Title = styled.h3`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subject);
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

const Graph = styled.div`
  min-width: 0;
`;

const Svg = styled.svg`
  display: block;
  width: 100%;
  height: auto;
`;

const StageLabel = styled.text`
  fill: var(--color-text-icon-secondary);
  font-size: 12px;
  font-weight: 600;
`;

const Star = styled.polygon`
  fill: var(--color-primary-primary);
`;

const StarLabel = styled.text`
  fill: var(--color-text-icon-secondary);
  font-size: 12px;
  font-weight: 600;
`;

const ModelLabel = styled.text<{ $idle?: boolean; $routed?: boolean }>`
  fill: ${({ $idle, $routed }) => {
    if ($idle) return 'var(--color-text-icon-placeholder)';
    if ($routed) return 'var(--color-primary-primary)';
    return 'var(--color-text-icon-primary)';
  }};
  font-size: 13px;
  font-weight: ${({ $idle }) => ($idle ? 600 : 700)};
`;

const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  gap: var(--space-100) var(--space-200);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const LegendItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: var(--space-075);
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

/** Incoming line uses pass while the request is still alive; idle/grey after a stop. */
function lineVisual(dest: LaneNodeState, idle: boolean): NodeVisual {
  if (idle) return 'idle';
  if (dest === 'NotSelected') return 'pass';
  if (dest === 'Eligible' || dest === 'Routed' || dest === 'Blocked') return 'pass';
  return 'idle';
}

function starPoints(cx: number, cy: number, outer = 13, inner = 5.5): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    points.push(`${(cx + Math.cos(angle) * r).toFixed(2)},${(cy + Math.sin(angle) * r).toFixed(2)}`);
  }
  return points.join(' ');
}

function laneYs(count: number): number[] {
  if (count <= 0) return [TOP_PAD];
  return Array.from({ length: count }, (_, i) => TOP_PAD + i * LANE_GAP);
}

interface RouterLaneGraphProps {
  policyId: PolicyId;
  evaluation: PromptEvaluation | null;
}

export function RouterLaneGraph({ policyId, evaluation }: RouterLaneGraphProps) {
  const uid = useId().replace(/:/g, '');
  const idle = !evaluation;
  const lanes: RouterLaneResult[] = useMemo(
    () => evaluation?.lanes ?? idleLanesForPolicy(policyId),
    [evaluation, policyId],
  );

  const ys = laneYs(lanes.length);
  const starY = ys.length === 1 ? ys[0] : (ys[0] + ys[ys.length - 1]) / 2;
  // Last lane sits at TOP_PAD + (n-1)*LANE_GAP — do not add another full LANE_GAP.
  const viewH = Math.max(ys[ys.length - 1] ?? TOP_PAD, starY + 28) + BOTTOM_PAD;
  const routedLane = evaluation?.lanes.find((lane) => lane.isRouted);
  const routedHint = routedLane?.reasons[0]
    ?.replace(/^(policy|security|governance|cost\/quality|router):\s*/i, '')
    .trim();

  return (
    <Wrap aria-label="Router evaluation">
      <Header>
        <HeaderText>
          <Title>Route</Title>
          <Subtitle>
            {idle
              ? 'Try a request to light the lanes.'
              : routedHint
                ? `${evaluation?.selectedModel ?? 'Selected'} · ${routedHint.charAt(0).toUpperCase()}${routedHint.slice(1)}`
                : `Routed to ${evaluation?.selectedModel ?? 'selected model'}`}
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
              y={16}
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
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                  );
                })}

                {stages.map((stageId, stageIndex) => {
                  const visual = visuals[stageIndex];
                  return (
                    <circle
                      key={`${lane.candidateId}-${stageId}`}
                      cx={STAGE_X[stageIndex]}
                      cy={y}
                      r={4.5}
                      fill={fillFor(visual)}
                      stroke={
                        visual === 'grey'
                          ? 'var(--color-stroke-border-high)'
                          : 'transparent'
                      }
                      strokeWidth={1}
                    >
                      <title>{`${lane.model} · ${ROUTER_COLUMNS[stageIndex].label}: ${idle ? 'Idle' : lane.nodes[stageId]}`}</title>
                    </circle>
                  );
                })}

                <ModelLabel
                  x={MODEL_X}
                  y={y + 4}
                  $idle={idle}
                  $routed={lane.isRouted}
                >
                  {lane.model}
                </ModelLabel>
              </g>
            );
          })}

          <Star points={starPoints(STAR_X, starY)} />
          <StarLabel x={STAR_X} y={starY + 28} textAnchor="middle">
            Request
          </StarLabel>
        </Svg>
      </Graph>
    </Wrap>
  );
}
