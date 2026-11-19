import { useState } from 'react';
import { CakeProvider, Sidebar, SidebarContent } from '@cake-admin/cakeand';
import styled, { createGlobalStyle } from 'styled-components';
import backdrop from './assets/backdrop.png';
import { AccessKeys } from './pages/AccessKeys';
import { AlertRules } from './pages/AlertRules';
import { Alerts } from './pages/Alerts';
import { Caching } from './pages/Caching';
import { CategoryLanding, isCategoryLanding } from './pages/CategoryLanding';
import { Connections } from './pages/Connections';
import { CostByModel } from './pages/CostByModel';
import { CostByTrace } from './pages/CostByTrace';
import { Dashboard } from './pages/Dashboard';
import { Energy } from './pages/Energy';
import { GpuFleet } from './pages/GpuFleet';
import { GpuRegistry } from './pages/GpuRegistry';
import { Home } from './pages/Home';
import { InvoiceReconciliation } from './pages/InvoiceReconciliation';
import { ModelAnalyzer } from './pages/ModelAnalyzer';
import { ModelDeployments } from './pages/ModelDeployments';
import { ModelRegistry } from './pages/ModelRegistry';
import { PricingAndRates } from './pages/PricingAndRates';
import { Quotas } from './pages/Quotas';
import { ReportPage } from './pages/ReportPage';
import { IntelligentRouting } from './pages/IntelligentRouting';
import { PromptLab } from './pages/PromptLab';
import { RoutingDecisions } from './pages/RoutingDecisions';
import { AppSidebar } from './shell/AppSidebar';
import { AppTopBar } from './shell/AppTopBar';
import { navGroups } from './shell/nav';

/** Legacy Routing / Routing rules ids map onto Intelligent routing / Prompt lab. */
function resolveNavigation(next: string): {
  section: string;
  focusPolicies?: boolean;
  promptLabMode?: 'test' | 'whatIf';
} {
  if (next === 'routing' || next === 'intelligent-routing') {
    return { section: 'intelligent-routing' };
  }
  if (next === 'routing-rules' || next === 'routing-policies') {
    return { section: 'intelligent-routing', focusPolicies: true };
  }
  if (next === 'what-if') {
    return { section: 'prompt-lab', promptLabMode: 'whatIf' };
  }
  if (next === 'test-prompt') {
    return { section: 'prompt-lab', promptLabMode: 'test' };
  }
  if (next === 'prompt-lab') {
    return { section: 'prompt-lab' };
  }
  return { section: next };
}

const costSections = navGroups.find((group) => group.value === 'cost')?.items ?? [];
const optimizationSections =
  navGroups.find((group) => group.value === 'optimization')?.items ?? [];
const operationsSections =
  navGroups.find((group) => group.value === 'operations')?.items ?? [];
const alertsSections = navGroups.find((group) => group.value === 'alerts')?.items ?? [];
const administrationSections =
  navGroups.find((group) => group.value === 'administration')?.items ?? [];

const Global = createGlobalStyle`
  html,
  body,
  #root {
    height: 100%;
    margin: 0;
  }
`;

const Stage = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 100%;
  background-color: rgb(3, 1, 61);
  background-image:
    linear-gradient(180deg, rgba(147, 97, 221, 0.3) 0%, rgba(3, 1, 61, 0.6) 87.754%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%),
    url('${backdrop}');
  background-position: center;
  background-size: cover;
`;

const WindowFrame = styled.div`
  position: relative;
  box-sizing: border-box;
  display: flex;
  width: 90%;
  height: 90%;
  overflow: hidden;
  border-radius: var(--radius-150);
  /*
    The frame's window edge is 8px. The largest stroke token is --stroke-600 (6px).
  */
  border: 8px solid var(--color-stroke-border-container-os);
  background: var(--color-surfaces-container-blur-high);
  /*
    The generated frame uses a 45px backdrop blur. cake& has no blur-radius token.
  */
  backdrop-filter: blur(45px);
  box-shadow: var(--elevation-5);
`;

const Shell = styled(Sidebar)`
  width: 100%;
  height: 100%;
  min-height: 0;
  align-items: stretch;
  gap: 0;
`;

const Main = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
`;

const Body = styled(SidebarContent)`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
`;

