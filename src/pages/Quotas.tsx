import { useMemo, useState } from 'react';
import {
  Button,
  DataRow,
  Dropdown,
  HeaderCell,
  HeaderRow,
  Modal,
  ModalContent,
  ModalFooter,
  NumberInput,
  ProgressBar,
  TextInput,
} from '@cake-admin/cakeand';
import { Gauge, Plus } from 'lucide-react';
import {
  ACCESS_KEYS,
  cloneSeed,
  formatQuotaAmount,
  MODELS,
  modelById,
  quotaRemaining,
  quotaUsagePercent,
  QUOTAS,
  SAMPLE_DATA_NOTE,
  scopeLabel,
  WORKSPACES,
  type ProviderDisplay,
  type QuotaLimitType,
  type QuotaPeriod,
  type QuotaRecord,
  type QuotaStatus,
} from '../data/tokenOpsConfig';
import {
  ConfigDetailDrawer,
  DrawerField,
  DrawerLabel,
  DrawerNote,
  DrawerSection,
  DrawerSectionTitle,
  DrawerValue,
} from '../components/config/ConfigDetailDrawer';
import { RowActionsMenu } from '../components/config/RowActionsMenu';
import { configStatusBadgeColor } from '../components/config/statusBadges';
import { SortHeader, type SortDir } from '../components/config/SortHeader';
import {
  ConfigSearch,
  FormRow,
  FormStack,
  HelperMuted,
  WarningText,
} from '../components/config/ConfigPageChrome';
import {
  CellBadge,
  CompactDataCell,
  MetricCard,
  MetricGrid,
  ReportFilterDropdown,
  HeaderActionButton,
  ReportHeader,
  ReportPanel,
  ReportTable,
  ValueBadge,
  WideDataCell,
  reportCol,
} from './ReportPage';

const ALL = 'all';
type SortKey = 'quota' | 'scope' | 'usage' | 'remaining' | 'status' | 'resets';

interface QuotasProps {
  onNavigate?: (section: string) => void;
}

function deriveStatus(used: number, limit: number): QuotaStatus {
  const pct = limit <= 0 ? 0 : (used / limit) * 100;
  if (pct >= 100) return 'Exceeded';
  if (pct >= 85) return 'Near limit';
  return 'On track';
}

function progressColor(status: QuotaStatus): 'success' | 'warn' | 'error' {
  if (status === 'Exceeded') return 'error';
  if (status === 'Near limit') return 'warn';
  return 'success';
}

