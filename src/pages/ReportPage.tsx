import { useMemo, type ComponentProps, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  ContentSwitcher,
  DataCell,
  Dropdown,
  HeaderCell,
  Scrollbar,
  Table,
} from '@cake-admin/cakeand';
import styled, { createGlobalStyle, css } from 'styled-components';

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
  gap: var(--space-200);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: var(--space-400) 0;
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
    Title block takes remaining space and must not be crushed below a readable
    width — filters shrink / wrap first.
  */
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-width: min(100%, calc(var(--space-1000) * 2));
  max-width: 100%;
`;

const Title = styled.h1`
  margin: 0;
  color: var(--color-text-icon-on-primary);
  font-size: var(--type-size-page);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
  /* Full title always wins over filter width — wrap rather than ellipsize. */
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  white-space: normal;
`;

/** Wraps the gradient banner + optional CTA row so Content gap stays outside. */
const HeaderStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-200);
  width: 100%;
  min-width: 0;
`;

/**
 * Row just below the gradient banner: optional leading meta on the left,
 * CTAs right-justified via HeaderActionGroup.
 */
export const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-200);
  width: 100%;
  min-width: 0;
`;

/** Leading status / summary strip that shares the below-banner row with CTAs. */
export const HeaderMeta = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-200);
  min-width: 0;
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
`;

export const HeaderMetaStrong = styled.span`
  color: var(--color-text-icon-primary);
  font-weight: var(--font-weight-bold);
`;

/** Keeps below-banner CTAs clustered and pinned to the trailing edge. */
export const HeaderActionGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-200);
  margin-left: auto;
  flex: 0 0 auto;
  min-width: 0;
`;

/**
 * Secondary outline CTA for the row below the gradient banner (canvas surface).
 */
export const HeaderActionButton = styled(Button).attrs({
  size: 'sm',
  intent: 'secondary',
  variant: 'outline',
})``;

/** @deprecated Prefer HeaderActionButton — same secondary outline below the banner. */
export const HeaderOutlineButton = HeaderActionButton;

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

/**
 * Cap closed filter width so the hero title keeps room. Each dropdown locks to
 * its longest option (stable across selection); long selected labels ellipsize
 * inside that fixed width instead of resizing the field.
 */
const FILTER_MAX_WIDTH = `calc(var(--space-1000) * 2 + var(--space-500))`;

/**
 * Shared DateInput range width on every report header — one size app-wide.
 * Tightest token fit for two MM/DD/YY fields + em dash + calendar chrome
 * (label-field left pad + borders included).
 */
const FILTER_DATE_WIDTH = `calc(var(--space-1000) * 2 + var(--space-900))`;

/** Floor for each MM/DD/YY input so the placeholder never collapses. */
const FILTER_DATE_FIELD_MIN = `calc(var(--space-900) + var(--space-200))`;

/** 12px gutters between every adjacent filter control. */
const FILTER_GUTTER = `var(--space-200)`;

/**
 * cake& Dropdown portals the listbox to document.body — style open menus here
 * so long options wrap with tight spacing and clear dividers between items.
 */
const ReportDropdownMenuStyles = createGlobalStyle`
  /*
    Closed triggers hug the selected value (often “All”), but the open menu
    must stay readable — don’t inherit a tiny trigger width.
  */
  [role='listbox'] {
    box-sizing: border-box;
    width: max-content;
    min-width: max(
      var(--radix-select-trigger-width, 0px),
      calc(var(--space-1000) * 2 + var(--space-500))
    );
    max-width: min(90vw, calc(var(--space-1000) * 4));
  }

  [role='listbox'] [role='option'] {
    box-sizing: border-box;
    align-items: flex-start;
    height: auto;
    min-height: var(--space-700);
    white-space: normal;
    overflow-wrap: anywhere;
    /* Tight rhythm — dividers carry separation, not large gaps. */
    padding-block: var(--space-100);
    padding-inline: var(--space-100);
    gap: var(--space-025);
    border-radius: 0;
  }

  [role='listbox'] [role='option'] + [role='option'] {
    border-top: var(--stroke-100) solid var(--color-stroke-border);
  }

  [role='listbox'] [role='option']:first-child {
    border-top-left-radius: var(--radius-200);
    border-top-right-radius: var(--radius-200);
  }

  [role='listbox'] [role='option']:last-child {
    border-bottom-left-radius: var(--radius-200);
    border-bottom-right-radius: var(--radius-200);
  }
