import { Fragment, useEffect, useMemo, useState } from 'react';
import { Button, DataRow, HeaderCell, HeaderRow, IconButton } from '@cake-admin/cakeand';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styled from 'styled-components';
import { modelBadgeColor } from '../../data/modelColors';
import { formatCostPerUnit } from '../../data/scenarioEconomics';
import {
  evaluatePrompt,
  getPolicy,
  promptForDecision,
  type RoutingDecisionRecord,
} from '../../data/routingDemo';
import {
  CellBadge,
  CompactDataCell,
  CompactTableShell,
  ReportTable,
  WideDataCell,
  reportCol,
} from '../../pages/ReportPage';
import { RouterLaneGraph } from './RouterLaneGraph';
import { hostingBadgeColor } from './statusBadges';

const ExpandPanel = styled.div<{ $compact?: boolean }>`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${({ $compact }) => ($compact ? 'var(--space-100)' : 'var(--space-150)')};
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: ${({ $compact }) =>
    $compact
      ? 'var(--space-150) var(--space-300) var(--space-150) var(--space-700)'
      : 'var(--space-200) var(--space-300) var(--space-200) var(--space-800)'};
  border-bottom: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-container);
`;

const ExpandTitle = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-150) var(--space-300);
  min-width: 0;
`;

const StoryCopy = styled.p`
  margin: 0;
  flex: 1 1 16rem;
  min-width: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.45;
`;

const GraphSlot = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: ${({ $compact }) => ($compact ? '160px' : '200px')};
  max-height: ${({ $compact }) => ($compact ? '160px' : '200px')};
  padding: var(--space-100) var(--space-150);
  overflow: hidden;
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-canvas);

  & > * {
    flex: 1 1 auto;
    min-height: 0;
  }
`;

/** Keeps the expand control clear of the Status badge. */
const ExpandCell = styled(CompactDataCell)`
  && {
    padding-inline-start: var(--space-200);
    justify-content: flex-end;
  }
`;

interface RecentDecisionsTableProps {
  rows: RoutingDecisionRecord[];
  /** Deep-link from Intelligent routing pulse → open this row expanded. */
  defaultExpandedId?: string | null;
  /** Navigate to Routing decisions (or similar) for the expanded row. */
  onViewDetails?: (row: RoutingDecisionRecord) => void;
  /**
   * Pulse layout for Intelligent routing: fewer columns, no auto-expand,
   * shorter route graph slot.
   */
  compact?: boolean;
}

