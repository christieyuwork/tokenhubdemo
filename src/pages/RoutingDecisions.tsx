import { useEffect, useMemo, useRef, useState } from 'react';
import { DateInput, TextInput, type DateRangeValue } from '@cake-admin/cakeand';
import { Search } from 'lucide-react';
import styled from 'styled-components';
import { RecentDecisionsTable } from '../components/routing/RecentDecisionsTable';
import {
  getPolicy,
  listPolicies,
  RECENT_DECISIONS,
} from '../data/routingDemo';
import {
  ReportFilterDropdown,
  ReportHeader,
  ReportPanel,
} from './ReportPage';

const ALL = 'all';

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const SearchField = styled.div`
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
`;

const DecisionsAnchor = styled.div`
  scroll-margin-top: var(--space-200);
`;

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}

function optionsWithAll(values: string[]) {
  return [{ value: ALL, label: 'All' }, ...values.map((value) => ({ value, label: value }))];
}

/** Demo timestamps look like "Nov 18, 10:05" — map to a calendar day in 2025. */
function parseDecisionDay(timestamp: string): Date | null {
  const match = timestamp.match(/^([A-Za-z]+)\s+(\d+)/);
  if (!match) return null;
  const month = MONTHS[match[1]];
  if (month === undefined) return null;
  const day = Number(match[2]);
  if (!Number.isFinite(day)) return null;
  return new Date(2025, month, day);
}

/** cake& DateInput range values are MM/DD/YY. */
function parseInputDay(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (!match) return null;
  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  const year = 2000 + Number(match[3]);
  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) return null;
  return new Date(year, month, day);
}

function dayTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function inDateRange(timestamp: string, range: DateRangeValue): boolean {
  if (!range.start.trim() || !range.end.trim()) return true;
  const decision = parseDecisionDay(timestamp);
  const start = parseInputDay(range.start);
  const end = parseInputDay(range.end);
  if (!decision || !start || !end) return true;
  const t = dayTime(decision);
  return t >= dayTime(start) && t <= dayTime(end);
}

export interface RoutingDecisionsProps {
  /** When set (e.g. from Intelligent routing “View more details”), expand that decision. */
  focusDecisionId?: string | null;
}

export function RoutingDecisions({ focusDecisionId = null }: RoutingDecisionsProps) {
  const decisionsRef = useRef<HTMLDivElement>(null);
  const policies = useMemo(() => listPolicies(), []);
  const [query, setQuery] = useState('');
  const [policyFilter, setPolicyFilter] = useState(ALL);
  const [workloadFilter, setWorkloadFilter] = useState(ALL);
  const [modelFilter, setModelFilter] = useState(ALL);
  const [hostingFilter, setHostingFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [range, setRange] = useState<DateRangeValue>({ start: '', end: '' });
  const [expandedDecisionId, setExpandedDecisionId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusDecisionId) return;
    setQuery('');
    setPolicyFilter(ALL);
    setWorkloadFilter(ALL);
    setModelFilter(ALL);
    setHostingFilter(ALL);
    setStatusFilter(ALL);
    setRange({ start: '', end: '' });
    setExpandedDecisionId(focusDecisionId);
    const frame = window.requestAnimationFrame(() => {
      decisionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusDecisionId]);

  const policyOptions = useMemo(
    () => [
      { value: ALL, label: 'All' },
      ...policies.map((policy) => ({ value: policy.id, label: policy.name })),
    ],
    [policies],
  );

  const workloadOptions = useMemo(
    () => optionsWithAll(uniqueSorted(RECENT_DECISIONS.map((row) => row.workload))),
    [],
  );
  const modelOptions = useMemo(
    () => optionsWithAll(uniqueSorted(RECENT_DECISIONS.map((row) => row.selectedModel))),
    [],
  );
  const hostingOptions = useMemo(
    () => optionsWithAll(uniqueSorted(RECENT_DECISIONS.map((row) => row.hosting))),
    [],
  );
  const statusOptions = useMemo(
    () => optionsWithAll(uniqueSorted(RECENT_DECISIONS.map((row) => row.status))),
    [],
  );

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return RECENT_DECISIONS.filter((row) => {
      const policyName = getPolicy(row.policyId).name;
      const matchesQuery =
        normalized.length === 0 ||
        row.workload.toLowerCase().includes(normalized) ||
        row.selectedModel.toLowerCase().includes(normalized) ||
        row.routingReason.toLowerCase().includes(normalized) ||
        policyName.toLowerCase().includes(normalized) ||
        row.hosting.toLowerCase().includes(normalized) ||
        row.status.toLowerCase().includes(normalized);

      const matchesPolicy = policyFilter === ALL || row.policyId === policyFilter;
      const matchesWorkload = workloadFilter === ALL || row.workload === workloadFilter;
      const matchesModel = modelFilter === ALL || row.selectedModel === modelFilter;
      const matchesHosting = hostingFilter === ALL || row.hosting === hostingFilter;
      const matchesStatus = statusFilter === ALL || row.status === statusFilter;
      const matchesRange = inDateRange(row.timestamp, range);

      return (
        matchesQuery &&
        matchesPolicy &&
        matchesWorkload &&
        matchesModel &&
        matchesHosting &&
        matchesStatus &&
        matchesRange
      );
    });
  }, [
    hostingFilter,
    modelFilter,
    policyFilter,
    query,
    range,
    statusFilter,
    workloadFilter,
  ]);

  return (
    <>
      <ReportHeader
        title="Routing decisions"
        description="Search and filter past routing decisions. Expand a row for the decision tree."
        filtersPlacement="below"
        filters={
          <>
            <SearchField>
              <TextInput
                size="sm"
                label="Search"
                placeholder="Workload, model, reason, policy…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                startIcon={<Search size={16} aria-hidden />}
              />
            </SearchField>
            <ReportFilterDropdown
              label="Policy"
              options={policyOptions}
              value={policyFilter}
              onValueChange={setPolicyFilter}
            />
            <ReportFilterDropdown
              label="Workload"
              options={workloadOptions}
              value={workloadFilter}
              onValueChange={setWorkloadFilter}
            />
            <ReportFilterDropdown
              label="Model"
              options={modelOptions}
              value={modelFilter}
              onValueChange={setModelFilter}
            />
            <ReportFilterDropdown
              label="Hosting"
              options={hostingOptions}
              value={hostingFilter}
              onValueChange={setHostingFilter}
            />
            <ReportFilterDropdown
              label="Status"
              options={statusOptions}
              value={statusFilter}
              onValueChange={setStatusFilter}
            />
            <DateInput
              mode="range"
              label="Date range"
              showHelper={false}
              rangeValue={range}
              onRangeValueChange={setRange}
            />
          </>
        }
      />

      <DecisionsAnchor ref={decisionsRef}>
        <ReportPanel
          title="Decisions"
          note={`${filteredRows.length} of ${RECENT_DECISIONS.length} decisions match the current filters. Expand a row to view its routing tree.`}
        >
          <RecentDecisionsTable
            rows={filteredRows}
            defaultExpandedId={expandedDecisionId}
          />
        </ReportPanel>
      </DecisionsAnchor>
    </>
  );
}
