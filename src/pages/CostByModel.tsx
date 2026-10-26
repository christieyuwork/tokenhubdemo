import { useMemo, useState } from 'react';
import {
  Badge,
  DataCell,
  DataRow,
  DateInput,
  Dropdown,
  HeaderCell,
  HeaderRow,
  IconButton,
  Table,
  type BadgeColor,
  type DateRangeValue,
} from '@cake-admin/cakeand';
import { ArrowDown, ArrowUp } from 'lucide-react';
import styled from 'styled-components';
import { StackedBarChart, type StackedBarSeries } from '../charts/StackedBarChart';
import { MetricCard, MetricGrid, ReportHeader, ReportPanel } from './ReportPage';

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
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());

  const rows = useMemo(() => {
    const filtered = MODEL_ROWS.filter(
      (row) =>
        (provider === ALL || row.provider === provider) && (model === ALL || row.model === model),
    );
    return [...filtered].sort((left, right) =>
      sort === 'desc' ? right.costValue - left.costValue : left.costValue - right.costValue,
    );
  }, [model, provider, sort]);

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

  function toggleRow(id: string, next: boolean) {
    setSelected((current) => {
      const updated = new Set(current);
      if (next) updated.add(id);
      else updated.delete(id);
      return updated;
    });
  }

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
            <Dropdown label="Grain" options={GRAIN_OPTIONS} value={grain} onValueChange={setGrain} />
            <Dropdown
              label="Provider"
              options={PROVIDER_OPTIONS}
              value={provider}
              onValueChange={setProvider}
            />
            <Dropdown label="Model" options={MODEL_OPTIONS} value={model} onValueChange={setModel} />
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
        <Table aria-label="Cost by model" header={
          <HeaderRow>
            <HeaderCell>Model</HeaderCell>
            <HeaderCell>Provider</HeaderCell>
            <HeaderCell>Input tokens</HeaderCell>
            <HeaderCell>Cached tokens</HeaderCell>
            <HeaderCell>Output tokens</HeaderCell>
            <HeaderCell>Requests</HeaderCell>
            <HeaderCell
              active
              aria-sort={sort === 'desc' ? 'descending' : 'ascending'}
              actions={
                <IconButton
                  size="xs"
                  variant="tonal"
                  label={sort === 'desc' ? 'Sort cost ascending' : 'Sort cost descending'}
                  icon={sort === 'desc' ? <ArrowDown /> : <ArrowUp />}
                  onClick={() => setSort((current) => (current === 'desc' ? 'asc' : 'desc'))}
                />
              }
            >
              Cost
            </HeaderCell>
            <HeaderCell>Cost per 1M tokens</HeaderCell>
          </HeaderRow>
        }>
          {rows.map((row) => (
            <DataRow
              key={row.id}
              selected={selected.has(row.id)}
              onSelectedChange={(next) => toggleRow(row.id, next)}
              checkboxLabel={`Select ${row.model}`}
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
                <ValueBadge>{row.inputTokens}</ValueBadge>
              </DataCell>
              <DataCell>
                <ValueBadge>{row.cachedTokens}</ValueBadge>
              </DataCell>
              <DataCell>
                <ValueBadge>{row.outputTokens}</ValueBadge>
              </DataCell>
              <DataCell>
                <ValueBadge>{row.requests}</ValueBadge>
              </DataCell>
              <DataCell>
                <ValueBadge>{row.cost}</ValueBadge>
              </DataCell>
              <DataCell>
                <ValueBadge>{row.perMillion}</ValueBadge>
              </DataCell>
            </DataRow>
          ))}
          <DataRow selectable={false}>
            <DataCell>
              <TotalLabel>Total</TotalLabel>
            </DataCell>
            <DataCell />
            <DataCell>
              <ValueBadge>{TOTAL.inputTokens}</ValueBadge>
            </DataCell>
            <DataCell>
              <ValueBadge>{TOTAL.cachedTokens}</ValueBadge>
            </DataCell>
            <DataCell>
              <ValueBadge>{TOTAL.outputTokens}</ValueBadge>
            </DataCell>
            <DataCell>
              <ValueBadge>{TOTAL.requests}</ValueBadge>
            </DataCell>
            <DataCell>
              <ValueBadge>{TOTAL.cost}</ValueBadge>
            </DataCell>
            <DataCell>
              <ValueBadge>{TOTAL.perMillion}</ValueBadge>
            </DataCell>
          </DataRow>
        </Table>
      </ReportPanel>
    </>
  );
}
