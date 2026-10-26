import { useState } from 'react';
import { CakeProvider, Sidebar, SidebarContent } from '@cake-admin/cakeand';
import styled, { createGlobalStyle } from 'styled-components';
import backdrop from './assets/backdrop.png';
import { CostByModel } from './pages/CostByModel';
import { ReportPage } from './pages/ReportPage';
import { AppSidebar } from './shell/AppSidebar';
import { AppTopBar } from './shell/AppTopBar';
import { navGroups } from './shell/nav';

const costSections = navGroups.find((group) => group.value === 'cost')?.items ?? [];

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
  min-height: 0;
`;

export default function App() {
  const [section, setSection] = useState('home');
  const isCostSection = costSections.some((item) => item.value === section);

  return (
    <CakeProvider mode="light.a">
      <Global />
      <Stage>
        <WindowFrame>
          <Shell value={section} onValueChange={setSection}>
            <AppSidebar />
            <Main>
              <AppTopBar />
              <Body value={section}>
                {isCostSection ? (
                  <ReportPage sections={costSections} section={section} onSectionChange={setSection}>
                    {section === 'cost-by-model' ? <CostByModel /> : null}
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
