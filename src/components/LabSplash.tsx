import type { ReactNode } from 'react';
import styled from 'styled-components';
import { LeadIcon } from './LeadIcon';

type SplashAlign = 'center' | 'start' | 'rail';

const Splash = styled.header<{ $align: SplashAlign }>`
  display: flex;
  flex-direction: ${({ $align }) => ($align === 'start' ? 'row' : 'column')};
  align-items: ${({ $align }) => ($align === 'center' ? 'center' : 'flex-start')};
  gap: ${({ $align }) =>
    $align === 'rail' ? 'var(--space-100)' : 'var(--space-150)'};
  width: 100%;
  max-width: ${({ $align }) => ($align === 'center' ? '36rem' : 'none')};
  margin: ${({ $align }) => ($align === 'center' ? '0 auto' : '0')};
  text-align: ${({ $align }) => ($align === 'center' ? 'center' : 'left')};
`;

const Mark = styled.div<{ $align: SplashAlign }>`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: ${({ $align }) =>
    $align === 'rail' ? 'var(--space-700)' : 'var(--space-800)'};
  height: ${({ $align }) =>
    $align === 'rail' ? 'var(--space-700)' : 'var(--space-800)'};
  border-radius: var(--radius-200);
  background: var(--color-primary-primary-overlay);
  color: var(--color-primary-primary);
`;

const Copy = styled.div<{ $align: SplashAlign }>`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: ${({ $align }) => ($align === 'center' ? 'center' : 'flex-start')};
  gap: var(--space-075);
  min-width: 0;
  padding-top: ${({ $align }) => ($align === 'start' ? 'var(--space-025)' : '0')};
`;

const Title = styled.h2<{ $align: SplashAlign }>`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: ${({ $align }) =>
    $align === 'rail' ? 'var(--type-size-subject)' : 'var(--type-size-title)'};
  font-weight: var(--font-weight-bold);
  line-height: 1.25;
`;

const Description = styled.p<{ $align: SplashAlign }>`
  margin: 0;
  max-width: ${({ $align }) => ($align === 'rail' ? 'none' : '32rem')};
  color: var(--color-text-icon-secondary);
  font-size: ${({ $align }) =>
    $align === 'rail' ? 'var(--type-size-caption)' : 'var(--type-size-body)'};
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

export interface LabSplashProps {
  icon: ReactNode;
  title: string;
  description: string;
  /**
   * `center` — splash landings.
   * `start` — denser tool headers (row).
   * `rail` — compact left-nav brand above Start new.
   */
  align?: SplashAlign;
}

/** Mini-app welcome inside a white workspace card (or session rail). */
export function LabSplash({
  icon,
  title,
  description,
  align = 'center',
}: LabSplashProps) {
  return (
    <Splash $align={align}>
      <Mark $align={align}>
        <LeadIcon>{icon}</LeadIcon>
      </Mark>
      <Copy $align={align}>
        <Title $align={align}>{title}</Title>
        <Description $align={align}>{description}</Description>
      </Copy>
    </Splash>
  );
}
