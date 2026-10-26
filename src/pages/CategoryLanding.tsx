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
import accessKeysImg from '../assets/landing/access-keys.jpg';
import administrationHeroImg from '../assets/landing/administration-hero.jpg';
import alertListImg from '../assets/landing/alert-list.jpg';
import alertRulesImg from '../assets/landing/alert-rules.jpg';
import alertsHeroImg from '../assets/landing/alerts-hero.jpg';
import cachingImg from '../assets/landing/caching.jpg';
import connectionsImg from '../assets/landing/connections.jpg';
import costByModelImg from '../assets/landing/cost-by-model.jpg';
import costByTraceImg from '../assets/landing/cost-by-trace.jpg';
import costHeroImg from '../assets/landing/cost-hero.jpg';
import energyImg from '../assets/landing/energy.jpg';
import gpuFleetImg from '../assets/landing/gpu-fleet.jpg';
import gpuRegistryImg from '../assets/landing/gpu-registry.jpg';
import intelligentRoutingImg from '../assets/landing/intelligent-routing.jpg';
import invoiceReconciliationImg from '../assets/landing/invoice-reconciliation.jpg';
import modelAnalyzerImg from '../assets/landing/model-analyzer.jpg';
import modelDeploymentsImg from '../assets/landing/model-deployments.jpg';
import modelRegistryImg from '../assets/landing/model-registry.jpg';
import operationsHeroImg from '../assets/landing/operations-hero.jpg';
import optimizationHeroImg from '../assets/landing/optimization-hero.jpg';
import pricingAndRatesImg from '../assets/landing/pricing-and-rates.jpg';
import quotasImg from '../assets/landing/quotas.jpg';
import routingRulesImg from '../assets/landing/routing-rules.jpg';

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
  media: string;
  icon: ReactNode;
  cta: string;
}

interface SpotlightDef {
  title: string;
  body: string;
  media: string;
  ctaLabel: string;
  ctaTarget: string;
}

