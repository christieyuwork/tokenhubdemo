import { useMemo, useState } from 'react';
import {
  Button,
  DataRow,
  Dropdown,
  HeaderCell,
  HeaderRow,
  HorizontalTabItem,
  HorizontalTabs,
  HorizontalTabsContent,
  HorizontalTabsList,
  Modal,
  ModalContent,
  ModalFooter,
  Switch,
  TextInput,
} from '@cake-admin/cakeand';
import { Boxes, Plus } from 'lucide-react';
import {
  cloneSeed,
  connectionById,
  DEPLOYMENTS,
  formatTokens,
  formatUsd,
  MODELS,
  RATES,
  SAMPLE_DATA_NOTE,
  type HostingType,
  type ModelRecord,
  type ModelStatus,
  type ProviderDisplay,
  type ToolSupport,
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
  TabBody,
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

type SortKey = 'model' | 'provider' | 'hosting' | 'pricing' | 'status';

interface ModelRegistryProps {
  onNavigate?: (section: string) => void;
}

export function ModelRegistry({ onNavigate }: ModelRegistryProps) {
  const [rows, setRows] = useState(() => cloneSeed(MODELS));
  const [search, setSearch] = useState('');
  const [hosting, setHosting] = useState(ALL);
  const [provider, setProvider] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [capability, setCapability] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('model');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    modelId: '',
    integration: 'conn-foundry',
    endpoint: '',
    hosting: 'Provider-hosted' as HostingType,
    contextLength: '32K',
    tools: 'Yes' as ToolSupport,
    jsonMode: true,
    status: 'Active' as ModelStatus,
    description: '',
  });

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (hosting !== ALL && row.hosting !== hosting) return false;
      if (provider !== ALL && row.provider !== provider) return false;
      if (status !== ALL && row.status !== status) return false;
      if (capability === 'tools' && row.tools === 'No') return false;
      if (capability === 'json' && !row.jsonMode) return false;
      if (!q) return true;
      return (
        row.displayName.toLowerCase().includes(q) ||
        row.modelId.toLowerCase().includes(q) ||
        row.endpoint.toLowerCase().includes(q)
      );
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av =
        sortKey === 'model'
          ? a.displayName
          : sortKey === 'provider'
            ? a.provider
            : sortKey === 'hosting'
              ? a.hosting
              : sortKey === 'pricing'
                ? a.pricingStatus
                : a.status;
      const bv =
        sortKey === 'model'
          ? b.displayName
          : sortKey === 'provider'
            ? b.provider
            : sortKey === 'hosting'
              ? b.hosting
              : sortKey === 'pricing'
                ? b.pricingStatus
                : b.status;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, search, hosting, provider, status, capability, sortKey, sortDir]);

  const needingAttention = rows.filter((r) => r.pricingStatus === 'Incomplete').length;

  function toggleSort(key: string) {
    const next = key as SortKey;
    if (sortKey === next) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(next);
      setSortDir('asc');
    }
  }

  function registerModel() {
    const providerMap: Record<string, ProviderDisplay> = {
      'conn-foundry': 'Provider A',
      'conn-bedrock': 'Provider B',
      'conn-aic': 'Self-hosted (AIC)',
      'conn-openai-sandbox': 'Provider A',
    };
    const id = `model-local-${rows.length + 1}`;
    const next: ModelRecord = {
      id,
      displayName: form.displayName.trim(),
      modelId: form.modelId.trim(),
      provider: providerMap[form.integration] ?? 'Provider A',
      connectionId: form.integration,
      hosting: form.hosting,
      endpointId: `ep-local-${rows.length + 1}`,
      endpoint: form.endpoint.trim() || `/v1/${form.modelId.trim() || 'model'}`,
      contextLength: form.contextLength,
      tools: form.tools,
      jsonMode: form.jsonMode,
      pricingStatus: 'Incomplete',
      status: form.status,
      description: form.description.trim() || 'Locally registered sample model.',
      usage: {
        totalRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
        currentPeriodCost: null,
      },
    };
    setRows((prev) => [next, ...prev]);
    setRegisterOpen(false);
    setSelectedId(id);
  }

  const relatedRates = selected
    ? RATES.filter((r) => r.modelId === selected.id)
    : [];
  const relatedDeployments = selected
    ? DEPLOYMENTS.filter((d) => d.modelId === selected.id)
    : [];
  const missingClasses = selected
    ? ['Input', 'Output', 'Cached input'].filter(
        (tokenClass) =>
          !relatedRates.some(
            (r) => r.tokenClass === tokenClass && r.status === 'Active' && r.pricePer1M !== null,
          ),
      )
    : [];

  return (
    <>
      <ReportHeader
        title="Model registry"
        description="View and manage the models, endpoints, and capabilities available to your organization."
        actions={
          <HeaderActionButton
            startIcon={<Plus size={16} />}
            onClick={() => setRegisterOpen(true)}
          >
            Register model
          </HeaderActionButton>
        }
        filters={
          <>
            <ReportFilterDropdown
              label="Hosting type"
              value={hosting}
              options={[
                { value: ALL, label: 'All' },
                { value: 'Provider-hosted', label: 'Provider-hosted' },
                { value: 'Self-hosted', label: 'Self-hosted' },
              ]}
              onValueChange={setHosting}
            />
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
              label="Status"
              value={status}
              options={[
                { value: ALL, label: 'All' },
                { value: 'Active', label: 'Active' },
                { value: 'Disabled', label: 'Disabled' },
              ]}
              onValueChange={setStatus}
            />
            <ReportFilterDropdown
              label="Capability"
              value={capability}
              options={[
                { value: ALL, label: 'All' },
                { value: 'tools', label: 'Tools' },
                { value: 'json', label: 'JSON mode' },
              ]}
              onValueChange={setCapability}
            />
          </>
        }
      />

      <MetricGrid>
        <MetricCard label="Registered models" value={String(rows.length)} caption={SAMPLE_DATA_NOTE} />
        <MetricCard
          label="Provider-hosted"
          value={String(rows.filter((r) => r.hosting === 'Provider-hosted').length)}
          caption="External providers"
        />
        <MetricCard
          label="Self-hosted"
          value={String(rows.filter((r) => r.hosting === 'Self-hosted').length)}
          caption="AIC capacity"
        />
        <MetricCard
          label="Models needing attention"
          value={String(needingAttention)}
          caption="Incomplete pricing"
        />
      </MetricGrid>

      <ReportPanel
        title="Canonical model inventory"
        note="Models discovered through connections appear here before rates and deployments."
        actions={<ConfigSearch value={search} onChange={setSearch} placeholder="Search models" />}
      >
        <ReportTable
          aria-label="Model registry"
          $cols={[
            reportCol.compact,
            reportCol.wide,
            reportCol.compact,
            reportCol.wide,
            reportCol.compact,
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
              <SortHeader label="Hosting" columnKey="hosting" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <HeaderCell>Endpoint</HeaderCell>
              <HeaderCell>Context length</HeaderCell>
              <HeaderCell>Tools</HeaderCell>
              <HeaderCell>JSON mode</HeaderCell>
              <SortHeader label="Pricing status" columnKey="pricing" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Status" columnKey="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <HeaderCell>Actions</HeaderCell>
            </HeaderRow>
          }
        >
          {filtered.map((row, index) => (
            <DataRow
              key={row.id}
              stripe={index % 2 ? 'inverse' : 'default'}
              selectable={false}
              interactive
              selected={selectedId === row.id}
              onClick={() => setSelectedId(row.id)}
            >
              <CompactDataCell>
                <CellBadge color={modelBadgeColor(row.displayName)} tone="subtle" dot={false}>
                  {row.displayName}
                </CellBadge>
              </CompactDataCell>
              <WideDataCell>
                <ValueBadge>{row.provider}</ValueBadge>
              </WideDataCell>
              <CompactDataCell>{row.hosting}</CompactDataCell>
              <WideDataCell>{row.endpoint}</WideDataCell>
              <CompactDataCell>
                <ValueBadge>{row.contextLength}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>{row.tools}</CompactDataCell>
              <CompactDataCell>{row.jsonMode ? 'Yes' : 'No'}</CompactDataCell>
              <CompactDataCell>
                <CellBadge
                  color={configStatusBadgeColor(row.pricingStatus)}
                  tone="subtle"
                  dot={false}
                >
                  {row.pricingStatus}
                </CellBadge>
              </CompactDataCell>
              <CompactDataCell>
                <CellBadge color={configStatusBadgeColor(row.status)} tone="subtle" dot={false}>
                  {row.status}
                </CellBadge>
              </CompactDataCell>
              <CompactDataCell>
                <RowActionsMenu
                  label={`Actions for ${row.displayName}`}
                  actions={[
                    { id: 'view', label: 'View details', onSelect: () => setSelectedId(row.id) },
                    {
                      id: 'pricing',
                      label: 'Open pricing and rates',
                      onSelect: () => onNavigate?.('pricing-and-rates'),
                    },
                  ]}
                />
              </CompactDataCell>
            </DataRow>
          ))}
        </ReportTable>
      </ReportPanel>

      <ConfigDetailDrawer
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        title={selected?.displayName ?? 'Model'}
        subtitle={selected ? `${selected.provider} · ${selected.modelId}` : undefined}
        width={480}
      >
        {selected ? (
          <HorizontalTabs defaultValue="overview">
            <HorizontalTabsList aria-label="Model detail sections">
              <HorizontalTabItem value="overview">Overview</HorizontalTabItem>
              <HorizontalTabItem value="pricing">Pricing</HorizontalTabItem>
              <HorizontalTabItem value="deployments">Deployments</HorizontalTabItem>
              <HorizontalTabItem value="usage">Usage</HorizontalTabItem>
            </HorizontalTabsList>
            <HorizontalTabsContent value="overview">
              <TabBody>
                <DrawerSection>
                  <DrawerField>
                    <DrawerLabel>Provider</DrawerLabel>
                    <DrawerValue>{selected.provider}</DrawerValue>
                  </DrawerField>
                  <DrawerField>
                    <DrawerLabel>Endpoint</DrawerLabel>
                    <DrawerValue>{selected.endpoint}</DrawerValue>
                  </DrawerField>
                  <DrawerField>
                    <DrawerLabel>Hosting</DrawerLabel>
                    <DrawerValue>{selected.hosting}</DrawerValue>
                  </DrawerField>
                  <DrawerField>
                    <DrawerLabel>Context length</DrawerLabel>
                    <DrawerValue>{selected.contextLength}</DrawerValue>
                  </DrawerField>
                  <DrawerField>
                    <DrawerLabel>Tools</DrawerLabel>
                    <DrawerValue>{selected.tools}</DrawerValue>
                  </DrawerField>
                  <DrawerField>
                    <DrawerLabel>JSON mode</DrawerLabel>
                    <DrawerValue>{selected.jsonMode ? 'Yes' : 'No'}</DrawerValue>
                  </DrawerField>
                  <DrawerField>
                    <DrawerLabel>Connection</DrawerLabel>
                    <DrawerValue>
                      {connectionById(selected.connectionId)?.name ?? selected.connectionId}
                    </DrawerValue>
                  </DrawerField>
                  <DrawerNote>{selected.description}</DrawerNote>
                </DrawerSection>
              </TabBody>
            </HorizontalTabsContent>
            <HorizontalTabsContent value="pricing">
              <TabBody>
                {selected.pricingStatus === 'Incomplete' ? (
                  <WarningText>
                    Incomplete pricing — a used token class has no rate. Missing classes are never
                    treated as $0.00.
                  </WarningText>
                ) : null}
                <DrawerSectionTitle>Active price versions</DrawerSectionTitle>
                {relatedRates.filter((r) => r.status === 'Active' || r.status === 'Unpriced').map((rate) => (
                  <DrawerField key={rate.id}>
                    <DrawerLabel>{rate.tokenClass}</DrawerLabel>
                    <DrawerValue>
                      {rate.pricePer1M === null
                        ? 'Unpriced'
                        : `${formatUsd(rate.pricePer1M)} per 1M · ${rate.priceType}`}
                    </DrawerValue>
                  </DrawerField>
                ))}
                {missingClasses.length > 0 ? (
                  <DrawerNote>Missing token classes: {missingClasses.join(', ')}</DrawerNote>
                ) : null}
                <Button
                  size="sm"
                  variant="tonal"
                  intent="secondary"
                  onClick={() => onNavigate?.('pricing-and-rates')}
                >
                  Open Pricing and rates
                </Button>
              </TabBody>
            </HorizontalTabsContent>
            <HorizontalTabsContent value="deployments">
              <TabBody>
                {relatedDeployments.length === 0 ? (
                  <HelperMuted>No related deployments for this model.</HelperMuted>
                ) : (
                  relatedDeployments.map((dep) => (
                    <DrawerField key={dep.id}>
                      <DrawerLabel>{dep.environment}</DrawerLabel>
                      <DrawerValue>
                        {dep.name} · {dep.health}
                      </DrawerValue>
                    </DrawerField>
                  ))
                )}
                <Button
                  size="sm"
                  variant="tonal"
                  intent="secondary"
                  onClick={() => onNavigate?.('model-deployments')}
                >
                  Open Model deployments
                </Button>
              </TabBody>
            </HorizontalTabsContent>
            <HorizontalTabsContent value="usage">
              <TabBody>
                <DrawerField>
                  <DrawerLabel>Total requests</DrawerLabel>
                  <DrawerValue>{formatTokens(selected.usage.totalRequests)}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Input tokens</DrawerLabel>
                  <DrawerValue>{formatTokens(selected.usage.inputTokens)}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Output tokens</DrawerLabel>
                  <DrawerValue>{formatTokens(selected.usage.outputTokens)}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Current-period cost</DrawerLabel>
                  <DrawerValue>
                    {selected.usage.currentPeriodCost === null
                      ? 'Unpriced usage present'
                      : formatUsd(selected.usage.currentPeriodCost)}
                  </DrawerValue>
                </DrawerField>
              </TabBody>
            </HorizontalTabsContent>
          </HorizontalTabs>
        ) : null}
      </ConfigDetailDrawer>

      <Modal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        title="Register model"
        subtitle="Add a model and endpoint TokenOps should know about. Do not enter API credentials here."
        modalIcon="icon"
        modalIconSlot={<Boxes />}
        footer={
          <ModalFooter
            checkbox={false}
            secondaryActionLabel="Cancel"
            onSecondaryAction={() => setRegisterOpen(false)}
            primaryActionLabel="Register model"
            onPrimaryAction={registerModel}
            primaryActionDisabled={!form.displayName.trim() || !form.modelId.trim()}
          />
        }
      >
        <ModalContent descriptionAsDialogDescription={false}>
          <FormStack>
            <FormRow>
              <TextInput
                label="Display name"
                required
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
              <TextInput
                label="Model ID"
                required
                value={form.modelId}
                onChange={(e) => setForm((f) => ({ ...f, modelId: e.target.value }))}
              />
            </FormRow>
            <FormRow>
              <Dropdown
                label="Integration"
                value={form.integration}
                options={[
                  { value: 'conn-foundry', label: 'Brightsky Foundry' },
                  { value: 'conn-bedrock', label: 'Brightsky Bedrock' },
                  { value: 'conn-aic', label: 'AIC production' },
                ]}
                onValueChange={(v) => setForm((f) => ({ ...f, integration: v }))}
              />
              <Dropdown
                label="Hosting type"
                value={form.hosting}
                options={[
                  { value: 'Provider-hosted', label: 'Provider-hosted' },
                  { value: 'Self-hosted', label: 'Self-hosted' },
                ]}
                onValueChange={(v) => setForm((f) => ({ ...f, hosting: v as HostingType }))}
              />
            </FormRow>
            <TextInput
              label="Endpoint"
              value={form.endpoint}
              onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))}
              placeholder="/v1/example"
            />
            <FormRow>
              <TextInput
                label="Context length"
                value={form.contextLength}
                onChange={(e) => setForm((f) => ({ ...f, contextLength: e.target.value }))}
              />
              <Dropdown
                label="Tool support"
                value={form.tools}
                options={[
                  { value: 'Yes', label: 'Yes' },
                  { value: 'Limited', label: 'Limited' },
                  { value: 'No', label: 'No' },
                ]}
                onValueChange={(v) => setForm((f) => ({ ...f, tools: v as ToolSupport }))}
              />
            </FormRow>
            <FormRow>
              <Dropdown
                label="Status"
                value={form.status}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Disabled', label: 'Disabled' },
                ]}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as ModelStatus }))}
              />
              <Switch
                label="JSON mode"
                checked={form.jsonMode}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, jsonMode: checked }))}
              />
            </FormRow>
            <TextInput
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </FormStack>
        </ModalContent>
      </Modal>
    </>
  );
}
