# Adding a New Upstream Source

Adding a source touches **two files** and runs **one command**. No workflow or
script needs to change — the automation is entirely registry-driven.

---

## Step 0 — Vet the candidate

This is a gate, not a formality. *Public on GitHub does not mean reusable.*

```bash
npm run vet -- owner/repo
```

One API call per candidate, and it answers the four questions that decide
adoption — licence, maintenance, real default branch, and repository weight:

```
✓ TanStack/table
      licence  : MIT   branch: main   size: 55 MB   stars: 28428   last push: 0d ago
      ingest   : git-submodule
```

| Verdict | Meaning |
| --- | --- |
| `✓ adopt` | Permissive licence, maintained, not a fork. Proceed. |
| `? review` | Archived, quiet for over a year, a fork, or a licence outside the permissive allow-list (`GPL-*`, `AGPL-*`, `MPL-*` — copyleft has distribution consequences). Get a decision first, and record it. |
| `✗ BLOCK` | No licence, or a licence GitHub cannot identify. **Stop.** No grant → default copyright → we may not use or redistribute it. |

A `NOASSERTION` result is not always a dead end: it can mean the licence file
holds two grants. If so, a human reads the actual text and records the
conclusion in `license` plus `license_detected` + `license_review` — see the
`lucide` entry for a worked example. Never set `license_ok: true` without that
written reasoning.

If a source is rejected, still add it to the registry with `enabled: false`,
`license_ok: false` and a `blocked_reason`, so the decision is auditable and can
be revisited. See `shadcn-next-template` and `vercel-platforms` for worked
examples.

Also confirm the repository is the **official** one — not a mirror or a fork;
`vet` flags forks, but check that the project's own website links to it.

---

## Step 1 — Choose the tier

Two independent decisions, both recorded in the registry:

**`sync_method` — do we ingest the code?**

| | Choose `git-submodule` | Choose `reference-only` |
| --- | --- | --- |
| Is reading the source useful? | Yes — API truth, or a starter to copy from | No — the docs are enough |
| Repository weight | Under ~250 MB (`vet` reports it and suggests a tier) | Anything heavier. Ant Design is 281 MB, daisyUI 12 GB — CI cannot carry those |
| Result | Pinned commit on disk, drift detected daily | Catalogued and monitored; installed from npm |

**`coupling` — does our code compile against it?**

| | `type-coupled` | `reference` |
| --- | --- | --- |
| Meaning | An internal package imports its types | Nothing of ours imports it |
| Requires | `internal_dir` with a typecheck + tests | Nothing; `internal_dir: null` |
| Gate on sync | That package's tests must pass | Guard + licence re-check only |

A starter template is `git-submodule` + `reference`: its code is on disk to
read, but nothing of ours imports it.

### If ingesting, add the submodule

```bash
git submodule add --depth 1 -b <upstream-branch> \
  https://github.com/<owner>/<repo>.git \
  <category>/<technology>/upstream/<name>
```

`--depth 1` keeps the clone small; only the pinned commit is ever needed.

Note `-b <upstream-branch>`: **do not assume `main`.** Chart.js tracks
`master`, Next.js `canary`, Storybook `next`. `npm run vet` reports the real
default branch.

Optionally pin to a specific release rather than the branch tip:

```bash
cd <category>/<technology>/upstream/<name>
git checkout <tag-or-sha>
cd -
git add <category>/<technology>/upstream/<name>
```

---

## Step 2 — Register it in `sources.yml`

```yaml
  - name: my-library                      # unique slug; used in sync branch names
    title: My Library                     # human-readable
    category: frontend                    # frontend | backend | ai | database | ...
    group: data                           # MUST match an id in the `groups:` list
    upstream: https://github.com/owner/repo
    ref: main                             # the branch you passed to -b
    sync_method: git-submodule            # or reference-only (then path: null)
    coupling: type-coupled                # or reference (then internal_dir: null)
    path: frontend/mylib/upstream/repo    # MUST match the submodule path exactly
    internal_dir: frontend/mylib/patterns # our code — sync may never touch it
    docs: https://mylibrary.dev/docs      # required for every enabled source
    install: npm i my-library             # what a product runs to adopt it
    license: MIT                          # SPDX id verified in step 0
    license_ok: true
    enabled: true
    update_strategy: auto                 # auto -> lands on main once CI passes
                                          # pull-request -> a human merges it
    maturity: established                 # standard | established | emerging
    vetted_at: '2026-09-15'               # the day you ran `npm run vet`
    description: >-
      One or two sentences: what this is and why it is in the library.
    use_when: >-
      One line. When is this the right choice?
    avoid_when: >-
      One line. When is it the WRONG choice? Required in spirit — a catalog
      that only lists strengths cannot be used to decide anything.
    alternatives: [other-source-name]     # must name real registry entries
    tags: [tables, sorting, headless]     # how humans and agents search
    used_for:                             # read by AI agents — be concrete
      - The specific thing we consult it for
```