interface CategoryDef {
  id: CategoryId;
  title: string;
  subtitle: string;
  heroImage: string;
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
    subtitle: 'Understand the true cost of every model, trace, and invoice.',
    heroImage: costHeroImg,
    primaryCta: { label: 'Cost by model', target: 'cost-by-model' },
    metrics: [
      {
        id: 'under-management',
        icon: <CircleDollarSign aria-hidden />,
        label: 'AI Spend Under Management',
        value: '$12.4M',
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
        value: '$394,000',
        caption: 'Aug 1–11 · all models',
      },
      {
        id: 'cost-per-million',
        icon: <SlidersHorizontal aria-hidden />,
        label: 'Cost per 1M tokens',
        value: '$9.91',
        caption: '39.8B tokens',
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
        media: costByModelImg,
        icon: <CircleDollarSign aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'cost-by-trace',
        title: 'Cost by trace',
        body: 'Attribute tokens and dollars to workflows, agents, and business outcomes.',
        media: costByTraceImg,
        icon: <Layers aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'invoice-reconciliation',
        title: 'Invoice reconciliation',
        body: 'Match provider invoices to observed usage and surface variances early.',
        media: invoiceReconciliationImg,
        icon: <FileSpreadsheet aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'pricing-and-rates',
        title: 'Pricing and rates',
        body: 'Keep published rates, negotiated discounts, and self-host costs aligned.',
        media: pricingAndRatesImg,
        icon: <TrendingUp aria-hidden />,
        cta: 'Open',
      },
    ],
    spotlight: {
      title: 'AI Economics in Motion',
      body: 'Turn every request into measurable spend insight — across providers, models, and traces.',
      media: costHeroImg,
      ctaLabel: 'Cost by trace',
      ctaTarget: 'cost-by-trace',
    },
  },
  optimization: {
    id: 'optimization',
    title: 'Optimization',
    subtitle: 'Route, cache, and right-size every request for cost and performance.',
    heroImage: optimizationHeroImg,
    primaryCta: { label: 'Intelligent routing', target: 'intelligent-routing' },
    metrics: [
      {
        id: 'impact',
        icon: <SlidersHorizontal aria-hidden />,
        label: 'Optimization Impact',
        value: '36%',
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
        value: '$2.8M',
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
        caption: 'Prompt + semantic cache',
      },
      {
        id: 'routed',
        icon: <GitBranch aria-hidden />,
        label: 'Routed requests',
        value: '1.2B',
        caption: 'Month to date',
      },
    ],
    features: [
      {
        id: 'intelligent-routing',
        title: 'Intelligent routing',
        body: 'Automatically select the best model, provider, and infrastructure per request.',
        media: intelligentRoutingImg,
        icon: <GitBranch aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'routing-rules',
        title: 'Routing rules',
        body: 'Define intent, latency, and cost policies that steer traffic across your fleet.',
        media: routingRulesImg,
        icon: <SlidersHorizontal aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'model-analyzer',
        title: 'Model analyzer',
        body: 'Score quality, cost, and latency tradeoffs before you change the default path.',
        media: modelAnalyzerImg,
        icon: <TrendingUp aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'caching',
        title: 'Caching',
        body: 'Reuse prompts and embeddings to cut spend without changing the experience.',
        media: cachingImg,
        icon: <RefreshCw aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'energy',
        title: 'Energy',
        body: 'Track power draw and carbon alongside tokens so efficiency stays visible.',
        media: energyImg,
        icon: <Zap aria-hidden />,
        cta: 'Open',
      },
    ],
    spotlight: {
      title: 'Orchestrate for savings',
      body: 'TokenHub picks the right combination of model, provider, and infrastructure for every workload.',
      media: optimizationHeroImg,
      ctaLabel: 'Routing rules',
      ctaTarget: 'routing-rules',
    },
  },
  operations: {
    id: 'operations',
    title: 'Operations',
    subtitle: 'Run models, GPUs, and deployments from a single command center.',
    heroImage: operationsHeroImg,
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
        media: modelRegistryImg,
        icon: <Compass aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'model-deployments',
        title: 'Model deployments',
        body: 'See what is live, where it runs, and how capacity is allocated.',
        media: modelDeploymentsImg,
        icon: <Cpu aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'gpu-fleet',
        title: 'GPU fleet',
        body: 'Monitor utilization, idle time, and health across your accelerator estate.',
        media: gpuFleetImg,
        icon: <MemoryStick aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'gpu-registry',
        title: 'GPU registry',
        body: 'Inventory hardware, regions, and ownership so capacity stays accountable.',
        media: gpuRegistryImg,
        icon: <Layers aria-hidden />,
        cta: 'Open',
      },
    ],
    spotlight: {
      title: 'Operate with confidence',
      body: 'Monitor AI systems, infrastructure, and workloads without leaving TokenHub.',
      media: operationsHeroImg,
      ctaLabel: 'Model registry',
      ctaTarget: 'model-registry',
    },
  },
  alerts: {
    id: 'alerts',
    title: 'Alerts',
    subtitle: 'Forecast risk, catch spend spikes, and act before they hit the business.',
    heroImage: alertsHeroImg,
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
        caption: 'Spend spike · Frontier-L',
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
        media: alertListImg,
        icon: <Bell aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'alert-rules',
        title: 'Alert rules',
        body: 'Define thresholds for spend, latency, capacity, and routing anomalies.',
        media: alertRulesImg,
        icon: <Shield aria-hidden />,
        cta: 'Open',
      },
    ],
    spotlight: {
      title: 'Predict before impact',
      body: 'Forecast costs, capacity needs, and demand so alerts fire on signal — not noise.',
      media: alertsHeroImg,
      ctaLabel: 'Alert rules',
      ctaTarget: 'alert-rules',
    },
  },
  administration: {
    id: 'administration',
    title: 'Administration',
    subtitle: 'Connect providers, manage keys, and enforce quotas across TokenHub.',
    heroImage: administrationHeroImg,
    primaryCta: { label: 'Connections', target: 'connections' },
    metrics: [
      {
        id: 'connections',
        icon: <Plug aria-hidden />,
        label: 'Connections',
        value: '8',
        caption: 'All healthy',
      },
      {
        id: 'keys',
        icon: <KeyRound aria-hidden />,
        label: 'Access keys',
        value: '14',
        caption: '2 expiring soon',
      },
      {
        id: 'quotas',
        icon: <Link2 aria-hidden />,
        label: 'Quotas enforced',
        value: '6',
        caption: 'Org + team scopes',
      },
      {
        id: 'sync',
        icon: <RefreshCw aria-hidden />,
        label: 'Last sync',
        value: '2m',
        caption: 'Providers + rates',
      },
    ],
    features: [
      {
        id: 'connections',
        title: 'Connections',
        body: 'Link cloud providers, self-hosted endpoints, and billing sources.',
        media: connectionsImg,
        icon: <Plug aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'access-keys',
        title: 'Access keys',
        body: 'Issue, rotate, and revoke keys used by apps and automation.',
        media: accessKeysImg,
        icon: <KeyRound aria-hidden />,
        cta: 'Open',
      },
      {
        id: 'quotas',
        title: 'Quotas',
        body: 'Cap spend and throughput by org, team, or workload before overruns.',
        media: quotasImg,
        icon: <Link2 aria-hidden />,
        cta: 'Open',
      },
    ],
    spotlight: {
      title: 'Govern the platform',
      body: 'Keep connections, credentials, and limits aligned so every team can build safely.',
      media: administrationHeroImg,
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
  gap: var(--space-300);
  padding: var(--space-500) var(--space-800) var(--space-800);
  container-type: inline-size;
  container-name: category;

  @media (max-width: 900px) {
    padding: var(--space-500);
  }
`;

const OverviewCard = styled(Card)`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Hero = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-500);
  min-height: 200px;
  padding: var(--space-500);
  overflow: hidden;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-end;
    gap: var(--space-400);
  }