`;

/**
 * Full-width filter strip under the title/description inside the gradient
 * banner (Routing decisions and other dense filter sets).
 */
const FiltersBelow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  /* Row gap needs more room than the inline gutter when Date range wraps under Search. */
  column-gap: ${FILTER_GUTTER};
  row-gap: var(--space-300);
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 0 var(--space-500) var(--space-500);

  /* Search / free-text grows; dropdowns keep locked widths. */
  & > *:has(input:not([placeholder='MM/DD/YY'])) {
    flex: 1 1 calc(var(--space-1000) * 3);
    min-width: min(100%, calc(var(--space-1000) * 2));
    max-width: 100%;
  }

  & > *:has(input[placeholder='MM/DD/YY']) {
    flex: 0 1 auto;
    box-sizing: border-box;
    width: ${FILTER_DATE_WIDTH};
    min-width: min(100%, ${FILTER_DATE_WIDTH});
    max-width: 100%;
  }

  & > *:has(input[placeholder='MM/DD/YY']) > * {
    box-sizing: border-box;
    width: 100%;
    max-width: none;
    align-items: stretch;
  }

  & > *:has(input[placeholder='MM/DD/YY']) *:has(> input[placeholder='MM/DD/YY']) {
    box-sizing: border-box;
    width: 100%;
    max-width: none;
    flex: 1 1 auto;
  }

  & > *:has(input[placeholder='MM/DD/YY']) input[placeholder='MM/DD/YY'] {
    box-sizing: border-box;
    flex: 1 1 0;
    width: auto;
    min-width: ${FILTER_DATE_FIELD_MIN};
  }

  & > :not(:has(input)) {
    flex: 0 1 auto;
    min-width: 0;
    max-width: min(100%, ${FILTER_MAX_WIDTH});
  }

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
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
  }

  & [role='combobox'] > span:last-child {
    flex: 0 0 auto;
    align-self: center;
  }

  @container report-header (max-width: 720px) {
    & > *:has(input[placeholder='MM/DD/YY']) {
      flex: 1 1 100%;
      width: 100%;
      min-width: 0;
    }

    & > :not(:has(input)) {
      flex: 1 1 calc((100% - ${FILTER_GUTTER}) / 2);
      max-width: 100%;
    }
  }

  @container report-header (max-width: 480px) {
    & > * {
      flex: 1 1 100%;
      width: auto;
      min-width: 0;
      max-width: 100%;
    }
  }
`;

