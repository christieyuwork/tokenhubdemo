import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  ContentSwitcher,
  Dropdown,
  IconButton,
  NumberInput,
  Switch,
  TextInput,
} from '@cake-admin/cakeand';
import {
  ArrowRight,
  Bell,
  FilePlus2,
  Gauge,
  Layers,
  Minus,
  Plus,
  Rocket,
  RotateCcw,
  Server,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { InlineIcon } from '../LeadIcon';
import type { PolicyFormValues } from './PolicyFormModal';
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
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
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

/** Step N · Label: on the same line as the section title. */
const StepTitle = styled.h3`
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-075) var(--space-100);
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const StepTitleLead = styled.span`
  color: var(--color-primary-primary);
`;

const StepTitleRest = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-075);
  min-width: 0;

  ${InlineIcon} {
    color: var(--color-primary-primary);
  }
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
  border-left: var(--stroke-300) solid var(--color-primary-primary);
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

const LeverLabel = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const promoSheen = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

/**
 * Same treatment as Intelligent routing “Try routing” — cake& has no gradient
 * Card variant, so the stop list matches ReportHeader / PulsePromo.
 */
const OptimizeCard = styled(Card)`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  background-image: linear-gradient(
    126deg,
    rgb(21, 47, 197) 8%,
    rgb(57, 78, 219) 42%,
    rgb(160, 120, 255) 92%
  );
  background-size: 140% 140%;
  animation: ${promoSheen} 9s ease-in-out infinite;
  box-shadow: var(--elevation-2);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-size: 100% 100%;
  }
`;

const OptimizeInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-100);
  padding: var(--space-300) var(--space-400);
  min-width: 0;
`;

const OptimizeEyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-100);
  min-width: 0;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const OptimizeEyebrowLabel = styled.span`
  display: inline-flex;
  flex: 1 1 auto;
  align-items: center;
  gap: var(--space-100);
  min-width: 0;
`;

/** Matches Prompt lab banner Demo pill — white chip on the gradient. */
const OptimizeDemoPill = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  margin-left: auto;
  padding: var(--space-050) var(--space-150);
  border-radius: var(--radius-1000);
  background: var(--color-surfaces-container);
  color: var(--color-badge-text-icon-on-blue-light);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const OptimizeTitle = styled.p`
  margin: 0;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.25;
`;

const OptimizeCaption = styled.p`
  margin: 0;
  color: var(--color-text-icon-on-primary-disabled);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const OptimizeAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-150);
  margin-top: var(--space-100);
  padding: var(--space-100) var(--space-150) var(--space-100) var(--space-200);
  border-radius: var(--radius-1000);
  background: var(--color-surfaces-container);
  box-shadow: var(--elevation-1);
`;

const OptimizeActionLabel = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-helper);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

/** Result surface — primary wash so it reads as the answer, not another control. */
const ImpactPanel = styled(Panel)<{ $met?: boolean }>`
  border-color: ${({ $met }) =>
    $met ? 'var(--color-success-success)' : 'var(--color-primary-primary)'};
  border-left-width: var(--stroke-300);
  border-left-style: solid;
  background: ${({ $met }) =>
    $met
      ? 'var(--color-success-success-overlay)'
      : 'var(--color-surfaces-primary)'};
  box-shadow: var(--elevation-1);
`;

const OutcomesKick = styled(PanelKick)<{ $met?: boolean }>`
  color: ${({ $met }) =>
    $met ? 'var(--color-success-success)' : 'var(--color-primary-primary)'};
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

/** Step 1 — set-out-the-gate targets above the tune/outcomes workbench. */
const GoalsBrief = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: var(--space-250) var(--space-300);
  border: var(--stroke-100) solid var(--color-primary-primary);
  border-left: var(--stroke-300) solid var(--color-primary-primary);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-primary);
  box-shadow: var(--elevation-1);
`;

const GoalsBriefHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-100) var(--space-200);
  min-width: 0;
`;

const GoalsBriefCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;
`;

/** Criteria table — targets to meet, not selectable toggles. */
const GoalList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-150);
  background: var(--color-surfaces-container);
`;

const goalTableColumns =
  'minmax(8rem, 1fr) minmax(4.5rem, 0.6fr) minmax(17rem, 1.6fr) 4.5rem';

const GoalListHead = styled.li`
  display: grid;
  grid-template-columns: ${goalTableColumns};
  align-items: center;
  gap: var(--space-100) var(--space-150);
  padding: var(--space-100) var(--space-200);
  border-bottom: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-on-container-high);
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;

  @container report-content (max-width: 720px) {
    display: none;
  }
