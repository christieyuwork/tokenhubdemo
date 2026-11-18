import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { IconButton, MenuContainer, MenuItem } from '@cake-admin/cakeand';
import { MoreVertical } from 'lucide-react';
import styled from 'styled-components';

export interface RowAction {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface RowActionsMenuProps {
  label: string;
  actions: RowAction[];
}

const Wrap = styled.div`
  position: relative;
  display: inline-flex;
`;

const MenuPanel = styled.div`
  position: absolute;
  top: calc(100% + var(--space-050));
  right: 0;
  z-index: 20;
`;

export function RowActionsMenu({ label, actions }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <Wrap ref={wrapRef}>
      <IconButton
        label={label}
        icon={<MoreVertical size={16} aria-hidden />}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        size="sm"
        variant="ghost"
        intent="secondary"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      />
      {open ? (
        <MenuPanel id={menuId} role="presentation">
          <MenuContainer role="menu" aria-label={label} width={200}>
            {actions.map((action) => (
              <MenuItem
                key={action.id}
                showLeftSlot={false}
                showRightSlot={false}
                disabled={action.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  if (action.disabled) return;
                  setOpen(false);
                  action.onSelect();
                }}
              >
                {action.label}
              </MenuItem>
            ))}
          </MenuContainer>
        </MenuPanel>
      ) : null}
    </Wrap>
  );
}

export function DetailList({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
