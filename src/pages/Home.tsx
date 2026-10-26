import {
  Button,
  Card,
  HeroCard,
  Scrollbar,
} from '@cake-admin/cakeand';
import {
  ArrowRight,
  Bell,
  Box,
  CircleDollarSign,
  Compass,
  Cpu,
  HeartPulse,
  Layers,
  MemoryStick,
  RefreshCw,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  TrendingUp,
} from 'lucide-react';
import styled from 'styled-components';
import aiEconomicsImg from '../assets/home/ai-economics.jpg';
import heroImg from '../assets/home/hero.jpg';
import intelligentRoutingImg from '../assets/home/intelligent-routing.jpg';
import operateImg from '../assets/home/operate.jpg';
import optimizeImg from '../assets/home/optimize.jpg';
import predictImg from '../assets/home/predict.jpg';
import understandSpendImg from '../assets/home/understand-spend.jpg';

/** Figma call_split glyph (node on Intelligent routing card). */
function CallSplitIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 3.99951C4.44772 3.99951 4 4.44723 4 4.99951V9.99951H6V7.41373L10.1213 11.535C10.6839 12.0977 11 12.8607 11 13.6564V19.9995H13V13.6564C13 12.3303 12.4732 11.0585 11.5355 10.1208L7.41421 5.99951H10V3.99951H5Z"
        fill="currentColor"
      />
      <path
        d="M17.9999 7.41373L14.458 10.9556C14.1931 10.3222 13.835 9.72759 13.3923 9.19288L16.5857 5.99951H13.9999V3.99951H18.9999C19.5522 3.99951 19.9999 4.44723 19.9999 4.99951V9.99951H17.9999V7.41373Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** GPU gauge: 108px, 13.5 stroke → radius 47.25 (matches Figma track). */
const GAUGE_SIZE = 108;
const GAUGE_STROKE = 13.5;
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_STROKE) / 2;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
const GAUGE_VALUE = 0.75;

export interface HomeProps {
  onNavigate?: (section: string) => void;
}

const PageScroll = styled(Scrollbar)`
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
`;

const Page = styled.div`
  box-sizing: border-box;
  padding: var(--space-600);
  /*
    Query the content width (not the viewport) so the 7-col bento
    survives inside the demo window frame.
  */
  container-type: inline-size;
  container-name: home;
`;

/*
  Figma Home content is a 7-column bento (1096px). Gaps are 24px.
  Rows: 250 + 250 (hero/metrics span), 250, 524, 460.
*/
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-template-rows: 250px 250px 250px 524px 460px;
  gap: var(--space-500);

  @container home (max-width: 920px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: none;
    grid-auto-rows: minmax(220px, auto);
  }

  @container home (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const HeroPanel = styled(Card)`
  display: flex;
  flex-direction: column;
  grid-column: 1 / span 4;
  grid-row: 1 / span 2;
  min-height: 0;
  /*
    The frame paints a multi-stop indigo gradient under the photo.
    cake& Card has no gradient variant; these stops are not tokens.
  */
  background-image: linear-gradient(
    146deg,
    rgb(4, 27, 149) 2.5%,
    rgb(21, 49, 198) 41.6%,
    rgb(83, 103, 246) 41%,
    rgb(89, 177, 255) 79%
  );

  @container home (max-width: 920px) {
    grid-column: 1 / -1;
    grid-row: auto;
    min-height: 360px;
  }
`;

const HeroMedia = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  min-height: 0;
`;

const HeroImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  pointer-events: none;
`;

const HeroScrim = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  /*
    Frame overlay: transparent → indigo at 60% → indigo at 80%.
    Stops match the Figma hero card; not available as tokens.
  */
  background-image: linear-gradient(
    180deg,
    rgba(117, 134, 255, 0) 0%,
    rgba(0, 26, 152, 0.6) 70%,
    rgba(0, 26, 152, 0.8) 100%
  );
`;

const InverseHero = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;

  /*
    HeroCard pads with space-600; the frame uses space-800 on the hero.
  */
  & > * {
    padding: var(--space-800);
  }

  h2,
  p {
    color: var(--color-text-icon-inverse);
  }
`;

const MetricsPanel = styled.div`
  box-sizing: border-box;
  display: grid;
  grid-column: 5 / span 3;
  grid-row: 1 / span 2;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: 1fr 1fr auto;
  gap: var(--space-200);
  padding: var(--space-500);
  border-radius: var(--radius-400);
  background: var(--color-surfaces-container-blur-high);

  /*
    Nested metric cards are 16px in the frame; cake& Card defaults to 24px.
  */
  & > * {
    border-radius: var(--radius-300);
  }

  @container home (max-width: 920px) {
    grid-column: 1 / -1;
    grid-row: auto;
  }

  @container home (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const MetricInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
  font-size: var(--type-size-greeting);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
  letter-spacing: -0.4px;
`;

const MetricChange = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-100);
  align-items: center;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  letter-spacing: 0.2px;
