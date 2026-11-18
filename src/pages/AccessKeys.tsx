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
  TextInput,
} from '@cake-admin/cakeand';
import { Copy, KeyRound, Plus } from 'lucide-react';
import {
  ACCESS_KEYS,
  cloneSeed,
  formatTokens,
  MODELS,
  QUOTAS,
  SAMPLE_DATA_NOTE,
  WORKSPACES,
  workspaceById,
  type AccessKeyRecord,
  type AccessKeyStatus,
  type Environment,
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
  CellBadgeCluster,
  CompactDataCell,
  MetricCard,
  MetricGrid,
  ReportFilterDropdown,
  HeaderActionButton,
  ReportHeader,
  ReportPanel,
  ReportTable,
  WideDataCell,
  reportCol,
} from './ReportPage';

const ALL = 'all';
type SortKey = 'name' | 'workspace' | 'environment' | 'created' | 'expires' | 'status';

function maskPrefix(seed: string) {
  const slug = seed.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase() || 'key';
  return `tok_live_bs_${slug}_••••${slug.slice(0, 4).toUpperCase()}`;
}

function oneTimeSecret(seed: string) {
  return `tok_live_bs_${seed}_demo_ONLY_SHOWN_ONCE_9F3A2C`;
}

export function AccessKeys() {
  const [rows, setRows] = useState(() => cloneSeed(ACCESS_KEYS));
  const [search, setSearch] = useState('');
  const [workspace, setWorkspace] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [environment, setEnvironment] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState('');
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: '',
    workspaceId: 'ws-travel',
    environment: 'Production' as Environment,
    modelIds: ['model-frontier-l'] as string[],
    expires: '',
    quotaId: '',
  });

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const revokeTarget = rows.find((r) => r.id === revokeId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (workspace !== ALL && row.workspaceId !== workspace) return false;
      if (status !== ALL && row.status !== status) return false;
      if (environment !== ALL && row.environment !== environment) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.prefix.toLowerCase().includes(q) ||
        (workspaceById(row.workspaceId)?.name ?? '').toLowerCase().includes(q)
      );
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av =
        sortKey === 'name'
          ? a.name
          : sortKey === 'workspace'
            ? (workspaceById(a.workspaceId)?.name ?? '')
            : sortKey === 'environment'
              ? a.environment
              : sortKey === 'created'
                ? a.created
                : sortKey === 'expires'
                  ? (a.expires ?? '')
                  : a.status;
      const bv =
        sortKey === 'name'
          ? b.name
          : sortKey === 'workspace'
            ? (workspaceById(b.workspaceId)?.name ?? '')
            : sortKey === 'environment'
              ? b.environment
              : sortKey === 'created'
                ? b.created
                : sortKey === 'expires'
                  ? (b.expires ?? '')
                  : b.status;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, search, workspace, status, environment, sortKey, sortDir]);

  function toggleSort(key: string) {
    const next = key as SortKey;
    if (sortKey === next) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(next);
      setSortDir('asc');
    }
  }

  function createKey() {
    const id = `key-local-${rows.length + 1}`;
    const secret = oneTimeSecret(String(rows.length + 1));
    const next: AccessKeyRecord = {
      id,
      name: form.name.trim() || 'New access key',
      prefix: maskPrefix(form.name || id),
      workspaceId: form.workspaceId,
      environment: form.environment,
      modelIds: form.modelIds,
      created: '2025-11-18',
      lastUsed: null,
      expires: form.expires.trim() || null,
      status: 'Active',
      quotaId: form.quotaId || null,
      requestCount: 0,
      recentActivity: [{ at: 'Just now', summary: 'Key created' }],
    };
    setRows((prev) => [next, ...prev]);
    setCreateOpen(false);
    setRevealedSecret(secret);
    setCopied(false);
    setRevealOpen(true);
    setSelectedId(id);
  }

  function confirmRevoke() {
    if (!revokeId) return;
    setRows((prev) =>
      prev.map((row) =>
        row.id === revokeId
          ? {
              ...row,
              status: 'Revoked' as AccessKeyStatus,
              recentActivity: [
                { at: 'Just now', summary: 'Key revoked' },
                ...row.recentActivity,
              ],
            }
          : row,
      ),
    );
    setRevokeId(null);
  }

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(revealedSecret);
      setCopied(true);
    } catch {
      setCopied(true);
    }
  }

  return (
    <>
      <ReportHeader
        title="Access keys"
        description="Create and manage keys that applications use to access models through TokenOps."
        actions={
          <HeaderActionButton startIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Create access key
          </HeaderActionButton>
        }
        filters={
          <>
            <ReportFilterDropdown
              label="Workspace"
              value={workspace}
              options={[
                { value: ALL, label: 'All' },
                ...WORKSPACES.map((w) => ({ value: w.id, label: w.name })),
              ]}
              onValueChange={setWorkspace}
            />
            <ReportFilterDropdown
              label="Status"
              value={status}
              options={[
                { value: ALL, label: 'All' },
                { value: 'Active', label: 'Active' },
                { value: 'Expiring soon', label: 'Expiring soon' },
                { value: 'Revoked', label: 'Revoked' },
              ]}
              onValueChange={setStatus}
            />
            <ReportFilterDropdown
              label="Environment"
              value={environment}
              options={[
                { value: ALL, label: 'All' },
                { value: 'Production', label: 'Production' },
                { value: 'Staging', label: 'Staging' },
                { value: 'Development', label: 'Development' },
              ]}
              onValueChange={setEnvironment}
            />
          </>
        }
      />

      <MetricGrid>
        <MetricCard
          label="Active keys"
          value={String(rows.filter((r) => r.status === 'Active' || r.status === 'Expiring soon').length)}
          caption={SAMPLE_DATA_NOTE}
        />
        <MetricCard
          label="Expiring soon"
          value={String(rows.filter((r) => r.status === 'Expiring soon').length)}
          caption="Rotate before expiry"
        />
        <MetricCard
          label="Revoked"
          value={String(rows.filter((r) => r.status === 'Revoked').length)}
          caption="Cannot return to Active"
        />
        <MetricCard label="Requests this month" value="12.6M" caption="Across active keys" />
      </MetricGrid>

      <ReportPanel
        title="TokenOps-issued keys"
        note="Access keys grant controlled access through TokenOps. They are not provider credentials."
        actions={<ConfigSearch value={search} onChange={setSearch} placeholder="Search keys" />}
      >
        <ReportTable
          aria-label="Access keys"
          $cols={[
            reportCol.wide,
            reportCol.widePlus,
            reportCol.wide,
            reportCol.compact,
            reportCol.wide,
            reportCol.compact,
            reportCol.compact,
            reportCol.compact,
            reportCol.compact,
            reportCol.icon,
          ].join(' ')}
          header={
            <HeaderRow>
              <SortHeader label="Key name" columnKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} wide />
              <HeaderCell>Key prefix</HeaderCell>
              <SortHeader label="Workspace" columnKey="workspace" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} wide />
              <SortHeader label="Environment" columnKey="environment" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <HeaderCell>Models</HeaderCell>
              <SortHeader label="Created" columnKey="created" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <HeaderCell>Last used</HeaderCell>
              <SortHeader label="Expires" columnKey="expires" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
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
              <WideDataCell>{row.name}</WideDataCell>
              <WideDataCell>{row.prefix}</WideDataCell>
              <WideDataCell>{workspaceById(row.workspaceId)?.name}</WideDataCell>
              <CompactDataCell>
                <CellBadge color={configStatusBadgeColor(row.environment)} tone="subtle" dot={false}>
                  {row.environment}
                </CellBadge>
              </CompactDataCell>
              <WideDataCell>
                <CellBadgeCluster>
                  {row.modelIds.map((id) => {
                    const name = MODELS.find((m) => m.id === id)?.displayName ?? id;
                    return (
                      <CellBadge key={id} color={modelBadgeColor(name)} tone="subtle" dot={false}>
                        {name}
                      </CellBadge>
                    );
                  })}
                </CellBadgeCluster>
              </WideDataCell>
              <CompactDataCell>{row.created}</CompactDataCell>
              <CompactDataCell>{row.lastUsed ?? 'Never'}</CompactDataCell>
              <CompactDataCell>{row.expires ?? 'None'}</CompactDataCell>
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
                    {
                      id: 'revoke',
                      label: 'Revoke key',
                      disabled: row.status === 'Revoked',
                      onSelect: () => setRevokeId(row.id),
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
        title={selected?.name ?? 'Access key'}
        subtitle={selected?.prefix}
        footer={
          selected && selected.status !== 'Revoked' ? (
            <Button size="sm" intent="secondary" onClick={() => setRevokeId(selected.id)}>
              Revoke key
            </Button>
          ) : null
        }
      >
        {selected ? (
          <>
            <DrawerSection>
              <DrawerSectionTitle>Key details</DrawerSectionTitle>
              <DrawerField>
                <DrawerLabel>Prefix</DrawerLabel>
                <DrawerValue>{selected.prefix}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Workspace</DrawerLabel>
                <DrawerValue>{workspaceById(selected.workspaceId)?.name}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Environment</DrawerLabel>
                <DrawerValue>{selected.environment}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Allowed models</DrawerLabel>
                <DrawerValue>
                  {selected.modelIds
                    .map((id) => MODELS.find((m) => m.id === id)?.displayName ?? id)
                    .join(', ')}
                </DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Created</DrawerLabel>
                <DrawerValue>{selected.created}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Last used</DrawerLabel>
                <DrawerValue>{selected.lastUsed ?? 'Never'}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Expiration</DrawerLabel>
                <DrawerValue>{selected.expires ?? 'None'}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Linked quota</DrawerLabel>
                <DrawerValue>
                  {selected.quotaId
                    ? (QUOTAS.find((q) => q.id === selected.quotaId)?.name ?? selected.quotaId)
                    : 'None'}
                </DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Request count</DrawerLabel>
                <DrawerValue>{formatTokens(selected.requestCount)}</DrawerValue>
              </DrawerField>
              <DrawerField>
                <DrawerLabel>Status</DrawerLabel>
                <DrawerValue>{selected.status}</DrawerValue>
              </DrawerField>
            </DrawerSection>
            <DrawerSection>
              <DrawerSectionTitle>Recent activity</DrawerSectionTitle>
              {selected.recentActivity.map((entry) => (
                <DrawerField key={`${entry.at}-${entry.summary}`}>
                  <DrawerLabel>{entry.at}</DrawerLabel>
                  <DrawerValue>{entry.summary}</DrawerValue>
                </DrawerField>
              ))}
            </DrawerSection>
            {selected.status === 'Revoked' ? (
              <WarningText>Revoked keys cannot return to Active in this prototype.</WarningText>
            ) : (
              <DrawerNote>Full key material is shown only once at creation.</DrawerNote>
            )}
          </>
        ) : null}
      </ConfigDetailDrawer>

      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create access key"
        subtitle="Issue a TokenOps key for an application or workspace."
        modalIcon="icon"
        modalIconSlot={<KeyRound />}
        footer={
          <ModalFooter
            checkbox={false}
            secondaryActionLabel="Cancel"
            onSecondaryAction={() => setCreateOpen(false)}
            primaryActionLabel="Create access key"
            onPrimaryAction={createKey}
            primaryActionDisabled={!form.name.trim()}
          />
        }
      >
        <ModalContent descriptionAsDialogDescription={false}>
          <FormStack>
            <TextInput
              label="Key name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FormRow>
              <Dropdown
                label="Workspace"
                value={form.workspaceId}
                options={WORKSPACES.map((w) => ({ value: w.id, label: w.name }))}
                onValueChange={(v) => setForm((f) => ({ ...f, workspaceId: v }))}
              />
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
            </FormRow>
            <Dropdown
              label="Allowed model"
              value={form.modelIds[0] ?? 'model-frontier-l'}
              options={MODELS.map((m) => ({ value: m.id, label: m.displayName }))}
              onValueChange={(v) => setForm((f) => ({ ...f, modelIds: [v] }))}
            />
            <FormRow>
              <TextInput
                label="Optional expiration"
                value={form.expires}
                onChange={(e) => setForm((f) => ({ ...f, expires: e.target.value }))}
                placeholder="YYYY-MM-DD"
              />
              <Dropdown
                label="Optional quota"
                value={form.quotaId || 'none'}
                options={[
                  { value: 'none', label: 'None' },
                  ...QUOTAS.map((q) => ({ value: q.id, label: q.name })),
                ]}
                onValueChange={(v) => setForm((f) => ({ ...f, quotaId: v === 'none' ? '' : v }))}
              />
            </FormRow>
            <HelperMuted>The full key value is shown once after creation, then discarded.</HelperMuted>
          </FormStack>
        </ModalContent>
      </Modal>

      <Modal
        open={revealOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRevealOpen(false);
            setRevealedSecret('');
            setCopied(false);
          }
        }}
        title="Copy your access key"
        subtitle="This is the only time the full key is shown. Store it securely."
        modalIcon="icon"
        modalIconSlot={<KeyRound />}
        footer={
          <ModalFooter
            checkbox={false}
            secondaryActionLabel="Copy"
            onSecondaryAction={() => {
              void copySecret();
            }}
            primaryActionLabel="Close"
            onPrimaryAction={() => {
              setRevealOpen(false);
              setRevealedSecret('');
              setCopied(false);
            }}
          />
        }
      >
        <ModalContent descriptionAsDialogDescription={false}>
          <FormStack>
            <TextInput label="Access key" value={revealedSecret} readOnly />
            <Button size="sm" variant="tonal" intent="secondary" startIcon={<Copy size={16} />} onClick={() => void copySecret()}>
              {copied ? 'Copied' : 'Copy key'}
            </Button>
            <WarningText>After you close this dialog, only the masked prefix remains visible.</WarningText>
          </FormStack>
        </ModalContent>
      </Modal>

      <Modal
        open={Boolean(revokeId)}
        onOpenChange={(open) => {
          if (!open) setRevokeId(null);
        }}
        title="Revoke access key"
        subtitle={
          revokeTarget
            ? `Revoke “${revokeTarget.name}”? Applications using this key will lose access in the prototype.`
            : undefined
        }
        modalIcon="error"
        footer={
          <ModalFooter
            checkbox={false}
            secondaryActionLabel="Cancel"
            onSecondaryAction={() => setRevokeId(null)}
            primaryActionLabel="Revoke"
            onPrimaryAction={confirmRevoke}
          />
        }
      >
        <ModalContent
          description="Revoked keys cannot be reactivated with a simple toggle."
          descriptionAsDialogDescription={false}
        />
      </Modal>
    </>
  );
}