`;

/** Fixed Max/Min rail + shared control slot so every row shares one X. */
const GoalControl = styled.div`
  display: grid;
  grid-template-columns: 2.75rem minmax(0, 1fr);
  align-items: center;
  gap: var(--space-100);
  width: 100%;
  min-width: 0;
`;

/** Value field + −/+ — same field width on every numeric row. */
const GoalStepperRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-050);
  width: 100%;
  min-width: 0;
`;

const GoalField = styled.div`
  flex: 0 0 6.5rem;
  width: 6.5rem;
  min-width: 6.5rem;

  & > * {
    width: 100%;
    max-width: 100%;
  }

  & input {
    flex: 1 1 auto;
    min-width: 0;
  }
`;

const GoalSteppers = styled.div`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
`;

const GoalModelSwitcher = styled.div`
  width: 100%;
  min-width: 0;

  & > * {
    width: 100%;
    max-width: 100%;
  }

  & [role='radiogroup'] > button {
    flex: 1 1 0;
    min-width: 0;
    justify-content: center;
  }
`;

const GoalItem = styled.li<{ $ok?: boolean }>`
  display: grid;
  grid-template-columns: ${goalTableColumns};
  align-items: center;
  gap: var(--space-100) var(--space-150);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--space-150) var(--space-200);
  background: ${({ $ok }) =>
    $ok ? 'var(--color-success-success-overlay)' : 'transparent'};
  border-bottom: var(--stroke-100) solid var(--color-stroke-border-low);

  &:last-child {
    border-bottom: none;
  }

  @container report-content (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'name status'
      'live live'
      'target target';
    align-items: start;
    gap: var(--space-100);
  }
`;

const GoalName = styled.span`
  overflow: hidden;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-helper);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;

  @container report-content (max-width: 720px) {
    grid-area: name;
  }
`;

const GoalActual = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  font-variant-numeric: tabular-nums;

  @container report-content (max-width: 720px) {
    grid-area: live;
  }
`;

const GoalTargetLabel = styled.span`
  display: block;
  width: 100%;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const GoalStatus = styled.div`
  justify-self: end;

  @container report-content (max-width: 720px) {
    grid-area: status;
  }
`;

const GoalTargetCell = styled.div`
  width: 100%;
  min-width: 0;

  @container report-content (max-width: 720px) {
    grid-area: target;
  }
`;

const GoalsMetStrip = styled.div<{ $met?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--space-100);
  padding: var(--space-150) var(--space-200);
  border-radius: var(--radius-150);
  background: ${({ $met }) =>
    $met
      ? 'var(--color-success-success-overlay)'
      : 'var(--color-surfaces-container)'};
  border: var(--stroke-100) solid
    ${({ $met }) =>
      $met ? 'var(--color-success-success)' : 'var(--color-stroke-border-low)'};
`;

const GoalsMetTitle = styled.p`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const GoalsMetTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-100);
  min-width: 0;
`;

const GoalsMetPct = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
`;

const GoalsMetLabel = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
`;

const GoalsMetBar = styled.div`
  height: var(--space-100);
  overflow: hidden;
  border-radius: var(--radius-1000);
  background: var(--color-surfaces-on-container);
`;

const GoalsMetFill = styled.div<{ $pct: number; $met?: boolean }>`
  height: 100%;
  width: ${({ $pct }) => `${Math.max(0, Math.min(100, $pct))}%`};
  border-radius: var(--radius-1000);
  background: ${({ $met }) =>
    $met ? 'var(--color-success-success)' : 'var(--color-primary-primary)'};
  transition: width 220ms ease;
`;

/** Step 3 — turn the scenario into ops actions. */
const ActCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-250);
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: var(--space-300);
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-left: var(--stroke-300) solid var(--color-primary-primary);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-on-container);
`;

const ActHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;
`;

const ActHint = styled.p`
  margin: 0;
  max-width: 42rem;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

const ActGrid = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: var(--space-150);
  width: 100%;
  min-width: 0;
`;

const ActItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: var(--space-150);
  box-sizing: border-box;
  min-width: 0;
  height: 100%;
  padding: var(--space-200);
  border-radius: var(--radius-150);
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-container);
`;

const ActItemCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-075);
  min-width: 0;
`;

const ActItemTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-075);
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-helper);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;

  ${InlineIcon} {
    color: var(--color-primary-primary);
  }
`;

