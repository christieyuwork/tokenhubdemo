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
import {
  GpuBusyHeatmap,
  type GpuBusyLevel,
  type GpuBusyRow,
} from '../charts/GpuBusyHeatmap';
import {
  BadgeGroup,
  CellSecondary,
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

/** Typical-day pattern for GPUs 1-4 (srv-dc1-01) from the Figma frame. */
const ACTIVE_DAY: GpuBusyLevel[] = [
  ...Array<GpuBusyLevel>(5).fill('busy'),
  ...Array<GpuBusyLevel>(2).fill('moderate'),
  ...Array<GpuBusyLevel>(13).fill('idle'),
  ...Array<GpuBusyLevel>(4).fill('moderate'),
];

const IDLE_DAY: GpuBusyLevel[] = Array<GpuBusyLevel>(24).fill('unallocated');

interface FleetRow {
  id: string;
  gpu: string;
  server: string;
  serverSuffix: string;
  model: string | null;
  deployment: string | null;
  utilization: string;
  idleHours: number;
  hours: GpuBusyLevel[];
}

const FLEET_ROWS: FleetRow[] = [
  {
    id: 'gpu-1',
    gpu: 'GPU 1',
    server: 'srv-dc1-01',
    serverSuffix: '01',
    model: 'Open-70B',
    deployment: 'Crew scheduling',
    utilization: '60%',
    idleHours: 105.6,
    hours: ACTIVE_DAY,
  },
  {
    id: 'gpu-2',
    gpu: 'GPU 2',
    server: 'srv-dc1-01',
    serverSuffix: '01',
    model: 'Open-70B',
    deployment: 'Crew scheduling',
    utilization: '60%',
    idleHours: 105.6,
    hours: ACTIVE_DAY,
  },
  {
    id: 'gpu-3',
    gpu: 'GPU 3',
    server: 'srv-dc1-01',
    serverSuffix: '01',
    model: 'Open-70B',
    deployment: 'Crew scheduling',
    utilization: '60%',
    idleHours: 105.6,
    hours: ACTIVE_DAY,
  },
  {
    id: 'gpu-4',
    gpu: 'GPU 4',
    server: 'srv-dc1-01',
    serverSuffix: '01',
    model: 'Open-70B',
    deployment: 'Crew scheduling',
    utilization: '60%',
    idleHours: 105.6,
    hours: ACTIVE_DAY,
  },
  {
    id: 'gpu-5',
    gpu: 'GPU 5',
    server: 'srv-dc1-02',
    serverSuffix: '02',
    model: null,
    deployment: null,
    utilization: '0%',
    idleHours: 264,
    hours: IDLE_DAY,
  },
  {
    id: 'gpu-6',
    gpu: 'GPU 6',
    server: 'srv-dc1-02',
    serverSuffix: '02',
    model: null,
    deployment: null,
    utilization: '0%',
    idleHours: 264,
    hours: IDLE_DAY,
  },
  {
    id: 'gpu-7',
    gpu: 'GPU 7',
    server: 'srv-dc1-02',
    serverSuffix: '02',
    model: null,
    deployment: null,
    utilization: '0%',
    idleHours: 264,
    hours: IDLE_DAY,
  },
  {
    id: 'gpu-8',
    gpu: 'GPU 8',
    server: 'srv-dc1-02',
    serverSuffix: '02',
    model: null,
    deployment: null,
    utilization: '0%',
    idleHours: 264,
    hours: IDLE_DAY,
  },
];

const SERVER_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'srv-dc1-01', label: 'srv-dc1-01' },
  { value: 'srv-dc1-02', label: 'srv-dc1-02' },
];


type SortKey = 'gpu' | 'server' | 'deployment' | 'utilization' | 'idleHours';
type SortDir = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortKey; label: string; wide?: boolean }[] = [
  { key: 'gpu', label: 'GPU' },
  { key: 'server', label: 'Server' },
  { key: 'deployment', label: 'Model deployment', wide: true },
  { key: 'utilization', label: 'Utilization' },
  { key: 'idleHours', label: 'Idle hours' },
];

