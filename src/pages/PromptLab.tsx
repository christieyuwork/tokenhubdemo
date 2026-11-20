import { useEffect, useState, type ReactNode } from 'react';
import {
  Card,
  HorizontalTabItem,
  HorizontalTabs,
  HorizontalTabsContent,
  HorizontalTabsList,
} from '@cake-admin/cakeand';
import { FlaskConical, MessageSquareText, Sparkles } from 'lucide-react';
import styled from 'styled-components';
import { LabSplash } from '../components/LabSplash';
import { LeadIcon } from '../components/LeadIcon';
import {
  applyPolicyForm,
  PolicyFormModal,
  type PolicyFormValues,
} from '../components/routing/PolicyFormModal';
import { ScenarioPlanner } from '../components/routing/ScenarioPlanner';
import { TokenOpsChallenge } from '../components/routing/TokenOpsChallenge';
import { TryRequestWorkspace } from '../components/routing/TryRequestWorkspace';
import { type PromptLabMode } from '../data/promptLabChat';
import { type PolicyId, type PromptEvaluation } from '../data/routingDemo';

/**
 * Shared height for every lab view so mode switches don't change document
 * length (no scroll jump). Tall enough that scrolling can bring the lab
 * header to the top of the report scrollport.
 */
const LAB_PANEL_MIN_HEIGHT = 'calc(100dvh - 8rem)';

const PAGE_VIEWS: Record<
  PromptLabMode,
  {
    title: string;
    description: string;
    icon: ReactNode;
  }
> = {
  test: {
    title: 'Test a Prompt',
    description:
      'Send a request through routing and see how TokenOps scores, ranks, and places it.',
    icon: <MessageSquareText aria-hidden />,
  },
  whatIf: {
    title: 'What if',
    description:
      'Define your workload, set goals, then stress model and placement against your engines.',
    icon: <FlaskConical aria-hidden />,
  },
  scenario: {
    title: 'Scenario',
    description:
      'Plan a workload in conversation — test prompts and see routing results right in the chat.',
    icon: <Sparkles aria-hidden />,
  },
};

const Lab = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-150);
  min-width: 0;
`;

const TabsRoot = styled(HorizontalTabs)`
  display: flex;
  flex-direction: column;
  gap: var(--space-150);
  min-width: 0;
`;

/*
  Same indigo→violet stops as ReportHeader — cake& Card has no gradient variant.
  Stable Prompt lab branding for the three-feature experience.
*/
const LabBanner = styled(Card)`
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  background-image: linear-gradient(8deg, rgb(21, 47, 197) 14%, rgb(160, 120, 255) 87%);
`;

const BannerInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  padding: var(--space-500) 0 0;
  min-width: 0;
`;

const BrandRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-200);
  min-width: 0;
  padding: 0 var(--space-500);
`;

const BrandMark = styled.div`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: var(--color-text-icon-inverse);
`;

const BrandCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
`;

const DemoPill = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  align-self: flex-start;
  margin-left: auto;
  padding: var(--space-075) var(--space-250);
  border-radius: var(--radius-1000);
  background: var(--color-surfaces-container);
  color: var(--color-badge-text-icon-on-blue-light);
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const BrandTitle = styled.h1`
  margin: 0;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-page);
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
`;

const BrandDescription = styled.p`
  margin: 0;
  max-width: 42rem;
  color: var(--color-text-icon-on-primary-disabled);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

/**
 * Full-width lab switcher on the gradient — no track/pill container.
 * Active = white underline + bold white type.
 */
const BannerTabs = styled(HorizontalTabsList)`
  && {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    border-bottom: var(--stroke-100) solid var(--color-stroke-border-tonal-primary);
  }

  &&::after,
  && [data-state='active']::after,
  && [role='tab']::after {
    display: none !important;
  }

  && [role='tab'] {
    justify-content: center;
    width: 100%;
    min-height: var(--space-800);
    margin: 0;
    padding: var(--space-150) var(--space-200);
    border-radius: 0;
    border-bottom: var(--stroke-200) solid transparent;
    color: var(--color-text-icon-on-primary-disabled);
    font-weight: var(--font-weight-medium);
    background: transparent;
    box-shadow: none;
  }

  && [role='tab']:hover {
    color: var(--color-text-icon-inverse);
    background: var(--color-surfaces-container-pop-windows);
  }

  && [role='tab'][data-state='active'] {
    color: var(--color-text-icon-inverse);
    font-weight: var(--font-weight-bold);
    background: transparent;
    border-bottom-color: var(--color-surfaces-container);
    box-shadow: none;
  }

  && [role='tab']:focus-visible {
    outline: var(--stroke-150) solid var(--color-text-icon-inverse);
    outline-offset: calc(var(--space-025) * -1);
  }
`;

const TabsContent = styled(HorizontalTabsContent)`
  min-width: 0;

  /*
    forceMount keeps each view mounted (no state loss), but Radix leaves
    inactive panels in the layout — hide them so height stays constant.
  */
  &[data-state='inactive'] {
    display: none;
  }
