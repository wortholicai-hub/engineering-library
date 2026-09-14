# Instructions for AI Coding Agents

You are working in the **Engineering Library**. Read this before writing code.

The purpose of this repository is that you **reuse what is already here instead
of rebuilding it**. When a developer says *"check the Engineering Library before
building this from scratch"*, this file tells you how.

---

## 1. Orient yourself in one file

[`sources.yml`](sources.yml) is the machine-readable registry and the source of
truth. Parse it first. Each entry tells you:

| Field | What it tells you |
| --- | --- |
| `title`, `description` | what the technology is |
| `used_for` | what we use it for |
| `path` | where the **upstream** code is — read-only |
| `internal_dir` | where **our** code is — reusable and editable |
| `upstream` | the official repository it came from |
| `ref` | the upstream branch we track |
| `license`, `license_ok` | whether we are allowed to use it |
| `enabled` | `false` means **do not use this source at all** |

---

## 2. The one rule that matters

```
*/upstream/**      →  READ ONLY. Never edit. Never add files.
everything else    →  Normal code you may change.
```

Upstream directories are **git submodules**: they are pointers to specific
commits in someone else's repository. An edit there cannot be committed to this
repository — it will be silently lost, or it will fail CI. There is no exception
to this rule.

If you believe upstream needs changing, the correct action is to write a wrapper
in the `internal_dir`, or to open a PR against the real upstream project.

---

## 3. How to answer a request

Work through this in order. Stop at the first step that satisfies the request.

1. **Search the internal directories.** `frontend/*/templates/`,
   `frontend/*/examples/`. This is vetted, tested, house-style code.
   → *Found it?* Import and use it.
2. **Nearly fits?** Extend it **in place**, in the internal directory, and add a
   test next to the existing ones.
3. **Need to understand the underlying API?** Read the upstream submodule. It is
   the authoritative source for option names, types and behaviour — better than
   recalling it from memory, because it is pinned to the exact version in use.
4. **Genuinely new?** Write it in the appropriate `internal_dir`, following the
   conventions of the code already there.

**Do not** add a new npm dependency that duplicates a registered source. If the
request involves charts, use `chart.js` / `react-chartjs-2` — they are already
here, already licence-cleared, and already dependency-managed.

---

## 4. Worked example

> **Request:** *"I need a dashboard with charts."*

```ts
// Both packages are internal, tested, and safe to use.
import {
  registerDashboardCharts,
  lineSeriesPreset,
  barComparisonPreset,
  buildLineData,
  PALETTE,
} from '@engineering-library/chartjs-examples';        // frontend/chartjs/examples

import { cn, buttonVariants, statusBadgeVariants }
  from '@engineering-library/shadcn-templates';        // frontend/shadcn/templates

registerDashboardCharts();                              // once, at app bootstrap

const data    = buildLineData(['Mon','Tue','Wed'], [{ label: 'Requests', data: [120, 180, 140] }]);
const options = lineSeriesPreset({ unit: ' req', legend: true });
// render with <Line data={data} options={options} /> from react-chartjs-2
```

What you did **not** do: pick chart colours by hand, hand-write an options
object, re-derive which Chart.js components need registering, or reimplement
`cn`. All of that is solved in the internal packages.

If a preset does not exist for the chart you need, add it to
`frontend/chartjs/examples/src/dashboard-presets.ts` with a test — so the next
agent finds it at step 1.

---

## 5. Where things are

| Need | Path | Editable |
| --- | --- | --- |
| Chart presets, palette, Chart.js registration | `frontend/chartjs/examples/src/` | ✅ yes |
| `cn()`, button/badge variants | `frontend/shadcn/templates/src/` | ✅ yes |
| Chart.js API truth (options, scales, plugins) | `frontend/chartjs/upstream/Chart.js/` | ❌ **no** |
| React chart component props | `frontend/chartjs/upstream/react-chartjs-2/` | ❌ **no** |
| shadcn component anatomy and conventions | `frontend/shadcn/upstream/ui/` | ❌ **no** |
| Sync automation | `scripts/`, `.github/workflows/` | ⚠️ only on request |
| Registry | `sources.yml` | ⚠️ see below |

If an upstream directory looks empty, submodules are not checked out. Run:

```bash
git submodule update --init --recursive
```

---

## 6. If you add a source to the registry

Only do this when explicitly asked. Then you must:

1. Verify the licence permits our use. **No LICENSE file means no permission** —
   set `enabled: false` and record `blocked_reason`. Do not ingest it.
2. `git submodule add -b <branch> <url> <category>/<tech>/upstream/<name>`
3. Add the `sources.yml` entry (all required fields).
4. Run `npm run docs:render` — never hand-edit `docs/upstream-sources.md`.
5. Run `npm run validate` and confirm it passes.

Full detail: [`docs/adding-a-source.md`](docs/adding-a-source.md).

---

## 7. Checks you can run

```bash
npm run validate          # registry + generated docs + licences
npm run check:upstream    # how far behind upstream each source is
cd frontend/chartjs/examples   && npm test
cd frontend/shadcn/templates   && npm test
```

Never "fix" a failing upstream sync by editing files inside `upstream/`.
