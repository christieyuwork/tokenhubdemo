import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  DataRow,
  HeaderRow,
  IconButton,
} from '@cake-admin/cakeand';
import { ArrowDown, ArrowUp, Sparkles } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { StackedBarChart, type StackedBarSeries } from '../charts/StackedBarChart';
import {
  applyPolicyForm,
  PolicyFormModal,
  type PolicyFormValues,
} from '../components/routing/PolicyFormModal';
import { ConfigSearch } from '../components/config/ConfigPageChrome';
import { InlineIcon } from '../components/LeadIcon';
import { PolicyList } from '../components/routing/PolicyList';
import { PolicySummary } from '../components/routing/PolicySummary';
import { RecentDecisionsTable } from '../components/routing/RecentDecisionsTable';
import { modelBadgeColor } from '../data/modelColors';
import {
  aggregatePolicyMetrics,
  decisionsForPolicies,
  HISTORICAL_ROUTES,
  listPolicies,
  POLICY_IMPACT_CATEGORIES,
  POLICY_IMPACT_SERIES,
  POLICY_IMPACT_WEEKLY_TOTALS,
  trafficShareForPolicies,
  type PolicyId,
  type RoutingPolicy,
} from '../data/routingDemo';
import {
  CellBadge,
  CompactDataCell,
  HeaderActionButton,
  MetricGrid,
  ReportFilterDropdown,
  ReportHeader,
  ReportPanel,
  ReportTable,
  SortableHeaderCell,
  WideDataCell,
  reportCol,
} from './ReportPage';

type CatalogSortKey = 'match' | 'model' | 'why';
type SortDir = 'asc' | 'desc';

const CATALOG_COLUMNS: { key: CatalogSortKey; label: string; wide?: boolean }[] = [
  { key: 'match', label: 'Requests that match', wide: true },
  { key: 'model', label: 'Sent to' },
  { key: 'why', label: 'Why', wide: true },
];

const ALL = 'all';

const PoliciesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  min-width: 0;
  scroll-margin-top: var(--space-200);
`;

const PanelActions = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-200);
  flex: 0 0 auto;
`;

const PolicyPanelActions = styled(PanelActions)`
  /* Keep search + create on one line beside the title/note stack. */
  @container report-content (max-width: 720px) {
    flex-wrap: wrap;
    width: 100%;
    justify-content: stretch;

    & > * {
      flex: 1 1 auto;
    }
  }
`;

const RoutingMetricGrid = styled(MetricGrid)`
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @container report-content (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @container report-content (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const PulseCard = styled(Card)`
  box-sizing: border-box;
  min-width: 0;
`;

const PulseInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  padding: var(--space-300) var(--space-400);
  height: 100%;
`;

const PulseLabel = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const PulseValue = styled.p`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const PulseCaption = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-100);
  margin: var(--space-100) 0 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const PromoAction = styled.div`
  margin-top: auto;
  padding-top: var(--space-200);
`;

const promoSheen = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

/**
 * Matches ReportHeader gradient stops (cake& has no gradient card variant).
 * Visual CTA among the metric tiles — intentionally louder than PulseCard.
 */
const PromoCard = styled(Card)`
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
  background-image: linear-gradient(
    126deg,
    rgb(21, 47, 197) 8%,
    rgb(57, 78, 219) 42%,
    rgb(160, 120, 255) 92%
  );
  background-size: 140% 140%;
  animation: ${promoSheen} 9s ease-in-out infinite;
  box-shadow: var(--elevation-2);
  transition: box-shadow 160ms ease, transform 160ms ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-size: 100% 100%;
  }

  &:hover {
    box-shadow: var(--elevation-3);
    transform: translateY(calc(var(--space-025) * -1));
  }
`;

const PromoInner = styled(PulseInner)`
  position: relative;
  gap: var(--space-100);
`;

const PromoEyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-100);
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const PromoTitle = styled.p`
  margin: 0;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.25;
`;

const PromoCaption = styled.p`
  margin: 0;
  color: var(--color-text-icon-on-primary-disabled);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const PromoButton = styled(Button)`
  && {
    background: var(--color-surfaces-container);
    color: var(--color-primary-primary);
    box-shadow: var(--elevation-1);
  }

  &&:hover {
    background: var(--color-surfaces-on-container-high);
  }
`;

