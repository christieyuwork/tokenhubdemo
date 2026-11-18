import { Fragment, useMemo, useState } from 'react';
import {
  DataCell,
  DataRow,
  DateInput,
  HeaderCell,
  HeaderRow,
  IconButton,
  TextInput,
  type DateRangeValue,
} from '@cake-admin/cakeand';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Copy, Search } from 'lucide-react';
import styled from 'styled-components';
import { modelBadgeColor } from '../data/modelColors';
import {
  CellBadge,
  MetricCard,
  MetricGrid,
  ReportHeader,
  ReportPanel,
  ReportTable,
  ValueBadge,
  reportCol,
  ReportFilterDropdown,
} from './ReportPage';

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
  { value: 'In-country', label: 'In-country' },
];

const MODEL_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'Claude Sonnet 4.6', label: 'Claude Sonnet 4.6' },
  { value: 'Llama 3.3 70B', label: 'Llama 3.3 70B' },
  { value: 'Qwen 8B', label: 'Qwen 8B' },
  { value: 'Llama 3.1 405B', label: 'Llama 3.1 405B' },
];

type ModelName = 'Claude Sonnet 4.6' | 'Llama 3.3 70B' | 'Qwen 8B' | 'Llama 3.1 405B';

interface TraceStep {
  step: number;
  name: string;
  model: ModelName;
  inputTokens: number;
  outputTokens: number;
  responseSeconds: number;
  cost: number;
}

interface TraceRow {
  id: string;
  time: string;
  prompt: string;
  errors: number;
  retries: number;
  steps: TraceStep[];
}

/** Canonical expanded sample — Brightsky quality-inspection trace. */
const CH_48213_STEPS: TraceStep[] = [
  { step: 1, name: 'Request analysis', model: 'Qwen 8B', inputTokens: 300, outputTokens: 15, responseSeconds: 0.8, cost: 0.006 },
  { step: 2, name: 'Image feature extract', model: 'Llama 3.3 70B', inputTokens: 450, outputTokens: 30, responseSeconds: 1.1, cost: 0.009 },
  { step: 3, name: 'Retry after timeout', model: 'Llama 3.3 70B', inputTokens: 450, outputTokens: 30, responseSeconds: 1.0, cost: 0.009 },
  { step: 4, name: 'Security / PII check', model: 'Qwen 8B', inputTokens: 400, outputTokens: 10, responseSeconds: 0.4, cost: 0.001 },
  { step: 5, name: 'Defect taxonomy lookup', model: 'Llama 3.3 70B', inputTokens: 1100, outputTokens: 40, responseSeconds: 1.6, cost: 0.019 },
  { step: 6, name: 'History replay', model: 'Llama 3.3 70B', inputTokens: 1400, outputTokens: 20, responseSeconds: 1.2, cost: 0.022 },
  { step: 7, name: 'Line context tool', model: 'Llama 3.3 70B', inputTokens: 1600, outputTokens: 30, responseSeconds: 1.5, cost: 0.026 },
  { step: 8, name: 'Governance check', model: 'Qwen 8B', inputTokens: 500, outputTokens: 10, responseSeconds: 0.4, cost: 0.002 },
  { step: 9, name: 'History replay', model: 'Llama 3.3 70B', inputTokens: 1900, outputTokens: 20, responseSeconds: 1.3, cost: 0.03 },
  { step: 10, name: 'Draft classification', model: 'Llama 3.3 70B', inputTokens: 2000, outputTokens: 90, responseSeconds: 2.4, cost: 0.037 },
  { step: 11, name: 'History replay', model: 'Llama 3.3 70B', inputTokens: 2300, outputTokens: 20, responseSeconds: 1.4, cost: 0.036 },
  { step: 12, name: 'Final classification', model: 'Llama 3.3 70B', inputTokens: 2700, outputTokens: 60, responseSeconds: 2.2, cost: 0.046 },
];

function scaleSteps(
  template: TraceStep[],
  count: number,
  targetInput: number,
  targetCost: number,
  names: string[],
): TraceStep[] {
  const base = template.slice(0, count).map((step, index) => ({
    ...step,
    step: index + 1,
    name: names[index] ?? step.name,
  }));
  const inputSum = base.reduce((sum, step) => sum + step.inputTokens, 0);
  const costSum = base.reduce((sum, step) => sum + step.cost, 0);
  const inputScale = targetInput / inputSum;
  const costScale = targetCost / costSum;

  const scaled = base.map((step) => ({
    ...step,
    inputTokens: Math.round(step.inputTokens * inputScale),
    outputTokens: Math.max(5, Math.round(step.outputTokens * inputScale)),
    responseSeconds: Math.round(step.responseSeconds * 10) / 10,
    cost: Math.round(step.cost * costScale * 10000) / 10000,
  }));

  const inputDrift = targetInput - scaled.reduce((sum, step) => sum + step.inputTokens, 0);
  const costDrift =
    Math.round((targetCost - scaled.reduce((sum, step) => sum + step.cost, 0)) * 10000) / 10000;
  const last = scaled[scaled.length - 1];
  last.inputTokens += inputDrift;
  last.cost = Math.round((last.cost + costDrift) * 10000) / 10000;
  return scaled;
}

