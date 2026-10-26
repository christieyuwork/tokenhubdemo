import { Fragment, useEffect, useState } from 'react';
import {
  SidebarItem,
  SidebarNav,
  SidebarSectionHeader,
  SidebarSubItem,
} from '@cake-admin/cakeand';
import styled from 'styled-components';
import { AppMark } from './AppMark';
import { Glyph, StateGlyph } from './Glyph';
import { navGroups, topLinks } from './nav';

/**
 * Token Hub selected nav is fill-only — no leading indicator bar and no
 * focus/selected outline that reads as a border around the pill.
 */
const Nav = styled(SidebarNav)`
  [role='tab'][data-state='active']::before,
  [role='tab'][aria-selected='true']::before {
    content: none !important;
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    opacity: 0 !important;
    background: transparent !important;
  }

  [role='tab'][data-state='active'],
  [role='tab'][aria-selected='true'],
  [role='tab']:focus,
  [role='tab']:focus-visible {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
`;

export interface AppSidebarProps {
  /** Current shell section — used to auto-expand the owning nav group. */
  activeSection?: string;
}

export function AppSidebar({ activeSection }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((group) => [group.value, false])),
  );

  useEffect(() => {
    if (!activeSection) return;
    const activeGroup = navGroups.find(
      (group) =>
        group.value === activeSection ||
        group.items.some((item) => item.value === activeSection),
    );
    if (!activeGroup) return;
    setOpen((current) =>
      current[activeGroup.value] ? current : { ...current, [activeGroup.value]: true },
    );
  }, [activeSection]);

  return (
    <Nav
      aria-label="Main navigation"
      surface="translucent"
      logo={<AppMark />}
      productName="Lenovo"
      appName="Token Hub"
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    >
      <SidebarSectionHeader>Client name</SidebarSectionHeader>
      {topLinks.map((link) => (
        <SidebarItem
          key={link.value}
          value={link.value}
          icon={
            link.iconFill && link.iconOutline ? (
              <StateGlyph fill={link.iconFill} outline={link.iconOutline} />
            ) : (
              <Glyph src={link.icon} />
            )
          }
        >
          {link.label}
        </SidebarItem>
      ))}
      {navGroups.map((group) => {
        const expanded = !collapsed && open[group.value];
        return (
          <Fragment key={group.value}>
            <SidebarItem
              value={group.value}
              icon={<Glyph src={group.icon} />}
              expanded={collapsed ? undefined : open[group.value]}
              onExpandedChange={(next) =>
                setOpen((current) => ({ ...current, [group.value]: next }))
              }
            >
              {group.label}
            </SidebarItem>
            {expanded
              ? group.items.map((item) => (
                  <SidebarSubItem key={item.value} value={item.value}>
                    {item.label}
                  </SidebarSubItem>
                ))
              : null}
          </Fragment>
        );
      })}
    </Nav>
  );
}
