import { useMemo, useState } from 'react';
import {
  Badge,
  DataCell,
  DataRow,
  DateInput,
  HeaderCell,
  HeaderRow,
  IconButton,
  type BadgeColor,
  type DateRangeValue,
} from '@cake-admin/cakeand';
import { ArrowDown, ArrowUp } from 'lucide-react';
import styled from 'styled-components';
import { StackedBarChart, type StackedBarSeries } from '../charts/StackedBarChart';
import {
  MetricCard,
  MetricGrid,
  ReportHeader,
  ReportPanel,
  ReportTable,
  reportCol,
  ReportFilterDropdown,
} from './ReportPage';

interface ModelInfo {
  id: string;
  name: string;
  badge: BadgeColor;
  provider: string;
  /** Effective price per 1M tokens at the demo usage mix. */
  perMillion: number;
  color: string;
  emphasisColor: string;
}

const MODELS: ModelInfo[] = [
  {
    id: 'frontier-l',
    name: 'Frontier-L',
    badge: 'indigo',
    provider: 'Provider A',
    perMillion: 16.44,
    color: '#7586ff',
    emphasisColor: '#6776ee',
  },
  {
    id: 'mid-m',
    name: 'Mid-M',
    badge: 'cyan',
    provider: 'Provider A',
    perMillion: 3.29,
    color: '#00bbdf',
    emphasisColor: '#00aacb',
  },
  {
    id: 'small-s',
    name: 'Small-S',
    badge: 'yellow',
    provider: 'Provider B',
    perMillion: 2.68,
    color: '#e2c600',
    emphasisColor: '#d0b600',
  },
  {
    id: 'open-70b',
    name: 'Open-70B',
    badge: 'magenta',
    provider: 'Self-hosted (AIC)',
    perMillion: 1.8,
    color: '#f65396',
    emphasisColor: '#e24c8a',
  },
];

/** July cost for Frontier-L at the demo usage mix; other models scale from rate. */
const FRONTIER_COST = 240000;

const MODEL_OPTIONS = MODELS.map((item) => ({ value: item.id, label: item.name }));

interface AlternativeRow {
  id: string;
  model: string;
  alternative: ModelInfo;
  currentCost: number;
  alternativeCost: number;
  difference: number;
}

const SortableHeaderCell = styled(HeaderCell)`
  cursor: pointer;

  /* Unsorted headers pick up primary on hover — sorted already uses active. */
  &:hover > span {
    color: var(--color-primary-primary);
  }
`;

type SortKey =
  | 'model'
  | 'alternative'
  | 'provider'
  | 'currentCost'
  | 'alternativeCost'
  | 'difference';

type SortDir = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'model', label: 'Model' },
  { key: 'alternative', label: 'Alternative' },
  { key: 'provider', label: 'Provider' },
  { key: 'currentCost', label: 'Current Cost' },
  { key: 'alternativeCost', label: 'Cost on alternative' },
  { key: 'difference', label: 'Difference' },
];

function sortValue(row: AlternativeRow, key: SortKey): string | number {
  switch (key) {
    case 'model':
      return row.model;
    case 'alternative':
      return row.alternative.name;
    case 'provider':
      return row.alternative.provider;
    case 'currentCost':
      return row.currentCost;
    case 'alternativeCost':
      return row.alternativeCost;
    case 'difference':
      return row.difference;
  }
}

function formatMoney(value: number, signed = false) {
  const amount = Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (!signed || value === 0) return `$${amount}`;
  return value > 0 ? `+$${amount}` : `-$${amount}`;
}

function formatTokens(tokens: number) {
  const billions = tokens / 1_000_000_000;
  return `${billions.toFixed(1)}B tokens`;
}

function formatChartLabel(value: number) {
  return `$${value.toFixed(2)}`;
}

function ValueBadge({ children }: { children: string }) {
  return (
    <Badge color="secondary" tone="subtle" dot={false}>
      {children}
    </Badge>
  );
}

