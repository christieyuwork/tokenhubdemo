import type { ReactNode } from 'react';
import { Button, Card, Scrollbar } from '@cake-admin/cakeand';
import {
  ArrowRight,
  Bell,
  CircleDollarSign,
  Compass,
  Cpu,
  FileSpreadsheet,
  GitBranch,
  KeyRound,
  Layers,
  Link2,
  MemoryStick,
  Plug,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  TrendingUp,
  Zap,
} from 'lucide-react';
import styled from 'styled-components';
import { ExploreLabBanner } from '../components/LabAds';
import { PRIMARY_POLICY_NAME, PRIMARY_ROUTING_SCENARIO } from '../data/scenarioEconomics';

export type CategoryId =
  | 'cost'
  | 'optimization'
  | 'operations'
  | 'alerts'
  | 'administration';

export interface CategoryLandingProps {
  category: CategoryId;
  onNavigate?: (section: string) => void;
}

interface MetricDef {
  id: string;
  icon: ReactNode;
  label: string;
  value: string;
  caption: ReactNode;
}

interface FeatureDef {
  id: string;
  title: string;
  body: string;
  icon: ReactNode;
  cta: string;
}

interface SpotlightDef {
  title: string;
  body: string;
  ctaLabel: string;
  ctaTarget: string;
}

interface CategoryDef {
  id: CategoryId;
  title: string;
  subtitle: string;
  primaryCta: { label: string; target: string };
  metrics: MetricDef[];
  features: FeatureDef[];
  spotlight: SpotlightDef;
}

const ChangePositive = styled.span`
  color: var(--color-success-success);
`;

