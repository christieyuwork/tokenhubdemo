import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Divider,
  Dropdown,
  IconButton,
  Modal,
  ModalContent,
  ModalFooter,
  NumberInput,
  Switch,
  TextInput,
} from '@cake-admin/cakeand';
import { Bell, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import styled from 'styled-components';
import { MetricCard, MetricGrid, ReportHeader, ReportPanel } from './ReportPage';

type RuleCategory = 'cost' | 'optimization' | 'operations';
type MetricUnit = 'usd' | 'percent';
type Comparator = 'above' | 'below';

interface AlertRule {
  id: string;
  category: RuleCategory;
  name: string;
  metric: string;
  comparator: Comparator;
  threshold: number;
  unit: MetricUnit;
  /** Percent buffer past the threshold before the alert fires. */
  tolerancePercent: number;
  scope: string;
  notify: string;
  enabled: boolean;
}

interface RuleFormState {
  name: string;
  category: RuleCategory;
  metric: string;
  comparator: Comparator;
  threshold: number;
  unit: MetricUnit;
  tolerancePercent: number;
  scope: string;
  notify: string;
}

const CATEGORY_META: { value: RuleCategory; label: string; description: string }[] = [
  {
    value: 'cost',
    label: 'Cost',
    description: 'Spend ceilings and invoice drift',
  },
  {
    value: 'optimization',
    label: 'Optimization',
    description: 'Routing mix, cache efficiency, and model choice',
  },
  {
    value: 'operations',
    label: 'Operations',
    description: 'Quotas, capacity, and fleet health',
  },
];

const CATEGORY_OPTIONS = CATEGORY_META.map(({ value, label }) => ({ value, label }));

const COMPARATOR_OPTIONS = [
  { value: 'above', label: 'Above' },
  { value: 'below', label: 'Below' },
];

const UNIT_OPTIONS = [
  { value: 'usd', label: 'USD ($)' },
  { value: 'percent', label: 'Percent (%)' },
];

const METRIC_PRESETS: { value: string; label: string; unit: MetricUnit; category: RuleCategory }[] = [
  { value: 'Daily spend', label: 'Daily spend', unit: 'usd', category: 'cost' },
  { value: 'Invoice variance', label: 'Invoice variance', unit: 'percent', category: 'cost' },
  { value: 'Cache hit rate', label: 'Cache hit rate', unit: 'percent', category: 'optimization' },
  {
    value: 'Premium model share',
    label: 'Premium model share',
    unit: 'percent',
    category: 'optimization',
  },
  { value: 'Model quota used', label: 'Model quota used', unit: 'percent', category: 'operations' },
  { value: 'GPU busy', label: 'GPU busy', unit: 'percent', category: 'operations' },
];

const INITIAL_RULES: AlertRule[] = [
  {
    id: 'daily-spend',
    category: 'cost',
    name: 'Daily spend ceiling',
    metric: 'Daily spend',
    comparator: 'above',
    threshold: 20000,
    unit: 'usd',
    tolerancePercent: 5,
    scope: 'All providers',
    notify: 'Email · Finance, Platform team',
    enabled: true,
  },
  {
    id: 'invoice-variance',
    category: 'cost',
    name: 'Invoice variance',
    metric: 'Invoice variance',
    comparator: 'above',
    threshold: 8,
    unit: 'percent',
    tolerancePercent: 2,
    scope: 'All providers',
    notify: 'Email · Finance',
    enabled: true,
  },
  {
    id: 'cache-hit',
    category: 'optimization',
    name: 'Cache hit floor',
    metric: 'Cache hit rate',
    comparator: 'below',
    threshold: 70,
    unit: 'percent',
    tolerancePercent: 3,
    scope: 'Crew scheduling',
    notify: 'Email · Platform team',
    enabled: true,
  },
  {
    id: 'premium-share',
    category: 'optimization',
    name: 'Premium routing share',
    metric: 'Premium model share',
    comparator: 'above',
    threshold: 35,
    unit: 'percent',
    tolerancePercent: 5,
    scope: 'All apps',
    notify: 'Email · Platform team',
    enabled: false,
  },
  {
    id: 'quota-80',
    category: 'operations',
    name: 'Frontier-L quota warning',
    metric: 'Model quota used',
    comparator: 'above',
    threshold: 80,
    unit: 'percent',
    tolerancePercent: 0,
    scope: 'Provider A · Frontier-L',
    notify: 'Email · Platform team',
    enabled: true,
  },
  {
    id: 'quota-100',
    category: 'operations',
    name: 'Frontier-L quota exhausted',
    metric: 'Model quota used',
    comparator: 'above',
    threshold: 100,
    unit: 'percent',
    tolerancePercent: 0,
    scope: 'Provider A · Frontier-L',
    notify: 'Email · Platform team',
    enabled: true,
  },
  {
    id: 'gpu-busy',
    category: 'operations',
    name: 'GPU busy sustained',
    metric: 'GPU busy',
    comparator: 'above',
    threshold: 90,
    unit: 'percent',
    tolerancePercent: 5,
    scope: 'DC1 fleet',
    notify: 'Email · Ops',
    enabled: false,
  },
];

const EMPTY_FORM: RuleFormState = {
  name: '',
  category: 'cost',
  metric: 'Daily spend',
  comparator: 'above',
  threshold: 1000,
  unit: 'usd',
  tolerancePercent: 5,
  scope: 'All providers',
  notify: 'Email · Platform team',
};

/*
  Shared track sizes so header + every rule row + every category card
  share one column rhythm. Fixed tracks (not auto) — cake& Switch would
  otherwise expand the first column past the header’s empty cell.
  Children use min-width: 0 so content cannot blow fixed tracks open.
*/
/*
  Floors are 0 so the rule grid shrinks inside ReportPage Content instead of
  widening the page. rem caps keep readable column targets on wide screens.
*/
const RULE_GRID_COLUMNS = `
  minmax(0, 3rem)
  minmax(0, 1fr)
  minmax(0, 5.5rem)
  minmax(0, 6.5rem)
  minmax(0, 6rem)
  minmax(0, 5rem)
  minmax(0, 4.5rem)
`;

const RULE_GRID_GAP = `var(--space-400)`;

const RuleList = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-100);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
`;

const RuleGrid = styled.div`
  display: grid;
  grid-template-columns: ${RULE_GRID_COLUMNS};
  column-gap: ${RULE_GRID_GAP};
  align-items: start;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding-inline: var(--space-100);

  & > * {
    min-width: 0;
    max-width: 100%;
  }