const ActItemBody = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

const ActItemAction = styled.div`
  margin-top: auto;
`;

interface GoalNumberStepperProps {
  value: number;
  min?: number;
  max?: number;
  step: number;
  suffix?: string;
  'aria-label': string;
  onValueChange: (value: number) => void;
}

function GoalNumberStepper({
  value,
  min,
  max,
  step,
  suffix,
  'aria-label': ariaLabel,
  onValueChange,
}: GoalNumberStepperProps) {
  const atMin = typeof min === 'number' && value <= min;
  const atMax = typeof max === 'number' && value >= max;

  function bump(delta: number) {
    const decimals = String(step).includes('.')
      ? String(step).split('.')[1].length
      : 0;
    let next = Number((value + delta).toFixed(decimals));
    if (typeof min === 'number') next = Math.max(min, next);
    if (typeof max === 'number') next = Math.min(max, next);
    onValueChange(next);
  }

  return (
    <GoalStepperRow>
      <GoalField>
        <NumberInput
          size="sm"
          aria-label={ariaLabel}
          value={value}
          min={min}
          max={max}
          step={step}
          suffix={suffix}
          showDecrement={false}
          showIncrement={false}
          onValueChange={(next) => {
            if (typeof next === 'number' && Number.isFinite(next)) {
              onValueChange(next);
            }
          }}
        />
      </GoalField>
      <GoalSteppers>
        <IconButton
          label={`Decrease ${ariaLabel}`}
          size="sm"
          intent="secondary"
          variant="ghost"
          icon={<Minus aria-hidden />}
          disabled={atMin}
          onClick={() => bump(-step)}
        />
        <IconButton
          label={`Increase ${ariaLabel}`}
          size="sm"
          intent="secondary"
          variant="ghost"
          icon={<Plus aria-hidden />}
          disabled={atMax}
          onClick={() => bump(step)}
        />
      </GoalSteppers>
    </GoalStepperRow>
  );
}

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
  /** Jump to another app section (alerts, quotas, routing, …). */
  onNavigate?: (section: string) => void;
  /** Open Create policy with values seeded from this scenario. */
  onCreatePolicy?: (values: PolicyFormValues) => void;
}

function policyFormFromWhatIf(
  scene: SceneSetup,
  controls: ScenarioControls,
  goals: UserGoals,
): PolicyFormValues {
  const model = MODEL_LABELS[controls.m] ?? MODEL_LABELS[0];
  const placement = PLACEMENT_LABELS[controls.p] ?? PLACEMENT_LABELS[0];
  const floor = MODEL_LABELS[goals.minModel] ?? model;
  return {
    name: `${scene.name || 'Workload'} · What if plan`,
    scope: `${formatVolume(scene.monthlyVolume)} ${scene.unit}/mo · ${placement}`,
    status: 'Active',
    priorityOrder: 1,
    eligibleModels: `${floor}+ preferred · current ${model}`,
    eligibleHosting: placement,
    securityRules: '',
    governanceRules: '',
    dataResidency:
      goals.minResidency > 0
        ? `Keep at least ${goals.minResidency}% in-house`
        : '',
    qualityFloor: Math.max(70, goals.minModel === 0 ? 70 : goals.minModel === 1 ? 80 : 90),
    costPreference: `Cap near ${dollars(goals.maxPerUnit)} per ${scene.unit}`,
    latencyTarget: `${goals.maxLatency.toFixed(1)}s max`,
    infrastructureRequirement: scene.factory.trim() || 'Owned engine capacity',
    fallback: 'Fail open to next eligible route when goals cannot be met',
  };
}