const Filters = styled.div`
  display: flex;
  flex: 0 1 auto;
  flex-wrap: nowrap;
  align-items: flex-end;
  justify-content: flex-start;
  /* Push the cluster to the hero’s padded right edge; leftover sits before it. */
  margin-left: auto;
  /* Shrink-wrap to each field’s locked width (date / longest option). */
  width: max-content;
  /* 12px gutters between every adjacent filter — same on every subpage. */
  gap: ${FILTER_GUTTER};
  min-width: 0;
  max-width: min(75%, 100%);

  /*
    DateInput range — one fixed width app-wide. cake& leaves field min-width:0
    so MM/DD/YY collapses; stretch the labeled column + input row, then split
    the room evenly across the two date fields.
  */
  & > *:has(input[placeholder='MM/DD/YY']) {
    flex: 0 0 auto;
    box-sizing: border-box;
    width: ${FILTER_DATE_WIDTH};
    min-width: ${FILTER_DATE_WIDTH};
    max-width: ${FILTER_DATE_WIDTH};
  }

  & > *:has(input[placeholder='MM/DD/YY']) > * {
    box-sizing: border-box;
    width: 100%;
    max-width: none;
    align-items: stretch;
  }

  & > *:has(input[placeholder='MM/DD/YY']) *:has(> input[placeholder='MM/DD/YY']) {
    box-sizing: border-box;
    width: 100%;
    max-width: none;
    flex: 1 1 auto;
  }

  & > *:has(input[placeholder='MM/DD/YY']) input[placeholder='MM/DD/YY'] {
    box-sizing: border-box;
    flex: 1 1 0;
    width: auto;
    min-width: ${FILTER_DATE_FIELD_MIN};
  }

  /* Dropdowns: width locked by FilterDropdownField sizer — do not flex-grow. */
  & > :not(:has(input[placeholder='MM/DD/YY'])) {
    flex: 0 1 auto;
    min-width: 0;
    max-width: min(100%, ${FILTER_MAX_WIDTH});
  }

  /*
    Closed trigger — fixed height, left-aligned. Selected value ellipsizes
    inside the locked width so picking a longer option never resizes the field.
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
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
  }

  & [role='combobox'] > span:last-child {
    flex: 0 0 auto;
    align-self: center;
  }

  /* Title above; filters wrap — date range keeps a full row when tight. */
  @container report-header (max-width: 720px) {
    margin-left: 0;
    width: 100%;
    max-width: 100%;
    flex-wrap: wrap;
    gap: ${FILTER_GUTTER};

    & > *:has(input[placeholder='MM/DD/YY']) {
      flex: 1 1 100%;
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }

    & > *:has(input[placeholder='MM/DD/YY']) > *,
    & > *:has(input[placeholder='MM/DD/YY']) *:has(> input[placeholder='MM/DD/YY']) {
      width: 100%;
      max-width: none;
    }

    & > :not(:has(input[placeholder='MM/DD/YY'])) {
      flex: 1 1 calc((100% - ${FILTER_GUTTER}) / 2);
      width: auto;
      min-width: 0;
      max-width: 100%;
    }
  }

  /* One filter per line. */
  @container report-header (max-width: 480px) {
    & > * {
      flex: 1 1 100%;
      width: auto;
      min-width: 0;
      max-width: 100%;
    }
  }
`;

/**
 * Locks the closed Dropdown width to the longest option label (capped). Width
 * stays constant as the selection changes; the visible value ellipsizes inside.
 */
