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
import styled from 'styled-components';
import { StackedBarChart, type StackedBarSeries } from '../charts/StackedBarChart';
import {
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
  { name: 'Frontier-L', color: '#7586ff', emphasisColor: '#6776ee', share: 0.875 },
  { name: 'Mid-M', color: '#00bbdf', emphasisColor: '#00aacb', share: 0.08 },
  { name: 'Small-S', color: '#e2c600', emphasisColor: '#d0b600', share: 0.04 },
  { name: 'Open-70B', color: '#f65396', emphasisColor: '#e24c8a', share: 0.005 },
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
    id: 'frontier-l',
    model: 'Frontier-L',
    badge: 'indigo',
    provider: 'Provider A',
    inputTokens: '18.57B',
    cachedTokens: '1.61B',
    outputTokens: '0.50B',
    requests: '9.67M',
    cost: '$340,000',
    costValue: 340000,
    perMillion: '$16.44',
  },
  {
    id: 'mid-m',
    model: 'Mid-M',
    badge: 'cyan',
    provider: 'Provider B',
    inputTokens: '8.74B',
    cachedTokens: '0.76B',
    outputTokens: '0.23B',
    requests: '1.93M',
    cost: '$32,000',
    costValue: 32000,
    perMillion: '$3.29',
  },
  {
    id: 'small-s',
    model: 'Small-S',
    badge: 'yellow',
    provider: 'Provider B',
    inputTokens: '5.26B',
    cachedTokens: '0.46B',
    outputTokens: '0.14B',
    requests: '0.60M',
    cost: '$15,700',
    costValue: 15700,
    perMillion: '$2.68',
  },
  {
    id: 'open-70b',
    model: 'Open-70B',
    badge: 'magenta',
    provider: 'Self-hosted (AIC)',
    inputTokens: '3.42B',
    cachedTokens: '0.00B',
    outputTokens: '0.08B',
    requests: '0.40M',
    cost: '$6,300',
    costValue: 6300,
    perMillion: '$1.80',
  },
];

const TOTAL = {
  inputTokens: '35.99B',
  cachedTokens: '2.83B',
  outputTokens: '0.95B',
  requests: '12.60M',
  cost: '$394,000',
  perMillion: '$9.91',
};

const ALL = 'all';

const GRAIN_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
];

const PROVIDER_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'Provider A', label: 'Provider A' },
  { value: 'Provider B', label: 'Provider B' },
  { value: 'Self-hosted (AIC)', label: 'Self-hosted (AIC)' },
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

function ValueBadge({ children }: { children: string }) {
  return (
    <Badge color="secondary" tone="subtle" dot={false}>
      {children}
    </Badge>
  );
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
        description="Tokens and cost for each model"
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
        <MetricCard label="Total cost" value="$394,000" caption="Aug 1–11 · all models" />
        <MetricCard label="Total tokens" value="39.8B" caption="input, cached and output" />
        <MetricCard label="Requests" value="12.6M" caption="all models" />
        <MetricCard label="Cost per 1M tokens" value="$9.91" caption="blended" />
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
                <Badge color={row.badge} tone="subtle" dot={false}>
                  {row.model}
                </Badge>
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
