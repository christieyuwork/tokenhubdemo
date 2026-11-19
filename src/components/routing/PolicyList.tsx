import { useId, useMemo, useState } from 'react';
import { Button, IconButton, Switch } from '@cake-admin/cakeand';
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import styled from 'styled-components';
import type { RoutingPolicy } from '../../data/routingDemo';
import { PolicyDetail } from './PolicyDetail';

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
`;

const Card = styled.li<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  border: var(--stroke-100) solid var(--color-stroke-border);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-canvas);
  border-inline-start: var(--stroke-300) solid
    ${({ $active }) =>
      $active ? 'var(--color-success-success)' : 'var(--color-disabled-disabled)'};
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  padding: var(--space-300) var(--space-400);
  min-width: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-300);
  min-width: 0;
`;

const PriorityCluster = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: row;
  align-items: center;
  gap: var(--space-100);
`;

const PriorityMark = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-025);
  min-width: calc(var(--space-800) + var(--space-100));
  padding: var(--space-150) var(--space-100);
  border-radius: var(--radius-150);
  background: var(--color-surfaces-container);
`;

const PriorityValue = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.1;
`;

const PriorityLabel = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const MoveControls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-050);
`;

const HeaderCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
`;

const Name = styled.h3`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const Scope = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

const StatusToggle = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  margin-inline-start: auto;
  padding-top: var(--space-025);
`;

const KpiStrip = styled.div`
  display: grid;
  /* Fixed short-stat tracks so columns align across every policy card. */
  grid-template-columns: 9.5rem 7.5rem 7.5rem minmax(0, 1fr);
  align-items: baseline;
  column-gap: var(--space-400);
  row-gap: var(--space-100);
  padding: var(--space-150) var(--space-300);
  border-radius: var(--radius-150);
  background: var(--color-surfaces-container);

  @container report-content (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @container report-content (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Kpi = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-100);
  min-width: 0;
`;

const KpiLabel = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  white-space: nowrap;
`;

const KpiValue = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-200);
  min-width: 0;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-100);
  margin-inline-start: auto;
`;

const Updated = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  min-width: 0;
`;

const DetailsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  padding: var(--space-300) var(--space-400) var(--space-400);
  border-top: var(--stroke-100) solid var(--color-stroke-border);
  background: var(--color-surfaces-container);
`;

const Chevron = styled(ChevronDown)<{ $open: boolean }>`
  transition: transform 160ms ease;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export type PolicyMoveDirection = 'up' | 'down';

const Empty = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

interface PolicyListProps {
  policies: RoutingPolicy[];
  /** Filters the visible list; move up/down still uses full priority order. */
  filterQuery?: string;
  onStatusChange: (id: string, status: RoutingPolicy['status']) => void;
  onMovePriority: (id: string, direction: PolicyMoveDirection) => void;
}

export function PolicyList({
  policies,
  filterQuery = '',
  onStatusChange,
  onMovePriority,
}: PolicyListProps) {
  const baseId = useId();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const ordered = useMemo(
    () => [...policies].sort((a, b) => a.priorityOrder - b.priorityOrder),
    [policies],
  );

  const visible = useMemo(() => {
    const normalized = filterQuery.trim().toLowerCase();
    if (!normalized) return ordered;
    return ordered.filter((policy) => {
      const haystack = [
        policy.name,
        policy.scope,
        policy.status,
        policy.infrastructureRequirement,
        policy.costPreference,
        policy.latencyTarget,
        policy.fallback,
        ...policy.eligibleModels,
        ...policy.eligibleHosting,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [filterQuery, ordered]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  if (visible.length === 0) {
    return (
      <Empty role="status">
        {filterQuery.trim()
          ? 'No policies match this search.'
          : 'No routing policies yet.'}
      </Empty>
    );
  }

  return (
    <List aria-label="Routing policies">
      {visible.map((policy) => {
        const open = expandedIds.includes(policy.id);
        const detailsId = `${baseId}-${policy.id}-details`;
        const active = policy.status === 'Active';
        const fullIndex = ordered.findIndex((item) => item.id === policy.id);
        const atTop = fullIndex <= 0;
        const atBottom = fullIndex < 0 || fullIndex >= ordered.length - 1;

        return (
          <Card key={policy.id} $active={active}>
            <CardBody>
              <Header>
                <PriorityCluster>
                  <PriorityMark aria-label={`Priority ${policy.priorityOrder}`}>
                    <PriorityValue>{policy.priorityOrder}</PriorityValue>
                    <PriorityLabel>Priority</PriorityLabel>
                  </PriorityMark>
                  <MoveControls>
                    <IconButton
                      size="xs"
                      intent="secondary"
                      variant="tonal"
                      label={`Move ${policy.name} up in priority`}
                      icon={<ArrowUp aria-hidden />}
                      disabled={atTop}
                      onClick={() => onMovePriority(policy.id, 'up')}
                    />
                    <IconButton
                      size="xs"
                      intent="secondary"
                      variant="tonal"
                      label={`Move ${policy.name} down in priority`}
                      icon={<ArrowDown aria-hidden />}
                      disabled={atBottom}
                      onClick={() => onMovePriority(policy.id, 'down')}
                    />
                  </MoveControls>
                </PriorityCluster>
                <HeaderCopy>
                  <Name>{policy.name}</Name>
                  <Scope>{policy.scope}</Scope>
                </HeaderCopy>
                <StatusToggle>
                  <Switch
                    label={active ? 'Active' : 'Inactive'}
                    checked={active}
                    onCheckedChange={(checked) =>
                      onStatusChange(policy.id, checked ? 'Active' : 'Inactive')
                    }
                  />
                </StatusToggle>
              </Header>

              <KpiStrip aria-label="Policy metrics">
                <Kpi>
                  <KpiLabel>Requests routed</KpiLabel>
                  <KpiValue>{policy.requestsRouted}</KpiValue>
                </Kpi>
                <Kpi>
                  <KpiLabel>Avg savings</KpiLabel>
                  <KpiValue>{policy.averageSavings}</KpiValue>
                </Kpi>
                <Kpi>
                  <KpiLabel>Quality floor</KpiLabel>
                  <KpiValue>≥ {policy.qualityFloor}</KpiValue>
                </Kpi>
                <Kpi>
                  <KpiLabel>Infrastructure</KpiLabel>
                  <KpiValue>{policy.infrastructureRequirement}</KpiValue>
                </Kpi>
              </KpiStrip>

              <Footer>
                <Updated>Updated {policy.lastModified}</Updated>
                <Actions>
                  <Button
                    size="sm"
                    intent="secondary"
                    variant="ghost"
                    aria-expanded={open}
                    aria-controls={detailsId}
                    endIcon={<Chevron size={16} $open={open} aria-hidden />}
                    onClick={() => toggleExpanded(policy.id)}
                  >
                    {open ? 'Hide details' : 'Details'}
                  </Button>
                </Actions>
              </Footer>
            </CardBody>

            {open ? (
              <DetailsPanel id={detailsId}>
                <PolicyDetail policy={policy} />
              </DetailsPanel>
            ) : null}
          </Card>
        );
      })}
    </List>
  );
}
