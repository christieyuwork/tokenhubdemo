import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { Button, IconButton } from '@cake-admin/cakeand';
import { ArrowUp, ChevronDown, MessageSquareText, Plus, X } from 'lucide-react';
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
import { buildTryInsights } from '../../data/labInsights';
import { LabAiInsights } from './LabAiInsights';
import { LabSessionRail } from './LabSessionRail';
import {
  policyFormFromTrySession,
  type PolicyFormValues,
} from './PolicyFormModal';
import { JudgementControls } from './JudgementControls';
import { PriorityControls } from './PriorityControls';
import { RouterLaneGraph } from './RouterLaneGraph';

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

const Root = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  align-items: stretch;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 100%;
  overflow: visible;
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-container);
`;

const Main = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-self: stretch;
  min-width: 0;
  min-height: 100%;
  overflow: visible;
`;

const Landing = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: var(--space-500);
  min-height: 0;
  padding: var(--space-700) var(--space-500) var(--space-700);
  overflow: visible;
`;

const LandingInner = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-300);
  box-sizing: border-box;
  width: 100%;
  max-width: 48rem;
  margin: 0 auto;
  padding-block: var(--space-200);
`;

/** Idle route preview — same width as the composer / suggestion block above. */
const LandingPreview = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  box-sizing: border-box;
  width: 100%;
  max-width: 48rem;
  min-width: 0;
  min-height: 0;
  margin: 0 auto;
  padding: var(--space-200) var(--space-250);
  overflow: hidden;
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-canvas);
`;

const SessionShell = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: visible;
`;

const PinnedPrompt = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: var(--space-100);
  padding: var(--space-100) var(--space-300);
  border-bottom: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-on-container-high);
`;

const PinnedPromptHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-200);
  min-width: 0;
`;

const PinnedPromptRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-100) var(--space-150);
  width: 100%;
  min-width: 0;
`;

const PinnedPromptText = styled.p`
  flex: 1 1 18rem;
  margin: 0;
  min-width: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  white-space: pre-wrap;
`;

const Transcript = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: var(--space-250) var(--space-300) var(--space-200);
  overflow: visible;
`;

const ResultCard = styled.section`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-250);
  min-width: 0;
  min-height: 0;
  overflow: visible;
`;

/** Route map + scores + insights flow with the page — no inner chat scrollbar. */
const OutcomeSplit = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-250);
  min-width: 0;
  min-height: 0;
  overflow: visible;
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
  align-items: stretch;
  gap: var(--space-100);
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  padding-top: var(--space-050);
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

/** Evaluated route map — modest floor, still content-sized. */
const GraphSlot = styled.div`
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: var(--space-200) var(--space-250);
  overflow: hidden;
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-canvas);
`;

const RouteStatus = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

const ScoresPanel = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
  padding-top: var(--space-050);
`;

const SessionFooter = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-150);
  margin-top: var(--space-100);
  padding: var(--space-250) var(--space-300) var(--space-300);
  border-top: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-container);
`;

const ComposerZone = styled.section`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-100);
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin: 0;
`;

const ComposerRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: var(--space-100) var(--space-150);
  width: 100%;
  min-width: 0;

  @media (max-width: 40rem) {
    flex-wrap: wrap;
  }
`;

const ComposerMain = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
`;

const AdvancedAside = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
  padding-top: var(--space-100);
`;

const ComposerShell = styled.div<{ $focused?: boolean }>`
  display: flex;
  flex: 1 1 auto;
  align-items: flex-end;
  gap: var(--space-100);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--space-100) var(--space-100) var(--space-100) var(--space-200);
  border: var(--stroke-100) solid
    ${({ $focused }) =>
      $focused ? 'var(--color-primary-primary)' : 'var(--color-stroke-border-low)'};
  border-radius: var(--radius-200);
  background: var(--color-surfaces-on-container-high);
  box-shadow: ${({ $focused }) =>
    $focused ? 'var(--elevation-2)' : 'var(--elevation-0)'};
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
  max-width: 100%;

  @media (max-width: 40rem) {
    grid-template-columns: 1fr;
  }
