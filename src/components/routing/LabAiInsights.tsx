import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import styled from 'styled-components';
import { InlineIcon } from '../LeadIcon';
import type { LabInsights } from '../../data/labInsights';

const Card = styled.section<{ $compact?: boolean }>`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: ${({ $compact }) =>
    $compact ? 'var(--space-100)' : 'var(--space-250)'};
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  /* Hug content — never stretch to fill the parent flex column. */
  height: auto;
  align-self: stretch;
  padding: ${({ $compact }) =>
    $compact
      ? 'var(--space-150) var(--space-200)'
      : 'var(--space-250) var(--space-300)'};
  border: var(--stroke-100) solid var(--color-stroke-border-low);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-on-container-high);
`;

const Header = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--space-075);
  min-width: 0;
  color: var(--color-text-icon-primary);
  font-size: ${({ $compact }) =>
    $compact ? 'var(--type-size-caption)' : 'var(--type-size-helper)'};
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const HeaderTitle = styled.span`
  flex: 1 1 auto;
  min-width: 0;
`;

const HeaderEnd = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  margin-left: auto;
`;

const Columns = styled.div<{ $layout: 'wide' | 'rail' | 'compact' }>`
  display: grid;
  grid-template-columns: ${({ $layout }) =>
    $layout === 'wide' ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)'};
  gap: ${({ $layout }) => {
    if ($layout === 'compact') return 'var(--space-100)';
    if ($layout === 'rail') return 'var(--space-250)';
    return 'var(--space-300) var(--space-500)';
  }};

  @media (max-width: 40rem) {
    grid-template-columns: 1fr;
    gap: ${({ $layout }) =>
      $layout === 'compact' ? 'var(--space-100)' : 'var(--space-300)'};
  }
`;

const Block = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $compact }) =>
    $compact ? 'var(--space-050)' : 'var(--space-150)'};
  min-width: 0;
`;

const Label = styled.h4`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const List = styled.ul<{ $compact?: boolean }>`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ $compact }) =>
    $compact ? 'var(--space-075)' : 'var(--space-200)'};
`;

const Item = styled.li<{ $compact?: boolean }>`
  position: relative;
  margin: 0;
  /* Dot (space-100) + gap (space-150) before text. */
  padding-left: calc(var(--space-100) + var(--space-150));
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: ${({ $compact }) => ($compact ? 1.35 : 1.5)};

  &::before {
    content: '';
    position: absolute;
    top: 0.55em;
    left: 0;
    width: var(--space-100);
    height: var(--space-100);
    border-radius: var(--radius-1000);
    background: var(--color-primary-primary);
  }
`;

export interface LabAiInsightsProps {
  insights: LabInsights;
  /** Accessible name for the section. */
  'aria-label'?: string;
  /**
   * `wide` — two columns; `rail` — stacked side panel;
   * `compact` — dense card for nesting under outcomes.
   */
  layout?: 'wide' | 'rail' | 'compact';
  /** Cap list length in compact surfaces (per block). */
  maxItems?: number;
  /** Optional trailing slot in the header (e.g. close control). */
  headerEnd?: ReactNode;
}

/**
 * Shared TokenOps AI insights surface — same mark, labels, and list treatment
 * in Test a Prompt, What if, and Scenario so users recognize one AI signal.
 */
export function LabAiInsights({
  insights,
  'aria-label': ariaLabel = 'TokenOps AI insights',
  layout = 'wide',
  maxItems,
  headerEnd,
}: LabAiInsightsProps) {
  const compact = layout === 'compact';
  const limit = maxItems ?? (compact ? 2 : undefined);
  const observations = limit
    ? insights.observations.slice(0, limit)
    : insights.observations;
  const recommendations = limit
    ? insights.recommendations.slice(0, limit)
    : insights.recommendations;
  const hasObservations = observations.length > 0;
  const hasRecommendations = recommendations.length > 0;
  if (!hasObservations && !hasRecommendations) return null;

  return (
    <Card aria-label={ariaLabel} $compact={compact}>
      <Header $compact={compact}>
        <InlineIcon>
          <Sparkles aria-hidden />
        </InlineIcon>
        <HeaderTitle>
          {compact ? 'Insights' : 'TokenOps AI insights'}
        </HeaderTitle>
        {headerEnd ? <HeaderEnd>{headerEnd}</HeaderEnd> : null}
      </Header>
      <Columns $layout={layout}>
        {hasObservations ? (
          <Block $compact={compact}>
            {!compact ? <Label>Insights</Label> : null}
            <List $compact={compact}>
              {observations.map((item) => (
                <Item key={item} $compact={compact}>
                  {item}
                </Item>
              ))}
            </List>
          </Block>
        ) : null}
        {hasRecommendations ? (
          <Block $compact={compact}>
            <Label>{compact ? 'Try next' : 'Recommendations'}</Label>
            <List $compact={compact}>
              {recommendations.map((item) => (
                <Item key={item} $compact={compact}>
                  {item}
                </Item>
              ))}
            </List>
          </Block>
        ) : null}
      </Columns>
    </Card>
  );
}