const CATEGORIES: Record<CategoryId, CategoryDef> = {
  cost: {
    id: 'cost',
    title: 'Cost',
    subtitle: 'See which workloads, models, and teams drive token spend.',
    primaryCta: { label: 'Cost by model', target: 'cost-by-model' },
    metrics: [
      {
        id: 'under-management',
        icon: <CircleDollarSign aria-hidden />,
        label: 'AI Spend Under Management',
        value: '$1.15M',
        caption: (
          <>
            <ChangePositive>↓ 18%</ChangePositive>
            <span>vs. last month</span>
          </>
        ),
      },
      {
        id: 'spend-month',
        icon: <CircleDollarSign aria-hidden />,
        label: 'Spend this month',
        value: '$1.15M',
        caption: 'Quality inspection · Super agent · Claims · Coding',
      },
      {
        id: 'cost-per-chat',
        icon: <SlidersHorizontal aria-hidden />,
        label: 'Cost / chat',
        value: '$0.24',
        caption: 'Starting · down to $0.06 optimized',
      },
      {
        id: 'unreconciled',
        icon: <FileSpreadsheet aria-hidden />,
        label: 'Unreconciled invoices',
        value: '3',
        caption: '$48.2K variance',
      },
    ],
    features: [
      {
        id: 'cost-by-model',
        title: 'Cost by model',
        body: 'Compare spend, share, and unit cost across every model in your fleet.',
        icon: <CircleDollarSign aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'cost-by-trace',
        title: 'Cost by trace',
        body: 'Attribute tokens and dollars to workflows, agents, and business outcomes.',
        icon: <Layers aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'invoice-reconciliation',
        title: 'Invoice reconciliation',
        body: 'Match provider invoices to observed usage and surface variances early.',
        icon: <FileSpreadsheet aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'pricing-and-rates',
        title: 'Pricing and rates',
        body: 'Keep published rates, negotiated discounts, and self-host costs aligned.',
        icon: <TrendingUp aria-hidden />,
        cta: 'Open',
      },
    ],
    spotlight: {
      title: 'Inspect token economics',
      body: 'Quality inspection, Super agent, Claims, and Coding — cloud tokens plus owned infrastructure.',
      ctaLabel: 'Cost by trace',
      ctaTarget: 'cost-by-trace',
    },
  },
  optimization: {
    id: 'optimization',
    title: 'Optimization',
    subtitle: 'Use the right model at quality, cut waste, and run on the right infrastructure.',
    primaryCta: { label: 'Intelligent routing', target: 'intelligent-routing' },
    metrics: [
      {
        id: 'impact',
        icon: <SlidersHorizontal aria-hidden />,
        label: 'Optimization Impact',
        value: '59%',
        caption: (
          <>
            <ChangePositive>↑ 12 pp</ChangePositive>
            <span>vs. last month</span>
          </>
        ),
      },
      {
        id: 'savings',
        icon: <CircleDollarSign aria-hidden />,
        label: 'Estimated Savings',
        value: '$675K',
        caption: (
          <>
            <ChangePositive>↑ 67%</ChangePositive>
            <span>vs. last month</span>
          </>
        ),
      },
      {
        id: 'cache-hit',
        icon: <RefreshCw aria-hidden />,
        label: 'Cache hit rate',
        value: '62%',
        caption: 'Repeated inspection prompts',
      },
      {
        id: 'routed',
        icon: <GitBranch aria-hidden />,
        label: 'Routed requests',
        value: '1.0M',
        caption: PRIMARY_ROUTING_SCENARIO,
      },
    ],
    features: [
      {
        id: 'intelligent-routing',
        title: 'Intelligent routing',
        body: 'Monitor policy health, manage routing policies on the same page, and Test a Prompt.',
        icon: <GitBranch aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'prompt-lab',
        title: 'Prompt lab',
        body: 'Test a Prompt on the routing map, explore What if economics, or plan scenarios in chat.',
        icon: <GitBranch aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'routing-decisions',
        title: 'Routing decisions',
        body: 'Search and filter past decisions, inspect routing trees, and browse the historical catalog.',
        icon: <GitBranch aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'model-analyzer',
        title: 'Model analyzer',
        body: 'Compare cost of keeping quality while stepping off the highest-priced starting route.',
        icon: <TrendingUp aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'caching',
        title: 'Caching',
        body: 'Reuse repeated inspection prompts to cut waste without changing quality outcomes.',
        icon: <RefreshCw aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'energy',
        title: 'Energy',
        body: 'Track power draw on owned H100 / H200 capacity alongside token spend.',
        icon: <Zap aria-hidden />,
        cta: 'Open',
      },
    ],
    spotlight: {
      title: PRIMARY_POLICY_NAME,
      body: 'Cost, quality, and latency set priorities. Security and residency remain hard constraints.',
      ctaLabel: 'Intelligent routing',
      ctaTarget: 'intelligent-routing',
    },
  },
  operations: {
    id: 'operations',
    title: 'Operations',
    subtitle: 'Run models, GPUs, and deployments for production workloads.',
    primaryCta: { label: 'GPU fleet', target: 'gpu-fleet' },
    metrics: [
      {
        id: 'efficiency',
        icon: <MemoryStick aria-hidden />,
        label: 'GPU Fleet Efficiency',
        value: '75%',
        caption: (
          <>
            <ChangePositive>↑ 14 pp</ChangePositive>
            <span>vs. last month</span>
          </>
        ),
      },
      {
        id: 'idle',
        icon: <Layers aria-hidden />,
        label: 'Idle GPU hours',
        value: '1,478',
        caption: '8 GPUs · 264 hours each',
      },
      {
        id: 'deployments',
        icon: <Cpu aria-hidden />,
        label: 'Active deployments',
        value: '24',
        caption: 'Across 3 regions',
      },
      {
        id: 'registry',
        icon: <Compass aria-hidden />,
        label: 'Models registered',
        value: '48',
        caption: '12 updated this week',
      },
    ],
    features: [
      {
        id: 'model-registry',
        title: 'Model registry',
        body: 'Catalog every model, version, and capability your organization can call.',
        icon: <Compass aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'model-deployments',
        title: 'Model deployments',
        body: 'See what is live, where it runs, and how capacity is allocated.',
        icon: <Cpu aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'gpu-fleet',
        title: 'GPU fleet',
        body: 'Monitor utilization, idle time, and health across your accelerator estate.',
        icon: <MemoryStick aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'gpu-registry',
        title: 'GPU registry',
        body: 'Inventory hardware, regions, and ownership so capacity stays accountable.',
        icon: <Layers aria-hidden />,
        cta: 'Open',
      },
    ],
    spotlight: {
      title: 'Operate the fleet',
      body: 'Monitor models, infrastructure, and capacity without leaving TokenOps Center.',
      ctaLabel: 'Model registry',
      ctaTarget: 'model-registry',
    },
  },
  alerts: {
    id: 'alerts',
    title: 'Alerts',
    subtitle: 'Catch spend spikes and capacity risk before they hit the business.',
    primaryCta: { label: 'Alert list', target: 'alert-list' },
    metrics: [
      {
        id: 'triggered',
        icon: <Bell aria-hidden />,
        label: 'Alerts triggered',
        value: '4',
        caption: '1 still open',
      },
      {
        id: 'open',
        icon: <Bell aria-hidden />,
        label: 'Open alerts',
        value: '1',
        caption: 'Spend spike · Claude Sonnet 4.6',
      },
      {
        id: 'rules',
        icon: <Shield aria-hidden />,
        label: 'Rules active',
        value: '12',
        caption: '3 updated this week',
      },
      {
        id: 'forecast',
        icon: <TrendingUp aria-hidden />,
        label: 'Forecast accuracy',
        value: '94%',
        caption: 'Trailing 30 days',
      },
    ],
    features: [
      {
        id: 'alert-list',
        title: 'Alerts',
        body: 'Triage open incidents, acknowledge owners, and track resolution status.',
        icon: <Bell aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'alert-rules',
        title: 'Alert rules',
        body: 'Define thresholds for spend, latency, capacity, and routing anomalies.',
        icon: <Shield aria-hidden />,
        cta: 'Open',
      },
    ],
    spotlight: {
      title: 'Act on signal',
      body: 'Forecast costs and capacity so alerts fire on risk — not noise.',
      ctaLabel: 'Alert rules',
      ctaTarget: 'alert-rules',
    },
  },
  administration: {
    id: 'administration',
    title: 'Administration',
    subtitle: 'Connect providers, manage keys, and enforce quotas across TokenOps Center.',
    primaryCta: { label: 'Connections', target: 'connections' },
    metrics: [
      {
        id: 'connections',
        icon: <Plug aria-hidden />,
        label: 'Connections',
        value: '4',
        caption: '3 healthy · 1 needs attention',
      },
      {
        id: 'keys',
        icon: <KeyRound aria-hidden />,
        label: 'Access keys',
        value: '4',
        caption: '1 expiring soon · 1 revoked',
      },
      {
        id: 'quotas',
        icon: <Link2 aria-hidden />,
        label: 'Quotas enforced',
        value: '6',
        caption: '2 near limit · 1 exceeded',
      },
      {
        id: 'sync',
        icon: <RefreshCw aria-hidden />,
        label: 'Last sync',
        value: '4m',
        caption: 'Brightsky Airlines · sample data',
      },
    ],
    features: [
      {
        id: 'connections',
        title: 'Connections',
        body: 'Link cloud providers, self-hosted endpoints, and billing sources.',
        icon: <Plug aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'access-keys',
        title: 'Access keys',
        body: 'Issue, rotate, and revoke keys used by apps and automation.',
        icon: <KeyRound aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'quotas',
        title: 'Quotas',
        body: 'Cap spend and throughput by org, team, or workload before overruns.',
        icon: <Link2 aria-hidden />,
        cta: 'Open',
      },
    ],
    spotlight: {
      title: 'Govern access',
      body: 'Keep connections, credentials, and limits aligned across teams.',
      ctaLabel: 'Access keys',
      ctaTarget: 'access-keys',
    },
  },
};