`;

const ChangePositive = styled.span`
  color: var(--color-success-success);
`;

const MetricsActions = styled.div`
  display: flex;
  grid-column: 1 / -1;
  gap: var(--space-300);
  align-items: center;
  justify-content: flex-end;
  padding-top: var(--space-200);
`;

const GpuCard = styled(Card)`
  display: flex;
  flex-direction: column;
  grid-column: 1 / span 2;
  grid-row: 3;
  min-height: 0;

  @container home (max-width: 920px) {
    grid-column: span 2;
    grid-row: auto;
  }

  @container home (max-width: 560px) {
    grid-column: 1 / -1;
  }
`;

const GpuInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  height: 100%;
  padding: var(--space-500);
`;

const GpuHeader = styled.div`
  display: flex;
  gap: var(--space-100);
  align-items: flex-start;
`;

const GpuTitle = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  letter-spacing: 0.2px;
`;

const GaugeWrap = styled.div`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 0;
`;

const Gauge = styled.div`
  position: relative;
  width: ${GAUGE_SIZE}px;
  height: ${GAUGE_SIZE}px;
  flex: 0 0 auto;
`;

const GaugeSvg = styled.svg`
  display: block;
  width: ${GAUGE_SIZE}px;
  height: ${GAUGE_SIZE}px;
`;

const GaugeTrack = styled.circle`
  fill: none;
  stroke: var(--color-badge-indigo);
  stroke-opacity: 0.1;
  stroke-width: ${GAUGE_STROKE};
`;

const GaugeProgress = styled.circle`
  fill: none;
  stroke: var(--color-primary-primary);
  stroke-width: ${GAUGE_STROKE};
  stroke-linecap: round;
`;

const GaugeValue = styled.p`
  position: absolute;
  top: 50%;
  left: 50%;
  margin: 0;
  transform: translate(-50%, -50%);
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-greeting);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
  letter-spacing: -0.4px;
  white-space: nowrap;
`;

const GpuFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-200);
`;

const QuickLinksCard = styled(Card)`
  display: flex;
  flex-direction: column;
  grid-column: 3 / span 2;
  grid-row: 3;
  min-height: 0;

  @container home (max-width: 920px) {
    grid-column: span 2;
    grid-row: auto;
  }

  @container home (max-width: 560px) {
    grid-column: 1 / -1;
  }
`;

const QuickLinksInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  height: 100%;
  padding: var(--space-500);
`;

const QuickLinksTitle = styled.h3`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const QuickLinkList = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: var(--stroke-100) solid var(--color-stroke-border);
  border-radius: var(--radius-300);
  background: var(--color-surfaces-container);
`;

const QuickLinkButton = styled.button`
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  gap: var(--space-100);
  align-items: center;
  min-height: 0;
  margin: 0;
  padding: var(--space-300) var(--space-200);
  border: 0;
  border-bottom: var(--stroke-100) solid var(--color-stroke-border);
  background: transparent;
  color: var(--color-text-icon-primary);
  font: inherit;
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  text-align: left;
  cursor: pointer;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: var(--color-surfaces-on-container-high);
  }

  &:focus-visible {
    outline: var(--stroke-200) solid var(--color-primary-primary);
    outline-offset: calc(-1 * var(--stroke-200));
  }
`;

const QuickLinkLabel = styled.span`
  flex: 1 1 auto;
  min-width: 0;
`;

const QuickLinkIcon = styled.span`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--color-text-icon-primary);

  svg {
    width: 20px;
    height: 20px;
  }
`;

const PredictCard = styled(Card)`
  display: flex;
  flex-direction: column;
  grid-column: 5 / span 3;
  grid-row: 3;
  min-height: 0;

  @container home (max-width: 920px) {
    grid-column: 1 / -1;
    grid-row: auto;
  }
