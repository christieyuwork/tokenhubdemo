import { useEffect, useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalFooter,
  NumberInput,
  Switch,
  TextInput,
} from '@cake-admin/cakeand';
import styled, { createGlobalStyle } from 'styled-components';
import {
  COST_QUALITY_OPTIONS,
  GOVERNANCE_OPTIONS,
  PII_DETECTOR_OPTIONS,
  SECURITY_PATTERN_OPTIONS,
  getPolicy,
  type HostingLabel,
  type PolicyId,
  type PromptEvaluation,
  type RoutingPolicy,
  type TryJudgement,
} from '../../data/routingDemo';

/** cake& Modal is fixed at 480px; widen only dialogs that host this form. */
const WidePolicyModalStyles = createGlobalStyle`
  [role='dialog']:has([data-policy-form]) {
    width: min(64rem, calc(100vw - var(--space-800) * 2)) !important;
    min-width: min(36rem, calc(100vw - var(--space-800) * 2)) !important;
    max-width: min(64rem, calc(100vw - var(--space-800) * 2)) !important;
  }
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-500);
  width: 100%;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-500) var(--space-400);
  align-items: start;
  width: 100%;
`;

const NameRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-400);
  align-items: end;
  width: 100%;
`;

/** Aligns the Active switch with the text input control beside it. */
const SwitchSlot = styled.div`
  display: flex;
  align-items: center;
  min-height: var(--space-800);
  padding-bottom: var(--space-050);
