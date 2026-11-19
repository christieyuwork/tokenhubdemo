import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  ContentSwitcher,
  Dropdown,
  NumberInput,
  Switch,
  TextInput,
} from '@cake-admin/cakeand';
import { Check, Layers, RotateCcw, SlidersHorizontal, Target } from 'lucide-react';
import styled from 'styled-components';
import { InlineIcon } from '../LeadIcon';
import {
  DEFAULT_CONTROLS,
  MODEL_LABELS,
  PLACEMENT_LABELS,
  UNIT_OPTIONS,
  calc,
  dollars,
  evaluateGoals,
  formatVolume,
  getWorkload,
  goalsFromWorkload,
  money,
  sceneFromWorkload,
  withScene,
  workloadForPolicy,
  type ScenarioControls,
  type SceneSetup,
  type UserGoals,
} from '../../data/tokenOpsGame';
import { buildWhatIfInsights } from '../../data/labInsights';
import { LabAiInsights } from './LabAiInsights';

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--space-250) var(--space-300) var(--space-300);
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-container);
`;

const SplashBlock = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-150) var(--space-300);
  width: 100%;
  padding-bottom: var(--space-100);
`;

const SplashMain = styled.div`
  flex: 1 1 16rem;
  min-width: 0;
`;

const Toolbar = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-100);
  margin-left: auto;
`;

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  min-width: 0;
  padding: var(--space-250) var(--space-300);
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-on-container-high);
`;

const PanelKick = styled.span`
  color: var(--color-primary-primary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const PanelTitle = styled.h3`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const PanelHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-100);
`;

const SceneForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-150);
  min-width: 0;
`;

const SceneRow = styled.div<{ $cols: string }>`
  display: grid;
  grid-template-columns: ${({ $cols }) => $cols};
  gap: var(--space-150);
  min-width: 0;
  align-items: start;

  @container report-content (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/** Controls left, outcomes + compact insights right. */
const Workbench = styled.div`
  display: grid;
  grid-template-columns: minmax(22rem, 1.55fr) minmax(0, 1fr);
  gap: var(--space-150);
  min-width: 0;
  align-items: start;

  @container report-content (max-width: 960px) {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  }

  @container report-content (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const OutcomeColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-150);
  min-width: 0;
  position: sticky;
  top: var(--space-200);
  align-self: start;

  @container report-content (max-width: 720px) {
    position: static;
  }
`;

const ControlPanel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: var(--space-400);
  min-width: 0;
  padding: var(--space-300);
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-left: var(--stroke-200) solid var(--color-primary-primary);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-on-container-high);
`;

const ControlHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;
  padding-bottom: var(--space-200);
  border-bottom: var(--stroke-100) solid var(--color-stroke-border-low);
`;

const ControlHint = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

const ControlSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  min-width: 0;

  & + & {
    padding-top: var(--space-350);
    border-top: var(--stroke-100) solid var(--color-stroke-border-low);
  }
`;

const ControlSectionHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-100) var(--space-200);
  min-width: 0;
`;

const ControlSectionCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;
`;

const SectionTitle = styled.h4`
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--space-075);
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;

  ${InlineIcon} {
    color: var(--color-primary-primary);
  }
`;

const SectionHint = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

const LeverStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
`;

const LeverRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
`;

/** Stretch cake& ContentSwitcher segments across the controls column. */
const LeverSwitcher = styled.div`
  width: 100%;
  min-width: 0;

  & [role='radiogroup'] {
    width: 100%;
  }

  & [role='radiogroup'] > button {
    flex: 1 1 0;
    min-width: 0;
    justify-content: center;
  }
`;

const LeverTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-100);
  min-width: 0;
`;

const LeverLabel = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const LeverNote = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const ImpactPanel = styled(Panel)<{ $met?: boolean }>`
  border-color: ${({ $met }) =>
    $met ? 'var(--color-primary-primary)' : 'var(--color-stroke-border-low)'};
  background: ${({ $met }) =>
    $met ? 'var(--color-surfaces-primary)' : 'var(--color-surfaces-on-container-high)'};
`;

const BillHero = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-150) var(--space-300);
`;

const BillBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;
`;

const BillAmount = styled.p`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-greeting);
  font-weight: var(--font-weight-bold);
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
`;

const BillCompare = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const PerUnit = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-helper);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const StackBar = styled.div`
  display: flex;
  height: var(--space-300);
  overflow: hidden;
  border-radius: var(--radius-1000);
  background: var(--color-surfaces-container);
