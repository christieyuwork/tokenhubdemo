import { useMemo, useState } from 'react';
import {
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
import { Cpu, Plus } from 'lucide-react';
import {
  cloneSeed,
  deploymentById,
  GPUS,
  SAMPLE_DATA_NOTE,
  SERVERS,
  serverById,
  type GpuRecord,
  type HealthStatus,
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
import { ConfigSearch, FormRow, FormStack, HelperMuted } from '../components/config/ConfigPageChrome';
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
type SortKey = 'gpu' | 'server' | 'assignment' | 'utilization' | 'health';

export function GpuRegistry() {
  const [rows, setRows] = useState(() => cloneSeed(GPUS));
  const [search, setSearch] = useState('');
  const [server, setServer] = useState(ALL);
  const [assignment, setAssignment] = useState(ALL);
  const [health, setHealth] = useState(ALL);
  const [gpuType, setGpuType] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('gpu');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState({
    label: '',
    serverId: 'srv-dc1-01',
    gpuType: 'NVIDIA H100 80GB',
    memoryGb: 80,
    serial: '',
    location: 'Brightsky data center 1',
    cluster: 'aic-prod-a',
    monitoringSource: 'AIC telemetry',
    status: 'Healthy' as HealthStatus,
  });

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (server !== ALL && row.serverId !== server) return false;
      if (assignment === 'assigned' && !row.deploymentId) return false;
      if (assignment === 'unassigned' && row.deploymentId) return false;
      if (assignment !== ALL && assignment !== 'assigned' && assignment !== 'unassigned') {
        if (row.deploymentId !== assignment) return false;
      }
      if (health !== ALL && row.health !== health) return false;
      if (gpuType !== ALL && row.gpuType !== gpuType) return false;
      if (!q) return true;
      const dep = row.deploymentId ? deploymentById(row.deploymentId)?.name : '';
      return (
        row.label.toLowerCase().includes(q) ||
        row.serverId.toLowerCase().includes(q) ||
        (dep ?? '').toLowerCase().includes(q)
      );
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av =
        sortKey === 'gpu'
          ? Number(a.label.replace(/\D/g, ''))
          : sortKey === 'server'
            ? a.serverId
            : sortKey === 'assignment'
              ? (a.deploymentId ?? '')
              : sortKey === 'utilization'
                ? a.utilization
                : a.health;
      const bv =
        sortKey === 'gpu'
          ? Number(b.label.replace(/\D/g, ''))
          : sortKey === 'server'
            ? b.serverId
            : sortKey === 'assignment'
              ? (b.deploymentId ?? '')
              : sortKey === 'utilization'
                ? b.utilization
                : b.health;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, search, server, assignment, health, gpuType, sortKey, sortDir]);

  function toggleSort(key: string) {
    const next = key as SortKey;
    if (sortKey === next) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(next);
      setSortDir('asc');
    }
  }

  function registerGpu() {
    const id = `gpu-local-${rows.length + 1}`;
    const next: GpuRecord = {
      id,
      label: form.label.trim() || `GPU ${rows.length + 1}`,
      serverId: form.serverId,
      gpuType: form.gpuType,
      memoryGb: form.memoryGb,
      serial: form.serial.trim() || `BS-H100-${id.toUpperCase()}`,
      location: form.location,
      cluster: form.cluster,
      monitoringSource: form.monitoringSource,
      deploymentId: null,
      utilization: 0,
      memoryUsedGb: 0,
      temperatureC: 42,
      powerW: 120,
      health: form.status,
      lastTelemetry: 'Just now',
      healthEvents: [{ at: 'Just now', message: 'Registered in TokenOps inventory', severity: 'Healthy' }],
    };
    setRows((prev) => [...prev, next]);
    setRegisterOpen(false);
    setSelectedId(id);
  }

  return (
    <>
      <ReportHeader
        title="GPU registry"
        description="View the GPUs available for self-hosted model deployments."
        actions={
          <HeaderActionButton startIcon={<Plus size={16} />} onClick={() => setRegisterOpen(true)}>
            Register GPU
          </HeaderActionButton>
        }
        filters={
          <>
            <ReportFilterDropdown
              label="Server"
              value={server}
              options={[
                { value: ALL, label: 'All' },
                ...SERVERS.map((s) => ({ value: s.id, label: s.name })),
              ]}
              onValueChange={setServer}
            />
            <ReportFilterDropdown
              label="Assignment"
              value={assignment}
              options={[
                { value: ALL, label: 'All' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'unassigned', label: 'Unassigned' },
                { value: 'dep-travel', label: 'Travel assistant' },
                { value: 'dep-crew', label: 'Crew scheduling' },
              ]}
              onValueChange={setAssignment}
            />
            <ReportFilterDropdown
              label="Health"
              value={health}
              options={[
                { value: ALL, label: 'All' },
                { value: 'Healthy', label: 'Healthy' },
                { value: 'Warning', label: 'Warning' },
              ]}
              onValueChange={setHealth}
            />
            <ReportFilterDropdown
              label="GPU type"
              value={gpuType}
              options={[
                { value: ALL, label: 'All' },
                { value: 'NVIDIA H100 80GB', label: 'NVIDIA H100 80GB' },
              ]}
              onValueChange={setGpuType}
            />
          </>
        }
      />

      <MetricGrid>
        <MetricCard label="Registered GPUs" value={String(rows.length)} caption={SAMPLE_DATA_NOTE} />
        <MetricCard label="Servers" value="2" caption="Brightsky data center 1" />
        <MetricCard
          label="Assigned GPUs"
          value={String(rows.filter((r) => r.deploymentId).length)}
          caption="Linked to deployments"
        />
        <MetricCard
          label="Attention required"
          value={String(rows.filter((r) => r.health === 'Warning').length)}
          caption="Noncritical telemetry"
        />
      </MetricGrid>

      <ReportPanel
        title="Accelerator inventory"
        note="TokenOps observes and references GPU resources. It does not replace the underlying infrastructure-management system."
        actions={<ConfigSearch value={search} onChange={setSearch} placeholder="Search GPUs" />}
      >
        <ReportTable
          aria-label="GPU registry"
          $cols={[
            reportCol.compact,
            reportCol.metric,
            reportCol.wide,
            reportCol.compact,
            reportCol.wide,
            reportCol.widePlus,
            reportCol.metric,
            reportCol.metric,
            reportCol.metric,
            reportCol.compact,
            reportCol.icon,
          ].join(' ')}
          header={
            <HeaderRow>
              <SortHeader label="GPU" columnKey="gpu" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Server" columnKey="server" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <HeaderCell>GPU type</HeaderCell>
              <HeaderCell>Memory</HeaderCell>
              <HeaderCell>Cluster or location</HeaderCell>
              <SortHeader label="Assigned deployment" columnKey="assignment" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} wide />
              <SortHeader label="Utilization" columnKey="utilization" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <HeaderCell>Temperature</HeaderCell>
              <HeaderCell>Power</HeaderCell>
              <SortHeader label="Health" columnKey="health" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <HeaderCell>Actions</HeaderCell>
            </HeaderRow>
          }
        >
          {filtered.map((row, index) => {
            const dep = row.deploymentId ? deploymentById(row.deploymentId) : null;
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
                  <ValueBadge>{row.label}</ValueBadge>
                </CompactDataCell>
                <CompactDataCell>
                  <ValueBadge>{serverById(row.serverId)?.name ?? row.serverId}</ValueBadge>
                </CompactDataCell>
                <WideDataCell>{row.gpuType}</WideDataCell>
                <CompactDataCell>
                  <ValueBadge>{row.memoryGb} GB</ValueBadge>
                </CompactDataCell>
                <WideDataCell>{row.location}</WideDataCell>
                <WideDataCell>{dep?.name ?? 'Unassigned'}</WideDataCell>
                <CompactDataCell>
                  <ValueBadge>{row.utilization}%</ValueBadge>
                </CompactDataCell>
                <CompactDataCell>
                  <ValueBadge>{row.temperatureC}°C</ValueBadge>
                </CompactDataCell>
                <CompactDataCell>
                  <ValueBadge>{row.powerW} W</ValueBadge>
                </CompactDataCell>
                <CompactDataCell>
                  <CellBadge color={configStatusBadgeColor(row.health)} tone="subtle" dot={false}>
                    {row.health}
                  </CellBadge>
                </CompactDataCell>
                <CompactDataCell>
                  <RowActionsMenu
                    label={`Actions for ${row.label}`}
                    actions={[
                      { id: 'view', label: 'View details', onSelect: () => setSelectedId(row.id) },
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
        title={selected?.label ?? 'GPU'}
        subtitle={selected ? `${selected.gpuType} · ${selected.serverId}` : undefined}
      >
        {selected ? (
          <>
            <DrawerSection>
              <DrawerSectionTitle>Hardware information</DrawerSectionTitle>
              <DrawerField>
                <DrawerLabel>Serial / asset ID</DrawerLabel>
                <DrawerValue>{selected.serial}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Memory</DrawerLabel>
                <DrawerValue>{selected.memoryGb} GB</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Server</DrawerLabel>
                <DrawerValue>{serverById(selected.serverId)?.name}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Location</DrawerLabel>
                <DrawerValue>{selected.location}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Cluster</DrawerLabel>
                <DrawerValue>{selected.cluster}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Monitoring source</DrawerLabel>
                <DrawerValue>{selected.monitoringSource}</DrawerValue>
              </DrawerField>
            </DrawerSection>
            <DrawerSection>
              <DrawerSectionTitle>Current deployment</DrawerSectionTitle>
              <DrawerField>
                <DrawerLabel>Deployment</DrawerLabel>
                <DrawerValue>
                  {selected.deploymentId
                    ? (deploymentById(selected.deploymentId)?.name ?? selected.deploymentId)
                    : 'Unassigned'}
                </DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Utilization</DrawerLabel>
                <DrawerValue>{selected.utilization}%</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>GPU memory used</DrawerLabel>
                <DrawerValue>
                  {selected.memoryUsedGb} GB of {selected.memoryGb} GB
                </DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Temperature</DrawerLabel>
                <DrawerValue>{selected.temperatureC}°C</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Power draw</DrawerLabel>
                <DrawerValue>{selected.powerW} W</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Last telemetry</DrawerLabel>
                <DrawerValue>{selected.lastTelemetry}</DrawerValue>
              </DrawerField>
            </DrawerSection>
            <DrawerSection>
              <DrawerSectionTitle>Recent health events</DrawerSectionTitle>
              {selected.healthEvents.map((event) => (
                <DrawerField key={`${event.at}-${event.message}`}>
                  <DrawerLabel>{event.at}</DrawerLabel>
                  <DrawerValue>
                    {event.severity}: {event.message}
                  </DrawerValue>
                </DrawerField>
              ))}
            </DrawerSection>
            <DrawerNote>
              Inventory only — TokenOps does not provision or orchestrate these accelerators.
            </DrawerNote>
          </>
        ) : null}
      </ConfigDetailDrawer>

      <Modal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        title="Register GPU"
        subtitle="Add a physical accelerator to the TokenOps inventory."
        modalIcon="icon"
        modalIconSlot={<Cpu />}
        footer={
          <ModalFooter
            checkbox={false}
            secondaryActionLabel="Cancel"
            onSecondaryAction={() => setRegisterOpen(false)}
            primaryActionLabel="Register GPU"
            onPrimaryAction={registerGpu}
            primaryActionDisabled={!form.label.trim() && !form.serial.trim()}
          />
        }
      >
        <ModalContent descriptionAsDialogDescription={false}>
          <FormStack>
            <FormRow>
              <TextInput
                label="GPU ID"
                required
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="GPU 9"
              />
              <Dropdown
                label="Server"
                value={form.serverId}
                options={SERVERS.map((s) => ({ value: s.id, label: s.name }))}
                onValueChange={(v) => setForm((f) => ({ ...f, serverId: v }))}
              />
            </FormRow>
            <FormRow>
              <TextInput
                label="GPU type"
                value={form.gpuType}
                onChange={(e) => setForm((f) => ({ ...f, gpuType: e.target.value }))}
              />
              <NumberInput
                label="Memory (GB)"
                value={form.memoryGb}
                min={1}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, memoryGb: typeof value === 'number' ? value : 80 }))
                }
              />
            </FormRow>
            <TextInput
              label="Serial or asset ID"
              value={form.serial}
              onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))}
            />
            <FormRow>
              <TextInput
                label="Location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <TextInput
                label="Cluster"
                value={form.cluster}
                onChange={(e) => setForm((f) => ({ ...f, cluster: e.target.value }))}
              />
            </FormRow>
            <FormRow>
              <TextInput
                label="Monitoring source"
                value={form.monitoringSource}
                onChange={(e) => setForm((f) => ({ ...f, monitoringSource: e.target.value }))}
              />
              <Dropdown
                label="Status"
                value={form.status}
                options={[
                  { value: 'Healthy', label: 'Healthy' },
                  { value: 'Warning', label: 'Warning' },
                ]}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as HealthStatus }))}
              />
            </FormRow>
            <HelperMuted>Registration updates local inventory only.</HelperMuted>
          </FormStack>
        </ModalContent>
      </Modal>
    </>
  );
}