Required fields: `name`, `title`, `category`, `group`, `upstream`, `ref`,
`sync_method`, `coupling`, `update_strategy`, `license`, `license_ok`,
`enabled`, plus `docs` for anything enabled, and `internal_dir` when
`coupling: type-coupled`.

**Choosing `update_strategy`.** `auto` means validated updates land on `main`
with no human step. For a `type-coupled` source that is appropriate when the
internal package's tests genuinely exercise the dependency; CI rejects `auto`
on a type-coupled source with no `internal_dir`, because then there would be no
gate at all. For a `reference` source there is nothing of ours to break, so the
guard and the licence re-check are the whole gate. `reference-only` sources
have no pinned commit to move, so they are always `pull-request`. If a source
is high-risk, start with `pull-request` and switch once the gate is trustworthy.

---

## Step 3 — Create the internal directory (type-coupled sources only)

A `reference` source needs nothing here — skip to step 4.

Upstream is read-only, so our code needs somewhere to live. At minimum add a
`README.md`; add a package if there is code to share.

```bash
mkdir -p frontend/mylib/patterns
```

If you add an npm package, register it in two more places:

- `.github/dependabot.yml` — a new `npm` entry for its directory
- `.github/workflows/validate.yml` — add the path to the `internal` job matrix

---

## Step 4 — Regenerate docs and validate

```bash
npm run docs:render     # regenerates docs/upstream-sources.md + docs/frontend-catalog.md
npm run validate        # registry + docs + licence audit
npm run check:upstream  # ingested sources: confirm the new one is detected
npm run check:catalog   # reference-only sources: archived? relicensed? released?
```

Never hand-edit the generated docs.

`npm run validate` fails if:

- a required field is missing, or `sync_method` / `coupling` is unknown
- `group` is not declared in the top-level `groups:` list (or a group is empty)
- an enabled source has no `docs` URL
- `coupling: type-coupled` without an `internal_dir`
- `license_detected` without a written `license_review`
- `enabled: true` while `license_ok: false`
- `enabled: false` without a `blocked_reason`
- `alternatives` names a source that does not exist
- `path` is not under an `upstream/` directory, or `internal_dir` sits under one
- `update_strategy: auto` on a `reference-only` source (nothing to move)
- the registry and `.gitmodules` disagree in either direction
- either generated document is stale

---

## Step 5 — Open a pull request

```bash
git add .gitmodules sources.yml docs/ frontend/mylib
git commit -m "feat(sources): track <My Library> upstream"
```

The PR should state the upstream URL, the licence and how it was verified
(paste the `npm run vet` output), why this source belongs in the library, which
tier it is in and why, and — if it duplicates something already catalogued —
why the existing entry is not enough. Adding a second library for a job the
catalog already answers is how a curated library turns back into a junk drawer.

---

## Adding a whole new category

Categories are data, not structure — `category` is already a registry field, and
every script iterates over whatever the registry contains.

```bash
mkdir -p backend/<technology>/upstream
git submodule add -b main <url> backend/<technology>/upstream/<name>
# add the registry entry with `category: backend`
npm run docs:render && npm run validate
```

Add a `backend/README.md` describing the category, mirroring
[`frontend/README.md`](../frontend/README.md). Nothing else changes.

---

## Removing a source

```bash
git submodule deinit -f <path>
git rm -f <path>
rm -rf .git/modules/<path>
```

Then either delete the registry entry, or — better — set `enabled: false` with a
`blocked_reason` explaining the removal, so the history of the decision survives.
Finish with `npm run docs:render && npm run validate`.
