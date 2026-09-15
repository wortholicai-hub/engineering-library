# Architecture

How the Engineering Library is built, and why each decision was made.

---

## The requirement

Track official public repositories so that:

1. the relationship to the original upstream repository is preserved,
2. upstream changes are detected automatically,
3. updates arrive through a reviewable, validated process,
4. our own code can never be destroyed by an upstream update,
5. new technologies and categories can be added without redesign,
6. licence compliance is verified rather than assumed.

---

## Why submodules

Four approaches were evaluated against those requirements.

### 1. Copy / vendor the files

Copy upstream files into our tree and record the origin in a manifest.

- ✗ The upstream link exists only as documentation. Nothing enforces it.
- ✗ Updating means re-copying, which overwrites — precisely the failure mode we
  must prevent.
- ✗ "Our copy" and "upstream" drift apart with no mechanical way to tell how far.
- ✗ Redistributes upstream code, raising the licensing stakes for no benefit.

**Rejected.** This is the "folder of copied GitHub code" this project must not be.

### 2. `git subtree`

Merge upstream history into a subdirectory of our repository.

- ✓ Genuinely git-native; upstream history is preserved.
- ✓ Contents are present in a plain clone.
- ✗ **Repository size.** The three sources total ~110 MB of history
  (shadcn/ui ~69 MB, Chart.js ~43 MB, react-chartjs-2 ~6 MB). That is imported
  permanently, and grows with every source added.
- ✗ **`subtree pull` is a merge into our tree.** It can conflict, and conflict
  resolution edits files. An automated subtree sync can therefore modify our
  working tree in ways a reviewer must untangle — directly at odds with
  requirement 4.
- ✗ A sync PR shows thousands of changed lines, so review degenerates into
  rubber-stamping.

**Rejected.** The merge semantics are the problem: they make "upstream sync
cannot touch our code" impossible to guarantee.

### 3. Fork each repository

- ✓ Preserves the relationship, and GitHub shows the fork link.
- ✗ One repository per source: the library stops being a single artefact.
- ✗ Still requires a mechanism to relate forks back to the library.
- ✗ Forks invite local commits, which is how a fork silently becomes a fork in
  the pejorative sense.

**Rejected.** Scales badly and solves the wrong half of the problem.

### 4. Pinned `git submodule` — **chosen**

Our repository stores the upstream URL plus one 40-character commit SHA.

- ✓ **Exact identity.** Not "roughly v4.4" — a specific commit, verifiable
  against upstream.
- ✓ **Native and visible.** GitHub renders a submodule as a link to the upstream
  repo at that commit. The relationship is a first-class git object.
- ✓ **Zero duplication.** ~110 MB of upstream history stays upstream. Our
  repository stays small no matter how many sources are added.
- ✓ **Reviewable updates.** An update is a one-line pointer change. A reviewer
  reads the PR body (commit list, dependency impact, licence result) and the
  compare link, rather than scrolling a 10,000-line diff.
- ✓ **Our code is structurally safe.** A submodule bump writes 40 bytes into a
  gitlink. It has no mechanism to modify a sibling directory. Requirement 4 is
  satisfied by construction, not by discipline.
- ✓ **Cleanest licence posture.** We reference upstream rather than
  redistributing it, and the upstream LICENSE file is always present verbatim at
  its original path.
- ✗ **One trade-off:** a plain `git clone` does not populate submodules.

The trade-off is real but bounded — it is `--recurse-submodules` at clone time,
or one command afterwards, and it is documented in the README, in `AGENTS.md`,
and in the category READMEs. That cost is worth paying for a guarantee that
upstream code cannot overwrite ours.

> **Scope note.** Submodules are right *for this use case*: tracking large
> upstream projects for reference, where we never build or ship upstream code.
> A source we needed to patch and compile would call for a different mechanism —
> a fork plus a dependency pin — and the registry has room for that
> (`sync_method`) without redesigning anything.

### Why not submodule everything