`;

/*
  Figma Predict card: 24px padding all sides, 24px gap, square media
  with 24px radius — equal inset on every edge of the image.
*/
const PredictInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  gap: var(--space-500);
  align-items: center;
  min-height: 0;
  padding: var(--space-500);
`;

const PredictCopy = styled.div`
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: var(--space-200);
  align-items: flex-start;
  align-self: stretch;
  min-width: 0;
  min-height: 0;
`;

const PredictTitle = styled.h3`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const PredictBody = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  letter-spacing: 0.2px;
`;

const PredictActions = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  min-height: 0;
`;

const PredictMediaFrame = styled.div`
  position: relative;
  /*
    Figma: square media, flex sibling to the copy column. Height follows
    the padded card so top/right/bottom insets stay 24px like the left.
  */
  flex: 0 0 auto;
  align-self: stretch;
  height: auto;
  max-height: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: var(--radius-400);
`;

const PredictMedia = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const LeadIcon = styled.div`
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

const RoutingCard = styled(Card)`
  display: flex;
  flex-direction: column;
  grid-column: 1 / span 5;
  grid-row: 4;
  min-height: 0;

  @container home (max-width: 920px) {
    grid-column: 1 / -1;
    grid-row: auto;
    min-height: 420px;
  }
`;

const RoutingInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-500);
  height: 100%;
  padding: var(--space-500);
`;

const RoutingHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
`;

const RoutingTitle = styled.h3`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const RoutingBody = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  letter-spacing: 0.2px;
`;

const RoutingFigure = styled.div`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: var(--space-500);
  background: var(--color-surfaces-container);
`;

const RoutingImage = styled.img`
  display: block;
  width: 100%;
  max-height: 100%;
  object-fit: contain;
  background: var(--color-surfaces-container);
`;

const RoutingActions = styled.div`
  display: flex;
  gap: var(--space-300);
  align-items: center;
  justify-content: flex-end;
`;

const EconomicsCard = styled(Card)`
  display: flex;
  flex-direction: column;
  grid-column: 6 / span 2;
  grid-row: 4;
  min-height: 0;
  /*
    Same multi-stop indigo underlay as the hero; not available as tokens.
  */
  background-image: linear-gradient(
    126deg,
    rgb(4, 27, 149) 2.5%,
    rgb(21, 49, 198) 41.6%,
    rgb(83, 103, 246) 41%,
    rgb(89, 177, 255) 79%
  );

  @container home (max-width: 920px) {
    grid-column: 1 / -1;
    grid-row: auto;
    min-height: 360px;
  }
`;

const EconomicsCopy = styled.div`
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  justify-content: flex-end;
  height: 100%;
  padding: var(--space-800) var(--space-500);
`;

const EconomicsTitle = styled.h3`
  margin: 0;
  color: var(--color-text-icon-inverse);
  font-size: var(--type-size-title);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const EconomicsBody = styled.p`
  margin: 0;
  color: var(--color-text-icon-inverse);
  font-size: var(--type-size-subject);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  letter-spacing: 0.2px;
`;

const FeatureCard = styled(Card)<{ $span: number }>`
  display: flex;
  flex-direction: column;
  grid-column: span ${(p) => p.$span};
  grid-row: 5;
  min-height: 0;

  @container home (max-width: 920px) {
    grid-column: span 2;
    grid-row: auto;
    min-height: 420px;
  }

  @container home (max-width: 560px) {
    grid-column: 1 / -1;
  }
`;

const FeatureMedia = styled.img`
  display: block;
  width: 100%;
  height: 200px;
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