const PageScroll = styled(Scrollbar)`
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
`;

const Page = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  padding: var(--space-400) var(--space-600) var(--space-600);
  container-type: inline-size;
  container-name: category;

  @media (max-width: 900px) {
    padding: var(--space-400);
  }
`;

const HeaderCard = styled(Card)`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  background-image: linear-gradient(8deg, rgb(21, 47, 197) 14%, rgb(160, 120, 255) 87%);
`;

const HeaderInner = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-400);
  padding: var(--space-500);
  min-width: 0;

  @container category (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-page);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const HeaderSubtitle = styled.p`
  margin: 0;
  max-width: 40rem;
  color: var(--color-text-icon-on-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

const HeaderActions = styled.div`
  flex: 0 0 auto;
`;

const MetricGrid = styled.div`
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-200);
  width: 100%;
  min-width: 0;

  @container category (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @container category (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const MetricCard = styled(Card)`
  min-width: 0;
`;

const MetricInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-050);
  padding: var(--space-300) var(--space-400);
`;

const MetricIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--color-text-icon-secondary);

  svg {
    width: 24px;
    height: 24px;
  }
`;

const MetricLabel = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
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

const MetricCaption = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-100);
  align-items: center;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

const SectionCard = styled(Card)`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
`;

const SectionInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  padding: var(--space-400);
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const ActionList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  border: var(--stroke-100) solid var(--color-stroke-border);
  border-radius: var(--radius-200);
  overflow: hidden;
`;