const TRACE_ROWS: TraceRow[] = [
  {
    id: 'CH-48213',
    time: '07:41',
    prompt: 'Classify this routine quality-inspection result.',
    errors: 0,
    retries: 1,
    steps: CH_48213_STEPS,
  },
  {
    id: 'CH-48214',
    time: '07:42',
    prompt: 'Flag surface scratch severity on line B-12.',
    errors: 0,
    retries: 0,
    steps: scaleSteps(
      CH_48213_STEPS,
      9,
      9820,
      0.1688,
      [
        'Request analysis',
        'Image feature extract',
        'Defect taxonomy lookup',
        'Security / PII check',
        'History replay',
        'Line context tool',
        'Governance check',
        'Draft classification',
        'Final classification',
      ],
    ),
  },
  {
    id: 'CH-48219',
    time: '07:43',
    prompt: 'Analyze complex factory-quality issue with customer lot data.',
    errors: 0,
    retries: 1,
    steps: scaleSteps(
      [
        ...CH_48213_STEPS,
        {
          step: 13,
          name: 'Residency check',
          model: 'Llama 3.1 405B',
          inputTokens: 2100,
          outputTokens: 40,
          responseSeconds: 1.7,
          cost: 0.034,
        },
        {
          step: 14,
          name: 'Final classification',
          model: 'Llama 3.1 405B',
          inputTokens: 2800,
          outputTokens: 70,
          responseSeconds: 2.1,
          cost: 0.048,
        },
      ],
      14,
      21300,
      0.412,
      [
        'Request analysis',
        'Image feature extract',
        'Retry after timeout',
        'Security / PII check',
        'Customer lot lookup',
        'History replay',
        'Line context tool',
        'Governance check',
        'Defect taxonomy lookup',
        'History replay',
        'Draft classification',
        'History replay',
        'Residency check',
        'Final classification',
      ],
    ),
  },
  {
    id: 'CH-48222',
    time: '07:43',
    prompt: 'Lookup defect code for SKU-8841.',
    errors: 0,
    retries: 0,
    steps: scaleSteps(
      CH_48213_STEPS,
      6,
      4950,
      0.083,
      [
        'Request analysis',
        'Defect code tool',
        'Security / PII check',
        'History replay',
        'Draft classification',
        'Final classification',
      ],
    ),
  },
  {
    id: 'CR-10031',
    time: '07:44',
    prompt: 'Summarize yesterday’s line B defect notices.',
    errors: 0,
    retries: 0,
    steps: scaleSteps(
      CH_48213_STEPS,
      3,
      5200,
      0.009,
      ['Request analysis', 'Notice lookup', 'Final classification'],
    ).map((step, index) =>
      index === 1
        ? { ...step, model: 'Llama 3.3 70B' as const }
        : index === 2
          ? { ...step, model: 'Qwen 8B' as const }
          : step,
    ),
  },
  {
    id: 'CH-48230',
    time: '07:44',
    prompt: 'Escalate ambiguous defect with production metadata.',
    errors: 1,
    retries: 1,
    steps: scaleSteps(
      CH_48213_STEPS,
      12,
      16050,
      0.251,
      [
        'Request analysis',
        'Defect status tool',
        'Retry after error',
        'Security / PII check',
        'Defect taxonomy lookup',
        'History replay',
        'Escalation tool',
        'Governance check',
        'History replay',
        'Draft classification',
        'History replay',
        'Final classification',
      ],
    ),
  },
];

/** Figma Trace ID search: &text.input at 320px (space-1000 × 4). */
const SearchField = styled.div`
  box-sizing: border-box;
  flex: 0 0 auto;
  width: calc(var(--space-1000) * 4);
  max-width: 100%;
  min-width: 0;
`;

const ExpandPanel = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: var(--space-300) var(--space-300) var(--space-300) var(--space-800);
  border-bottom: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-container);
`;

const ExpandTitle = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-200);
  min-width: 0;
  overflow: hidden;
`;

const TraceIdLabel = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
  white-space: nowrap;
`;

const PromptLabel = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TotalLabel = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

/** Plain cell text in expanded steps — no secondary/subtle pill wash. */
const StepValue = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

const SortableHeaderCell = styled(HeaderCell)`
  cursor: pointer;

  /* Unsorted headers pick up primary on hover — sorted already uses active. */
  &:hover > span {
    color: var(--color-primary-primary);
  }
