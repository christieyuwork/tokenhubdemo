import { Button } from '@cake-admin/cakeand';
import styled from 'styled-components';
import type { RoutingPolicy } from '../../data/routingDemo';
import { CellBadge } from '../../pages/ReportPage';

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-200);
  min-width: 0;
`;

const Meta = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const Strong = styled.span`
  color: var(--color-text-icon-primary);
  font-weight: var(--font-weight-bold);
`;

interface PolicySummaryProps {
  policy: RoutingPolicy;
  onEdit?: () => void;
}

export function PolicySummary({ policy, onEdit }: PolicySummaryProps) {
  return (
    <Wrap aria-label="Active routing policy">
      <CellBadge
        color={policy.status === 'Active' ? 'green' : 'disabled'}
        tone="subtle"
        dot={false}
      >
        {policy.status}
      </CellBadge>
      <Meta>
        <Strong>{policy.name}</Strong>
      </Meta>
      <Meta>·</Meta>
      <Meta>{policy.scope}</Meta>
      <Meta>·</Meta>
      <Meta>
        Routed <Strong>{policy.requestsRouted}</Strong>
      </Meta>
      <Meta>·</Meta>
      <Meta>
        Avg savings <Strong>{policy.averageSavings}</Strong>
      </Meta>
      <Meta>·</Meta>
      <Meta>Updated {policy.lastModified}</Meta>
      {onEdit ? (
        <Button
          size="xs"
          intent="secondary"
          variant="ghost"
          underline={false}
          onClick={onEdit}
        >
          Edit policy
        </Button>
      ) : null}
    </Wrap>
  );
}
