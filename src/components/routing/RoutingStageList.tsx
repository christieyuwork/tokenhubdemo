import styled from 'styled-components';
import type { PolicyStage } from '../../data/routingDemo';
import { CellBadge } from '../../pages/ReportPage';
import { stageBadgeColor } from './statusBadges';

const List = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  border: var(--stroke-100) solid var(--color-stroke-border);
  border-radius: var(--radius-200);
  overflow: hidden;
`;

const Item = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) max-content minmax(0, 2fr);
  gap: var(--space-200);
  align-items: start;
  justify-items: start;
  padding: var(--space-150) var(--space-300);
  border-bottom: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-container);

  &:last-child {
    border-bottom: none;
  }

  @container report-content (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr) max-content;
    grid-template-rows: auto auto;
  }
`;

const Name = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const Explain = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;

  @container report-content (max-width: 720px) {
    grid-column: 1 / -1;
  }
`;

const Eligibility = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
`;

interface RoutingStageListProps {
  stages: PolicyStage[];
}

export function RoutingStageList({ stages }: RoutingStageListProps) {
  return (
    <List aria-label="Routing evaluation stages">
      {stages.map((stage) => (
        <Item key={stage.id}>
          <Name>{stage.name}</Name>
          <CellBadge color={stageBadgeColor(stage.result)} tone="subtle" dot={false}>
            {stage.result}
          </CellBadge>
          <Explain>
            {stage.explanation}
            {stage.affectedEligibility ? (
              <Eligibility> · Changed eligibility</Eligibility>
            ) : null}
          </Explain>
        </Item>
      ))}
    </List>
  );
}
