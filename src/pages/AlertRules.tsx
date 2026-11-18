import { useId, useMemo, useState } from 'react';
import {
  Button,
  Dropdown,
  Modal,
  ModalContent,
  ModalFooter,
  NumberInput,
  Switch,
  TextInput,
} from '@cake-admin/cakeand';
import { Bell, ChevronDown, Plus } from 'lucide-react';
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
    notify: 'Email \u00B7 Finance, Platform team',
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
    notify: 'Email \u00B7 Finance',
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
    notify: 'Email \u00B7 Platform team',
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
    notify: 'Email \u00B7 Platform team',
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
    scope: 'Provider A \u00B7 Frontier-L',
    notify: 'Email \u00B7 Platform team',
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
    scope: 'Provider A \u00B7 Frontier-L',
    notify: 'Email \u00B7 Platform team',
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
    notify: 'Email \u00B7 Ops',
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
  notify: 'Email \u00B7 Platform team',
};

const RuleList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
`;

const Card = styled.li<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  border: var(--stroke-100) solid var(--color-stroke-border);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-canvas);
  border-inline-start: var(--stroke-300) solid
    ${({ $active }) =>
      $active ? 'var(--color-success-success)' : 'var(--color-disabled-disabled)'};
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  padding: var(--space-300) var(--space-400);
  min-width: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-300);
  min-width: 0;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
`;

const Name = styled.h3`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const Scope = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

const StatusToggle = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  margin-inline-start: auto;
  padding-top: var(--space-025);
`;

const KpiStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: baseline;
  column-gap: var(--space-400);
  row-gap: var(--space-100);
  padding: var(--space-150) var(--space-300);
  border-radius: var(--radius-150);
  background: var(--color-surfaces-container);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Kpi = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-100);
  min-width: 0;
`;

const KpiLabel = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  white-space: nowrap;
`;

const KpiValue = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-200);
  min-width: 0;
`;

const Notify = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  min-width: 0;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-100);
  margin-inline-start: auto;
`;

const DetailsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  padding: var(--space-300) var(--space-400) var(--space-400);
  border-top: var(--stroke-100) solid var(--color-stroke-border);
  background: var(--color-surfaces-container);
`;

const InlineActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-200);
`;

const Chevron = styled(ChevronDown)<{ $open: boolean }>`
  transition: transform 160ms ease;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
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

function formatFireAt(
  rule: Pick<AlertRule, 'comparator' | 'threshold' | 'unit' | 'tolerancePercent'>,
): string {
  if (rule.tolerancePercent <= 0) {
    return formatThreshold(rule.threshold, rule.unit);
  }
  const buffer = rule.threshold * (rule.tolerancePercent / 100);
  const effective =
    rule.comparator === 'above' ? rule.threshold + buffer : rule.threshold - buffer;
  return formatThreshold(Math.max(0, effective), rule.unit);
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
    notify: form.notify.trim() || 'Email \u00B7 Platform team',
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
          placeholder="Email \u00B7 team"
        />
      </FormFull>
    </FormGrid>
  );
}

export function AlertRules() {
  const detailsBaseId = useId();
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
        notify: createForm.notify.trim() || 'Email \u00B7 Platform team',
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
        description="Thresholds, tolerances, and who gets notified when they fire."
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
              <RuleList aria-label={`${category.label} alert rules`}>
                {categoryRules.map((rule) => {
                  const active = rule.enabled;
                  const expanded = expandedId === rule.id;
                  const detailsId = `${detailsBaseId}-${rule.id}-details`;

                  return (
                    <Card key={rule.id} $active={active}>
                      <CardBody>
                        <Header>
                          <HeaderCopy>
                            <Name>{rule.name}</Name>
                            <Scope>{rule.scope}</Scope>
                          </HeaderCopy>
                          <StatusToggle>
                            <Switch
                              label={active ? 'Active' : 'Paused'}
                              checked={active}
                              onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                            />
                          </StatusToggle>
                        </Header>

                        <KpiStrip aria-label="Rule thresholds">
                          <Kpi>
                            <KpiLabel>Metric</KpiLabel>
                            <KpiValue>{rule.metric}</KpiValue>
                          </Kpi>
                          <Kpi>
                            <KpiLabel>Condition</KpiLabel>
                            <KpiValue>{formatComparator(rule.comparator)}</KpiValue>
                          </Kpi>
                          <Kpi>
                            <KpiLabel>Threshold</KpiLabel>
                            <KpiValue>{formatThreshold(rule.threshold, rule.unit)}</KpiValue>
                          </Kpi>
                          <Kpi>
                            <KpiLabel>Fires at</KpiLabel>
                            <KpiValue>
                              {formatFireAt(rule)}
                              {rule.tolerancePercent > 0
                                ? ` (${formatTolerance(rule.tolerancePercent)})`
                                : ''}
                            </KpiValue>
                          </Kpi>
                        </KpiStrip>

                        <Footer>
                          <Notify>{rule.notify}</Notify>
                          <Actions>
                            <Button
                              size="sm"
                              intent="secondary"
                              variant="outline"
                              onClick={() => setDeleteId(rule.id)}
                            >
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              intent="secondary"
                              variant="ghost"
                              aria-expanded={expanded}
                              aria-controls={detailsId}
                              endIcon={<Chevron size={16} $open={expanded} aria-hidden />}
                              onClick={() => toggleExpand(rule)}
                            >
                              {expanded ? 'Hide edit' : 'Edit'}
                            </Button>
                          </Actions>
                        </Footer>
                      </CardBody>

                      {expanded ? (
                        <DetailsPanel id={detailsId}>
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
                        </DetailsPanel>
                      ) : null}
                    </Card>
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
            checkbox={false}
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
            ? `Remove "${deleteTarget.name}"? This cannot be undone in the prototype.`
            : undefined
        }
        modalIcon="error"
        footer={
          <ModalFooter
            checkbox={false}
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
