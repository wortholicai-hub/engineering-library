# Chart.js — Internal Presets

**`@engineering-library/chartjs-examples` · INTERNAL CODE · safe to edit**

Reusable dashboard chart configuration built on top of the pinned upstream
Chart.js submodule. This is ours: edit it, extend it, test it. Upstream sync
never touches this directory.

- Upstream reference (read-only): [`../upstream/Chart.js`](../upstream/Chart.js)
- React bindings (read-only): [`../upstream/react-chartjs-2`](../upstream/react-chartjs-2)

---

## Why this exists

Chart.js is deliberately unopinionated, so every project re-invents the same
options object: which scale ticks to format, whether the legend belongs at the
bottom, which components to register, what the series colours are. These presets
encode those answers once.

---

## Usage

```bash
npm install
```

```ts
import {
  registerDashboardCharts,
  lineSeriesPreset,
  barComparisonPreset,
  buildLineData,
  PALETTE,
} from '@engineering-library/chartjs-examples';

// Chart.js v4 is tree-shakeable — nothing renders until components are
// registered. Call this once at app bootstrap; it is idempotent.
registerDashboardCharts();

const data = buildLineData(
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  [{ label: 'Requests', data: [120, 180, 140, 220, 260] }],
);

const options = lineSeriesPreset({ unit: ' req', legend: true });

// with react-chartjs-2:
// <Line data={data} options={options} />
```

---

## API

| Export | Purpose |
| --- | --- |
| `registerDashboardCharts()` | Registers exactly the Chart.js components these presets need. Idempotent. |
| `dashboardBase(opts)` | Shared base options: responsive, CSS-sized, consistent legend and tooltip. |
| `lineSeriesPreset(opts)` | Time series — smoothed line, points hidden until hover. |
| `barComparisonPreset(opts)` | Categorical comparison — rounded bars, capped thickness. |
| `buildLineData(labels, series)` | Builds `ChartData` with palette colours already applied. |
| `PALETTE` | Six colour-blind-safe series colours. |

### `DashboardPresetOptions`

| Option | Default | Effect |
| --- | --- | --- |
| `legend` | `false` | Single-series dashboard tiles rarely need one. |
| `beginAtZero` | `true` | Truncated axes mislead; opt out deliberately. |
| `unit` | `''` | Suffix for ticks and tooltips, e.g. `'%'`, `' ms'`. |
| `animate` | `true` | Set `false` for dense dashboards or snapshot tests. |

Gaps in a series (`null`) render as `—` rather than `null`.

---

## Development

```bash
npm test          # vitest
npm run typecheck # tsc --noEmit, against upstream's published typings
```

`npm run typecheck` is why an upstream option-surface change surfaces in the
sync PR instead of in production: our presets are typed with Chart.js's own
types, so if upstream changes them, this fails.

---

## Extending

Add a preset here with a test beside the existing ones. Do not copy this file
into a product repository — extend it here so every consumer benefits.

**Never** edit `../upstream/Chart.js` to change behaviour. It is a pinned
submodule; the edit cannot be committed. Wrap it instead.
