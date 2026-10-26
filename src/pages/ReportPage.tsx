import { useMemo, type ComponentProps, type ReactNode } from 'react';
import {
  Card,
  ContentSwitcher,
  DataCell,
  Dropdown,
  HeaderCell,
  Scrollbar,
  Table,
} from '@cake-admin/cakeand';
import styled, { css } from 'styled-components';

export interface ReportSectionOption {
  value: string;
  label: string;
}

interface ReportPageProps {
  sections: ReportSectionOption[];
  section: string;
  onSectionChange: (value: string) => void;
  /** Accessible name for the section ContentSwitcher. */
  switcherLabel?: string;
  children?: ReactNode;
}

const PageScroll = styled(Scrollbar)`
  box-sizing: border-box;
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  /* Keep vertical scroll; never let a wide table expand the page chrome. */
  overflow-x: hidden;
`;

/*
  Page chrome from the report template (Figma Alerts / Cost-by-* frames):
  switcher row pad 24×32; content grid pad 24 / 36 / 24 / 48; section gap 16.
  This is the only page-level padding for report routes — subpages must not
  add competing horizontal padding.
*/
const SwitcherRow = styled.div`
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: var(--space-500) var(--space-600) 0;
`;

const Content = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: var(--space-500) var(--space-650) var(--space-500) var(--space-800);

  /*
    Flex items default to min-width:auto and will blow the column open when a
    table/chart has a large intrinsic min. Force every direct child to respect
    the shared content box so headers align across routes.
  */
  & > * {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }
`;

const HeaderCard = styled(Card)`
  /*
    The frame paints this card with an indigo-to-violet gradient.
    cake& Card has no gradient variant, and these stops are not tokens.
  */
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  background-image: linear-gradient(8deg, rgb(21, 47, 197) 14%, rgb(160, 120, 255) 87%);

  label {
    color: var(--color-text-icon-on-primary);
  }
`;

/** Figma header card: 24 pad + label/control stack (67) = 115. */
const HEADER_BANNER_HEIGHT = `calc(
  (var(--space-500) * 2) + (var(--type-size-body) * 1.35) + var(--space-100) +
    var(--space-700)
)`;

const HeaderInner = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-500);
  padding: var(--space-500);
  min-width: 0;
  /*
    Fixed banner height (Figma &Card = 115). Same on every ReportHeader page so
    MetricGrid does not jump; overflow clips if a filter tries to grow taller.
  */
  height: ${HEADER_BANNER_HEIGHT};
  overflow: hidden;
`;

const Titles = styled.div`
  display: flex;
  /*
    Share the header with filters. Keep a token min so the title does not
    collapse to a few glyphs when a long Dropdown selection is present.
  */
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  /* Prefer a readable title track; never force the banner wider than Content. */
  min-width: 0;
  max-width: 100%;
`;

