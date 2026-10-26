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

const DAILY_ALERTS = [0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 0];

const CHART_SERIES: StackedBarSeries[] = [
  {
    name: 'Alerts',
    color: '#7586ff',
    emphasisColor: '#6776ee',
    data: DAILY_ALERTS,
  },
];

type RuleKind = 'daily-spend' | 'model-quota';

interface AlertRow {
  id: string;
  time: string;
  timeValue: number;
  ruleKind: RuleKind;
  ruleLabel?: string;
  ruleModel?: string;
  scopeLabel: string;
  scopeModel?: string;
  value: string;
  notified: string;
  status: string;
  statusColor: BadgeColor;
}

const ALERT_ROWS: AlertRow[] = [
  {
    id: 'spend-aug-9',
    time: 'Aug 9, 06:10',
    timeValue: 1,
    ruleKind: 'daily-spend',
    ruleLabel: 'Daily spend above $20,000',
    scopeLabel: 'All providers',
    value: '$20,000 reached',
    notified: 'Email \u00B7 Finance, Platform team',
    status: 'Closed',
    statusColor: 'green',
  },
  {
    id: 'spend-aug-10',
    time: 'Aug 10, 06:05',
    timeValue: 2,
    ruleKind: 'daily-spend',
    ruleLabel: 'Daily spend above $20,000',
    scopeLabel: 'All providers',
    value: '$20,000 reached',
    notified: 'Email \u00B7 Finance, Platform team',
    status: 'Closed',
    statusColor: 'green',
  },
  {
    id: 'quota-80',
    time: 'Aug 10, 09:40',
    timeValue: 3,
    ruleKind: 'model-quota',
    ruleModel: 'Frontier-L',
    ruleLabel: 'quota 80% used',
    scopeLabel: 'Provider A',
    scopeModel: 'Frontier-L',
    value: '14.4B of 18B tokens',
    notified: 'Email \u00B7 Platform team',
    status: 'Closed',
    statusColor: 'green',
  },
  {
    id: 'quota-100',
    time: 'Aug 10, 15:20',
    timeValue: 4,
    ruleKind: 'model-quota',
    ruleModel: 'Frontier-L',
    ruleLabel: 'quota 100% used',
    scopeLabel: 'Provider A',
    scopeModel: 'Frontier-L',
    value: '18B of 18B tokens',
    notified: 'Email \u00B7 Platform team',
    status: 'Closed',
    statusColor: 'destructive',
  },
];

const RULE_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'daily-spend', label: 'Daily spend' },
  { value: 'model-quota', label: 'Model quota' },
];

type SortKey = 'time' | 'rule' | 'scope' | 'value' | 'notified' | 'status';

type SortDir = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortKey; label: string; wide?: boolean }[] = [
  { key: 'time', label: 'Time' },
  { key: 'rule', label: 'Rule', wide: true },
  { key: 'scope', label: 'Scope', wide: true },
  { key: 'value', label: 'Value' },
  { key: 'notified', label: 'Notified', wide: true },
  { key: 'status', label: 'Status' },
];

/** Parse display metrics like "18.57B", "$20,000 reached", "14.4B of 18B tokens". */
function metricValue(raw: string): number {
  const cleaned = raw.replace(/[$,]/g, '').trim();
  const match = cleaned.match(/(-?[\d.]+)\s*([BMK])?/i);
  if (!match) return 0;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return 0;
  const suffix = (match[2] || '').toUpperCase();
  const mult = suffix === 'B' ? 1e9 : suffix === 'M' ? 1e6 : suffix === 'K' ? 1e3 : 1;
  return n * mult;
}

function ruleSortLabel(row: AlertRow): string {
  return [row.ruleModel, row.ruleLabel].filter(Boolean).join(' ');
}

function scopeSortLabel(row: AlertRow): string {
  return [row.scopeLabel, row.scopeModel].filter(Boolean).join(' ');
}