export function RecentDecisionsTable({
  rows,
  defaultExpandedId = null,
  onViewDetails,
  compact = false,
}: RecentDecisionsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultExpandedId && rows.some((row) => row.id === defaultExpandedId)) {
      setExpandedId(defaultExpandedId);
      return;
    }
    setExpandedId((current) => {
      if (current && rows.some((row) => row.id === current)) return current;
      // Full archive opens the first row; pulse stays collapsed to save height.
      return compact ? null : (rows[0]?.id ?? null);
    });
  }, [compact, defaultExpandedId, rows]);

  const expandedRow = useMemo(
    () => rows.find((row) => row.id === expandedId) ?? null,
    [expandedId, rows],
  );

  const expandedEvaluation = useMemo(
    () =>
      expandedRow
        ? evaluatePrompt(promptForDecision(expandedRow), expandedRow.policyId)
        : null,
    [expandedRow],
  );

  function toggleExpanded(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  /* Status uses metric so “Completed” fits; expand track keeps a clear gap after it. */
  const expandCol =
    'minmax(calc(var(--space-700) + var(--space-200)), calc(var(--space-700) + var(--space-200)))';
  const cols = compact
    ? [reportCol.compact, reportCol.wide, reportCol.widePlus, reportCol.metric, expandCol].join(' ')
    : [
        reportCol.compact,
        reportCol.compact,
        reportCol.wide,
        reportCol.wide,
        reportCol.wide,
        reportCol.wide,
        reportCol.compact,
        reportCol.compact,
        reportCol.metric,
        expandCol,
      ].join(' ');

  return (
    <CompactTableShell>
      <ReportTable
        aria-label="Recent routing decisions"
        $cols={cols}
        header={
          <HeaderRow>
            {compact ? (
              <>
                <HeaderCell>Time</HeaderCell>
                <HeaderCell>Model</HeaderCell>
                <HeaderCell>Reason</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell aria-label="Details" />
              </>
            ) : (
              <>
                <HeaderCell>Time</HeaderCell>
                <HeaderCell>Workload</HeaderCell>
                <HeaderCell>Routing policy</HeaderCell>
                <HeaderCell>Selected model</HeaderCell>
                <HeaderCell>Routing reason</HeaderCell>
                <HeaderCell>Hosting</HeaderCell>
                <HeaderCell>Est. cost</HeaderCell>
                <HeaderCell>Latency</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell aria-label="Details" />
              </>
            )}
          </HeaderRow>
        }
      >
        {rows.map((row) => {
          const expanded = expandedId === row.id;
          const policyName = getPolicy(row.policyId).name;
          return (
            <Fragment key={row.id}>
              <DataRow selectable={false}>
                {compact ? (
                  <>
                    <CompactDataCell>{row.timestamp}</CompactDataCell>
                    <WideDataCell>
                      <CellBadge
                        color={modelBadgeColor(row.selectedModel)}
                        tone="subtle"
                        dot={false}
                      >
                        {row.selectedModel}
                      </CellBadge>
                    </WideDataCell>
                    <WideDataCell>{row.routingReason}</WideDataCell>
                    <CompactDataCell>
                      <CellBadge
                        color={row.status === 'Completed' ? 'green' : 'secondary'}
                        tone="subtle"
                        dot={false}
                      >
                        {row.status}
                      </CellBadge>
                    </CompactDataCell>
                  </>
                ) : (
                  <>
                    <CompactDataCell>{row.timestamp}</CompactDataCell>
                    <CompactDataCell>{row.workload}</CompactDataCell>
                    <WideDataCell>{policyName}</WideDataCell>
                    <WideDataCell>
                      <CellBadge
                        color={modelBadgeColor(row.selectedModel)}
                        tone="subtle"
                        dot={false}
                      >
                        {row.selectedModel}
                      </CellBadge>
                    </WideDataCell>
                    <WideDataCell>{row.routingReason}</WideDataCell>
                    <WideDataCell>
                      <CellBadge color={hostingBadgeColor(row.hosting)} tone="subtle" dot={false}>
                        {row.hosting}
                      </CellBadge>
                    </WideDataCell>
                    <CompactDataCell>{formatCostPerUnit(row.estimatedCost)}</CompactDataCell>
                    <CompactDataCell>{row.latencyMs} ms</CompactDataCell>
                    <CompactDataCell>
                      <CellBadge
                        color={row.status === 'Completed' ? 'green' : 'secondary'}
                        tone="subtle"
                        dot={false}
                      >
                        {row.status}
                      </CellBadge>
                    </CompactDataCell>
                  </>
                )}
                <ExpandCell>
                  <IconButton
                    size="xs"
                    variant="tonal"
                    label={
                      expanded
                        ? `Collapse routing tree for ${row.workload}`
                        : `Expand routing tree for ${row.workload}`
                    }
                    icon={expanded ? <ChevronUp /> : <ChevronDown />}
                    onClick={() => toggleExpanded(row.id)}
                  />
                </ExpandCell>
              </DataRow>
              {expanded ? (
                <ExpandPanel $compact={compact}>
                  <ExpandTitle>
                    <StoryCopy>
                      {row.workload} under {policyName} routed to {row.selectedModel}.
                    </StoryCopy>
                    {onViewDetails ? (
                      <Button
                        type="button"
                        size="sm"
                        intent="secondary"
                        variant="outline"
                        onClick={() => onViewDetails(row)}
                      >
                        View more details
                      </Button>
                    ) : null}
                  </ExpandTitle>
                  <GraphSlot $compact={compact}>
                    <RouterLaneGraph
                      policyId={row.policyId}
                      evaluation={expandedEvaluation}
                      compact
                    />
                  </GraphSlot>
                </ExpandPanel>
              ) : null}
            </Fragment>
          );
        })}
      </ReportTable>
    </CompactTableShell>
  );
}
