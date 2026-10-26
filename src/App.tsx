import { useState } from 'react';
import { CakeProvider, Sidebar, SidebarContent } from '@cake-admin/cakeand';
import styled, { createGlobalStyle } from 'styled-components';
import backdrop from './assets/backdrop.png';
import { AlertRules } from './pages/AlertRules';
import { Alerts } from './pages/Alerts';
import { Caching } from './pages/Caching';
import { CategoryLanding, isCategoryLanding } from './pages/CategoryLanding';
import { CostByModel } from './pages/CostByModel';
import { CostByTrace } from './pages/CostByTrace';
import { Dashboard } from './pages/Dashboard';
import { Energy } from './pages/Energy';
import { GpuFleet } from './pages/GpuFleet';
import { Home } from './pages/Home';

import { IntelligentRouting } from './pages/IntelligentRouting';
import { InvoiceReconciliation } from './pages/InvoiceReconciliation';
import { ModelAnalyzer } from './pages/ModelAnalyzer';
import { ReportPage, ReportPlaceholder } from './pages/ReportPage';
import { AppSidebar } from './shell/AppSidebar';
import { AppTopBar } from './shell/AppTopBar';
import { navGroups } from './shell/nav';

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
  const isCostSection = costSections.some((item) => item.value === section);
  const isOptimizationSection = optimizationSections.some((item) => item.value === section);
  const isOperationsSection = operationsSections.some((item) => item.value === section);
  const isAlertsSection = alertsSections.some((item) => item.value === section);
  const isAdministrationSection = administrationSections.some((item) => item.value === section);

  return (
    <CakeProvider mode="light.a">
      <Global />
      <Stage>
        <WindowFrame>
          <Shell value={section} onValueChange={setSection}>
            <AppSidebar activeSection={section} />
            <Main>
              <AppTopBar />
              <Body value={section}>
                {section === 'home' ? <Home onNavigate={setSection} /> : null}
                {section === 'dashboard' ? <Dashboard onNavigate={setSection} /> : null}
                {isCategoryLanding(section) ? (
                  <CategoryLanding category={section} onNavigate={setSection} />
                ) : null}
                {isCostSection ? (
                  <ReportPage
                    sections={costSections}
                    section={section}
                    onSectionChange={setSection}
                    switcherLabel="Cost views"
                  >
                    {section === 'cost-by-model' ? <CostByModel /> : null}
                    {section === 'cost-by-trace' ? <CostByTrace /> : null}
                    {section === 'invoice-reconciliation' ? <InvoiceReconciliation /> : null}
                    {section === 'pricing-and-rates' ? (
                      <ReportPlaceholder
                        title="Pricing and rates"
                        description="Keep published rates, negotiated discounts, and self-host costs aligned."
                      />
                    ) : null}
                  </ReportPage>
                ) : null}
                {isOptimizationSection ? (
                  <ReportPage
                    sections={optimizationSections}
                    section={section}
                    onSectionChange={setSection}
                    switcherLabel="Optimization views"
                  >
                    {section === 'intelligent-routing' ? <IntelligentRouting /> : null}
                    {section === 'routing-rules' ? (
                      <ReportPlaceholder
                        title="Routing rules"
                        description="Define intent, latency, and cost policies that steer traffic across your fleet."
                      />
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
                    onSectionChange={setSection}
                    switcherLabel="Operations views"
                  >
                    {section === 'model-registry' ? (
                      <ReportPlaceholder
                        title="Model registry"
                        description="Catalog every model, version, and capability your organization can call."
                      />
                    ) : null}
                    {section === 'model-deployments' ? (
                      <ReportPlaceholder
                        title="Model deployments"
                        description="See what is live, where it runs, and how capacity is allocated."
                      />
                    ) : null}
                    {section === 'gpu-fleet' ? <GpuFleet /> : null}
                    {section === 'gpu-registry' ? (
                      <ReportPlaceholder
                        title="GPU registry"
                        description="Inventory hardware, regions, and ownership so capacity stays accountable."
                      />
                    ) : null}
                  </ReportPage>
                ) : null}
                {isAlertsSection ? (
                  <ReportPage
                    sections={alertsSections}
                    section={section}
                    onSectionChange={setSection}
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
                    onSectionChange={setSection}
                    switcherLabel="Administration views"
                  >
                    {section === 'connections' ? (
                      <ReportPlaceholder
                        title="Connections"
                        description="Link cloud providers, self-hosted endpoints, and billing sources."
                      />
                    ) : null}
                    {section === 'access-keys' ? (
                      <ReportPlaceholder
                        title="Access keys"
                        description="Issue, rotate, and revoke keys used by apps and automation."
                      />
                    ) : null}
                    {section === 'quotas' ? (
                      <ReportPlaceholder
                        title="Quotas"
                        description="Cap spend and throughput by org, team, or workload before overruns."
                      />
                    ) : null}
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
