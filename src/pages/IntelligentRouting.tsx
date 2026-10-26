import { useMemo, useState } from 'react';
import {
  Badge,
  DataRow,
  DateInput,
  HeaderRow,
  IconButton,
  type BadgeColor,
  type DateRangeValue,
} from '@cake-admin/cakeand';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { StackedBarChart, type StackedBarSeries } from '../charts/StackedBarChart';
import {
  BadgeGroup,
  CompactDataCell,
  MetricCard,
  MetricGrid,
  ReportHeader,
  ReportPanel,
  ReportTable,
  SortableHeaderCell,
  WideDataCell,
  reportCol,
  ReportFilterDropdown,
} from './ReportPage';

const ALL = 'all';

const CATEGORIES = ['Sep 1-7', 'Sep 8-14', 'Sep 15-21', 'Sep 22-28'];

const WEEKLY_TOTALS = [3.46, 3.6, 3.6, 3.6];

interface ModelSeries {
  name: string;
  color: string;
  emphasisColor: string;
  share: number;
}

const MODEL_SERIES: ModelSeries[] = [
  { name: 'Frontier-L 29%', color: '#7586ff', emphasisColor: '#6776ee', share: 0.29 },
  { name: 'Mid-M 50%', color: '#e2c600', emphasisColor: '#d0b600', share: 0.5 },
  { name: 'Open-70B (self-hosted) 21%', color: '#f65396', emphasisColor: '#e24c8a', share: 0.21 },
];

interface RuleRow {
  id: string;
  match: string;
  model: string;
  badge: BadgeColor;
  why: string;
}

const RULE_ROWS: RuleRow[] = [
  {
    id: 'intent-status',
    match: 'Intent check, flight status, bag status',
    model: 'Mid-M',
    badge: 'cyan',
    why: 'Simple lookup',
  },
  {
    id: 'safety',
    match: 'Safety check',
    model: 'Mid-M',
    badge: 'cyan',
    why: 'Classification',
  },
  {
    id: 'fare-history',
    match: 'Steps that repeat the fare rules and chat history',
    model: 'Open-70B',
    badge: 'magenta',
    why: 'Repetitive; reuses cached prompt text',
  },
  {
    id: 'rebooking',
    match: 'Rebooking decisions',
    model: 'Frontier-L',
    badge: 'indigo',
    why: 'Needs the larger model',
  },
];

const RULE_OPTIONS = [
  { value: ALL, label: 'All' },
  ...RULE_ROWS.map((row) => ({ value: row.id, label: row.match })),
];

type SortKey = 'match' | 'model' | 'why';
type SortDir = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortKey; label: string; wide?: boolean }[] = [
  { key: 'match', label: 'Requests that match', wide: true },
  { key: 'model', label: 'Sent to' },
  { key: 'why', label: 'Why', wide: true },
];

/** Parse display metrics like "18.57B", "9.67M", "$340,000", "$16.44" into numbers. */
function metricValue(raw: string): number {
  const cleaned = raw.replace(/[$,]/g, '').trim();
  const match = cleaned.match(/^(-?[\d.]+)\s*([BMK])?$/i);
  if (!match) return Number(cleaned) || 0;
  const n = Number(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  const mult = suffix === 'B' ? 1e9 : suffix === 'M' ? 1e6 : suffix === 'K' ? 1e3 : 1;
  return n * mult;
}

function sortValue(row: RuleRow, key: SortKey): string | number {
  switch (key) {
    case 'match':
      return row.match;
    case 'model':
      return row.model;
    case 'why':
      return row.why;
  }
}

function ValueBadge({ children }: { children: string }) {
  return (
    <Badge color="secondary" tone="subtle" dot={false}>
      {children}
    </Badge>
  );
}

function formatChartLabel(value: number) {
  return `${value.toFixed(2)}M`;
}

export function IntelligentRouting() {
  const [range, setRange] = useState<DateRangeValue>({ start: '', end: '' });
  const [rule, setRule] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('match');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows = useMemo(() => {
    const filtered = RULE_ROWS.filter((row) => rule === ALL || row.id === rule);
    return [...filtered].sort((left, right) => {
      const a = sortValue(left, sortKey);
      const b = sortValue(right, sortKey);
      const cmp =
        typeof a === 'string' && typeof b === 'string'
          ? a.localeCompare(b, undefined, { sensitivity: 'base' })
          : metricValue(String(a)) - metricValue(String(b));
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [rule, sortDir, sortKey]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDir('desc');
  }

  const chartSeries = useMemo<StackedBarSeries[]>(
    () =>
      MODEL_SERIES.map((item) => ({
        name: item.name,
        color: item.color,
        emphasisColor: item.emphasisColor,
        data: WEEKLY_TOTALS.map((total) => total * item.share),
      })),
    [],
  );

  return (
    <>
      <ReportHeader
        title="Intelligent routing"
        description="Which requests went to which model, and the rules that decided it"
        filters={
          <>
            <DateInput
              mode="range"
              label="Date range"
              showHelper={false}
              rangeValue={range}
              onRangeValueChange={setRange}
            />
            <ReportFilterDropdown label="Rule" options={RULE_OPTIONS} value={rule} onValueChange={setRule} />
          </>
        }
      />
      <MetricGrid>
        <MetricCard label="Requests routed" value="14.3M" caption="Sep 1-28 · travel assistant" />
        <MetricCard
          label="Sent to a cheaper model"
          value="71%"
          caption={
            <BadgeGroup>
              <Badge color="cyan" tone="subtle" dot={false}>
                Mid-M
              </Badge>
              <Badge color="magenta" tone="subtle" dot={false}>
                Open-70B
              </Badge>
            </BadgeGroup>
          }
        />
        <MetricCard label="Served by Frontier-L" value="29%" caption="steps that need it" />
        <MetricCard label="Rules active" value="4" caption="" />
      </MetricGrid>
      <ReportPanel title="Requests by model served (millions)">
        <StackedBarChart
          categories={CATEGORIES}
          series={chartSeries}
          totals={WEEKLY_TOTALS}
          formatLabel={formatChartLabel}
          yMin={0}
          yMax={4}
          yInterval={1}
          height={250}
          showYAxis={false}
          ariaLabel="Requests by model served in millions, September 1 through September 28"
        />
      </ReportPanel>
      <ReportPanel title="Routing rules">
        <ReportTable
          aria-label="Routing rules"
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
            <DataRow key={row.id} selectable={false}>
              <WideDataCell>
                <ValueBadge>{row.match}</ValueBadge>
              </WideDataCell>
              <CompactDataCell>
                <Badge color={row.badge} tone="subtle" dot={false}>
                  {row.model}
                </Badge>
              </CompactDataCell>
              <WideDataCell>
                <ValueBadge>{row.why}</ValueBadge>
              </WideDataCell>
            </DataRow>
          ))}
        </ReportTable>
      </ReportPanel>
    </>
  );
}
