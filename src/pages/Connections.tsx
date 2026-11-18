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
  PasswordInput,
  TextInput,
} from '@cake-admin/cakeand';
import { Plug, Plus } from 'lucide-react';
import {
  cloneSeed,
  CONNECTIONS,
  type Connection,
  type ConnectionStatus,
  type HealthStatus,
  type IntegrationType,
  SAMPLE_DATA_NOTE,
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
  FormStack,
  HelperMuted,
  WarningText,
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

const INTEGRATION_OPTIONS = [
  { value: 'Microsoft Foundry', label: 'Microsoft Foundry' },
  { value: 'AWS Bedrock', label: 'AWS Bedrock' },
  { value: 'Self-hosted model on AIC', label: 'Self-hosted model on AIC' },
  { value: 'OpenAI API (direct)', label: 'OpenAI API (direct)' },
];

type SortKey = 'name' | 'integration' | 'status' | 'health' | 'models' | 'lastRead';

const STATUS_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'Enabled', label: 'Enabled' },
  { value: 'Disabled', label: 'Disabled' },
];

const HEALTH_OPTIONS = [
  { value: ALL, label: 'All' },
  { value: 'Healthy', label: 'Healthy' },
  { value: 'Needs attention', label: 'Needs attention' },
];

function discoveredLabel(row: Connection) {
  if (row.deploymentsDiscovered > 0) {
    return `${row.modelsDiscovered} model · ${row.deploymentsDiscovered} deployments`;
  }
  if (row.modelsDiscovered === 0) return '0 models';
  return `${row.modelsDiscovered} discovered model${row.modelsDiscovered === 1 ? '' : 's'}`;
}

