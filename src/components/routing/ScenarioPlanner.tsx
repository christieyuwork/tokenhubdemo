import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { IconButton } from '@cake-admin/cakeand';
import { ArrowUp, MessageSquareText, X } from 'lucide-react';
import styled from 'styled-components';
import {
  replyToPromptLab,
  SCENARIO_SUGGESTIONS,
  type ScenarioSuggestion,
} from '../../data/promptLabChat';
import {
  buildTryInsights,
  type LabInsights,
} from '../../data/labInsights';
import {
  DEFAULT_PRIORITIES,
  DEFAULT_TRY_JUDGEMENT,
  evaluatePrompt,
  type PolicyId,
  type PromptEvaluation,
} from '../../data/routingDemo';
import { LabAiInsights } from './LabAiInsights';
import { LabSessionRail } from './LabSessionRail';
import { PriorityControls } from './PriorityControls';
import { RouterLaneGraph } from './RouterLaneGraph';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  evaluation?: PromptEvaluation;
  insights?: LabInsights;
}

interface ScenarioSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface ScenarioPlannerProps {
  policyId: PolicyId;
  onEvaluated?: (result: PromptEvaluation) => void;
  /** Centered mini-app welcome shown on the empty / landing state. */
  splash?: ReactNode;
  /** Compact brand for the session rail once a chat has begun. */
  brand?: ReactNode;
}

function newMsgId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function newSessionId() {
  return `sc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function sessionTitle(text: string, suggestionTitle?: string | null): string {
  if (suggestionTitle?.trim()) return suggestionTitle.trim();
  const compact = text.trim().replace(/\s+/g, ' ');
  if (compact.length <= 32) return compact;
  return `${compact.slice(0, 31)}…`;
}

const Root = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  align-items: stretch;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: calc(100dvh - 8rem);
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

const ComposerShell = styled.div<{ $focused?: boolean }>`
  display: flex;
  align-items: flex-end;
  gap: var(--space-100);
  box-sizing: border-box;
  width: 100%;
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

const SessionShell = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 100%;
  overflow: visible;
`;

const Messages = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-150);
  box-sizing: border-box;
  width: 100%;
  max-width: 44rem;
  min-height: 0;
  margin: 0 auto;
  padding: var(--space-250) var(--space-300) var(--space-200);
  overflow: visible;
`;

const Bubble = styled.div<{ $role: 'user' | 'assistant' }>`
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  max-width: 88%;
  padding: var(--space-100) var(--space-150);
  border-radius: var(--radius-150);
  background: ${({ $role }) =>
    $role === 'user'
      ? 'var(--color-primary-primary-overlay)'
      : 'var(--color-surfaces-on-container-high)'};
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-helper);
  font-weight: var(--font-weight-medium);
  line-height: 1.45;
  white-space: pre-wrap;
`;

const AssistantBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  gap: var(--space-200);
  width: 100%;
  max-width: 100%;
`;

const ResultCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-100);
  width: 100%;
  min-width: 0;
  padding: var(--space-150);
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-on-container-high);
`;

const GraphSlot = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 14rem;
  padding: var(--space-100);
  overflow: hidden;
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-150);
  background: var(--color-surfaces-canvas);
`;

const PromptSnippet = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const StickyChatFooter = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 100%;
  margin-top: auto;
  border-top: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-container);
`;

const FollowUps = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: var(--space-075);
  width: 100%;
  max-width: 44rem;
  margin: 0 auto;
  padding: var(--space-150) var(--space-300) var(--space-100);
`;

const FollowUpChip = styled.button`
  margin: 0;
  padding: var(--space-050) var(--space-100);
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-1000);
  background: var(--color-surfaces-on-container-high);
  color: var(--color-text-icon-primary);
  font: inherit;
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.3;
  cursor: pointer;

  &:hover {
    border-color: var(--color-stroke-border);
    background: var(--color-surfaces-on-container);
  }

  &:focus-visible {
    outline: var(--stroke-150) solid var(--color-primary-primary);
    outline-offset: var(--space-025);
  }
