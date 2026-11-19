import { Dropdown } from '@cake-admin/cakeand';
import styled, { createGlobalStyle } from 'styled-components';
import {
  COST_QUALITY_OPTIONS,
  GOVERNANCE_OPTIONS,
  PII_DETECTOR_OPTIONS,
  SECURITY_PATTERN_OPTIONS,
  type CostQualityChoice,
  type GovernanceChoice,
  type PiiDetectorChoice,
  type SecurityPatternChoice,
  type TryJudgement,
} from '../../data/routingDemo';

/** Keep portalled menus above the Test a Prompt overlay (z-index 1001). */
const JudgementMenuStyles = createGlobalStyle`
  [data-radix-select-viewport],
  [role='listbox'] {
    z-index: 1100;
  }

  [role='listbox'] {
    box-sizing: border-box;
    max-width: min(90vw, 22rem);
  }

  [role='listbox'] [role='option'] {
    box-sizing: border-box;
    height: auto;
    min-height: var(--space-700);
    justify-content: flex-start;
    white-space: normal;
    overflow-wrap: anywhere;
    padding-block: var(--space-100);
    text-align: left;
  }
`;

const Strip = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-150);
  flex-shrink: 0;
  width: 100%;

  @media (max-width: 56rem) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 32rem) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  min-width: 0;

  & > * {
    max-width: 100%;
  }

  /* cake& Dropdown centers the value by default — left-align for long judgement labels. */
  & [role='combobox'] {
    align-items: center;
    justify-content: flex-start;
    text-align: left;
  }

  & [role='combobox'] > span:first-child {
    flex: 1 1 auto;
    min-width: 0;
    text-align: left;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  & [role='combobox'] > span:last-child {
    flex: 0 0 auto;
    align-self: center;
  }
`;

interface JudgementControlsProps {
  value: TryJudgement;
  onChange: (next: TryJudgement) => void;
}

export function JudgementControls({ value, onChange }: JudgementControlsProps) {
  function patch<K extends keyof TryJudgement>(key: K, next: TryJudgement[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <>
      <JudgementMenuStyles />
      <Strip aria-label="Judgement order">
        <Field>
          <Dropdown
            label="Security"
            options={[...SECURITY_PATTERN_OPTIONS]}
            value={value.securityPatterns}
            onValueChange={(next) =>
              patch('securityPatterns', next as SecurityPatternChoice)
            }
          />
        </Field>

        <Field>
          <Dropdown
            label="Governance"
            options={[...GOVERNANCE_OPTIONS]}
            value={value.governance}
            onValueChange={(next) => patch('governance', next as GovernanceChoice)}
          />
        </Field>

        <Field>
          <Dropdown
            label="Cost / quality"
            options={[...COST_QUALITY_OPTIONS]}
            value={value.costQuality}
            onValueChange={(next) =>
              patch('costQuality', next as CostQualityChoice)
            }
          />
        </Field>

        <Field>
          <Dropdown
            label="PII detector"
            options={[...PII_DETECTOR_OPTIONS]}
            value={value.piiDetector}
            onValueChange={(next) =>
              patch('piiDetector', next as PiiDetectorChoice)
            }
          />
        </Field>
      </Strip>
    </>
  );
}
