# Engineering Library

A **living, version-controlled library of vetted engineering sources** that stays
connected to the public repositories it is built on.

This is not a folder of copied GitHub code. Every external technology here is
attached to its official upstream repository by a **pinned git submodule**, and
an automated pipeline detects when that upstream moves, validates the change,
and opens a pull request for a human to review.

> **Current scope:** proof of concept — frontend only (shadcn/ui, Chart.js,
> react-chartjs-2). The architecture is category-agnostic; `backend/`, `ai/`,
> `database/`, `integrations/`, `infrastructure/` slot in without redesign.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [How upstream repositories are connected](#how-upstream-repositories-are-connected)
- [Repository layout](#repository-layout)
- [The golden rule: upstream vs internal](#the-golden-rule-upstream-vs-internal)
- [How synchronisation works](#how-synchronisation-works)
- [Dependency management](#dependency-management)
- [For developers](#for-developers)
- [For AI coding agents](#for-ai-coding-agents)
- [Adding a new upstream source](#adding-a-new-upstream-source)
- [What you must not modify](#what-you-must-not-modify)
- [Licensing](#licensing)

---

## Why this exists

Teams repeatedly solve the same problems — a dashboard chart, a button variant,
a form pattern — by starting from scratch or by copy-pasting a snippet from a
GitHub repository that then rots in place, disconnected from its source.

This library fixes both halves of that problem:

| Problem | How this library solves it |
| --- | --- |
| "We rebuilt something that already exists." | A small, curated set of vetted sources, documented and searchable. |
| "Our copy is two years behind upstream." | Automated daily drift detection against the real upstream branch. |
| "Nobody knows where this code came from." | Every source has a machine-readable upstream URL, tracked branch and pinned commit. |
| "Updating upstream wiped our changes." | Upstream and internal code are in separate directories, and the separation is enforced by CI. |
| "We copied code we had no licence for." | Licences are verified before ingest and re-verified on every sync. |

---

## How upstream repositories are connected

**Every upstream source is a pinned git submodule.** We do not copy, vendor or
fork upstream code.

A submodule stores two things in our repository:

1. the upstream URL, in [`.gitmodules`](.gitmodules)
2. a 40-character commit SHA — the exact upstream revision we point at

That is the entire footprint. Browse to
[`frontend/chartjs/upstream/Chart.js`](frontend/chartjs/upstream/Chart.js) on
GitHub and you will see a link straight to `chartjs/Chart.js` at that commit.
The relationship is native to git, not reconstructed from a manifest.

**Why submodules rather than the alternatives** — the reasoning is written up in
[`docs/architecture.md`](docs/architecture.md#why-submodules). In short:

| Approach | Verdict |
| --- | --- |
| Copy / vendor the files | ✗ Breaks the upstream link. Explicitly what this project must not be. |
| `git subtree` | ✗ Imports ~110 MB of upstream history into our repo, and a `subtree pull` performs a **merge into our tree** — it can conflict with, and rewrite, our own files. |
| Fork each repository | ✗ Scales badly (one repo per source), and still needs a mechanism to relate forks to this library. |
| **Pinned `git submodule`** | ✓ Exact upstream identity, zero code duplication, an update is a reviewable one-line pointer change, and upstream *cannot* physically overwrite our code. |

The single real trade-off — submodule contents are not present in a plain
`git clone` — is handled with one flag, documented under
[For developers](#for-developers).

---

## Repository layout

```
engineering-library/
├── sources.yml                  ← THE REGISTRY. Source of truth for all automation.
├── .gitmodules                  ← git-native upstream pointers
├── AGENTS.md                    ← entrypoint for AI coding agents
├── NOTICE                       ← third-party attribution
│
├── frontend/
│   ├── README.md                ← what is in this category and when to use it
│   │
│   ├── shadcn/
│   │   ├── upstream/ui/         ← SUBMODULE → github.com/shadcn-ui/ui      (read-only)
│   │   └── templates/           ← OUR CODE  (safe to edit, tested, Dependabot-managed)
│   │
│   └── chartjs/
│       ├── upstream/Chart.js/          ← SUBMODULE → github.com/chartjs/Chart.js        (read-only)
│       ├── upstream/react-chartjs-2/   ← SUBMODULE → github.com/reactchartjs/react-chartjs-2 (read-only)
│       └── examples/                   ← OUR CODE  (safe to edit, tested, Dependabot-managed)
│
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── upstream-sync.yml    ← detect → sync → validate → PR
│       └── validate.yml         ← registry, docs, licences, internal tests
│
├── docs/
│   ├── upstream-sources.md      ← GENERATED from sources.yml
│   ├── architecture.md          ← design decisions and trade-offs
│   └── adding-a-source.md       ← how to extend the library
│
└── scripts/                     ← registry-driven automation (no hardcoded tech names)
```

Adding a category is just adding a top-level directory and registry entries —
`backend/`, `ai/`, `database/` follow the identical
`<category>/<technology>/{upstream,<internal>}` shape.

---

## The golden rule: upstream vs internal

> **`upstream/` is theirs. Everything else is ours.**

| | Upstream | Internal |
| --- | --- | --- |
| Where | any path under an `upstream/` directory | `templates/`, `examples/` (declared as `internal_dir` in the registry) |
| What | official third-party code, unmodified | our wrappers, presets, house patterns |
| Who changes it | upstream maintainers only | us |
| How it updates | automated sync PR, moving a commit pointer | normal pull requests |
| Editable? | **No.** Edits are impossible to commit — a submodule records only a pointer. | Yes. |
| Tested by us? | No — it is upstream's job | Yes: typecheck + unit tests in CI |

**An upstream sync can never damage internal code**, and this is enforced three
ways rather than merely promised:

1. **Structurally** — a submodule bump changes a 40-byte gitlink. There is no
   mechanism by which it can write into a sibling directory.
2. **`scripts/guard-internal.mjs`** — reads the allow-list from the registry and
   fails the build if a sync touches any path that is not a registered
   submodule pointer.
3. **Fingerprint check** — the sync workflow hashes the internal tree before and
   after the bump and aborts if the hashes differ.

---

## How synchronisation works

### The big picture

Two independent tracks keep the library current. Neither needs a human.

```mermaid
flowchart LR
    subgraph PUBLIC["🌍 Public upstream repositories"]
        U1["shadcn-ui/ui"]
        U2["chartjs/Chart.js"]
        U3["reactchartjs/react-chartjs-2"]
        NPM["npm registry<br/>react · typescript · vitest · tailwind-merge"]
    end

    subgraph AUTOMATION["⚙️ Automation in this repo"]
        SYNC["<b>upstream-sync.yml</b><br/>daily 06:00 UTC<br/><i>tracks repositories</i>"]
        DEPS["<b>Dependabot</b> + <b>auto-merge.yml</b><br/>weekly<br/><i>tracks packages</i>"]
    end

    subgraph LIB["📚 Engineering Library · main"]
        UP["<b>upstream/</b><br/>pinned submodules<br/>read-only"]
        INT["<b>templates/ · examples/</b><br/>our code<br/>editable"]
    end

    DEV["Developers<br/>and AI agents"]

    U1 & U2 & U3 --> SYNC
    NPM --> DEPS
    SYNC -->|"moves the commit pointer"| UP
    DEPS -->|"bumps package versions"| INT
    UP -.->|"API reference"| DEV
    INT ==>|"reuse this"| DEV

    style UP fill:#fff3cd,stroke:#d39e00,color:#000
    style INT fill:#d4edda,stroke:#28a745,color:#000
    style SYNC fill:#cce5ff,stroke:#0066cc,color:#000
    style DEPS fill:#cce5ff,stroke:#0066cc,color:#000
```

> 🟡 **Yellow = upstream, never edited.** 🟢 **Green = ours, safe to edit.**
> The two never overlap, and the sync is physically incapable of writing into green.

### The upstream sync pipeline, step by step

```mermaid
flowchart TD
    START(["⏰ Daily 06:00 UTC<br/>or manual run"]) --> READ["📖 Read <b>sources.yml</b><br/>the registry drives everything"]
    READ --> DETECT["🔍 <b>DETECT</b><br/>compare our pinned SHA against<br/>the live tip of the tracked branch"]

    DETECT --> BEHIND{"Behind<br/>upstream?"}
    BEHIND -->|No| DONE_OK(["✅ Already up to date<br/>nothing to do"])
    BEHIND -->|Yes| BUMP["📌 <b>SYNC</b><br/>move ONLY the submodule pointer<br/>to the new upstream commit"]

    BUMP --> GATE

    subgraph GATE["🛡️ VALIDATION GATE — every check must pass"]
        direction TB
        V1["Registry ↔ .gitmodules agree"]
        V2["Guard: only registered<br/>submodule pointers changed"]
        V3["Internal code hash<br/>identical before &amp; after"]
        V4["Licence re-verified<br/>AT THE NEW COMMIT"]
        V5["Our typecheck + tests pass<br/>against the new upstream"]
        V1 --> V2 --> V3 --> V4 --> V5
    end

    GATE --> PASS{"All checks<br/>passed?"}
    PASS -->|"❌ No"| STOP(["🛑 STOP<br/>nothing is published<br/>failure visible in Actions"])
    PASS -->|"✅ Yes"| STRATEGY{"<b>update_strategy</b><br/>in sources.yml"}

    STRATEGY -->|"<b>auto</b><br/>(current setting)"| PUSH["🚀 Commit straight to <b>main</b>"]
    STRATEGY -->|"pull-request"| PR["📬 Open a PR<br/>old SHA → new SHA, commit list,<br/>dependency impact, licence result"]

    PUSH --> REVALIDATE["🔁 Dispatch <b>Validate</b> on main<br/><i>token pushes don't self-trigger CI</i>"]
    PR --> HUMAN["👤 Human reviews and merges"]
    REVALIDATE --> FINAL(["📚 Library up to date"])
    HUMAN --> FINAL

    style GATE fill:#fff9e6,stroke:#d39e00,color:#000
    style STOP fill:#f8d7da,stroke:#dc3545,color:#000
    style PUSH fill:#d4edda,stroke:#28a745,color:#000
    style FINAL fill:#d4edda,stroke:#28a745,color:#000
    style DONE_OK fill:#d4edda,stroke:#28a745,color:#000
```

**The gate is the whole point.** Because `auto` removes the human reviewer,
nothing reaches `main` unless every check above passes. If upstream relicenses,
rewrites history, or breaks our code, the pipeline stops and says why.

### Why an upstream update can never destroy our code

```mermaid
flowchart LR
    SYNC["Upstream sync"]
    GITLINK["Writes a 40-byte<br/>commit pointer"]
    UPDIR["upstream/Chart.js"]
    INTDIR["examples/<br/><i>our presets, our tests</i>"]

    SYNC --> GITLINK --> UPDIR

    SYNC -.->|"blocked: structurally impossible"| INTDIR
    SYNC -.->|"blocked: guard-internal.mjs"| INTDIR
    SYNC -.->|"blocked: tree fingerprint"| INTDIR

    style UPDIR fill:#fff3cd,stroke:#d39e00,color:#000
    style INTDIR fill:#d4edda,stroke:#28a745,color:#000
    style SYNC fill:#cce5ff,stroke:#0066cc,color:#000
```

Three independent defences, not one: a submodule bump *physically* cannot touch
a sibling directory; the guard script rejects any changed path that isn't a
registered submodule pointer; and the workflow hashes our code before and after
the bump and aborts on any difference.

**This library updates itself.** All three frontend sources run
`update_strategy: auto`, so a validated upstream change lands on `main` with no
manual step. Dependency PRs from Dependabot are merged by `auto-merge.yml` once
their checks pass.

> **What this means:** with `auto`, **the test suite is the only gate** between
> an upstream change and `main`. The registry enforces that a source may only
> run `auto` if it declares an `internal_dir` — there must be tests to do the
> gating. To put a human back in the loop for any single source, set its
> `update_strategy` to `pull-request`. Nothing else changes.

### Failure modes that deliberately stop the pipeline

| Situation | Behaviour |
| --- | --- |
| Upstream relicensed | Sync refuses. Requires a deliberate licence review. |
| Our pinned commit no longer exists upstream (force-push) | Reported as `unreachable`; never silently re-pinned. |
| A sync would touch internal code | Guard fails the job before any PR is opened. |
| Internal tests break under the new upstream | PR is not opened; the failure is visible in the Actions run. |

### Running it yourself

```bash
npm run check:upstream                      # report drift, change nothing
npm run sync:upstream -- --source chartjs --dry-run
npm run validate                            # registry + docs + licences
```

---

## Dependency management

Two separate concerns, deliberately handled by two different mechanisms:

| What | Managed by | Cadence |
| --- | --- | --- |
| **Our internal packages'** dependencies (`chart.js`, `react-chartjs-2`, `react`, `typescript`, `vitest`, `clsx`, `tailwind-merge`, …) | **Dependabot** opens grouped PRs — [`.github/dependabot.yml`](.github/dependabot.yml) — and [`auto-merge.yml`](.github/workflows/auto-merge.yml) merges them once checks pass | weekly |
| **Our GitHub Actions** versions | Dependabot (`github-actions` ecosystem), same auto-merge path | weekly |
| **Upstream submodule pointers** | `upstream-sync.yml` (licence re-verification + guard + validation gate), committed straight to `main` | daily |
| **Dependencies *inside* upstream submodules** | Not ours to manage — upstream owns them. Changes are *reported* in every sync PR ("Did dependencies change?"). | reported |

Dependabot's `gitsubmodule` ecosystem is intentionally **not** enabled: it would
bump pointers without the licence check, internal-code guard or validation gate.

### How a dependency update merges itself

Dependabot has no direct-push mode — it always opens a PR. So something has to
merge it, and `auto-merge.yml` only does so once CI is genuinely green.

```mermaid
sequenceDiagram
    autonumber
    participant D as Dependabot
    participant PR as Pull request
    participant CI as Validate workflow
    participant AM as auto-merge.yml
    participant M as main

    D->>PR: Open grouped PR<br/>(e.g. react + react-dom + types)
    PR->>CI: Trigger checks
    CI->>CI: Registry · docs · licences
    CI->>CI: Typecheck + tests on BOTH packages
    CI-->>PR: Report result

    alt All checks passed
        CI->>AM: Completion triggers the sweep
        AM->>PR: Verify author is a trusted bot
        AM->>PR: Verify no check pending or failing
        AM->>M: Squash-merge and delete branch
        AM->>CI: Dispatch Validate on main
        Note over M: Updated with no human step
    else Any check failing or still running
        AM-->>PR: Leave open, report why
        Note over PR: Waits for the hourly sweep
    end
```

The sweep refuses to merge when checks are missing, pending or failing, only
trusts `dependabot[bot]` and `github-actions[bot]`, and **never touches a
human-authored PR**.

> **One documented exception.** `GITHUB_TOKEN` is a GitHub App token, and GitHub
> forbids an App from writing `.github/workflows/**` without the `workflows`
> permission — which cannot be granted from a `permissions:` block. So PRs that
> bump a **GitHub Action version** cannot be auto-merged. This never affects the
> frontend libraries. Add a PAT with the `workflow` scope as an
> `AUTOMERGE_TOKEN` secret to cover those too; the workflow already uses it when
> present.

---

## For developers

```bash
# Clone WITH upstream sources (recommended)
git clone --recurse-submodules https://github.com/wortholicai-hub/engineering-library.git

# Already cloned without them?
git submodule update --init --recursive

# Only need one upstream source? Fetch just that one.
git submodule update --init -- frontend/chartjs/upstream/Chart.js
```

Working on internal code:

```bash
cd frontend/chartjs/examples
npm install && npm test
```

**Workflow:** look in the internal directory for an existing pattern → if it
fits, use it → if it nearly fits, extend it *there* → only then write something
new. Read the upstream submodule to understand the underlying API; never edit it.

---

## For AI coding agents

Start at **[`AGENTS.md`](AGENTS.md)** — it is written for you and states the
rules in machine-checkable terms.

The short version:

1. Read [`sources.yml`](sources.yml) to learn what exists, what each source is
   for, and where its code lives.
2. Reuse from the **internal** directories (`templates/`, `examples/`). That is
   vetted, tested, house-style code.
3. Read the **upstream** directories for API truth. **Never edit them** — an
   edit there cannot even be committed.
4. Do not add a dependency that duplicates a registered source.

---

## Adding a new upstream source

Full walkthrough: **[`docs/adding-a-source.md`](docs/adding-a-source.md)**.

```bash
# 1. verify the licence permits our use, then:
git submodule add -b <branch> <upstream-url> <category>/<tech>/upstream/<name>
# 2. add the entry to sources.yml
# 3. regenerate docs and validate
npm run docs:render && npm run validate
```

No workflow or script needs editing — the automation is driven entirely by the
registry.

---

## What you must not modify

| Path | Why |
| --- | --- |
| anything under `*/upstream/**` | Upstream's code. Only the sync workflow moves these pointers. |
| `docs/upstream-sources.md` | Generated. Edit `sources.yml` and run `npm run docs:render`. |
| `sources.yml` — `update_strategy` | Change deliberately. `auto` means updates land on `main` unreviewed, gated only by tests. |
| `.gitmodules` by hand | Use `git submodule add/deinit` so it stays consistent with the registry. |

---

## Licensing

All three ingested sources are **MIT** licensed, which permits use,
modification and redistribution with attribution.

- Licence texts are preserved verbatim — they live inside each submodule at
  their original path.
- Attribution: [`NOTICE`](NOTICE).
- Per-source detail: [`docs/upstream-sources.md`](docs/upstream-sources.md).
- Our own code in this repository is MIT — see [`LICENSE`](LICENSE).

Licence compliance is **checked, not assumed**:
`scripts/license-audit.mjs` fails CI if an enabled source is missing its licence
file, or if the SPDX identifier GitHub reports for the upstream repository stops
matching what the registry records.

One repository was evaluated and **rejected** on licence grounds —
[`shadcn-ui/next-template`](https://github.com/shadcn-ui/next-template) is
archived and ships no LICENSE file, so no licence is granted and none of its
code is present here. It stays listed in the registry as `enabled: false` so the
decision is auditable rather than forgotten.