A submodule is the right answer when **reading the source is useful**. It is the
wrong answer when the source is enormous and nobody will read it: `submodules:
true` in CI clones every one of them on every run, and the catalog contains
libraries whose repositories dwarf this one — Ant Design is 281 MB, Next.js
2.5 GB, daisyUI 12 GB. Ingesting those would cost minutes of CI on every push
to reference documentation everyone reads on the web instead.

So the registry has a second tier, `sync_method: reference-only`: no code, no
submodule, but the same registry entry, the same licence verification, and the
same monitoring. The cutoff is mechanical — `scripts/vet-source.mjs` reports the
packed size and suggests a tier at `SUBMODULE_SIZE_LIMIT_KB` — and then a human
asks the real question: *would anyone actually read this source?*

| | `git-submodule` (18) | `reference-only` (28) |
| --- | --- | --- |
| Upstream code on disk | Yes, at a pinned commit | No |
| Chosen for | API truth we type against, small components we wrap, starter applications we copy from | Anything consumed from npm, or too heavy for CI |
| Drift detection | Daily, pointer moved automatically | Not applicable — no pinned commit |
| Licence re-verified | Yes, at the pinned commit | Yes, on the tracked branch |
| Archival / relicensing watch | Yes | Yes — this is the main thing that can rot |

The failure mode of a catalog is not a broken build; it is **quiet
obsolescence** — a recommendation for something that was archived eight months
ago. `npm run check:catalog` exists for exactly that, and every entry carries a
`vetted_at` date so nobody has to guess how old the judgement is.

### Coupling: what a sync can actually break

`sync_method` says whether code is ingested. It says nothing about whether an
upstream change can break *us* — that is `coupling`, and it is what decides how
strong the sync gate must be:

| `coupling` | Meaning | Gate on a sync |
| --- | --- | --- |
| `type-coupled` | An internal package compiles against its published types | Registry + guard + licence **+ that package's typecheck and tests** |
| `reference` | Nothing of ours imports it | Registry + guard + licence. There is no code of ours to break, and claiming a test gate that does not exist would be worse than admitting there is none. |

The two axes are independent. A starter template is `git-submodule` +
`reference`: on disk to read, but nothing imports it. Zod is `git-submodule` +
`type-coupled`: on disk *and* `frontend/data/patterns` is typed against it, so a
breaking release fails our typecheck inside the sync rather than in a product.

---

## Registry-driven automation

[`sources.yml`](../sources.yml) is the single source of truth. **No script or
workflow contains a technology name.** Every one of them resolves what to do by
reading the registry:

```
sources.yml
    │
    ├── scripts/registry.mjs        parse + validate; cross-check .gitmodules
    ├── scripts/vet-source.mjs      vet a CANDIDATE before it is ever added
    ├── scripts/check-upstream.mjs  pinned SHA vs live upstream branch
    │                               (--catalog: archived/relicensed/released)
    ├── scripts/sync-upstream.mjs   move the pointer, render the PR body
    ├── scripts/guard-internal.mjs  allow-list of paths a sync may touch
    ├── scripts/license-audit.mjs   licence present + SPDX unchanged
    └── scripts/render-docs.mjs     generate upstream-sources.md + frontend-catalog.md
```

Consequences:

- Adding a source is a registry entry plus `git submodule add`. No automation
  changes. This is what makes the system scale to `backend/`, `ai/`, `database/`.
- Documentation cannot drift: `docs/upstream-sources.md` is generated, and CI
  fails if the committed copy is stale.
- The registry and `.gitmodules` are cross-validated **in both directions**, so
  a submodule cannot be added or removed without the registry noticing.

### Registry invariants enforced by CI

