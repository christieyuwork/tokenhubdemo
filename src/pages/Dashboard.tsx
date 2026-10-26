import { useMemo, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  DataCell,
  DataRow,
  HeaderCell,
  HeaderRow,
  IconButton,
  Scrollbar,
  type BadgeColor
} from '@cake-admin/cakeand';
import { ReportTable, reportCol } from './ReportPage';
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
import heroImg from '../assets/dashboard/hero.png';
import { DailyBarChart } from '../charts/DailyBarChart';

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

interface ModelRow {
  id: string;
  model: string;
  badge: BadgeColor;
  provider: string;
  cost: string;
  costValue: number;
  share: string;
}

const MODEL_ROWS: ModelRow[] = [
  {
    id: 'frontier-l',
    model: 'Frontier-L',
    badge: 'indigo',
    provider: 'Provider A',
    cost: '$340,000',
    costValue: 340000,
    share: '86%',
  },
  {
    id: 'mid-m',
    model: 'Mid-M',
    badge: 'cyan',
    provider: 'Provider B',
    cost: '$32,000',
    costValue: 32000,
    share: '8%',
  },
  {
    id: 'small-s',
    model: 'Small-S',
    badge: 'yellow',
    provider: 'Provider B',
    cost: '$15,700',
    costValue: 15700,
    share: '4%',
  },
  {
    id: 'open-70b',
    model: 'Open-70B',
    badge: 'magenta',
    provider: 'Self-hosted (AIC)',
    cost: '$6,300',
    costValue: 6300,
    share: '2%',
  },
];

interface MetricDef {
  id: string;
  icon: ReactNode;
  label: string;
  value: string;
  caption: ReactNode;
}

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
  gap: var(--space-300);
  /*
    cake& Scrollbar sizes a display:table wrapper to content.
    width:0 + min-width:100% fills the scrollport without letting
    the metrics row inflate the page past the frame.
  */
  width: 0;
  min-width: 100%;
  max-width: 100%;
  padding: var(--space-500) var(--space-800) var(--space-800);

  @media (max-width: 900px) {
    padding: var(--space-500);
  }
`;

const OverviewCard = styled(Card)`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-width: 0;
`;

const Hero = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-500);
  /*
    Frame hero band is 200px. Not a spacing token.
  */
  min-height: 200px;
  padding: var(--space-500);
  overflow: hidden;

  @media (max-width: 900px) {
    flex-wrap: wrap;
  }

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-end;
    gap: var(--space-400);
  }
`;

const HeroImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
`;

const HeroScrim = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  /*
    Frame: primary → translucent indigo → clear, left to right.
    Stops match Figma; not available as tokens.
  */
  background-image: linear-gradient(
    90deg,
    rgb(48, 73, 235) 0%,
    rgba(48, 73, 235, 0.9) 29.567%,
    rgba(0, 26, 152, 0.8) 59.135%,
    rgba(0, 0, 0, 0) 100%
  );
`;

const HeroCopy = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  justify-content: flex-end;
  min-width: 0;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: var(--color-text-icon-inverse);
  font-size: var(--type-size-hero);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
  letter-spacing: -0.6px;
`;

const HeroSubtitle = styled.p`
  margin: 0;
  color: var(--color-text-icon-inverse);
  font-size: var(--type-size-title);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  letter-spacing: 0.4px;
`;

const HeroActions = styled.div`
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
`;

const MetricsBand = styled.div`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  /*
    Match Cost category landing: generous bottom inset so KPI card shadows
    clear the OverviewCard clip edge.
  */
  padding: var(--space-500) 0 var(--space-700);
`;

const MetricsScroller = styled.div`
  display: flex;
  gap: var(--space-300);
  width: 100%;
  min-width: 0;
  /*
    Vertical padding keeps elevation-2 inside the scrollport (same as Cost).
  */
  padding: var(--space-300) var(--space-500) var(--space-400);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;

  @media (max-width: 720px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow-x: visible;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled(Card)`
  flex: 0 0 200px;
  min-width: 200px;
  /*
    Nested metric cards use 16px corners in the frame (radius-300).
    Outer cake& Card is radius-400.
  */
  border-radius: var(--radius-300);
  box-shadow: var(--elevation-2);

  @media (max-width: 720px) {
    flex: 1 1 auto;
    min-width: 0;
  }
`;

const MetricInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  height: 100%;
  padding: var(--space-500);
`;

const MetricTop = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-height: 0;
`;

const MetricIcon = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--color-text-icon-primary);

  svg {
    width: 24px;
    height: 24px;
  }
`;

const MetricLabel = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  letter-spacing: 0.2px;
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
  letter-spacing: 0.2px;
`;

const ChangePositive = styled.span`
  color: var(--color-success-success);
`;

const METRICS: MetricDef[] = [
  {
    id: 'under-management',
    icon: <CircleDollarSign aria-hidden />,
    label: 'AI Spend Under Management',
    value: '$12.4M',
    caption: (
      <>
        <ChangePositive>↓ 18%</ChangePositive>
        <span>vs. last month</span>
      </>
    ),
  },
  {
    id: 'cost-per-million',
    icon: <SlidersHorizontal aria-hidden />,
    label: 'Cost per 1M tokens',
    value: '$9.91',
    caption: '39.8B tokens',
  },
  {
    id: 'alerts',
    icon: <Bell aria-hidden />,
    label: 'Alerts triggered',
    value: '4',
    caption: '1 still open',
  },
  {
    id: 'spend-month',
    icon: <CircleDollarSign aria-hidden />,
    label: 'Spend this month',
    value: '$394,000',
    caption: 'Aug 1–11 · all models',
  },
  {
    id: 'optimization',
    icon: <SlidersHorizontal aria-hidden />,
    label: 'Optimization Impact',
    value: '36%',
    caption: (
      <>
        <ChangePositive>↑ 12 pp</ChangePositive>
        <span>vs. last month</span>
      </>
    ),
  },
  {
    id: 'idle-gpu',
    icon: <Layers aria-hidden />,
    label: 'Idle GPU hours',
    value: '1,478',
    caption: '8 GPUs · 264 hours each',
  },
];

