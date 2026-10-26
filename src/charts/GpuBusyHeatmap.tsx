import styled from 'styled-components';

/**
 * Categorical busy/idle heatmap for a typical 24-hour day.
 * Colors follow the Figma GPU fleet frame (semantic cake& status tokens)
 * and the cake& datavis principle of distinct, mode-stable categorical fills.
 */
export type GpuBusyLevel = 'busy' | 'moderate' | 'idle' | 'unallocated';

export interface GpuBusyRow {
  id: string;
  label: string;
  /** Length 24 — one level per hour 00–23. */
  hours: GpuBusyLevel[];
}

export interface GpuBusyHeatmapProps {
  rows: GpuBusyRow[];
  ariaLabel: string;
}

interface HourSegment {
  level: GpuBusyLevel;
  start: number;
  span: number;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const LABEL_COL = '100px';
/** Shared template so hour ticks and cells share one set of column lines. */
const COLUMNS = `${LABEL_COL} repeat(24, minmax(0, 1fr))`;

const LEVEL_COLOR: Record<GpuBusyLevel, string> = {
  busy: 'var(--color-error-error)',
  moderate: 'var(--color-info-info)',
  idle: 'var(--color-success-success)',
  /*
    Figma uses #edf1f5 for undeployed GPUs. Closest cake& surface token is
    on-container (#f0f0f0); no exact match exists in cake-tokens.
  */
  unallocated: 'var(--color-surfaces-on-container)',
};

const LEVEL_LABEL: Record<Exclude<GpuBusyLevel, 'unallocated'>, string> = {
  busy: 'Busy',
  moderate: 'Moderate',
  idle: 'Idle',
};

/**
 * Collapse consecutive same-level hours into one segment.
 * Avoids 1px gutters inside a color band (which read as double lines at
 * level boundaries when every hour is its own rounded cell).
 */
function segmentsFor(hours: GpuBusyLevel[]): HourSegment[] {
  const segments: HourSegment[] = [];
  for (let index = 0; index < hours.length; index += 1) {
    const level = hours[index];
    const previous = segments[segments.length - 1];
    if (previous && previous.level === level) {
      previous.span += 1;
      continue;
    }
    segments.push({ level, start: index, span: 1 });
  }
  return segments;
}

function levelTitle(level: GpuBusyLevel) {
  return level === 'unallocated' ? 'No deployment' : LEVEL_LABEL[level];
}

const Frame = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-300);
  width: 100%;
`;

const Grid = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
`;

const HourHeader = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  /*
    Figma uses a 1px gutter between columns. Smallest spacing token is 2px.
    Column gap only — shared with data rows so ticks and cells share one line.
  */
  column-gap: 1px;
  align-items: stretch;
  width: 100%;
  height: var(--space-300);
  border-bottom: 1px solid var(--color-stroke-border);
`;

const LabelSpacer = styled.div`
  /* Occupies the label column; no border so the axis rule stays one stroke. */
`;

const HourLabel = styled.span`
  min-width: 0;
  color: var(--color-text-icon-secondary);
  /*
    Figma hour ticks are 9px Inter Bold. cake& caption is 12px; 9px is required
    to fit 24 labels across the plot without clipping.
  */
  font-size: 9px;
  font-weight: var(--font-weight-bold);
  line-height: normal;
  text-align: center;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  column-gap: 1px;
  align-items: stretch;
  width: 100%;
  height: 18.3px;
`;

const RowLabel = styled.span`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding-left: var(--space-075);
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  letter-spacing: 0.2px;
  white-space: nowrap;
`;

const Cell = styled.div<{ $level: GpuBusyLevel; $span: number }>`
  grid-column: span ${({ $span }) => $span};
  min-width: 0;
  height: 17.3px;
  border-radius: var(--radius-50);
  background: ${({ $level }) => LEVEL_COLOR[$level]};
`;

const Legend = styled.ul`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-500);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const LegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: var(--space-050);
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  letter-spacing: 0.2px;
`;

const Swatch = styled.span<{ $level: Exclude<GpuBusyLevel, 'unallocated'> }>`
  width: var(--space-100);
  height: var(--space-100);
  border-radius: 1px;
  background: ${({ $level }) => LEVEL_COLOR[$level]};
`;

export function GpuBusyHeatmap({ rows, ariaLabel }: GpuBusyHeatmapProps) {
  return (
    <Frame role="img" aria-label={ariaLabel}>
      <Grid>
        <HourHeader>
          <LabelSpacer aria-hidden />
          {HOURS.map((hour) => (
            <HourLabel key={hour}>{hour}</HourLabel>
          ))}
        </HourHeader>
        {rows.map((row) => (
          <Row key={row.id}>
            <RowLabel>{row.label}</RowLabel>
            {segmentsFor(row.hours).map((segment) => {
              const endHour = segment.start + segment.span - 1;
              const range =
                segment.span === 1
                  ? `${HOURS[segment.start]}:00`
                  : `${HOURS[segment.start]}:00–${HOURS[endHour]}:00`;
              return (
                <Cell
                  key={`${row.id}-${segment.start}`}
                  $level={segment.level}
                  $span={segment.span}
                  title={`${row.label}, ${range} — ${levelTitle(segment.level)}`}
                />
              );
            })}
          </Row>
        ))}
      </Grid>
      <Legend aria-hidden>
        {(Object.keys(LEVEL_LABEL) as Array<keyof typeof LEVEL_LABEL>).map((level) => (
          <LegendItem key={level}>
            <Swatch $level={level} />
            {LEVEL_LABEL[level]}
          </LegendItem>
        ))}
      </Legend>
    </Frame>
  );
}