/** Parse display metrics like "60%", "105.6", "18.57B", "$32,000" into numbers. */
function metricValue(raw: string): number {
  const cleaned = raw.replace(/[$,%]/g, '').trim();
  const match = cleaned.match(/^(-?[\d.]+)\s*([BMK])?$/i);
  if (!match) return Number(cleaned) || 0;
  const n = Number(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  const mult = suffix === 'B' ? 1e9 : suffix === 'M' ? 1e6 : suffix === 'K' ? 1e3 : 1;
  return n * mult;
}

function deploymentLabel(row: FleetRow) {
  if (row.model && row.deployment) return `${row.model} ${row.deployment}`;
  return 'No deployment';
}

function sortValue(row: FleetRow, key: SortKey): string | number {
  switch (key) {
    case 'gpu':
      return metricValue(row.gpu.replace(/^GPU\s*/i, ''));
    case 'server':
      return row.server;
    case 'deployment':
      return deploymentLabel(row);
    case 'utilization':
      return metricValue(row.utilization);
    case 'idleHours':
      return row.idleHours;
  }
}

function ValueBadge({ children }: { children: string }) {
  return (
    <Badge color="secondary" tone="subtle" dot={false}>
      {children}
    </Badge>
  );
}

function formatIdleHours(value: number) {
  return value.toFixed(1);
}

export function GpuFleet() {
  const [range, setRange] = useState<DateRangeValue>({ start: '', end: '' });
  const [server, setServer] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('idleHours');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filtered = useMemo(
    () => FLEET_ROWS.filter((row) => server === ALL || row.server === server),
    [server],
  );

  const rows = useMemo(() => {
    return [...filtered].sort((left, right) => {
      const a = sortValue(left, sortKey);
      const b = sortValue(right, sortKey);
      const cmp =
        typeof a === 'string' && typeof b === 'string'
          ? a.localeCompare(b, undefined, { sensitivity: 'base' })
          : Number(a) - Number(b);
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filtered, sortDir, sortKey]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDir('desc');
  }

  /** Heatmap keeps fleet order (GPU 1–8); table sort does not reshuffle it. */
  const heatmapRows = useMemo<GpuBusyRow[]>(
    () =>
      filtered.map((row) => ({
        id: row.id,
        label: `${row.gpu} · ${row.serverSuffix}`,
        hours: row.hours,
      })),
    [filtered],
  );

  return (
    <>
      <ReportHeader
        title="GPU fleet"
        description="Each GPU's busy and idle time, and which model deployment runs on it"
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
        <MetricCard label="GPUs registered" value="8" caption="in 2 servers, own data center" />
        <MetricCard label="Average utilization" value="30%" caption="Aug 1–11" />
        <MetricCard label="Idle GPU hours" value="1,478" caption="of 2,112 GPU hours" />
        <MetricCard label="GPUs with no deployment" value="4" caption="server srv-dc1-02" />
      </MetricGrid>
      <ReportPanel title="Busy time per GPU, typical day">
        <GpuBusyHeatmap
          rows={heatmapRows}
          ariaLabel="Busy time per GPU across a typical day, hours 00 through 23"
        />
      </ReportPanel>
      <ReportPanel title="Same usage on other models">
        <ReportTable
          aria-label="GPU fleet by GPU"
          $cols={[
            reportCol.compact,
            reportCol.compact,
            reportCol.widePlus,
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
                <ValueBadge>{row.gpu}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.server}</ValueBadge>
              </CompactDataCell>
              <WideDataCell>
                {row.model && row.deployment ? (
                  <BadgeGroup>
                    <Badge color="magenta" tone="subtle" dot={false}>
                      {row.model}
                    </Badge>
                    <CellSecondary>{row.deployment}</CellSecondary>
                  </BadgeGroup>
                ) : (
                  <ValueBadge>No deployment</ValueBadge>
                )}
              </WideDataCell>
              <CompactDataCell>
                <ValueBadge>{row.utilization}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{formatIdleHours(row.idleHours)}</ValueBadge>
              </CompactDataCell>
            </DataRow>
          ))}
        </ReportTable>
      </ReportPanel>
    </>
  );
}