const Title = styled.h1`
  margin: 0;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-page);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Description = styled.p`
  margin: 0;
  color: var(--color-text-icon-on-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Filters = styled.div`
  display: flex;
  flex: 0 1 auto;
  flex-wrap: nowrap;
  align-items: flex-end;
  justify-content: flex-end;
  gap: var(--space-200);
  min-width: 0;
  max-width: 100%;
  /* Figma filter row: label (body) + 8 gap + 40 control = 67. */
  height: calc((var(--type-size-body) * 1.35) + var(--space-100) + var(--space-700));

  /*
    Date range keeps a stable width (frame ~242px; tokens ~244).
    It does not share the leftover shrink with the Dropdowns.
  */
  & > :first-child {
    flex: 0 0 auto;
    width: calc(var(--space-1000) * 3 + var(--space-050));
    max-width: 100%;
  }

  /*
    Each Dropdown sizes to its longest option (ReportFilterDropdown sizer).
    Under a narrow header the field shrinks and the closed value ellipsizes.
  */
  & > :not(:first-child) {
    flex: 0 1 max-content;
    width: max-content;
    min-width: 0;
    max-width: 100%;
  }

  /*
    Closed trigger only. Height is the cake& control (40px / space-700) so the
    selected value cannot wrap or spill out of the field.
  */
  & [role='combobox'] {
    box-sizing: border-box;
    align-items: center;
    width: 100%;
    height: var(--space-700);
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

  & [role='combobox'] > span:first-child {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & [role='combobox'] > span:last-child {
    flex: 0 0 auto;
  }
`;

/**
 * Sizes the closed Dropdown trigger to the longest option label (plus chevron
 * chrome). On narrow headers the field shrinks and the selected value ellipsizes
 * — never wraps or overflows vertically.
 *
 * The real Dropdown uses width 100%; `width: 0; min-width: 100%` keeps it from
 * contributing its own max-content to the grid track so only the sizer drives width.
 */
const FilterDropdownField = styled.div`
  display: inline-grid;
  /*
    Prefer the sizer's max-content width, but allow the track to shrink under a
    tight header so the closed trigger ellipsizes instead of overflowing.
  */
  grid-template-columns: minmax(0, max-content);
  justify-items: stretch;
  box-sizing: border-box;
  width: max-content;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;

  > [data-filter-sizer='true'] {
    grid-area: 1 / 1;
    box-sizing: border-box;
    visibility: hidden;
    pointer-events: none;
    white-space: nowrap;
    /*
      Mirror cake& trigger + Select.Value chrome:
      trigger pad (space-200) + Value pad (space-100) on the start;
      Value pad + gap (space-100) + 24px chevron (space-500) + trigger pad on the end;
      plus 1px borders so border-box sizing still fits the full label.
    */
    border: var(--stroke-100) solid transparent;
    padding-inline-start: calc(var(--space-200) + var(--space-100));
    padding-inline-end: calc(
      var(--space-100) + var(--space-100) + var(--space-500) + var(--space-200)
    );
    font-family: var(--font-family);
    font-size: var(--type-size-body);
    font-weight: var(--font-weight-regular);
    line-height: 1.35;
  }

  > :not([data-filter-sizer='true']) {
    grid-area: 1 / 1;
    width: 0;
    min-width: 100%;
    max-width: 100%;
    min-height: 0;
    overflow: hidden;
  }
`;

type ReportFilterDropdownProps = ComponentProps<typeof Dropdown>;

/** Report-header Dropdown that stays wide enough for its longest option label. */
export function ReportFilterDropdown({
  options = [],
  placeholder,
  value,
  ...props
}: ReportFilterDropdownProps) {
  const sizerLabel = useMemo(() => {
    const labels = options.map((option) => option.label);
    if (placeholder) labels.push(placeholder);
    const selected = options.find((option) => option.value === value)?.label;
    if (selected) labels.push(selected);
    return labels.reduce(
      (longest, label) => (label.length > longest.length ? label : longest),
      'All',
    );
  }, [options, placeholder, value]);

  const title =
    options.find((option) => option.value === value)?.label ?? placeholder ?? undefined;

  return (
    <FilterDropdownField title={title}>
      <span data-filter-sizer="true" aria-hidden="true">
        {sizerLabel}
      </span>
      <Dropdown options={options} placeholder={placeholder} value={value} {...props} />
    </FilterDropdownField>
  );
}

export const MetricGrid = styled.div`
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-300);
  width: 100%;
  max-width: 100%;
  min-width: 0;

  & > * {
    min-width: 0;
    max-width: 100%;
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const MetricInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-100);
  padding: var(--space-500);
`;

const MetricLabel = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const MetricValue = styled.p`
  margin: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const MetricCaption = styled.p`
  margin: var(--space-100) 0 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

const PanelCard = styled(Card)`
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
`;

const SectionInner = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: var(--space-500);

  /* Charts/tables scroll inside the panel if they still exceed the content box. */
  & > *:last-child {
    min-width: 0;
    max-width: 100%;
  }
`;

const SectionTitle = styled.h2`
  margin: 0;
  min-width: 0;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-subtitle);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function ReportPage({
  sections,
  section,
  onSectionChange,
  switcherLabel = 'Report views',
  children,
}: ReportPageProps) {
  return (
    <PageScroll>
      <SwitcherRow>
        <ContentSwitcher
          aria-label={switcherLabel}
          size="md"
          intent="primary"
          options={sections}
          value={section}
          onValueChange={onSectionChange}
        />
      </SwitcherRow>
      {children ? <Content>{children}</Content> : null}
    </PageScroll>
  );
}

