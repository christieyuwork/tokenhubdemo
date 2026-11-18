import { useMemo, useState, type ReactNode } from 'react';
import {
  Button,
  Card,
  DataCell,
  DataRow,
  HeaderCell,
  HeaderRow,
  IconButton,
  Scrollbar,
  type BadgeColor,
} from '@cake-admin/cakeand';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  CircleDollarSign,
  Info,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import styled from 'styled-components';
import { DailyBarChart } from '../charts/DailyBarChart';
import {
  brightsky,
  claims,
  codingAgent,
  formatCostPerUnit,
  formatUsd,
  portfolioOptimizedTotal,
  portfolioReductionPercent,
  portfolioStartingTotal,
  superAgent,
} from '../data/scenarioEconomics';
import { CellBadge, CompactTableShell, ReportTable, ValueBadge, reportCol } from './ReportPage';

export interface DashboardProps {
  onNavigate?: (section: string) => void;
}

const CATEGORIES = [
  'Aug 1',
  'Aug 2',
  'Aug 3',
  'Aug 4',
  'Aug 5',
  'Aug 6',
  'Aug 7',
  'Aug 8',
  'Aug 9',
  'Aug 10',
  'Aug 11',
];

const DAILY_SPEND = [9.8, 10.1, 10.0, 9.9, 10.2, 10.0, 9.7, 10.3, 150.4, 153.6, 10.0];

/*
  Figma cycles this palette across days. Not cake& chart tokens.
*/
const BAR_COLORS = ['#7586ff', '#00bbdf', '#e2c600', '#f65396', '#2cc27e', '#fb911c'];

interface WorkloadRow {
  id: string;
  model: string;
  badge: BadgeColor;
  provider: string;
  cost: string;
  costValue: number;
  share: string;
  optimized: string;
}

const WORKLOAD_ROWS: WorkloadRow[] = [
  {
    id: 'super-agent',
    model: superAgent.name,
    badge: 'indigo',
    provider: 'Public cloud + H200',
    cost: formatUsd(superAgent.starting.totalCost),
    costValue: superAgent.starting.totalCost,
    share: '52%',
    optimized: formatUsd(superAgent.optimized.totalCost),
  },
  {
    id: 'brightsky',
    model: brightsky.name,
    badge: 'cyan',
    provider: 'Public cloud + H100',
    cost: formatUsd(brightsky.starting.totalCost),
    costValue: brightsky.starting.totalCost,
    share: '21%',
    optimized: formatUsd(brightsky.optimized.totalCost),
  },
  {
    id: 'claims',
    model: claims.name,
    badge: 'magenta',
    provider: 'Public cloud + H200',
    cost: formatUsd(claims.starting.totalCost),
    costValue: claims.starting.totalCost,
    share: '14%',
    optimized: formatUsd(claims.optimized.totalCost),
  },
  {
    id: 'coding-agent',
    model: codingAgent.name,
    badge: 'yellow',
    provider: 'Public cloud + ThinkStation PGX',
    cost: formatUsd(codingAgent.starting.totalCost),
    costValue: codingAgent.starting.totalCost,
    share: '13%',
    optimized: formatUsd(codingAgent.optimized.totalCost),
  },
];

interface MetricDef {
  id: string;
  icon: ReactNode;
  label: string;
  value: string;
  caption: ReactNode;
}

const ChangePositive = styled.span`
  color: var(--color-success-success);
`;

const portfolioSavings = portfolioStartingTotal - portfolioOptimizedTotal;

const METRICS: MetricDef[] = [
  {
    id: 'under-management',
    icon: <CircleDollarSign aria-hidden />,
    label: 'Spend under management',
    value: formatUsd(portfolioStartingTotal),
    caption: (
      <>
        <ChangePositive>↓ 18%</ChangePositive>
        <span>vs. last month</span>
      </>
    ),
  },
  {
    id: 'optimized',
    icon: <SlidersHorizontal aria-hidden />,
    label: 'Optimized portfolio',
    value: formatUsd(portfolioOptimizedTotal),
    caption: `${formatUsd(portfolioSavings)} addressable · ${portfolioReductionPercent}%`,
  },
  {
    id: 'cost-per-chat',
    icon: <CircleDollarSign aria-hidden />,
    label: 'Cost / chat',
    value: formatCostPerUnit(brightsky.starting.costPerUnit),
    caption: `Starting · optimized ${formatCostPerUnit(brightsky.optimized.costPerUnit)}`,
  },
  {
    id: 'optimization',
    icon: <SlidersHorizontal aria-hidden />,
    label: 'Optimization impact',
    value: `${portfolioReductionPercent}%`,
    caption: (
      <>
        <ChangePositive>↑ 12 pp</ChangePositive>
        <span>vs. last month</span>
      </>
    ),
  },
  {
    id: 'alerts',
    icon: <Bell aria-hidden />,
    label: 'Open alerts',
    value: '1',
    caption: '4 triggered this period',
  },
  {
    id: 'idle-gpu',
    icon: <Layers aria-hidden />,
    label: 'Idle GPU hours',
    value: '1,478',
    caption: 'H100 / H200 fleet',
  },
];

