import type { ReactNode } from 'react';
import { TextInput } from '@cake-admin/cakeand';
import { Search } from 'lucide-react';
import styled from 'styled-components';
import { SAMPLE_DATA_NOTE } from '../../data/tokenOpsConfig';

export const SAMPLE_CAPTION = SAMPLE_DATA_NOTE;

const SearchWrap = styled.div`
  width: min(100%, 20rem);
  min-width: 12rem;
`;

export function ConfigSearch({
  value,
  onChange,
  placeholder = 'Search',
  label = 'Search',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <SearchWrap>
      <TextInput
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        startIcon={<Search size={16} aria-hidden />}
      />
    </SearchWrap>
  );
}

export const FormStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-300);
`;

export const WizardSteps = styled.ol`
  margin: 0 0 var(--space-300);
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-150);
`;

export const WizardStep = styled.li<{ $active?: boolean; $done?: boolean }>`
  color: ${(p) =>
    p.$active
      ? 'var(--color-text-icon-primary)'
      : 'var(--color-text-icon-secondary)'};
  font-size: var(--type-size-caption);
  font-weight: ${(p) =>
    p.$active ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)'};
  line-height: 1.35;

  &::after {
    content: ${(p) => (p.$done || p.$active ? 'none' : 'none')};
  }
`;

export const WarningText = styled.p`
  margin: 0;
  color: var(--color-warning-warn);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

export const HelperMuted = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.4;
`;

export const TabBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  padding-top: var(--space-300);
`;

export function metricCaption(extra?: ReactNode) {
  if (!extra) return SAMPLE_CAPTION;
  return (
    <>
      {extra}
      <br />
      {SAMPLE_CAPTION}
    </>
  );
}
