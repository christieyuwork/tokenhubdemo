import { useEffect, useMemo, useState } from 'react';
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
  NumberInput,
  TextInput,
} from '@cake-admin/cakeand';
import { Layers, Plus, RotateCcw } from 'lucide-react';
import {
  cloneSeed,
  DEPLOYMENTS,
  formatUsd,
  MODELS,
  modelById,
  SAMPLE_DATA_NOTE,
  SERVERS,
  type DeploymentRecord,
  type Environment,
  type HealthStatus,
  type HostingType,
} from '../data/tokenOpsConfig';
import {
  ConfigDetailDrawer,
  DrawerField,
  DrawerLabel,
  DrawerNote,
  DrawerSectionTitle,
  DrawerValue,
  PercentBarFill,
  PercentBarTrack,
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
  WizardStep,
  WizardSteps,
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
type SortKey = 'deployment' | 'model' | 'environment' | 'rpm' | 'p95' | 'health';

function formatLatency(ms: number) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms} ms`;
}

export function ModelDeployments() {
  const [rows, setRows] = useState(() => cloneSeed(DEPLOYMENTS));
  const [search, setSearch] = useState('');
  const [environment, setEnvironment] = useState(ALL);
  const [model, setModel] = useState(ALL);
  const [health, setHealth] = useState(ALL);
  const [hosting, setHosting] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('deployment');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [restartingId, setRestartingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    modelId: 'model-open-70b',
    environment: 'Staging' as Environment,
    hosting: 'Self-hosted' as HostingType,
    runtime: 'vLLM',
    replicas: 2,
    serverId: 'srv-dc1-01',
    name: '',
    requestPath: '',
  });

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (!restartingId) return;
    const recoveringTimer = window.setTimeout(() => {
      setRows((prev) =>
        prev.map((row) =>
          row.id === restartingId
            ? {
                ...row,
                health: 'Recovering' as HealthStatus,
                lastHealthCheck: 'Just now',
                errorRate: 1.1,
              }
            : row,
        ),
      );
    }, 800);
    const healthyTimer = window.setTimeout(() => {
      setRows((prev) =>
        prev.map((row) =>
          row.id === restartingId
            ? {
                ...row,
                health: 'Healthy' as HealthStatus,
                lastHealthCheck: 'Just now',
                errorRate: 0.5,
                p95LatencyMs: Math.min(row.p95LatencyMs, 900),
                replicaHealth: row.replicaHealth.map((r) => ({ ...r, health: 'Healthy' as HealthStatus })),
              }
            : row,
        ),
      );
      setRestartingId(null);
    }, 2200);
    return () => {
      window.clearTimeout(recoveringTimer);
      window.clearTimeout(healthyTimer);
    };
  }, [restartingId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (environment !== ALL && row.environment !== environment) return false;
      if (model !== ALL && row.modelId !== model) return false;
      if (health !== ALL && row.health !== health) return false;
      if (hosting !== ALL && row.hosting !== hosting) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.requestPath.toLowerCase().includes(q) ||
        (modelById(row.modelId)?.displayName ?? '').toLowerCase().includes(q)
      );
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av =
        sortKey === 'deployment'
          ? a.name
          : sortKey === 'model'
            ? (modelById(a.modelId)?.displayName ?? '')
            : sortKey === 'environment'
              ? a.environment
              : sortKey === 'rpm'
                ? a.requestsPerMin
                : sortKey === 'p95'
                  ? a.p95LatencyMs
                  : a.health;
      const bv =
        sortKey === 'deployment'
          ? b.name
          : sortKey === 'model'
            ? (modelById(b.modelId)?.displayName ?? '')
            : sortKey === 'environment'
              ? b.environment
              : sortKey === 'rpm'
                ? b.requestsPerMin
                : sortKey === 'p95'
                  ? b.p95LatencyMs
                  : b.health;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, search, environment, model, health, hosting, sortKey, sortDir]);

  function toggleSort(key: string) {
    const next = key as SortKey;
    if (sortKey === next) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(next);
      setSortDir('asc');
    }
  }

  function simulateRestart(id: string) {
    setRestartingId(id);
    setSelectedId(id);
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? { ...row, health: 'Recovering' as HealthStatus, lastHealthCheck: 'Restart requested (simulated)' }
          : row,
      ),
    );
  }

  function createDeployment() {
    const modelRecord = MODELS.find((m) => m.id === form.modelId);
    const id = `dep-local-${rows.length + 1}`;
    const name =
      form.name.trim() ||
      `${modelRecord?.displayName ?? 'Model'} · ${form.environment.toLowerCase()} pool`;
    const next: DeploymentRecord = {
      id,
      name,
      modelId: form.modelId,
      purpose: 'Locally simulated deployment',
      environment: form.environment,
      runtime: form.runtime,
      version: 'prototype',
      replicas: form.replicas,
      hosting: form.hosting,
      serverId: form.hosting === 'Self-hosted' ? form.serverId : null,
      gpuIds: [],
      gpuAllocationLabel:
        form.hosting === 'Self-hosted' ? 'Pending allocation' : 'No dedicated GPU allocation',
      requestPath: form.requestPath.trim() || `/v1/${form.modelId}`,
      requestsPerMin: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      errorRate: 0,
      health: 'Healthy',
      createdDate: '2025-11-18',
      lastHealthCheck: 'Just now',
      replicaHealth: Array.from({ length: form.replicas }, (_, i) => ({
        id: `r${i + 1}`,
        health: 'Healthy' as HealthStatus,
        share: Math.round(100 / form.replicas),
      })),
      allocatedGpuHours: 0,
      usedGpuHours: 0,
      internalEstimatedCost: 0,
      workload: 'Simulated prototype workload',
    };
    setRows((prev) => [next, ...prev]);
    setWizardOpen(false);
    setStep(1);
    setSelectedId(id);
  }

  const allocatedGpus = rows.reduce((sum, row) => sum + row.gpuIds.length, 0);

  return (
    <>
      <ReportHeader
        title="Model deployments"
        description="Monitor the model pools serving production and test workloads."
        actions={
          <HeaderActionButton
            startIcon={<Plus size={16} />}
            onClick={() => {
              setStep(1);
              setWizardOpen(true);
            }}
          >
            Create deployment
          </HeaderActionButton>
        }
        filters={
          <>
            <ReportFilterDropdown
              label="Environment"
              value={environment}
              options={[
                { value: ALL, label: 'All' },
                { value: 'Production', label: 'Production' },
                { value: 'Staging', label: 'Staging' },
              ]}
              onValueChange={setEnvironment}
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
              label="Health"
              value={health}
              options={[
                { value: ALL, label: 'All' },
                { value: 'Healthy', label: 'Healthy' },
                { value: 'Degraded', label: 'Degraded' },
                { value: 'Recovering', label: 'Recovering' },
              ]}
              onValueChange={setHealth}
            />
            <ReportFilterDropdown
              label="Hosting"
              value={hosting}
              options={[
                { value: ALL, label: 'All' },
                { value: 'Self-hosted', label: 'Self-hosted' },
                { value: 'Provider-hosted', label: 'Provider-hosted' },
              ]}
              onValueChange={setHosting}
            />
          </>
        }
      />

      <MetricGrid>
        <MetricCard label="Active deployments" value={String(rows.length)} caption={SAMPLE_DATA_NOTE} />
        <MetricCard
          label="Healthy"
          value={String(rows.filter((r) => r.health === 'Healthy').length)}
          caption="Serving normally"
        />
        <MetricCard
          label="Degraded"
          value={String(rows.filter((r) => r.health === 'Degraded').length)}
          caption="Needs attention"
        />
        <MetricCard label="Allocated GPUs" value={String(allocatedGpus)} caption="Self-hosted pools" />
      </MetricGrid>

      <ReportPanel
        title="Serving pools"
        note="A deployment is the model plus runtime, replicas, endpoint, and operational state."
        actions={<ConfigSearch value={search} onChange={setSearch} placeholder="Search deployments" />}
      >
        <ReportTable
          aria-label="Model deployments"
          $cols={[
            reportCol.widePlus,
            reportCol.compact,
            reportCol.compact,
            reportCol.compact,
            reportCol.compact,
            reportCol.wide,
            reportCol.compact,
            reportCol.metric,
            reportCol.compact,
            reportCol.compact,
            reportCol.icon,
          ].join(' ')}
          header={
            <HeaderRow>
              <SortHeader label="Deployment" columnKey="deployment" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} wide />
              <SortHeader label="Model" columnKey="model" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Environment" columnKey="environment" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <HeaderCell>Runtime</HeaderCell>
              <HeaderCell>Replicas</HeaderCell>
              <HeaderCell>Infrastructure</HeaderCell>
              <HeaderCell>GPU allocation</HeaderCell>
              <SortHeader label="Requests per minute" columnKey="rpm" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="P95 latency" columnKey="p95" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Health" columnKey="health" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
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
              <WideDataCell>{row.name}</WideDataCell>
              <CompactDataCell>
                <CellBadge
                  color={modelBadgeColor(modelById(row.modelId)?.displayName ?? '')}
                  tone="subtle"
                  dot={false}
                >
                  {modelById(row.modelId)?.displayName}
                </CellBadge>
              </CompactDataCell>
              <CompactDataCell>
                <CellBadge color={configStatusBadgeColor(row.environment)} tone="subtle" dot={false}>
                  {row.environment}
                </CellBadge>
              </CompactDataCell>
              <CompactDataCell>{row.runtime}</CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.replicas}</ValueBadge>
              </CompactDataCell>
              <WideDataCell>{row.serverId ?? 'Provider-hosted'}</WideDataCell>
              <CompactDataCell>{row.gpuAllocationLabel}</CompactDataCell>
              <CompactDataCell>
                <ValueBadge>{row.requestsPerMin.toLocaleString()}</ValueBadge>
              </CompactDataCell>
              <CompactDataCell>{formatLatency(row.p95LatencyMs)}</CompactDataCell>
              <CompactDataCell>
                <CellBadge color={configStatusBadgeColor(row.health)} tone="subtle" dot={false}>
                  {row.health}
                </CellBadge>
              </CompactDataCell>
              <CompactDataCell>
                <RowActionsMenu
                  label={`Actions for ${row.name}`}
                  actions={[
                    { id: 'view', label: 'Inspect health', onSelect: () => setSelectedId(row.id) },
                    {
                      id: 'restart',
                      label: 'Simulate restart',
                      disabled: restartingId === row.id,
                      onSelect: () => simulateRestart(row.id),
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
        title={selected?.name ?? 'Deployment'}
        subtitle={selected ? `${selected.environment} · ${selected.requestPath}` : undefined}
        width={480}
        footer={
          selected?.health === 'Degraded' || selected?.health === 'Recovering' ? (
            <Button
              size="sm"
              intent="secondary"
              startIcon={<RotateCcw size={16} />}
              disabled={restartingId === selected.id}
              onClick={() => simulateRestart(selected.id)}
            >
              Simulate restart
            </Button>
          ) : null
        }
      >
        {selected ? (
          <HorizontalTabs defaultValue="overview">
            <HorizontalTabsList aria-label="Deployment detail sections">
              <HorizontalTabItem value="overview">Overview</HorizontalTabItem>
              <HorizontalTabItem value="health">Operational health</HorizontalTabItem>
              <HorizontalTabItem value="traffic">Traffic</HorizontalTabItem>
              <HorizontalTabItem value="infra">Infrastructure</HorizontalTabItem>
              <HorizontalTabItem value="cost">Cost and utilization</HorizontalTabItem>
            </HorizontalTabsList>
            <HorizontalTabsContent value="overview">
              <TabBody>
                <DrawerField>
                  <DrawerLabel>Model</DrawerLabel>
                  <DrawerValue>{modelById(selected.modelId)?.displayName}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Purpose</DrawerLabel>
                  <DrawerValue>{selected.purpose}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Environment</DrawerLabel>
                  <DrawerValue>{selected.environment}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Endpoint</DrawerLabel>
                  <DrawerValue>{selected.requestPath}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Runtime</DrawerLabel>
                  <DrawerValue>{selected.runtime}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Version</DrawerLabel>
                  <DrawerValue>{selected.version}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Created</DrawerLabel>
                  <DrawerValue>{selected.createdDate}</DrawerValue>
                </DrawerField>
                <DrawerNote>{selected.workload}</DrawerNote>
              </TabBody>
            </HorizontalTabsContent>
            <HorizontalTabsContent value="health">
              <TabBody>
                <DrawerField>
                  <DrawerLabel>Overall health</DrawerLabel>
                  <DrawerValue>{selected.health}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Requests / min</DrawerLabel>
                  <DrawerValue>{selected.requestsPerMin.toLocaleString()}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>P50 latency</DrawerLabel>
                  <DrawerValue>{formatLatency(selected.p50LatencyMs)}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>P95 latency</DrawerLabel>
                  <DrawerValue>{formatLatency(selected.p95LatencyMs)}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Error rate</DrawerLabel>
                  <DrawerValue>{selected.errorRate}%</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Last health check</DrawerLabel>
                  <DrawerValue>{selected.lastHealthCheck}</DrawerValue>
                </DrawerField>
                <DrawerSectionTitle>Replica health</DrawerSectionTitle>
                {selected.replicaHealth.map((replica) => (
                  <DrawerField key={replica.id}>
                    <DrawerLabel>{replica.id}</DrawerLabel>
                    <DrawerValue>
                      {replica.health} · {replica.share}%
                    </DrawerValue>
                  </DrawerField>
                ))}
                <HelperMuted>
                  Restart is simulated local state only. This prototype does not orchestrate
                  Kubernetes or GPUs.
                </HelperMuted>
              </TabBody>
            </HorizontalTabsContent>
            <HorizontalTabsContent value="traffic">
              <TabBody>
                <DrawerSectionTitle>Load distribution</DrawerSectionTitle>
                {selected.replicaHealth.map((replica) => (
                  <div key={replica.id}>
                    <DrawerField>
                      <DrawerLabel>{replica.id}</DrawerLabel>
                      <DrawerValue>{replica.share}%</DrawerValue>
                    </DrawerField>
                    <PercentBarTrack aria-hidden>
                      <PercentBarFill $pct={replica.share} />
                    </PercentBarTrack>
                  </div>
                ))}
              </TabBody>
            </HorizontalTabsContent>
            <HorizontalTabsContent value="infra">
              <TabBody>
                <DrawerField>
                  <DrawerLabel>Server</DrawerLabel>
                  <DrawerValue>{selected.serverId ?? 'Provider-hosted'}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>GPU IDs</DrawerLabel>
                  <DrawerValue>
                    {selected.gpuIds.length ? selected.gpuIds.join(', ') : 'None'}
                  </DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Allocation</DrawerLabel>
                  <DrawerValue>{selected.gpuAllocationLabel}</DrawerValue>
                </DrawerField>
              </TabBody>
            </HorizontalTabsContent>
            <HorizontalTabsContent value="cost">
              <TabBody>
                <DrawerField>
                  <DrawerLabel>Allocated GPU hours</DrawerLabel>
                  <DrawerValue>{selected.allocatedGpuHours.toLocaleString()}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Used GPU hours</DrawerLabel>
                  <DrawerValue>{selected.usedGpuHours.toLocaleString()}</DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Utilization</DrawerLabel>
                  <DrawerValue>
                    {selected.allocatedGpuHours
                      ? `${Math.round((selected.usedGpuHours / selected.allocatedGpuHours) * 100)}%`
                      : 'n/a'}
                  </DrawerValue>
                </DrawerField>
                <DrawerField>
                  <DrawerLabel>Internal estimated cost</DrawerLabel>
                  <DrawerValue>{formatUsd(selected.internalEstimatedCost)}</DrawerValue>
                </DrawerField>
              </TabBody>
            </HorizontalTabsContent>
          </HorizontalTabs>
        ) : null}
      </ConfigDetailDrawer>

      <Modal
        open={wizardOpen}
        onOpenChange={(open) => {
          if (!open) {
            setWizardOpen(false);
            setStep(1);
          }
        }}
        title="Create deployment"
        subtitle="Simulate a model pool. No real infrastructure is changed."
        modalIcon="icon"
        modalIconSlot={<Layers />}
        footer={
          <ModalFooter
            checkbox={false}
            secondaryActionLabel={step === 1 ? 'Cancel' : 'Back'}
            onSecondaryAction={() => {
              if (step === 1) setWizardOpen(false);
              else setStep((s) => s - 1);
            }}
            primaryActionLabel={step < 5 ? 'Continue' : 'Create deployment'}
            onPrimaryAction={() => {
              if (step < 5) setStep((s) => s + 1);
              else createDeployment();
            }}
          />
        }
      >
        <ModalContent descriptionAsDialogDescription={false}>
          <WizardSteps>
            {[1, 2, 3, 4, 5].map((n) => (
              <WizardStep key={n} $active={step === n} $done={step > n}>
                Step {n}
                {n < 5 ? ' ·' : ''}
              </WizardStep>
            ))}
          </WizardSteps>
          <FormStack>
            {step === 1 ? (
              <Dropdown
                label="Model"
                required
                value={form.modelId}
                options={MODELS.map((m) => ({ value: m.id, label: m.displayName }))}
                onValueChange={(v) => setForm((f) => ({ ...f, modelId: v }))}
              />
            ) : null}
            {step === 2 ? (
              <FormRow>
                <Dropdown
                  label="Environment"
                  value={form.environment}
                  options={[
                    { value: 'Production', label: 'Production' },
                    { value: 'Staging', label: 'Staging' },
                    { value: 'Development', label: 'Development' },
                  ]}
                  onValueChange={(v) => setForm((f) => ({ ...f, environment: v as Environment }))}
                />
                <Dropdown
                  label="Deployment type"
                  value={form.hosting}
                  options={[
                    { value: 'Self-hosted', label: 'Self-hosted' },
                    { value: 'Provider-hosted', label: 'Provider-hosted' },
                  ]}
                  onValueChange={(v) => setForm((f) => ({ ...f, hosting: v as HostingType }))}
                />
              </FormRow>
            ) : null}
            {step === 3 ? (
              <FormRow>
                <TextInput
                  label="Runtime"
                  value={form.runtime}
                  onChange={(e) => setForm((f) => ({ ...f, runtime: e.target.value }))}
                />
                <NumberInput
                  label="Replicas"
                  min={1}
                  max={16}
                  value={form.replicas}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, replicas: typeof value === 'number' ? value : 1 }))
                  }
                />
                {form.hosting === 'Self-hosted' ? (
                  <Dropdown
                    label="Infrastructure"
                    value={form.serverId}
                    options={SERVERS.map((s) => ({ value: s.id, label: s.name }))}
                    onValueChange={(v) => setForm((f) => ({ ...f, serverId: v }))}
                  />
                ) : null}
              </FormRow>
            ) : null}
            {step === 4 ? (
              <FormRow>
                <TextInput
                  label="Deployment name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                <TextInput
                  label="Request path"
                  value={form.requestPath}
                  onChange={(e) => setForm((f) => ({ ...f, requestPath: e.target.value }))}
                  placeholder="/v1/example"
                />
              </FormRow>
            ) : null}
            {step === 5 ? (
              <HelperMuted>
                Create a local simulated deployment for{' '}
                {MODELS.find((m) => m.id === form.modelId)?.displayName} in {form.environment} with{' '}
                {form.replicas} replicas. No cluster changes are made.
              </HelperMuted>
            ) : null}
          </FormStack>
        </ModalContent>
      </Modal>
    </>
  );
}
