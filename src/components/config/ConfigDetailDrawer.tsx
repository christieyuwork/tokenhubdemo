import { type ReactNode, useEffect } from 'react';
import { IconButton } from '@cake-admin/cakeand';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

export interface ConfigDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Width of the panel in px. */
  width?: number;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const Overlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  background: var(--color-overlay-scrim);
  animation: ${fadeIn} 160ms ease-out;
  z-index: 40;
`;

const Content = styled(Dialog.Content)<{ $width: number }>`
  box-sizing: border-box;
  position: fixed;
  top: 0;
  right: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  width: min(100vw, ${(p) => p.$width}px);
  height: 100vh;
  background: var(--color-surfaces-container);
  box-shadow: var(--elevation-5);
  border-left: var(--stroke-100) solid var(--color-stroke-border);
  animation: ${slideIn} 200ms ease-out;
  outline: none;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-300);
  padding: var(--space-500);
  border-bottom: var(--stroke-100) solid var(--color-stroke-border);
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;
`;

const Title = styled(Dialog.Title)`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-semibold);
  line-height: 1.35;
`;

const Subtitle = styled(Dialog.Description)`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

const Body = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: var(--space-500);
  display: flex;
  flex-direction: column;
  gap: var(--space-400);
`;

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-200);
  justify-content: flex-end;
  padding: var(--space-400) var(--space-500);
  border-top: var(--stroke-100) solid var(--color-stroke-border);
`;

export function ConfigDetailDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
  width = 440,
}: ConfigDetailDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Overlay />
        <Content $width={width} aria-describedby={subtitle ? undefined : undefined}>
          <Header>
            <HeaderText>
              <Title>{title}</Title>
              {subtitle ? <Subtitle>{subtitle}</Subtitle> : <Subtitle style={{ display: 'none' }} />}
            </HeaderText>
            <IconButton
              label="Close details"
              icon={<X size={16} aria-hidden />}
              size="sm"
              variant="ghost"
              intent="secondary"
              onClick={() => onOpenChange(false)}
            />
          </Header>
          <Body>{children}</Body>
          {footer ? <Footer>{footer}</Footer> : null}
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const DrawerSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-150);
`;

export const DrawerSectionTitle = styled.h3`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-semibold);
  line-height: 1.35;
`;

export const DrawerField = styled.div`
  display: grid;
  grid-template-columns: minmax(7rem, 40%) 1fr;
  gap: var(--space-200);
  align-items: start;
`;

export const DrawerLabel = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

export const DrawerValue = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  word-break: break-word;
`;

export const DrawerNote = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.4;
`;

export const PercentBarTrack = styled.div`
  width: 100%;
  height: var(--space-200);
  border-radius: var(--radius-1000);
  background: var(--color-surfaces-on-container-high);
  overflow: hidden;
`;

export const PercentBarFill = styled.div<{ $pct: number }>`
  width: ${(p) => Math.min(100, Math.max(0, p.$pct))}%;
  height: 100%;
  background: var(--color-primary-primary);
  border-radius: var(--radius-1000);
`;
