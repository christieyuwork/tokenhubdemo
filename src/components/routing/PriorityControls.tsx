import { Badge } from '@cake-admin/cakeand';
import styled from 'styled-components';
import {
  formatCostPerUnit,
  inventoryCostVerdict,
  scenarioById,
  type InventoryCostVerdict,
} from '../../data/scenarioEconomics';
import { getPolicy, type PromptEvaluation } from '../../data/routingDemo';

type ScoreAccent = 'cost-good' | 'cost-bad' | 'quality-good' | 'quality-low' | 'latency';

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
`;

const Rows = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-150);

  @media (max-width: 40rem) {
    grid-template-columns: 1fr;
  }
`;

const ScoreCard = styled.div<{ $accent: ScoreAccent }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-050);
  min-width: 0;
  padding: var(--space-150) var(--space-200);
  border: var(--stroke-100) solid transparent;
  border-left-width: var(--stroke-250);
  border-radius: var(--radius-200);

  ${({ $accent }) => {
    switch ($accent) {
      case 'cost-good':
        return `
          background: var(--color-badge-green-light);
          border-color: var(--color-badge-green-light);
          border-left-color: var(--color-badge-green);
        `;
      case 'cost-bad':
        return `
          background: var(--color-badge-red-light);
          border-color: var(--color-badge-red-light);
          border-left-color: var(--color-error-error);
        `;
      case 'quality-good':
        return `
          background: var(--color-badge-indigo-light);
          border-color: var(--color-badge-indigo-light);
          border-left-color: var(--color-badge-indigo);
        `;
      case 'quality-low':
        return `
          background: var(--color-badge-amber-light);
          border-color: var(--color-badge-amber-light);
          border-left-color: var(--color-badge-amber);
        `;
      case 'latency':
      default:
        return `
          background: var(--color-badge-cyan-light);
          border-color: var(--color-badge-cyan-light);
          border-left-color: var(--color-badge-cyan);
        `;
    }
  }}
`;

const LabelRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-100);
  min-width: 0;
`;

const Label = styled.span<{ $accent: ScoreAccent }>`
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: ${({ $accent }) => {
    switch ($accent) {
      case 'cost-good':
        return 'var(--color-badge-text-icon-on-green-light)';
      case 'cost-bad':
        return 'var(--color-badge-text-icon-on-red-light)';
      case 'quality-good':
        return 'var(--color-badge-text-icon-on-indigo-light)';
      case 'quality-low':
        return 'var(--color-badge-text-icon-on-amber-light)';
      case 'latency':
      default:
        return 'var(--color-badge-text-icon-on-cyan-light)';
    }
  }};
`;

const Score = styled.p`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-title);
  font-weight: var(--font-weight-bold);
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
`;

const Unit = styled.span`
  margin-left: var(--space-050);
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
`;

interface PriorityControlsProps {
  evaluation: PromptEvaluation;
}

function verdictBadge(verdict: InventoryCostVerdict) {
  if (verdict === 'good') {
    return (
      <Badge color="green" tone="subtle" role="status">
        Good
      </Badge>
    );
  }
  return (
    <Badge color="destructive" tone="subtle" role="status">
      Bad
    </Badge>
  );
}

export function PriorityControls({ evaluation }: PriorityControlsProps) {
  const selected =
    evaluation.lanes.find((lane) => lane.isRouted) ??
    evaluation.lanes.find((lane) => lane.candidateId === evaluation.selectedId);

  const policy = getPolicy(evaluation.policyId);
  const scenario = scenarioById(policy.scenarioId);
  const cost = selected?.costPerRequest;
  const quality = selected?.quality;
  const latencyMs = selected?.latencyMs;
  const costLabel = cost === undefined ? '—' : formatCostPerUnit(cost);
  const costVerdict =
    cost === undefined || !scenario ? null : inventoryCostVerdict(cost, scenario);

  const costAccent: ScoreAccent =
    costVerdict === 'bad' ? 'cost-bad' : 'cost-good';
  const qualityAccent: ScoreAccent =
    quality !== undefined && quality < policy.qualityFloor
      ? 'quality-low'
      : 'quality-good';

  return (
    <Stack>
      <Rows>
        <ScoreCard $accent={costAccent}>
          <LabelRow>
            <Label $accent={costAccent}>Cost</Label>
            {costVerdict ? verdictBadge(costVerdict) : null}
          </LabelRow>
          <Score>
            {costLabel}
            {cost !== undefined ? <Unit> / request</Unit> : null}
          </Score>
        </ScoreCard>

        <ScoreCard $accent={qualityAccent}>
          <LabelRow>
            <Label $accent={qualityAccent}>Quality</Label>
            {quality !== undefined && quality < policy.qualityFloor ? (
              <Badge color="amber" tone="subtle" role="status">
                Below floor
              </Badge>
            ) : (
              <Badge color="indigo" tone="subtle" role="status">
                Meets floor
              </Badge>
            )}
          </LabelRow>
          <Score>
            {quality === undefined ? '—' : quality}
            {quality !== undefined ? <Unit> / 100</Unit> : null}
          </Score>
        </ScoreCard>

        <ScoreCard $accent="latency">
          <LabelRow>
            <Label $accent="latency">Latency</Label>
            <Badge color="cyan" tone="subtle" role="status">
              Response
            </Badge>
          </LabelRow>
          <Score>
            {latencyMs === undefined ? '—' : latencyMs}
            {latencyMs !== undefined ? <Unit> ms</Unit> : null}
          </Score>
        </ScoreCard>
      </Rows>
    </Stack>
  );
}
