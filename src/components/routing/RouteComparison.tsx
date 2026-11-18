import styled from 'styled-components';
import { formatCostPerUnit, formatUsd } from '../../data/scenarioEconomics';
import type { CandidateRoute, TestRequest } from '../../data/routingDemo';
import { ReportPanel } from '../../pages/ReportPage';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-200);

  @container report-content (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-100);
  padding: var(--space-300);
  border: var(--stroke-100) solid var(--color-stroke-border);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-canvas);
`;

const Eyebrow = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const Title = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const Detail = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.4;
`;

const Savings = styled.p`
  margin: var(--space-200) 0 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

interface RouteComparisonProps {
  request: TestRequest;
  /** When set, TokenOps side reflects the live selected candidate (priority re-rank). */
  selected?: CandidateRoute;
}

export function RouteComparison({ request, selected }: RouteComparisonProps) {
  const prev = request.previousRoute;
  const fallback = request.optimizedRoute;
  const nextModel = selected?.model ?? fallback.model;
  const nextHosting = selected?.hosting ?? fallback.hosting;
  const nextCostPerUnit = selected?.costPerRequest ?? fallback.costPerUnit;
  const reductionPercent = selected
    ? Math.round((1 - nextCostPerUnit / prev.costPerUnit) * 100)
    : fallback.reductionPercent;
  const improvementMultiplier = selected
    ? Number((prev.costPerUnit / Math.max(nextCostPerUnit, 0.0001)).toFixed(1))
    : fallback.improvementMultiplier;

  return (
    <ReportPanel
      title="Previous route compared with TokenOps route"
      note="Full starting cost includes public-cloud tokens plus allocated infrastructure."
    >
      <Grid>
        <Card>
          <Eyebrow>Previous route</Eyebrow>
          <Title>
            {prev.model} · {prev.hosting}
          </Title>
          <Detail>
            {formatUsd(prev.totalCost)} total · {formatCostPerUnit(prev.costPerUnit)} per
            unit
          </Detail>
          <Detail>
            {formatUsd(prev.cloudCost)} cloud + {formatUsd(prev.infrastructureCost)}{' '}
            infrastructure
          </Detail>
        </Card>
        <Card>
          <Eyebrow>TokenOps route</Eyebrow>
          <Title>
            {nextModel} · {nextHosting}
          </Title>
          {selected ? (
            <Detail>
              {formatCostPerUnit(nextCostPerUnit)} per unit · quality {selected.quality} ·{' '}
              {selected.latencyMs} ms
            </Detail>
          ) : (
            <>
              <Detail>
                {formatUsd(fallback.totalCost)} total ·{' '}
                {formatCostPerUnit(fallback.costPerUnit)} per unit
              </Detail>
              <Detail>{fallback.infrastructure}</Detail>
            </>
          )}
        </Card>
      </Grid>
      <Savings>
        {reductionPercent}% reduction · {improvementMultiplier}× improvement · quality
        requirement {request.qualityRequirement} (≥ {request.qualityFloor})
      </Savings>
    </ReportPanel>
  );
}