| Invariant | Rationale |
| --- | --- |
| `update_strategy` ∈ {`auto`, `pull-request`} | Explicit, per-source choice of how updates land. |
| `update_strategy: auto` on a `type-coupled` source requires `license_ok` **and** an `internal_dir` | Unattended updates have no human reviewer, so a source our code depends on may only run `auto` if it has a test suite to act as the gate. |
| `update_strategy: auto` is rejected for `reference-only` | There is no pinned commit to move; `auto` would be a lie. |
| `coupling: type-coupled` requires an `internal_dir` | Otherwise there is nowhere for the code that does the coupling to live. |
| `enabled: true` requires `license_ok: true` | No ingesting code we have no licence for. |
| `enabled: true` requires a `docs` URL | A catalog entry nobody can read is dead weight. |
| `license_detected` requires a written `license_review` | A licence the API cannot classify may only be accepted on the record of a human having read it. |
| `enabled: false` requires `blocked_reason` | Rejections stay auditable. |
| `group` must exist in `groups:`, and no group may be empty | The generated catalog is rendered per group; an unknown group would silently hide a source from the documentation developers read. |
| `alternatives` must name real sources | "Use X instead" is only useful if X exists; a stale name is a dead end. |
| `path` must sit under an `upstream/` directory | Keeps the read-only boundary unambiguous. |
| `internal_dir` must **not** sit under `upstream/` | Prevents our code landing in the read-only zone. |
| Every registry path exists in `.gitmodules`, and vice versa | No unregistered upstream code. |

---

## The upstream / internal boundary

```
frontend/chartjs/
├── upstream/Chart.js/          submodule   — THEIRS, read-only
├── upstream/react-chartjs-2/   submodule   — THEIRS, read-only
└── examples/                   plain files — OURS, tested, Dependabot-managed
```

Three independent mechanisms keep a sync out of `examples/`:

1. **Structural.** A submodule bump changes a gitlink. It cannot write elsewhere.
2. **`guard-internal.mjs`.** Builds an allow-list from the registry —
   registered submodule paths, `.gitmodules`, generated docs — and fails if a
   sync changes anything else.
3. **Fingerprint.** The sync workflow hashes the internal tree
   (`git ls-files -s`) before and after the bump and aborts on any difference.

Belt, braces, and a second pair of braces — because "an upstream update must
never silently destroy internal modifications" is the requirement most likely to
be violated quietly.

---

## Sync pipeline

`.github/workflows/upstream-sync.yml`, daily at 06:00 UTC and on demand.

**Job 1 — `detect`.** Reads each pinned SHA from the git index
(`git ls-tree HEAD <path>`) and compares it with the live tip of the tracked
branch via the GitHub compare API. No submodule checkout, so it is fast and
cheap. Emits a job matrix of outdated sources.

**Job 2 — `sync`** (one job per outdated source, `max-parallel: 1` so that
`auto` sources cannot race each other pushing to the default branch):

1. initialise **only** the affected submodule
2. hash the internal tree (pre-image)
3. move the pointer to the new upstream SHA
4. **validation gate** — guard, fingerprint comparison, registry validation,
   licence re-verification at the new commit, internal typecheck and tests
5. commit, then either push to the default branch (`auto`) or open a PR
   (`pull-request`), per the source's `update_strategy`

Any validation failure aborts before anything is published. The push to the
default branch rebases and retries on rejection, so a concurrent update never
loses work.

### Refusals

| Condition | Behaviour | Why |
| --- | --- | --- |
| Upstream SPDX no longer matches the registry | sync refuses | Adopting relicensed code needs a human legal decision. |
| Pinned commit unreachable upstream | reported `unreachable`, no sync | Indicates a force-push or history rewrite. Silently re-pinning would hide it. |
| Sync would touch a non-allow-listed path | job fails | Something is wrong with the sync itself. |
| Internal tests fail on the new upstream | no PR | The upstream change is a real breaking change; it needs a human. |

### Update strategies

Each source chooses, in the registry, how a validated update reaches `main`:

| `update_strategy` | Behaviour | Human step |
| --- | --- | --- |
| `auto` (current default) | Validation gate runs, then the sync commit is pushed **straight to the default branch** | none |
| `pull-request` | Validation gate runs, then a PR is opened | merge the PR |

All three frontend sources currently run `auto`, so the library keeps itself
current with no manual GitHub work.