export function Quotas({ onNavigate }: QuotasProps) {
  const [rows, setRows] = useState(() => cloneSeed(QUOTAS));
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState(ALL);
  const [model, setModel] = useState(ALL);
  const [period, setPeriod] = useState(ALL);
  const [limitType, setLimitType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('usage');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    provider: 'Provider A' as ProviderDisplay,
    modelId: '',
    limitType: 'USD' as QuotaLimitType,
    limitValue: 1000,
    period: 'Monthly' as QuotaPeriod,
    resets: '2025-12-01',
    workspaceId: '',
    keyId: '',
    status: 'On track' as QuotaStatus,
  });

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (provider !== ALL && row.provider !== provider) return false;
      if (model !== ALL && row.modelId !== model) return false;
      if (period !== ALL && row.period !== period) return false;
      if (limitType !== ALL && row.limitType !== limitType) return false;
      if (status !== ALL && row.status !== status) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        scopeLabel(row).toLowerCase().includes(q)
      );
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av =
        sortKey === 'quota'
          ? a.name
          : sortKey === 'scope'
            ? scopeLabel(a)
            : sortKey === 'usage'
              ? quotaUsagePercent(a)
              : sortKey === 'remaining'
                ? quotaRemaining(a)
                : sortKey === 'status'
                  ? a.status
                  : a.resets;
      const bv =
        sortKey === 'quota'
          ? b.name
          : sortKey === 'scope'
            ? scopeLabel(b)
            : sortKey === 'usage'
              ? quotaUsagePercent(b)
              : sortKey === 'remaining'
                ? quotaRemaining(b)
                : sortKey === 'status'
                  ? b.status
                  : b.resets;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, search, provider, model, period, limitType, status, sortKey, sortDir]);

  /** Match demo headline: monthly provider USD remaining (excludes model/weekly scopes). */
  const remainingSpend = rows
    .filter((r) => r.limitType === 'USD' && r.period === 'Monthly' && !r.modelId)
    .reduce((sum, r) => sum + quotaRemaining(r), 0);

  function toggleSort(key: string) {
    const next = key as SortKey;
    if (sortKey === next) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(next);
      setSortDir(next === 'usage' ? 'desc' : 'asc');
    }
  }

  function openCreate() {
    setEditingId(null);
    setFormError('');
    setForm({
      name: '',
      provider: 'Provider A',
      modelId: '',
      limitType: 'USD',
      limitValue: 1000,
      period: 'Monthly',
      resets: '2025-12-01',
      workspaceId: '',
      keyId: '',
      status: 'On track',
    });
    setModalOpen(true);
  }

  function openEdit(row: QuotaRecord) {
    setEditingId(row.id);
    setFormError('');
    setForm({
      name: row.name,
      provider: row.provider,
      modelId: row.modelId ?? '',
      limitType: row.limitType,
      limitValue: row.limitValue,
      period: row.period,
      resets: row.resets,
      workspaceId: row.workspaceId ?? '',
      keyId: row.keyId ?? '',
      status: row.status,
    });
    setModalOpen(true);
  }

  function saveQuota() {
    if (!form.name.trim()) {
      setFormError('Quota name is required.');
      return;
    }
    if (!form.provider) {
      setFormError('Provider is required.');
      return;
    }
    if (form.limitValue <= 0) {
      setFormError('Limit must be greater than zero.');
      return;
    }
    if (form.modelId) {
      const modelRecord = MODELS.find((m) => m.id === form.modelId);
      if (!modelRecord || modelRecord.provider !== form.provider) {
        setFormError('Model must belong to the selected provider.');
        return;
      }
    }

    if (editingId) {
      setRows((prev) =>
        prev.map((row) =>
          row.id === editingId
            ? {
                ...row,
                name: form.name.trim(),
                provider: form.provider,
                modelId: form.modelId || null,
                scopeKind: form.modelId ? 'Provider and model' : 'Provider',
                limitType: form.limitType,
                limitValue: form.limitValue,
                period: form.period,
                resets: form.resets,
                workspaceId: form.workspaceId || null,
                keyId: form.keyId || null,
                status: deriveStatus(row.usedValue, form.limitValue),
              }
            : row,
        ),
      );
      setSelectedId(editingId);
    } else {
      const id = `quota-local-${rows.length + 1}`;
      const usedValue = Math.round(form.limitValue * 0.12);
      const next: QuotaRecord = {
        id,
        name: form.name.trim(),
        scopeKind: form.modelId ? 'Provider and model' : 'Provider',
        provider: form.provider,
        modelId: form.modelId || null,
        limitType: form.limitType,
        limitValue: form.limitValue,
        usedValue,
        period: form.period,
        resets: form.resets,
        status: deriveStatus(usedValue, form.limitValue),
        workspaceId: form.workspaceId || null,
        keyId: form.keyId || null,
        alertRuleId: null,
        usageSource: 'Simulated consumed usage',
        dailyUsage: [
          { day: 'Mon', value: Math.round(usedValue / 7) },
          { day: 'Tue', value: Math.round(usedValue / 7) },
          { day: 'Wed', value: Math.round(usedValue / 7) },
          { day: 'Thu', value: Math.round(usedValue / 7) },
          { day: 'Fri', value: Math.round(usedValue / 7) },
          { day: 'Sat', value: Math.round(usedValue / 10) },
          { day: 'Sun', value: Math.round(usedValue / 10) },
        ],
        exceededBehavior:
          'When exceeded, TokenOps flags the quota. Live traffic blocking is illustrative in this prototype.',
        hasUnpricedUsage: form.limitType === 'USD' && form.provider === 'Provider B',
      };
      setRows((prev) => [next, ...prev]);
      setSelectedId(id);
    }
    setModalOpen(false);
  }

  const modelsForProvider = MODELS.filter((m) => m.provider === form.provider);

  return (
    <>
      <ReportHeader
        title="Quotas"
        description="Set usage and spending limits for providers and models."
        actions={
          <HeaderActionButton startIcon={<Plus size={16} />} onClick={openCreate}>
            Create quota
          </HeaderActionButton>
        }
        filters={
          <>
            <ReportFilterDropdown
              label="Provider"
              value={provider}
              options={[
                { value: ALL, label: 'All' },
                { value: 'Provider A', label: 'Provider A' },
                { value: 'Provider B', label: 'Provider B' },
                { value: 'Self-hosted (AIC)', label: 'Self-hosted (AIC)' },
              ]}
              onValueChange={setProvider}
            />
            <ReportFilterDropdown
              label="Model"
              value={model}
              options={[
                { value: ALL, label: 'All' },
                ...MODELS.map((m) => ({ value: m.id, label: m.displayName })),
              ]}
              onValueChange={setModel}
            />
            <ReportFilterDropdown
              label="Period"
              value={period}
              options={[
                { value: ALL, label: 'All' },
                { value: 'Daily', label: 'Daily' },
                { value: 'Weekly', label: 'Weekly' },
                { value: 'Monthly', label: 'Monthly' },
              ]}
              onValueChange={setPeriod}
            />
            <ReportFilterDropdown
              label="Limit type"
              value={limitType}
              options={[
                { value: ALL, label: 'All' },
                { value: 'USD', label: 'USD' },
                { value: 'Tokens', label: 'Tokens' },
              ]}
              onValueChange={setLimitType}
            />
            <ReportFilterDropdown
              label="Status"
              value={status}
              options={[
                { value: ALL, label: 'All' },
                { value: 'On track', label: 'On track' },
                { value: 'Near limit', label: 'Near limit' },
                { value: 'Exceeded', label: 'Exceeded' },
              ]}
              onValueChange={setStatus}
            />
          </>
        }
      />

      <MetricGrid>
        <MetricCard label="Active quotas" value={String(rows.length)} caption={SAMPLE_DATA_NOTE} />
        <MetricCard
          label="Near limit"
          value={String(rows.filter((r) => r.status === 'Near limit').length)}
          caption="85% or higher"
        />
        <MetricCard
          label="Exceeded"
          value={String(rows.filter((r) => r.status === 'Exceeded').length)}
          caption="Over the configured limit"
        />
        <MetricCard
          label="Estimated remaining spend"
          value={formatQuotaAmount(remainingSpend, 'USD')}
          caption="Across USD quotas"
        />
      </MetricGrid>

      <ReportPanel
        title="Usage and spend limits"
        note="Quotas define limits. Alert rules notify when those limits are approached."
        actions={<ConfigSearch value={search} onChange={setSearch} placeholder="Search quotas" />}
      >
        <ReportTable
          aria-label="Quotas"
          $cols={[
            reportCol.widePlus,
            reportCol.wide,
            reportCol.metric,
            reportCol.compact,
            reportCol.metric,
            reportCol.metric,
            reportCol.compact,
            reportCol.compact,
            reportCol.compact,
            reportCol.icon,
          ].join(' ')}
          header={
            <HeaderRow>
              <SortHeader label="Quota" columnKey="quota" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} wide />
              <SortHeader label="Scope" columnKey="scope" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} wide />
              <HeaderCell>Limit</HeaderCell>
              <HeaderCell>Period</HeaderCell>
              <HeaderCell>Used</HeaderCell>
              <SortHeader label="Remaining" columnKey="remaining" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Usage" columnKey="usage" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Resets" columnKey="resets" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Status" columnKey="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <HeaderCell>Actions</HeaderCell>
            </HeaderRow>
          }
        >
          {filtered.map((row, index) => {
            const pct = quotaUsagePercent(row);
            return (
              <DataRow
                key={row.id}
                stripe={index % 2 ? 'inverse' : 'default'}
                selectable={false}
                interactive
                selected={selectedId === row.id}
                onClick={() => setSelectedId(row.id)}
              >
                <WideDataCell>{row.name}</WideDataCell>
                <WideDataCell>{scopeLabel(row)}</WideDataCell>
                <CompactDataCell>
                  <ValueBadge>{formatQuotaAmount(row.limitValue, row.limitType)}</ValueBadge>
                </CompactDataCell>
                <CompactDataCell>{row.period}</CompactDataCell>
                <CompactDataCell>
                  <ValueBadge>{formatQuotaAmount(row.usedValue, row.limitType)}</ValueBadge>
                </CompactDataCell>
                <CompactDataCell>
                  <ValueBadge>{formatQuotaAmount(quotaRemaining(row), row.limitType)}</ValueBadge>
                </CompactDataCell>
                <CompactDataCell>
                  <span aria-label={`${pct} percent used`}>{pct}%</span>
                </CompactDataCell>
                <CompactDataCell>{row.resets}</CompactDataCell>
                <CompactDataCell>
                  <CellBadge color={configStatusBadgeColor(row.status)} tone="subtle" dot={false}>
                    {row.status}
                  </CellBadge>
                </CompactDataCell>
                <CompactDataCell>
                  <RowActionsMenu
                    label={`Actions for ${row.name}`}
                    actions={[
                      { id: 'view', label: 'View details', onSelect: () => setSelectedId(row.id) },
                      { id: 'edit', label: 'Edit quota', onSelect: () => openEdit(row) },
                      {
                        id: 'alert',
                        label: row.alertRuleId ? 'View alert rule' : 'Create alert rule',
                        onSelect: () => onNavigate?.('alert-rules'),
                      },
                    ]}
                  />
                </CompactDataCell>
              </DataRow>
            );
          })}
        </ReportTable>
      </ReportPanel>

      <ConfigDetailDrawer
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        title={selected?.name ?? 'Quota'}
        subtitle={selected ? scopeLabel(selected) : undefined}
        width={460}
        footer={
          selected ? (
            <>
              <Button size="sm" variant="tonal" intent="secondary" onClick={() => openEdit(selected)}>
                Edit quota
              </Button>
              <Button
                size="sm"
                intent="secondary"
                onClick={() => onNavigate?.('alert-rules')}
              >
                {selected.alertRuleId ? 'View alert rule' : 'Create alert rule'}
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <>
            <DrawerSection>
              <DrawerSectionTitle>Current usage</DrawerSectionTitle>
              <ProgressBar
                value={Math.min(100, quotaUsagePercent(selected))}
                max={100}
                color={progressColor(selected.status)}
                label={`${formatQuotaAmount(selected.usedValue, selected.limitType)} used`}
                labelValue={`${quotaUsagePercent(selected)}%`}
                helperText={`${formatQuotaAmount(quotaRemaining(selected), selected.limitType)} remaining · ${selected.status}`}
                showLabelIcon={false}
                showHelperIcon={false}
              />
              <DrawerField>
                <DrawerLabel>Limit</DrawerLabel>
                <DrawerValue>{formatQuotaAmount(selected.limitValue, selected.limitType)}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Period</DrawerLabel>
                <DrawerValue>{selected.period}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Resets</DrawerLabel>
                <DrawerValue>{selected.resets}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Scope</DrawerLabel>
                <DrawerValue>{scopeLabel(selected)}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Usage source</DrawerLabel>
                <DrawerValue>{selected.usageSource}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Related provider</DrawerLabel>
                <DrawerValue>{selected.provider}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Related model</DrawerLabel>
                <DrawerValue>
                  {selected.modelId
                    ? (modelById(selected.modelId)?.displayName ?? selected.modelId)
                    : 'All models for provider'}
                </DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Related access keys</DrawerLabel>
                <DrawerValue>
                  {selected.keyId
                    ? (ACCESS_KEYS.find((k) => k.id === selected.keyId)?.name ?? selected.keyId)
                    : 'None linked'}
                </DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Linked alert rule</DrawerLabel>
                <DrawerValue>{selected.alertRuleId ?? 'None'}</DrawerValue>
              </DrawerField>
            </DrawerSection>
            <DrawerSection>
              <DrawerSectionTitle>Recent daily usage</DrawerSectionTitle>
              {selected.dailyUsage.map((day) => (
                <DrawerField key={day.day}>
                  <DrawerLabel>{day.day}</DrawerLabel>
                  <DrawerValue>{formatQuotaAmount(day.value, selected.limitType)}</DrawerValue>
                </DrawerField>
              ))}
            </DrawerSection>
            {selected.hasUnpricedUsage && selected.limitType === 'USD' ? (
              <WarningText>
                Cost-based usage may be incomplete because some token classes are Unpriced.
              </WarningText>
            ) : null}
            <DrawerNote>{selected.exceededBehavior}</DrawerNote>
            <HelperMuted>
              Quota enforcement is illustrative in this demo and does not block live production
              traffic unless labeled as simulated.
            </HelperMuted>
          </>
        ) : null}
      </ConfigDetailDrawer>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? 'Edit quota' : 'Create quota'}
        subtitle="Define a usage or spending limit by provider and optional model."
        modalIcon="icon"
        modalIconSlot={<Gauge />}
        footer={
          <ModalFooter
            checkbox={false}
            secondaryActionLabel="Cancel"
            onSecondaryAction={() => setModalOpen(false)}
            primaryActionLabel={editingId ? 'Save quota' : 'Create quota'}
            onPrimaryAction={saveQuota}
          />
        }
      >
        <ModalContent descriptionAsDialogDescription={false}>
          <FormStack>
            <TextInput
              label="Quota name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FormRow>
              <Dropdown
                label="Provider"
                required
                value={form.provider}
                options={[
                  { value: 'Provider A', label: 'Provider A' },
                  { value: 'Provider B', label: 'Provider B' },
                  { value: 'Self-hosted (AIC)', label: 'Self-hosted (AIC)' },
                ]}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, provider: v as ProviderDisplay, modelId: '' }))
                }
              />
              <Dropdown
                label="Optional model"
                value={form.modelId || 'none'}
                options={[
                  { value: 'none', label: 'Provider only' },
                  ...modelsForProvider.map((m) => ({ value: m.id, label: m.displayName })),
                ]}
                onValueChange={(v) => setForm((f) => ({ ...f, modelId: v === 'none' ? '' : v }))}
              />
            </FormRow>
            <FormRow>
              <Dropdown
                label="Limit type"
                value={form.limitType}
                options={[
                  { value: 'USD', label: 'USD' },
                  { value: 'Tokens', label: 'Tokens' },
                ]}
                onValueChange={(v) => setForm((f) => ({ ...f, limitType: v as QuotaLimitType }))}
              />
              <NumberInput
                label="Limit value"
                required
                min={1}
                value={form.limitValue}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, limitValue: typeof value === 'number' ? value : 1 }))
                }
              />
            </FormRow>
            <FormRow>
              <Dropdown
                label="Period"
                value={form.period}
                options={[
                  { value: 'Daily', label: 'Daily' },
                  { value: 'Weekly', label: 'Weekly' },
                  { value: 'Monthly', label: 'Monthly' },
                ]}
                onValueChange={(v) => setForm((f) => ({ ...f, period: v as QuotaPeriod }))}
              />
              <TextInput
                label="Start or reset date"
                value={form.resets}
                onChange={(e) => setForm((f) => ({ ...f, resets: e.target.value }))}
              />
            </FormRow>
            <FormRow>
              <Dropdown
                label="Optional workspace"
                value={form.workspaceId || 'none'}
                options={[
                  { value: 'none', label: 'None' },
                  ...WORKSPACES.map((w) => ({ value: w.id, label: w.name })),
                ]}
                onValueChange={(v) => setForm((f) => ({ ...f, workspaceId: v === 'none' ? '' : v }))}
              />
              <Dropdown
                label="Optional access key"
                value={form.keyId || 'none'}
                options={[
                  { value: 'none', label: 'None' },
                  ...ACCESS_KEYS.filter((k) => k.status !== 'Revoked').map((k) => ({
                    value: k.id,
                    label: k.name,
                  })),
                ]}
                onValueChange={(v) => setForm((f) => ({ ...f, keyId: v === 'none' ? '' : v }))}
              />
            </FormRow>
            {formError ? <WarningText>{formError}</WarningText> : null}
            <HelperMuted>
              Used quota comes from simulated consumed usage. Unpriced usage is never shown as
              zero-cost spend.
            </HelperMuted>
          </FormStack>
        </ModalContent>
      </Modal>
    </>
  );
}