export function ModelAnalyzer() {
  const [range, setRange] = useState<DateRangeValue>({ start: '', end: '' });
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [sortKey, setSortKey] = useState<SortKey>('currentCost');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const current = MODELS.find((item) => item.id === modelId) ?? MODELS[0];
  const usageTokens = (FRONTIER_COST / MODELS[0].perMillion) * 1_000_000;
  const currentCost = Math.round((usageTokens / 1_000_000) * current.perMillion);

  const cheapestAlternative = useMemo(
    () =>
      [...MODELS]
        .filter((item) => item.id !== current.id)
        .sort((left, right) => left.perMillion - right.perMillion)[0],
    [current.id],
  );

  const cheapestCost = Math.round(
    (usageTokens / 1_000_000) * cheapestAlternative.perMillion,
  );

  const rows = useMemo<AlternativeRow[]>(() => {
    const next = MODELS.filter((item) => item.id !== current.id).map((alternative) => {
      const alternativeCost = Math.round((usageTokens / 1_000_000) * alternative.perMillion);
      return {
        id: alternative.id,
        model: current.name,
        alternative,
        currentCost,
        alternativeCost,
        difference: alternativeCost - currentCost,
      };
    });
    return [...next].sort((left, right) => {
      const a = sortValue(left, sortKey);
      const b = sortValue(right, sortKey);
      const cmp =
        typeof a === 'string' && typeof b === 'string'
          ? a.localeCompare(b, undefined, { sensitivity: 'base' })
          : Number(a) - Number(b);
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [current.id, current.name, currentCost, sortDir, sortKey, usageTokens]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((value) => (value === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDir('desc');
  }

  const chartSeries = useMemo<StackedBarSeries[]>(
    () => [
      {
        name: 'Effective price',
        color: MODELS[0].color,
        data: MODELS.map((item) => ({
          value: item.perMillion,
          itemStyle: { color: item.color },
          emphasis: { itemStyle: { color: item.emphasisColor } },
        })) as unknown as number[],
      },
    ],
    [],
  );

  return (
    <>
      <ReportHeader
        title="Model analyzer"
        description="Model prices side by side, and what a switch would cost."
        filters={
          <>
            <DateInput
              mode="range"
              label="Date range"
              showHelper={false}
              rangeValue={range}
              onRangeValueChange={setRange}
            />
            <ReportFilterDropdown
              label="Model"
              options={MODEL_OPTIONS}
              value={modelId}
              onValueChange={setModelId}
            />
          </>
        }
      />
      <MetricGrid>
        <MetricCard
          label="Current model"
          value={
            <Badge color={current.badge} tone="subtle" dot={false}>
              {current.name}
            </Badge>
          }
          caption={
            <Badge color="secondary" tone="subtle" dot={false}>
              {current.provider}
            </Badge>
          }
        />
        <MetricCard label="Current cost" value={formatMoney(currentCost)} caption="July 2024" />
        <MetricCard
          label="Cost on cheapest alternative"
          value={formatMoney(cheapestCost)}
          caption={`${cheapestAlternative.name}, same usage`}
        />
        <MetricCard
          label="Usage compared"
          value={formatTokens(usageTokens)}
          caption="same input/output mix"
        />
      </MetricGrid>
      <ReportPanel title="Effective price per 1M tokens at this usage mix">
        <StackedBarChart
          categories={MODELS.map((item) => item.name)}
          series={chartSeries}
          stacked={false}
          showLegend={false}
          formatLabel={formatChartLabel}
          yMin={0}
          yMax={20}
          yInterval={10}
          height={290}
          ariaLabel="Effective price per one million tokens for each model at the current usage mix"
        />
      </ReportPanel>
      <ReportPanel
        title="Same usage on other models"
        note="Cost only. Answer quality is not assessed. Open-70B uses the internal price per token set in the model registry."
      >
        <ReportTable
          aria-label="Same usage on other models"
          $cols={[
            reportCol.compact,
            reportCol.wide,
            reportCol.wide,
            reportCol.metric,
            reportCol.metric,
            reportCol.metric,
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
              <DataCell>
                <Badge color={current.badge} tone="subtle" dot={false}>
                  {row.model}
                </Badge>
              </DataCell>
              <DataCell>
                <Badge color={row.alternative.badge} tone="subtle" dot={false}>
                  {row.alternative.name}
                </Badge>
              </DataCell>
              <DataCell>
                <ValueBadge>{row.alternative.provider}</ValueBadge>
              </DataCell>
              <DataCell>
                <ValueBadge>{formatMoney(row.currentCost)}</ValueBadge>
              </DataCell>
              <DataCell>
                <ValueBadge>{formatMoney(row.alternativeCost)}</ValueBadge>
              </DataCell>
              <DataCell>
                <ValueBadge>{formatMoney(row.difference, true)}</ValueBadge>
              </DataCell>
            </DataRow>
          ))}
        </ReportTable>
      </ReportPanel>
    </>
  );
}