function formatChartLabel(value: number) {
  return `${value.toFixed(2)}M`;
}

function PulseMetric({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: ReactNode;
}) {
  return (
    <PulseCard>
      <PulseInner>
        <PulseLabel>{label}</PulseLabel>
        <PulseValue>{value}</PulseValue>
        <PulseCaption>{caption}</PulseCaption>
      </PulseInner>
    </PulseCard>
  );
}

function PulsePromo({
  label,
  title,
  caption,
  actionLabel,
  onAction,
}: {
  label: string;
  title: string;
  caption: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <PromoCard>
      <PromoInner>
        <PromoEyebrow>
          <InlineIcon>
            <Sparkles aria-hidden />
          </InlineIcon>
          {label}
        </PromoEyebrow>
        <PromoTitle>{title}</PromoTitle>
        <PromoCaption>{caption}</PromoCaption>
        <PromoAction>
          <PromoButton
            type="button"
            size="sm"
            intent="primary"
            startIcon={<Sparkles size={16} aria-hidden />}
            onClick={onAction}
          >
            {actionLabel}
          </PromoButton>
        </PromoAction>
      </PromoInner>
    </PromoCard>
  );
}

export interface IntelligentRoutingProps {
  /** When true, scroll to the policies section after mount (Home / legacy CTAs). */
  focusPolicies?: boolean;
  onNavigate?: (section: string, decisionId?: string) => void;
}

