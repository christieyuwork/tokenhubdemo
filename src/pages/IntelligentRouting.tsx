import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DataRow,
  HeaderRow,
  IconButton,
  type BadgeColor,
} from '@cake-admin/cakeand';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import styled from 'styled-components';
import { StackedBarChart, type StackedBarSeries } from '../charts/StackedBarChart';
import {
  applyPolicyForm,
  PolicyFormModal,
  type PolicyFormValues,
} from '../components/routing/PolicyFormModal';
import { PolicyList } from '../components/routing/PolicyList';
import { PolicySummary } from '../components/routing/PolicySummary';
import { RecentDecisionsTable } from '../components/routing/RecentDecisionsTable';
import { TryRequestModal } from '../components/routing/TryRequestModal';
import {
  aggregatePolicyMetrics,
  decisionsForPolicies,
  HISTORICAL_ROUTES,
  listPolicies,
  POLICY_IMPACT_CATEGORIES,
  POLICY_IMPACT_SERIES,
  POLICY_IMPACT_WEEKLY_TOTALS,
  promptForDecision,
  trafficShareForPolicies,
  type PolicyId,
  type PromptEvaluation,
  type RoutingDecisionRecord,
  type RoutingPolicy,
} from '../data/routingDemo';
import {
  CellBadge,
  CompactDataCell,
  HeaderActionButton,
  HeaderMetaStrong,
  MetricCard,
  MetricGrid,
  ReportFilterDropdown,
  ReportHeader,
  ReportPanel,
  ReportTable,
  SortableHeaderCell,
  WideDataCell,
  reportCol,
} from './ReportPage';

const ALL = 'all';

type SortKey = 'match' | 'model' | 'why';
type SortDir = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortKey; label: string; wide?: boolean }[] = [
  { key: 'match', label: 'Requests that match', wide: true },
  { key: 'model', label: 'Sent to' },
  { key: 'why', label: 'Why', wide: true },
];

const PoliciesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  min-width: 0;
  scroll-margin-top: var(--space-200);
`;

const LatestTeaser = styled.p`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.45;
`;

const LatestMeta = styled.span`
  color: var(--color-text-icon-secondary);
  font-weight: var(--font-weight-medium);
