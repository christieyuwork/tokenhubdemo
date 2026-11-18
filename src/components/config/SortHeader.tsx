import { IconButton } from '@cake-admin/cakeand';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { SortableHeaderCell } from '../../pages/ReportPage';

export type SortDir = 'asc' | 'desc';

export function SortHeader({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSort,
  wide,
}: {
  label: string;
  columnKey: string;
  sortKey: string;
  sortDir: SortDir;
  onSort: (key: string) => void;
  wide?: boolean;
}) {
  const sorted = sortKey === columnKey;
  const nextDir = sorted && sortDir === 'desc' ? 'ascending' : 'descending';
  return (
    <SortableHeaderCell
      $wide={wide}
      active={sorted}
      aria-sort={sorted ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'none'}
      onClick={() => onSort(columnKey)}
      actions={
        sorted ? (
          <IconButton
            size="xs"
            variant="tonal"
            label={`Sort ${label} ${nextDir}`}
            icon={sortDir === 'asc' ? <ArrowUp /> : <ArrowDown />}
            onClick={(event) => {
              event.stopPropagation();
              onSort(columnKey);
            }}
          />
        ) : undefined
      }
    >
      {label}
    </SortableHeaderCell>
  );
}
