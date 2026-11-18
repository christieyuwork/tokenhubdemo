import { DataRow, HeaderCell, HeaderRow } from '@cake-admin/cakeand';
import { formatCostPerUnit } from '../../data/scenarioEconomics';
import type { CandidateRoute } from '../../data/routingDemo';
import {
  CellBadge,
  CellBadgeCluster,
  CompactDataCell,
  CompactTableShell,
  ReportTable,
  WideDataCell,
  reportCol,
} from '../../pages/ReportPage';
import { hostingBadgeColor, routingStatusBadgeColor } from './statusBadges';

interface CandidateRoutesTableProps {
  candidates: CandidateRoute[];
  selectedId: string;
}

export function CandidateRoutesTable({
  candidates,
  selectedId,
}: CandidateRoutesTableProps) {
  return (
    <CompactTableShell>
      <ReportTable
        aria-label="Candidate routes"
        $cols={[
          reportCol.wide,
          reportCol.wide,
          reportCol.compact,
          reportCol.compact,
          reportCol.compact,
          reportCol.compact,
          reportCol.compact,
          reportCol.widePlus,
        ].join(' ')}
        header={
          <HeaderRow>
            <HeaderCell>Model</HeaderCell>
            <HeaderCell>Hosting</HeaderCell>
            <HeaderCell>Workload fit</HeaderCell>
            <HeaderCell>Quality</HeaderCell>
            <HeaderCell>Latency</HeaderCell>
            <HeaderCell>Est. cost</HeaderCell>
            <HeaderCell>Security</HeaderCell>
            <HeaderCell>Routing status</HeaderCell>
          </HeaderRow>
        }
      >
        {candidates.map((row) => (
          <DataRow key={row.id} selectable={false}>
            <WideDataCell>
              <CellBadge
                color={row.id === selectedId ? 'green' : 'secondary'}
                tone="subtle"
                dot={false}
              >
                {row.model}
              </CellBadge>
            </WideDataCell>
            <WideDataCell>
              <CellBadge color={hostingBadgeColor(row.hosting)} tone="subtle" dot={false}>
                {row.hosting}
              </CellBadge>
            </WideDataCell>
            <CompactDataCell>{row.workloadFit}</CompactDataCell>
            <CompactDataCell>{row.quality}</CompactDataCell>
            <CompactDataCell>{row.latencyMs} ms</CompactDataCell>
            <CompactDataCell>{formatCostPerUnit(row.costPerRequest)}</CompactDataCell>
            <CompactDataCell>
              <CellBadge
                color={row.securityEligible ? 'green' : 'destructive'}
                tone="subtle"
                dot={false}
              >
                {row.securityEligible ? 'Eligible' : 'Blocked'}
              </CellBadge>
            </CompactDataCell>
            <WideDataCell>
              <CellBadgeCluster>
                <CellBadge color={routingStatusBadgeColor(row.status)} tone="subtle" dot={false}>
                  {row.status}
                </CellBadge>
                {row.exclusionReason && row.status !== 'Selected' ? (
                  <span>· {row.exclusionReason}</span>
                ) : null}
              </CellBadgeCluster>
            </WideDataCell>
          </DataRow>
        ))}
      </ReportTable>
    </CompactTableShell>
  );
}