`;

/** Fills the lab frame; content can grow taller. Page scroll owns the scrollbar. */
const ChatPanel = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 0;
  min-height: ${LAB_PANEL_MIN_HEIGHT};
  overflow: visible;

  & > * {
    flex: 1 1 auto;
    min-height: ${LAB_PANEL_MIN_HEIGHT};
    height: auto;
  }
`;

/** Natural height — What if grows with content; the report page scrolls as one. */
const FlowPanel = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 0;
`;

function splashFor(
  mode: PromptLabMode,
  align: 'center' | 'start' | 'rail' = mode === 'whatIf' ? 'start' : 'center',
) {
  const view = PAGE_VIEWS[mode];
  return (
    <LabSplash
      icon={view.icon}
      title={view.title}
      description={view.description}
      align={align}
    />
  );
}

export interface PromptLabProps {
  /** Deep-link from Explore / Dashboard ads — opens Test a Prompt or What if. */
  initialMode?: PromptLabMode;
  /** Cross-app navigation from What if Act steps. */
  onNavigate?: (section: string) => void;
}

export function PromptLab({ initialMode, onNavigate }: PromptLabProps) {
  const [mode, setMode] = useState<PromptLabMode>(initialMode ?? 'test');
  const [policyId, setPolicyId] = useState<PolicyId>('brightsky-quality');
  const [formOpen, setFormOpen] = useState(false);
  const [createSeed, setCreateSeed] = useState<PolicyFormValues | null>(null);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  function handleEvaluated(result: PromptEvaluation) {
    setPolicyId(result.policyId);
  }

  function handleCreateFromTry(values: PolicyFormValues) {
    setCreateSeed(values);
    setFormOpen(true);
  }

  function handleSave(values: PolicyFormValues, id?: PolicyId) {
    if (id) {
      setPolicyId(id);
      return;
    }
    const createdId = `custom-${Date.now()}` as PolicyId;
    applyPolicyForm(values, {
      id: createdId,
      name: values.name,
      status: values.status,
      scope: values.scope,
      priorityOrder: values.priorityOrder,
      eligibleModels: [],
      eligibleHosting: [],
      securityRules: [],
      governanceRules: [],
      qualityFloor: values.qualityFloor,
      costPreference: values.costPreference,
      latencyTarget: values.latencyTarget,
      infrastructureRequirement: values.infrastructureRequirement,
      fallback: values.fallback,
      lastModified: '',
      scenarioId: 'brightsky',
      requestsRouted: '0',
      averageSavings: '—',
      averageSavingsCaption: 'Session-only prototype policy',
      defaultTestRequestId: 'routine',
    });
    setPolicyId(createdId);
  }

  return (
    <>
      <Lab>
        <TabsRoot
          value={mode}
          onValueChange={(next) => setMode(next as PromptLabMode)}
          activationMode="manual"
        >
          <LabBanner role="banner" aria-label="Prompt lab">
            <BannerInner>
              <BrandRow>
                <BrandMark>
                  <LeadIcon>
                    <Sparkles aria-hidden />
                  </LeadIcon>
                </BrandMark>
                <BrandCopy>
                  <BrandTitle>Prompt lab</BrandTitle>
                  <BrandDescription>
                    Test routing, stress economics against your goals, or plan
                    scenarios in conversation.
                  </BrandDescription>
                </BrandCopy>
                <DemoPill>Demo</DemoPill>
              </BrandRow>

              <BannerTabs aria-label="Prompt lab views" scrollButtons="never">
                <HorizontalTabItem value="test">Test a Prompt</HorizontalTabItem>
                <HorizontalTabItem value="whatIf">What if</HorizontalTabItem>
                <HorizontalTabItem value="scenario">Scenario</HorizontalTabItem>
              </BannerTabs>
            </BannerInner>
          </LabBanner>

          <TabsContent value="test" forceMount>
            <ChatPanel>
              <TryRequestWorkspace
                policyId={policyId}
                onEvaluated={handleEvaluated}
                onCreatePolicy={handleCreateFromTry}
                splash={splashFor('test')}
                brand={splashFor('test', 'rail')}
              />
            </ChatPanel>
          </TabsContent>

          <TabsContent value="whatIf" forceMount>
            <FlowPanel>
              <TokenOpsChallenge
                policyId={policyId}
                splash={splashFor('whatIf')}
                onNavigate={onNavigate}
                onCreatePolicy={handleCreateFromTry}
              />
            </FlowPanel>
          </TabsContent>

          <TabsContent value="scenario" forceMount>
            <ChatPanel>
              <ScenarioPlanner
                policyId={policyId}
                onEvaluated={handleEvaluated}
                splash={splashFor('scenario')}
                brand={splashFor('scenario', 'rail')}
              />
            </ChatPanel>
          </TabsContent>
        </TabsRoot>
      </Lab>

      <PolicyFormModal
        open={formOpen}
        mode="create"
        policy={null}
        seedValues={createSeed}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setCreateSeed(null);
        }}
        onSave={handleSave}
      />
    </>
  );
}
