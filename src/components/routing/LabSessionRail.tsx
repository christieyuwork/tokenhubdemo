import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { Button } from '@cake-admin/cakeand';
import { Plus, X } from 'lucide-react';
import styled from 'styled-components';

export interface LabSessionRailItem {
  id: string;
  title: string;
}

interface LabSessionRailProps {
  sessions: LabSessionRailItem[];
  activeId: string | null;
  /** True while the landing / new-compose state is showing. */
  composing?: boolean;
  /** Feature brand (icon + title + description) pinned above Start new. */
  brand?: ReactNode;
  newLabel: string;
  listLabel: string;
  ariaLabel: string;
  icon: ReactNode;
  onNew: () => void;
  onSelect: (id: string) => void;
  onClose: (id: string, event?: ReactMouseEvent) => void;
}

const SideRail = styled.aside`
  display: flex;
  flex: 0 0 15rem;
  flex-direction: column;
  gap: var(--space-100);
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  padding: var(--space-150);
  border-right: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-on-container-high);

  @media (max-width: 48rem) {
    flex-basis: 12rem;
  }
`;

const RailBrand = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  min-width: 0;
  padding: 0 var(--space-050) var(--space-050);
`;

const RailHeader = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: var(--space-200);
`;

const RailLabel = styled.p`
  margin: 0;
  padding: 0 var(--space-050);
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const SessionList = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-050);
  min-height: 0;
  overflow: auto;
`;

const SessionRow = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-075);
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: var(--space-075) var(--space-100);
  border: none;
  border-radius: var(--radius-150);
  background: ${({ $active }) =>
    $active ? 'var(--color-primary-primary-overlay)' : 'transparent'};
  color: var(--color-text-icon-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ $active }) =>
      $active
        ? 'var(--color-primary-primary-overlay)'
        : 'var(--color-surfaces-on-container)'};
  }

  &:focus-visible {
    outline: var(--stroke-150) solid var(--color-primary-primary);
    outline-offset: var(--space-025);
  }
`;

const SessionIcon = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: var(--color-text-icon-secondary);

  svg {
    width: 14px;
    height: 14px;
  }
`;

const SessionLabel = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--type-size-helper);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const SessionClose = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--space-400);
  height: var(--space-400);
  border-radius: var(--radius-1000);
  color: var(--color-text-icon-secondary);
  opacity: 0;

  ${SessionRow}:hover &,
  ${SessionRow}:focus-visible &,
  &:focus-visible {
    opacity: 1;
  }

  &:hover {
    background: var(--color-surfaces-on-container-low);
    color: var(--color-text-icon-primary);
  }
`;

/** Shared left session rail used by Scenario and Test a Prompt. */
export function LabSessionRail({
  sessions,
  activeId,
  composing = false,
  brand,
  newLabel,
  listLabel,
  ariaLabel,
  icon,
  onNew,
  onSelect,
  onClose,
}: LabSessionRailProps) {
  if (sessions.length === 0) return null;

  return (
    <SideRail aria-label={ariaLabel}>
      {brand ? <RailBrand>{brand}</RailBrand> : null}
      <RailHeader>
        <Button
          type="button"
          size="sm"
          intent="secondary"
          variant={composing ? 'tonal' : 'outline'}
          startIcon={<Plus size={14} aria-hidden />}
          onClick={onNew}
        >
          {newLabel}
        </Button>
        <RailLabel>{listLabel}</RailLabel>
      </RailHeader>
      <SessionList role="listbox" aria-label={listLabel}>
        {sessions.map((session) => {
          const active = !composing && session.id === activeId;
          return (
            <SessionRow
              key={session.id}
              type="button"
              role="option"
              aria-selected={active}
              $active={active}
              onClick={() => onSelect(session.id)}
            >
              <SessionIcon>{icon}</SessionIcon>
              <SessionLabel>{session.title}</SessionLabel>
              <SessionClose
                role="button"
                aria-label={`Close ${session.title}`}
                tabIndex={0}
                onClick={(event) => onClose(session.id, event)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose(session.id);
                  }
                }}
              >
                <X size={14} aria-hidden />
              </SessionClose>
            </SessionRow>
          );
        })}
      </SessionList>
    </SideRail>
  );
}