const ActionRow = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-300);
  align-items: center;
  padding: var(--space-300) var(--space-400);
  border-bottom: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-container);

  &:last-child {
    border-bottom: none;
  }

  @container category (max-width: 640px) {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
  }
`;

const ActionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-700);
  height: var(--space-700);
  border-radius: var(--radius-100);
  background: var(--color-surfaces-canvas);
  color: var(--color-text-icon-primary);

  svg {
    width: 24px;
    height: 24px;
  }
`;

const ActionCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-025);
  min-width: 0;
`;

const ActionTitle = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const ActionBody = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

const ActionCta = styled.div`
  flex: 0 0 auto;

  @container category (max-width: 640px) {
    grid-column: 2;
  }
`;

const Callout = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-400);
  padding: var(--space-400);
  border: var(--stroke-100) solid var(--color-stroke-border);
  border-radius: var(--radius-200);
  background: var(--color-surfaces-canvas);

  @container category (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const CalloutCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-050);
  min-width: 0;
`;

const CalloutTitle = styled.h2`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const CalloutBody = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

export function isCategoryLanding(section: string): section is CategoryId {
  return section in CATEGORIES;
}

export function CategoryLanding({ category, onNavigate }: CategoryLandingProps) {
  const def = CATEGORIES[category];
  const go = (section: string) => () => onNavigate?.(section);

  return (
    <PageScroll>
      <Page>
        <HeaderCard role="region" aria-label={`${def.title} overview`}>
          <HeaderInner>
            <HeaderCopy>
              <HeaderTitle>{def.title}</HeaderTitle>
              <HeaderSubtitle>{def.subtitle}</HeaderSubtitle>
            </HeaderCopy>
            <HeaderActions>
              <Button
                size="md"
                intent="secondary"
                endIcon={<ArrowRight aria-hidden />}
                onClick={go(def.primaryCta.target)}
              >
                {def.primaryCta.label}
              </Button>
            </HeaderActions>
          </HeaderInner>
        </HeaderCard>

        <MetricGrid role="region" aria-label={`${def.title} metrics`}>
          {def.metrics.map((metric) => (
            <MetricCard key={metric.id}>
              <MetricInner>
                <MetricIcon>{metric.icon}</MetricIcon>
                <MetricLabel>{metric.label}</MetricLabel>
                <MetricValue>{metric.value}</MetricValue>
                <MetricCaption>
                  {typeof metric.caption === 'string' ? metric.caption : metric.caption}
                </MetricCaption>
              </MetricInner>
            </MetricCard>
          ))}
        </MetricGrid>

        {category === 'optimization' ? (
          <ExploreLabBanner
            onTestPrompt={go('test-prompt')}
            onExploreScenario={go('explore-scenario')}
          />
        ) : null}

        <SectionCard role="region" aria-label={`${def.title} views`}>
          <SectionInner>
            <SectionTitle>Views</SectionTitle>
            <ActionList>
              {def.features.map((feature) => (
                <ActionRow key={feature.id}>
                  <ActionIcon aria-hidden>{feature.icon}</ActionIcon>
                  <ActionCopy>
                    <ActionTitle>{feature.title}</ActionTitle>
                    <ActionBody>{feature.body}</ActionBody>
                  </ActionCopy>
                  <ActionCta>
                    <Button
                      size="sm"
                      endIcon={<SquareArrowOutUpRight aria-hidden />}
                      onClick={go(feature.id)}
                    >
                      {feature.cta}
                    </Button>
                  </ActionCta>
                </ActionRow>
              ))}
            </ActionList>
          </SectionInner>
        </SectionCard>

        <Callout role="region" aria-label={def.spotlight.title}>
          <CalloutCopy>
            <CalloutTitle>{def.spotlight.title}</CalloutTitle>
            <CalloutBody>{def.spotlight.body}</CalloutBody>
          </CalloutCopy>
          <Button
            size="sm"
            intent="primary"
            variant="fill"
            endIcon={<SquareArrowOutUpRight aria-hidden />}
            onClick={go(def.spotlight.ctaTarget)}
          >
            {def.spotlight.ctaLabel}
          </Button>
        </Callout>
      </Page>
    </PageScroll>
  );
}
