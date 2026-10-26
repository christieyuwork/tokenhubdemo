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
}: Omit<StackedBarChartProps, 'height' | 'ariaLabel'>): echarts.EChartsOption {
  const barTotals =
    totals ??
    categories.map((_, index) => series.reduce((sum, item) => sum + (item.data[index] ?? 0), 0));

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
      bottom: 40,
      containLabel: true,
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
      axisPointer: { type: 'shadow' },
    },
    legend: {
      show: true,
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
      axisLine: { lineStyle: { color: '#e3e3e3' } },
      axisTick: { lineStyle: { color: '#e3e3e3' } },
      axisLabel: AXIS,
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      interval: yInterval,
      axisLine: { show: true, lineStyle: { color: '#e3e3e3' } },
      axisTick: { show: true, lineStyle: { color: '#e3e3e3' } },
      axisLabel: AXIS,
      splitLine: { lineStyle: { color: '#eeeeee' } },
    },
    series: series.map((item, seriesIndex) => ({
      type: 'bar' as const,
      name: item.name,
      stack: 'total',
      barMaxWidth: 52,
      itemStyle: {
        color: item.color,
        borderRadius: 0,
        borderColor: '#ffffff',
        borderWidth: 1,
      },
      emphasis: {
        focus: 'self' as const,
        itemStyle: { color: item.emphasisColor ?? item.color },
      },
      label: {
        show: seriesIndex === series.length - 1,
        position: 'top' as const,
        color: '#44464e',
        fontFamily: FONT,
        fontSize: 14,
        formatter: (params: { dataIndex: number }) => formatTotal(barTotals[params.dataIndex] ?? 0),
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
      buildOption({ categories, series, yMin, yMax, yInterval, totals }),
      true,
    );
  }, [categories, series, yMin, yMax, yInterval, totals]);

  return <Frame ref={frameRef} $height={height} role="img" aria-label={ariaLabel} />;
}
