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
  TextInput,
} from '@cake-admin/cakeand';
import { DollarSign, Plus } from 'lucide-react';
import {
  cloneSeed,
  connectionById,
  formatPricePer1M,
  MODELS,
  modelById,
  RATE_HISTORY,
  RATES,
  SAMPLE_DATA_NOTE,
  type PriceType,
  type ProviderDisplay,
  type RateRecord,
  type RateStatus,
  type TokenClass,
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
import { modelBadgeColor } from '../data/modelColors';
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

type SortKey =
  | 'model'
  | 'provider'
  | 'tokenClass'
  | 'price'
  | 'priceType'
  | 'effectiveDate'
  | 'status'
  | 'lastUpdated';

const TOKEN_CLASS_OPTIONS = [
  { value: 'Input', label: 'Input' },
  { value: 'Output', label: 'Output' },
  { value: 'Cached input', label: 'Cached input' },
  { value: 'Reasoning output', label: 'Reasoning output' },
  { value: 'Cache write', label: 'Cache write' },
];

const PRICE_TYPE_OPTIONS = [
  { value: 'List price', label: 'List price' },
  { value: 'Customer override', label: 'Customer override' },
  { value: 'Internal rate', label: 'Internal rate' },
];

export function PricingAndRates() {
  const [rows, setRows] = useState(() => cloneSeed([...RATES, ...RATE_HISTORY]));
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState(ALL);
  const [model, setModel] = useState(ALL);
  const [tokenClass, setTokenClass] = useState(ALL);
  const [priceType, setPriceType] = useState(ALL);
  const [effectiveDate, setEffectiveDate] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('model');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [overlapWarning, setOverlapWarning] = useState('');
  const [form, setForm] = useState({
    modelId: 'model-frontier-l',
    tokenClass: 'Input' as TokenClass,
    pricePer1M: 1,
    priceType: 'List price' as PriceType,
    effectiveDate: '2025-11-18',
    notes: '',
    unpriced: false,
  });

  const tableRows = useMemo(
    () => rows.filter((r) => r.status === 'Active' || r.status === 'Unpriced'),
    [rows],
  );

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tableRows.filter((row) => {
      const modelName = modelById(row.modelId)?.displayName ?? row.modelId;
      if (provider !== ALL && row.provider !== provider) return false;
      if (model !== ALL && row.modelId !== model) return false;
      if (tokenClass !== ALL && row.tokenClass !== tokenClass) return false;
      if (priceType !== ALL && row.priceType !== priceType) return false;
      if (effectiveDate !== ALL && !row.effectiveDate.startsWith(effectiveDate)) return false;
      if (!q) return true;
      return (
        modelName.toLowerCase().includes(q) ||
        row.provider.toLowerCase().includes(q) ||
        row.tokenClass.toLowerCase().includes(q)
      );
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const modelA = modelById(a.modelId)?.displayName ?? a.modelId;
      const modelB = modelById(b.modelId)?.displayName ?? b.modelId;
      const av =
        sortKey === 'model'
          ? modelA
          : sortKey === 'provider'
            ? a.provider
            : sortKey === 'tokenClass'
              ? a.tokenClass
              : sortKey === 'price'
                ? (a.pricePer1M ?? -1)
                : sortKey === 'priceType'
                  ? a.priceType
                  : sortKey === 'effectiveDate'
                    ? a.effectiveDate
                    : sortKey === 'status'
                      ? a.status
                      : a.lastUpdated;
      const bv =
        sortKey === 'model'
          ? modelB
          : sortKey === 'provider'
            ? b.provider
            : sortKey === 'tokenClass'
              ? b.tokenClass
              : sortKey === 'price'
                ? (b.pricePer1M ?? -1)
                : sortKey === 'priceType'
                  ? b.priceType
                  : sortKey === 'effectiveDate'
                    ? b.effectiveDate
                    : sortKey === 'status'
                      ? b.status
                      : b.lastUpdated;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [tableRows, search, provider, model, tokenClass, priceType, effectiveDate, sortKey, sortDir]);

  const activeCount = tableRows.filter((r) => r.status === 'Active').length;
  const overrideCount = tableRows.filter((r) => r.priceType === 'Customer override').length;
  const unpricedCount = tableRows.filter((r) => r.status === 'Unpriced' || r.pricePer1M === null).length;

  function toggleSort(key: string) {
    const next = key as SortKey;
    if (sortKey === next) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(next);
      setSortDir('asc');
    }
  }

  function openCreate() {
    setEditingId(null);
    setOverlapWarning('');
    setForm({
      modelId: 'model-frontier-l',
      tokenClass: 'Input',
      pricePer1M: 1,
      priceType: 'List price',
      effectiveDate: '2025-11-18',
      notes: '',
      unpriced: false,
    });
    setModalOpen(true);
  }

  function openEdit(row: RateRecord) {
    setEditingId(row.id);
    setOverlapWarning('');
    setForm({
      modelId: row.modelId,
      tokenClass: row.tokenClass,
      pricePer1M: row.pricePer1M ?? 0,
      priceType: row.priceType,
      effectiveDate: row.effectiveDate,
      notes: row.notes,
      unpriced: row.pricePer1M === null,
    });
    setModalOpen(true);
  }

  function validateAndSave() {
    const modelRecord = MODELS.find((m) => m.id === form.modelId);
    if (!modelRecord) return;
    if (!form.effectiveDate.trim()) return;
    if (!form.unpriced && form.pricePer1M < 0) return;

    const overlap = tableRows.find(
      (r) =>
        r.id !== editingId &&
        r.modelId === form.modelId &&
        r.tokenClass === form.tokenClass &&
        r.priceType === form.priceType &&
        !r.endDate,
    );
    if (overlap && !overlapWarning) {
      setOverlapWarning(
        `This rate overlaps the active ${overlap.tokenClass} rate effective ${overlap.effectiveDate}. Save again to confirm.`,
      );
      return;
    }

    const provider = modelRecord.provider as ProviderDisplay;
    if (editingId) {
      setRows((prev) =>
        prev.map((row) =>
          row.id === editingId
            ? {
                ...row,
                modelId: form.modelId,
                provider,
                connectionId: modelRecord.connectionId,
                tokenClass: form.tokenClass,
                pricePer1M: form.unpriced ? null : form.pricePer1M,
                priceType: form.priceType,
                effectiveDate: form.effectiveDate,
                notes: form.notes,
                status: (form.unpriced ? 'Unpriced' : 'Active') as RateStatus,
                lastUpdated: '2025-11-18',
                lastChangedBy: 'You',
                changeReason: 'Edited in prototype',
              }
            : row,
        ),
      );
      setSelectedId(editingId);
    } else {
      const id = `rate-local-${rows.length + 1}`;
      const next: RateRecord = {
        id,
        modelId: form.modelId,
        provider,
        connectionId: modelRecord.connectionId,
        tokenClass: form.tokenClass,
        pricePer1M: form.unpriced ? null : form.pricePer1M,
        currency: 'USD',
        priceType: form.priceType,
        effectiveDate: form.effectiveDate,
        endDate: null,
        status: form.unpriced ? 'Unpriced' : 'Active',
        lastUpdated: '2025-11-18',
        lastChangedBy: 'You',
        changeReason: 'Added in prototype',
        notes: form.notes,
        estimatedRecordsAffected: 0,
        previousVersionIds: overlap ? [overlap.id] : [],
      };
      setRows((prev) => {
        const updated = overlap
          ? prev.map((r) =>
              r.id === overlap.id
                ? { ...r, status: 'Superseded' as RateStatus, endDate: form.effectiveDate }
                : r,
            )
          : prev;
        return [next, ...updated];
      });
      setSelectedId(id);
    }
    setModalOpen(false);
    setOverlapWarning('');
  }

  const previousVersions = selected
    ? rows.filter((r) => selected.previousVersionIds.includes(r.id) || r.id === selected.id)
    : [];

  return (
    <>
      <ReportHeader
        title="Pricing and rates"
        description="Manage the rates TokenOps uses to calculate model costs."
        actions={
          <HeaderActionButton startIcon={<Plus size={16} />} onClick={openCreate}>
            Add rate
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
              label="Token class"
              value={tokenClass}
              options={[{ value: ALL, label: 'All' }, ...TOKEN_CLASS_OPTIONS]}
              onValueChange={setTokenClass}
            />
            <ReportFilterDropdown
              label="Price type"
              value={priceType}
              options={[{ value: ALL, label: 'All' }, ...PRICE_TYPE_OPTIONS]}
              onValueChange={setPriceType}
            />
            <ReportFilterDropdown
              label="Effective date"
              value={effectiveDate}
              options={[
                { value: ALL, label: 'All' },
                { value: '2025-11', label: '2025-11' },
                { value: '2025-10', label: '2025-10' },
                { value: '2025-09', label: '2025-09' },
                { value: '2025-08', label: '2025-08' },
              ]}
              onValueChange={setEffectiveDate}
            />
          </>
        }
      />

      <MetricGrid>
        <MetricCard label="Active rates" value={String(activeCount)} caption={SAMPLE_DATA_NOTE} />
        <MetricCard label="Customer overrides" value={String(overrideCount)} caption="Negotiated prices" />
        <MetricCard
          label="Unpriced token classes"
          value={String(unpricedCount)}
          caption="Never treated as $0.00"
        />
      </MetricGrid>

      <ReportPanel
        title="Rate versions"
        note="Pricing is separate from Connections. Connections provide access; rates convert usage into cost."
        actions={<ConfigSearch value={search} onChange={setSearch} placeholder="Search rates" />}
      >
        <ReportTable
          aria-label="Pricing and rates"
          $cols={[
            reportCol.compact,
            reportCol.wide,
            reportCol.compact,
            reportCol.metric,
            reportCol.compact,
            reportCol.compact,
            reportCol.compact,
            reportCol.compact,
            reportCol.icon,
          ].join(' ')}
          header={
            <HeaderRow>
              <SortHeader label="Model" columnKey="model" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Provider" columnKey="provider" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} wide />
              <SortHeader label="Token class" columnKey="tokenClass" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Price per 1M tokens" columnKey="price" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Price type" columnKey="priceType" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Effective date" columnKey="effectiveDate" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Status" columnKey="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Last updated" columnKey="lastUpdated" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <HeaderCell>Actions</HeaderCell>
            </HeaderRow>
          }
        >
          {filtered.map((row, index) => {
            const modelName = modelById(row.modelId)?.displayName ?? row.modelId;
            return (
              <DataRow
                key={row.id}
                stripe={index % 2 ? 'inverse' : 'default'}
                selectable={false}
                interactive
                selected={selectedId === row.id}
                onClick={() => setSelectedId(row.id)}
              >
                <CompactDataCell>
                  <CellBadge color={modelBadgeColor(modelName)} tone="subtle" dot={false}>
                    {modelName}
                  </CellBadge>
                </CompactDataCell>
                <WideDataCell>
                  <ValueBadge>{row.provider}</ValueBadge>
                </WideDataCell>
                <CompactDataCell>{row.tokenClass}</CompactDataCell>
                <CompactDataCell>
                  {row.pricePer1M === null ? (
                    <CellBadge color={configStatusBadgeColor('Unpriced')} tone="subtle" dot={false}>
                      Unpriced
                    </CellBadge>
                  ) : (
                    <ValueBadge>{formatPricePer1M(row.pricePer1M)}</ValueBadge>
                  )}
                </CompactDataCell>
                <CompactDataCell>{row.priceType}</CompactDataCell>
                <CompactDataCell>{row.effectiveDate}</CompactDataCell>
                <CompactDataCell>
                  <CellBadge color={configStatusBadgeColor(row.status)} tone="subtle" dot={false}>
                    {row.status}
                  </CellBadge>
                </CompactDataCell>
                <CompactDataCell>{row.lastUpdated}</CompactDataCell>
                <CompactDataCell>
                  <RowActionsMenu
                    label={`Actions for ${modelName} ${row.tokenClass}`}
                    actions={[
                      { id: 'view', label: 'View history', onSelect: () => setSelectedId(row.id) },
                      { id: 'edit', label: 'Edit rate', onSelect: () => openEdit(row) },
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
        title={
          selected
            ? `${modelById(selected.modelId)?.displayName ?? selected.modelId} · ${selected.tokenClass}`
            : 'Rate'
        }
        subtitle={selected ? `${selected.provider} · ${selected.priceType}` : undefined}
        footer={
          selected && (selected.status === 'Active' || selected.status === 'Unpriced') ? (
            <Button size="sm" intent="secondary" onClick={() => openEdit(selected)}>
              Edit rate
            </Button>
          ) : null
        }
      >
        {selected ? (
          <>
            <DrawerSection>
              <DrawerSectionTitle>Current rate</DrawerSectionTitle>
              <DrawerField>
                <DrawerLabel>Price</DrawerLabel>
                <DrawerValue>{formatPricePer1M(selected.pricePer1M)}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Price type</DrawerLabel>
                <DrawerValue>{selected.priceType}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Effective date</DrawerLabel>
                <DrawerValue>{selected.effectiveDate}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Related model</DrawerLabel>
                <DrawerValue>{modelById(selected.modelId)?.displayName}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Related integration</DrawerLabel>
                <DrawerValue>
                  {connectionById(selected.connectionId)?.name ?? selected.connectionId}
                </DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Last changed by</DrawerLabel>
                <DrawerValue>{selected.lastChangedBy}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Change reason</DrawerLabel>
                <DrawerValue>{selected.changeReason}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Usage records affected</DrawerLabel>
                <DrawerValue>{selected.estimatedRecordsAffected.toLocaleString()}</DrawerValue>
              </DrawerField>
            </DrawerSection>
            <DrawerSection>
              <DrawerSectionTitle>Effective timeline</DrawerSectionTitle>
              {previousVersions.map((version) => (
                <DrawerField key={version.id}>
                  <DrawerLabel>{version.effectiveDate}</DrawerLabel>
                  <DrawerValue>
                    {formatPricePer1M(version.pricePer1M)} · {version.status}
                  </DrawerValue>
                </DrawerField>
              ))}
            </DrawerSection>
            {selected.notes ? <DrawerNote>{selected.notes}</DrawerNote> : null}
          </>
        ) : null}
      </ConfigDetailDrawer>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? 'Edit rate' : 'Add rate'}
        subtitle="Define how token usage converts into cost for a registered model."
        modalIcon="icon"
        modalIconSlot={<DollarSign />}
        footer={
          <ModalFooter
            checkbox={false}
            secondaryActionLabel="Cancel"
            onSecondaryAction={() => setModalOpen(false)}
            primaryActionLabel={overlapWarning ? 'Save anyway' : 'Save rate'}
            onPrimaryAction={validateAndSave}
            primaryActionDisabled={
              !form.effectiveDate.trim() || (!form.unpriced && form.pricePer1M < 0)
            }
          />
        }
      >
        <ModalContent descriptionAsDialogDescription={false}>
          <FormStack>
            <FormRow>
              <Dropdown
                label="Model"
                required
                value={form.modelId}
                options={MODELS.map((m) => ({
                  value: m.id,
                  label: `${m.displayName} · ${m.provider}`,
                }))}
                onValueChange={(v) => setForm((f) => ({ ...f, modelId: v }))}
              />
              <Dropdown
                label="Token class"
                required
                value={form.tokenClass}
                options={TOKEN_CLASS_OPTIONS}
                onValueChange={(v) => setForm((f) => ({ ...f, tokenClass: v as TokenClass }))}
              />
            </FormRow>
            <FormRow>
              <NumberInput
                label="Price per 1M tokens"
                value={form.unpriced ? undefined : form.pricePer1M}
                disabled={form.unpriced}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, pricePer1M: typeof value === 'number' ? value : 0 }))
                }
              />
              <TextInput label="Currency" value="USD" disabled />
            </FormRow>
            <FormRow>
              <Dropdown
                label="Price type"
                value={form.priceType}
                options={PRICE_TYPE_OPTIONS}
                onValueChange={(v) => setForm((f) => ({ ...f, priceType: v as PriceType }))}
              />
              <TextInput
                label="Effective date"
                required
                value={form.effectiveDate}
                onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                placeholder="YYYY-MM-DD"
              />
            </FormRow>
            <label>
              <input
                type="checkbox"
                checked={form.unpriced}
                onChange={(e) => setForm((f) => ({ ...f, unpriced: e.target.checked }))}
              />{' '}
              Mark as Unpriced (never $0.00)
            </label>
            <TextInput
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
            {overlapWarning ? <WarningText>{overlapWarning}</WarningText> : null}
            <HelperMuted>
              Provider comes from the selected model’s registry entry. Price cannot be negative.
            </HelperMuted>
          </FormStack>
        </ModalContent>
      </Modal>
    </>
  );
}