`;

type SortKey = 'id' | 'time' | 'calls' | 'tokens' | 'cost' | 'errors' | 'retries';
type SortDir = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'Trace ID' },
  { key: 'time', label: 'Time' },
  { key: 'calls', label: 'Calls' },
  { key: 'tokens', label: 'Tokens' },
  { key: 'cost', label: 'Cost' },
  { key: 'errors', label: 'Errors' },
  { key: 'retries', label: 'Retries' },
];

function timeValue(raw: string): number {
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function sortValue(
  entry: { row: TraceRow; summary: ReturnType<typeof summarize> },
  key: SortKey,
): string | number {
  switch (key) {
    case 'id':
      return entry.row.id;
    case 'time':
      return timeValue(entry.row.time);
    case 'calls':
      return entry.summary.calls;
    case 'tokens':
      return entry.summary.tokens;
    case 'cost':
      return entry.summary.costValue;
    case 'errors':
      return entry.row.errors;
    case 'retries':
      return entry.row.retries;
  }
}


function formatTokens(value: number) {
  return value.toLocaleString('en-US');
}

function formatCost(value: number) {
  if (value >= 1) return `$${value.toFixed(2)}`;
  const as4 = Math.round(value * 10000) / 10000;
  const as3 = Math.round(value * 1000) / 1000;
  if (Math.abs(as4 - as3) < 0.00005) return `$${as3.toFixed(3)}`;
  return `$${as4.toFixed(4)}`;
}

function formatSeconds(value: number) {
  return `${value.toFixed(1)} s`;
}

function totalsOf(steps: TraceStep[]) {
  return steps.reduce(
    (acc, step) => ({
      inputTokens: acc.inputTokens + step.inputTokens,
      outputTokens: acc.outputTokens + step.outputTokens,
      responseSeconds: acc.responseSeconds + step.responseSeconds,
      cost: acc.cost + step.cost,
    }),
    { inputTokens: 0, outputTokens: 0, responseSeconds: 0, cost: 0 },
  );
}

function summarize(row: TraceRow) {
  const totals = totalsOf(row.steps);
  return {
    calls: row.steps.length,
    tokens: totals.inputTokens,
    cost: totals.cost,
    costValue: totals.cost,
  };
}

export function CostByTrace() {
  const [range, setRange] = useState<DateRangeValue>({ start: '', end: '' });
  const [grain, setGrain] = useState(ALL);
  const [provider, setProvider] = useState(ALL);
  const [model, setModel] = useState(ALL);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('cost');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>('CH-48213');

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = TRACE_ROWS.filter((row) => {
      const matchesQuery =
        normalized.length === 0 ||
        row.id.toLowerCase().includes(normalized) ||
        row.prompt.toLowerCase().includes(normalized);
      const matchesModel = model === ALL || row.steps.some((step) => step.model === model);
      return matchesQuery && matchesModel;
    }).map((row) => ({ row, summary: summarize(row) }));

    return [...filtered].sort((left, right) => {
      const a = sortValue(left, sortKey);
      const b = sortValue(right, sortKey);
      const cmp =
        typeof a === 'string' && typeof b === 'string'
          ? a.localeCompare(b, undefined, { sensitivity: 'base' })
          : Number(a) - Number(b);
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [model, query, sortDir, sortKey]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDir('desc');
  }

  function toggleExpanded(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  async function copyPrompt(traceId: string, prompt: string) {
    try {
      await navigator.clipboard.writeText(`${traceId} "${prompt}"`);
    } catch {
      // Demo shell — clipboard may be unavailable.
    }
  }

  return (
    <>
      <ReportHeader
        title="Cost by trace"
        description="Every quality-inspection request, opened step by step with model and cost."
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
        <MetricCard
          label="Traces"
          value="1.0M"
          caption="Quality inspection"
        />
        <MetricCard
          label="Average cost per trace"
          value="$0.24"
          caption="Starting route · optimized $0.06"
        />
        <MetricCard label="Calls with an error" value="0.4%" caption="of routed calls" />
        <MetricCard label="Calls retried" value="3.1%" caption="of routed calls" />
      </MetricGrid>
      <ReportPanel
        title="Traces"
        actions={
          <SearchField>
            <TextInput
              size="sm"
              placeholder="Search"
              aria-label="Search traces"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              startIcon={<Search />}
            />
          </SearchField>
        }
      >
        <ReportTable
          aria-label="Cost by trace"
          $cols={[
            reportCol.compact,
            reportCol.compact,
            reportCol.metric,
            reportCol.metric,
            reportCol.metric,
            reportCol.metric,
            reportCol.metric,
            reportCol.icon,
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
              <HeaderCell aria-label="Details" />
            </HeaderRow>
          }
        >
          {rows.map(({ row, summary }) => {
            const expanded = expandedId === row.id;
            const stepTotals = totalsOf(row.steps);
            return (
              <Fragment key={row.id}>
                <DataRow selectable={false}>
                  <DataCell>
                    <ValueBadge>{row.id}</ValueBadge>
                  </DataCell>
                  <DataCell>
                    <ValueBadge>{row.time}</ValueBadge>
                  </DataCell>
                  <DataCell>
                    <ValueBadge>{String(summary.calls)}</ValueBadge>
                  </DataCell>
                  <DataCell>
                    <ValueBadge>{formatTokens(summary.tokens)}</ValueBadge>
                  </DataCell>
                  <DataCell>
                    <ValueBadge>{formatCost(summary.cost)}</ValueBadge>
                  </DataCell>
                  <DataCell>
                    <ValueBadge>{String(row.errors)}</ValueBadge>
                  </DataCell>
                  <DataCell>
                    <ValueBadge>{String(row.retries)}</ValueBadge>
                  </DataCell>
                  <DataCell>
                    <IconButton
                      size="xs"
                      variant="tonal"
                      label={expanded ? `Collapse ${row.id}` : `Expand ${row.id}`}
                      icon={expanded ? <ChevronUp /> : <ChevronDown />}
                      onClick={() => toggleExpanded(row.id)}
                    />
                  </DataCell>
                </DataRow>
                {expanded ? (
                  <ExpandPanel>
                    <ExpandTitle>
                      <TraceIdLabel>{row.id}</TraceIdLabel>
                      <PromptLabel>“{row.prompt}”</PromptLabel>
                      <IconButton
                        size="xs"
                        variant="tonal"
                        label={`Copy ${row.id} prompt`}
                        icon={<Copy />}
                        onClick={() => void copyPrompt(row.id, row.prompt)}
                      />
                    </ExpandTitle>
                    <ReportTable
                      aria-label={`${row.id} call steps`}
                      $cols={[
                        reportCol.icon,
                        reportCol.wide,
                        reportCol.compact,
                        reportCol.metric,
                        reportCol.metric,
                        reportCol.metric,
                        reportCol.metric,
                      ].join(' ')}
                      header={
                        <HeaderRow>
                          <HeaderCell>#</HeaderCell>
                          <HeaderCell>Step</HeaderCell>
                          <HeaderCell>Model</HeaderCell>
                          <HeaderCell>Input tokens</HeaderCell>
                          <HeaderCell>Output</HeaderCell>
                          <HeaderCell>Response time</HeaderCell>
                          <HeaderCell>Cost</HeaderCell>
                        </HeaderRow>
                      }
                    >
                      {row.steps.map((step) => {
                        const stepId = `${row.id}-${step.step}`;
                        return (
                          <DataRow key={stepId} selectable={false}>
                            <DataCell>
                              <StepValue>{String(step.step)}</StepValue>
                            </DataCell>
                            <DataCell>
                              <StepValue>{step.name}</StepValue>
                            </DataCell>
                            <DataCell>
                              <CellBadge color={modelBadgeColor(step.model)} tone="subtle" dot={false}>
                                {step.model}
                              </CellBadge>
                            </DataCell>
                            <DataCell>
                              <StepValue>{formatTokens(step.inputTokens)}</StepValue>
                            </DataCell>
                            <DataCell>
                              <StepValue>{formatTokens(step.outputTokens)}</StepValue>
                            </DataCell>
                            <DataCell>
                              <StepValue>{formatSeconds(step.responseSeconds)}</StepValue>
                            </DataCell>
                            <DataCell>
                              <StepValue>{formatCost(step.cost)}</StepValue>
                            </DataCell>
                          </DataRow>
                        );
                      })}
                      <DataRow selectable={false}>
                        <DataCell>
                          <TotalLabel>Total</TotalLabel>
                        </DataCell>
                        <DataCell />
                        <DataCell />
                        <DataCell>
                          <StepValue>{formatTokens(stepTotals.inputTokens)}</StepValue>
                        </DataCell>
                        <DataCell>
                          <StepValue>{formatTokens(stepTotals.outputTokens)}</StepValue>
                        </DataCell>
                        <DataCell>
                          <StepValue>{formatSeconds(stepTotals.responseSeconds)}</StepValue>
                        </DataCell>
                        <DataCell>
                          <StepValue>{formatCost(stepTotals.cost)}</StepValue>
                        </DataCell>
                      </DataRow>
                    </ReportTable>
                  </ExpandPanel>
                ) : null}
              </Fragment>
            );
          })}
        </ReportTable>
      </ReportPanel>
    </>
  );
}
