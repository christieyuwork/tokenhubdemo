import { Button, DataRow, HeaderCell, HeaderRow } from '@cake-admin/cakeand';
import { modelBadgeColor } from '../../data/modelColors';
import { formatCostPerUnit } from '../../data/scenarioEconomics';
import { getPolicy, type RoutingDecisionRecord } from '../../data/routingDemo';
import {
  CellBadge,
  CompactDataCell,
  CompactTableShell,
  ReportTable,
  WideDataCell,
  reportCol,
} from '../../pages/ReportPage';
import { hostingBadgeColor } from './statusBadges';

interface RecentDecisionsTableProps {
  rows: RoutingDecisionRecord[];
  onInspect?: (row: RoutingDecisionRecord) => void;
}

export function RecentDecisionsTable({ rows, onInspect }: RecentDecisionsTableProps) {
  return (
    <CompactTableShell>
      <ReportTable
        aria-label="Recent routing decisions"
        $cols={[
          reportCol.compact,
          reportCol.compact,
          reportCol.wide,
          reportCol.wide,
          reportCol.wide,
          reportCol.wide,
          reportCol.compact,
          reportCol.compact,
          reportCol.compact,
          ...(onInspect ? [reportCol.compact] : []),
        ].join(' ')}
        header={
          <HeaderRow>
            <HeaderCell>Timestamp</HeaderCell>
            <HeaderCell>Workload</HeaderCell>
            <HeaderCell>Routing policy</HeaderCell>
            <HeaderCell>Selected model</HeaderCell>
            <HeaderCell>Routing reason</HeaderCell>
            <HeaderCell>Hosting</HeaderCell>
            <HeaderCell>Est. cost</HeaderCell>
            <HeaderCell>Latency</HeaderCell>
            <HeaderCell>Status</HeaderCell>
            {onInspect ? <HeaderCell>Actions</HeaderCell> : null}
          </HeaderRow>
        }
      >
        {rows.map((row) => (
          <DataRow key={row.id} selectable={false}>
            <CompactDataCell>{row.timestamp}</CompactDataCell>
            <CompactDataCell>{row.workload}</CompactDataCell>
            <WideDataCell>{getPolicy(row.policyId).name}</WideDataCell>
            <WideDataCell>
              <CellBadge color={modelBadgeColor(row.selectedModel)} tone="subtle" dot={false}>
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
            {onInspect ? (
              <CompactDataCell>
                <Button
                  size="xs"
                  intent="secondary"
                  variant="ghost"
                  underline={false}
                  onClick={() => onInspect(row)}
                >
                  Inspect
                </Button>
              </CompactDataCell>
            ) : null}
          </DataRow>
        ))}
      </ReportTable>
    </CompactTableShell>
  );
}
