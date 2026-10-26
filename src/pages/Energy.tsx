import { useMemo, useState } from 'react';
import {
  Badge,
  DataRow,
  DateInput,
  HeaderRow,
  IconButton,
  type DateRangeValue,
} from '@cake-admin/cakeand';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { StackedBarChart, type StackedBarSeries } from '../charts/StackedBarChart';
import {
  CompactDataCell,
  MetricCard,
  MetricGrid,
  ReportHeader,
  ReportPanel,
  ReportTable,
  SortableHeaderCell,
  reportCol,
  ReportFilterDropdown,
} from './ReportPage';

const ALL = 'all';

const BAR_COLOR = '#7586ff';
const BAR_EMPHASIS = '#6776ee';

interface GpuRow {
  id: string;
  gpu: string;
  server: string;
  averagePower: string;
  powerValue: number;
  energy: string;
  energyValue: number;
}

const GPU_ROWS: GpuRow[] = [
  {
    id: 'gpu-1',
    gpu: 'GPU 1',
    server: 'srv-dc1-01',
    averagePower: '420 W',
    powerValue: 420,
    energy: '110.9',
    energyValue: 110.9,
  },
  {
    id: 'gpu-2',
    gpu: 'GPU 2',
    server: 'srv-dc1-01',
    averagePower: '420 W',
    powerValue: 420,
    energy: '110.9',
    energyValue: 110.9,
  },
  {
    id: 'gpu-3',
    gpu: 'GPU 3',
    server: 'srv-dc1-01',
    averagePower: '420 W',
    powerValue: 420,
    energy: '110.9',
    energyValue: 110.9,
  },
  {
    id: 'gpu-4',
    gpu: 'GPU 4',
    server: 'srv-dc1-01',
    averagePower: '420 W',
    powerValue: 420,
    energy: '110.9',
    energyValue: 110.9,
  },
  {
    id: 'gpu-5',
    gpu: 'GPU 5',
    server: 'srv-dc1-02',
    averagePower: '70 W',
    powerValue: 70,
    energy: '18.5',
    energyValue: 18.5,
  },
  {
    id: 'gpu-6',
    gpu: 'GPU 6',
    server: 'srv-dc1-02',
    averagePower: '70 W',
    powerValue: 70,
    energy: '18.5',
    energyValue: 18.5,
  },
  {
    id: 'gpu-7',
    gpu: 'GPU 7',
    server: 'srv-dc1-02',
    averagePower: '70 W',
    powerValue: 70,
    energy: '18.5',
    energyValue: 18.5,
  },
  {
    id: 'gpu-8',
    gpu: 'GPU 8',
    server: 'srv-dc1-02',
    averagePower: '70 W',
    powerValue: 70,
    energy: '18.5',
    energyValue: 18.5,
  },
];

const SERVER_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'srv-dc1-01', label: 'srv-dc1-01' },
  { value: 'srv-dc1-02', label: 'srv-dc1-02' },
];

type SortKey = 'gpu' | 'server' | 'averagePower' | 'energy';
type SortDir = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortKey; label: string; wide?: boolean }[] = [
  { key: 'gpu', label: 'GPU' },
  { key: 'server', label: 'Server' },
  { key: 'averagePower', label: 'Average power' },
  { key: 'energy', label: 'Energy (kWh)' },
];

function sortValue(row: GpuRow, key: SortKey): string | number {
  switch (key) {
    case 'gpu':
      return row.gpu;
    case 'server':
      return row.server;
    case 'averagePower':
      return row.powerValue;
    case 'energy':
      return row.energyValue;
  }
}

function ValueBadge({ children }: { children: string }) {
  return (
    <Badge color="secondary" tone="subtle" dot={false}>
      {children}
    </Badge>
  );
}

function formatPowerLabel(value: number) {
  return `${value} W`;
}

export function Energy() {
  const [range, setRange] = useState<DateRangeValue>({ start: '', end: '' });
  const [server, setServer] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('energy');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filteredRows = useMemo(
    () => GPU_ROWS.filter((row) => server === ALL || row.server === server),
    [server],
  );

  const rows = useMemo(() => {
    return [...filteredRows].sort((left, right) => {
      const a = sortValue(left, sortKey);
      const b = sortValue(right, sortKey);
      const cmp =
        typeof a === 'string' && typeof b === 'string'
          ? a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
          : Number(a) - Number(b);
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filteredRows, sortDir, sortKey]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDir('desc');
  }

  const chartCategories = useMemo(() => filteredRows.map((row) => row.gpu), [filteredRows]);

  const chartSeries = useMemo<StackedBarSeries[]>(
    () => [
      {
        name: 'Average power',
        color: BAR_COLOR,
        emphasisColor: BAR_EMPHASIS,
        data: filteredRows.map((row) => row.powerValue),
      },
    ],
    [filteredRows],
  );

  return (
    <>
      <ReportHeader
        title="Energy"
        description="Power drawn by each GPU"
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
              label="Server"
              options={SERVER_OPTIONS}
              value={server}
              onValueChange={setServer}
            />
          </>
        }
      />
      <MetricGrid>
        <MetricCard label="Cache hit rate" value="82%" caption="week of Sep 22–28" />
        <MetricCard label="Prompt tokens reused" value="2.6B" caption="Sep 1–28" />
        <MetricCard
          label="GPU time saved"
          value="410 hours"
          caption="estimate · of 2,688 GPU hours"
        />
        <MetricCard label="Deployments with caching" value="2" caption="" />
      </MetricGrid>
      <ReportPanel title="Average power per GPU (watts)">
        <StackedBarChart
          categories={chartCategories}
          series={chartSeries}
          formatLabel={formatPowerLabel}
          stacked={false}
          showLegend={false}
          barMaxWidth={54}
          yMin={0}
          yMax={500}
          yInterval={125}
          height={250}
          ariaLabel="Average power per GPU in watts, GPU 1 through GPU 8"
        />
      </ReportPanel>
      <ReportPanel title="By GPU">
        <ReportTable
          aria-label="Energy by GPU"
          $cols={[reportCol.compact, reportCol.compact, reportCol.metric, reportCol.metric].join(' ')}
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
                <ValueBadge>{row.gpu}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.server}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.averagePower}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.energy}</ValueBadge>
              </CompactDataCell>
            </DataRow>
          ))}
        </ReportTable>
      </ReportPanel>
    </>
  );
}