const PageScroll = styled(Scrollbar)`
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
`;

const Page = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  width: 0;
  min-width: 100%;
  max-width: 100%;
  padding: var(--space-400) var(--space-600) var(--space-600);
  container-type: inline-size;
  container-name: dashboard;

  @media (max-width: 900px) {
    padding: var(--space-400);
  }
`;

const HeaderCard = styled(Card)`
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  background-image: linear-gradient(8deg, rgb(21, 47, 197) 14%, rgb(160, 120, 255) 87%);
`;

const HeaderInner = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-400);
  padding: var(--space-500);
  min-width: 0;

  @container dashboard (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-page);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const HeaderSubtitle = styled.p`
  margin: 0;
  max-width: 40rem;
  color: var(--color-text-icon-on-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-200);
  flex: 0 0 auto;
`;

const MetricGrid = styled.div`
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--space-200);
  width: 100%;
  min-width: 0;

  @container dashboard (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @container dashboard (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @container dashboard (max-width: 420px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const MetricCard = styled(Card)`
  min-width: 0;
`;

const MetricInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  padding: var(--space-300) var(--space-400);
`;

const MetricIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--color-text-icon-secondary);

  svg {
    width: 20px;
    height: 20px;
  }
`;

const MetricLabel = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const MetricValue = styled.p`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const MetricCaption = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-100);
  align-items: center;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

const Panel = styled(Card)`
  width: 100%;
  max-width: 100%;
  min-width: 0;
`;

const PanelInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  padding: var(--space-400);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-300);
  min-width: 0;
`;

const PanelTitle = styled.h2`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const PanelNote = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

const SortableHeaderCell = styled(HeaderCell)`
  cursor: pointer;

  &:hover > span {
    color: var(--color-primary-primary);
  }
`;

type SortKey = 'model' | 'provider' | 'cost' | 'share' | 'optimized';
type SortDir = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'model', label: 'Workload' },
  { key: 'provider', label: 'Hosting' },
  { key: 'cost', label: 'Starting cost' },
  { key: 'optimized', label: 'Optimized' },
  { key: 'share', label: 'Share' },
];

function metricValue(raw: string): number {
  const cleaned = raw.replace(/[$,%]/g, '').trim();
  const match = cleaned.match(/^(-?[\d.]+)\s*([BMK])?$/i);
  if (!match) return Number(cleaned) || 0;
  const n = Number(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  const mult = suffix === 'B' ? 1e9 : suffix === 'M' ? 1e6 : suffix === 'K' ? 1e3 : 1;
  return n * mult;
}

function sortValue(row: WorkloadRow, key: SortKey): string | number {
  switch (key) {
    case 'model':
      return row.model;
    case 'provider':
      return row.provider;
    case 'cost':
      return row.costValue;
    case 'optimized':
      return metricValue(row.optimized);
    case 'share':
      return metricValue(row.share);
  }
}

function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Hello';
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>('cost');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const greeting = greetingForHour(new Date().getHours());
  const go = (section: string) => () => onNavigate?.(section);

  const rows = useMemo(
    () =>
      [...WORKLOAD_ROWS].sort((left, right) => {
        const a = sortValue(left, sortKey);
        const b = sortValue(right, sortKey);
        const cmp =
          typeof a === 'string' && typeof b === 'string'
            ? a.localeCompare(b, undefined, { sensitivity: 'base' })
            : Number(a) - Number(b);
        return sortDir === 'desc' ? -cmp : cmp;
      }),
    [sortDir, sortKey],
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDir('desc');
  }

  return (
    <PageScroll>
      <Page>
        <HeaderCard role="region" aria-label="Dashboard overview">
          <HeaderInner>
            <HeaderCopy>
              <HeaderTitle>{greeting}</HeaderTitle>
              <HeaderSubtitle>
                Portfolio spend, optimization impact, and workload economics at a glance.
              </HeaderSubtitle>
            </HeaderCopy>
            <HeaderActions>
              <Button
                size="md"
                intent="secondary"
                variant="outline"
                endIcon={<ArrowRight aria-hidden />}
                onClick={go('alert-list')}
              >
                Alerts
              </Button>
              <Button
                size="md"
                intent="secondary"
                endIcon={<ArrowRight aria-hidden />}
                onClick={go('cost-by-model')}
              >
                Cost by model
              </Button>
            </HeaderActions>
          </HeaderInner>
        </HeaderCard>

        <MetricGrid role="region" aria-label="Key metrics">
          {METRICS.map((metric) => (
            <MetricCard key={metric.id}>
              <MetricInner>
                <MetricIcon>{metric.icon}</MetricIcon>
                <MetricLabel>{metric.label}</MetricLabel>
                <MetricValue>{metric.value}</MetricValue>
                <MetricCaption>
                  {typeof metric.caption === 'string' ? metric.caption : metric.caption}
                </MetricCaption>
              </MetricInner>
            </MetricCard>
          ))}
        </MetricGrid>

        <Panel role="region" aria-label="Daily spend">
          <PanelInner>
            <PanelHeader>
              <div>
                <PanelTitle>Daily spend</PanelTitle>
                <PanelNote>Month to date · $ thousands</PanelNote>
              </div>
            </PanelHeader>
            <DailyBarChart
              categories={CATEGORIES}
              values={DAILY_SPEND}
              colors={BAR_COLORS}
              yMin={0}
              yMax={160}
              yInterval={40}
              height={220}
              ariaLabel="Daily spend in thousands of dollars, August 1 through August 11"
            />
          </PanelInner>
        </Panel>

        <Panel role="region" aria-label="Workload cost and share">
          <PanelInner>
            <PanelHeader>
              <div>
                <PanelTitle>Workload cost and share</PanelTitle>
                <PanelNote>
                  Starting vs optimized monthly cost · Quality inspection, Super agent, Claims,
                  Coding
                </PanelNote>
              </div>
              <Button
                size="sm"
                intent="secondary"
                variant="outline"
                endIcon={<ArrowRight aria-hidden />}
                onClick={go('cost-by-model')}
              >
                Cost by model
              </Button>
            </PanelHeader>
            <CompactTableShell>
              <ReportTable
                aria-label="Workload cost and share"
                $cols={[
                  reportCol.wide,
                  reportCol.wide,
                  reportCol.metric,
                  reportCol.metric,
                  reportCol.compact,
                ].join(' ')}
                header={
                  <HeaderRow>
                    {SORT_COLUMNS.map(({ key, label }) => {
                      const sorted = sortKey === key;
                      const nextDir = sorted && sortDir === 'desc' ? 'ascending' : 'descending';
                      return (
                        <SortableHeaderCell
                          key={key}
                          active={sorted}
                          aria-sort={
                            sorted ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'none'
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
                {rows.map((row) => (
                  <DataRow
                    key={row.id}
                    selectable={false}
                    action={
                      <IconButton
                        size="sm"
                        variant="ghost"
                        intent="secondary"
                        label={`Details for ${row.model}`}
                        icon={<Info />}
                      />
                    }
                  >
                    <DataCell>
                      <CellBadge color={row.badge} tone="subtle" dot={false}>
                        {row.model}
                      </CellBadge>
                    </DataCell>
                    <DataCell>
                      <ValueBadge>{row.provider}</ValueBadge>
                    </DataCell>
                    <DataCell>
                      <ValueBadge>{row.cost}</ValueBadge>
                    </DataCell>
                    <DataCell>
                      <ValueBadge>{row.optimized}</ValueBadge>
                    </DataCell>
                    <DataCell>
                      <ValueBadge>{row.share}</ValueBadge>
                    </DataCell>
                  </DataRow>
                ))}
              </ReportTable>
            </CompactTableShell>
          </PanelInner>
        </Panel>
      </Page>
    </PageScroll>
  );
}