`;

const RuleListHeader = styled(RuleGrid)`
  align-items: end;
  padding-block: 0 var(--space-200);
`;

const ColumnLabel = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  letter-spacing: 0.02em;
  text-transform: uppercase;

  &[data-align='end'] {
    text-align: end;
  }
`;

const RuleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  padding-block: var(--space-500);
`;

const RuleRow = styled(RuleGrid)`
  align-items: start;
`;

const SwitchSlot = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: var(--space-025);
  overflow: hidden;
`;

const RuleIdentity = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;
`;

const RuleName = styled.p`
  margin: 0;
  overflow: hidden;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RuleMetric = styled.p`
  margin: 0;
  overflow: hidden;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RuleDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  margin-top: var(--space-150);
  min-width: 0;
`;

const RuleDetailLine = styled.p`
  margin: 0;
  overflow: hidden;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ValueCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;

  &[data-align='end'] {
    align-items: flex-end;
    text-align: end;
  }
`;

const ValuePrimary = styled.span`
  overflow: hidden;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusCell = styled.div`
  display: flex;
  justify-content: flex-start;
  padding-top: var(--space-025);
  min-width: 0;
`;

const RuleActions = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: var(--space-050);
  min-width: 0;
`;

const EmptyState = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-300);
`;

const FormFull = styled.div`
  grid-column: 1 / -1;
`;

const InlineEditor = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  margin-right: var(--space-100);
  margin-left: calc(var(--space-100) + 3rem + ${RULE_GRID_GAP});
  padding: var(--space-400);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-on-container-high);
`;

const InlineActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-200);
`;

function formatThreshold(value: number, unit: MetricUnit): string {
  if (unit === 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
  return `${value}%`;
}

function formatTolerance(percent: number): string {
  return percent > 0 ? `${percent}% buffer` : 'None';
}

function formatComparator(comparator: Comparator): string {
  return comparator === 'above' ? 'Above' : 'Below';
}

function formatFireAt(rule: Pick<AlertRule, 'comparator' | 'threshold' | 'unit' | 'tolerancePercent'>): string {
  if (rule.tolerancePercent <= 0) {
    return formatThreshold(rule.threshold, rule.unit);
  }
  const buffer = rule.threshold * (rule.tolerancePercent / 100);
  const effective =
    rule.comparator === 'above' ? rule.threshold + buffer : rule.threshold - buffer;
  return formatThreshold(Math.max(0, effective), rule.unit);
}

function formatFireDetail(rule: Pick<AlertRule, 'comparator' | 'threshold' | 'unit' | 'tolerancePercent'>): string {
  return `Fires at ${formatFireAt(rule)}`;
}

function ruleToForm(rule: AlertRule): RuleFormState {
  return {
    name: rule.name,
    category: rule.category,
    metric: rule.metric,
    comparator: rule.comparator,
    threshold: rule.threshold,
    unit: rule.unit,
    tolerancePercent: rule.tolerancePercent,
    scope: rule.scope,
    notify: rule.notify,
  };
}

function formDefaultsForCategory(category: RuleCategory): RuleFormState {
  const preset = METRIC_PRESETS.find((item) => item.category === category) ?? METRIC_PRESETS[0];
  return {
    ...EMPTY_FORM,
    category,
    metric: preset.value,
    unit: preset.unit,
    comparator: preset.unit === 'percent' && preset.value.includes('hit') ? 'below' : 'above',
    threshold: preset.unit === 'usd' ? 20000 : 80,
    name: '',
  };
}

function applyFormToRule(rule: AlertRule, form: RuleFormState): AlertRule {
  return {
    ...rule,
    name: form.name.trim(),
    category: form.category,
    metric: form.metric,
    comparator: form.comparator,
    threshold: form.threshold,
    unit: form.unit,
    tolerancePercent: form.tolerancePercent,
    scope: form.scope.trim() || 'All providers',
    notify: form.notify.trim() || 'Email · Platform team',
  };
}

interface RuleFormFieldsProps {
  form: RuleFormState;
  onChange: <K extends keyof RuleFormState>(key: K, value: RuleFormState[K]) => void;
  onCategoryChange: (value: string) => void;
  onMetricChange: (value: string) => void;
  /** When editing inline, keep category fixed to the card the row lives in. */
  lockCategory?: boolean;
}

function RuleFormFields({
  form,
  onChange,
  onCategoryChange,
  onMetricChange,
  lockCategory = false,
}: RuleFormFieldsProps) {
  const metricOptions = METRIC_PRESETS.filter((item) => item.category === form.category).map(
    (item) => ({ value: item.value, label: item.label }),
  );

  return (
    <FormGrid>
      <FormFull>
        <TextInput
          label="Rule name"
          required
          value={form.name}
          onChange={(event) => onChange('name', event.target.value)}
          placeholder="e.g. Daily spend ceiling"
        />
      </FormFull>
      {lockCategory ? null : (
        <Dropdown
          label="Category"
          options={CATEGORY_OPTIONS}
          value={form.category}
          onValueChange={onCategoryChange}
        />
      )}
      <Dropdown
        label="Metric"
        options={metricOptions}
        value={form.metric}
        onValueChange={onMetricChange}
      />
      <Dropdown
        label="Condition"
        options={COMPARATOR_OPTIONS}
        value={form.comparator}
        onValueChange={(value) => onChange('comparator', value as Comparator)}
      />
      <Dropdown
        label="Unit"
        options={UNIT_OPTIONS}
        value={form.unit}
        onValueChange={(value) => onChange('unit', value as MetricUnit)}
      />
      <NumberInput
        label="Threshold"
        value={form.threshold}
        min={0}
        step={form.unit === 'usd' ? 500 : 1}
        suffix={form.unit === 'percent' ? '%' : undefined}
        helperText={form.unit === 'usd' ? 'Amount in USD' : undefined}
        onValueChange={(value) => onChange('threshold', value ?? 0)}
      />
      <NumberInput
        label="Tolerance"
        helperText="Percent buffer past the threshold before the alert fires"
        value={form.tolerancePercent}
        min={0}
        max={50}
        step={1}
        suffix="%"
        onValueChange={(value) => onChange('tolerancePercent', value ?? 0)}
      />
      <FormFull>
        <TextInput
          label="Scope"
          value={form.scope}
          onChange={(event) => onChange('scope', event.target.value)}
          placeholder="Provider, model, or app"
        />
      </FormFull>
      <FormFull>
        <TextInput
          label="Notify"
          value={form.notify}
          onChange={(event) => onChange('notify', event.target.value)}
          placeholder="Email · team"
        />
      </FormFull>
    </FormGrid>
  );
}

export function AlertRules() {
  const [rules, setRules] = useState<AlertRule[]>(INITIAL_RULES);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<RuleFormState>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RuleFormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeCount = rules.filter((rule) => rule.enabled).length;
  const pausedCount = rules.length - activeCount;
  const categoriesUsed = new Set(rules.map((rule) => rule.category)).size;

  const rulesByCategory = useMemo(() => {
    const map: Record<RuleCategory, AlertRule[]> = {
      cost: [],
      optimization: [],
      operations: [],
    };
    for (const rule of rules) {
      map[rule.category].push(rule);
    }
    return map;
  }, [rules]);

  const deleteTarget = rules.find((rule) => rule.id === deleteId) ?? null;

  function openCreate(category: RuleCategory) {
    setExpandedId(null);
    setCreateForm(formDefaultsForCategory(category));
    setCreateOpen(true);
  }

  function closeCreate(open: boolean) {
    setCreateOpen(open);
  }

  function toggleExpand(rule: AlertRule) {
    if (expandedId === rule.id) {
      setExpandedId(null);
      return;
    }
    setCreateOpen(false);
    setExpandedId(rule.id);
    setEditForm(ruleToForm(rule));
  }

  function updateCreateForm<K extends keyof RuleFormState>(key: K, value: RuleFormState[K]) {
    setCreateForm((current) => ({ ...current, [key]: value }));
  }

  function updateEditForm<K extends keyof RuleFormState>(key: K, value: RuleFormState[K]) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  function handleCreateCategoryChange(value: string) {
    setCreateForm(formDefaultsForCategory(value as RuleCategory));
  }

  function handleCreateMetricChange(value: string) {
    const preset = METRIC_PRESETS.find((item) => item.value === value);
    setCreateForm((current) => ({
      ...current,
      metric: value,
      unit: preset?.unit ?? current.unit,
    }));
  }

  function handleEditMetricChange(value: string) {
    const preset = METRIC_PRESETS.find((item) => item.value === value);
    setEditForm((current) => ({
      ...current,
      metric: value,
      unit: preset?.unit ?? current.unit,
    }));
  }

  function handleCreate() {
    const trimmedName = createForm.name.trim();
    if (!trimmedName) return;

    setRules((current) => [
      ...current,
      {
        id: `rule-${Date.now()}`,
        name: trimmedName,
        category: createForm.category,
        metric: createForm.metric,
        comparator: createForm.comparator,
        threshold: createForm.threshold,
        unit: createForm.unit,
        tolerancePercent: createForm.tolerancePercent,
        scope: createForm.scope.trim() || 'All providers',
        notify: createForm.notify.trim() || 'Email · Platform team',
        enabled: true,
      },
    ]);
    setCreateOpen(false);
  }

  function handleSaveEdit() {
    if (!expandedId || !editForm.name.trim()) return;
    setRules((current) =>
      current.map((rule) => (rule.id === expandedId ? applyFormToRule(rule, editForm) : rule)),
    );
    setExpandedId(null);
  }

  function handleCancelEdit() {
    setExpandedId(null);
  }

  function handleToggle(id: string, enabled: boolean) {
    setRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, enabled } : rule)),
    );
  }

  function confirmDelete() {
    if (!deleteId) return;
    if (expandedId === deleteId) setExpandedId(null);
    setRules((current) => current.filter((rule) => rule.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <>
      <ReportHeader
        title="Alert rules"
        description="Thresholds, tolerances, and who gets notified when they fire"
      />
      <MetricGrid>
        <MetricCard label="Active rules" value={String(activeCount)} caption="Enabled now" />
        <MetricCard label="Paused" value={String(pausedCount)} caption="Toggled off" />
        <MetricCard label="Total rules" value={String(rules.length)} caption="Across all categories" />
        <MetricCard
          label="Categories"
          value={String(categoriesUsed)}
          caption="Cost, Optimization, Operations"
        />
      </MetricGrid>

      {CATEGORY_META.map((category) => {
        const categoryRules = rulesByCategory[category.value];
        return (
          <ReportPanel
            key={category.value}
            title={category.label}
            note={category.description}
            actions={
              <Button
                size="sm"
                variant="tonal"
                intent="secondary"
                startIcon={<Plus size={16} />}
                onClick={() => openCreate(category.value)}
              >
                Add rule
              </Button>
            }
          >
            {categoryRules.length === 0 ? (
              <EmptyState>No rules in this category yet.</EmptyState>
            ) : (
              <RuleList>
                <RuleListHeader aria-hidden="true">
                  <span />
                  <ColumnLabel>Rule</ColumnLabel>
                  <ColumnLabel>Condition</ColumnLabel>
                  <ColumnLabel data-align="end">Threshold</ColumnLabel>
                  <ColumnLabel data-align="end">Tolerance</ColumnLabel>
                  <ColumnLabel>Status</ColumnLabel>
                  <span />
                </RuleListHeader>
                {categoryRules.map((rule, index) => {
                  const expanded = expandedId === rule.id;
                  return (
                    <div key={rule.id}>
                      {index > 0 ? <Divider weight="weak" /> : null}
                      <RuleBlock>
                        <RuleRow>
                          <SwitchSlot>
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                              aria-label={`Enable ${rule.name}`}
                            />
                          </SwitchSlot>
                          <RuleIdentity>
                            <RuleName>{rule.name}</RuleName>
                            <RuleMetric>{rule.metric}</RuleMetric>
                            <RuleDetail>
                              <RuleDetailLine>{formatFireDetail(rule)}</RuleDetailLine>
                              <RuleDetailLine>
                                {rule.scope}
                                {' · '}
                                {rule.notify}
                              </RuleDetailLine>
                            </RuleDetail>
                          </RuleIdentity>
                          <ValueCell>
                            <ValuePrimary>{formatComparator(rule.comparator)}</ValuePrimary>
                          </ValueCell>
                          <ValueCell data-align="end">
                            <ValuePrimary>{formatThreshold(rule.threshold, rule.unit)}</ValuePrimary>
                          </ValueCell>
                          <ValueCell data-align="end">
                            <ValuePrimary>{formatTolerance(rule.tolerancePercent)}</ValuePrimary>
                          </ValueCell>
                          <StatusCell>
                            <Badge
                              color={rule.enabled ? 'green' : 'secondary'}
                              tone="subtle"
                              dot={false}
                            >
                              {rule.enabled ? 'Active' : 'Paused'}
                            </Badge>
                          </StatusCell>
                          <RuleActions>
                            <IconButton
                              size="sm"
                              variant={expanded ? 'tonal' : 'ghost'}
                              intent="secondary"
                              label={expanded ? `Collapse ${rule.name}` : `Edit ${rule.name}`}
                              icon={expanded ? <ChevronUp /> : <Pencil />}
                              onClick={() => toggleExpand(rule)}
                              aria-expanded={expanded}
                            />
                            <IconButton
                              size="sm"
                              variant="ghost"
                              intent="secondary"
                              label={`Delete ${rule.name}`}
                              icon={<Trash2 />}
                              onClick={() => setDeleteId(rule.id)}
                            />
                          </RuleActions>
                        </RuleRow>

                        {expanded ? (
                          <InlineEditor>
                            <RuleFormFields
                              form={editForm}
                              onChange={updateEditForm}
                              onCategoryChange={() => undefined}
                              onMetricChange={handleEditMetricChange}
                              lockCategory
                            />
                            <InlineActions>
                              <Button
                                size="sm"
                                variant="ghost"
                                intent="secondary"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={!editForm.name.trim()}
                              >
                                Save changes
                              </Button>
                            </InlineActions>
                          </InlineEditor>
                        ) : null}
                      </RuleBlock>
                    </div>
                  );
                })}
              </RuleList>
            )}
          </ReportPanel>
        );
      })}

      <Modal
        open={createOpen}
        onOpenChange={closeCreate}
        title="Add alert rule"
        subtitle="Set the metric, threshold, and tolerance buffer before notify."
        modalIcon="icon"
        modalIconSlot={<Bell />}
        footer={
          <ModalFooter
            checkbox={null}
            secondaryActionLabel="Cancel"
            onSecondaryAction={() => closeCreate(false)}
            primaryActionLabel="Create rule"
            onPrimaryAction={handleCreate}
            primaryActionDisabled={!createForm.name.trim()}
          />
        }
      >
        <ModalContent descriptionAsDialogDescription={false}>
          <RuleFormFields
            form={createForm}
            onChange={updateCreateForm}
            onCategoryChange={handleCreateCategoryChange}
            onMetricChange={handleCreateMetricChange}
          />
        </ModalContent>
      </Modal>

      <Modal
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete alert rule"
        subtitle={
          deleteTarget
            ? `Remove “${deleteTarget.name}”? This cannot be undone in the prototype.`
            : undefined
        }
        modalIcon="error"
        footer={
          <ModalFooter
            checkbox={null}
            secondaryActionLabel="Cancel"
            onSecondaryAction={() => setDeleteId(null)}
            primaryActionLabel="Delete"
            onPrimaryAction={confirmDelete}
          />
        }
      >
        <ModalContent
          description={
            deleteTarget
              ? 'History already fired by this rule stays on the Alerts page.'
              : undefined
          }
          descriptionAsDialogDescription={false}
        />
      </Modal>
    </>
  );
}
