import { Fragment, useEffect, useState, type MouseEvent } from 'react';
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
 * cake& puts the disclosure chevron as the last child of the row’s inner flex
 * (32×32). Hits there should expand/collapse only — not select the tab.
 */
function isDisclosureChevronClick(event: MouseEvent<HTMLElement>) {
  const row = event.currentTarget.firstElementChild;
  const chevron = row?.lastElementChild;
  if (!chevron || !(event.target instanceof Node)) return false;
  return chevron === event.target || chevron.contains(event.target);
}

/**
 * Token Hub selected nav is fill-only — no leading indicator bar and no
 * focus/selected outline that reads as a border around the pill.
 */
const Nav = styled(SidebarNav)`
  /* Keep cake&’s 280/96px rail from flex-shrinking when Main content is wide. */
  flex: none;
  /*
    Keep cake&’s bottom inset; the toggle row’s own bottom pad is cleared
    below so the control sits lower once the orphan divider is gone.
  */
  padding-bottom: var(--space-200);

  /*
    SidebarNav always renders a decorative SidebarDivider under the collapse
    toggle (meant to separate a user row we do not pass). Hide that orphan rule.
  */
  & > div:last-child > div:not(:has(button)) {
    display: none;
  }

  /* Drop the toggle’s own bottom pad; nav padding-bottom owns the edge gap. */
  & > div:last-child > div:has(button) {
    padding-bottom: 0;
  }

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
              /*
                Pass expanded so the chevron renders, but omit onExpandedChange —
                cake& would toggle on every row click. We only toggle when the
                chevron itself is pressed (see onMouseDown). Label/icon clicks
                still select this tab (category landing) via Radix.
              */
              expanded={collapsed ? undefined : open[group.value]}
              onMouseDown={(event) => {
                if (collapsed || event.button !== 0) return;
                if (!isDisclosureChevronClick(event)) return;
                /*
                  Radix Tabs.Trigger selects on mousedown unless defaultPrevented.
                  Stop that so the chevron expands without navigating.
                */
                event.preventDefault();
                setOpen((current) => ({
                  ...current,
                  [group.value]: !current[group.value],
                }));
              }}
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