const FeatureTitle = styled.h3`
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

const METRICS = [
  {
    icon: <CircleDollarSign aria-hidden />,
    label: 'AI Spend Under Management',
    value: '$12.4M',
    change: '↓ 18%',
  },
  {
    icon: <SlidersHorizontal aria-hidden />,
    label: 'Optimization Impact',
    value: '36%',
    change: '↑ 12 pp',
  },
  {
    icon: <HeartPulse aria-hidden />,
    label: 'Estimated Savings Generated',
    value: '$2.8M',
    change: '↑ 67%',
  },
  {
    icon: <Layers aria-hidden />,
    label: 'Total Tokens Processed',
    value: '842B',
    change: '↑ 42%',
  },
] as const;

const QUICK_LINKS = [
  { value: 'model-registry', label: 'Model registry', icon: <Box aria-hidden /> },
  { value: 'gpu-fleet', label: 'GPU fleet', icon: <Cpu aria-hidden /> },
  { value: 'caching', label: 'Caching', icon: <RefreshCw aria-hidden /> },
] as const;

export function Home({ onNavigate }: HomeProps) {
  const go = (section: string) => () => onNavigate?.(section);

  return (
    <PageScroll>
      <Page>
        <Grid>
          <HeroPanel role="region" aria-label="TokenHub overview">
            <HeroMedia>
              <HeroImage src={heroImg} alt="" />
              <HeroScrim />
              <InverseHero>
                <HeroCard
                  title="Smarter AI for all."
                  body="See how your organization uses, optimizes, and scales AI — all in one place."
                />
              </InverseHero>
            </HeroMedia>
          </HeroPanel>

          <MetricsPanel role="region" aria-label="Key metrics">
            {METRICS.map((metric) => (
              <Card key={metric.label}>
                <MetricInner>
                  <MetricTop>
                    <MetricIcon>{metric.icon}</MetricIcon>
                    <MetricLabel>{metric.label}</MetricLabel>
                    <MetricValue>{metric.value}</MetricValue>
                  </MetricTop>
                  <MetricChange>
                    <ChangePositive>{metric.change}</ChangePositive>
                    <span>vs. last month</span>
                  </MetricChange>
                </MetricInner>
              </Card>
            ))}
            <MetricsActions>
              <Button
                size="sm"
                variant="ghost"
                intent="secondary"
                onClick={go('administration')}
              >
                Administration
              </Button>
              <Button
                size="sm"
                endIcon={<SquareArrowOutUpRight aria-hidden />}
                onClick={go('dashboard')}
              >
                Dashboard
              </Button>
            </MetricsActions>
          </MetricsPanel>

          <GpuCard role="region" aria-label="GPU fleet efficiency">
            <GpuInner>
              <GpuHeader>
                <MetricIcon>
                  <MemoryStick aria-hidden />
                </MetricIcon>
                <GpuTitle>GPU Fleet Efficiency</GpuTitle>
              </GpuHeader>
              <GaugeWrap>
                <Gauge role="img" aria-label="75 percent">
                  <GaugeSvg viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`} aria-hidden>
                    <GaugeTrack
                      cx={GAUGE_SIZE / 2}
                      cy={GAUGE_SIZE / 2}
                      r={GAUGE_RADIUS}
                    />
                    <GaugeProgress
                      cx={GAUGE_SIZE / 2}
                      cy={GAUGE_SIZE / 2}
                      r={GAUGE_RADIUS}
                      /*
                        Rotate around the circle center so the stroke
                        starts at 12 o'clock; CSS transform-origin is
                        unreliable on SVG geometry.
                      */
                      transform={`rotate(-90 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
                      strokeDasharray={`${GAUGE_CIRCUMFERENCE * GAUGE_VALUE} ${GAUGE_CIRCUMFERENCE * (1 - GAUGE_VALUE)}`}
                    />
                  </GaugeSvg>
                  <GaugeValue>75%</GaugeValue>
                </Gauge>
              </GaugeWrap>
              <GpuFooter>
                <MetricChange>
                  <ChangePositive>↑ 14 pp</ChangePositive>
                  <span>vs. last month</span>
                </MetricChange>
                <Button size="sm" variant="ghost" intent="secondary" onClick={go('energy')}>
                  Energy
                </Button>
              </GpuFooter>
            </GpuInner>
          </GpuCard>

          <QuickLinksCard role="region" aria-label="Quick links">
            <QuickLinksInner>
              <QuickLinksTitle>Quick links</QuickLinksTitle>
              <QuickLinkList>
                {QUICK_LINKS.map((link) => (
                  <QuickLinkButton key={link.value} type="button" onClick={go(link.value)}>
                    <QuickLinkIcon>{link.icon}</QuickLinkIcon>
                    <QuickLinkLabel>{link.label}</QuickLinkLabel>
                    <QuickLinkIcon>
                      <ArrowRight aria-hidden />
                    </QuickLinkIcon>
                  </QuickLinkButton>
                ))}
              </QuickLinkList>
            </QuickLinksInner>
          </QuickLinksCard>

          <PredictCard role="region" aria-label="Predict">
            <PredictInner>
              <PredictCopy>
                <LeadIcon>
                  <Bell aria-hidden />
                </LeadIcon>
                <PredictTitle>Predict</PredictTitle>
                <PredictBody>
                  Forecast costs, capacity needs, and future AI demand before they impact
                  the business.
                </PredictBody>
                <PredictActions>
                  <Button
                    size="sm"
                    endIcon={<Bell aria-hidden />}
                    onClick={go('alert-list')}
                  >
                    Alerts
                  </Button>
                </PredictActions>
              </PredictCopy>
              <PredictMediaFrame>
                <PredictMedia src={predictImg} alt="" />
              </PredictMediaFrame>
            </PredictInner>
          </PredictCard>

          <RoutingCard role="region" aria-label="Intelligent routing">
            <RoutingInner>
              <RoutingHeader>
                <LeadIcon>
                  <CallSplitIcon />
                </LeadIcon>
                <RoutingTitle>Intelligent routing</RoutingTitle>
                <RoutingBody>
                  TokenHub orchestrates workloads across your AI ecosystem, automatically
                  selecting the best combination of model, provider, and infrastructure for
                  every request.
                </RoutingBody>
              </RoutingHeader>
              <RoutingFigure>
                <RoutingImage src={intelligentRoutingImg} alt="" />
              </RoutingFigure>
              <RoutingActions>
                <Button
                  size="sm"
                  variant="ghost"
                  intent="secondary"
                  onClick={go('routing-rules')}
                >
                  Routing rules
                </Button>
                <Button
                  size="sm"
                  endIcon={<SquareArrowOutUpRight aria-hidden />}
                  onClick={go('intelligent-routing')}
                >
                  Intelligent routing
                </Button>
              </RoutingActions>
            </RoutingInner>
          </RoutingCard>

          <EconomicsCard role="region" aria-label="AI economics">
            <HeroMedia>
              <HeroImage src={aiEconomicsImg} alt="" />
              <HeroScrim />
              <EconomicsCopy>
                <EconomicsTitle>AI Economics in Motion</EconomicsTitle>
                <EconomicsBody>
                  Transform routing decisions into measurable savings through intelligent
                  orchestration across your AI ecosystem.
                </EconomicsBody>
              </EconomicsCopy>
            </HeroMedia>
          </EconomicsCard>

          <FeatureCard $span={2} role="region" aria-label="Understand spend">
            <FeatureMedia src={understandSpendImg} alt="" />
            <FeatureBody>
              <LeadIcon>
                <HeartPulse aria-hidden />
              </LeadIcon>
              <FeatureCopy>
                <FeatureIntro>
                  <FeatureTitle>Understand Spend</FeatureTitle>
                  <FeatureText>
                    Track the true cost of every request, model, and business outcome.
                  </FeatureText>
                </FeatureIntro>
                <div>
                  <Button
                    size="sm"
                    endIcon={<SquareArrowOutUpRight aria-hidden />}
                    onClick={go('cost')}
                  >
                    Cost
                  </Button>
                </div>
              </FeatureCopy>
            </FeatureBody>
          </FeatureCard>

          <FeatureCard $span={3} role="region" aria-label="Optimize">
            <FeatureMedia src={optimizeImg} alt="" />
            <FeatureBody>
              <LeadIcon>
                <TrendingUp aria-hidden />
              </LeadIcon>
              <FeatureCopy>
                <FeatureIntro>
                  <FeatureTitle>Optimize</FeatureTitle>
                  <FeatureText>
                    Route every request to the right model, infrastructure, and price point.
                  </FeatureText>
                </FeatureIntro>
                <div>
                  <Button
                    size="sm"
                    endIcon={<SquareArrowOutUpRight aria-hidden />}
                    onClick={go('optimization')}
                  >
                    Optimization
                  </Button>
                </div>
              </FeatureCopy>
            </FeatureBody>
          </FeatureCard>

          <FeatureCard $span={2} role="region" aria-label="Operate">
            <FeatureMedia src={operateImg} alt="" />
            <FeatureBody>
              <LeadIcon>
                <Compass aria-hidden />
              </LeadIcon>
              <FeatureCopy>
                <FeatureIntro>
                  <FeatureTitle>Operate</FeatureTitle>
                  <FeatureText>
                    Monitor AI systems, infrastructure, and workloads from a single command
                    center.
                  </FeatureText>
                </FeatureIntro>
                <div>
                  <Button
                    size="sm"
                    endIcon={<SquareArrowOutUpRight aria-hidden />}
                    onClick={go('operations')}
                  >
                    Operations
                  </Button>
                </div>
              </FeatureCopy>
            </FeatureBody>
          </FeatureCard>
        </Grid>
      </Page>
    </PageScroll>
  );
}
