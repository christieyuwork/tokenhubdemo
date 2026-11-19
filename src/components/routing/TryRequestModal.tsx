import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Button, IconButton } from '@cake-admin/cakeand';
import { ArrowUp, ChevronDown, Plus, X } from 'lucide-react';
import styled from 'styled-components';
import {
  DEFAULT_PRIORITIES,
  DEFAULT_TRY_JUDGEMENT,
  evaluatePrompt,
  PROMPT_LIBRARY,
  type PolicyId,
  type PromptEvaluation,
  type PromptLibraryItem,
  type TryJudgement,
} from '../../data/routingDemo';
import {
  policyFormFromTrySession,
  type PolicyFormValues,
} from './PolicyFormModal';
import { JudgementControls } from './JudgementControls';
import { PriorityControls } from './PriorityControls';
import { RouterLaneGraph } from './RouterLaneGraph';

const SHELL_ID = 'app-shell';

interface TrySession {
  id: string;
  title: string;
  prompt: string;
  evaluation: PromptEvaluation;
  judgement: TryJudgement;
}

function tabTitle(prompt: string, libraryTitle?: string | null): string {
  if (libraryTitle?.trim()) return libraryTitle.trim();
  const compact = prompt.trim().replace(/\s+/g, ' ');
  if (compact.length <= 28) return compact;
  return `${compact.slice(0, 27)}…`;
}

function newSessionId(): string {
  return `try-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const Scrim = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1000;
  background: var(--color-overlay-scrim);
  backdrop-filter: blur(12px);
`;

const Panel = styled.div`
  position: absolute;
  inset: var(--space-400);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: var(--radius-300);
  background: var(--color-surfaces-container);
  box-shadow: var(--elevation-5);
`;

const Header = styled.header`
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-300);
  padding: var(--space-300) var(--space-500) var(--space-200);
  border-bottom: var(--stroke-100) solid var(--color-stroke-border-low);
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-title);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const Subtitle = styled.p`
  margin: 0;
  max-width: 40rem;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

const TabBar = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-100);
  padding: var(--space-150) var(--space-500);
  border-bottom: var(--stroke-100) solid var(--color-stroke-border-low);
`;

const TabList = styled.div`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: var(--space-050);
  min-width: 0;
  overflow-x: auto;
`;

const TabChip = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--space-050);
  max-width: 16rem;
  margin: 0;
  padding: var(--space-100) var(--space-150);
  border: none;
  border-bottom: var(--stroke-200) solid
    ${({ $active }) =>
      $active ? 'var(--color-primary-primary)' : 'transparent'};
  border-radius: var(--radius-200) var(--radius-200) 0 0;
  background: ${({ $active }) =>
    $active ? 'var(--color-primary-primary-overlay)' : 'transparent'};
  color: var(--color-text-icon-primary);
  font: inherit;
  font-size: var(--type-size-body);
  font-weight: ${({ $active }) =>
    $active ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)'};
  line-height: 1.35;
  cursor: pointer;

  &:hover {
    background: var(--color-surfaces-on-container-high);
  }

  &:focus-visible {
    outline: var(--stroke-150) solid var(--color-primary-primary);
    outline-offset: var(--space-025);
  }
`;

const TabLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TabClose = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--space-400);
  height: var(--space-400);
  border-radius: var(--radius-1000);
  color: var(--color-text-icon-secondary);

  &:hover {
    background: var(--color-surfaces-on-container-low);
    color: var(--color-text-icon-primary);
  }
`;

const Landing = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-300);
  min-height: 0;
  padding: var(--space-400) var(--space-500);
  overflow: auto;
`;

const LandingInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  width: 100%;
  max-width: 40rem;
`;

const SessionShell = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
`;

const PinnedPrompt = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: var(--space-100);
  padding: var(--space-200) var(--space-500);
  border-bottom: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-on-container-low);
`;

const PinnedPromptHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-200);
  min-width: 0;
`;

const PinnedPromptText = styled.p`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.45;
  white-space: pre-wrap;
`;

const Transcript = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: var(--space-300) var(--space-500);
  overflow: hidden;
`;

const ResultCard = styled.section`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-200);
  min-width: 0;
  min-height: 0;
`;

/** Route map takes remaining height; scores stay compact at the bottom. */
const OutcomeSplit = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-150);
  min-width: 0;
  min-height: 0;
`;

const AdvancedChevron = styled(ChevronDown)<{ $open?: boolean }>`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  transition: transform 120ms ease;
`;

