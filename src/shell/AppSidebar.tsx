import { useState } from 'react';
import {
  SidebarBlock,
  SidebarItem,
  SidebarNav,
  SidebarSectionHeader,
  SidebarSubItem,
} from '@cake-admin/cakeand';
import { AppMark } from './AppMark';
import { Glyph, StateGlyph } from './Glyph';
import { navGroups, topLinks } from './nav';

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((group) => [group.value, true])),
  );

  return (
    <SidebarNav
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
          <SidebarBlock
            key={group.value}
            surface="translucent"
            item={
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
            }
          >
            {expanded
              ? group.items.map((item) => (
                  <SidebarSubItem key={item.value} value={item.value}>
                    {item.label}
                  </SidebarSubItem>
                ))
              : null}
          </SidebarBlock>
        );
      })}
    </SidebarNav>
  );
}
