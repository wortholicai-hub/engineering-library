import { describe, it, expect } from 'vitest';
import {
  PALETTE,
  dashboardBase,
  lineSeriesPreset,
  barComparisonPreset,
  buildLineData,
  __formatValue as formatValue,
} from './dashboard-presets.js';

describe('formatValue', () => {
  it('appends the unit', () => {
    expect(formatValue(42, '%')).toBe('42%');
  });

  it('abbreviates thousands', () => {
    expect(formatValue(12500, '')).toBe('12.5k');
    expect(formatValue(-4200, ' ms')).toBe('-4.2k ms');
  });

  it('passes through non-numeric values untouched', () => {
    expect(formatValue('n/a', '%')).toBe('n/a');
  });

  it('renders gaps in a series rather than printing null', () => {
    expect(formatValue(null, '%')).toBe('—');
    expect(formatValue(undefined, '%')).toBe('—');
  });
});

describe('dashboardBase', () => {
  it('is responsive and unlocks aspect ratio for CSS-sized tiles', () => {
    const o = dashboardBase();
    expect(o.responsive).toBe(true);
    expect(o.maintainAspectRatio).toBe(false);
  });

  it('hides the legend by default and can enable it', () => {
    expect(dashboardBase().plugins?.legend?.display).toBe(false);
    expect(dashboardBase({ legend: true }).plugins?.legend?.display).toBe(true);
  });

  it('begins the y axis at zero unless told otherwise', () => {
    // `scales.y` is a union across every scale type upstream ships, so narrow
    // to the linear scale we actually configure before reading the flag.
    const yAxis = (o: ReturnType<typeof dashboardBase>) =>
      o.scales?.y as { beginAtZero?: boolean } | undefined;

    expect(yAxis(dashboardBase())?.beginAtZero).toBe(true);
    expect(yAxis(dashboardBase({ beginAtZero: false }))?.beginAtZero).toBe(false);
  });

  it('disables animation when requested', () => {
    expect(dashboardBase({ animate: false }).animation).toBe(false);
  });

  it('formats y-axis ticks with the configured unit', () => {
    const o = dashboardBase({ unit: '%' });
    const cb = o.scales?.y?.ticks?.callback as (v: number) => string;
    expect(cb(87)).toBe('87%');
  });
});

describe('presets', () => {
  it('line preset softens the curve and hides idle points', () => {
    const o = lineSeriesPreset();
    expect(o.elements?.line?.tension).toBeCloseTo(0.35);
    expect(o.elements?.point?.radius).toBe(0);
    expect(o.elements?.point?.hoverRadius).toBeGreaterThan(0);
  });

  it('bar preset rounds corners and caps bar thickness', () => {
    const o = barComparisonPreset();
    expect(o.datasets?.bar?.borderRadius).toBe(4);
    expect(o.datasets?.bar?.maxBarThickness).toBe(48);
  });

  it('presets inherit the shared base behaviour', () => {
    expect(lineSeriesPreset().responsive).toBe(true);
    expect(barComparisonPreset({ unit: 'ms' }).maintainAspectRatio).toBe(false);
  });
});

describe('buildLineData', () => {
  const labels = ['Mon', 'Tue', 'Wed'];

  it('assigns palette colours in order', () => {
    const data = buildLineData(labels, [
      { label: 'A', data: [1, 2, 3] },
      { label: 'B', data: [3, 2, 1] },
    ]);
    expect(data.datasets[0].borderColor).toBe(PALETTE[0]);
    expect(data.datasets[1].borderColor).toBe(PALETTE[1]);
  });

  it('wraps around the palette rather than running out of colours', () => {
    const series = Array.from({ length: PALETTE.length + 2 }, (_, i) => ({
      label: `s${i}`,
      data: [i],
    }));
    const data = buildLineData(['x'], series);
    expect(data.datasets[PALETTE.length].borderColor).toBe(PALETTE[0]);
    expect(data.datasets[PALETTE.length + 1].borderColor).toBe(PALETTE[1]);
  });

  it('preserves labels and data', () => {
    const data = buildLineData(labels, [{ label: 'Requests', data: [10, 20, 30] }]);
    expect(data.labels).toEqual(labels);
    expect(data.datasets[0].data).toEqual([10, 20, 30]);
    expect(data.datasets[0].label).toBe('Requests');
  });
});