const AdvancedBody = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: var(--space-150);
  min-width: 0;
  padding: var(--space-200);
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-canvas);
`;

const SectionLabel = styled.h3`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const GraphSlot = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: var(--space-200);
  overflow: hidden;
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-canvas);
`;

const ScoresPanel = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
  padding: var(--space-150) var(--space-200);
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-canvas);
`;

const ScoresHeading = styled.h3`
  margin: 0;
  flex-shrink: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-helper);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const ScoresBlock = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const SessionFooter = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-200);
  padding: var(--space-200) var(--space-500);
  border-top: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-container);
`;

const ComposerZone = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-150);
  width: 100%;
  max-width: 40rem;
`;

const ComposerShell = styled.div<{ $focused?: boolean }>`
  display: flex;
  align-items: flex-end;
  gap: var(--space-100);
  box-sizing: border-box;
  width: 100%;
  padding: var(--space-150) var(--space-150) var(--space-150) var(--space-300);
  border: var(--stroke-100) solid
    ${({ $focused }) =>
      $focused ? 'var(--color-primary-primary)' : 'var(--color-stroke-border)'};
  border-radius: var(--radius-400);
  background: var(--color-surfaces-canvas);
  box-shadow: ${({ $focused }) =>
    $focused ? 'var(--elevation-3)' : 'var(--elevation-1)'};
  transition: border-color 120ms ease;
`;

const PromptArea = styled.textarea`
  flex: 1 1 auto;
  box-sizing: border-box;
  width: 100%;
  min-height: 1.5rem;
  max-height: 7.5rem;
  margin: var(--space-100) 0;
  padding: 0;
  border: none;
  resize: none;
  background: transparent;
  color: var(--color-text-icon-primary);
  font: inherit;
  font-size: var(--type-size-body);
  line-height: 1.45;

  &::placeholder {
    color: var(--color-text-icon-placeholder);
  }

  &:focus {
    outline: none;
  }
`;

const ComposerControls = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-050);
  padding-bottom: var(--space-025);
`;

const Suggestions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-100);
  width: 100%;

  @media (max-width: 40rem) {
    grid-template-columns: 1fr;
  }
`;

const SuggestionChip = styled.button<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-050);
  box-sizing: border-box;
  width: 100%;
  min-height: 3.25rem;
  margin: 0;
  padding: var(--space-150) var(--space-200);
  border: var(--stroke-100) solid
    ${({ $selected }) =>
      $selected ? 'var(--color-primary-primary)' : 'var(--color-stroke-border)'};
  border-radius: var(--radius-200);
  background: ${({ $selected }) =>
    $selected ? 'var(--color-primary-primary-overlay)' : 'var(--color-surfaces-canvas)'};
  color: var(--color-text-icon-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;

  &:hover {
    background: var(--color-surfaces-on-container-high);
  }

  &:focus-visible {
    outline: var(--stroke-150) solid var(--color-primary-primary);
    outline-offset: var(--space-025);
  }
`;

