import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import styled from 'styled-components';

const FONT = "'Rookery New','Rookery','Noto Sans',system-ui,sans-serif";

const AXIS = {
  color: '#44464e',
  fontFamily: FONT,
  fontSize: 12,
} as const;

export interface StackedBarSeries {
  name: string;
  data: number[];
  color: string;
  emphasisColor?: string;
}

export interface StackedBarChartProps {
  categories: string[];
  series: StackedBarSeries[];
  /** Canvas height in px. The plot sits inside the cake grid and legend. */
  height?: number;
  yMin?: number;
  yMax?: number;
  yInterval?: number;
  /** Printed above each bar. Defaults to the sum of the visible series. */
  totals?: number[];
  /** Format the value printed above each bar. Defaults to one decimal place. */
  formatLabel?: (value: number) => string;
  /** Format y-axis tick labels. Defaults to the raw numeric value. */
  formatAxisLabel?: (value: number) => string;
  /** When false, bars are not stacked (side-by-side / one series per category). */
  stacked?: boolean;
  /** Hide the legend when categories already name each bar. */
  showLegend?: boolean;
  /** Cap individual bar width. Defaults to 72. */
  barMaxWidth?: number;
  /**
   * When false, hide y-axis labels and horizontal grid lines
   * (Figma Intelligent routing uses a baseline-only plot).
   */
  showYAxis?: boolean;
  ariaLabel: string;
}

const Frame = styled.div<{ $height: number }>`
  width: 100%;
  height: ${({ $height }) => $height}px;
`;

function formatTotal(value: number) {
  return value.toFixed(1);
}

function buildOption({
  categories,
  series,
  yMin,
  yMax,
  yInterval,
  totals,
  formatLabel = formatTotal,
  formatAxisLabel,
  stacked = true,
  showLegend = true,
  barMaxWidth = 72,
  showYAxis = true,
}: Omit<StackedBarChartProps, 'height' | 'ariaLabel'>): echarts.EChartsOption {
  const barTotals =
    totals ??
    categories.map((_, index) => series.reduce((sum, item) => sum + (item.data[index] ?? 0), 0));
  const labelSeriesIndex = stacked ? series.length - 1 : 0;

  return {
    textStyle: { fontFamily: FONT },
    color: series.map((item) => item.color),
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    animationDelay: (index) => index * 40,
    grid: {
      left: 8,
      right: 16,
      top: 28,
      bottom: showLegend ? 40 : 16,
      containLabel: true,
      /* Avoid a second stroke around the plot from the grid frame. */
      borderWidth: 0,
      show: false,
    },
    tooltip: {
      show: true,
      backgroundColor: '#121318',
      borderColor: '#eeeeee',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: '#ffffff',
        fontFamily: FONT,
        fontSize: 12,
      },
      extraCssText:
        'border-radius:12px;box-shadow:0 2px 16px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.05);',
      trigger: 'axis',
      /*
        Shadow bands read as extra vertical rules between bars. Figma only
        has the left value axis + horizontal grids — use a thin line pointer.
      */
      axisPointer: { type: 'line', lineStyle: { color: '#e3e3e3', width: 1 } },
    },
    legend: {
      show: showLegend,
      type: 'scroll',
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 24,
      textStyle: AXIS,
      data: series.map((item) => item.name),
      bottom: 0,
      left: 0,
    },
    xAxis: {
      type: 'category',
      data: categories,
      /*
        Figma (Alerts / Cost by model): date labels only — no category
        ticks, split lines, or second baseline. Floor = y-axis 0 gridline.
      */
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: AXIS,
      splitLine: { show: false },
      splitArea: { show: false },
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      interval: yInterval,
      /*
        One vertical value axis. Horizontal grids are a single lighter
        stroke so they don't stack on the axis line.
      */
      axisLine: showYAxis
        ? { show: true, onZero: false, lineStyle: { color: '#e3e3e3', width: 1 } }
        : { show: false },
      /*
        Ticks and minor ticks sit on the same x as the axis line and read as
        a second vertical stroke. The axis line is the only vertical rule.
      */
      axisTick: { show: false, length: 0 },
      minorTick: { show: false },
      minorSplitLine: { show: false },
      axisLabel: {
        show: showYAxis,
        ...AXIS,
        ...(formatAxisLabel
          ? { formatter: (value: number) => formatAxisLabel(value) }
          : {}),
      },
      /*
        One horizontal grid color. A darker first line stacked on the
        baseline and painted the floor twice.
      */
      splitLine: {
        show: showYAxis,
        lineStyle: { color: '#eeeeee', width: 1 },
      },
    },
    series: series.map((item, seriesIndex) => ({
      type: 'bar' as const,
      name: item.name,
      ...(stacked ? { stack: 'total' } : {}),
      barMaxWidth,
      /*
        Figma Alerts bars are ~51px in ~89px categories (~40% gap). A tighter
        gap let Aug 9–10 abut into a dark seam that read as a double rule.
      */
      barCategoryGap: '40%',
      barGap: '20%',
      itemStyle: {
        color: item.color,
        borderRadius: 0,
        borderWidth: 0,
      },
      emphasis: {
        focus: 'self' as const,
        itemStyle: { color: item.emphasisColor ?? item.color },
      },
      label: {
        show: stacked ? seriesIndex === labelSeriesIndex : true,
        position: 'top' as const,
        color: '#44464e',
        fontFamily: FONT,
        fontSize: 14,
        formatter: (params: { dataIndex: number; value?: unknown }) => {
          if (stacked) return formatLabel(barTotals[params.dataIndex] ?? 0);
          const numeric = typeof params.value === 'number' ? params.value : Number(params.value ?? 0);
          return formatLabel(Number.isFinite(numeric) ? numeric : 0);
        },
      },
      data: item.data,
    })),
  };
}

export function StackedBarChart({
  categories,
  series,
  height = 320,
  yMin,
  yMax,
  yInterval,
  totals,
  formatLabel,
  formatAxisLabel,
  stacked = true,
  showLegend = true,
  barMaxWidth,
  showYAxis = true,
  ariaLabel,
}: StackedBarChartProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const chart = echarts.init(frame);
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(frame);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(
      buildOption({
        categories,
        series,
        yMin,
        yMax,
        yInterval,
        totals,
        formatLabel,
        formatAxisLabel,
        stacked,
        showLegend,
        barMaxWidth,
        showYAxis,
      }),
      true,
    );
  }, [
    categories,
    series,
    yMin,
    yMax,
    yInterval,
    totals,
    formatLabel,
    formatAxisLabel,
    stacked,
    showLegend,
    barMaxWidth,
    showYAxis,
  ]);

  return <Frame ref={frameRef} $height={height} role="img" aria-label={ariaLabel} />;
}
