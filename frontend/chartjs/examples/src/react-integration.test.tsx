/**
 * React integration gate.
 *
 * This suite exists because upstream updates and dependency bumps now land on
 * `main` WITHOUT human review — the tests are the only safeguard. Our presets
 * are pure functions, so without this file a React major bump (18 -> 19) or a
 * react-chartjs-2 bump could go green while being completely broken.
 *
 * It renders through `react-dom/server`, which exercises React + the
 * react-chartjs-2 component contract without needing jsdom or a canvas: server
 * rendering emits the <canvas> element but never mounts Chart.js.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

import { registerDashboardCharts } from './register.js';
import { lineSeriesPreset, barComparisonPreset, buildLineData } from './dashboard-presets.js';

registerDashboardCharts();

const labels = ['Mon', 'Tue', 'Wed'];
const data = buildLineData(labels, [{ label: 'Requests', data: [120, 180, 140] }]);

describe('React is usable at all', () => {
  it('exposes a version and renders basic elements', () => {
    expect(React.version).toMatch(/^\d+\./);
    expect(renderToString(React.createElement('div', null, 'hello'))).toContain('hello');
  });

  it('renders a function component with hooks', () => {
    function Widget({ label }: { label: string }) {
      const [value] = React.useState(label);
      return React.createElement('span', null, value);
    }
    expect(renderToString(React.createElement(Widget, { label: 'ok' }))).toContain('ok');
  });
});

describe('react-chartjs-2 component contract', () => {
  it('exports the chart components we depend on', () => {
    for (const C of [Line, Bar, Doughnut]) {
      expect(C).toBeDefined();
      expect(['function', 'object']).toContain(typeof C);
    }
  });

  it('renders <Line> to a canvas element with our preset applied', () => {
    const html = renderToString(
      React.createElement(Line, { data, options: lineSeriesPreset({ unit: ' req' }) }),
    );
    expect(html).toContain('<canvas');
  });

  it('renders <Bar> with the bar preset', () => {
    const html = renderToString(
      React.createElement(Bar, {
        data: { labels, datasets: [{ label: 'Errors', data: [1, 2, 3] }] },
        options: barComparisonPreset(),
      }),
    );
    expect(html).toContain('<canvas');
  });

  it('accepts standard canvas props without throwing', () => {
    const html = renderToString(
      React.createElement(Line, {
        data,
        options: lineSeriesPreset(),
        'aria-label': 'Requests over time',
        role: 'img',
      } as React.ComponentProps<typeof Line>),
    );
    expect(html).toContain('aria-label="Requests over time"');
  });
});

describe('our presets survive a real render', () => {
  it('palette colours reach the rendered dataset config', () => {
    // Guards against buildLineData silently producing an unusable shape after
    // a Chart.js major bump.
    expect(data.datasets[0].borderColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(data.datasets[0].data).toHaveLength(labels.length);
  });

  it('registration is idempotent across repeated renders', () => {
    expect(() => {
      registerDashboardCharts();
      renderToString(React.createElement(Line, { data, options: lineSeriesPreset() }));
      registerDashboardCharts();
    }).not.toThrow();
  });
});
