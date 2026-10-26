import type { ReactNode } from 'react';
import { Card, ContentSwitcher, Scrollbar } from '@cake-admin/cakeand';
import styled from 'styled-components';

export interface ReportSectionOption {
  value: string;
  label: string;
}

interface ReportPageProps {
  sections: ReportSectionOption[];
  section: string;
  onSectionChange: (value: string) => void;
  children?: ReactNode;
}

const PageScroll = styled(Scrollbar)`
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
`;

const SwitcherRow = styled.div`
  display: flex;
  justify-content: center;
  padding: var(--space-500) var(--space-800) 0;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  padding: var(--space-500) var(--space-800) var(--space-800);
`;

const HeaderCard = styled(Card)`
  /*
    The frame paints this card with an indigo-to-violet gradient.
    cake& Card has no gradient variant, and these stops are not tokens.
  */
  background-image: linear-gradient(8deg, rgb(21, 47, 197) 14%, rgb(160, 120, 255) 87%);

  label {
    color: var(--color-text-icon-on-primary);
  }
`;

const HeaderInner = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-500);
  padding: var(--space-500);
`;

const Titles = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
`;

const Title = styled.h1`
  margin: 0;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-page);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const Description = styled.p`
  margin: 0;
  color: var(--color-text-icon-on-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

const Filters = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: flex-end;
  gap: var(--space-200);

  /*
    The frame's date trigger is 242px and each dropdown trigger is 82px.
    Neither width is a spacing token, and the dropdown root otherwise stretches.
  */
  & > :first-child {
    width: 242px;
  }

  & > :not(:first-child) {
    width: 82px;
  }
`;

export const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-300);
`;

const MetricInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-100);
  padding: var(--space-500);
`;

const MetricLabel = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const MetricValue = styled.p`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const MetricCaption = styled.p`
  margin: var(--space-100) 0 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const SectionInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  padding: var(--space-500);
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

export function ReportPage({ sections, section, onSectionChange, children }: ReportPageProps) {
  return (
    <PageScroll>
      <SwitcherRow>
        <ContentSwitcher
          aria-label="Cost views"
          size="md"
          intent="primary"
          options={sections}
          value={section}
          onValueChange={onSectionChange}
        />
      </SwitcherRow>
      {children ? <Content>{children}</Content> : null}
    </PageScroll>
  );
}

interface ReportHeaderProps {
  title: string;
  description: string;
  filters?: ReactNode;
}

export function ReportHeader({ title, description, filters }: ReportHeaderProps) {
  return (
    <HeaderCard>
      <HeaderInner>
        <Titles>
          <Title>{title}</Title>
          <Description>{description}</Description>
        </Titles>
        {filters ? <Filters>{filters}</Filters> : null}
      </HeaderInner>
    </HeaderCard>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  caption: string;
}

export function MetricCard({ label, value, caption }: MetricCardProps) {
  return (
    <Card>
      <MetricInner>
        <MetricLabel>{label}</MetricLabel>
        <MetricValue>{value}</MetricValue>
        <MetricCaption>{caption}</MetricCaption>
      </MetricInner>
    </Card>
  );
}

interface ReportPanelProps {
  title: string;
  children: ReactNode;
}

export function ReportPanel({ title, children }: ReportPanelProps) {
  return (
    <Card>
      <SectionInner>
        <SectionTitle>{title}</SectionTitle>
        {children}
      </SectionInner>
    </Card>
  );
}