export function IntelligentRouting({
  focusPolicies = false,
  onNavigate,
}: IntelligentRoutingProps) {
  const policiesSectionRef = useRef<HTMLDivElement>(null);
  const [policies, setPolicies] = useState<RoutingPolicy[]>(() => listPolicies());
  const [policyFilter, setPolicyFilter] = useState<string>(ALL);
  /** Policy used for detail and edit. */
  const [focusId, setFocusId] = useState<PolicyId>('brightsky-quality');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<PolicyId | null>(null);
  const [createSeed, setCreateSeed] = useState<PolicyFormValues | null>(null);
  const [catalogSortKey, setCatalogSortKey] = useState<CatalogSortKey>('match');
  const [catalogSortDir, setCatalogSortDir] = useState<SortDir>('asc');
  const [policySearch, setPolicySearch] = useState('');

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
  const inactiveInFilter = filteredPolicies.length - activeInFilter;
  const metrics = useMemo(
    () => aggregatePolicyMetrics(filteredPolicies),
    [filteredPolicies],
  );

  const recentRows = useMemo(
    () => decisionsForPolicies(filterIds).slice(0, 5),
    [filterIds],
  );

  const leadingModel = useMemo(() => {
    const top = POLICY_IMPACT_SERIES.reduce((best, item) =>
      item.share > best.share ? item : best,
    );
    const label = top.name.replace(/\s+\d+%$/, '');
    const percent = Math.round(top.share * 100);
    return { label, percent };
  }, []);

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

  const catalogRows = useMemo(() => {
    return [...HISTORICAL_ROUTES].sort((left, right) => {
      const a = left[catalogSortKey];
      const b = right[catalogSortKey];
      const cmp = a.localeCompare(b, undefined, { sensitivity: 'base' });
      return catalogSortDir === 'desc' ? -cmp : cmp;
    });
  }, [catalogSortDir, catalogSortKey]);

  function handleCatalogSort(key: CatalogSortKey) {
    if (catalogSortKey === key) {
      setCatalogSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setCatalogSortKey(key);
    setCatalogSortDir('asc');
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

  function handleMovePriority(id: string, direction: 'up' | 'down') {
    setPolicies((prev) => {
      const sorted = [...prev].sort((a, b) => a.priorityOrder - b.priorityOrder);
      const index = sorted.findIndex((policy) => policy.id === id);
      if (index < 0) return prev;
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= sorted.length) return prev;

      const next = [...sorted];
      const current = next[index];
      next[index] = next[swapWith];
      next[swapWith] = current;
      return next.map((policy, order) => ({
        ...policy,
        priorityOrder: order + 1,
      }));
    });
  }

  function openCreate(seed: PolicyFormValues | null = null) {
    setFormMode('create');
    setEditId(null);
    setCreateSeed(seed);
    setFormOpen(true);
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

  const showingAll = policyFilter === ALL;
  const chartNote = showingAll
    ? `Leading share: ${leadingModel.label} (${leadingModel.percent}%).`
    : `Filtered policy · leading share: ${leadingModel.label} (${leadingModel.percent}%).`;

  return (
    <>
      <ReportHeader
        title="Intelligent routing"
        description="Filter by policy to scope health below. Manage constraints in Routing policies, or Test a Prompt to see how a request is evaluated."
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
          ) : undefined
        }
      />

      <RoutingMetricGrid>
        <PulseMetric
          label="Requests routed"
          value={metrics.requestsRouted}
          caption={metrics.scopeCaption}
        />
        <PulseMetric
          label="Policies in view"
          value={String(filteredPolicies.length)}
          caption={
            <>
              <Badge color="green" tone="subtle" dot={false}>
                {activeInFilter} active
              </Badge>
              <Badge color="disabled" tone="subtle" dot={false}>
                {inactiveInFilter} inactive
              </Badge>
            </>
          }
        />
        <PulseMetric
          label="Avg savings"
          value={metrics.averageSavings}
          caption={metrics.averageSavingsCaption}
        />
        <PulsePromo
          label="Try routing"
          title="Test a Prompt"
          caption="See how a request is scored and routed."
          actionLabel="Test a Prompt"
          onAction={() => onNavigate?.('prompt-lab')}
        />
      </RoutingMetricGrid>

      <ReportPanel title="Where traffic goes" note={chartNote}>
        <StackedBarChart
          categories={POLICY_IMPACT_CATEGORIES}
          series={chartSeries}
          totals={chartTotals}
          formatLabel={formatChartLabel}
          yMin={0}
          yMax={chartYMax}
          yInterval={chartYInterval}
          height={290}
          showYAxis={false}
          ariaLabel="Requests by model served in millions over the last four weeks"
        />
      </ReportPanel>

      <ReportPanel
        title="Recent routing decisions"
        note="Latest five decisions. Expand a row for the routing tree, or View all for search and filters."
        actions={
          <Button
            type="button"
            size="sm"
            intent="primary"
            onClick={() => onNavigate?.('routing-decisions')}
          >
            View all
          </Button>
        }
      >
        <RecentDecisionsTable
          rows={recentRows}
          compact
          onViewDetails={(row) => onNavigate?.('routing-decisions', row.id)}
        />
      </ReportPanel>

      <PoliciesSection
        id="routing-policies"
        ref={policiesSectionRef}
        aria-label="Routing policies"
      >
        <ReportPanel
          title="Routing policies"
          note="Priority runs top-down — use the arrows to reorder. Expand a policy for constraints and fallbacks."
          actions={
            <PolicyPanelActions>
              <ConfigSearch
                value={policySearch}
                onChange={setPolicySearch}
                placeholder="Search policies"
                label="Search policies"
              />
              <HeaderActionButton type="button" onClick={() => openCreate()}>
                Create a policy
              </HeaderActionButton>
            </PolicyPanelActions>
          }
        >
          <PolicyList
            policies={policies}
            filterQuery={policySearch}
            onStatusChange={handleStatusChange}
            onMovePriority={handleMovePriority}
          />
        </ReportPanel>
      </PoliciesSection>

      <ReportPanel
        title="Historical routing catalog"
        note="Reference patterns for common request types — not individual timed decisions."
      >
        <ReportTable
          aria-label="Historical routing catalog"
          $cols={[reportCol.widePlus, reportCol.compact, reportCol.widePlus].join(' ')}
          header={
            <HeaderRow>
              {CATALOG_COLUMNS.map(({ key, label, wide }) => {
                const sorted = catalogSortKey === key;
                const nextDir = sorted && catalogSortDir === 'desc' ? 'ascending' : 'descending';
                return (
                  <SortableHeaderCell
                    key={key}
                    $wide={wide}
                    active={sorted}
                    aria-sort={
                      sorted
                        ? catalogSortDir === 'desc'
                          ? 'descending'
                          : 'ascending'
                        : 'none'
                    }
                    onClick={() => handleCatalogSort(key)}
                    actions={
                      sorted ? (
                        <IconButton
                          size="xs"
                          variant="tonal"
                          label={`Sort ${label} ${nextDir}`}
                          icon={catalogSortDir === 'asc' ? <ArrowUp /> : <ArrowDown />}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCatalogSort(key);
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
          {catalogRows.map((row) => (
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
    </>
  );
}
