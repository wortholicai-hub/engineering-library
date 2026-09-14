/**
 * INTERNAL CODE — safe to edit. Owned by us, never overwritten by upstream sync.
 *
 * Reusable Chart.js option presets for dashboards.
 *
 * Why this exists: Chart.js is intentionally unopinionated, so every team that
 * uses it re-invents the same axis/legend/tooltip configuration. These presets
 * encode our house style once, so a dashboard can be built by composing them
 * instead of hand-writing an options object each time.
 *
 * Upstream reference: frontend/chartjs/upstream/Chart.js (pinned submodule).
 * The types below come from upstream's own published typings, so if upstream
 * changes its option surface, `npm run typecheck` fails here and we find out
 * in the sync PR rather than in production.
 */

import type { ChartOptions, ChartData } from 'chart.js';

/** House palette. Values are deliberately colour-blind safe. */
export const PALETTE = [
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ef4444', // red
  '#14b8a6', // teal
] as const;

export interface DashboardPresetOptions {
  /** Show the legend. Off by default: single-series dashboard tiles rarely need one. */
  legend?: boolean;
  /** Y axis starts at zero. Default true — truncated axes mislead. */
  beginAtZero?: boolean;
  /** Suffix appended to tick + tooltip values, e.g. '%' or ' ms'. */
  unit?: string;
  /** Disable animation for dense dashboards / snapshot tests. */
  animate?: boolean;
}

/**
 * Chart.js reports a parsed value of `null` for gaps in a series, so this
 * deliberately accepts null/undefined rather than assuming a number.
 */
function formatValue(value: number | string | null | undefined, unit: string): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  const formatted =
    Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  return `${formatted}${unit}`;
}

/**
 * Base options shared by every dashboard chart: responsive, no aspect-ratio
 * lock (tiles are sized by CSS), consistent tooltip and legend behaviour.
 */
export function dashboardBase(
  opts: DashboardPresetOptions = {},
): ChartOptions<'line' | 'bar'> {
  const { legend = false, beginAtZero = true, unit = '', animate = true } = opts;

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: animate ? undefined : false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: legend,
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, padding: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label ?? ''} ${formatValue(ctx.parsed.y, unit)}`.trim(),
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
      y: {
        type: 'linear',
        beginAtZero,
        border: { display: false },
        ticks: { callback: (value) => formatValue(value as number, unit) },
      },
    },
  };
}

/** Time-series preset: smooth line, no point markers until hover. */
export function lineSeriesPreset(
  opts: DashboardPresetOptions = {},
): ChartOptions<'line'> {
  const base = dashboardBase(opts) as ChartOptions<'line'>;
  return {
    ...base,
    elements: {
      line: { tension: 0.35, borderWidth: 2 },
      point: { radius: 0, hitRadius: 12, hoverRadius: 4 },
    },
  };
}

/** Categorical comparison preset: rounded bars, generous category spacing. */
export function barComparisonPreset(
  opts: DashboardPresetOptions = {},
): ChartOptions<'bar'> {
  const base = dashboardBase(opts) as ChartOptions<'bar'>;
  return {
    ...base,
    datasets: { bar: { borderRadius: 4, maxBarThickness: 48 } },
  };
}

/**
 * Build a ready-to-render dataset with palette colours already applied, so
 * callers never hand-pick hex values.
 */
export function buildLineData(
  labels: string[],
  series: Array<{ label: string; data: number[] }>,
): ChartData<'line', number[], string> {
  return {
    labels,
    datasets: series.map((s, i) => {
      const colour = PALETTE[i % PALETTE.length];
      return {
        label: s.label,
        data: s.data,
        borderColor: colour,
        backgroundColor: `${colour}1a`, // 10% alpha
        fill: true,
      };
    }),
  };
}

export { formatValue as __formatValue };