**The consequence is deliberate and worth stating plainly: with `auto`, the
test suite is the only thing between an upstream change and `main`.** That is
why `registry.mjs` refuses to let a source run `auto` unless it declares an
`internal_dir` — there must be tests to act as the gate — and why
`frontend/chartjs/examples` carries a React rendering suite that exercises
`react-chartjs-2` for real rather than only testing pure functions.

To put a human back in the loop for one source, change its `update_strategy`
to `pull-request`. Nothing else needs to change.

`auto` also sidesteps a repository setting: opening PRs as GitHub Actions
requires *Settings → Actions → General → Workflow permissions → Allow GitHub
Actions to create and approve pull requests*, which is off by default on new
repositories. Committing directly needs only `contents: write`, which the
workflow declares itself. If you switch a source to `pull-request` and that
setting is off, the sync still validates and pushes its branch — only the PR
creation fails, and the job summary explains how to fix it.

Leave *Default workflow permissions* on **Read**: every workflow declares the
scopes it needs, so the repository default stays least-privilege.

### Dependency PRs

Dependabot has no direct-push mode — it always opens a PR. `auto-merge.yml`
therefore sweeps open bot PRs and merges those whose checks have all passed.
It refuses to merge when checks are missing, still running, or failing, and it
only trusts `dependabot[bot]` and `github-actions[bot]` as authors. Human PRs
are never touched.

#### One documented exception: PRs that touch `.github/workflows/`

`GITHUB_TOKEN` is a GitHub App token, and GitHub refuses to let an App create
or update a workflow file without the `workflows` permission. That permission
**cannot be granted from a workflow's `permissions:` block**, so the sweep
cannot merge a PR that bumps an action version:

```
403: refusing to allow a GitHub App to create or update workflow
     `.github/workflows/auto-merge.yml` without `workflows` permission
```

This affects **only CI action versions** — never the frontend libraries. npm
dependency PRs and upstream submodule updates are unaffected.

Two ways to handle it:

| Option | Effect |
| --- | --- |
| Do nothing | Action bumps wait for a human click. Actions pinned at `@v4` still receive v4.x updates automatically, because GitHub moves the major tag. |
| Add an `AUTOMERGE_TOKEN` secret (a PAT with the `workflow` scope) | The sweep picks it up automatically and merges these too. Nothing else changes. |

The sweep **fails the job** when a merge is attempted and rejected, so this
never hides inside a green run. A PR merely waiting on checks is reported as
waiting and does not fail anything.

### Known limitation

PRs opened with the default `GITHUB_TOKEN` do **not** trigger further workflow
runs (a GitHub safeguard against recursive CI). The sync job therefore runs the
full validation suite itself and embeds the real results in the PR body. Wiring
a PAT or GitHub App token into the workflow would additionally make
`validate.yml` run on the sync PR; that is a deliberate follow-up, not an
oversight.

---

## Dependency management

| Layer | Owner | Mechanism |
| --- | --- | --- |
| Internal package deps | us | Dependabot, grouped, weekly |
| GitHub Actions versions | us | Dependabot, weekly |
| Upstream submodule pointers | us | `upstream-sync.yml`, daily |
| Deps *inside* upstream submodules | upstream | Reported in sync PRs, not managed |

The last row is a deliberate boundary. A submodule records a commit pointer —
there is no way to commit a dependency bump inside it, and attempting to manage
upstream's dependency tree would mean forking. Instead, every sync PR answers
*"did upstream's dependency manifests change?"* by inspecting the compare diff,
so the information is visible without the responsibility being misplaced.

Dependabot's `gitsubmodule` ecosystem is deliberately unused: it bumps pointers
without licence re-verification, the internal-code guard, or the validation gate.

---

## Scaling to more categories

```
<category>/<technology>/
├── upstream/<repo>/    submodule, registered in sources.yml
└── <internal_dir>/     our code, declared as internal_dir
```

To add `backend/`, `ai/`, `database/`, `integrations/`, `infrastructure/`:
create the directory, add submodules, add registry entries. The scripts and
workflows already iterate over whatever the registry contains — `category` is
already a first-class field. No redesign, and no automation changes.