function sortValue(row: AlertRow, key: SortKey): string | number {
  switch (key) {
    case 'time':
      return row.timeValue;
    case 'rule':
      return ruleSortLabel(row);
    case 'scope':
      return scopeSortLabel(row);
    case 'value':
      return metricValue(row.value);
    case 'notified':
      return row.notified;
    case 'status':
      return row.status;
  }
}

function ValueBadge({ children }: { children: string }) {
  return (
    <Badge color="secondary" tone="subtle" dot={false}>
      {children}
    </Badge>
  );
}

/** Model palette is reserved for the four named models only. */
const MODEL_BADGE: Record<string, BadgeColor> = {
  'Frontier-L': 'indigo',
  'Mid-M': 'cyan',
  'Small-S': 'yellow',
  'Open-70B': 'magenta',
};

function ModelBadge({ children }: { children: string }) {
  return (
    <Badge color={MODEL_BADGE[children] ?? 'secondary'} tone="subtle" dot={false}>
      {children}
    </Badge>
  );
}

function formatChartLabel(value: number) {
  return value === 0 ? '' : String(value);
}


export function Alerts() {
  const [range, setRange] = useState<DateRangeValue>({ start: '', end: '' });
  const [rule, setRule] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows = useMemo(() => {
    const filtered = ALERT_ROWS.filter((row) => rule === ALL || row.ruleKind === rule);
    return [...filtered].sort((left, right) => {
      const a = sortValue(left, sortKey);
      const b = sortValue(right, sortKey);
      const cmp =
        typeof a === 'string' && typeof b === 'string'
          ? a.localeCompare(b, undefined, { sensitivity: 'base' })
          : Number(a) - Number(b);
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

  return (
    <>
      <ReportHeader
        title="Alerts"
        description="Every threshold alert that fired"
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
        <MetricCard label="Alerts this month" value="4" caption="Aug 1-11" />
        <MetricCard
          label="Open alerts"
          value="1"
          caption={<ModelBadge>Frontier-L</ModelBadge>}
        />
        <MetricCard label="Alert rules" value="2" caption="daily spend, model quota" />
        <MetricCard label="Quotas set" value="4" caption="one per model" />
      </MetricGrid>
      <ReportPanel title="Alerts by day">
        <StackedBarChart
          categories={CATEGORIES}
          series={CHART_SERIES}
          totals={DAILY_ALERTS}
          formatLabel={formatChartLabel}
          stacked={false}
          showLegend={false}
          barMaxWidth={51}
          yMin={0}
          yMax={4}
          yInterval={1}
          height={200}
          ariaLabel="Alerts by day, August 1 through August 11"
        />
      </ReportPanel>
      <ReportPanel title="Alert history">
        <ReportTable
          aria-label="Alert history"
          $cols={[
            reportCol.compact,
            reportCol.wide,
            reportCol.wide,
            reportCol.metric,
            reportCol.wide,
            reportCol.compact,
          ].join(' ')}
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
              <CompactDataCell>
                <ValueBadge>{row.time}</ValueBadge>
              </CompactDataCell>
              <WideDataCell>
                <BadgeGroup>
                  {row.ruleModel ? <ModelBadge>{row.ruleModel}</ModelBadge> : null}
                  {row.ruleLabel ? <ValueBadge>{row.ruleLabel}</ValueBadge> : null}
                </BadgeGroup>
              </WideDataCell>
              <WideDataCell>
                <BadgeGroup>
                  <ValueBadge>{row.scopeLabel}</ValueBadge>
                  {row.scopeModel ? <ModelBadge>{row.scopeModel}</ModelBadge> : null}
                </BadgeGroup>
              </WideDataCell>
              <CompactDataCell>
                <ValueBadge>{row.value}</ValueBadge>
              </CompactDataCell>
              <WideDataCell>
                <ValueBadge>{row.notified}</ValueBadge>
              </WideDataCell>
              <CompactDataCell>
                <Badge color={row.statusColor} tone="subtle" dot={false}>
                  {row.status}
                </Badge>
              </CompactDataCell>
            </DataRow>
          ))}
        </ReportTable>
      </ReportPanel>
    </>
  );
}
