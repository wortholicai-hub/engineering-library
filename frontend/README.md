# Frontend

Vetted frontend sources and the house patterns built on top of them.

| Technology | Upstream (read-only) | Our code (editable) | Use it for |
| --- | --- | --- | --- |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | `shadcn/upstream/ui/` | [`shadcn/templates/`](shadcn/templates) | Component anatomy, Tailwind variant conventions, `cn()` |
| [Chart.js](https://github.com/chartjs/Chart.js) | `chartjs/upstream/Chart.js/` | [`chartjs/examples/`](chartjs/examples) | Chart options, scales, plugins |
| [react-chartjs-2](https://github.com/reactchartjs/react-chartjs-2) | `chartjs/upstream/react-chartjs-2/` | [`chartjs/examples/`](chartjs/examples) | React chart components and props |

All three are MIT licensed. Details: [`../docs/upstream-sources.md`](../docs/upstream-sources.md).

---

## Layout

```
frontend/
├── shadcn/
│   ├── upstream/ui/     ← submodule → shadcn-ui/ui          READ ONLY
│   └── templates/       ← our variants and utilities        editable
└── chartjs/
    ├── upstream/Chart.js/         ← submodule               READ ONLY
    ├── upstream/react-chartjs-2/  ← submodule               READ ONLY
    └── examples/                  ← our chart presets       editable
```

**`upstream/` is theirs; everything else is ours.** Upstream directories are
pinned git submodules — read them to understand an API, never edit them.

If they look empty, fetch them:

```bash
git submodule update --init --recursive
```

---

## Start here for common tasks

### "I need a dashboard with charts"

```ts
import {
  registerDashboardCharts, lineSeriesPreset, buildLineData,
} from '@engineering-library/chartjs-examples';

registerDashboardCharts();                       // once, at app bootstrap
const data    = buildLineData(labels, [{ label: 'Requests', data: values }]);
const options = lineSeriesPreset({ unit: ' req' });
// <Line data={data} options={options} />        // from react-chartjs-2
```

Colours, axis formatting, tooltips and Chart.js registration are already
handled. See [`chartjs/examples/`](chartjs/examples).

### "I need consistent buttons or status badges"

```ts
import { cn, buttonVariants, statusBadgeVariants }
  from '@engineering-library/shadcn-templates';

<button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), className)} />
<span   className={statusBadgeVariants({ tone: 'success' })} />
```

See [`shadcn/templates/`](shadcn/templates).

### "The preset I need doesn't exist"

Add it to the internal package with a test, so the next person finds it. Do not
fork the pattern into your own project.

---

## Working on internal packages

```bash
cd frontend/chartjs/examples   # or frontend/shadcn/templates
npm install
npm test
npm run typecheck              # validates our code against upstream's own typings
```

`npm run typecheck` is the early-warning system: because our presets are typed
with upstream's published types, a breaking upstream change fails the typecheck
inside the sync PR rather than in production.

---

## Adding a frontend technology

See [`../docs/adding-a-source.md`](../docs/adding-a-source.md). Check the licence
first — it is a gate, not a formality.
