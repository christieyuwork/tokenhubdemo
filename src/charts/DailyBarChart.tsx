import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import styled from 'styled-components';

const FONT = "'Rookery New','Rookery','Noto Sans',system-ui,sans-serif";

const AXIS = {
  color: '#44464e',
  fontFamily: FONT,
  fontSize: 12,
} as const;

export interface DailyBarChartProps {
  categories: string[];
  values: number[];
  colors: string[];
  height?: number;
  yMin?: number;
  yMax?: number;
  yInterval?: number;
  barMaxWidth?: number;
  formatLabel?: (value: number) => string;
  ariaLabel: string;
}

const Frame = styled.div<{ $height: number }>`
  width: 100%;
  height: ${({ $height }) => $height}px;
`;

function formatDefault(value: number) {
  return value.toFixed(1);
}

function buildOption({
  categories,
  values,
  colors,
  yMin,
  yMax,
  yInterval,
  barMaxWidth = 54,
  formatLabel = formatDefault,
}: Omit<DailyBarChartProps, 'height' | 'ariaLabel'>): echarts.EChartsOption {
  return {
    textStyle: { fontFamily: FONT },
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    animationDelay: (index) => index * 40,
    grid: {
      left: 8,
      right: 8,
      top: 28,
      bottom: 8,
      containLabel: true,
      show: false,
      borderWidth: 0,
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
        Line pointer — shadow bands read as extra vertical rules between bars.
      */
      axisPointer: { type: 'line', lineStyle: { color: '#e3e3e3', width: 1 } },
    },
    xAxis: {
      type: 'category',
      data: categories,
      /*
        No category separators — Figma only has the left value axis + horizontal grids.
        Baseline comes from the y-axis 0 gridline (first splitLine color below).
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
        One vertical axis line; ticks off so they don't thicken into a double stroke.
        First horizontal grid matches the axis color (baseline); the rest are lighter.
      */
      axisLine: { show: true, lineStyle: { color: '#e3e3e3', width: 1 } },
      axisTick: { show: false },
      axisLabel: AXIS,
      splitLine: {
        show: true,
        lineStyle: {
          color: ['#e3e3e3', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'],
          width: 1,
        },
      },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth,
        barCategoryGap: '40%',
        label: {
          show: true,
          position: 'top',
          color: '#44464e',
          fontFamily: FONT,
          fontSize: 14,
          formatter: (params: { value?: unknown }) => {
            const numeric = typeof params.value === 'number' ? params.value : Number(params.value ?? 0);
            return formatLabel(Number.isFinite(numeric) ? numeric : 0);
          },
        },
        data: values.map((value, index) => ({
          value,
          itemStyle: {
            color: colors[index % colors.length],
            borderWidth: 0,
            /*
              Figma tops are pill-rounded (~8px); flat bottoms sit on the axis.
              Not a radius token — chart geometry.
            */
            borderRadius: [8, 8, 0, 0],
          },
        })),
      },
    ],
  };
}

export function DailyBarChart({
  categories,
  values,
  colors,
  height = 256,
  yMin,
  yMax,
  yInterval,
  barMaxWidth,
  formatLabel,
  ariaLabel,
}: DailyBarChartProps) {
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
        values,
        colors,
        yMin,
        yMax,
        yInterval,
        barMaxWidth,
        formatLabel,
      }),
      true,
    );
  }, [categories, values, colors, yMin, yMax, yInterval, barMaxWidth, formatLabel]);

  return <Frame ref={frameRef} $height={height} role="img" aria-label={ariaLabel} />;
}