export function Connections() {
  const [rows, setRows] = useState(() => cloneSeed(CONNECTIONS));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(ALL);
  const [health, setHealth] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [integration, setIntegration] = useState<IntegrationType>('Microsoft Foundry');
  const [connName, setConnName] = useState('');
  const [purpose, setPurpose] = useState('Usage and cost ingestion');
  const [credential, setCredential] = useState('');
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceValue, setReplaceValue] = useState('');

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (status !== ALL && row.status !== status) return false;
      if (health !== ALL && row.health !== health) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.integration.toLowerCase().includes(q) ||
        row.purpose.toLowerCase().includes(q)
      );
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av =
        sortKey === 'name'
          ? a.name
          : sortKey === 'integration'
            ? a.integration
            : sortKey === 'status'
              ? a.status
              : sortKey === 'health'
                ? a.health
                : sortKey === 'models'
                  ? a.modelsDiscovered
                  : (a.lastSuccessfulRead ?? '');
      const bv =
        sortKey === 'name'
          ? b.name
          : sortKey === 'integration'
            ? b.integration
            : sortKey === 'status'
              ? b.status
              : sortKey === 'health'
                ? b.health
                : sortKey === 'models'
                  ? b.modelsDiscovered
                  : (b.lastSuccessfulRead ?? '');
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, search, status, health, sortKey, sortDir]);

  const healthyCount = rows.filter((r) => r.health === 'Healthy').length;
  const attentionCount = rows.filter((r) => r.health === 'Needs attention').length;

  function toggleSort(key: string) {
    const next = key as SortKey;
    if (sortKey === next) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(next);
      setSortDir('asc');
    }
  }

  function resetWizard() {
    setStep(1);
    setIntegration('Microsoft Foundry');
    setConnName('');
    setPurpose('Usage and cost ingestion');
    setCredential('');
    setTestState('idle');
  }

  function runTest() {
    setTestState('testing');
    window.setTimeout(() => {
      if (integration === 'OpenAI API (direct)') setTestState('fail');
      else setTestState('ok');
    }, 700);
  }

  function saveConnection() {
    const id = `conn-local-${rows.length + 1}`;
    const next: Connection = {
      id,
      name: connName.trim() || `New ${integration}`,
      integration,
      purpose: purpose.trim() || 'Usage and cost ingestion',
      status: 'Enabled',
      health: testState === 'ok' ? 'Healthy' : 'Needs attention',
      modelsDiscovered: testState === 'ok' ? 1 : 0,
      deploymentsDiscovered: 0,
      lastSuccessfulRead: testState === 'ok' ? 'Just now' : null,
      lastChecked: 'Just now',
      workspaceId: 'ws-ops',
      credentialSaved: Boolean(credential.trim()),
      syncHistory: [
        {
          at: 'Just now',
          result: testState === 'ok' ? 'Initial sync succeeded' : 'Saved without successful test',
        },
      ],
    };
    setRows((prev) => [next, ...prev]);
    setCredential('');
    setWizardOpen(false);
    resetWizard();
    setSelectedId(id);
  }

  function setEnabled(id: string, enabled: boolean) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              status: (enabled ? 'Enabled' : 'Disabled') as ConnectionStatus,
              health: (enabled ? (row.health === 'Needs attention' && row.lastSuccessfulRead ? 'Healthy' : row.health) : 'Needs attention') as HealthStatus,
            }
          : row,
      ),
    );
  }

  function testRow(row: Connection) {
    if (row.integration === 'OpenAI API (direct)') {
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                health: 'Needs attention',
                syncHistory: [
                  {
                    at: 'Just now',
                    result:
                      'Test failed — check the credential and network allow-list, then replace the credential and retry.',
                  },
                  ...r.syncHistory,
                ],
              }
            : r,
        ),
      );
    } else {
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                health: 'Healthy',
                lastSuccessfulRead: 'Just now',
                lastChecked: 'Just now',
                syncHistory: [{ at: 'Just now', result: 'Test succeeded' }, ...r.syncHistory],
              }
            : r,
        ),
      );
    }
  }

  return (
    <>
      <ReportHeader
        title="Connections"
        description="Connect TokenOps to AI providers and self-hosted environments."
        actions={
          <HeaderActionButton
            startIcon={<Plus size={16} />}
            onClick={() => {
              resetWizard();
              setWizardOpen(true);
            }}
          >
            Add connection
          </HeaderActionButton>
        }
        filters={
          <>
            <ReportFilterDropdown
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onValueChange={setStatus}
            />
            <ReportFilterDropdown
              label="Health"
              value={health}
              options={HEALTH_OPTIONS}
              onValueChange={setHealth}
            />
          </>
        }
      />

      <MetricGrid>
        <MetricCard label="Connections" value={String(rows.length)} caption={SAMPLE_DATA_NOTE} />
        <MetricCard label="Healthy" value={String(healthyCount)} caption="Enabled and syncing" />
        <MetricCard
          label="Needs attention"
          value={String(attentionCount)}
          caption="Failed or disabled"
        />
        <MetricCard label="Last data read" value="4 min" caption="Across healthy connections" />
      </MetricGrid>

      <ReportPanel
        title="Provider and environment links"
        note="Connections provide access or ingest data. Pricing and rates defines how usage becomes cost."
        actions={<ConfigSearch value={search} onChange={setSearch} placeholder="Search connections" />}
      >
        <ReportTable
          aria-label="Connections"
          $cols={[
            reportCol.widePlus,
            reportCol.wide,
            reportCol.wide,
            reportCol.compact,
            reportCol.compact,
            reportCol.wide,
            reportCol.wide,
            reportCol.icon,
          ].join(' ')}
          header={
            <HeaderRow>
              <SortHeader label="Connection" columnKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} wide />
              <SortHeader label="Integration" columnKey="integration" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} wide />
              <HeaderCell>Purpose</HeaderCell>
              <SortHeader label="Status" columnKey="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Health" columnKey="health" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortHeader label="Models discovered" columnKey="models" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} wide />
              <SortHeader label="Last successful data read" columnKey="lastRead" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} wide />
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
              <WideDataCell>{row.integration}</WideDataCell>
              <WideDataCell>{row.purpose}</WideDataCell>
              <CompactDataCell>
                <CellBadge color={configStatusBadgeColor(row.status)} tone="subtle" dot={false}>
                  {row.status}
                </CellBadge>
              </CompactDataCell>
              <CompactDataCell>
                <CellBadge color={configStatusBadgeColor(row.health)} tone="subtle" dot={false}>
                  {row.health}
                </CellBadge>
              </CompactDataCell>
              <WideDataCell>
                <ValueBadge>{discoveredLabel(row)}</ValueBadge>
              </WideDataCell>
              <WideDataCell>{row.lastSuccessfulRead ?? 'Never successfully read'}</WideDataCell>
              <CompactDataCell>
                <RowActionsMenu
                  label={`Actions for ${row.name}`}
                  actions={[
                    { id: 'view', label: 'View details', onSelect: () => setSelectedId(row.id) },
                    {
                      id: 'toggle',
                      label: row.status === 'Enabled' ? 'Disable' : 'Enable',
                      onSelect: () => setEnabled(row.id, row.status !== 'Enabled'),
                    },
                    { id: 'test', label: 'Test connection', onSelect: () => testRow(row) },
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
        title={selected?.name ?? 'Connection'}
        subtitle={selected?.integration}
        footer={
          selected ? (
            <>
              <Button size="sm" variant="tonal" intent="secondary" onClick={() => setReplaceOpen(true)}>
                Replace credential
              </Button>
              <Button
                size="sm"
                intent="secondary"
                onClick={() => setEnabled(selected.id, selected.status !== 'Enabled')}
              >
                {selected.status === 'Enabled' ? 'Disable connection' : 'Enable connection'}
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <>
            <DrawerSection>
              <DrawerSectionTitle>Overview</DrawerSectionTitle>
              <DrawerField>
                <DrawerLabel>Connection ID</DrawerLabel>
                <DrawerValue>{selected.id}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Integration</DrawerLabel>
                <DrawerValue>{selected.integration}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Purpose</DrawerLabel>
                <DrawerValue>{selected.purpose}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Status</DrawerLabel>
                <DrawerValue>{selected.status}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Health</DrawerLabel>
                <DrawerValue>{selected.health}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Workspace</DrawerLabel>
                <DrawerValue>{selected.workspaceId}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Models discovered</DrawerLabel>
                <DrawerValue>{discoveredLabel(selected)}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Last successful read</DrawerLabel>
                <DrawerValue>{selected.lastSuccessfulRead ?? 'Never'}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Credential</DrawerLabel>
                <DrawerValue>
                  {selected.credentialSaved ? 'Credential saved' : 'No credential on file'}
                </DrawerValue>
              </DrawerField>
            </DrawerSection>
            <DrawerSection>
              <DrawerSectionTitle>Recent synchronization</DrawerSectionTitle>
              {selected.syncHistory.map((entry) => (
                <DrawerField key={`${entry.at}-${entry.result}`}>
                  <DrawerLabel>{entry.at}</DrawerLabel>
                  <DrawerValue>{entry.result}</DrawerValue>
                </DrawerField>
              ))}
            </DrawerSection>
            <DrawerNote>
              TokenOps observes connected environments. This page does not replace provider
              consoles or infrastructure management systems.
            </DrawerNote>
          </>
        ) : null}
      </ConfigDetailDrawer>

      <Modal
        open={wizardOpen}
        onOpenChange={(open) => {
          if (!open) {
            setWizardOpen(false);
            setCredential('');
            resetWizard();
          }
        }}
        title="Add connection"
        subtitle="Link a provider or self-hosted environment. Credentials stay secret after save."
        modalIcon="icon"
        modalIconSlot={<Plug />}
        footer={
          <ModalFooter
            checkbox={false}
            secondaryActionLabel={step === 1 ? 'Cancel' : 'Back'}
            onSecondaryAction={() => {
              if (step === 1) {
                setWizardOpen(false);
                setCredential('');
                resetWizard();
              } else setStep((s) => s - 1);
            }}
            primaryActionLabel={step === 4 ? 'Test connection' : step < 5 ? 'Continue' : 'Save'}
            onPrimaryAction={() => {
              if (step === 4) {
                if (testState === 'idle' || testState === 'fail') runTest();
                else setStep(5);
                return;
              }
              if (step < 5) setStep((s) => s + 1);
              else saveConnection();
            }}
            primaryActionDisabled={
              (step === 2 && !connName.trim()) ||
              (step === 3 && !credential.trim()) ||
              testState === 'testing'
            }
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
                label="Integration"
                required
                value={integration}
                options={INTEGRATION_OPTIONS}
                onValueChange={(v) => setIntegration(v as IntegrationType)}
              />
            ) : null}
            {step === 2 ? (
              <>
                <TextInput
                  label="Connection name"
                  required
                  value={connName}
                  onChange={(e) => setConnName(e.target.value)}
                />
                <TextInput
                  label="Purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </>
            ) : null}
            {step === 3 ? (
              <>
                <PasswordInput
                  label="Credential placeholder"
                  required
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  helperText="Simulated secret. Cleared after save and never shown again."
                />
                <HelperMuted>Do not paste a real production secret into this prototype.</HelperMuted>
              </>
            ) : null}
            {step === 4 ? (
              <>
                <HelperMuted>
                  Testing {integration} for “{connName || 'new connection'}”.
                </HelperMuted>
                {testState === 'testing' ? <HelperMuted>Testing…</HelperMuted> : null}
                {testState === 'ok' ? (
                  <HelperMuted>Test succeeded. Continue to save this connection.</HelperMuted>
                ) : null}
                {testState === 'fail' ? (
                  <WarningText>
                    Test failed for OpenAI API (direct). Check the credential, confirm the sandbox
                    project is active, then replace the credential and retry. This failure is
                    deterministic sample behavior.
                  </WarningText>
                ) : null}
              </>
            ) : null}
            {step === 5 ? (
              <HelperMuted>
                Save “{connName || 'new connection'}” with a{' '}
                {testState === 'ok' ? 'healthy' : 'needs attention'} status. The credential value
                will be cleared from memory after save.
              </HelperMuted>
            ) : null}
          </FormStack>
        </ModalContent>
      </Modal>

      <Modal
        open={replaceOpen}
        onOpenChange={(open) => {
          if (!open) {
            setReplaceOpen(false);
            setReplaceValue('');
          }
        }}
        title="Replace credential"
        subtitle="Enter a new placeholder secret. The previous value is never shown."
        modalIcon="icon"
        modalIconSlot={<Plug />}
        footer={
          <ModalFooter
            checkbox={false}
            secondaryActionLabel="Cancel"
            onSecondaryAction={() => {
              setReplaceOpen(false);
              setReplaceValue('');
            }}
            primaryActionLabel="Save credential"
            onPrimaryAction={() => {
              if (!selected) return;
              setRows((prev) =>
                prev.map((row) =>
                  row.id === selected.id ? { ...row, credentialSaved: true } : row,
                ),
              );
              setReplaceValue('');
              setReplaceOpen(false);
            }}
            primaryActionDisabled={!replaceValue.trim()}
          />
        }
      >
        <ModalContent descriptionAsDialogDescription={false}>
          <PasswordInput
            label="New credential"
            value={replaceValue}
            onChange={(e) => setReplaceValue(e.target.value)}
          />
        </ModalContent>
      </Modal>
    </>
  );
}