`;

export interface PolicyFormValues {
  name: string;
  scope: string;
  status: 'Active' | 'Inactive';
  priorityOrder: number;
  eligibleModels: string;
  eligibleHosting: string;
  securityRules: string;
  governanceRules: string;
  dataResidency: string;
  qualityFloor: number;
  costPreference: string;
  latencyTarget: string;
  infrastructureRequirement: string;
  fallback: string;
}

function emptyForm(): PolicyFormValues {
  return {
    name: '',
    scope: '',
    status: 'Active',
    priorityOrder: 1,
    eligibleModels: '',
    eligibleHosting: '',
    securityRules: '',
    governanceRules: '',
    dataResidency: '',
    qualityFloor: 80,
    costPreference: 'Prefer lower estimated cost when quality and latency are met',
    latencyTarget: 'Standard',
    infrastructureRequirement: '',
    fallback: '',
  };
}

function toForm(policy?: RoutingPolicy | null): PolicyFormValues {
  if (!policy) return emptyForm();
  return {
    name: policy.name,
    scope: policy.scope,
    status: policy.status,
    priorityOrder: policy.priorityOrder,
    eligibleModels: policy.eligibleModels.join(' · '),
    eligibleHosting: policy.eligibleHosting.join(' · '),
    securityRules: policy.securityRules.join(' · '),
    governanceRules: policy.governanceRules.join(' · '),
    dataResidency: policy.dataResidency ?? '',
    qualityFloor: policy.qualityFloor,
    costPreference: policy.costPreference,
    latencyTarget: policy.latencyTarget,
    infrastructureRequirement: policy.infrastructureRequirement,
    fallback: policy.fallback,
  };
}

function optionLabel<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Prefill Create policy from Test a Prompt judgement + selected route. */
export function policyFormFromTrySession(
  judgement: TryJudgement,
  evaluation: PromptEvaluation | null,
  sourcePolicyId: PolicyId,
): PolicyFormValues {
  const source = getPolicy(sourcePolicyId);
  const selected =
    evaluation?.lanes.find((lane) => lane.isRouted) ??
    evaluation?.lanes.find((lane) => lane.candidateId === evaluation.selectedId);

  const securityLabel = optionLabel(
    SECURITY_PATTERN_OPTIONS,
    judgement.securityPatterns,
  );
  const governanceLabel = optionLabel(GOVERNANCE_OPTIONS, judgement.governance);
  const costLabel = optionLabel(COST_QUALITY_OPTIONS, judgement.costQuality);
  const piiLabel = optionLabel(PII_DETECTOR_OPTIONS, judgement.piiDetector);

  const securityRules =
    judgement.securityPatterns === 'none'
      ? 'No security patterns'
      : `Reject request when pattern matches · ${securityLabel}`;

  const governanceParts = [governanceLabel];
  if (judgement.piiDetector !== 'none') {
    governanceParts.push(`PII detector · ${piiLabel}`);
  }

  return {
    ...emptyForm(),
    name: '',
    scope: source.scope,
    status: 'Active',
    priorityOrder: source.priorityOrder,
    eligibleModels: selected?.model ?? source.eligibleModels.join(' · '),
    eligibleHosting: selected?.hosting ?? source.eligibleHosting.join(' · '),
    securityRules,
    governanceRules: governanceParts.join(' · '),
    dataResidency:
      judgement.governance === 'pii-inside-only'
        ? 'Keep PII on inside / in-country models'
        : source.dataResidency ?? '',
    qualityFloor: source.qualityFloor,
    costPreference: costLabel,
    latencyTarget: selected
      ? `${selected.latencyMs} ms observed on selected route`
      : source.latencyTarget,
    infrastructureRequirement: selected?.hosting ?? source.infrastructureRequirement,
    fallback: source.fallback || 'Hold request when no eligible model remains',
  };
}

function splitList(value: string): string[] {
  return value
    .split(/[·,|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

interface PolicyFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  policy?: RoutingPolicy | null;
  /** Create-mode prefill from Test a Prompt (or other flows). */
  seedValues?: PolicyFormValues | null;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PolicyFormValues, editId?: PolicyId) => void;
}

export function PolicyFormModal({
  open,
  mode,
  policy,
  seedValues = null,
  onOpenChange,
  onSave,
}: PolicyFormModalProps) {
  const [form, setForm] = useState<PolicyFormValues>(() => toForm(policy));

  useEffect(() => {
    if (!open) return;
    if (mode === 'create' && seedValues) {
      setForm(seedValues);
      return;
    }
    setForm(toForm(policy));
  }, [open, mode, policy, seedValues]);

  function update<K extends keyof PolicyFormValues>(key: K, value: PolicyFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      {open ? <WidePolicyModalStyles /> : null}
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={mode === 'create' ? 'Create routing policy' : 'Edit routing policy'}
        subtitle="Security and governance constraints are evaluated before cost and quality."
        footer={
          <ModalFooter
            checkbox={false}
            secondaryActionLabel="Cancel"
            onSecondaryAction={() => onOpenChange(false)}
            primaryActionLabel={mode === 'create' ? 'Create policy' : 'Save changes'}
            primaryActionDisabled={!form.name.trim()}
            onPrimaryAction={() => {
              if (!form.name.trim()) return;
              onSave(form, policy?.id);
              onOpenChange(false);
            }}
          />
        }
      >
        <ModalContent descriptionAsDialogDescription={false} data-policy-form="">
          <Form>
            <NameRow>
              <TextInput
                label="Policy name"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
              />
              <SwitchSlot>
                <Switch
                  label="Active"
                  checked={form.status === 'Active'}
                  onCheckedChange={(checked) => update('status', checked ? 'Active' : 'Inactive')}
                />
              </SwitchSlot>
            </NameRow>

            <TextInput
              label="Workload scope"
              value={form.scope}
              onChange={(event) => update('scope', event.target.value)}
            />

            <Row>
              <NumberInput
                label="Policy priority"
                value={form.priorityOrder}
                onValueChange={(value) => update('priorityOrder', value ?? 1)}
              />
              <NumberInput
                label="Minimum quality"
                value={form.qualityFloor}
                onValueChange={(value) => update('qualityFloor', value ?? 80)}
              />
            </Row>

            <TextInput
              label="Eligible models"
              value={form.eligibleModels}
              onChange={(event) => update('eligibleModels', event.target.value)}
              helperText="Separate with · or commas"
            />

            <TextInput
              label="Eligible hosting environments"
              value={form.eligibleHosting}
              onChange={(event) => update('eligibleHosting', event.target.value)}
              helperText="Separate with · or commas"
            />

            <TextInput
              label="Security rules"
              value={form.securityRules}
              onChange={(event) => update('securityRules', event.target.value)}
            />

            <TextInput
              label="Governance rules"
              value={form.governanceRules}
              onChange={(event) => update('governanceRules', event.target.value)}
            />

            <Row>
              <TextInput
                label="Data residency"
                value={form.dataResidency}
                onChange={(event) => update('dataResidency', event.target.value)}
              />
              <TextInput
                label="Latency targets"
                value={form.latencyTarget}
                onChange={(event) => update('latencyTarget', event.target.value)}
              />
            </Row>

            <Row>
              <TextInput
                label="Cost preferences"
                value={form.costPreference}
                onChange={(event) => update('costPreference', event.target.value)}
              />
              <TextInput
                label="Infrastructure requirements"
                value={form.infrastructureRequirement}
                onChange={(event) => update('infrastructureRequirement', event.target.value)}
              />
            </Row>

            <TextInput
              label="Fallback behavior"
              value={form.fallback}
              onChange={(event) => update('fallback', event.target.value)}
            />
          </Form>
        </ModalContent>
      </Modal>
    </>
  );
}

export function applyPolicyForm(
  values: PolicyFormValues,
  base: RoutingPolicy,
): RoutingPolicy {
  return {
    ...base,
    name: values.name.trim(),
    scope: values.scope.trim(),
    status: values.status,
    priorityOrder: values.priorityOrder,
    eligibleModels: splitList(values.eligibleModels),
    eligibleHosting: splitList(values.eligibleHosting) as HostingLabel[],
    securityRules: splitList(values.securityRules),
    governanceRules: splitList(values.governanceRules),
    dataResidency: values.dataResidency.trim() || undefined,
    qualityFloor: values.qualityFloor,
    costPreference: values.costPreference.trim(),
    latencyTarget: values.latencyTarget.trim(),
    infrastructureRequirement: values.infrastructureRequirement.trim(),
    fallback: values.fallback.trim(),
    lastModified: new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
  };
}
