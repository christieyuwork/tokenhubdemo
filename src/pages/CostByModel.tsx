import { useMemo, useState } from 'react';
import {
  DataRow,
  DateInput,
  HeaderRow,
  IconButton,
  type BadgeColor,
  type DateRangeValue,
} from '@cake-admin/cakeand';
import { ArrowDown, ArrowUp } from 'lucide-react';
import styled from 'styled-components';
import { StackedBarChart, type StackedBarSeries } from '../charts/StackedBarChart';
import {
  CellBadge,
  CompactDataCell,
  MetricCard,
  MetricGrid,
  ReportHeader,
  ReportPanel,
  ReportTable,
  SortableHeaderCell,
  ValueBadge,
  WideDataCell,
  reportCol,
  ReportFilterDropdown,
} from './ReportPage';

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

const DAILY_TOTALS = [9.8, 10.1, 10.0, 9.9, 10.2, 10.0, 9.7, 10.3, 150.4, 153.6, 10.0];

interface ModelSeries {
  name: string;
  color: string;
  emphasisColor: string;
  share: number;
}

const MODEL_SERIES: ModelSeries[] = [
  { name: 'Claude Sonnet 4.6', color: '#7586ff', emphasisColor: '#6776ee', share: 0.52 },
  { name: 'Llama 3.3 70B', color: '#00bbdf', emphasisColor: '#00aacb', share: 0.18 },
  { name: 'Llama 3.1 405B', color: '#f65396', emphasisColor: '#e24c8a', share: 0.22 },
  { name: 'Coding + ThinkStation PGX', color: '#e2c600', emphasisColor: '#d0b600', share: 0.08 },
];

interface ModelRow {
  id: string;
  model: string;
  badge: BadgeColor;
  provider: string;
  inputTokens: string;
  cachedTokens: string;
  outputTokens: string;
  requests: string;
  cost: string;
  costValue: number;
  perMillion: string;
}

const MODEL_ROWS: ModelRow[] = [
  {
    id: 'claude-sonnet',
    model: 'Claude Sonnet 4.6',
    badge: 'indigo',
    provider: 'Public cloud',
    inputTokens: '28.0B',
    cachedTokens: '2.1B',
    outputTokens: '0.80B',
    requests: '1.50M',
    cost: '$780,000',
    costValue: 780000,
    perMillion: '$25.32',
  },
  {
    id: 'llama-405b',
    model: 'Llama 3.1 405B Instruct',
    badge: 'magenta',
    provider: 'Lenovo / in-country',
    inputTokens: '18.0B',
    cachedTokens: '1.2B',
    outputTokens: '0.45B',
    requests: '0.60M',
    cost: '$262,000',
    costValue: 262000,
    perMillion: '$13.30',
  },
  {
    id: 'llama-70b',
    model: 'Llama 3.3 70B Instruct',
    badge: 'cyan',
    provider: 'Lenovo infrastructure',
    inputTokens: '12.0B',
    cachedTokens: '3.4B',
    outputTokens: '0.30B',
    requests: '1.00M',
    cost: '$60,000',
    costValue: 60000,
    perMillion: '$3.82',
  },
  {
    id: 'coding-pgx',
    model: 'Coding agent + ThinkStation PGX',
    badge: 'yellow',
    provider: 'Public cloud + ThinkStation PGX',
    inputTokens: '4.2B',
    cachedTokens: '0.40B',
    outputTokens: '0.20B',
    requests: '0.25M',
    cost: '$154,000',
    costValue: 154000,
    perMillion: '$34.22',
  },
];

const TOTAL = {
  inputTokens: '62.2B',
  cachedTokens: '7.1B',
  outputTokens: '1.75B',
  requests: '3.35M',
  cost: '$1,156,000',
  perMillion: '$16.30',
};

const ALL = 'all';

const GRAIN_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
];

const PROVIDER_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'Public cloud', label: 'Public cloud' },
  { value: 'Lenovo infrastructure', label: 'Lenovo infrastructure' },
  { value: 'Lenovo / in-country', label: 'Lenovo / in-country' },
  { value: 'Public cloud + ThinkStation PGX', label: 'Public cloud + ThinkStation PGX' },
];

const MODEL_OPTIONS = [
  { value: ALL, label: 'All' },
  ...MODEL_SERIES.map((item) => ({ value: item.name, label: item.name })),
];

const TotalLabel = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;


type SortKey =
  | 'model'
  | 'provider'
  | 'inputTokens'
  | 'cachedTokens'
  | 'outputTokens'
  | 'requests'
  | 'cost'
  | 'perMillion';