interface ReportHeaderProps {
  title: string;
  description: string;
  filters?: ReactNode;
}

export function ReportHeader({ title, description, filters }: ReportHeaderProps) {
  return (
    <HeaderCard>
      <HeaderInner>
        <Titles>
          <Title>{title}</Title>
          <Description>{description}</Description>
        </Titles>
        {filters ? <Filters>{filters}</Filters> : null}
      </HeaderInner>
    </HeaderCard>
  );
}

/** Banner-only shell for subpages that share ReportPage chrome but have no body yet. */
export function ReportPlaceholder({ title, description }: { title: string; description: string }) {
  return <ReportHeader title={title} description={description} />;
}

interface MetricCardProps {
  label: string;
  value: ReactNode;
  caption: ReactNode;
}

export function MetricCard({ label, value, caption }: MetricCardProps) {
  return (
    <Card>
      <MetricInner>
        <MetricLabel>{label}</MetricLabel>
        {typeof value === 'string' ? <MetricValue>{value}</MetricValue> : value}
        {typeof caption === 'string' ? (
          <MetricCaption>{caption}</MetricCaption>
        ) : (
          <MetricCaption as="div">{caption}</MetricCaption>
        )}
      </MetricInner>
    </Card>
  );
}

interface ReportPanelProps {
  title: string;
  note?: string;
  /** Optional trailing control in the title row (e.g. search). */
  actions?: ReactNode;
  children: ReactNode;
}

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-300);
  min-width: 0;
  max-width: 100%;

  /* Trailing actions (search, etc.) shrink instead of widening the panel. */
  & > :last-child:not(:only-child) {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 100%;
  }
`;

const SectionNote = styled.p`
  margin: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

export function ReportPanel({ title, note, actions, children }: ReportPanelProps) {
  return (
    <PanelCard>
      <SectionInner>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
          {actions}
        </SectionHeader>
        {note ? <SectionNote>{note}</SectionNote> : null}
        {children}
      </SectionInner>
    </PanelCard>
  );
}

/**
 * Track sizes for `$cols` on ReportTable. Same template on every row so header
 * and body stay aligned. Never use `auto` / `max-content` floors — each cake&
 * row is its own grid, and content-sized tracks misalign across rows.
 *
 * Floors are `0` so columns shrink on narrow viewports; `fr` weights keep
 * relative proportions. Text wraps inside cells instead of widening the page.
 */
export const reportCol = {
  /** GPU, Server, Status, Time — short labels */
  compact: 'minmax(0, 1fr)',
  /** Utilization, Idle hours, $, counts — numeric / medium */
  metric: 'minmax(0, 1.25fr)',
  /** Rule, Scope, Notified, Provider, Why, model name */
  wide: 'minmax(0, 2.5fr)',
  /** Match text, deployment + badge cluster, long prompts */
  widePlus: 'minmax(0, 3.5fr)',
  /** Expand / row icon. Caps growth; can shrink under extreme squeeze. */
  icon: 'minmax(0, var(--space-900))',
} as const;

/** Text-heavy columns grow into leftover width (fallback when $cols is omitted). */
const wideColumnCss = css`
  && {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
  }
`;

/** Short columns hug their content and do not soak up empty space. */
const compactColumnCss = css`
  && {
    flex: 0 1 auto;
    width: auto;
    min-width: 0;
    max-width: 100%;
  }
`;

/**
 * Horizontal cluster for 2+ badges / pills / secondary labels.
 * One row with gap space-200; wraps to another line instead of ellipsis.
 */
export const BadgeGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
  gap: var(--space-200);
  min-width: 0;
  max-width: 100%;

  & > * {
    box-sizing: border-box;
    flex: 0 1 auto;
    min-width: 0;
    max-width: 100%;
  }

  /* cake& Badge is nowrap. Let a long pill wrap inside the column. */
  & > span {
    height: auto;
    white-space: normal;
    text-align: left;
    justify-content: flex-start;
  }
