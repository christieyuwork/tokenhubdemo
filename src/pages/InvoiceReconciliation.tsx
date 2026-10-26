import { useMemo, useState } from 'react';
import {
  Badge,
  DataRow,
  DateInput,
  HeaderCell,
  HeaderRow,
  IconButton,
  type BadgeColor,
  type DateRangeValue,
} from '@cake-admin/cakeand';
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import styled from 'styled-components';
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

const PROVIDER_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'Provider A', label: 'Provider A' },
  { value: 'Provider B', label: 'Provider B' },
  { value: 'Self-hosted (AIC)', label: 'Self-hosted (AIC)' },
];

type InvoiceStatus = 'Review' | 'Internal price' | 'Matched';

interface InvoiceRow {
  id: string;
  provider: string;
  calculated: number;
  /** null means no invoice (self-hosted). */
  invoiced: number | null;
  status: InvoiceStatus;
  statusColor: BadgeColor;
}

const INVOICE_ROWS: InvoiceRow[] = [
  {
    id: 'provider-a',
    provider: 'Provider A',
    calculated: 240000,
    invoiced: 240260,
    status: 'Review',
    statusColor: 'orange',
  },
  {
    id: 'provider-b',
    provider: 'Provider B',
    calculated: 42200,
    invoiced: 42140,
    status: 'Review',
    statusColor: 'orange',
  },
  {
    id: 'self-hosted',
    provider: 'Self-hosted (AIC)',
    calculated: 17800,
    invoiced: null,
    status: 'Internal price',
    statusColor: 'secondary',
  },
];

const CHART_CATEGORIES = [
  'Provider A · calculated',
  'Provider A · invoiced',
  'Provider B · calculated',
  'Provider B · invoiced',
];

const CHART_SERIES: StackedBarSeries[] = [
  {
    name: 'Calculated vs invoiced',
    color: '#7586ff',
    emphasisColor: '#6776ee',
    data: [240, 240.26, 42.2, 42.14],
  },
];

/** Per-bar colors from the Figma frame (not a shared series palette). */
const CHART_BAR_COLORS = ['#7586ff', '#00bbdf', '#e2c600', '#f65396'];

const MutedCell = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const EmptyChart = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

type SortKey = 'provider' | 'calculated' | 'invoiced' | 'difference' | 'status';
type SortDir = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortKey; label: string; wide?: boolean }[] = [
  { key: 'provider', label: 'Provider', wide: true },
  { key: 'calculated', label: 'Calculated' },
  { key: 'invoiced', label: 'Invoiced' },
  { key: 'difference', label: 'Difference' },
  { key: 'status', label: 'Status' },
];

function ValueBadge({ children }: { children: string }) {
  return (
    <Badge color="secondary" tone="subtle" dot={false}>
      {children}
    </Badge>
  );
}

function formatMoney(value: number, signed = false) {
  const amount = Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (!signed || value === 0) return `$${amount}`;
  return value > 0 ? `+$${amount}` : `-$${amount}`;
}

function differenceOf(row: InvoiceRow) {
  if (row.invoiced === null) return null;
  return row.invoiced - row.calculated;
}

function formatChartLabel(value: number) {
  return value.toFixed(2);
}

function sortValue(row: InvoiceRow, key: SortKey): string | number | null {
  switch (key) {
    case 'provider':
      return row.provider;
    case 'calculated':
      return row.calculated;
    case 'invoiced':
      return row.invoiced;
    case 'difference':
      return differenceOf(row);
    case 'status':
      return row.status;
  }
}

function compareRows(left: InvoiceRow, right: InvoiceRow, key: SortKey, dir: SortDir) {
  const a = sortValue(left, key);
  const b = sortValue(right, key);
  if (a === null || b === null) {
    if (a === null && b === null) return 0;
    return a === null ? 1 : -1;
  }
  const cmp =
    typeof a === 'string' && typeof b === 'string'
      ? a.localeCompare(b, undefined, { sensitivity: 'base' })
      : Number(a) - Number(b);
  return dir === 'desc' ? -cmp : cmp;
}