type SortDir = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortKey; label: string; wide?: boolean }[] = [
  { key: 'model', label: 'Model' },
  { key: 'provider', label: 'Provider', wide: true },
  { key: 'inputTokens', label: 'Input tokens' },
  { key: 'cachedTokens', label: 'Cached tokens' },
  { key: 'outputTokens', label: 'Output tokens' },
  { key: 'requests', label: 'Requests' },
  { key: 'cost', label: 'Cost' },
  { key: 'perMillion', label: 'Cost per 1M tokens' },
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

function sortValue(row: ModelRow, key: SortKey): string | number {
  switch (key) {
    case 'model':
      return row.model;
    case 'provider':
      return row.provider;
    case 'inputTokens':
      return metricValue(row.inputTokens);
    case 'cachedTokens':
      return metricValue(row.cachedTokens);
    case 'outputTokens':
      return metricValue(row.outputTokens);
    case 'requests':
      return metricValue(row.requests);
    case 'cost':
      return row.costValue;
    case 'perMillion':
      return metricValue(row.perMillion);
  }
}

export function CostByModel() {
  const [range, setRange] = useState<DateRangeValue>({ start: '', end: '' });
  const [grain, setGrain] = useState(ALL);
  const [provider, setProvider] = useState(ALL);
  const [model, setModel] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('cost');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows = useMemo(() => {
    const filtered = MODEL_ROWS.filter(
      (row) =>
        (provider === ALL || row.provider === provider) && (model === ALL || row.model === model),
    );
    return [...filtered].sort((left, right) => {
      const a = sortValue(left, sortKey);
      const b = sortValue(right, sortKey);
      const cmp =
        typeof a === 'string' && typeof b === 'string'
          ? a.localeCompare(b, undefined, { sensitivity: 'base' })
          : Number(a) - Number(b);
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [model, provider, sortDir, sortKey]);

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
      MODEL_SERIES.filter((item) => model === ALL || item.name === model).map((item) => ({
        name: item.name,
        color: item.color,
        emphasisColor: item.emphasisColor,
        data: DAILY_TOTALS.map((total) => total * item.share),
      })),
    [model],
  );

  const chartTotals = useMemo(
    () =>
      model === ALL
        ? DAILY_TOTALS
        : DAILY_TOTALS.map((total) => total * (MODEL_SERIES.find((item) => item.name === model)?.share ?? 0)),
    [model],
  );

  return (
    <>
      <ReportHeader
        title="Cost by model"
        description="Tokens and cost for each model."
        filters={
          <>
            <DateInput
              mode="range"
              label="Date range"
              showHelper={false}
              rangeValue={range}
              onRangeValueChange={setRange}
            />
            <ReportFilterDropdown label="Grain" options={GRAIN_OPTIONS} value={grain} onValueChange={setGrain} />
            <ReportFilterDropdown
              label="Provider"
              options={PROVIDER_OPTIONS}
              value={provider}
              onValueChange={setProvider}
            />
            <ReportFilterDropdown label="Model" options={MODEL_OPTIONS} value={model} onValueChange={setModel} />
          </>
        }
      />
      <MetricGrid>
        <MetricCard label="Total cost" value="$1.16M" caption="all workloads" />
        <MetricCard label="Total tokens" value="71.0B" caption="input, cached and output" />
        <MetricCard label="Requests" value="3.35M" caption="all models" />
        <MetricCard
          label="Cost / chat"
          value="$0.24"
          caption="Starting $0.24 · optimized $0.06"
        />
      </MetricGrid>
      <ReportPanel title="Daily cost by model ($ thousands)">
        <StackedBarChart
          categories={CATEGORIES}
          series={chartSeries}
          totals={chartTotals}
          yMin={0}
          yMax={160}
          yInterval={40}
          height={290}
          ariaLabel="Daily cost by model in thousands of dollars, August 1 through August 11"
        />
      </ReportPanel>
      <ReportPanel title="By model">
        <ReportTable
          aria-label="Cost by model"
          $cols={[
            reportCol.compact,
            reportCol.wide,
            reportCol.metric,
            reportCol.metric,
            reportCol.metric,
            reportCol.metric,
            reportCol.metric,
            reportCol.metric,
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
                <CellBadge color={row.badge} tone="subtle" dot={false}>
                  {row.model}
                </CellBadge>
              </CompactDataCell>
              <WideDataCell>
                <ValueBadge>{row.provider}</ValueBadge>
              </WideDataCell>
              <CompactDataCell>
                <ValueBadge>{row.inputTokens}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.cachedTokens}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.outputTokens}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.requests}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.cost}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.perMillion}</ValueBadge>
              </CompactDataCell>
            </DataRow>
          ))}
          <DataRow selectable={false}>
            <CompactDataCell>
              <TotalLabel>Total</TotalLabel>
            </CompactDataCell>
            <CompactDataCell />
            <CompactDataCell>
              <ValueBadge>{TOTAL.inputTokens}</ValueBadge>
            </CompactDataCell>
            <CompactDataCell>
              <ValueBadge>{TOTAL.cachedTokens}</ValueBadge>
            </CompactDataCell>
            <CompactDataCell>
              <ValueBadge>{TOTAL.outputTokens}</ValueBadge>
            </CompactDataCell>
            <CompactDataCell>
              <ValueBadge>{TOTAL.requests}</ValueBadge>
            </CompactDataCell>
            <CompactDataCell>
              <ValueBadge>{TOTAL.cost}</ValueBadge>
            </CompactDataCell>
            <CompactDataCell>
              <ValueBadge>{TOTAL.perMillion}</ValueBadge>
            </CompactDataCell>
          </DataRow>
        </ReportTable>
      </ReportPanel>
    </>
  );
}
