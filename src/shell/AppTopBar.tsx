import { Avatar, IconButton, TextInput } from '@cake-admin/cakeand';
import styled from 'styled-components';
import bell from '../assets/nav-alerts.svg';
import badge from '../assets/notification-badge.svg';
import search from '../assets/search.svg';
import close from '../assets/window-close.svg';
import maximize from '../assets/window-maximize.svg';
import minimize from '../assets/window-minimize.svg';
import { Glyph } from './Glyph';

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-300);
  box-sizing: border-box;
  width: 100%;
  padding: var(--space-300) var(--space-300) var(--space-100) var(--space-500);
`;

const SearchArea = styled.div`
  display: flex;
  flex: 1 1 auto;
  justify-content: center;
  min-width: 0;

  /*
    The frame's search field is a pill. TextInput's box uses --radius-200,
    so only that box is retargeted to the pill token.
  */
  & div:has(> input) {
    border-radius: var(--radius-1000);
  }
`;

const SearchField = styled.div`
  width: min(320px, 100%);
`;

const Actions = styled.div`
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--space-500);
`;

const Cluster = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-300);
`;

const WindowControls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-050);
`;

const Notify = styled.span`
  position: relative;
  display: inline-flex;
`;

const Badge = styled.img`
  position: absolute;
  top: 4px;
  left: 19px;
  pointer-events: none;
`;

export function AppTopBar() {
  return (
    <Header>
      <SearchArea>
        <SearchField>
          <TextInput
            size="sm"
            placeholder="Search"
            aria-label="Search"
            startIcon={<Glyph src={search} />}
          />
        </SearchField>
      </SearchArea>
      <Actions>
        <Cluster>
          <Notify>
            <IconButton
              label="Notifications"
              icon={<Glyph src={bell} />}
              intent="secondary"
              variant="ghost"
              size="sm"
            />
            <Badge src={badge} alt="" />
          </Notify>
          <Avatar size="sm" />
        </Cluster>
        <WindowControls>
          <IconButton
            label="Minimize"
            icon={<Glyph src={minimize} />}
            intent="secondary"
            variant="ghost"
            size="sm"
          />
          <IconButton
            label="Maximize"
            icon={<Glyph src={maximize} />}
            intent="secondary"
            variant="ghost"
            size="sm"
          />
          <IconButton
            label="Close"
            icon={<Glyph src={close} />}
            intent="secondary"
            variant="ghost"
            size="sm"
          />
        </WindowControls>
      </Actions>
    </Header>
  );
}