const Panel = styled(Card)`
  width: 100%;
  max-width: 100%;
  min-width: 0;
`;
const PanelInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  padding: var(--space-500);
`;

const PanelTitle = styled.h2`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const TableFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-200);
`;

const SortableHeaderCell = styled(HeaderCell)`
  cursor: pointer;

  /* Unsorted headers pick up primary on hover — sorted already uses active. */
  &:hover > span {
    color: var(--color-primary-primary);
  }
`;

type SortKey = 'model' | 'provider' | 'cost' | 'share';
type SortDir = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'model', label: 'Model' },
  { key: 'provider', label: 'Provider' },
  { key: 'cost', label: 'Cost' },
  { key: 'share', label: 'Share' },
];

/** Parse display metrics like "86%", "$32,000", "18.57B" into numbers. */
function metricValue(raw: string): number {
  const cleaned = raw.replace(/[$,%]/g, '').trim();
  const match = cleaned.match(/^(-?[\d.]+)\s*([BMK])?$/i);
  if (!match) return Number(cleaned) || 0;
  const n = Number(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  const mult = suffix === 'B' ? 1e9 : suffix === 'M' ? 1e6 : suffix === 'K' ? 1e3 : 1;
  return n * mult;
}

function sortValue(row: ModelRow, key: SortKey): string | number {
  switch (key) {
    case 'model':
      return row.model;
    case 'provider':
      return row.provider;
    case 'cost':
      return row.costValue;
    case 'share':
      return metricValue(row.share);
  }
}

function ValueBadge({ children }: { children: string }) {
  return (
    <Badge color="secondary" tone="subtle" dot={false}>
      {children}
    </Badge>
  );
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>('cost');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const go = (section: string) => () => onNavigate?.(section);

  const rows = useMemo(
    () =>
      [...MODEL_ROWS].sort((left, right) => {
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
        <OverviewCard role="region" aria-label="AI spend overview">
          <Hero>
            <HeroImage src={heroImg} alt="" />
            <HeroScrim />
            <HeroCopy>
              <HeroTitle>Client Name</HeroTitle>
              <HeroSubtitle>AI spend at a glance</HeroSubtitle>
            </HeroCopy>
            <HeroActions>
              <Button
                size="lg"
                intent="secondary"
                endIcon={<ArrowRight aria-hidden />}
                onClick={go('administration')}
              >
                Administration
              </Button>
            </HeroActions>
          </Hero>

          <MetricsBand>
            <MetricsScroller>
              {METRICS.map((metric) => (
                <MetricCard key={metric.id}>
                  <MetricInner>
                    <MetricTop>
                      <MetricIcon>{metric.icon}</MetricIcon>
                      <MetricLabel>{metric.label}</MetricLabel>
                      <MetricValue>{metric.value}</MetricValue>
                    </MetricTop>
                    <MetricCaption>
                      {typeof metric.caption === 'string' ? metric.caption : metric.caption}
                    </MetricCaption>
                  </MetricInner>
                </MetricCard>
              ))}
            </MetricsScroller>
          </MetricsBand>
        </OverviewCard>

        <Panel role="region" aria-label="Daily spend">
          <PanelInner>
            <PanelTitle>Daily spend, month to date ($ thousands)</PanelTitle>
            <DailyBarChart
              categories={CATEGORIES}
              values={DAILY_SPEND}
              colors={BAR_COLORS}
              yMin={0}
              yMax={160}
              yInterval={40}
              height={256}
              ariaLabel="Daily spend in thousands of dollars, August 1 through August 11"
            />
          </PanelInner>
        </Panel>

        <Panel role="region" aria-label="Model cost and share">
          <PanelInner>
            <PanelTitle>Model cost and share</PanelTitle>
            <ReportTable
              aria-label="Model cost and share"
              $cols={[reportCol.wide, reportCol.wide, reportCol.metric, reportCol.compact].join(' ')}
              header={
                <HeaderRow>
                  {SORT_COLUMNS.map(({ key, label }) => {
                    const sorted = sortKey === key;
                    const nextDir = sorted && sortDir === 'desc' ? 'ascending' : 'descending';
                    return (
                      <SortableHeaderCell
                        key={key}
                        active={sorted}
                        aria-sort={sorted ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'none'}
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
                    <Badge color={row.badge} tone="subtle" dot={false}>
                      {row.model}
                    </Badge>
                  </DataCell>
                  <DataCell>
                    <ValueBadge>{row.provider}</ValueBadge>
                  </DataCell>
                  <DataCell>
                    <ValueBadge>{row.cost}</ValueBadge>
                  </DataCell>
                  <DataCell>
                    <ValueBadge>{row.share}</ValueBadge>
                  </DataCell>
                </DataRow>
              ))}
            </ReportTable>
            <TableFooter>
              <Button
                size="lg"
                intent="secondary"
                endIcon={<ArrowRight aria-hidden />}
                onClick={go('cost-by-model')}
              >
                Cost by model
              </Button>
            </TableFooter>
          </PanelInner>
        </Panel>
      </Page>
    </PageScroll>
  );
}
