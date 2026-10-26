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
  side gutters 48 left / 36 right live on Page; switcher and content keep
  vertical pad only (24); section gap 16. Subpages must not add competing
  horizontal padding.
*/
const Page = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  /*
    cake& Scrollbar sizes a display:table wrapper to content.
    width:0 + min-width:100% fills the scrollport without letting
    wide filters/tables inflate the page past the frame.
  */
  width: 0;
  min-width: 100%;
  max-width: 100%;
  /* 48 — nav → content; 36 — content → scrollbar */
  padding-left: var(--space-800);
  padding-right: var(--space-650);
`;

const SwitcherRow = styled.div`
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: var(--space-500) 0 0;
`;

const Content = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: var(--space-500) 0;
  /* Split-screen / sidebar: MetricGrid queries this, not the viewport. */
  container-type: inline-size;
  container-name: report-content;

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
  /* Split-screen: filter stack queries the hero card width, not the viewport. */
  container-type: inline-size;
  container-name: report-header;

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
  width: 100%;
  /* Filters stay on the bottom edge when the subtitle wraps to a second line. */
  align-items: flex-end;
  /*
    flex-start + Filters margin-left:auto pins the cluster to the padded right
    edge. space-between left a trailing gap after Filters (worse after the
    260px max-width made the cluster narrower).
  */
  justify-content: flex-start;
  gap: var(--space-500);
  padding: var(--space-500);
  min-width: 0;
  /*
    Default banner matches Figma (~115). Grows when the subtitle wraps so the
    second line is not clipped; MetricGrid only shifts on pages that wrap.
  */
  min-height: ${HEADER_BANNER_HEIGHT};

  @container report-header (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Titles = styled.div`
  display: flex;
  /*
    Absorb free space so the filter cluster stays pinned to the right and the
    subtitle has a real wrap width.
  */
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
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
  /* Wrap instead of truncating; clamp at two lines so the banner cannot blow open. */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`;

/** ~260px — longest closed filter width before a long option blows the row. */
const FILTER_MAX_WIDTH = `calc(var(--space-1000) * 3 + var(--space-400))`;

const Filters = styled.div`
  display: flex;
  flex: 0 1 auto;
  flex-wrap: nowrap;
  align-items: flex-end;
  justify-content: flex-start;
  /* Push the cluster to the hero’s padded right edge; leftover sits before it. */
  margin-left: auto;
  /* Shrink-wrap to capped children so no empty track sits after Rule. */
  width: max-content;
  /*
    One uniform gap between every adjacent filter (Date, Grain, Provider, …).
    Children must not grow or leftover width opens uneven tracks between them.
  */
  gap: var(--space-200);
  min-width: 0;
  max-width: 100%;
  /* Figma filter row: label (body) + 8 gap + 40 control = 67. */
  height: calc((var(--type-size-body) * 1.35) + var(--space-100) + var(--space-700));

  /*
    Date + Dropdowns size to their visible control, capped so a long option
    label (e.g. Intelligent routing Rule) cannot blow past ~260px
    (space-1000 × 3 + space-400) or the filter row width.
  */
  & > * {
    flex: 0 1 auto;
    width: min(max-content, ${FILTER_MAX_WIDTH});
    min-width: 0;
    max-width: min(100%, ${FILTER_MAX_WIDTH});
  }

  /*
    Closed trigger only. Height is the cake& control (40px / space-700) so the
    selected value cannot wrap or spill out of the field. Left-align the value
    so short labels like "All" do not look centered in a wide sizer field.
  */
  & [role='combobox'] {
    box-sizing: border-box;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: var(--space-700);
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-align: left;
  }

  & [role='combobox'] > span:first-child {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
  }

  & [role='combobox'] > span:last-child {
    flex: 0 0 auto;
  }

  /* Title above; filters wrap two-up under the titles. */
  @container report-header (max-width: 720px) {
    margin-left: 0;
    width: 100%;
    max-width: 100%;
    height: auto;
    flex-wrap: wrap;

    & > * {
      flex: 1 1 calc((100% - var(--space-200)) / 2);
      width: auto;
      max-width: 100%;
    }
  }

  /* One filter per line. */
  @container report-header (max-width: 480px) {
    & > * {
      flex: 1 1 100%;
    }
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
    Prefer the sizer's max-content width, capped at ~260px. Use min() on width
    (not only max-width) so the flex parent's intrinsic size matches the capped
    used width — otherwise Filters stays ~uncapped wide and leaves empty space
    after a long Rule label.
  */
  grid-template-columns: minmax(0, max-content);
  justify-items: stretch;
  box-sizing: border-box;
  width: min(max-content, ${FILTER_MAX_WIDTH});
  max-width: min(100%, ${FILTER_MAX_WIDTH});
  min-width: 0;
  overflow: hidden;

  > [data-filter-sizer='true'] {
    grid-area: 1 / 1;
    box-sizing: border-box;
    visibility: hidden;
    pointer-events: none;
    white-space: nowrap;
    /*
      Cap the sizer so max-content matches the field max-width. Without this,
      Filters' intrinsic width stays at the uncapped label (~383px) while the
      trigger renders at 260px — leaving empty space after Rule.
    */
    max-width: ${FILTER_MAX_WIDTH};
    overflow: hidden;
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

  @container report-content (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @container report-content (max-width: 480px) {
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
      <Page>
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
      </Page>
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

  /* Trailing actions keep their own width (e.g. 320px search); only shrink if needed. */
  & > :last-child:not(:only-child) {
    flex: 0 1 auto;
    min-width: 0;
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
 * Token floors keep columns readable; when the panel is narrower than the sum
 * of floors, TableScroll shows a horizontal scrollbar instead of crushing text.
 * `fr` weights keep relative proportions on wide panels.
 */
export const reportCol = {
  /** GPU, Server, Status, Time — short labels */
  compact: 'minmax(var(--space-1000), 1fr)',
  /** Utilization, Idle hours, $, counts — numeric / medium */
  metric: 'minmax(calc(var(--space-1000) + var(--space-200)), 1.25fr)',
  /** Rule, Scope, Notified, Provider, Why, model name */
  wide: 'minmax(calc(var(--space-1000) * 2), 2.5fr)',
  /** Match text, deployment + badge cluster, long prompts */
  widePlus: 'minmax(calc(var(--space-1000) * 3), 3.5fr)',
  /** Expand / row icon. */
  icon: 'minmax(var(--space-700), var(--space-900))',
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

type ReportTableStyledProps = {
  /**
   * Shared grid-template-columns for the data cells (not rails). Build from
   * `reportCol` pieces. Same tracks on every row → header/body aligned and
   * the panel width fills without equal-flex gutters.
   */
  $cols?: string;
};

/**
 * Scrollport for ReportTable. PageScroll keeps overflow-x:hidden on the page;
 * wide column floors scroll here inside the panel instead.
 */
const TableScroll = styled.div`
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
`;

/**
 * Inner cake& Table. Pass `$cols` from `reportCol` so every row shares the same
 * tracks. Text wraps inside a readable floor; when floors exceed the panel,
 * TableScroll shows a horizontal scrollbar.
 * WideDataCell / CompactDataCell (and `$wide`) only matter when `$cols` is omitted.
 */
const StyledReportTable = styled(Table)<ReportTableStyledProps>`
  box-sizing: border-box;
  width: 100%;
  /* Grow with column floors so TableScroll can overflow; fill when roomy. */
  min-width: min-content;

  /*
    cake& DataRow/HeaderRow reserve 48px rails for checkbox + row action.
    Collapse unused rails so data columns fill the panel. min-content on the
    middle track lets reportCol floors drive horizontal overflow.
  */
  &:not(:has([role='checkbox'])) [role='row'] {
    grid-template-columns: 0 minmax(min-content, 1fr) 0 !important;
  }

  &:has([role='checkbox']) [role='row'] {
    grid-template-columns: var(--space-800) minmax(min-content, 1fr) 0 !important;
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
    min-width: min-content;
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

type ReportTableProps = ComponentProps<typeof StyledReportTable>;

/**
 * Report table with an internal horizontal scrollport. Same `$cols` / children
 * API as before — pages do not need to wrap it themselves.
 */
export function ReportTable(props: ReportTableProps) {
  return (
    <TableScroll>
      <StyledReportTable {...props} />
    </TableScroll>
  );
}

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