export function InvoiceReconciliation() {
  const [range, setRange] = useState<DateRangeValue>({ start: '', end: '' });
  const [provider, setProvider] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('difference');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows = useMemo(() => {
    const filtered = INVOICE_ROWS.filter(
      (row) => provider === ALL || row.provider === provider,
    );
    return [...filtered].sort((left, right) => compareRows(left, right, sortKey, sortDir));
  }, [provider, sortDir, sortKey]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDir('desc');
  }

  const apiRows = useMemo(
    () => rows.filter((row) => row.invoiced !== null),
    [rows],
  );

  const totals = useMemo(() => {
    const calculated = apiRows.reduce((sum, row) => sum + row.calculated, 0);
    const invoiced = apiRows.reduce((sum, row) => sum + (row.invoiced ?? 0), 0);
    const selfHosted = INVOICE_ROWS.find((row) => row.invoiced === null)?.calculated ?? 0;
    const difference = invoiced - calculated;
    const percentOfInvoiced =
      invoiced === 0 ? 0 : (difference / invoiced) * 100;
    return { calculated, invoiced, difference, percentOfInvoiced, selfHosted };
  }, [apiRows]);

  const chartSeries = useMemo<StackedBarSeries[]>(() => {
    if (provider === ALL) {
      return [
        {
          ...CHART_SERIES[0],
          data: CHART_SERIES[0].data.map((value, index) => ({
            value,
            itemStyle: { color: CHART_BAR_COLORS[index] },
          })) as unknown as number[],
        },
      ];
    }

    const row = INVOICE_ROWS.find((item) => item.provider === provider);
    if (!row || row.invoiced === null) return [];

    const calculated = row.calculated / 1000;
    const invoiced = row.invoiced / 1000;
    const colors =
      row.provider === 'Provider A'
        ? [CHART_BAR_COLORS[0], CHART_BAR_COLORS[1]]
        : [CHART_BAR_COLORS[2], CHART_BAR_COLORS[3]];

    return [
      {
        name: 'Calculated vs invoiced',
        color: colors[0],
        data: [calculated, invoiced].map((value, index) => ({
          value,
          itemStyle: { color: colors[index] },
        })) as unknown as number[],
      },
    ];
  }, [provider]);

  const chartCategories =
    provider === ALL
      ? CHART_CATEGORIES
      : provider === 'Self-hosted (AIC)'
        ? []
        : [`${provider} · calculated`, `${provider} · invoiced`];

  return (
    <>
      <ReportHeader
        title="Invoice reconciliation"
        description="Our calculated cost against each provider's invoice."
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
              label="Provider"
              options={PROVIDER_OPTIONS}
              value={provider}
              onValueChange={setProvider}
            />
          </>
        }
      />
      <MetricGrid>
        <MetricCard
          label="Calculated cost"
          value={formatMoney(totals.calculated)}
          caption="API providers, July"
        />
        <MetricCard
          label="Invoiced cost"
          value={formatMoney(totals.invoiced)}
          caption={
            <BadgeGroup>
              <Badge color="secondary" tone="subtle" dot={false}>
                Provider A
              </Badge>
              <Badge color="secondary" tone="subtle" dot={false}>
                Provider B
              </Badge>
            </BadgeGroup>
          }
        />
        <MetricCard
          label="Difference"
          value={formatMoney(totals.difference, true)}
          caption={`${totals.percentOfInvoiced.toFixed(2)}% of invoiced`}
        />
        <MetricCard
          label="Self-hosted cost"
          value={formatMoney(totals.selfHosted)}
          caption="internal price, no invoice"
        />
      </MetricGrid>
      <ReportPanel title="Calculated vs invoiced, by provider ($ thousands)">
        {chartSeries.length > 0 && chartCategories.length > 0 ? (
          <StackedBarChart
            categories={chartCategories}
            series={chartSeries}
            stacked={false}
            showLegend={false}
            formatLabel={formatChartLabel}
            yMin={0}
            yMax={300}
            yInterval={75}
            height={290}
            ariaLabel="Calculated versus invoiced cost by provider in thousands of dollars"
          />
        ) : (
          <EmptyChart>No invoiced providers match this filter.</EmptyChart>
        )}
      </ReportPanel>
      <ReportPanel
        title="By provider"
        note='Detail panel on click: each charge, the rate version used, and any adjustment. Tolerance for “Matched” is still to be agreed.'
      >
        <ReportTable
          aria-label="Invoice reconciliation by provider"
          $cols={[
            reportCol.wide,
            reportCol.metric,
            reportCol.metric,
            reportCol.metric,
            reportCol.compact,
            reportCol.icon,
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
              <HeaderCell aria-label="Expand" />
            </HeaderRow>
          }
        >
          {rows.map((row) => {
            const difference = differenceOf(row);
            return (
              <DataRow key={row.id} selectable={false}>
                <WideDataCell>
                  <ValueBadge>{row.provider}</ValueBadge>
                </WideDataCell>
                <CompactDataCell>
                  <ValueBadge>{formatMoney(row.calculated)}</ValueBadge>
                </CompactDataCell>
                <CompactDataCell>
                  {row.invoiced === null ? (
                    <MutedCell>No invoice</MutedCell>
                  ) : (
                    <ValueBadge>{formatMoney(row.invoiced)}</ValueBadge>
                  )}
                </CompactDataCell>
                <CompactDataCell>
                  {difference === null ? (
                    <MutedCell>--</MutedCell>
                  ) : (
                    <Badge
                      color={difference >= 0 ? 'green' : 'destructive'}
                      tone="subtle"
                      dot={false}
                    >
                      {formatMoney(difference, true)}
                    </Badge>
                  )}
                </CompactDataCell>
                <CompactDataCell>
                  <Badge color={row.statusColor} tone="subtle" dot={false}>
                    {row.status}
                  </Badge>
                </CompactDataCell>
                <CompactDataCell>
                  <IconButton
                    size="xs"
                    variant="tonal"
                    label={`Expand ${row.provider} detail`}
                    icon={<ChevronDown />}
                  />
                </CompactDataCell>
              </DataRow>
            );
          })}
        </ReportTable>
      </ReportPanel>
    </>
  );
}