`;

const ComposerBar = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: flex-end;
  gap: var(--space-100);
  box-sizing: border-box;
  width: 100%;
  max-width: 44rem;
  margin: 0 auto;
  padding: var(--space-100) var(--space-300) var(--space-250);
  background: var(--color-surfaces-container);
`;

const SessionComposer = styled(ComposerShell)`
  flex: 1 1 auto;
`;

const FOLLOW_UP_CHIPS = SCENARIO_SUGGESTIONS.slice(2, 5);

export function ScenarioPlanner({
  policyId,
  onEvaluated,
  splash,
  brand,
}: ScenarioPlannerProps) {
  const promptId = useId();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const sessionAreaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ScenarioSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composing, setComposing] = useState(true);

  const activeSession = sessions.find((session) => session.id === activeId) ?? null;
  const showLanding = composing || sessions.length === 0;

  useEffect(() => {
    if (!showLanding) return;
    const focusTimer = window.setTimeout(() => areaRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [showLanding]);

  useEffect(() => {
    const el = showLanding ? areaRef.current : sessionAreaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft, showLanding]);

  function sendMessage(text: string, suggestionId?: string | null) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const reply = replyToPromptLab(trimmed);
    const evaluate =
      reply.actions?.find((action) => action.type === 'evaluatePrompt')?.prompt ??
      null;
    const evaluation = evaluate
      ? evaluatePrompt(evaluate, policyId, DEFAULT_PRIORITIES, DEFAULT_TRY_JUDGEMENT)
      : undefined;

    const userMsg: ChatMessage = {
      id: newMsgId(),
      role: 'user',
      text: trimmed,
    };
    const assistantMsg: ChatMessage = {
      id: newMsgId(),
      role: 'assistant',
      text: reply.text,
      evaluation,
      insights: evaluation
        ? buildTryInsights(evaluation)
        : reply.insights,
    };

    const suggestionTitle =
      SCENARIO_SUGGESTIONS.find((item) => item.id === suggestionId)?.title ?? null;

    if (composing || !activeSession) {
      const session: ScenarioSession = {
        id: newSessionId(),
        title: sessionTitle(trimmed, suggestionTitle),
        messages: [userMsg, assistantMsg],
      };
      setSessions((prev) => [session, ...prev]);
      setActiveId(session.id);
      setComposing(false);
    } else {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSession.id
            ? {
                ...session,
                messages: [...session.messages, userMsg, assistantMsg],
              }
            : session,
        ),
      );
    }

    setDraft('');
    setSelectedId(suggestionId ?? null);
    if (evaluation) onEvaluated?.(evaluation);
  }

  function pickSuggestion(item: ScenarioSuggestion) {
    sendMessage(item.message, item.id);
  }

  function clearDraft() {
    setDraft('');
    setSelectedId(null);
    (showLanding ? areaRef : sessionAreaRef).current?.focus();
  }

  function startNewScenario() {
    setComposing(true);
    setDraft('');
    setSelectedId(null);
    window.setTimeout(() => areaRef.current?.focus(), 0);
  }

  function selectSession(id: string) {
    setActiveId(id);
    setComposing(false);
    setDraft('');
    setSelectedId(null);
  }

  function closeSession(id: string, event?: ReactMouseEvent) {
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

  function onPromptKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(draft, selectedId);
    }
  }

  const canSubmit = Boolean(draft.trim());

  const landing = (
    <Landing>
      <LandingInner>
        {sessions.length === 0 ? splash : null}
        <ComposerZone aria-label="Scenario composer">
          <ComposerShell $focused={focused}>
            <PromptArea
              ref={areaRef}
              id={promptId}
              value={draft}
              rows={1}
              onChange={(event) => {
                setDraft(event.target.value);
                setSelectedId(null);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={onPromptKeyDown}
              placeholder="Describe a workload to plan…"
              aria-label="Scenario"
            />
            <ComposerControls>
              {draft ? (
                <IconButton
                  label="Clear scenario"
                  icon={<X aria-hidden />}
                  intent="secondary"
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={clearDraft}
                />
              ) : null}
              <IconButton
                label="Plan scenario"
                icon={<ArrowUp aria-hidden />}
                intent="primary"
                variant="fill"
                size="sm"
                type="button"
                disabled={!canSubmit}
                onClick={() => sendMessage(draft, selectedId)}
              />
            </ComposerControls>
          </ComposerShell>
        </ComposerZone>

        <Suggestions aria-label="Suggested scenarios">
          {SCENARIO_SUGGESTIONS.map((item) => (
            <SuggestionChip
              key={item.id}
              type="button"
              $selected={selectedId === item.id}
              aria-pressed={selectedId === item.id}
              onClick={() => pickSuggestion(item)}
            >
              <SuggestionTitle>{item.title}</SuggestionTitle>
              <SuggestionSummary>{item.summary}</SuggestionSummary>
            </SuggestionChip>
          ))}
        </Suggestions>
        <Status role="status">
          {draft.trim()
            ? 'Press Enter or the arrow to plan.'
            : 'Pick a suggestion, or describe your own workload.'}
        </Status>
      </LandingInner>
    </Landing>
  );

  const chat = activeSession ? (
    <SessionShell data-lab-session="true">
      <Messages aria-live="polite">
        {activeSession.messages.map((message) => {
          if (message.role === 'user') {
            return (
              <Bubble key={message.id} $role="user">
                {message.text}
              </Bubble>
            );
          }

          return (
            <AssistantBlock key={message.id}>
              <Bubble $role="assistant">{message.text}</Bubble>
              {message.evaluation ? (
                <ResultCard aria-label="Routing result">
                  <PromptSnippet>{message.evaluation.prompt}</PromptSnippet>
                  <GraphSlot>
                    <RouterLaneGraph
                      policyId={policyId}
                      evaluation={message.evaluation}
                      compact
                    />
                  </GraphSlot>
                  <PriorityControls evaluation={message.evaluation} />
                </ResultCard>
              ) : null}
              {message.insights ? (
                <LabAiInsights insights={message.insights} />
              ) : null}
            </AssistantBlock>
          );
        })}
      </Messages>

      <StickyChatFooter>
        <FollowUps aria-label="Follow-up suggestions">
          {FOLLOW_UP_CHIPS.map((chip) => (
            <FollowUpChip
              key={chip.id}
              type="button"
              onClick={() => sendMessage(chip.message, chip.id)}
            >
              {chip.title}
            </FollowUpChip>
          ))}
        </FollowUps>

        <ComposerBar>
          <SessionComposer $focused={focused}>
            <PromptArea
              ref={sessionAreaRef}
              value={draft}
              rows={1}
              onChange={(event) => {
                setDraft(event.target.value);
                setSelectedId(null);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={onPromptKeyDown}
              placeholder="Ask a follow-up…"
              aria-label="Follow-up"
            />
            <ComposerControls>
              {draft ? (
                <IconButton
                  label="Clear message"
                  icon={<X aria-hidden />}
                  intent="secondary"
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={clearDraft}
                />
              ) : null}
              <IconButton
                label="Send"
                icon={<ArrowUp aria-hidden />}
                intent="primary"
                variant="fill"
                size="sm"
                type="button"
                disabled={!canSubmit}
                onClick={() => sendMessage(draft, selectedId)}
              />
            </ComposerControls>
          </SessionComposer>
        </ComposerBar>
      </StickyChatFooter>
    </SessionShell>
  ) : null;

  return (
    <Root aria-label="Scenario planner">
      <LabSessionRail
        sessions={sessions}
        activeId={activeId}
        composing={composing}
        brand={brand}
        newLabel="New scenario"
        listLabel="Chats"
        ariaLabel="Scenario chats"
        icon={<MessageSquareText aria-hidden />}
        onNew={startNewScenario}
        onSelect={selectSession}
        onClose={closeSession}
      />

      <Main>{showLanding ? landing : chat}</Main>
    </Root>
  );
}
