import styled from 'styled-components';
import { formatCostPerUnit } from '../../data/scenarioEconomics';
import type { CandidateRoute, TestRequest } from '../../data/routingDemo';
import { routeSummary } from '../../data/routingDemo';
import { ReportPanel } from '../../pages/ReportPage';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-200) var(--space-300);

  @container report-content (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-025);
  min-width: 0;
`;

const Label = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const Value = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const Explanation = styled.p`
  margin: var(--space-300) 0 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.45;
`;

const Exclusion = styled.p`
  margin: var(--space-150) 0 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.4;
`;

const Crumb = styled.p`
  margin: var(--space-200) 0 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-200);
  margin-top: var(--space-300);

  @container report-content (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

interface RouteOutcomeProps {
  selected: CandidateRoute;
  request: TestRequest;
  evaluatedCount: number;
  excludedCount: number;
}

export function RouteOutcome({
  selected,
  request,
  evaluatedCount,
  excludedCount,
}: RouteOutcomeProps) {
  return (
    <ReportPanel title="Routing decision">
      <Grid>
        <Field>
          <Label>Selected model</Label>
          <Value>{selected.model}</Value>
        </Field>
        <Field>
          <Label>Hosting environment</Label>
          <Value>{selected.hosting}</Value>
        </Field>
        <Field>
          <Label>Runs on</Label>
          <Value>{request.runsOn}</Value>
        </Field>
        <Field>
          <Label>Routing reason</Label>
          <Value>{request.decision}</Value>
        </Field>
      </Grid>

      <Explanation>{request.explanation(selected)}</Explanation>
      <Exclusion>{request.exclusionExplanation(selected)}</Exclusion>
      <Crumb>{routeSummary(selected, request)}</Crumb>

      <Stats>
        <Field>
          <Label>Models evaluated</Label>
          <Value>{evaluatedCount}</Value>
        </Field>
        <Field>
          <Label>Routes excluded</Label>
          <Value>{excludedCount}</Value>
        </Field>
        <Field>
          <Label>Est. cost / request</Label>
          <Value>{formatCostPerUnit(selected.costPerRequest)}</Value>
        </Field>
        <Field>
          <Label>Est. latency</Label>
          <Value>{selected.latencyMs} ms</Value>
        </Field>
        <Field>
          <Label>Quality threshold</Label>
          <Value>≥ {request.qualityFloor}</Value>
        </Field>
        <Field>
          <Label>vs previous route</Label>
          <Value>
            {formatCostPerUnit(request.previousRoute.costPerUnit)} →{' '}
            {formatCostPerUnit(selected.costPerRequest)}
          </Value>
        </Field>
      </Stats>
    </ReportPanel>
  );
}