const FilterDropdownField = styled.div`
  display: inline-grid;
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
    max-width: ${FILTER_MAX_WIDTH};
    overflow: hidden;
    /*
      Mirror cake& trigger + Select.Value chrome:
      trigger pad (space-200) + Value pad (space-100) on the start;
      Value pad + gap (space-100) + 24px chevron (space-500) + trigger pad on the end.
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

/**
 * Report-header Dropdown with a stable width: sized once to the longest option
 * (capped), so changing the selection never resizes the trigger.
 */
export function ReportFilterDropdown({
  options = [],
  placeholder,
  value,
  ...props
}: ReportFilterDropdownProps) {
  const sizerLabel = useMemo(() => {
    const labels = options.map((option) => option.label);
    if (placeholder) labels.push(placeholder);
    return labels.reduce(
      (longest, label) => (label.length > longest.length ? label : longest),
      'All',
    );
  }, [options, placeholder]);

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
  gap: var(--space-200);
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
  gap: var(--space-050);
  padding: var(--space-300) var(--space-400);
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
  gap: var(--space-200);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: var(--space-400);

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
  /**
   * `end` — filters sit beside the title (default report pages).
   * `below` — filters sit under the title inside the same blue banner.
   */
  filtersPlacement?: 'end' | 'below';
  /** Optional leading summary on the below-banner row (shares the line with actions). */
  meta?: ReactNode;
  /** Optional CTAs rendered just below the banner, right-justified (e.g. Add rate). */
  actions?: ReactNode;
}

export function ReportHeader({
  title,
  description,
  filters,
  filtersPlacement = 'end',
  meta,
  actions,
}: ReportHeaderProps) {
  const showActionRow = Boolean(meta || actions);
  const filtersBelow = filtersPlacement === 'below';

  return (
    <HeaderStack>
      <HeaderCard>
        <ReportDropdownMenuStyles />
        <HeaderInner>
          <Titles>
            <Title>{title}</Title>
            <Description>{description}</Description>
          </Titles>
          {filters && !filtersBelow ? <Filters>{filters}</Filters> : null}
        </HeaderInner>
        {filters && filtersBelow ? (
          <FiltersBelow role="search" aria-label="Decision filters">
            {filters}
          </FiltersBelow>
        ) : null}
      </HeaderCard>
      {showActionRow ? (
        <HeaderActions>
          {meta ? <HeaderMeta>{meta}</HeaderMeta> : null}
          {actions ? <HeaderActionGroup>{actions}</HeaderActionGroup> : null}
        </HeaderActions>
      ) : null}
    </HeaderStack>
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
  align-items: flex-start;
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

const SectionIntro = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-100);
  min-width: 0;
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
          <SectionIntro>
            <SectionTitle>{title}</SectionTitle>
            {note ? <SectionNote>{note}</SectionNote> : null}
          </SectionIntro>
          {actions}
        </SectionHeader>
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
  /** Utilization, Idle hours, Temperature, $, counts — numeric / medium */
  metric: 'minmax(calc(var(--space-1000) + var(--space-500)), 1.25fr)',
  /** Rule, Scope, Notified, Provider, Why, model name */
  wide: 'minmax(calc(var(--space-1000) * 2), 2.5fr)',
  /** Match text, deployment + badge cluster, long prompts */
  widePlus: 'minmax(calc(var(--space-1000) * 3), 3.5fr)',
  /** Row actions / expand control — wide enough for an "Actions" header. */
  icon: 'minmax(var(--space-1000), var(--space-1000))',
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
 * cake& Badge is single-line (nowrap, zero block padding, radius-1000 capsule).
 * In dense tables a long label must wrap inside the column — a full pill radius
 * then reads as a stretched oval, so CellBadge uses a rounded-rect radius
 * instead. Shared by CellBadge / ValueBadge so every wrapping label matches.
 */
const wrappingBadgeCss = css`
  box-sizing: border-box;
  width: fit-content;
  max-width: 100%;
  /* Do not inherit the table's min-width:0 — that shrinks short labels and splits words. */
  min-width: min-content;
  height: auto;
  /* cake& uses padding: 0 inline-only; block pad keeps wrapped glyphs inside the wash. */
  padding-block: var(--space-050);
  padding-inline: var(--space-100);
  /* Rounded rect — keeps multi-line labels from becoming stadium ovals. */
  border-radius: var(--radius-150);
  overflow: hidden;
  white-space: normal;
  /* Prefer wrapping at spaces; only break long tokens when the column is tighter. */
  overflow-wrap: break-word;
  word-break: normal;
  text-overflow: unset;
  text-align: left;
  justify-content: flex-start;
  align-items: center;
  line-height: 1.35;
`;

/**
 * Table / dense-layout Badge. Prefer this over raw cake& Badge anywhere a
 * label can wrap or sit in a constrained column.
 * Secondary (gray) washes carry no meaning — drop the fill and read as text.
 */
export const CellBadge = styled(Badge)`
  && {
    ${wrappingBadgeCss}

    ${({ color = 'primary', tone = 'solid' }) =>
      color === 'secondary' && tone === 'subtle'
        ? css`
            background: transparent;
            padding-block: 0;
            padding-inline: 0;
            border-radius: 0;
            font-weight: var(--font-weight-medium);
            color: var(--color-text-icon-primary);

            :root[data-theme='win hct'] &,
            [data-theme='win hct'] & {
              background: transparent;
              color: var(--color-text-icon-primary);
            }
          `
        : null}
  }
