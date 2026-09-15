<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Source of truth: /sources.yml
     Regenerate with: npm run docs:render
     CI enforces that this file matches the registry.
     Prose that is NOT generated (stack recipes, decision guides) lives in
     docs/frontend-stack.md. -->

# Frontend Catalog

**46 vetted frontend sources.** Every one has had its licence,
maintenance status and repository weight verified against the GitHub API, and
every one is re-checked automatically.

**Before you install anything or build a component from scratch, look here.**
For "I am building X, what do I use?" recipes, read
[the frontend stack guide](./frontend-stack.md).

| | |
| --- | --- |
| Catalogued sources | **46** |
| Code ingested on disk (pinned submodules) | **18** |
| Catalogued and monitored, installed from npm | **28** |
| Evaluated and **rejected** on licence grounds | **2** |

Legend — **maturity**: 🟢 standard pick this unless you have a
reason not to · 🔵 established proven, but a considered choice ·
🟡 emerging promising, expect API churn.

## Contents

- [Complete component systems](#complete-component-systems) — Batteries-included libraries that ship a themed component for almost everything. Fastest route to a working product UI; you adopt their design language and their styling engine.
- [Tailwind-native component systems](#tailwind-native-component-systems) — Components built on Tailwind utility classes. You own the code (copy-in) or the classes (plugin), so restyling never means fighting a theme API.
- [Headless primitives and accessibility](#headless-primitives-and-accessibility) — Unstyled, fully accessible behaviour — focus traps, keyboard navigation, ARIA wiring. The layer underneath shadcn/ui and every serious design system. Use these when your brand cannot look like anyone else's.
- [Data, forms, state and validation](#data-forms-state-and-validation) — The non-visual half of a frontend: fetching and caching, tables, forms, schema validation, client state, routing.
- [Charts and data visualisation](#charts-and-data-visualisation) — Rendering numbers. Canvas, SVG and dashboard-oriented options.
- [Motion, icons and rich interaction](#motion-icons-and-rich-interaction) — Animation, icon sets, drag and drop, rich text, command palettes, toasts, drawers and resizable panels — the pieces a product needs once the skeleton works.
- [Production starter templates](#production-starter-templates) — Whole applications, not components. Clone one of these when starting a new product: auth, billing, database, CI and project structure are already wired together by people who ship.
- [Framework, styling and quality tooling](#framework-styling-and-quality-tooling) — The foundation every frontend here sits on — framework, CSS engine, component workshop, end-to-end testing.

---

## Complete component systems

Batteries-included libraries that ship a themed component for almost everything. Fastest route to a working product UI; you adopt their design language and their styling engine.

| Technology | Use it for | Install | Maturity | Licence |
| --- | --- | --- | --- | --- |
| **[MUI (Material UI)](https://mui.com/material-ui/getting-started/)** | Enterprise or internal applications where breadth, documentation and hiring pool matter more than visual differentiation — and when you want a supported paid data grid rather than building one. | `npm i @mui/material @emotion/react @emotion/styled` | 🟢 standard | MIT |
| **[Ant Design](https://ant.design/components/overview/)** | Back-office, admin and data-heavy internal tools — its table and form components are the strongest in the ecosystem out of the box. | `npm i antd` | 🟢 standard | MIT |
| **[Mantine](https://mantine.dev)** | You want a complete, modern component set with no design work and no Tailwind — the fastest path from zero to a polished internal product. | `npm i @mantine/core @mantine/hooks` | 🟢 standard | MIT |
| **[Chakra UI](https://chakra-ui.com/docs/get-started/installation)** | Teams that like composing with style props and want accessibility handled by default. | `npm i @chakra-ui/react @emotion/react` | 🟢 standard | MIT |
| **[PrimeReact](https://primereact.org)** | An enterprise app needs an unusual heavy component and you would otherwise build it from scratch. | `npm i primereact primeicons` | 🔵 established | MIT |
| **[HeroUI](https://www.heroui.com/docs/guide/introduction)** | A consumer-facing product that should look designed on day one while keeping Tailwind and accessible primitives. | `npm i @heroui/react` | 🔵 established | Apache-2.0 |

#### MUI (Material UI)

The most widely deployed React component library. Implements Material Design, with an enormous component surface, a mature theming system and commercial add-ons (Data Grid Pro, Date Pickers, Charts).

- **Docs:** https://mui.com/material-ui/getting-started/
- **Repository:** https://github.com/mui/material-ui (tracked branch `master`)
- **Install:** `npm i @mui/material @emotion/react @emotion/styled`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Enterprise or internal applications where breadth, documentation and hiring pool matter more than visual differentiation — and when you want a supported paid data grid rather than building one.
- **Avoid when:** You are already on Tailwind, or the brand must not read as Material Design. Runtime CSS-in-JS also costs more than utility classes.
- **Alternatives here:** [Ant Design](#ant-design) · [Mantine](#mantine) · [Chakra UI](#chakra-ui) · [shadcn/ui](#shadcnui)
- **Tags:** `react` `material-design` `enterprise` `data-grid` `theming` `components`
- **Licence and maintenance last verified:** 2026-09-15

#### Ant Design

Enterprise-grade React component system from Ant Group. Exceptional coverage of dense data UI: tables with filters and grouping, complex forms, transfer lists, tree selects.

- **Docs:** https://ant.design/components/overview/
- **Repository:** https://github.com/ant-design/ant-design (tracked branch `master`)
- **Install:** `npm i antd`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Back-office, admin and data-heavy internal tools — its table and form components are the strongest in the ecosystem out of the box.
- **Avoid when:** Consumer-facing products where the Ant look is hard to shake off, or when bundle size is critical.
- **Alternatives here:** [MUI (Material UI)](#mui-material-ui) · [Mantine](#mantine) · [PrimeReact](#primereact)
- **Tags:** `react` `enterprise` `admin` `tables` `forms` `back-office`
- **Licence and maintenance last verified:** 2026-09-15

#### Mantine

120+ components and 70+ hooks with first-class TypeScript, a genuinely good dark mode, and built-in form, notification, modal-manager and date-picker packages. CSS modules rather than runtime CSS-in-JS.

- **Docs:** https://mantine.dev
- **Repository:** https://github.com/mantinedev/mantine (tracked branch `master`)
- **Install:** `npm i @mantine/core @mantine/hooks`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** You want a complete, modern component set with no design work and no Tailwind — the fastest path from zero to a polished internal product.
- **Avoid when:** The team is standardised on Tailwind, or you need the component code itself to be editable in-repo.
- **Alternatives here:** [MUI (Material UI)](#mui-material-ui) · [Chakra UI](#chakra-ui) · [shadcn/ui](#shadcnui)
- **Tags:** `react` `components` `hooks` `typescript` `dark-mode` `forms` `dates`
- **Licence and maintenance last verified:** 2026-09-15

#### Chakra UI

Accessible React components with a style-props API and a strong design token system. Built on Ark UI, so behaviour and accessibility come from the same state machines.

- **Docs:** https://chakra-ui.com/docs/get-started/installation
- **Repository:** https://github.com/chakra-ui/chakra-ui (tracked branch `main`)
- **Install:** `npm i @chakra-ui/react @emotion/react`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Teams that like composing with style props and want accessibility handled by default.
- **Avoid when:** You prefer utility classes (Tailwind) or need the widest possible component catalogue.
- **Alternatives here:** [Mantine](#mantine) · [MUI (Material UI)](#mui-material-ui) · [Ark UI](#ark-ui)
- **Tags:** `react` `accessibility` `design-tokens` `style-props` `components`
- **Licence and maintenance last verified:** 2026-09-15

#### PrimeReact

Very large component suite (80+) from PrimeFaces, including the kind of components most libraries skip: org charts, Gantt-style timelines, tree tables, spreadsheet-like data tables, file uploaders.

- **Docs:** https://primereact.org
- **Repository:** https://github.com/primefaces/primereact (tracked branch `master`)
- **Install:** `npm i primereact primeicons`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** An enterprise app needs an unusual heavy component and you would otherwise build it from scratch.
- **Avoid when:** You only need the common 20 components — lighter libraries will be easier to theme.
- **Alternatives here:** [Ant Design](#ant-design) · [MUI (Material UI)](#mui-material-ui)
- **Tags:** `react` `enterprise` `components` `tree-table` `org-chart` `file-upload`
- **Licence and maintenance last verified:** 2026-09-15

#### HeroUI

Modern React component library (formerly NextUI) built on Tailwind and React Aria — accessible behaviour with a polished default aesthetic. Tracked on the `v3` branch, which is where development happens.

- **Docs:** https://www.heroui.com/docs/guide/introduction
- **Repository:** https://github.com/heroui-inc/heroui (tracked branch `v3`)
- **Install:** `npm i @heroui/react`
- **Licence:** Apache-2.0
- **Source on disk:** not ingested — use the docs link above
- **Use when:** A consumer-facing product that should look designed on day one while keeping Tailwind and accessible primitives.
- **Avoid when:** You want the component source in your own repo — HeroUI is installed, not copied in. Note the major version in flight; pin carefully.
- **Alternatives here:** [shadcn/ui](#shadcnui) · [Mantine](#mantine) · [React Aria (Adobe)](#react-aria-adobe)
- **Tags:** `react` `tailwind` `react-aria` `components` `nextui`
- **Licence and maintenance last verified:** 2026-09-15

---

## Tailwind-native component systems

Components built on Tailwind utility classes. You own the code (copy-in) or the classes (plugin), so restyling never means fighting a theme API.

| Technology | Use it for | Install | Maturity | Licence |
| --- | --- | --- | --- | --- |
| **[shadcn/ui](https://ui.shadcn.com)** | Default choice for any new React product UI where the design must be ours and the components must be editable. | `npx shadcn@latest init` | 🟢 standard | MIT |
| **[daisyUI](https://daisyui.com)** | You want good-looking components fast in any framework, or a themeable marketing site, without shipping component JavaScript. | `npm i -D daisyui@latest` | 🟢 standard | MIT |
| **[Flowbite React](https://flowbite-react.com/docs/getting-started/introduction)** | Building an internal tool or admin area quickly and the standard Flowbite look is acceptable. | `npx flowbite-react@latest init` | 🔵 established | MIT |
| **[Magic UI](https://magicui.design/docs)** | Landing pages and marketing surfaces that need motion without bespoke animation work. | `npx shadcn@latest add "https://magicui.design/r/marquee.json"` | 🔵 established | MIT |
| **[Tremor](https://tremor.so)** | An internal analytics dashboard is needed in days, not weeks. | `npm i @tremor/react` | 🔵 established | Apache-2.0 |

#### shadcn/ui

Composable, accessible React components you copy into your own codebase rather than install. Built on Radix primitives + Tailwind. Source of truth for component anatomy, Tailwind class conventions and the `cn` utility pattern.

- **Docs:** https://ui.shadcn.com
- **Repository:** https://github.com/shadcn-ui/ui (tracked branch `main`)
- **Install:** `npx shadcn@latest init`
- **Licence:** MIT
- **Source on disk:** `frontend/shadcn/upstream/ui` — pinned submodule, read it, never edit it
- **Our code for it:** [`frontend/shadcn/templates`](../frontend/shadcn/templates) — reuse or extend this first
- **Use when:** Default choice for any new React product UI where the design must be ours and the components must be editable.
- **Avoid when:** You need a full themed component set out of the box with no design work — use Mantine or MUI instead.
- **Alternatives here:** [Mantine](#mantine) · [MUI (Material UI)](#mui-material-ui) · [HeroUI](#heroui) · [Flowbite React](#flowbite-react)
- **Tags:** `components` `tailwind` `radix` `react` `copy-paste` `blocks` `dashboard`
- **Licence and maintenance last verified:** 2026-09-15

#### daisyUI

A Tailwind CSS plugin that adds semantic component class names (`btn`, `card`, `modal`) plus a large set of themes. Pure CSS: no JavaScript, no React dependency.

- **Docs:** https://daisyui.com
- **Repository:** https://github.com/saadeghi/daisyui (tracked branch `master`)
- **Install:** `npm i -D daisyui@latest`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** You want good-looking components fast in any framework, or a themeable marketing site, without shipping component JavaScript.
- **Avoid when:** You need accessible interactive behaviour — daisyUI styles markup, it does not manage focus, keyboard or ARIA. Pair it with headless primitives, or use shadcn/ui.
- **Alternatives here:** [shadcn/ui](#shadcnui) · [Flowbite React](#flowbite-react)
- **Tags:** `tailwind` `css` `themes` `plugin` `framework-agnostic`
- **Licence and maintenance last verified:** 2026-09-15

#### Flowbite React

Tailwind-based React component library with a large catalogue of ready-made blocks — navbars, sidebars, CRUD tables, pricing sections, authentication screens.

- **Docs:** https://flowbite-react.com/docs/getting-started/introduction
- **Repository:** https://github.com/themesberg/flowbite-react (tracked branch `main`)
- **Install:** `npx flowbite-react@latest init`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Building an internal tool or admin area quickly and the standard Flowbite look is acceptable.
- **Avoid when:** The product needs a distinctive design system; you will spend longer overriding than composing.
- **Alternatives here:** [shadcn/ui](#shadcnui) · [daisyUI](#daisyui) · [Mantine](#mantine)
- **Tags:** `tailwind` `react` `components` `admin` `blocks`
- **Licence and maintenance last verified:** 2026-09-15

#### Magic UI

150+ animated components distributed through the shadcn CLI — marquees, beams, number tickers, gradient text, hero sections. Drops into an existing shadcn/ui project with no new runtime concepts.

- **Docs:** https://magicui.design/docs
- **Repository:** https://github.com/magicuidesign/magicui (tracked branch `main`)
- **Install:** `npx shadcn@latest add "https://magicui.design/r/marquee.json"`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Landing pages and marketing surfaces that need motion without bespoke animation work.
- **Avoid when:** Dense application UI — the animation budget belongs on the marketing site, not on a data table.
- **Alternatives here:** [Motion (Framer Motion)](#motion-framer-motion)
- **Tags:** `animation` `landing-page` `marketing` `shadcn` `tailwind` `motion`
- **Licence and maintenance last verified:** 2026-09-15

#### Tremor

Dashboard-oriented React components — KPI cards, trackers, bar lists and charts — designed to look right together with minimal configuration.

- **Docs:** https://tremor.so
- **Repository:** https://github.com/tremorlabs/tremor (tracked branch `main`)
- **Install:** `npm i @tremor/react`
- **Licence:** Apache-2.0
- **Source on disk:** not ingested — use the docs link above
- **Use when:** An internal analytics dashboard is needed in days, not weeks.
- **Avoid when:** The dashboard is a long-lived core product surface (see the maintenance note).
- **Alternatives here:** [shadcn/ui](#shadcnui) · [Recharts](#recharts) · [Chart.js](#chartjs)
- **⚠️ Maintenance:** No upstream push for ~340 days as of the vetting date. Treat as feature-complete rather than actively developed, and prefer Chart.js/Recharts for the charting layer of anything long-lived.
- **Tags:** `dashboard` `analytics` `kpi` `charts` `tailwind` `react`
- **Licence and maintenance last verified:** 2026-09-15

---

## Headless primitives and accessibility

Unstyled, fully accessible behaviour — focus traps, keyboard navigation, ARIA wiring. The layer underneath shadcn/ui and every serious design system. Use these when your brand cannot look like anyone else's.

| Technology | Use it for | Install | Maturity | Licence |
| --- | --- | --- | --- | --- |
| **[Radix Primitives](https://www.radix-ui.com/primitives)** | Building a custom component that needs real accessibility, or debugging the behaviour of a shadcn/ui component. | `npm i radix-ui` | 🟢 standard | MIT |
| **[Headless UI](https://headlessui.com)** | A Tailwind project needs a handful of accessible interactive components and nothing more. | `npm i @headlessui/react` | 🟢 standard | MIT |
| **[React Aria (Adobe)](https://react-spectrum.adobe.com/react-aria/)** | Accessibility is a contractual or regulatory requirement (public sector, enterprise procurement, WCAG audits), or you need full i18n/RTL support. | `npm i react-aria-components` | 🟢 standard | Apache-2.0 |
| **[Base UI](https://base-ui.com/react/overview/quick-start)** | Starting something new that wants headless primitives and you are happy tracking a young API. | `npm i @base-ui-components/react` | 🟡 emerging | MIT |
| **[Ark UI](https://ark-ui.com)** | You need one design system to work across more than one framework. | `npm i @ark-ui/react` | 🔵 established | MIT |

#### Radix Primitives

Unstyled, accessible React primitives — dialog, popover, select, menu, tooltip — with correct focus management, keyboard interaction and ARIA. This is what shadcn/ui is built on, so it is the authoritative answer to "why does this component behave like that?".

- **Docs:** https://www.radix-ui.com/primitives
- **Repository:** https://github.com/radix-ui/primitives (tracked branch `main`)
- **Install:** `npm i radix-ui`
- **Licence:** MIT
- **Source on disk:** `frontend/headless/upstream/radix-primitives` — pinned submodule, read it, never edit it
- **Use when:** Building a custom component that needs real accessibility, or debugging the behaviour of a shadcn/ui component.
- **Avoid when:** You want something that already looks finished — Radix ships zero styles by design.
- **Alternatives here:** [Headless UI](#headless-ui) · [React Aria (Adobe)](#react-aria-adobe) · [Base UI](#base-ui) · [Ark UI](#ark-ui)
- **Tags:** `headless` `accessibility` `a11y` `primitives` `react` `wai-aria` `focus`
- **Licence and maintenance last verified:** 2026-09-15

#### Headless UI

Unstyled accessible components from the Tailwind team, designed to be styled entirely with utility classes. Smaller surface than Radix but pairs naturally with Tailwind UI markup.

- **Docs:** https://headlessui.com
- **Repository:** https://github.com/tailwindlabs/headlessui (tracked branch `main`)
- **Install:** `npm i @headlessui/react`
- **Licence:** MIT
- **Source on disk:** `frontend/headless/upstream/headlessui` — pinned submodule, read it, never edit it
- **Use when:** A Tailwind project needs a handful of accessible interactive components and nothing more.
- **Avoid when:** You need the breadth Radix covers, or you are already using shadcn/ui (which brings Radix).
- **Alternatives here:** [Radix Primitives](#radix-primitives) · [React Aria (Adobe)](#react-aria-adobe)
- **Tags:** `headless` `tailwind` `accessibility` `react` `dropdown` `dialog` `combobox`
- **Licence and maintenance last verified:** 2026-09-15

#### React Aria (Adobe)

The most rigorous accessibility implementation in the React ecosystem: hooks and components covering internationalisation, right-to-left layouts, screen readers, touch and keyboard, from Adobe's Spectrum team.

- **Docs:** https://react-spectrum.adobe.com/react-aria/
- **Repository:** https://github.com/adobe/react-spectrum (tracked branch `main`)
- **Install:** `npm i react-aria-components`
- **Licence:** Apache-2.0
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Accessibility is a contractual or regulatory requirement (public sector, enterprise procurement, WCAG audits), or you need full i18n/RTL support.
- **Avoid when:** A small project that only needs a dropdown — the API surface is large.
- **Alternatives here:** [Radix Primitives](#radix-primitives) · [Headless UI](#headless-ui) · [Base UI](#base-ui)
- **Tags:** `accessibility` `a11y` `wcag` `i18n` `rtl` `headless` `hooks` `react`
- **Licence and maintenance last verified:** 2026-09-15

#### Base UI

Unstyled accessible primitives from the MUI team, with contributors from Radix and Floating UI. Modern API, actively developed.

- **Docs:** https://base-ui.com/react/overview/quick-start
- **Repository:** https://github.com/mui/base-ui (tracked branch `master`)
- **Install:** `npm i @base-ui-components/react`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Starting something new that wants headless primitives and you are happy tracking a young API.
- **Avoid when:** A production system that must not absorb breaking changes — prefer Radix until Base UI has a longer stability record.
- **Alternatives here:** [Radix Primitives](#radix-primitives) · [Ark UI](#ark-ui) · [React Aria (Adobe)](#react-aria-adobe)
- **Tags:** `headless` `accessibility` `primitives` `react` `mui`
- **Licence and maintenance last verified:** 2026-09-15

#### Ark UI

Headless components driven by Zag.js state machines, available for React, Vue and Solid with the same behaviour in each. Powers Chakra UI v3.

- **Docs:** https://ark-ui.com
- **Repository:** https://github.com/chakra-ui/ark (tracked branch `main`)
- **Install:** `npm i @ark-ui/react`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** You need one design system to work across more than one framework.
- **Avoid when:** A React-only codebase — Radix is more widely used and better documented for that case.
- **Alternatives here:** [Radix Primitives](#radix-primitives) · [React Aria (Adobe)](#react-aria-adobe) · [Base UI](#base-ui)
- **Tags:** `headless` `state-machine` `react` `vue` `solid` `cross-framework`
- **Licence and maintenance last verified:** 2026-09-15

---

## Data, forms, state and validation

The non-visual half of a frontend: fetching and caching, tables, forms, schema validation, client state, routing.

| Technology | Use it for | Install | Maturity | Licence |
| --- | --- | --- | --- | --- |
| **[TanStack Table](https://tanstack.com/table/latest)** | Any table beyond a static list. Our own column/state helpers in `frontend/data/patterns` wrap it. | `npm i @tanstack/react-table` | 🟢 standard | MIT |
| **[React Hook Form](https://react-hook-form.com)** | Every form. Combine with Zod through `@hookform/resolvers/zod`. | `npm i react-hook-form @hookform/resolvers` | 🟢 standard | MIT |
| **[Zod](https://zod.dev)** | Validating anything crossing a boundary — form input, API request/response, environment variables, LLM output. | `npm i zod` | 🟢 standard | MIT |
| **[TanStack Query](https://tanstack.com/query/latest)** | Any client that talks to an API. Reach for this before Redux or a hand-rolled fetch layer. | `npm i @tanstack/react-query` | 🟢 standard | MIT |
| **[TanStack Router](https://tanstack.com/router/latest)** | A client-rendered SPA (Vite) where route and search-param typing matter. | `npm i @tanstack/react-router` | 🔵 established | MIT |
| **[TanStack Virtual](https://tanstack.com/virtual/latest)** | A list or table passes a few thousand rows and scrolling starts to stutter. | `npm i @tanstack/react-virtual` | 🔵 established | MIT |
| **[Zustand](https://zustand.docs.pmnd.rs)** | Genuinely global client state — theme, sidebar, wizard progress, editor buffers. | `npm i zustand` | 🟢 standard | MIT |

#### TanStack Table

Headless table logic — sorting, filtering, pagination, grouping, column visibility, row selection — with no markup of its own. The table engine shadcn/ui's data-table blocks are built on.

- **Docs:** https://tanstack.com/table/latest
- **Repository:** https://github.com/TanStack/table (tracked branch `main`)
- **Install:** `npm i @tanstack/react-table`
- **Licence:** MIT
- **Source on disk:** `frontend/data/upstream/table` — pinned submodule, read it, never edit it
- **Our code for it:** [`frontend/data/patterns`](../frontend/data/patterns) — reuse or extend this first
- **Use when:** Any table beyond a static list. Our own column/state helpers in `frontend/data/patterns` wrap it.
- **Avoid when:** You need a fully rendered spreadsheet grid with editing out of the box — that is MUI Data Grid Pro or AG Grid territory.
- **Alternatives here:** [Ant Design](#ant-design) · [MUI (Material UI)](#mui-material-ui)
- **Tags:** `table` `datagrid` `sorting` `filtering` `pagination` `headless` `react`
- **Licence and maintenance last verified:** 2026-09-15

#### React Hook Form

Uncontrolled-input form library: minimal re-renders, small runtime, and a resolver interface that plugs straight into Zod for validation.

- **Docs:** https://react-hook-form.com
- **Repository:** https://github.com/react-hook-form/react-hook-form (tracked branch `master`)
- **Install:** `npm i react-hook-form @hookform/resolvers`
- **Licence:** MIT
- **Source on disk:** `frontend/data/upstream/react-hook-form` — pinned submodule, read it, never edit it
- **Our code for it:** [`frontend/data/patterns`](../frontend/data/patterns) — reuse or extend this first
- **Use when:** Every form. Combine with Zod through `@hookform/resolvers/zod`.
- **Avoid when:** A single-field search box — plain state is simpler.
- **Alternatives here:** [Mantine](#mantine) · [TanStack Table](#tanstack-table)
- **Tags:** `forms` `validation` `react` `performance` `resolver` `zod`
- **Licence and maintenance last verified:** 2026-09-15

#### Zod

TypeScript-first schema validation where the static type is inferred from the schema, so one definition validates at runtime and types at compile time. The shared contract between forms, API routes and env config.

- **Docs:** https://zod.dev
- **Repository:** https://github.com/colinhacks/zod (tracked branch `main`)
- **Install:** `npm i zod`
- **Licence:** MIT
- **Source on disk:** `frontend/data/upstream/zod` — pinned submodule, read it, never edit it
- **Our code for it:** [`frontend/data/patterns`](../frontend/data/patterns) — reuse or extend this first
- **Use when:** Validating anything crossing a boundary — form input, API request/response, environment variables, LLM output.
- **Avoid when:** Almost never in a TypeScript codebase.
- **Alternatives here:** [React Hook Form](#react-hook-form)
- **Tags:** `validation` `schema` `typescript` `inference` `forms` `api` `env`
- **Licence and maintenance last verified:** 2026-09-15

#### TanStack Query

Server-state manager: caching, background refetching, deduplication, pagination, optimistic updates and retry policy. Removes most of the reason teams reach for a global state library.

- **Docs:** https://tanstack.com/query/latest
- **Repository:** https://github.com/TanStack/query (tracked branch `main`)
- **Install:** `npm i @tanstack/react-query`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Any client that talks to an API. Reach for this before Redux or a hand-rolled fetch layer.
- **Avoid when:** Data that is purely local and never fetched — that is Zustand's job. In a React Server Components app, fetch on the server first and use Query for interactive/polling surfaces.
- **Alternatives here:** [Zustand](#zustand)
- **Tags:** `data-fetching` `cache` `server-state` `async` `react` `pagination` `retry`
- **Licence and maintenance last verified:** 2026-09-15

#### TanStack Router

Fully type-safe router for React SPAs, including typed search parameters, loaders and nested routes.

- **Docs:** https://tanstack.com/router/latest
- **Repository:** https://github.com/TanStack/router (tracked branch `main`)
- **Install:** `npm i @tanstack/react-router`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** A client-rendered SPA (Vite) where route and search-param typing matter.
- **Avoid when:** You are on Next.js — its App Router already owns routing.
- **Alternatives here:** [Next.js](#nextjs)
- **Tags:** `router` `spa` `type-safe` `vite` `search-params` `loaders`
- **Licence and maintenance last verified:** 2026-09-15

#### TanStack Virtual

Headless virtualisation for long lists and large tables — renders only what is on screen.

- **Docs:** https://tanstack.com/virtual/latest
- **Repository:** https://github.com/TanStack/virtual (tracked branch `main`)
- **Install:** `npm i @tanstack/react-virtual`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** A list or table passes a few thousand rows and scrolling starts to stutter.
- **Avoid when:** Under ~1000 rows; virtualisation costs complexity (and breaks Ctrl+F) for no gain.
- **Alternatives here:** [TanStack Table](#tanstack-table)
- **Tags:** `virtualisation` `performance` `long-list` `scrolling` `react`
- **Licence and maintenance last verified:** 2026-09-15

#### Zustand

Minimal client-state store — a hook, no provider, no boilerplate, with selector-based subscriptions that avoid needless re-renders.

- **Docs:** https://zustand.docs.pmnd.rs
- **Repository:** https://github.com/pmndrs/zustand (tracked branch `main`)
- **Install:** `npm i zustand`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Genuinely global client state — theme, sidebar, wizard progress, editor buffers.
- **Avoid when:** The state is server data (use TanStack Query) or lives in one component (use useState).
- **Alternatives here:** [TanStack Query](#tanstack-query)
- **Tags:** `state` `store` `hooks` `react` `global-state` `lightweight`
- **Licence and maintenance last verified:** 2026-09-15

---

## Charts and data visualisation

Rendering numbers. Canvas, SVG and dashboard-oriented options.

| Technology | Use it for | Install | Maturity | Licence |
| --- | --- | --- | --- | --- |
| **[Chart.js](https://www.chartjs.org/docs/latest/)** | Dashboards and reports — our house presets in `frontend/chartjs/examples` already cover palette, axes and tooltips. | `npm i chart.js react-chartjs-2` | 🟢 standard | MIT |
| **[react-chartjs-2](https://react-chartjs-2.js.org)** | Rendering any Chart.js chart inside React. | `npm i react-chartjs-2 chart.js` | 🟢 standard | MIT |
| **[Recharts](https://recharts.org)** | A React + Tailwind product where charts must inherit theme tokens and be styled with CSS — and dataset sizes are moderate. | `npm i recharts` | 🟢 standard | MIT |
| **[Apache ECharts](https://echarts.apache.org/en/index.html)** | The chart type does not exist elsewhere, or the dataset is large enough to need WebGL. | `npm i echarts echarts-for-react` | 🟢 standard | Apache-2.0 |

#### Chart.js

Canvas-based charting library. Canonical reference for chart options, scales, plugins and the public typings our presets are built against.

- **Docs:** https://www.chartjs.org/docs/latest/
- **Repository:** https://github.com/chartjs/Chart.js (tracked branch `master`)
- **Install:** `npm i chart.js react-chartjs-2`
- **Licence:** MIT
- **Source on disk:** `frontend/chartjs/upstream/Chart.js` — pinned submodule, read it, never edit it
- **Our code for it:** [`frontend/chartjs/examples`](../frontend/chartjs/examples) — reuse or extend this first
- **Use when:** Dashboards and reports — our house presets in `frontend/chartjs/examples` already cover palette, axes and tooltips.
- **Avoid when:** You need each datum to be a DOM node (custom hover targets, CSS animation, SSR-friendly markup) — use Recharts.
- **Alternatives here:** [Recharts](#recharts) · [Apache ECharts](#apache-echarts) · [Tremor](#tremor)
- **Tags:** `charts` `canvas` `dashboard` `line` `bar` `doughnut` `performance`
- **Licence and maintenance last verified:** 2026-09-15

#### react-chartjs-2

Official React bindings for Chart.js. Included because Chart.js alone is not directly usable in our React frontends.

- **Docs:** https://react-chartjs-2.js.org
- **Repository:** https://github.com/reactchartjs/react-chartjs-2 (tracked branch `master`)
- **Install:** `npm i react-chartjs-2 chart.js`
- **Licence:** MIT
- **Source on disk:** `frontend/chartjs/upstream/react-chartjs-2` — pinned submodule, read it, never edit it
- **Our code for it:** [`frontend/chartjs/examples`](../frontend/chartjs/examples) — reuse or extend this first
- **Use when:** Rendering any Chart.js chart inside React.
- **Avoid when:** Non-React frontends — use Chart.js directly.
- **Alternatives here:** [Recharts](#recharts)
- **Tags:** `charts` `react` `bindings` `canvas`
- **Licence and maintenance last verified:** 2026-09-15

#### Recharts

SVG charting built from composable React components (`<LineChart>`, `<XAxis>`, `<Tooltip>`). The charting layer used by the shadcn/ui chart blocks, so it themes with CSS variables like everything else.

- **Docs:** https://recharts.org
- **Repository:** https://github.com/recharts/recharts (tracked branch `main`)
- **Install:** `npm i recharts`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** A React + Tailwind product where charts must inherit theme tokens and be styled with CSS — and dataset sizes are moderate.
- **Avoid when:** Tens of thousands of points — SVG creates a DOM node per element; use Chart.js or ECharts instead.
- **Alternatives here:** [Chart.js](#chartjs) · [Apache ECharts](#apache-echarts) · [Tremor](#tremor)
- **Tags:** `charts` `svg` `react` `composable` `tailwind` `shadcn` `theming`
- **Licence and maintenance last verified:** 2026-09-15

#### Apache ECharts

Heavy-duty visualisation from the Apache Foundation: geo maps, treemaps, sankey, candlestick, 3D, and WebGL rendering for very large datasets.

- **Docs:** https://echarts.apache.org/en/index.html
- **Repository:** https://github.com/apache/echarts (tracked branch `master`)
- **Install:** `npm i echarts echarts-for-react`
- **Licence:** Apache-2.0
- **Source on disk:** not ingested — use the docs link above
- **Use when:** The chart type does not exist elsewhere, or the dataset is large enough to need WebGL.
- **Avoid when:** A simple line or bar chart — the API and bundle are far larger than the job needs.
- **Alternatives here:** [Chart.js](#chartjs) · [Recharts](#recharts)
- **Tags:** `charts` `webgl` `maps` `sankey` `treemap` `big-data` `visualisation`
- **Licence and maintenance last verified:** 2026-09-15

---

## Motion, icons and rich interaction

Animation, icon sets, drag and drop, rich text, command palettes, toasts, drawers and resizable panels — the pieces a product needs once the skeleton works.

| Technology | Use it for | Install | Maturity | Licence |
| --- | --- | --- | --- | --- |
| **[Motion (Framer Motion)](https://motion.dev/docs/react)** | Any animation beyond a CSS transition — page transitions, shared layout, drag gestures. | `npm i motion` | 🟢 standard | MIT |
| **[Lucide Icons](https://lucide.dev/icons/)** | Default icon set for every product. One import per icon keeps bundles small. | `npm i lucide-react` | 🟢 standard | ISC |
| **[dnd kit](https://docs.dndkit.com)** | Kanban boards, sortable lists, dashboard layout builders, file re-ordering. | `npm i @dnd-kit/core @dnd-kit/sortable` | 🔵 established | MIT |
| **[Tiptap](https://tiptap.dev/docs)** | The product needs a real editor — comments, documents, CMS content, AI chat composers. | `npm i @tiptap/react @tiptap/starter-kit` | 🔵 established | MIT |
| **[cmdk](https://cmdk.paco.me)** | Adding a ⌘K palette, a searchable action list, or a combobox with fuzzy filtering. | `npm i cmdk` | 🔵 established | MIT |
| **[Sonner](https://sonner.emilkowal.ski)** | Any transient success/error feedback. `toast.promise()` covers the common async case. | `npm i sonner` | 🔵 established | MIT |
| **[Vaul](https://vaul.emilkowal.ski)** | Mobile sheets and any bottom-drawer interaction. | `npm i vaul` | 🔵 established | MIT |
| **[react-resizable-panels](https://react-resizable-panels.vercel.app)** | IDE-style layouts, side-by-side previews, adjustable inspector panels. | `npm i react-resizable-panels` | 🔵 established | MIT |

#### Motion (Framer Motion)

The React animation library, formerly Framer Motion: declarative animations, gestures, layout transitions, scroll-linked effects, and a hybrid engine that uses the browser's native animations where possible.

- **Docs:** https://motion.dev/docs/react
- **Repository:** https://github.com/motiondivision/motion (tracked branch `main`)
- **Install:** `npm i motion`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Any animation beyond a CSS transition — page transitions, shared layout, drag gestures.
- **Avoid when:** A hover colour change. CSS is free; this is not.
- **Alternatives here:** [Magic UI](#magic-ui)
- **Tags:** `animation` `motion` `gestures` `transitions` `framer-motion` `react`
- **Licence and maintenance last verified:** 2026-09-15

#### Lucide Icons

1500+ consistent open-source icons with a tree-shakeable React package. The icon set shadcn/ui assumes, so using anything else creates visual drift across components.

- **Docs:** https://lucide.dev/icons/
- **Repository:** https://github.com/lucide-icons/lucide (tracked branch `main`)
- **Install:** `npm i lucide-react`
- **Licence:** ISC — GitHub reports `NOASSERTION`; see the recorded licence review in `sources.yml`
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Default icon set for every product. One import per icon keeps bundles small.
- **Avoid when:** You need brand/logo marks (Lucide deliberately excludes them) or a filled-style set.
- **Tags:** `icons` `svg` `react` `tree-shaking` `shadcn`
- **Licence and maintenance last verified:** 2026-09-15

#### dnd kit

Modern drag-and-drop toolkit for React with keyboard-accessible sensors, sortable lists, and no reliance on the HTML5 drag events.

- **Docs:** https://docs.dndkit.com
- **Repository:** https://github.com/clauderic/dnd-kit (tracked branch `main`)
- **Install:** `npm i @dnd-kit/core @dnd-kit/sortable`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Kanban boards, sortable lists, dashboard layout builders, file re-ordering.
- **Avoid when:** Simple file drop zones — the browser's native drag events are enough.
- **Tags:** `drag-and-drop` `sortable` `kanban` `accessibility` `react`
- **Licence and maintenance last verified:** 2026-09-15

#### Tiptap

Headless rich-text editor built on ProseMirror: your own UI, an extension system for mentions, tables, collaboration and slash commands.

- **Docs:** https://tiptap.dev/docs
- **Repository:** https://github.com/ueberdosis/tiptap (tracked branch `main`)
- **Install:** `npm i @tiptap/react @tiptap/starter-kit`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** The product needs a real editor — comments, documents, CMS content, AI chat composers.
- **Avoid when:** A plain textarea will do. Also check the licence of individual Pro extensions separately; the core is MIT, some official extensions are not.
- **Tags:** `editor` `rich-text` `prosemirror` `wysiwyg` `cms` `collaboration`
- **Licence and maintenance last verified:** 2026-09-15

#### cmdk

The command-menu primitive behind shadcn/ui's `<Command>` and the ⌘K palettes in Linear, Vercel and Raycast-style UIs. Composable, filtered and keyboard-driven.

- **Docs:** https://cmdk.paco.me
- **Repository:** https://github.com/dip/cmdk (tracked branch `main`)
- **Install:** `npm i cmdk`
- **Licence:** MIT
- **Source on disk:** `frontend/interaction/upstream/cmdk` — pinned submodule, read it, never edit it
- **Use when:** Adding a ⌘K palette, a searchable action list, or a combobox with fuzzy filtering.
- **Avoid when:** A plain `<select>` would do.
- **Alternatives here:** [Radix Primitives](#radix-primitives)
- **⚠️ Maintenance:** Quiet for ~320 days at the vetting date, and effectively feature-complete. Small enough (~1 MB) that reading the source is a realistic fallback, which is why it is ingested rather than merely referenced.
- **Tags:** `command-palette` `cmdk` `search` `combobox` `keyboard` `shadcn`
- **Licence and maintenance last verified:** 2026-09-15

#### Sonner

Opinionated toast component — stacking, swipe-to-dismiss, promise-bound toasts. shadcn/ui's recommended toaster.

- **Docs:** https://sonner.emilkowal.ski
- **Repository:** https://github.com/emilkowalski/sonner (tracked branch `main`)
- **Install:** `npm i sonner`
- **Licence:** MIT
- **Source on disk:** `frontend/interaction/upstream/sonner` — pinned submodule, read it, never edit it
- **Use when:** Any transient success/error feedback. `toast.promise()` covers the common async case.
- **Avoid when:** Errors the user must act on — use a dialog or inline form error instead.
- **Tags:** `toast` `notifications` `feedback` `shadcn` `react`
- **Licence and maintenance last verified:** 2026-09-15

#### Vaul

Drawer component for React with native-feeling snap points and drag dismissal, built on Radix Dialog. Powers shadcn/ui's `<Drawer>`.

- **Docs:** https://vaul.emilkowal.ski
- **Repository:** https://github.com/emilkowalski/vaul (tracked branch `main`)
- **Install:** `npm i vaul`
- **Licence:** MIT
- **Source on disk:** `frontend/interaction/upstream/vaul` — pinned submodule, read it, never edit it
- **Use when:** Mobile sheets and any bottom-drawer interaction.
- **Avoid when:** Desktop-first dialogs — use Radix Dialog directly.
- **Alternatives here:** [Radix Primitives](#radix-primitives)
- **⚠️ Maintenance:** Quiet for ~347 days at the vetting date; stable and widely used via shadcn/ui's Drawer.
- **Tags:** `drawer` `sheet` `mobile` `gestures` `shadcn` `radix`
- **Licence and maintenance last verified:** 2026-09-15

#### react-resizable-panels

Resizable split-pane layouts with persisted sizes and keyboard-accessible handles. The component behind shadcn/ui's `<ResizablePanelGroup>`.

- **Docs:** https://react-resizable-panels.vercel.app
- **Repository:** https://github.com/bvaughn/react-resizable-panels (tracked branch `main`)
- **Install:** `npm i react-resizable-panels`
- **Licence:** MIT
- **Source on disk:** `frontend/interaction/upstream/react-resizable-panels` — pinned submodule, read it, never edit it
- **Use when:** IDE-style layouts, side-by-side previews, adjustable inspector panels.
- **Avoid when:** A fixed sidebar — CSS grid is simpler.
- **Tags:** `layout` `panels` `split-pane` `resizable` `ide` `shadcn`
- **Licence and maintenance last verified:** 2026-09-15

---

## Production starter templates

Whole applications, not components. Clone one of these when starting a new product: auth, billing, database, CI and project structure are already wired together by people who ship.

| Technology | Use it for | Install | Maturity | Licence |
| --- | --- | --- | --- | --- |
| **[Next.js SaaS Starter](https://github.com/nextjs/saas-starter#readme)** | Starting a subscription product. This is the fastest honest answer to "how do I wire Stripe, auth and Postgres into Next.js?". | `npx degit nextjs/saas-starter my-app` | 🔵 established | MIT |
| **[Next.js Enterprise Boilerplate](https://github.com/Blazity/next-enterprise#readme)** | Starting a long-lived application and you want the quality tooling decided on day one. | `npx degit Blazity/next-enterprise my-app` | 🔵 established | MIT |
| **[Next.js Boilerplate (ixartz)](https://github.com/ixartz/Next-js-Boilerplate#readme)** | You want a modern, currently-maintained Next.js base including internationalisation and observability. | `npx degit ixartz/Next-js-Boilerplate my-app` | 🔵 established | MIT |
| **[Next.js Commerce](https://vercel.com/templates/ecommerce/nextjs-commerce)** | Building a storefront, or needing a serious reference for RSC data flow and caching. | `npx degit vercel/commerce my-store` | 🔵 established | MIT |
| **[Taxonomy (shadcn)](https://github.com/shadcn-ui/taxonomy#readme)** | You need to see how the shadcn/ui pieces fit into a real application layout — nav, shell, settings, empty states — rather than in isolation. | `npx degit shadcn-ui/taxonomy my-app` | 🔵 established | MIT |
| **[create-t3-app](https://create.t3.gg)** | A new full-stack TypeScript app where you want typed API calls without writing a schema layer yourself. | `npm create t3-app@latest` | 🔵 established | MIT |
| **[Refine](https://refine.dev/docs/)** | Internal tools and admin panels where the work is 80% CRUD — this removes most of the wiring rather than most of the styling. | `npm create refine-app@latest` | 🔵 established | MIT |

#### Next.js SaaS Starter

The reference SaaS starter from the Next.js team: App Router, Stripe subscriptions and customer portal, JWT session auth, Postgres via Drizzle, role-based teams, activity logging and a dashboard shell.

- **Docs:** https://github.com/nextjs/saas-starter#readme
- **Repository:** https://github.com/nextjs/saas-starter (tracked branch `main`)
- **Install:** `npx degit nextjs/saas-starter my-app`
- **Licence:** MIT
- **Source on disk:** `frontend/starters/upstream/saas-starter` — pinned submodule, read it, never edit it
- **Use when:** Starting a subscription product. This is the fastest honest answer to "how do I wire Stripe, auth and Postgres into Next.js?".
- **Avoid when:** You already have auth and billing, or you are not on Postgres/Drizzle.
- **Alternatives here:** [Next.js Enterprise Boilerplate](#nextjs-enterprise-boilerplate) · [Next.js Boilerplate (ixartz)](#nextjs-boilerplate-ixartz) · [create-t3-app](#create-t3-app)
- **⚠️ Maintenance:** ~278 days since the last upstream push at the vetting date; read it as a reference implementation, and update its dependencies after cloning.
- **Tags:** `saas` `stripe` `billing` `subscriptions` `auth` `postgres` `drizzle` `nextjs` `dashboard` `template`
- **Licence and maintenance last verified:** 2026-09-15

#### Next.js Enterprise Boilerplate

Opinionated Next.js setup for teams: strict TypeScript, ESLint/Prettier, Jest + Playwright + Storybook, CVA component conventions, bundle analysis, Conventional Commits, Renovate and a complete CI pipeline.

- **Docs:** https://github.com/Blazity/next-enterprise#readme
- **Repository:** https://github.com/Blazity/next-enterprise (tracked branch `main`)
- **Install:** `npx degit Blazity/next-enterprise my-app`
- **Licence:** MIT
- **Source on disk:** `frontend/starters/upstream/next-enterprise` — pinned submodule, read it, never edit it
- **Use when:** Starting a long-lived application and you want the quality tooling decided on day one.
- **Avoid when:** A prototype — the toolchain is deliberately heavy.
- **Alternatives here:** [Next.js Boilerplate (ixartz)](#nextjs-boilerplate-ixartz) · [Next.js SaaS Starter](#nextjs-saas-starter)
- **Tags:** `nextjs` `enterprise` `typescript` `ci` `storybook` `playwright` `eslint` `template`
- **Licence and maintenance last verified:** 2026-09-15

#### Next.js Boilerplate (ixartz)

Actively maintained Next.js starter with Tailwind, Clerk authentication, Drizzle ORM, i18n, Sentry, Pino logging, Vitest and Playwright already integrated.

- **Docs:** https://github.com/ixartz/Next-js-Boilerplate#readme
- **Repository:** https://github.com/ixartz/Next-js-Boilerplate (tracked branch `main`)
- **Install:** `npx degit ixartz/Next-js-Boilerplate my-app`
- **Licence:** MIT
- **Source on disk:** `frontend/starters/upstream/next-js-boilerplate` — pinned submodule, read it, never edit it
- **Use when:** You want a modern, currently-maintained Next.js base including internationalisation and observability.
- **Avoid when:** You do not want Clerk as the auth provider — it is woven through the template.
- **Alternatives here:** [Next.js Enterprise Boilerplate](#nextjs-enterprise-boilerplate) · [Next.js SaaS Starter](#nextjs-saas-starter)
- **Tags:** `nextjs` `tailwind` `clerk` `auth` `i18n` `drizzle` `sentry` `testing` `template`
- **Licence and maintenance last verified:** 2026-09-15

#### Next.js Commerce

Vercel's production storefront template: Shopify-backed catalogue, cart and checkout, React Server Components, streaming, optimistic UI and SEO-complete product pages.

- **Docs:** https://vercel.com/templates/ecommerce/nextjs-commerce
- **Repository:** https://github.com/vercel/commerce (tracked branch `main`)
- **Install:** `npx degit vercel/commerce my-store`
- **Licence:** MIT
- **Source on disk:** `frontend/starters/upstream/commerce` — pinned submodule, read it, never edit it
- **Use when:** Building a storefront, or needing a serious reference for RSC data flow and caching.
- **Avoid when:** Your commerce backend is not Shopify — the data layer would need replacing.
- **Alternatives here:** [Next.js SaaS Starter](#nextjs-saas-starter)
- **Tags:** `ecommerce` `storefront` `shopify` `rsc` `cart` `checkout` `seo` `template`
- **Licence and maintenance last verified:** 2026-09-15

#### Taxonomy (shadcn)

shadcn's own full Next.js application: App Router, marketing site, authenticated dashboard, MDX docs and blog, Stripe subscriptions, and the canonical example of shadcn/ui used at application scale.

- **Docs:** https://github.com/shadcn-ui/taxonomy#readme
- **Repository:** https://github.com/shadcn-ui/taxonomy (tracked branch `main`)
- **Install:** `npx degit shadcn-ui/taxonomy my-app`
- **Licence:** MIT
- **Source on disk:** `frontend/starters/upstream/taxonomy` — pinned submodule, read it, never edit it
- **Use when:** You need to see how the shadcn/ui pieces fit into a real application layout — nav, shell, settings, empty states — rather than in isolation.
- **Avoid when:** As a production base; prefer the SaaS starter or the enterprise boilerplate.
- **Alternatives here:** [Next.js SaaS Starter](#nextjs-saas-starter) · [Next.js Enterprise Boilerplate](#nextjs-enterprise-boilerplate)
- **⚠️ Maintenance:** A demonstration application rather than a maintained product starter; read it, then update dependencies.
- **Tags:** `nextjs` `shadcn` `dashboard` `mdx` `blog` `stripe` `auth` `example` `template`
- **Licence and maintenance last verified:** 2026-09-15

#### create-t3-app

Interactive scaffolder for the "T3 stack" — Next.js, TypeScript, Tailwind, tRPC, Prisma/Drizzle and NextAuth — where you pick the pieces and it wires end-to-end type safety between them.

- **Docs:** https://create.t3.gg
- **Repository:** https://github.com/t3-oss/create-t3-app (tracked branch `main`)
- **Install:** `npm create t3-app@latest`
- **Licence:** MIT
- **Source on disk:** `frontend/starters/upstream/create-t3-app` — pinned submodule, read it, never edit it
- **Use when:** A new full-stack TypeScript app where you want typed API calls without writing a schema layer yourself.
- **Avoid when:** Your API is a separate service, or the team does not want tRPC.
- **Alternatives here:** [Next.js SaaS Starter](#nextjs-saas-starter) · [Next.js Boilerplate (ixartz)](#nextjs-boilerplate-ixartz)
- **⚠️ Maintenance:** ~276 days since the last upstream push at the vetting date; the generated stack itself remains widely used.
- **Tags:** `scaffold` `trpc` `prisma` `nextauth` `typescript` `fullstack` `template`
- **Licence and maintenance last verified:** 2026-09-15

#### Refine

Headless React framework for CRUD-heavy applications: data providers for REST/GraphQL/Supabase/Strapi, auth providers, access control, audit logs and generated admin screens — with the UI layer left to you (works with shadcn/ui, MUI, Ant Design).

- **Docs:** https://refine.dev/docs/
- **Repository:** https://github.com/refinedev/refine (tracked branch `main`)
- **Install:** `npm create refine-app@latest`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Internal tools and admin panels where the work is 80% CRUD — this removes most of the wiring rather than most of the styling.
- **Avoid when:** A consumer product with bespoke flows; the abstraction stops paying for itself.
- **Alternatives here:** [Ant Design](#ant-design) · [Next.js SaaS Starter](#nextjs-saas-starter)
- **Tags:** `admin` `crud` `internal-tools` `headless` `data-provider` `rbac` `supabase`
- **Licence and maintenance last verified:** 2026-09-15

---

## Framework, styling and quality tooling

The foundation every frontend here sits on — framework, CSS engine, component workshop, end-to-end testing.

| Technology | Use it for | Install | Maturity | Licence |
| --- | --- | --- | --- | --- |
| **[Next.js](https://nextjs.org/docs)** | Default for web products — SSR/SSG, SEO, API routes and deployment are solved together. | `npx create-next-app@latest` | 🟢 standard | MIT |
| **[Tailwind CSS](https://tailwindcss.com/docs)** | Default styling layer for new frontends here. | `npm i -D tailwindcss @tailwindcss/postcss` | 🟢 standard | MIT |
| **[Storybook](https://storybook.js.org/docs)** | A shared component library or design system — stories are how the rest of the team discovers what exists. | `npx storybook@latest init` | 🟢 standard | MIT |
| **[Playwright](https://playwright.dev/docs/intro)** | Any user journey that must not break — sign-up, checkout, billing. | `npm init playwright@latest` | 🟢 standard | Apache-2.0 |

#### Next.js

The React framework this library's starters and components assume: App Router, React Server Components, server actions, streaming, image and font optimisation, middleware.

- **Docs:** https://nextjs.org/docs
- **Repository:** https://github.com/vercel/next.js (tracked branch `canary`)
- **Install:** `npx create-next-app@latest`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Default for web products — SSR/SSG, SEO, API routes and deployment are solved together.
- **Avoid when:** A pure internal SPA with no SEO or server rendering needs — Vite plus TanStack Router is lighter.
- **Alternatives here:** [TanStack Router](#tanstack-router)
- **Tags:** `framework` `react` `ssr` `rsc` `app-router` `seo` `vercel`
- **Licence and maintenance last verified:** 2026-09-15

#### Tailwind CSS

The utility-class CSS engine every Tailwind-native system in this catalog is built on, and the styling convention our internal components follow.

- **Docs:** https://tailwindcss.com/docs
- **Repository:** https://github.com/tailwindlabs/tailwindcss (tracked branch `main`)
- **Install:** `npm i -D tailwindcss @tailwindcss/postcss`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Default styling layer for new frontends here.
- **Avoid when:** Joining an existing codebase with an established CSS-in-JS or CSS-modules convention.
- **Tags:** `css` `utility-classes` `design-tokens` `styling` `postcss`
- **Licence and maintenance last verified:** 2026-09-15

#### Storybook

Component workshop and living documentation: develop components in isolation, capture states as stories, and run interaction and accessibility tests against them.

- **Docs:** https://storybook.js.org/docs
- **Repository:** https://github.com/storybookjs/storybook (tracked branch `next`)
- **Install:** `npx storybook@latest init`
- **Licence:** MIT
- **Source on disk:** not ingested — use the docs link above
- **Use when:** A shared component library or design system — stories are how the rest of the team discovers what exists.
- **Avoid when:** A small app with a handful of components; the maintenance is not repaid.
- **Tags:** `components` `documentation` `testing` `design-system` `isolation` `a11y`
- **Licence and maintenance last verified:** 2026-09-15

#### Playwright

End-to-end browser testing across Chromium, Firefox and WebKit, with auto-waiting, tracing, network interception and visual comparison.

- **Docs:** https://playwright.dev/docs/intro
- **Repository:** https://github.com/microsoft/playwright (tracked branch `main`)
- **Install:** `npm init playwright@latest`
- **Licence:** Apache-2.0
- **Source on disk:** not ingested — use the docs link above
- **Use when:** Any user journey that must not break — sign-up, checkout, billing.
- **Avoid when:** Unit-testing a pure function; Vitest is orders of magnitude faster.
- **Tags:** `testing` `e2e` `browser` `automation` `visual-regression` `ci`
- **Licence and maintenance last verified:** 2026-09-15


---

## Rejected on licence grounds

Recorded so the decision is auditable, and so nobody re-proposes them. **Do not
copy code from these repositories.**

| Repository | Licence | Why it is not here |
| --- | --- | --- |
| [shadcn-ui/next-template](https://github.com/shadcn-ui/next-template) | `NOASSERTION` | Repository is ARCHIVED and ships NO LICENSE file. Absent an explicit licence grant, default copyright applies and redistribution is not permitted. We therefore do not vendor, submodule or copy any of its code. Recorded here only so the decision is visible and re-checkable. |
| [vercel/platforms](https://github.com/vercel/platforms) | `NONE` | The multi-tenant Next.js starter is a genuinely useful reference, but the repository ships NO LICENSE file (confirmed via the GitHub API on 2026-09-15). No licence grant means no permission to copy, so it is not ingested and must not be copied from. Read it on GitHub if you need the subdomain-routing idea, and write the implementation yourself. |

---

## How to add something to this catalog

```bash
npm run vet -- owner/repo      # licence, maintenance, weight — from the API
```

Then follow [adding-a-source.md](./adding-a-source.md). A source with no
licence file is never added, however useful it looks.