const SuggestionTitle = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const SuggestionSummary = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const Status = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  text-align: center;
`;

export interface TryRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyId: PolicyId;
  /** Prefill the composer when the overlay opens. */
  seedPrompt?: string;
  /** When seedPrompt is set, evaluate immediately (default true). */
  autoEvaluate?: boolean;
  onEvaluated?: (result: PromptEvaluation) => void;
  /** Open Create policy with fields seeded from this session. */
  onCreatePolicy?: (values: PolicyFormValues) => void;
}

export function TryRequestModal({
  open,
  onOpenChange,
  policyId,
  seedPrompt,
  autoEvaluate = true,
  onEvaluated,
  onCreatePolicy,
}: TryRequestModalProps) {
  const promptId = useId();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<TrySession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composing, setComposing] = useState(true);
  const [focused, setFocused] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activeSession = sessions.find((session) => session.id === activeId) ?? null;
  const showTabs = sessions.length > 0;
  const showLanding = composing || sessions.length === 0;

  useEffect(() => {
    if (!open) return;
    setFocused(false);
    setSelectedLibraryId(null);
    setDraft('');

    if (seedPrompt?.trim() && autoEvaluate) {
      const result = evaluatePrompt(
        seedPrompt,
        policyId,
        DEFAULT_PRIORITIES,
        DEFAULT_TRY_JUDGEMENT,
      );
      const session: TrySession = {
        id: newSessionId(),
        title: tabTitle(seedPrompt),
        prompt: seedPrompt.trim(),
        evaluation: result,
        judgement: DEFAULT_TRY_JUDGEMENT,
      };
      setSessions([session]);
      setActiveId(session.id);
      setComposing(false);
      onEvaluated?.(result);
      return;
    }

    setSessions([]);
    setActiveId(null);
    setComposing(true);
    // Intentionally omit onEvaluated — parent callbacks are not memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, policyId, seedPrompt, autoEvaluate]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKeyDown);

    const focusTimer = window.setTimeout(() => {
      if (showLanding) areaRef.current?.focus();
    }, 0);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, onOpenChange, showLanding]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el || !showLanding) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft, open, showLanding]);

  function appendSession(
    nextPrompt: string,
    libraryId: string | null,
    judgement: TryJudgement,
  ) {
    const trimmed = nextPrompt.trim();
    if (!trimmed) return;

    const libraryTitle =
      PROMPT_LIBRARY.find((item) => item.id === libraryId)?.title ?? null;
    const result = evaluatePrompt(trimmed, policyId, DEFAULT_PRIORITIES, judgement);
    const session: TrySession = {
      id: newSessionId(),
      title: tabTitle(trimmed, libraryTitle),
      prompt: trimmed,
      evaluation: result,
      judgement,
    };

    setSessions((prev) => [...prev, session]);
    setActiveId(session.id);
    setComposing(false);
    setDraft('');
    setSelectedLibraryId(null);
    onEvaluated?.(result);
  }

  function onJudgementChange(sessionId: string, next: TryJudgement) {
    const target = sessions.find((session) => session.id === sessionId);
    if (!target) return;
    const result = evaluatePrompt(
      target.prompt,
      policyId,
      DEFAULT_PRIORITIES,
      next,
    );
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, judgement: next, evaluation: result }
          : session,
      ),
    );
    onEvaluated?.(result);
  }

  function pickSuggestion(item: PromptLibraryItem) {
    const judgement = activeSession?.judgement ?? DEFAULT_TRY_JUDGEMENT;
    appendSession(item.prompt, item.id, judgement);
  }

  function clearDraft() {
    setDraft('');
    setSelectedLibraryId(null);
    areaRef.current?.focus();
  }

  function runEvaluation() {
    const judgement = activeSession?.judgement ?? DEFAULT_TRY_JUDGEMENT;
    appendSession(draft, selectedLibraryId, judgement);
  }

  function onPromptKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      runEvaluation();
    }
  }

  function handleCreatePolicy() {
    if (!onCreatePolicy || !activeSession) return;
    onCreatePolicy(
      policyFormFromTrySession(
        activeSession.judgement,
        activeSession.evaluation,
        policyId,
      ),
    );
  }

  function selectTab(id: string) {
    setActiveId(id);
    setComposing(false);
    setDraft('');
    setSelectedLibraryId(null);
  }

  function startNewPrompt() {
    setComposing(true);
    setDraft('');
    setSelectedLibraryId(null);
    window.setTimeout(() => areaRef.current?.focus(), 0);
  }

  function closeTab(id: string, event?: ReactMouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();

    setSessions((prev) => {
      const index = prev.findIndex((session) => session.id === id);
      const next = prev.filter((session) => session.id !== id);
      if (next.length === 0) {
        setActiveId(null);
        setComposing(true);
        return next;
      }
      if (activeId === id) {
        const fallback = next[Math.max(0, index - 1)] ?? next[0];
        setActiveId(fallback.id);
        setComposing(false);
      }
      return next;
    });
  }

  const shell =
    typeof document !== 'undefined' ? document.getElementById(SHELL_ID) : null;
  const canSubmit = Boolean(draft.trim());

  if (!open || !shell) return null;

  return createPortal(
    <>
      <Scrim aria-hidden onClick={() => onOpenChange(false)} />
      <Panel
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <Header>
          <HeaderText>
            <Title id={titleId}>Test a Prompt</Title>
            <Subtitle>
              {showTabs
                ? 'Switch tabs to compare routes. Use + to start another prompt.'
                : 'Ask a request to see how judgement rules select a route.'}
            </Subtitle>
          </HeaderText>
          <IconButton
            label="Close dialog"
            icon={<X aria-hidden />}
            intent="secondary"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          />
        </Header>

        {showTabs ? (
          <TabBar>
            <TabList role="tablist" aria-label="Prompt comparisons">
              {sessions.map((session) => {
                const active = !composing && session.id === activeId;
                return (
                  <TabChip
                    key={session.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    $active={active}
                    onClick={() => selectTab(session.id)}
                  >
                    <TabLabel>{session.title}</TabLabel>
                    <TabClose
                      role="button"
                      aria-label={`Close ${session.title}`}
                      tabIndex={0}
                      onClick={(event) => closeTab(session.id, event)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          closeTab(session.id);
                        }
                      }}
                    >
                      <X size={14} aria-hidden />
                    </TabClose>
                  </TabChip>
                );
              })}
            </TabList>
            <IconButton
              label="New prompt"
              icon={<Plus aria-hidden />}
              intent="secondary"
              variant={composing ? 'tonal' : 'ghost'}
              size="sm"
              type="button"
              onClick={startNewPrompt}
            />
          </TabBar>
        ) : null}

        {showLanding ? (
          <Landing>
            <LandingInner>
              <ComposerZone aria-label="Request composer">
                <ComposerShell $focused={focused}>
                  <PromptArea
                    ref={areaRef}
                    id={promptId}
                    value={draft}
                    rows={1}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setSelectedLibraryId(null);
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={onPromptKeyDown}
                    placeholder="Ask anything to route…"
                    aria-label="Prompt"
                  />
                  <ComposerControls>
                    {draft ? (
                      <IconButton
                        label="Clear prompt"
                        icon={<X aria-hidden />}
                        intent="secondary"
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={clearDraft}
                      />
                    ) : null}
                    <IconButton
                      label="Test a Prompt"
                      icon={<ArrowUp aria-hidden />}
                      intent="primary"
                      variant="fill"
                      size="sm"
                      type="button"
                      disabled={!canSubmit}
                      onClick={runEvaluation}
                    />
                  </ComposerControls>
                </ComposerShell>
              </ComposerZone>

              <Suggestions aria-label="Suggested prompts">
                {PROMPT_LIBRARY.map((item) => (
                  <SuggestionChip
                    key={item.id}
                    type="button"
                    $selected={selectedLibraryId === item.id}
                    aria-pressed={selectedLibraryId === item.id}
                    onClick={() => pickSuggestion(item)}
                  >
                    <SuggestionTitle>{item.title}</SuggestionTitle>
                    <SuggestionSummary>{item.summary}</SuggestionSummary>
                  </SuggestionChip>
                ))}
              </Suggestions>
              <Status role="status">
                {draft.trim()
                  ? 'Press Enter or the arrow to evaluate.'
                  : 'Pick a suggestion, or type your own request.'}
              </Status>
            </LandingInner>
          </Landing>
        ) : activeSession ? (
          <SessionShell>
            <PinnedPrompt>
              <PinnedPromptHeader>
                <SectionLabel>Prompt</SectionLabel>
                <Button
                  type="button"
                  size="sm"
                  intent="secondary"
                  variant="ghost"
                  endIcon={<AdvancedChevron $open={advancedOpen} aria-hidden />}
                  aria-expanded={advancedOpen}
                  onClick={() => setAdvancedOpen((open) => !open)}
                >
                  Advanced settings
                </Button>
              </PinnedPromptHeader>
              <PinnedPromptText>{activeSession.prompt}</PinnedPromptText>
            </PinnedPrompt>
            <Transcript aria-live="polite">
              <ResultCard>
                {advancedOpen ? (
                  <AdvancedBody>
                    <JudgementControls
                      value={activeSession.judgement}
                      onChange={(next) => onJudgementChange(activeSession.id, next)}
                    />
                  </AdvancedBody>
                ) : null}

                <OutcomeSplit>
                  <GraphSlot>
                    <RouterLaneGraph
                      policyId={policyId}
                      evaluation={activeSession.evaluation}
                    />
                  </GraphSlot>

                  <ScoresPanel aria-label="Selected route scores">
                    <ScoresHeading>Route scores</ScoresHeading>
                    <ScoresBlock>
                      <PriorityControls evaluation={activeSession.evaluation} />
                    </ScoresBlock>
                  </ScoresPanel>
                </OutcomeSplit>
              </ResultCard>
            </Transcript>
            {onCreatePolicy ? (
              <SessionFooter>
                <Button
                  intent="primary"
                  variant="fill"
                  size="sm"
                  startIcon={<Plus size={16} aria-hidden />}
                  type="button"
                  onClick={handleCreatePolicy}
                >
                  Make a new policy
                </Button>
              </SessionFooter>
            ) : null}
          </SessionShell>
        ) : null}
      </Panel>
    </>,
    shell,
  );
}
