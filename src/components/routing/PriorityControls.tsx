import { Badge } from '@cake-admin/cakeand';
import styled from 'styled-components';
import {
  formatCostPerUnit,
  inventoryCostVerdict,
  scenarioById,
  type InventoryCostVerdict,
} from '../../data/scenarioEconomics';
import { getPolicy, type PromptEvaluation } from '../../data/routingDemo';

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-150);
`;

const Rows = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-200);

  @media (max-width: 40rem) {
    grid-template-columns: 1fr;
  }
`;

const ScoreCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;
`;

const LabelRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-100);
  min-width: 0;
`;

const Label = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const Score = styled.p`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-title);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
`;

const Unit = styled.span`
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
  const costLabel =
    cost === undefined ? '—' : formatCostPerUnit(cost);
  const costVerdict =
    cost === undefined || !scenario ? null : inventoryCostVerdict(cost, scenario);

  return (
    <Stack>
      <Rows>
        <ScoreCard>
          <LabelRow>
            <Label>Cost</Label>
            {costVerdict ? verdictBadge(costVerdict) : null}
          </LabelRow>
          <Score>
            {costLabel}
            {cost !== undefined ? <Unit> / request</Unit> : null}
          </Score>
        </ScoreCard>

        <ScoreCard>
          <LabelRow>
            <Label>Quality</Label>
          </LabelRow>
          <Score>
            {quality === undefined ? '—' : quality}
            {quality !== undefined ? <Unit> / 100</Unit> : null}
          </Score>
        </ScoreCard>

        <ScoreCard>
          <LabelRow>
            <Label>Latency</Label>
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
