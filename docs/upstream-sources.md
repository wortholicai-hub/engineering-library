<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Source of truth: /sources.yml
     Regenerate with: npm run docs:render
     CI enforces that this file matches the registry. -->

# Upstream Sources

Every external repository the Engineering Library tracks, why it is here, and
how it is connected. This page is generated from [`sources.yml`](../sources.yml).

## Active sources

| Technology | Upstream Repository | Category | Sync Method | Tracked Ref | Licence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | https://github.com/shadcn-ui/ui | frontend | `git-submodule` | `main` | MIT | Active |
| [Chart.js](https://github.com/chartjs/Chart.js) | https://github.com/chartjs/Chart.js | frontend | `git-submodule` | `master` | MIT | Active |
| [react-chartjs-2](https://github.com/reactchartjs/react-chartjs-2) | https://github.com/reactchartjs/react-chartjs-2 | frontend | `git-submodule` | `master` | MIT | Active |

### Where the code lives

Upstream code is **referenced as a pinned git submodule**, never copied into
this repository. The commit below is the exact upstream revision this library
currently points at.

| Technology | Submodule path (upstream — do not edit) | Pinned commit | Internal code (safe to edit) |
| --- | --- | --- | --- |
| shadcn/ui | `frontend/shadcn/upstream/ui` | [`2b3e6d4f8d`](https://github.com/shadcn-ui/ui/commit/2b3e6d4f8d9161fe5c19340dc383aade392012dd) | `frontend/shadcn/templates` |
| Chart.js | `frontend/chartjs/upstream/Chart.js` | [`6a86e238fa`](https://github.com/chartjs/Chart.js/commit/6a86e238fac3d1ad35eb84b93e7804dfb5813f79) | `frontend/chartjs/examples` |
| react-chartjs-2 | `frontend/chartjs/upstream/react-chartjs-2` | [`7c7be48ae5`](https://github.com/reactchartjs/react-chartjs-2/commit/7c7be48ae5b585f45bc6aef718cc8d4b51f34d0a) | `frontend/chartjs/examples` |

### What each source is used for

#### shadcn/ui

Composable, accessible React components. Source of truth for component anatomy, Tailwind class conventions and the `cn` utility pattern.

- React component primitives and their accessibility semantics
- Tailwind design-token and variant conventions
- Reference implementation for our internal wrappers

#### Chart.js

Canvas-based charting library. Canonical reference for chart options, scales, plugins and the public typings our presets are built against.

- Chart option/scale/plugin API surface
- Upstream TypeScript typings our internal presets conform to

#### react-chartjs-2

Official React bindings for Chart.js. Included because Chart.js alone is not directly usable in our React frontends.

- React component wrappers (<Line>, <Bar>, <Doughnut>) and their props
- Ref/lifecycle handling for charts in React


## Blocked / not ingested

These repositories were evaluated and deliberately **not** brought into the
library. They stay listed so the decision is auditable and can be revisited.

### shadcn-ui/next-template

- **Upstream:** https://github.com/shadcn-ui/next-template
- **Licence:** `NOASSERTION`
- **Status:** not ingested — no code from this repository exists in this library
- **Reason:** Repository is ARCHIVED and ships NO LICENSE file. Absent an explicit licence grant, default copyright applies and redistribution is not permitted. We therefore do not vendor, submodule or copy any of its code. Recorded here only so the decision is visible and re-checkable.


## Licence compliance

| Requirement | How it is satisfied |
| --- | --- |
| Licence verified before ingest | `license` + `license_ok` recorded in `sources.yml`; `scripts/registry.mjs` refuses to enable a source with `license_ok: false` |
| Licence text preserved | Upstream is a submodule, so the upstream `LICENSE` file is present verbatim at its original path |
| Relicensing detected | `scripts/license-audit.mjs --remote` re-checks the upstream SPDX id on every sync and every PR |
| Unlicensed code excluded | Sources without a licence grant are recorded as blocked and never ingested |
| Attribution | See [`NOTICE`](../NOTICE) |

## Adding a source

See [adding-a-source.md](./adding-a-source.md).
