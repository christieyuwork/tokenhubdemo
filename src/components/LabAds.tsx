import { Button, Card } from '@cake-admin/cakeand';
import { FlaskConical, Sparkles, SquareArrowOutUpRight } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { InlineIcon } from './LeadIcon';

export interface LabAdsProps {
  onWhatIf?: () => void;
  onTestPrompt?: () => void;
  onExploreScenario?: () => void;
}

const sheen = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

/*
  Flashy Explore banner — indigo→violet sheen under white type.
  Stops match ReportHeader / PulsePromo (not cake& Card variants).
*/
const ExploreBanner = styled(Card)`
  box-sizing: border-box;
  overflow: hidden;
  background-image: linear-gradient(
    118deg,
    rgb(4, 27, 149) 0%,
    rgb(21, 47, 197) 28%,
    rgb(57, 78, 219) 55%,
    rgb(160, 120, 255) 100%
  );
  background-size: 160% 160%;
  animation: ${sheen} 10s ease-in-out infinite;
  box-shadow: var(--elevation-2);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-size: 100% 100%;
  }
`;

const ExploreInner = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-500);
  padding: var(--space-500) var(--space-600);

  @container (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-500);
  }
`;

const ExploreCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-200);
  min-width: 0;
`;

const ExploreEyebrow = styled.p`
  display: flex;
  align-items: center;
  gap: var(--space-100);
  margin: 0;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const ExploreTitle = styled.h2`
  margin: 0;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-title);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const ExploreBody = styled.p`
  margin: 0;
  max-width: 40rem;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  opacity: 0.92;
`;

const ExploreActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex: 0 0 auto;
  gap: var(--space-200);
  align-items: center;
`;

/** Inverse CTA on the gradient — white fill, primary text. */
const InverseButton = styled(Button)`
  && {
    background: var(--color-surfaces-container);
    color: var(--color-primary-primary);
    box-shadow: var(--elevation-1);
  }

  &&:hover {
    background: var(--color-surfaces-on-container-high);
  }
`;

/*
  Outline CTA on the gradient. cake& outline uses inset box-shadow for the
  stroke (not border-color), so override that for a white ring.
*/
const OutlineOnPrimary = styled(Button)`
  && {
    background: transparent;
    color: var(--color-surfaces-container);
    box-shadow: inset 0 0 0 var(--stroke-200) var(--color-surfaces-container);
  }

  &&:hover:not(:disabled) {
    background: var(--color-primary-primary-overlay);
    color: var(--color-surfaces-container);
    box-shadow: inset 0 0 0 var(--stroke-200) var(--color-surfaces-container);
  }

  && svg {
    color: inherit;
  }
`;

/** Full-width gradient CTA for Explore / Optimization, below the metrics row. */
export function ExploreLabBanner({
  onTestPrompt,
  onExploreScenario,
}: Pick<LabAdsProps, 'onTestPrompt' | 'onExploreScenario'>) {
  return (
    <ExploreBanner role="region" aria-label="Prompt lab">
      <ExploreInner>
        <ExploreCopy>
          <ExploreEyebrow>
            <InlineIcon>
              <Sparkles aria-hidden />
            </InlineIcon>
            Prompt lab
          </ExploreEyebrow>
          <ExploreTitle>Stress-test routing before it hits production</ExploreTitle>
          <ExploreBody>
            Test a live prompt on the routing map, or explore a scenario to plan volume,
            model, and placement before changes hit production.
          </ExploreBody>
        </ExploreCopy>
        <ExploreActions>
          <OutlineOnPrimary
            type="button"
            size="sm"
            intent="secondary"
            variant="outline"
            endIcon={<FlaskConical size={16} aria-hidden />}
            onClick={onExploreScenario}
          >
            Explore a scenario
          </OutlineOnPrimary>
          <InverseButton
            type="button"
            size="sm"
            endIcon={<Sparkles size={16} aria-hidden />}
            onClick={onTestPrompt}
          >
            Test a Prompt
          </InverseButton>
        </ExploreActions>
      </ExploreInner>
    </ExploreBanner>
  );
}

const DashboardStrip = styled.div`
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-200);
  width: 100%;
  min-width: 0;

  @container dashboard (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const QuietCard = styled(Card)`
  box-sizing: border-box;
  min-width: 0;
  border: var(--stroke-100) solid var(--color-stroke-border);
  background: var(--color-surfaces-container);
`;

const QuietInner = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-300);
  padding: var(--space-300) var(--space-400);
  min-width: 0;
`;

const QuietCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;
`;

const QuietEyebrow = styled.p`
  display: flex;
  align-items: center;
  gap: var(--space-100);
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.3;
`;

const QuietTitle = styled.p`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const QuietCaption = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

/** Quiet dual-tile strip for Dashboard — same destinations, lower visual weight. */
export function DashboardLabStrip({ onWhatIf, onTestPrompt }: LabAdsProps) {
  return (
    <DashboardStrip role="region" aria-label="Labs and playgrounds">
      <QuietCard>
        <QuietInner>
          <QuietCopy>
            <QuietEyebrow>
              <InlineIcon>
                <FlaskConical aria-hidden />
              </InlineIcon>
              Lab
            </QuietEyebrow>
            <QuietTitle>What if</QuietTitle>
            <QuietCaption>
              Set your own goals, then stress volume, model, and placement.
            </QuietCaption>
          </QuietCopy>
          <Button
            type="button"
            size="sm"
            endIcon={<SquareArrowOutUpRight size={16} aria-hidden />}
            onClick={onWhatIf}
          >
            Open
          </Button>
        </QuietInner>
      </QuietCard>
      <QuietCard>
        <QuietInner>
          <QuietCopy>
            <QuietEyebrow>
              <InlineIcon>
                <Sparkles aria-hidden />
              </InlineIcon>
              Playground
            </QuietEyebrow>
            <QuietTitle>Test a Prompt</QuietTitle>
            <QuietCaption>See how a request is scored and routed in real time.</QuietCaption>
          </QuietCopy>
          <Button
            type="button"
            size="sm"
            endIcon={<SquareArrowOutUpRight size={16} aria-hidden />}
            onClick={onTestPrompt}
          >
            Open
          </Button>
        </QuietInner>
      </QuietCard>
    </DashboardStrip>
  );
}