`;

const HeroImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
`;

const HeroScrim = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  /*
    Matches Dashboard hero: primary → translucent indigo → clear.
    Stops match Figma; not available as tokens.
  */
  background-image: linear-gradient(
    90deg,
    rgb(48, 73, 235) 0%,
    rgba(48, 73, 235, 0.9) 29.567%,
    rgba(0, 26, 152, 0.8) 59.135%,
    rgba(0, 0, 0, 0) 100%
  );
`;

const HeroCopy = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  justify-content: flex-end;
  min-width: 0;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: var(--color-text-icon-inverse);
  font-size: var(--type-size-hero);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
  letter-spacing: -0.6px;
`;

const HeroSubtitle = styled.p`
  margin: 0;
  max-width: 36rem;
  color: var(--color-text-icon-inverse);
  font-size: var(--type-size-title);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  letter-spacing: 0.4px;
`;

const HeroActions = styled.div`
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
`;

const MetricsBand = styled.div`
  box-sizing: border-box;
  /*
    Generous bottom inset so KPI card shadows clear the OverviewCard
    clip edge (cake& Card overflows hidden for media bleed).
  */
  padding: var(--space-500) 0 var(--space-700);
`;

const MetricsScroller = styled.div`
  display: flex;
  gap: var(--space-300);
  /*
    Vertical padding keeps elevation-2 inside the scrollport.
    overflow-x:auto makes overflow-y compute to auto, which otherwise
    clips shadows flush against the card edge.
  */
  padding: var(--space-300) var(--space-500) var(--space-400);
  overflow-x: auto;
  scrollbar-width: thin;

  @media (max-width: 720px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow-x: visible;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled(Card)`
  flex: 0 0 200px;
  min-width: 200px;
  border-radius: var(--radius-300);
  box-shadow: var(--elevation-2);

  @media (max-width: 720px) {
    flex: 1 1 auto;
    min-width: 0;
  }
`;

const MetricInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  height: 100%;
  padding: var(--space-500);
`;

const MetricTop = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-height: 0;
`;

const MetricIcon = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--color-text-icon-primary);

  svg {
    width: 24px;
    height: 24px;
  }
`;

const MetricLabel = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  letter-spacing: 0.2px;
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
  letter-spacing: 0.2px;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-300);

  @container category (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled(Card)`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;

const FeatureMedia = styled.img`
  display: block;
  width: 100%;
  height: 160px;
  object-fit: cover;
`;

const FeatureBody = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-300);
  min-height: 0;
  padding: var(--space-500);
`;

const FeatureCopy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-300);
  min-height: 0;
`;

const FeatureIntro = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
`;

const FeatureIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--color-text-icon-primary);

  svg {
    width: 24px;
    height: 24px;
  }