`;

/** Secondary text beside a badge inside BadgeGroup (e.g. deployment name). */
export const CellSecondary = styled.span`
  min-width: 0;
  max-width: 100%;
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  white-space: normal;
`;

type ReportTableProps = {
  /**
   * Shared grid-template-columns for the data cells (not rails). Build from
   * `reportCol` pieces. Same tracks on every row → header/body aligned and
   * the panel width fills without equal-flex gutters.
   */
  $cols?: string;
};

/**
 * Report table. Pass `$cols` from `reportCol` so every row shares the same
 * tracks. Text wraps inside a column instead of ellipsis; row height may grow.
 * WideDataCell / CompactDataCell (and `$wide`) only matter when `$cols` is omitted.
 */
export const ReportTable = styled(Table)<ReportTableProps>`
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;

  /*
    cake& DataRow/HeaderRow reserve 48px rails for checkbox + row action.
    Collapse unused rails so data columns fill the panel.
  */
  &:not(:has([role='checkbox'])) [role='row'] {
    grid-template-columns: 0 minmax(0, 1fr) 0 !important;
  }

  &:has([role='checkbox']) [role='row'] {
    grid-template-columns: var(--space-800) minmax(0, 1fr) 0 !important;
  }

  &:not(:has([role='checkbox'])) [role='row'] > [role='gridcell']:first-child,
  &:not(:has([role='checkbox'])) [role='row'] > [role='columnheader']:first-child,
  [role='row'] > [role='gridcell']:last-child,
  [role='row'] > [role='columnheader']:last-child {
    min-width: 0;
    padding: 0 !important;
    border: none;
    overflow: hidden;
  }

  /*
    Middle run — stretch so every cell shares the row height. cake& DataCells
    paint both border-top and border-bottom; with align-items:center, short
    cells keep their own underline mid-row while tall (wrapping) cells paint
    another at the bottom → thick / double dividers. Stretch + drop top borders
    leaves one even line per row boundary.
  */
  [role='row'] > div:nth-child(2) {
    align-items: stretch;
    width: 100%;
    min-width: 0;
    overflow: visible;
  }

  [role='row'] > div:nth-child(2) > [role='gridcell'] {
    border-top: none;
  }

  ${({ $cols }) =>
    $cols
      ? css`
          [role='row'] > div:nth-child(2) {
            display: grid !important;
            grid-template-columns: ${$cols};
            align-items: stretch;
            column-gap: 0;
          }

          [role='row'] > div:nth-child(2) > [role='columnheader'],
          [role='row'] > div:nth-child(2) > [role='gridcell'] {
            flex: none !important;
            width: auto;
            min-width: 0;
            max-width: 100%;
            overflow: visible;
            white-space: normal;
            align-items: center;
            justify-content: flex-start;
          }
        `
      : css`
          :where([role='row'] > div:nth-child(2) > [role='columnheader']),
          :where([role='row'] > div:nth-child(2) > [role='gridcell']) {
            min-width: 0;
            overflow: visible;
            white-space: normal;
            align-items: center;
            justify-content: flex-start;
          }
        `}

  [role='row'] > div:nth-child(2) > [role='gridcell'] > *:not(button) {
    max-width: 100%;
    min-width: 0;
  }

  /* Long cake& Badge labels wrap inside the column instead of clipping. */
  [role='row'] > div:nth-child(2) > [role='gridcell'] > span,
  [role='row'] > div:nth-child(2) > [role='columnheader'] > span {
    max-width: 100%;
    height: auto;
    overflow: visible;
    white-space: normal;
    text-overflow: unset;
    text-align: left;
    justify-content: flex-start;
  }
`;

/** Short columns — small $cols track. Does not grow when $cols is omitted. */
export const CompactDataCell = styled(DataCell)`
  ${compactColumnCss}
  align-items: center;
`;

/** Text-heavy columns — wide $cols track, or leftover width when $cols is omitted. */
export const WideDataCell = styled(DataCell)`
  ${wideColumnCss}
  align-items: center;
`;

/**
 * Sortable header with optional grow. Pair `$wide` with `WideDataCell` on the
 * same column so header and body stay aligned. Default (no `$wide`) stays compact.
 */
export const SortableHeaderCell = styled(HeaderCell)<{ $wide?: boolean }>`
  cursor: pointer;
  ${({ $wide }) => ($wide ? wideColumnCss : compactColumnCss)}

  /* Unsorted headers pick up primary on hover — sorted already uses active. */
  &:hover > span {
    color: var(--color-primary-primary);
  }
`;