export function TokenOpsChallenge({
  policyId = 'brightsky-quality',
  splash,
  onNavigate,
  onCreatePolicy,
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
  const goalsTotal = goalChecks.length;
  const goalsMetPct =
    goalsTotal > 0 ? Math.round((goalsDone / goalsTotal) * 100) : 0;
  const allMet = goalsDone === goalsTotal && goalsTotal > 0;
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

      <GoalsBrief aria-label="Step 1 Goals">
        <GoalsBriefHead>
          <GoalsBriefCopy>
            <StepTitle>
              <StepTitleLead>Step 1 · Goals:</StepTitleLead>
              <StepTitleRest>
                <InlineIcon>
                  <Target aria-hidden />
                </InlineIcon>
                Set your targets
              </StepTitleRest>
            </StepTitle>
            <SectionHint>
              Define what success looks like before you touch the levers.
            </SectionHint>
          </GoalsBriefCopy>
        </GoalsBriefHead>

        <GoalList>
          <GoalListHead aria-hidden>
            <span>Goal</span>
            <span>Live now</span>
            <span>Target</span>
            <span>Status</span>
          </GoalListHead>

          <GoalItem $ok={goalChecks[0]?.ok}>
            <GoalName>Cost per {workload.unit}</GoalName>
            <GoalActual>{dollars(result.per)}</GoalActual>
            <GoalTargetCell>
              <GoalControl>
                <GoalTargetLabel>Max</GoalTargetLabel>
                <GoalNumberStepper
                  aria-label={`Max dollars per ${workload.unit}`}
                  value={goals.maxPerUnit}
                  min={0.01}
                  step={0.01}
                  onValueChange={(value) => patchGoals({ maxPerUnit: value })}
                />
              </GoalControl>
            </GoalTargetCell>
            <GoalStatus>
              <Badge
                color={goalChecks[0]?.ok ? 'green' : 'disabled'}
                tone="subtle"
                dot={false}
              >
                {goalChecks[0]?.ok ? 'Met' : 'Open'}
              </Badge>
            </GoalStatus>
          </GoalItem>

          <GoalItem $ok={goalChecks[1]?.ok}>
            <GoalName>Response time</GoalName>
            <GoalActual>{result.lat.toFixed(1)}s</GoalActual>
            <GoalTargetCell>
              <GoalControl>
                <GoalTargetLabel>Max</GoalTargetLabel>
                <GoalNumberStepper
                  aria-label="Max latency in seconds"
                  value={goals.maxLatency}
                  min={0.1}
                  step={0.1}
                  suffix="s"
                  onValueChange={(value) => patchGoals({ maxLatency: value })}
                />
              </GoalControl>
            </GoalTargetCell>
            <GoalStatus>
              <Badge
                color={goalChecks[1]?.ok ? 'green' : 'disabled'}
                tone="subtle"
                dot={false}
              >
                {goalChecks[1]?.ok ? 'Met' : 'Open'}
              </Badge>
            </GoalStatus>
          </GoalItem>

          <GoalItem $ok={goalChecks[2]?.ok}>
            <GoalName>Data in-house</GoalName>
            <GoalActual>{Math.round(result.fs * 100)}%</GoalActual>
            <GoalTargetCell>
              <GoalControl>
                <GoalTargetLabel>Min</GoalTargetLabel>
                <GoalNumberStepper
                  aria-label="Minimum in-house percentage"
                  value={goals.minResidency}
                  min={0}
                  max={100}
                  step={5}
                  suffix="%"
                  onValueChange={(value) =>
                    patchGoals({ minResidency: value })
                  }
                />
              </GoalControl>
            </GoalTargetCell>
            <GoalStatus>
              <Badge
                color={goalChecks[2]?.ok ? 'green' : 'disabled'}
                tone="subtle"
                dot={false}
              >
                {goalChecks[2]?.ok ? 'Met' : 'Open'}
              </Badge>
            </GoalStatus>
          </GoalItem>

          <GoalItem $ok={goalChecks[3]?.ok}>
            <GoalName>Model floor</GoalName>
            <GoalActual>{MODEL_LABELS[controls.m]}</GoalActual>
            <GoalTargetCell>
              <GoalControl>
                <GoalTargetLabel>Min</GoalTargetLabel>
                <GoalModelSwitcher>
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
                </GoalModelSwitcher>
              </GoalControl>
            </GoalTargetCell>
            <GoalStatus>
              <Badge
                color={goalChecks[3]?.ok ? 'green' : 'disabled'}
                tone="subtle"
                dot={false}
              >
                {goalChecks[3]?.ok ? 'Met' : 'Open'}
              </Badge>
            </GoalStatus>
          </GoalItem>
        </GoalList>
      </GoalsBrief>

      <Workbench>
        <ControlPanel aria-label="Step 2 Controls">
          <ControlHeader>
            <StepTitle>
              <StepTitleLead>Step 2 · Controls:</StepTitleLead>
              Tune this run
            </StepTitle>
            <ControlHint>
              Scene and levers — outcomes update live against your goals.
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
            </LeverStack>
          </ControlSection>

          <OptimizeCard role="region" aria-label="Optimize">
            <OptimizeInner>
              <OptimizeEyebrow>
                <OptimizeEyebrowLabel>
                  <InlineIcon>
                    <Sparkles aria-hidden />
                  </InlineIcon>
                  Optimize
                </OptimizeEyebrowLabel>
                <OptimizeDemoPill>Demo</OptimizeDemoPill>
              </OptimizeEyebrow>
              <OptimizeTitle>Let TokenOps tune this run</OptimizeTitle>
              <OptimizeCaption>
                Auto-balance model and placement against your goals.
              </OptimizeCaption>
              <OptimizeAction>
                <OptimizeActionLabel>
                  {controls.t ? 'On' : 'Off'}
                </OptimizeActionLabel>
                <Switch
                  aria-label="TokenOps optimize"
                  checked={controls.t}
                  onCheckedChange={(next) => setControl('t', next)}
                />
              </OptimizeAction>
              <OptimizeCaption>*Demo only. Feature coming soon.</OptimizeCaption>
            </OptimizeInner>
          </OptimizeCard>
        </ControlPanel>

        <OutcomeColumn>
          <ImpactPanel $met={allMet} aria-live="polite" aria-label="Outcomes">
            <PanelHead>
              <div>
                <OutcomesKick $met={allMet}>Outcomes</OutcomesKick>
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

            <GoalsMetStrip $met={allMet}>
              <GoalsMetTitle>Your goals met</GoalsMetTitle>
              <GoalsMetTop>
                <GoalsMetPct>{goalsMetPct}%</GoalsMetPct>
                <GoalsMetLabel>
                  {goalsDone}/{goalsTotal} cleared
                </GoalsMetLabel>
              </GoalsMetTop>
              <GoalsMetBar aria-hidden>
                <GoalsMetFill $pct={goalsMetPct} $met={allMet} />
              </GoalsMetBar>
            </GoalsMetStrip>

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

      <ActCard aria-label="Step 3 Act">
        <ActHead>
          <StepTitle>
            <StepTitleLead>Step 3 · Act:</StepTitleLead>
            Put this What if to work
          </StepTitle>
          <ActHint>
            {allMet
              ? `This run clears all goals at ${money(result.bill)}/mo — promote it into routing, alerts, and capacity.`
              : savePct > 0
                ? `You’re ${savePct}% under the starting bill with ${goalsMetPct}% of goals met — lock in the wins or keep tuning.`
                : `Use this scenario to drive policy, alerts, and capacity before traffic changes hit production.`}
          </ActHint>
        </ActHead>

        <ActGrid>
          <ActItem>
            <ActItemCopy>
              <ActItemTitle>
                <InlineIcon>
                  <Rocket aria-hidden />
                </InlineIcon>
                Use this plan
              </ActItemTitle>
              <ActItemBody>
                Seed a routing policy from {scene.name || 'this workload'} ·{' '}
                {MODEL_LABELS[controls.m]} · {PLACEMENT_LABELS[controls.p]} at{' '}
                {money(result.bill)}/mo.
              </ActItemBody>
            </ActItemCopy>
            <ActItemAction>
              <Button
                type="button"
                size="sm"
                intent="primary"
                startIcon={<FilePlus2 size={14} aria-hidden />}
                disabled={!onCreatePolicy}
                onClick={() =>
                  onCreatePolicy?.(
                    policyFormFromWhatIf(scene, controls, goals),
                  )
                }
              >
                Create policy
              </Button>
            </ActItemAction>
          </ActItem>

          <ActItem>
            <ActItemCopy>
              <ActItemTitle>
                <InlineIcon>
                  <Shield aria-hidden />
                </InlineIcon>
                Routing policies
              </ActItemTitle>
              <ActItemBody>
                Compare this plan to live policies and reorder priority so the
                right traffic lands here.
              </ActItemBody>
            </ActItemCopy>
            <ActItemAction>
              <Button
                type="button"
                size="sm"
                intent="secondary"
                variant="outline"
                endIcon={<ArrowRight size={14} aria-hidden />}
                disabled={!onNavigate}
                onClick={() => onNavigate?.('routing-rules')}
              >
                Open policies
              </Button>
            </ActItemAction>
          </ActItem>

          <ActItem>
            <ActItemCopy>
              <ActItemTitle>
                <InlineIcon>
                  <Sparkles aria-hidden />
                </InlineIcon>
                Test a matching prompt
              </ActItemTitle>
              <ActItemBody>
                Send a sample request through routing and confirm the tree
                matches this What if placement.
              </ActItemBody>
            </ActItemCopy>
            <ActItemAction>
              <Button
                type="button"
                size="sm"
                intent="secondary"
                variant="outline"
                endIcon={<ArrowRight size={14} aria-hidden />}
                disabled={!onNavigate}
                onClick={() => onNavigate?.('test-prompt')}
              >
                Test a Prompt
              </Button>
            </ActItemAction>
          </ActItem>

          <ActItem>
            <ActItemCopy>
              <ActItemTitle>
                <InlineIcon>
                  <Bell aria-hidden />
                </InlineIcon>
                Spend & latency alerts
              </ActItemTitle>
              <ActItemBody>
                Alert when cost per {scene.unit} rises above{' '}
                {dollars(goals.maxPerUnit)} or latency exceeds{' '}
                {goals.maxLatency.toFixed(1)}s.
              </ActItemBody>
            </ActItemCopy>
            <ActItemAction>
              <Button
                type="button"
                size="sm"
                intent="secondary"
                variant="outline"
                endIcon={<ArrowRight size={14} aria-hidden />}
                disabled={!onNavigate}
                onClick={() => onNavigate?.('alert-rules')}
              >
                Alert rules
              </Button>
            </ActItemAction>
          </ActItem>

          <ActItem>
            <ActItemCopy>
              <ActItemTitle>
                <InlineIcon>
                  <Gauge aria-hidden />
                </InlineIcon>
                Quotas & caps
              </ActItemTitle>
              <ActItemBody>
                Cap monthly spend near {money(result.bill)} so this plan cannot
                silently overrun in production.
              </ActItemBody>
            </ActItemCopy>
            <ActItemAction>
              <Button
                type="button"
                size="sm"
                intent="secondary"
                variant="outline"
                endIcon={<ArrowRight size={14} aria-hidden />}
                disabled={!onNavigate}
                onClick={() => onNavigate?.('quotas')}
              >
                Quotas
              </Button>
            </ActItemAction>
          </ActItem>

          <ActItem>
            <ActItemCopy>
              <ActItemTitle>
                <InlineIcon>
                  <Server aria-hidden />
                </InlineIcon>
                GPU & capacity
              </ActItemTitle>
              <ActItemBody>
                {result.uw > 1
                  ? `${workload.factoryShort} is over capacity — review fleet before shifting more traffic in-house.`
                  : result.u < 0.5
                    ? `${workload.factoryShort} is ${Math.round((1 - result.u) * 100)}% idle — reclaim or fill capacity.`
                    : `Check ${workload.factoryShort} headroom for this ${PLACEMENT_LABELS[controls.p].toLowerCase()} mix.`}
              </ActItemBody>
            </ActItemCopy>
            <ActItemAction>
              <Button
                type="button"
                size="sm"
                intent="secondary"
                variant="outline"
                endIcon={<ArrowRight size={14} aria-hidden />}
                disabled={!onNavigate}
                onClick={() => onNavigate?.('gpu-fleet')}
              >
                GPU fleet
              </Button>
            </ActItemAction>
          </ActItem>

          <ActItem>
            <ActItemCopy>
              <ActItemTitle>
                <InlineIcon>
                  <Zap aria-hidden />
                </InlineIcon>
                Energy & efficiency
              </ActItemTitle>
              <ActItemBody>
                Factory power is {money(result.energy)}/mo in this run — review
                energy ops if you move more work on-prem.
              </ActItemBody>
            </ActItemCopy>
            <ActItemAction>
              <Button
                type="button"
                size="sm"
                intent="secondary"
                variant="outline"
                endIcon={<ArrowRight size={14} aria-hidden />}
                disabled={!onNavigate}
                onClick={() => onNavigate?.('energy')}
              >
                Energy
              </Button>
            </ActItemAction>
          </ActItem>

          <ActItem>
            <ActItemCopy>
              <ActItemTitle>
                <InlineIcon>
                  <Layers aria-hidden />
                </InlineIcon>
                Caching & reuse
              </ActItemTitle>
              <ActItemBody>
                Cut repeat-token spend for {scene.name || 'this workload'} before
                you scale volume further.
              </ActItemBody>
            </ActItemCopy>
            <ActItemAction>
              <Button
                type="button"
                size="sm"
                intent="secondary"
                variant="outline"
                endIcon={<ArrowRight size={14} aria-hidden />}
                disabled={!onNavigate}
                onClick={() => onNavigate?.('caching')}
              >
                Caching
              </Button>
            </ActItemAction>
          </ActItem>
        </ActGrid>
      </ActCard>
    </Shell>
  );
}