`;

const StackSeg = styled.div<{ $tone: 'cloud' | 'fixed' | 'energy' }>`
  height: 100%;
  transition: width 220ms ease;
  background: ${({ $tone }) =>
    $tone === 'cloud'
      ? 'var(--color-badge-red)'
      : $tone === 'fixed'
        ? 'var(--color-badge-indigo)'
        : 'var(--color-badge-orange)'};
`;

const CostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-100);

  @container report-content (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const CostCell = styled.div<{ $tone: 'cloud' | 'fixed' | 'energy' }>`
  display: flex;
  flex-direction: column;
  gap: var(--space-025);
  min-width: 0;
  padding: var(--space-100) var(--space-150);
  border-radius: var(--radius-150);
  background: var(--color-surfaces-container);
  border-left: var(--stroke-300) solid
    ${({ $tone }) =>
      $tone === 'cloud'
        ? 'var(--color-badge-red)'
        : $tone === 'fixed'
          ? 'var(--color-badge-indigo)'
          : 'var(--color-badge-orange)'};
`;

const CostValue = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
`;

const CostLabel = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.3;
`;

const GpuNote = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-100);
  padding: var(--space-100) var(--space-150);
  border-radius: var(--radius-150);
  background: var(--color-surfaces-container);
`;

const GpuNoteLabel = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.3;
`;

const GpuNoteValue = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-helper);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
`;

const GoalsCount = styled.span`
  flex: 0 0 auto;
  margin-top: var(--space-050);
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
`;

const GoalList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-100);
`;

const GoalControl = styled.div`
  flex: 0 0 auto;
  width: 10.5rem;
  min-width: 10.5rem;
  justify-self: end;

  /* Same slot for steppers and the model switcher. */
  & > * {
    width: 100%;
    max-width: 100%;
  }

  /*
   * cake& NumberInput grows the value field, which parks the suffix at the
   * steppers. Keep the value compact so units sit next to the number.
   */
  & input {
    flex: 0 0 2.75rem;
    width: 2.75rem;
    max-width: 2.75rem;
  }
`;

const GoalItem = styled.li<{ $ok?: boolean }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-075) var(--space-100);
  min-width: 0;
  padding: var(--space-100) var(--space-150);
  border-radius: var(--radius-100);
  background: ${({ $ok }) =>
    $ok ? 'var(--color-success-success-overlay)' : 'var(--color-surfaces-container)'};
  border: var(--stroke-100) solid
    ${({ $ok }) =>
      $ok ? 'var(--color-success-success)' : 'var(--color-stroke-border-low)'};

  @container report-content (max-width: 520px) {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;

    ${GoalControl} {
      grid-column: 2 / -1;
      justify-self: stretch;
    }
  }
`;

const GoalMark = styled.span<{ $ok?: boolean }>`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: var(--space-400);
  height: var(--space-400);
  margin-top: var(--space-025);
  border-radius: var(--radius-1000);
  border: var(--stroke-100) solid
    ${({ $ok }) =>
      $ok ? 'var(--color-success-success)' : 'var(--color-stroke-border)'};
  background: ${({ $ok }) =>
    $ok ? 'var(--color-success-success)' : 'transparent'};
  color: var(--color-text-icon-on-primary);
`;

const GoalCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-025);
  min-width: 0;
`;

const GoalName = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-helper);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const GoalActual = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  font-variant-numeric: tabular-nums;
`;

const MODEL_OPTIONS = MODEL_LABELS.map((label, index) => ({
  value: String(index),
  label,
}));

const PLACEMENT_OPTIONS = PLACEMENT_LABELS.map((label, index) => ({
  value: String(index),
  label,
}));

const UNIT_DROPDOWN = UNIT_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}));

interface TokenOpsChallengeProps {
  /** Seed rates / goals from the evaluated policy template. */
  policyId?: string;
  /** Left-aligned mini-app welcome at the top of the white workspace. */
  splash?: ReactNode;
}

