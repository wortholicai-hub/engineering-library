# Frontend

Vetted frontend sources and the house patterns built on top of them.

**Start here:**

| I want to… | Go to |
| --- | --- |
| Know what to use for the thing I am building | [`docs/frontend-stack.md`](../docs/frontend-stack.md) — the opinionated guide |
| Browse everything available, with licences | [`docs/frontend-catalog.md`](../docs/frontend-catalog.md) — 46 vetted sources |
| Reuse our code | [`shadcn/templates`](shadcn/templates) · [`chartjs/examples`](chartjs/examples) · [`data/patterns`](data/patterns) |
| Clone a whole application to start from | [`starters/upstream/`](starters/upstream) — six production starters, on disk |

---

## Layout

```
frontend/
├── shadcn/
│   ├── upstream/ui/                  ← submodule → shadcn-ui/ui         READ ONLY
│   └── templates/                    ← our variants, cn(), tokens       editable
│
├── chartjs/
│   ├── upstream/Chart.js/            ← submodule                        READ ONLY
│   ├── upstream/react-chartjs-2/     ← submodule                        READ ONLY
│   └── examples/                     ← our chart presets                editable
│
├── data/
│   ├── upstream/table/               ← submodule → TanStack/table       READ ONLY
│   ├── upstream/react-hook-form/     ← submodule                        READ ONLY
│   ├── upstream/zod/                 ← submodule                        READ ONLY
│   └── patterns/                     ← our table/form/schema helpers    editable
│
├── headless/upstream/                ← Radix Primitives, Headless UI    READ ONLY
│     accessibility and keyboard behaviour reference
│
├── interaction/upstream/             ← cmdk, Sonner, Vaul, panels       READ ONLY
│     the small components shadcn/ui wraps
│
└── starters/upstream/                ← six production applications      READ ONLY
      saas-starter · next-enterprise · next-js-boilerplate ·
      commerce · taxonomy · create-t3-app
```

**`upstream/` is theirs; everything else is ours.** Upstream directories are
pinned git submodules — read them to understand an API or to copy a pattern
from a starter, never edit them.

If they look empty, fetch them:

```bash
git submodule update --init --recursive          # everything (~350 MB)
git submodule update --init -- frontend/data/upstream/zod   # or just one
```

Another ~28 libraries (MUI, Ant Design, Mantine, TanStack Query, Recharts,
Motion, Tiptap, …) are catalogued and monitored without ingesting their code —
they are installed from npm. See the
[catalog](../docs/frontend-catalog.md).

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

### "I need a table with sorting and pagination"

```ts
import { useReactTable } from '@tanstack/react-table';
import { clientTable, columnsFor, pageInfo, formatMoney }
  from '@engineering-library/data-patterns';

const col = columnsFor<Invoice>();
const table = useReactTable(clientTable({ data, columns: [
  col.accessor('customer',   { header: 'Customer' }),
  col.accessor('totalMinor', { header: 'Total', cell: (c) => formatMoney(c.getValue()) }),
]}));

const { from, to, total } = pageInfo(table.getState().pagination, data.length);
```

See [`data/patterns/`](data/patterns).

### "I need a form"

```ts
import { useForm } from 'react-hook-form';
import { zodForm, email, password, applyServerErrors }
  from '@engineering-library/data-patterns';

const schema = z.object({ email, password });
const form = useForm(zodForm(schema, { email: '', password: '' }));
```

The same schema validates the API route. See [`data/patterns/`](data/patterns).

### "I need consistent buttons or status badges"

```ts
import { cn, buttonVariants, statusBadgeVariants }
  from '@engineering-library/shadcn-templates';

<button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), className)} />
<span   className={statusBadgeVariants({ tone: 'success' })} />
```

See [`shadcn/templates/`](shadcn/templates).

### "I need a whole application"

Do not run `create-next-app`. Clone a starter — auth, billing and database are
already wired:

```bash
npx degit nextjs/saas-starter my-app      # Stripe + Postgres + teams
```

Read it first at [`starters/upstream/saas-starter/`](starters/upstream/saas-starter).
Full table in [`docs/frontend-stack.md`](../docs/frontend-stack.md#3-starting-a-product-clone-do-not-create).

### "The preset I need doesn't exist"

Add it to the internal package with a test, so the next person finds it. Do not
fork the pattern into your own project.

---

## Working on internal packages

```bash
cd frontend/data/patterns      # or chartjs/examples, or shadcn/templates
npm install
npm test
npm run typecheck              # validates our code against upstream's own typings
```

`npm run typecheck` is the early-warning system: because our helpers are typed
with upstream's published types, a breaking upstream change fails the typecheck
inside the sync PR rather than in production.

---

## Adding a frontend technology

```bash
npm run vet -- owner/repo      # licence, maintenance and weight, from the API
```

Then follow [`../docs/adding-a-source.md`](../docs/adding-a-source.md). The
licence is a gate, not a formality — two repositories have already been
rejected on those grounds.
