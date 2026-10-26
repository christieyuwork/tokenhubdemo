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
const HIT_RATES = [74, 79, 81, 82];
const CHART_SERIES: StackedBarSeries[] = [
  {
    name: 'Cache hit rate',
    color: '#f65396',
    emphasisColor: '#e24c8a',
    data: HIT_RATES,
  },
];
interface DeploymentRow {
  id: string;
  model: string;
  app: string;
  runsOn: string;
  requests: string;
  hitRate: string;
  tokensReused: string;
}
const DEPLOYMENT_ROWS: DeploymentRow[] = [
  {
    id: 'crew-dc1-02',
    model: 'Open-70B',
    app: 'Crew scheduling',
    runsOn: 'srv-dc1-02, GPUs 5-8',
    requests: '3.0M',
    hitRate: '79%',
    tokensReused: '2.5B',
  },
  {
    id: 'crew-dc1-01',
    model: 'Open-70B',
    app: 'Crew scheduling',
    runsOn: 'srv-dc1-01, GPUs 1-4',
    requests: '0.45M',
    hitRate: '2%',
    tokensReused: '0.1B',
  },
];
interface PromptRow {
  id: string;
  segment: string;
  share: string;
}
const PROMPT_ROWS: PromptRow[] = [
  {
    id: 'fare-rules',
    segment: 'Fare rules and rebooking policy',
    share: '46%',
  },
  {
    id: 'system-prompt',
    segment: 'System prompt',
    share: '28%',
  },
  {
    id: 'earlier-turns',
    segment: 'Earlier turns of the chat',
    share: '26%',
  },
];
const DEPLOYMENT_OPTIONS = [
  { value: ALL, label: 'All' },
  ...DEPLOYMENT_ROWS.map((row) => ({
    value: row.id,
    label: `${row.app} · ${row.runsOn.split(',')[0]}`,
  })),
];
type DeploymentSortKey = 'deployment' | 'runsOn' | 'requests' | 'hitRate' | 'tokensReused';
type PromptSortKey = 'segment' | 'share';
type SortDir = 'asc' | 'desc';
const DEPLOYMENT_SORT_COLUMNS: { key: DeploymentSortKey; label: string; wide?: boolean }[] = [
  { key: 'deployment', label: 'Deployment', wide: true },
  { key: 'runsOn', label: 'Runs on', wide: true },
  { key: 'requests', label: 'Requests' },
  { key: 'hitRate', label: 'Hit rate (Sep 1-28)' },
  { key: 'tokensReused', label: 'Tokens reused' },
];
const PROMPT_SORT_COLUMNS: { key: PromptSortKey; label: string; wide?: boolean }[] = [
  { key: 'segment', label: 'Segment', wide: true },
  { key: 'share', label: 'Share of reused tokens' },
];
/** Parse display metrics like "18.57B", "9.67M", "$340,000", "79%" into numbers. */
function metricValue(raw: string): number {
  const cleaned = raw.replace(/[$,%]/g, '').trim();
  const match = cleaned.match(/^(-?[\d.]+)\s*([BMK])?$/i);
  if (!match) return Number(cleaned) || 0;
  const n = Number(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  const mult = suffix === 'B' ? 1e9 : suffix === 'M' ? 1e6 : suffix === 'K' ? 1e3 : 1;
  return n * mult;
}
function deploymentSortValue(row: DeploymentRow, key: DeploymentSortKey): string | number {
  switch (key) {
    case 'deployment':
      return `${row.model} ${row.app}`;
    case 'runsOn':
      return row.runsOn;
    case 'requests':
      return metricValue(row.requests);
    case 'hitRate':
      return metricValue(row.hitRate);
    case 'tokensReused':
      return metricValue(row.tokensReused);
  }
}
function promptSortValue(row: PromptRow, key: PromptSortKey): string | number {
  switch (key) {
    case 'segment':
      return row.segment;
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
function formatPercent(value: number) {
  return `${value}%`;
}
export function Caching() {
  const [range, setRange] = useState<DateRangeValue>({ start: '', end: '' });
  const [deployment, setDeployment] = useState(ALL);
  const [deploymentSortKey, setDeploymentSortKey] = useState<DeploymentSortKey>('requests');
  const [deploymentSortDir, setDeploymentSortDir] = useState<SortDir>('desc');
  const [promptSortKey, setPromptSortKey] = useState<PromptSortKey>('share');
  const [promptSortDir, setPromptSortDir] = useState<SortDir>('desc');
  const deploymentRows = useMemo(() => {
    const filtered = DEPLOYMENT_ROWS.filter(
      (row) => deployment === ALL || row.id === deployment,
    );
    return [...filtered].sort((left, right) => {
      const a = deploymentSortValue(left, deploymentSortKey);
      const b = deploymentSortValue(right, deploymentSortKey);
      const cmp =
        typeof a === 'string' && typeof b === 'string'
          ? a.localeCompare(b, undefined, { sensitivity: 'base' })
          : Number(a) - Number(b);
      return deploymentSortDir === 'desc' ? -cmp : cmp;
    });
  }, [deployment, deploymentSortDir, deploymentSortKey]);
  const promptRows = useMemo(() => {
    return [...PROMPT_ROWS].sort((left, right) => {
      const a = promptSortValue(left, promptSortKey);
      const b = promptSortValue(right, promptSortKey);
      const cmp =
        typeof a === 'string' && typeof b === 'string'
          ? a.localeCompare(b, undefined, { sensitivity: 'base' })
          : Number(a) - Number(b);
      return promptSortDir === 'desc' ? -cmp : cmp;
    });
  }, [promptSortDir, promptSortKey]);
  function handleDeploymentSort(key: DeploymentSortKey) {
    if (deploymentSortKey === key) {
      setDeploymentSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setDeploymentSortKey(key);
    setDeploymentSortDir('desc');
  }
  function handlePromptSort(key: PromptSortKey) {
    if (promptSortKey === key) {
      setPromptSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setPromptSortKey(key);
    setPromptSortDir('desc');
  }
  return (
    <>
      <ReportHeader
        title="Caching"
        description="Repeated prompt text that our own models reuse instead of processing again."
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
              label="Deployment"
              options={DEPLOYMENT_OPTIONS}
              value={deployment}
              onValueChange={setDeployment}
            />
          </>
        }
      />
      <MetricGrid>
        <MetricCard label="Cache hit rate" value="82%" caption="week of Sep 22-28" />
        <MetricCard label="Prompt tokens reused" value="2.6B" caption="Sep 1-28" />
        <MetricCard
          label="GPU time saved"
          value="410 hours"
          caption="estimate Â· of 2,688 GPU hours"
        />
        <MetricCard label="Deployments with caching" value="2" caption="" />
      </MetricGrid>
      <ReportPanel title="Cache hit rate by week, Open-70B Â· travel assistant">
        <StackedBarChart
          categories={CATEGORIES}
          series={CHART_SERIES}
          stacked={false}
          showLegend={false}
          formatLabel={formatPercent}
          formatAxisLabel={formatPercent}
          barMaxWidth={141}
          yMin={0}
          yMax={100}
          yInterval={25}
          height={180}
          ariaLabel="Cache hit rate by week for Open-70B travel assistant, September 1 through September 28"
        />
      </ReportPanel>
      <ReportPanel title="By model deployment">
        <ReportTable
          aria-label="Cache performance by model deployment"
          $cols={[
            reportCol.wide,
            reportCol.wide,
            reportCol.metric,
            reportCol.metric,
            reportCol.metric,
          ].join(' ')}
          header={
            <HeaderRow>
              {DEPLOYMENT_SORT_COLUMNS.map(({ key, label, wide }) => {
                const sorted = deploymentSortKey === key;
                const nextDir =
                  sorted && deploymentSortDir === 'desc' ? 'ascending' : 'descending';
                return (
                  <SortableHeaderCell
                    key={key}
                    $wide={wide}
                    active={sorted}
                    aria-sort={
                      sorted
                        ? deploymentSortDir === 'desc'
                          ? 'descending'
                          : 'ascending'
                        : 'none'
                    }
                    onClick={() => handleDeploymentSort(key)}
                    actions={
                      sorted ? (
                        <IconButton
                          size="xs"
                          variant="tonal"
                          label={`Sort ${label} ${nextDir}`}
                          icon={deploymentSortDir === 'asc' ? <ArrowUp /> : <ArrowDown />}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeploymentSort(key);
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
          {deploymentRows.map((row) => (
            <DataRow key={row.id} selectable={false}>
              <WideDataCell>
                <BadgeGroup>
                  <Badge color="magenta" tone="subtle" dot={false}>
                    {row.model}
                  </Badge>
                  <ValueBadge>{row.app}</ValueBadge>
                </BadgeGroup>
              </WideDataCell>
              <WideDataCell>
                <ValueBadge>{row.runsOn}</ValueBadge>
              </WideDataCell>
              <CompactDataCell>
                <ValueBadge>{row.requests}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.hitRate}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.tokensReused}</ValueBadge>
              </CompactDataCell>
            </DataRow>
          ))}
        </ReportTable>
      </ReportPanel>
      <ReportPanel title="Most reused prompt text Â· travel assistant">
        <ReportTable
          aria-label="Most reused prompt text Â· travel assistant"
          $cols={[reportCol.widePlus, reportCol.metric].join(' ')}
          header={
            <HeaderRow>
              {PROMPT_SORT_COLUMNS.map(({ key, label, wide }) => {
                const sorted = promptSortKey === key;
                const nextDir = sorted && promptSortDir === 'desc' ? 'ascending' : 'descending';
                return (
                  <SortableHeaderCell
                    key={key}
                    $wide={wide}
                    active={sorted}
                    aria-sort={
                      sorted ? (promptSortDir === 'desc' ? 'descending' : 'ascending') : 'none'
                    }
                    onClick={() => handlePromptSort(key)}
                    actions={
                      sorted ? (
                        <IconButton
                          size="xs"
                          variant="tonal"
                          label={`Sort ${label} ${nextDir}`}
                          icon={promptSortDir === 'asc' ? <ArrowUp /> : <ArrowDown />}
                          onClick={(event) => {
                            event.stopPropagation();
                            handlePromptSort(key);
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
          {promptRows.map((row) => (
            <DataRow key={row.id} selectable={false}>
              <WideDataCell>
                <ValueBadge>{row.segment}</ValueBadge>
              </WideDataCell>
              <CompactDataCell>
                <ValueBadge>{row.share}</ValueBadge>
              </CompactDataCell>
            </DataRow>
          ))}
        </ReportTable>
      </ReportPanel>
    </>
  );
}