export function TokenOpsChallenge({
  policyId = 'brightsky-quality',
  splash,
}: TokenOpsChallengeProps) {
  const templateId = useMemo(() => workloadForPolicy(policyId), [policyId]);
  const template = useMemo(() => getWorkload(templateId), [templateId]);

  const [scene, setScene] = useState<SceneSetup>(() => sceneFromWorkload(template));
  const [controls, setControls] = useState<ScenarioControls>(DEFAULT_CONTROLS);
  const [goals, setGoals] = useState<UserGoals>(() => goalsFromWorkload(template));
  const [lastKey, setLastKey] = useState<keyof ScenarioControls | null>(null);

  useEffect(() => {
    const next = getWorkload(workloadForPolicy(policyId));
    setScene(sceneFromWorkload(next));
    setControls(DEFAULT_CONTROLS);
    setGoals(goalsFromWorkload(next));
    setLastKey(null);
  }, [policyId]);

  const workload = useMemo(() => withScene(template, scene), [template, scene]);
  const result = useMemo(() => calc(workload, controls), [workload, controls]);
  const goalChecks = useMemo(
    () => evaluateGoals(workload, controls, goals),
    [workload, controls, goals],
  );
  const goalsDone = goalChecks.filter((item) => item.ok).length;
  const allMet = goalsDone === goalChecks.length;
  const savePct = Math.round((1 - result.bill / result.base) * 100);
  const utilPct = Math.min(999, Math.round(result.u * 100));
  const insights = useMemo(
    () => buildWhatIfInsights(workload, controls, goals, lastKey),
    [workload, controls, goals, lastKey],
  );

  const billParts = {
    cloud: (result.cloud / Math.max(result.base, 1)) * 100,
    fixed: (workload.fixed / Math.max(result.base, 1)) * 100,
    energy: (result.energy / Math.max(result.base, 1)) * 100,
  };

  function patchScene(patch: Partial<SceneSetup>) {
    setScene((prev) => ({ ...prev, ...patch }));
  }

  function setControl<K extends keyof ScenarioControls>(
    key: K,
    value: ScenarioControls[K],
  ) {
    setControls((prev) => {
      if (Object.is(prev[key], value)) return prev;
      setLastKey(key);
      return { ...prev, [key]: value };
    });
  }

  function patchGoals(patch: Partial<UserGoals>) {
    setGoals((prev) => ({ ...prev, ...patch }));
  }

  function reset() {
    setScene(sceneFromWorkload(template));
    setControls(DEFAULT_CONTROLS);
    setGoals(goalsFromWorkload(template));
    setLastKey(null);
  }

  function onUnitsChange(value: string) {
    const match = UNIT_OPTIONS.find((item) => item.value === value);
    if (!match) return;
    patchScene({ units: match.value, unit: match.unit });
  }

  return (
    <Shell aria-label="What if scenario lab">
      <SplashBlock>
        <SplashMain>{splash}</SplashMain>
        <Toolbar>
          <Button
            type="button"
            size="sm"
            intent="secondary"
            variant="outline"
            startIcon={<RotateCcw size={14} aria-hidden />}
            onClick={reset}
          >
            Reset
          </Button>
        </Toolbar>
      </SplashBlock>

      <Workbench>
        <ControlPanel aria-label="Controls">
          <ControlHeader>
            <PanelKick>Controls</PanelKick>
            <PanelTitle>Tune this run</PanelTitle>
            <ControlHint>
              Scene, levers, and goals — outcomes update live beside you.
            </ControlHint>
          </ControlHeader>

          <ControlSection aria-label="Scene">
            <ControlSectionHead>
              <ControlSectionCopy>
                <SectionTitle>
                  <InlineIcon>
                    <Layers aria-hidden />
                  </InlineIcon>
                  Scene
                </SectionTitle>
                <SectionHint>
                  Name the job, set volume, and point at the engine you own.
                </SectionHint>
              </ControlSectionCopy>
            </ControlSectionHead>
            <SceneForm>
              <SceneRow $cols="minmax(0, 1.4fr) minmax(7rem, 9rem)">
                <TextInput
                  label="Workload"
                  value={scene.name}
                  placeholder="e.g. Quality inspection"
                  onChange={(event) => patchScene({ name: event.target.value })}
                />
                <Dropdown
                  label="Unit"
                  options={UNIT_DROPDOWN}
                  value={scene.units}
                  onValueChange={onUnitsChange}
                />
              </SceneRow>
              <SceneRow $cols="minmax(0, 1fr) minmax(0, 1fr)">
                <NumberInput
                  label="Volume / mo"
                  value={scene.monthlyVolume}
                  min={1}
                  step={10000}
                  suffix={formatVolume(scene.monthlyVolume)}
                  onValueChange={(value) => {
                    if (typeof value === 'number' && Number.isFinite(value)) {
                      patchScene({ monthlyVolume: Math.max(1, value) });
                    }
                  }}
                />
                <NumberInput
                  label="Engine cost / mo"
                  value={scene.fixedMonthly}
                  min={0}
                  step={1000}
                  onValueChange={(value) => {
                    if (typeof value === 'number' && Number.isFinite(value)) {
                      patchScene({ fixedMonthly: Math.max(0, value) });
                    }
                  }}
                />
              </SceneRow>
              <TextInput
                label="Engine"
                value={scene.factory}
                placeholder="e.g. Private AI cluster"
                onChange={(event) => {
                  const next = event.target.value;
                  const trimmed = next.trim();
                  const short = trimmed
                    ? trimmed.split(/\s+/).slice(-1)[0].slice(0, 12)
                    : template.factoryShort;
                  patchScene({
                    factory: next,
                    factoryShort: short,
                    factoryCap: trimmed || template.factoryCap,
                  });
                }}
              />
            </SceneForm>
          </ControlSection>

          <ControlSection aria-label="Levers">
            <ControlSectionHead>
              <ControlSectionCopy>
                <SectionTitle>
                  <InlineIcon>
                    <SlidersHorizontal aria-hidden />
                  </InlineIcon>
                  Levers
                </SectionTitle>
                <SectionHint>
                  Change model and placement — the bill updates live.
                </SectionHint>
              </ControlSectionCopy>
            </ControlSectionHead>

            <LeverStack>
              <LeverRow>
                <LeverLabel>Model</LeverLabel>
                <LeverSwitcher>
                  <ContentSwitcher
                    aria-label="Model size"
                    size="sm"
                    intent="secondary"
                    options={MODEL_OPTIONS}
                    value={String(controls.m)}
                    onValueChange={(value) => setControl('m', Number(value))}
                  />
                </LeverSwitcher>
              </LeverRow>

              <LeverRow>
                <LeverLabel>Placement</LeverLabel>
                <LeverSwitcher>
                  <ContentSwitcher
                    aria-label="Placement"
                    size="sm"
                    intent="secondary"
                    options={PLACEMENT_OPTIONS}
                    value={String(controls.p)}
                    onValueChange={(value) => setControl('p', Number(value))}
                  />
                </LeverSwitcher>
              </LeverRow>

              <LeverRow>
                <LeverTop>
                  <LeverLabel>Optimize</LeverLabel>
                  <Switch
                    label={controls.t ? 'On' : 'Off'}
                    checked={controls.t}
                    onCheckedChange={(next) => setControl('t', next)}
                  />
                </LeverTop>
                <LeverNote>*Demo only. Feature coming soon.</LeverNote>
              </LeverRow>
            </LeverStack>
          </ControlSection>

          <ControlSection aria-label="Goals">
            <ControlSectionHead>
              <ControlSectionCopy>
                <SectionTitle>
                  <InlineIcon>
                    <Target aria-hidden />
                  </InlineIcon>
                  Goals
                </SectionTitle>
                <SectionHint>
                  Set targets — green means this run clears them.
                </SectionHint>
              </ControlSectionCopy>
              <GoalsCount>
                {goalsDone} / {goalChecks.length} met
              </GoalsCount>
            </ControlSectionHead>

            <GoalList>
              <GoalItem $ok={goalChecks[0]?.ok}>
                <GoalMark $ok={goalChecks[0]?.ok} aria-hidden>
                  {goalChecks[0]?.ok ? (
                    <Check size={12} strokeWidth={3} />
                  ) : null}
                </GoalMark>
                <GoalCopy>
                  <GoalName>Cost per {workload.unit}</GoalName>
                  <GoalActual>Now {dollars(result.per)}</GoalActual>
                </GoalCopy>
                <GoalControl>
                  <NumberInput
                    size="sm"
                    aria-label={`Max dollars per ${workload.unit}`}
                    value={goals.maxPerUnit}
                    min={0.01}
                    step={0.01}
                    onValueChange={(value) => {
                      if (typeof value === 'number' && Number.isFinite(value)) {
                        patchGoals({ maxPerUnit: value });
                      }
                    }}
                  />
                </GoalControl>
              </GoalItem>

              <GoalItem $ok={goalChecks[1]?.ok}>
                <GoalMark $ok={goalChecks[1]?.ok} aria-hidden>
                  {goalChecks[1]?.ok ? (
                    <Check size={12} strokeWidth={3} />
                  ) : null}
                </GoalMark>
                <GoalCopy>
                  <GoalName>Response time</GoalName>
                  <GoalActual>Now {result.lat.toFixed(1)}s</GoalActual>
                </GoalCopy>
                <GoalControl>
                  <NumberInput
                    size="sm"
                    aria-label="Max latency in seconds"
                    value={goals.maxLatency}
                    min={0.1}
                    step={0.1}
                    suffix="s"
                    onValueChange={(value) => {
                      if (typeof value === 'number' && Number.isFinite(value)) {
                        patchGoals({ maxLatency: value });
                      }
                    }}
                  />
                </GoalControl>
              </GoalItem>

              <GoalItem $ok={goalChecks[2]?.ok}>
                <GoalMark $ok={goalChecks[2]?.ok} aria-hidden>
                  {goalChecks[2]?.ok ? (
                    <Check size={12} strokeWidth={3} />
                  ) : null}
                </GoalMark>
                <GoalCopy>
                  <GoalName>Data in-house</GoalName>
                  <GoalActual>Now {Math.round(result.fs * 100)}%</GoalActual>
                </GoalCopy>
                <GoalControl>
                  <NumberInput
                    size="sm"
                    aria-label="Minimum in-house percentage"
                    value={goals.minResidency}
                    min={0}
                    max={100}
                    step={5}
                    suffix="%"
                    onValueChange={(value) => {
                      if (typeof value === 'number' && Number.isFinite(value)) {
                        patchGoals({ minResidency: value });
                      }
                    }}
                  />
                </GoalControl>
              </GoalItem>

              <GoalItem $ok={goalChecks[3]?.ok}>
                <GoalMark $ok={goalChecks[3]?.ok} aria-hidden>
                  {goalChecks[3]?.ok ? (
                    <Check size={12} strokeWidth={3} />
                  ) : null}
                </GoalMark>
                <GoalCopy>
                  <GoalName>Model floor</GoalName>
                  <GoalActual>Now {MODEL_LABELS[controls.m]}</GoalActual>
                </GoalCopy>
                <GoalControl>
                  <ContentSwitcher
                    aria-label="Minimum model size"
                    size="sm"
                    intent="secondary"
                    options={MODEL_OPTIONS}
                    value={String(goals.minModel)}
                    onValueChange={(value) =>
                      patchGoals({ minModel: Number(value) })
                    }
                  />
                </GoalControl>
              </GoalItem>
            </GoalList>
          </ControlSection>
        </ControlPanel>

        <OutcomeColumn>
          <ImpactPanel $met={allMet} aria-live="polite" aria-label="Outcomes">
            <PanelHead>
              <div>
                <PanelKick>Outcomes</PanelKick>
                <PanelTitle>
                  {allMet ? 'Goals met' : 'Monthly token bill'}
                </PanelTitle>
              </div>
              <Badge
                color={savePct >= 50 ? 'green' : savePct > 0 ? 'amber' : 'red'}
                tone="subtle"
                dot={false}
              >
                {savePct > 0
                  ? `${savePct}% lower`
                  : savePct === 0
                    ? 'Starting bill'
                    : `${Math.abs(savePct)}% higher`}
              </Badge>
            </PanelHead>

            <BillHero>
              <BillBlock>
                <BillAmount>{money(result.bill)}</BillAmount>
                <BillCompare>
                  vs {money(result.base)} starting · all cloud, largest model
                </BillCompare>
              </BillBlock>
              <PerUnit>
                {dollars(result.per)} per {workload.unit}
              </PerUnit>
            </BillHero>

            <StackBar aria-hidden>
              <StackSeg $tone="cloud" style={{ width: `${billParts.cloud}%` }} />
              <StackSeg $tone="fixed" style={{ width: `${billParts.fixed}%` }} />
              <StackSeg $tone="energy" style={{ width: `${billParts.energy}%` }} />
            </StackBar>

            <CostGrid>
              <CostCell $tone="cloud">
                <CostValue>{money(result.cloud)}</CostValue>
                <CostLabel>Cloud tokens</CostLabel>
              </CostCell>
              <CostCell $tone="fixed">
                <CostValue>{money(workload.fixed)}</CostValue>
                <CostLabel>{workload.factoryCap}</CostLabel>
              </CostCell>
              <CostCell $tone="energy">
                <CostValue>{money(result.energy)}</CostValue>
                <CostLabel>Factory power</CostLabel>
              </CostCell>
            </CostGrid>

            <GpuNote>
              <GpuNoteLabel>{workload.factoryShort} GPU use</GpuNoteLabel>
              <GpuNoteValue>
                {utilPct}%
                {result.uw > 1
                  ? ' · over capacity'
                  : result.u < 0.5
                    ? ` · ${Math.round((1 - result.u) * 100)}% idle`
                    : ''}
              </GpuNoteValue>
            </GpuNote>
          </ImpactPanel>

          <LabAiInsights insights={insights} layout="compact" maxItems={1} />
        </OutcomeColumn>
      </Workbench>
    </Shell>
  );
}