`;

const FeatureTitle = styled.h2`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const FeatureText = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  letter-spacing: 0.2px;
`;

const SpotlightCard = styled(Card)`
  position: relative;
  min-width: 0;
  min-height: 280px;
  overflow: hidden;
  /*
    Same multi-stop indigo underlay as Home economics / hero cards.
  */
  background-image: linear-gradient(
    126deg,
    rgb(4, 27, 149) 2.5%,
    rgb(21, 49, 198) 41.6%,
    rgb(83, 103, 246) 41%,
    rgb(89, 177, 255) 79%
  );
`;

const SpotlightMedia = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 280px;
  height: 100%;
`;

const SpotlightImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
`;

const SpotlightScrim = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(
    180deg,
    rgba(117, 134, 255, 0) 0%,
    rgba(0, 26, 152, 0.6) 70%,
    rgba(0, 26, 152, 0.8) 100%
  );
`;

const SpotlightCopy = styled.div`
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  align-items: flex-start;
  max-width: 40rem;
  padding: var(--space-800) var(--space-500);
`;

const SpotlightTitle = styled.h2`
  margin: 0;
  color: var(--color-text-icon-inverse);
  font-size: var(--type-size-title);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const SpotlightBody = styled.p`
  margin: 0;
  color: var(--color-text-icon-inverse);
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  letter-spacing: 0.2px;
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
        <OverviewCard role="region" aria-label={`${def.title} overview`}>
          <Hero>
            <HeroImage src={def.heroImage} alt="" />
            <HeroScrim />
            <HeroCopy>
              <HeroTitle>{def.title}</HeroTitle>
              <HeroSubtitle>{def.subtitle}</HeroSubtitle>
            </HeroCopy>
            <HeroActions>
              <Button
                size="lg"
                intent="secondary"
                endIcon={<ArrowRight aria-hidden />}
                onClick={go(def.primaryCta.target)}
              >
                {def.primaryCta.label}
              </Button>
            </HeroActions>
          </Hero>

          <MetricsBand>
            <MetricsScroller>
              {def.metrics.map((metric) => (
                <MetricCard key={metric.id}>
                  <MetricInner>
                    <MetricTop>
                      <MetricIcon>{metric.icon}</MetricIcon>
                      <MetricLabel>{metric.label}</MetricLabel>
                      <MetricValue>{metric.value}</MetricValue>
                    </MetricTop>
                    <MetricCaption>
                      {typeof metric.caption === 'string' ? metric.caption : metric.caption}
                    </MetricCaption>
                  </MetricInner>
                </MetricCard>
              ))}
            </MetricsScroller>
          </MetricsBand>
        </OverviewCard>

        <FeatureGrid role="region" aria-label={`${def.title} features`}>
          {def.features.map((feature) => (
            <FeatureCard key={feature.id}>
              <FeatureMedia src={feature.media} alt="" />
              <FeatureBody>
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <FeatureCopy>
                  <FeatureIntro>
                    <FeatureTitle>{feature.title}</FeatureTitle>
                    <FeatureText>{feature.body}</FeatureText>
                  </FeatureIntro>
                  <div>
                    <Button
                      size="sm"
                      endIcon={<SquareArrowOutUpRight aria-hidden />}
                      onClick={go(feature.id)}
                    >
                      {feature.cta}
                    </Button>
                  </div>
                </FeatureCopy>
              </FeatureBody>
            </FeatureCard>
          ))}
        </FeatureGrid>

        <SpotlightCard role="region" aria-label={def.spotlight.title}>
          <SpotlightMedia>
            <SpotlightImage src={def.spotlight.media} alt="" />
            <SpotlightScrim />
            <SpotlightCopy>
              <SpotlightTitle>{def.spotlight.title}</SpotlightTitle>
              <SpotlightBody>{def.spotlight.body}</SpotlightBody>
              <Button
                size="sm"
                intent="secondary"
                endIcon={<SquareArrowOutUpRight aria-hidden />}
                onClick={go(def.spotlight.ctaTarget)}
              >
                {def.spotlight.ctaLabel}
              </Button>
            </SpotlightCopy>
          </SpotlightMedia>
        </SpotlightCard>
      </Page>
    </PageScroll>
  );
}