`;

/** Plain table value — secondary CellBadge with no gray fill. */
export function ValueBadge({ children }: { children: ReactNode }) {
  return (
    <CellBadge color="secondary" tone="subtle" dot={false}>
      {children}
    </CellBadge>
  );
}

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
            /* Beat cake& DataCell/HeaderCell align-items:center. */
            align-items: flex-start !important;
            justify-content: flex-start !important;
            text-align: left;
          }
        `
      : css`
          :where([role='row'] > div:nth-child(2) > [role='columnheader']),
          :where([role='row'] > div:nth-child(2) > [role='gridcell']) {
            min-width: 0;
            overflow: visible;
            white-space: normal;
            align-items: flex-start !important;
            justify-content: flex-start !important;
            text-align: left;
          }
        `}

  /* Non-span content (groups, stacks) can shrink; pills set their own min-width. */
  [role='row'] > div:nth-child(2) > [role='gridcell'] > *:not(button):not(span) {
    max-width: 100%;
    min-width: 0;
  }

  /*
    Plain DataCell / HeaderCell text spans wrap instead of ellipsis.
    Pills use CellBadge (own wrapping rules).
  */
  [role='row'] > div:nth-child(2) > [role='gridcell'] > span,
  [role='row'] > div:nth-child(2) > [role='columnheader'] > span {
    max-width: 100%;
    height: auto;
    white-space: normal;
    text-overflow: unset;
    overflow: visible;
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

  && {
    justify-content: flex-start;
    align-items: flex-start;
    text-align: left;
  }
`;

/**
 * Tighter row padding for information-dense operational tables (routing
 * candidates, policy catalogs). Wraps ReportTable; does not invent a new table.
 */
export const CompactTableShell = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;

  [role='row'] > div:nth-child(2) > [role='gridcell'],
  [role='row'] > div:nth-child(2) > [role='columnheader'] {
    padding-block: var(--space-100) !important;
    min-height: var(--space-700);
    justify-content: flex-start;
    align-items: flex-start;
    text-align: left;
  }
`;

/**
 * Expandable table row group (Cost by Trace, Routing decisions).
 * Collapsed: display:contents so zebra rows stay in table flow.
 * Expanded: frames the summary row + detail panel as one focused unit.
 */
export const ExpandableRowGroup = styled.div<{ $expanded?: boolean }>`
  ${({ $expanded }) =>
    $expanded
      ? css`
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          margin-block: var(--space-150);
          overflow: hidden;
          border: var(--stroke-100) solid var(--color-stroke-border);
          border-left: var(--stroke-300) solid var(--color-primary-primary);
          border-radius: var(--radius-150);
          background: var(--color-surfaces-container);
          box-shadow: var(--elevation-1);
        `
      : css`
          display: contents;
        `}
`;

/** Detail block under an expanded summary row. Pair with ExpandableRowGroup. */
export const ExpandDetailPanel = styled.div<{ $compact?: boolean }>`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${({ $compact }) => ($compact ? 'var(--space-100)' : 'var(--space-300)')};
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: ${({ $compact }) =>
    $compact
      ? 'var(--space-150) var(--space-300) var(--space-150) var(--space-700)'
      : 'var(--space-300) var(--space-300) var(--space-300) var(--space-800)'};
  border-top: var(--stroke-100) solid var(--color-stroke-border-low);
  background: var(--color-surfaces-on-container);
`;

/** Text-heavy columns — wide $cols track, or leftover width when $cols is omitted. */
export const WideDataCell = styled(DataCell)`
  ${wideColumnCss}

  && {
    justify-content: flex-start;
    align-items: flex-start;
    text-align: left;
  }
`;

/**
 * Pill + trailing note in one cell (e.g. routing status · reason).
 * Left + top aligned; wraps as a unit instead of centering the pill.
 */
export const CellBadgeCluster = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
  gap: var(--space-100);
  min-width: 0;
  max-width: 100%;
`;

/**
 * Sortable header with optional grow. Pair `$wide` with `WideDataCell` on the
 * same column so header and body stay aligned. Default (no `$wide`) stays compact.
 */
export const SortableHeaderCell = styled(HeaderCell)<{ $wide?: boolean }>`
  cursor: pointer;
  ${({ $wide }) => ($wide ? wideColumnCss : compactColumnCss)}

  && {
    justify-content: flex-start;
    align-items: flex-start;
    text-align: left;
  }

  /* Unsorted headers pick up primary on hover — sorted already uses active. */
  &:hover > span {
    color: var(--color-primary-primary);
  }
`;