export default function App() {
  const [section, setSection] = useState('home');
  const [focusRoutingPolicies, setFocusRoutingPolicies] = useState(false);
  const [focusRoutingDecisionId, setFocusRoutingDecisionId] = useState<string | null>(null);
  const [promptLabMode, setPromptLabMode] = useState<'test' | 'whatIf' | undefined>();

  function navigateTo(next: string, decisionId?: string) {
    const resolved = resolveNavigation(next);
    setFocusRoutingPolicies(Boolean(resolved.focusPolicies));
    setFocusRoutingDecisionId(decisionId ?? null);
    setPromptLabMode(resolved.promptLabMode);
    setSection(resolved.section);
  }

  const isCostSection = costSections.some((item) => item.value === section);
  const isOptimizationSection = optimizationSections.some((item) => item.value === section);
  const isOperationsSection = operationsSections.some((item) => item.value === section);
  const isAlertsSection = alertsSections.some((item) => item.value === section);
  const isAdministrationSection = administrationSections.some((item) => item.value === section);

  return (
    <CakeProvider mode="light.a">
      <Global />
      <Stage>
        <WindowFrame id="app-shell">
          <Shell value={section} onValueChange={navigateTo}>
            <AppSidebar activeSection={section} />
            <Main>
              <AppTopBar />
              <Body value={section}>
                {section === 'home' ? <Home onNavigate={navigateTo} /> : null}
                {section === 'dashboard' ? <Dashboard onNavigate={navigateTo} /> : null}
                {isCategoryLanding(section) ? (
                  <CategoryLanding category={section} onNavigate={navigateTo} />
                ) : null}
                {isCostSection ? (
                  <ReportPage
                    sections={costSections}
                    section={section}
                    onSectionChange={navigateTo}
                    switcherLabel="Cost views"
                  >
                    {section === 'cost-by-model' ? <CostByModel /> : null}
                    {section === 'cost-by-trace' ? <CostByTrace /> : null}
                    {section === 'invoice-reconciliation' ? <InvoiceReconciliation /> : null}
                    {section === 'pricing-and-rates' ? <PricingAndRates /> : null}
                  </ReportPage>
                ) : null}
                {isOptimizationSection ? (
                  <ReportPage
                    sections={optimizationSections}
                    section={section}
                    onSectionChange={navigateTo}
                    switcherLabel="Optimization views"
                  >
                    {section === 'intelligent-routing' ? (
                      <IntelligentRouting
                        focusPolicies={focusRoutingPolicies}
                        onNavigate={navigateTo}
                      />
                    ) : null}
                    {section === 'prompt-lab' ? (
                      <PromptLab initialMode={promptLabMode} />
                    ) : null}
                    {section === 'routing-decisions' ? (
                      <RoutingDecisions focusDecisionId={focusRoutingDecisionId} />
                    ) : null}
                    {section === 'model-analyzer' ? <ModelAnalyzer /> : null}
                    {section === 'caching' ? <Caching /> : null}
                    {section === 'energy' ? <Energy /> : null}
                  </ReportPage>
                ) : null}
                {isOperationsSection ? (
                  <ReportPage
                    sections={operationsSections}
                    section={section}
                    onSectionChange={navigateTo}
                    switcherLabel="Operations views"
                  >
                    {section === 'model-registry' ? (
                      <ModelRegistry onNavigate={navigateTo} />
                    ) : null}
                    {section === 'model-deployments' ? <ModelDeployments /> : null}
                    {section === 'gpu-fleet' ? <GpuFleet /> : null}
                    {section === 'gpu-registry' ? <GpuRegistry /> : null}
                  </ReportPage>
                ) : null}
                {isAlertsSection ? (
                  <ReportPage
                    sections={alertsSections}
                    section={section}
                    onSectionChange={navigateTo}
                    switcherLabel="Alert views"
                  >
                    {section === 'alert-list' ? <Alerts /> : null}
                    {section === 'alert-rules' ? <AlertRules /> : null}
                  </ReportPage>
                ) : null}
                {isAdministrationSection ? (
                  <ReportPage
                    sections={administrationSections}
                    section={section}
                    onSectionChange={navigateTo}
                    switcherLabel="Administration views"
                  >
                    {section === 'connections' ? <Connections /> : null}
                    {section === 'access-keys' ? <AccessKeys /> : null}
                    {section === 'quotas' ? <Quotas onNavigate={navigateTo} /> : null}
                  </ReportPage>
                ) : null}
              </Body>
            </Main>
          </Shell>
        </WindowFrame>
      </Stage>
    </CakeProvider>
  );
}