`;

const SuggestionChip = styled.button<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-025);
  box-sizing: border-box;
  width: 100%;
  min-height: 0;
  margin: 0;
  padding: var(--space-100) var(--space-150);
  border: var(--stroke-100) solid
    ${({ $selected }) =>
      $selected ? 'var(--color-primary-primary)' : 'var(--color-stroke-border-low)'};
  border-radius: var(--radius-150);
  background: ${({ $selected }) =>
    $selected
      ? 'var(--color-primary-primary-overlay)'
      : 'var(--color-surfaces-on-container-high)'};
  color: var(--color-text-icon-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;

  &:hover {
    border-color: var(--color-stroke-border);
    background: var(--color-surfaces-on-container);
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

export interface TryRequestWorkspaceProps {
  policyId: PolicyId;
  /** Prefill and evaluate when this prompt (or seedKey) changes. */
  seedPrompt?: string;
  /** Bump to re-apply the same seedPrompt from chat. */
  seedKey?: number;
  /** When seedPrompt is set, evaluate immediately (default true). */
  autoEvaluate?: boolean;
  onEvaluated?: (result: PromptEvaluation) => void;
  /** Open Create policy with fields seeded from this session. */
  onCreatePolicy?: (values: PolicyFormValues) => void;
  /** Centered mini-app welcome shown on the empty / landing state. */
  splash?: ReactNode;
  /** Compact brand for the session rail once a chat has begun. */
  brand?: ReactNode;
}

export function TryRequestWorkspace({
  policyId,
  seedPrompt,
  seedKey = 0,
  autoEvaluate = true,
  onEvaluated,
  splash,
  brand,
  onCreatePolicy,
}: TryRequestWorkspaceProps) {
  const promptId = useId();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<TrySession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composing, setComposing] = useState(true);
  const [focused, setFocused] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  /** Judgement applied to custom / landing prompts before a session exists. */
  const [composerJudgement, setComposerJudgement] =
    useState<TryJudgement>(DEFAULT_TRY_JUDGEMENT);

  const activeSession = sessions.find((session) => session.id === activeId) ?? null;
  const showLanding = composing || sessions.length === 0;

  useEffect(() => {
    if (!(seedPrompt?.trim() && autoEvaluate)) return;
    setFocused(false);
    setSelectedLibraryId(null);
    setDraft('');
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
    // Intentionally omit onEvaluated — parent callbacks are not memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyId, seedPrompt, seedKey, autoEvaluate]);

  useEffect(() => {
    if (!showLanding) return;
    const focusTimer = window.setTimeout(() => areaRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [showLanding]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el || !showLanding) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft, showLanding]);

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
    appendSession(item.prompt, item.id, composerJudgement);
  }

  function clearDraft() {
    setDraft('');
    setSelectedLibraryId(null);
    areaRef.current?.focus();
  }

  function runEvaluation() {
    appendSession(draft, selectedLibraryId, composerJudgement);
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

  const canSubmit = Boolean(draft.trim());
  const insights = activeSession
    ? buildTryInsights(activeSession.evaluation)
    : null;
  const evaluationKey = activeSession
    ? [
        activeSession.id,
        activeSession.evaluation.selectedId,
        activeSession.evaluation.statusMessage,
        activeSession.judgement.securityPatterns,
        activeSession.judgement.governance,
        activeSession.judgement.costQuality,
        activeSession.judgement.piiDetector,
      ].join('|')
    : '';

  return (
    <Root aria-label="Test a Prompt workspace">
      <LabSessionRail
        sessions={sessions}
        activeId={activeId}
        composing={composing}
        brand={brand}
        newLabel="New prompt"
        listLabel="Prompts"
        ariaLabel="Prompt sessions"
        icon={<MessageSquareText aria-hidden />}
        onNew={startNewPrompt}
        onSelect={selectTab}
        onClose={closeTab}
      />

      <Main>
        {showLanding ? (
          <Landing>
            <LandingInner>
              {sessions.length === 0 ? splash : null}
              <ComposerZone aria-label="Request composer">
                <ComposerRow>
                  <ComposerMain>
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
                  </ComposerMain>
                  <AdvancedAside>
                    <Button
                      type="button"
                      size="sm"
                      intent="secondary"
                      variant="ghost"
                      endIcon={<AdvancedChevron $open={advancedOpen} aria-hidden />}
                      aria-expanded={advancedOpen}
                      aria-controls={`${promptId}-advanced`}
                      onClick={() => setAdvancedOpen((open) => !open)}
                    >
                      Advanced settings
                    </Button>
                  </AdvancedAside>
                </ComposerRow>
                {advancedOpen ? (
                  <AdvancedBody id={`${promptId}-advanced`}>
                    <JudgementControls
                      value={composerJudgement}
                      onChange={setComposerJudgement}
                    />
                  </AdvancedBody>
                ) : null}
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

            <LandingPreview aria-label="Route map preview">
              <RouterLaneGraph
                policyId={policyId}
                evaluation={null}
                prompt={draft}
                compact
              />
            </LandingPreview>
          </Landing>
        ) : activeSession ? (
          <SessionShell>
            <PinnedPrompt>
              <PinnedPromptHeader>
                <SectionLabel>Prompt</SectionLabel>
              </PinnedPromptHeader>
              <PinnedPromptRow>
                <PinnedPromptText>{activeSession.prompt}</PinnedPromptText>
                <AdvancedAside>
                  <Button
                    type="button"
                    size="sm"
                    intent="secondary"
                    variant="ghost"
                    endIcon={<AdvancedChevron $open={advancedOpen} aria-hidden />}
                    aria-expanded={advancedOpen}
                    aria-controls={`${promptId}-session-advanced`}
                    onClick={() => setAdvancedOpen((open) => !open)}
                  >
                    Advanced settings
                  </Button>
                </AdvancedAside>
              </PinnedPromptRow>
              {advancedOpen ? (
                <AdvancedBody id={`${promptId}-session-advanced`}>
                  <JudgementControls
                    value={activeSession.judgement}
                    onChange={(next) =>
                      onJudgementChange(activeSession.id, next)
                    }
                  />
                </AdvancedBody>
              ) : null}
            </PinnedPrompt>
            <Transcript aria-live="polite">
              <ResultCard>
                <OutcomeSplit>
                  <GraphSlot>
                    <RouterLaneGraph
                      key={evaluationKey}
                      policyId={activeSession.evaluation.policyId}
                      evaluation={activeSession.evaluation}
                    />
                  </GraphSlot>

                  <RouteStatus role="status">
                    {activeSession.evaluation.statusMessage}
                  </RouteStatus>

                  <ScoresPanel aria-label="Selected route scores">
                    <PriorityControls evaluation={activeSession.evaluation} />
                  </ScoresPanel>

                  {insights ? <LabAiInsights insights={insights} /> : null}
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
      </Main>
    </Root>
  );
}