`;

function modelBadgeColor(model: string): BadgeColor {
  if (model.includes('Claude')) return 'indigo';
  if (model.includes('70B')) return 'cyan';
  if (model.includes('405B')) return 'magenta';
  if (model.includes('Qwen')) return 'yellow';
  return 'secondary';
}

function formatChartLabel(value: number) {
  return `${value.toFixed(2)}M`;
}

export interface IntelligentRoutingProps {
  /** When true, scroll to the policies section after mount (Home / legacy CTAs). */
  focusPolicies?: boolean;
}

export function IntelligentRouting({ focusPolicies = false }: IntelligentRoutingProps) {
  const policiesSectionRef = useRef<HTMLDivElement>(null);
  const [policies, setPolicies] = useState<RoutingPolicy[]>(() => listPolicies());
  const [policyFilter, setPolicyFilter] = useState<string>(ALL);
  /** Policy used for detail, edit, and Test a Prompt. */
  const [focusId, setFocusId] = useState<PolicyId>('brightsky-quality');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<PolicyId | null>(null);
  const [tryOpen, setTryOpen] = useState(false);
  const [seedPrompt, setSeedPrompt] = useState<string | undefined>();
  const [createSeed, setCreateSeed] = useState<PolicyFormValues | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('match');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    if (!focusPolicies) return;
    policiesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusPolicies]);

  const policyOptions = useMemo(
    () => [
      { value: ALL, label: 'All' },
      ...policies.map((policy) => ({ value: policy.id, label: policy.name })),
    ],
    [policies],
  );

  const filterIds = useMemo<PolicyId[]>(
    () => (policyFilter === ALL ? [] : [policyFilter as PolicyId]),
    [policyFilter],
  );

  const filteredPolicies = useMemo(() => {
    if (filterIds.length === 0) return policies;
    const allowed = new Set(filterIds);
    return policies.filter((policy) => allowed.has(policy.id));
  }, [filterIds, policies]);

  const focused =
    policies.find((policy) => policy.id === focusId) ??
    filteredPolicies[0] ??
    policies[0];

  const editing = editId ? policies.find((policy) => policy.id === editId) : null;
  const activeInFilter = filteredPolicies.filter((policy) => policy.status === 'Active').length;
  const metrics = useMemo(
    () => aggregatePolicyMetrics(filteredPolicies),
    [filteredPolicies],
  );

  const recentRows = useMemo(() => decisionsForPolicies(filterIds), [filterIds]);
  const latest = recentRows[0];

  const trafficShare = trafficShareForPolicies(filterIds);
  const chartTotals = useMemo(
    () => POLICY_IMPACT_WEEKLY_TOTALS.map((total) => total * trafficShare),
    [trafficShare],
  );
  const chartSeries = useMemo<StackedBarSeries[]>(
    () =>
      POLICY_IMPACT_SERIES.map((item) => ({
        name: item.name,
        color: item.color,
        emphasisColor: item.emphasisColor,
        data: chartTotals.map((total) => total * item.share),
      })),
    [chartTotals],
  );
  const chartYMax = trafficShare >= 0.75 ? 1.5 : trafficShare >= 0.25 ? 0.8 : 0.4;
  const chartYInterval = chartYMax <= 0.4 ? 0.1 : chartYMax <= 0.8 ? 0.2 : 0.5;

  const historicalRows = useMemo(() => {
    return [...HISTORICAL_ROUTES].sort((left, right) => {
      const a = left[sortKey];
      const b = right[sortKey];
      const cmp = a.localeCompare(b, undefined, { sensitivity: 'base' });
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [sortDir, sortKey]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDir('desc');
  }

  function handlePolicyFilterChange(next: string) {
    setPolicyFilter(next);
    if (next !== ALL) setFocusId(next as PolicyId);
  }

  function handleStatusChange(id: string, status: RoutingPolicy['status']) {
    setPolicies((prev) =>
      prev.map((policy) => (policy.id === id ? { ...policy, status } : policy)),
    );
  }

  function openCreate(seed: PolicyFormValues | null = null) {
    setFormMode('create');
    setEditId(null);
    setCreateSeed(seed);
    setFormOpen(true);
  }

  function handleCreateFromTry(values: PolicyFormValues) {
    setTryOpen(false);
    setSeedPrompt(undefined);
    openCreate(values);
  }

  function openEdit(id: string) {
    setFormMode('edit');
    setEditId(id as PolicyId);
    setFormOpen(true);
  }

  function openEditFocused() {
    if (!focused) return;
    openEdit(focused.id);
  }

  function handleSave(values: PolicyFormValues, id?: PolicyId) {
    if (formMode === 'edit' && id) {
      setPolicies((prev) =>
        prev.map((policy) =>
          policy.id === id ? applyPolicyForm(values, policy) : policy,
        ),
      );
      return;
    }

    const created: RoutingPolicy = applyPolicyForm(values, {
      id: `custom-${Date.now()}` as PolicyId,
      name: values.name,
      status: values.status,
      scope: values.scope,
      priorityOrder: values.priorityOrder,
      eligibleModels: [],
      eligibleHosting: [],
      securityRules: [],
      governanceRules: [],
      qualityFloor: values.qualityFloor,
      costPreference: values.costPreference,
      latencyTarget: values.latencyTarget,
      infrastructureRequirement: values.infrastructureRequirement,
      fallback: values.fallback,
      lastModified: '',
      scenarioId: 'brightsky',
      requestsRouted: '0',
      averageSavings: '—',
      averageSavingsCaption: 'Session-only prototype policy',
      defaultTestRequestId: 'routine',
    });
    setPolicies((prev) =>
      [...prev, created].sort((a, b) => a.priorityOrder - b.priorityOrder),
    );
    setFocusId(created.id);
    setPolicyFilter(created.id);
  }

  function openTestPrompt(prompt?: string) {
    setSeedPrompt(prompt);
    setTryOpen(true);
  }

  function handleTryOpenChange(open: boolean) {
    setTryOpen(open);
    if (!open) setSeedPrompt(undefined);
  }

  function syncFocusPolicy(id: PolicyId) {
    setFocusId(id);
    if (policyFilter !== ALL) setPolicyFilter(id);
  }

  function handleEvaluated(result: PromptEvaluation) {
    syncFocusPolicy(result.policyId);
  }

  function handleInspect(row: RoutingDecisionRecord) {
    syncFocusPolicy(row.policyId);
    openTestPrompt(promptForDecision(row));
  }

  function testPolicy(id: string) {
    syncFocusPolicy(id as PolicyId);
    openTestPrompt();
  }

  const tryPolicyId = (focused?.id ?? 'brightsky-quality') as PolicyId;
  const showingAll = policyFilter === ALL;
  const chartNote = showingAll
    ? 'Weekly request volume by selected model across all policies.'
    : 'Weekly request volume by selected model for the filtered policy.';

  return (
    <>
      <ReportHeader
        title="Intelligent routing"
        description="Filter by policy to scope health below. Manage constraints in the policies section, or Test a Prompt anytime."
        filters={
          <ReportFilterDropdown
            label="Policy"
            options={policyOptions}
            value={policyFilter}
            onValueChange={handlePolicyFilterChange}
          />
        }
        meta={
          !showingAll && focused ? (
            <PolicySummary policy={focused} onEdit={openEditFocused} />
          ) : (
            <>
              <HeaderMetaStrong>All policies</HeaderMetaStrong>
              <span>·</span>
              <span>{metrics.scopeCaption}</span>
              <span>·</span>
              <span>
                Routed <HeaderMetaStrong>{metrics.requestsRouted}</HeaderMetaStrong>
              </span>
              <span>·</span>
              <span>
                Avg savings <HeaderMetaStrong>{metrics.averageSavings}</HeaderMetaStrong>
              </span>
            </>
          )
        }
        actions={
          <>
            <HeaderActionButton
              startIcon={<Plus size={16} aria-hidden />}
              onClick={() => openCreate()}
            >
              Create policy
            </HeaderActionButton>
            <HeaderActionButton onClick={() => openTestPrompt()}>
              Test a Prompt
            </HeaderActionButton>
          </>
        }
      />

      <MetricGrid>
        <MetricCard
          label="Requests routed"
          value={metrics.requestsRouted}
          caption={metrics.scopeCaption}
        />
        <MetricCard
          label="Average savings"
          value={metrics.averageSavings}
          caption={metrics.averageSavingsCaption}
        />
        <MetricCard
          label="Policies in view"
          value={String(filteredPolicies.length)}
          caption={`${activeInFilter} active`}
        />
        <MetricCard
          label="Evaluation order"
          value="Security first"
          caption="Then governance · then cost / quality"
        />
      </MetricGrid>

      {latest ? (
        <ReportPanel title="Latest selected route">
          <LatestTeaser>
            {latest.selectedModel} · {latest.hosting}
            <LatestMeta>
              {' '}
              · {latest.routingReason} · {latest.timestamp}
            </LatestMeta>
          </LatestTeaser>
        </ReportPanel>
      ) : null}

      <ReportPanel title="Where traffic goes" note={chartNote}>
        <StackedBarChart
          categories={POLICY_IMPACT_CATEGORIES}
          series={chartSeries}
          totals={chartTotals}
          formatLabel={formatChartLabel}
          yMin={0}
          yMax={chartYMax}
          yInterval={chartYInterval}
          height={220}
          showYAxis={false}
          ariaLabel="Requests by model served in millions over the last four weeks"
        />
      </ReportPanel>

      <ReportPanel
        title="Recent routing decisions"
        note={
          showingAll
            ? 'Operational pulse across all policies. Inspect opens Test a Prompt for that scenario.'
            : 'Operational pulse for the filtered policy. Inspect opens Test a Prompt for that scenario.'
        }
      >
        <RecentDecisionsTable rows={recentRows} onInspect={handleInspect} />
      </ReportPanel>

      <PoliciesSection
        id="routing-policies"
        ref={policiesSectionRef}
        aria-label="Routing policies"
      >
        <ReportPanel
          title="Routing policies"
          note="Priority runs top-down. Expand a policy for constraints and fallbacks, or Test a Prompt from the card."
        >
          <PolicyList
            policies={policies}
            onEdit={openEdit}
            onTest={testPolicy}
            onStatusChange={handleStatusChange}
          />
        </ReportPanel>

        <ReportPanel title="Historical routing catalog">
          <ReportTable
            aria-label="Historical routing catalog"
            $cols={[reportCol.widePlus, reportCol.compact, reportCol.widePlus].join(' ')}
            header={
              <HeaderRow>
                {SORT_COLUMNS.map(({ key, label, wide }) => {
                  const sorted = sortKey === key;
                  const nextDir = sorted && sortDir === 'desc' ? 'ascending' : 'descending';
                  return (
                    <SortableHeaderCell
                      key={key}
                      $wide={wide}
                      active={sorted}
                      aria-sort={
                        sorted
                          ? sortDir === 'desc'
                            ? 'descending'
                            : 'ascending'
                          : 'none'
                      }
                      onClick={() => handleSort(key)}
                      actions={
                        sorted ? (
                          <IconButton
                            size="xs"
                            variant="tonal"
                            label={`Sort ${label} ${nextDir}`}
                            icon={sortDir === 'asc' ? <ArrowUp /> : <ArrowDown />}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSort(key);
                            }}
                          />
                        ) : undefined
                      }
                    >
                      {label}
                    </SortableHeaderCell>
                  );
                })}
              </HeaderRow>
            }
          >
            {historicalRows.map((row) => (
              <DataRow key={row.id} selectable={false}>
                <WideDataCell>
                  <CellBadge color="secondary" tone="subtle" dot={false}>
                    {row.match}
                  </CellBadge>
                </WideDataCell>
                <CompactDataCell>
                  <CellBadge color={modelBadgeColor(row.model)} tone="subtle" dot={false}>
                    {row.model}
                  </CellBadge>
                </CompactDataCell>
                <WideDataCell>
                  <CellBadge color="secondary" tone="subtle" dot={false}>
                    {row.why}
                  </CellBadge>
                </WideDataCell>
              </DataRow>
            ))}
          </ReportTable>
        </ReportPanel>
      </PoliciesSection>

      <PolicyFormModal
        open={formOpen}
        mode={formMode}
        policy={editing}
        seedValues={formMode === 'create' ? createSeed : null}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setCreateSeed(null);
        }}
        onSave={handleSave}
      />

      <TryRequestModal
        open={tryOpen}
        onOpenChange={handleTryOpenChange}
        policyId={tryPolicyId}
        seedPrompt={seedPrompt}
        autoEvaluate={Boolean(seedPrompt)}
        onEvaluated={handleEvaluated}
        onCreatePolicy={handleCreateFromTry}
      />
    </>
  );
}
