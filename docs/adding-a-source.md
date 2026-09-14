# Adding a New Upstream Source

Adding a source touches **two files** and runs **one command**. No workflow or
script needs to change — the automation is entirely registry-driven.

---

## Step 0 — Check the licence first

This is a gate, not a formality. *Public on GitHub does not mean reusable.*

Check the repository's `LICENSE` file and the SPDX identifier GitHub reports:

```bash
curl -s https://api.github.com/repos/<owner>/<repo>/license | jq '.license.spdx_id'
```

| Result | Action |
| --- | --- |
| `MIT`, `Apache-2.0`, `BSD-*`, `ISC` | Proceed. Permissive; attribution required. |
| `GPL-*`, `AGPL-*`, `MPL-*` | **Stop.** Copyleft has distribution consequences. Get a decision before ingesting. |
| `NOASSERTION` / `null` / no LICENSE file | **Stop.** No licence granted → default copyright → we may not redistribute. |
| Archived repository | Allowed, but record it — an archived source will never receive fixes. |

If a source is rejected, still add it to the registry with `enabled: false`,
`license_ok: false` and a `blocked_reason`, so the decision is auditable and can
be revisited. See the `shadcn-next-template` entry for a worked example.

Also confirm the repository is the **official** one — not a mirror or a fork.
Check the org, the star count, and that the project's own website links to it.

---

## Step 1 — Add the submodule

```bash
git submodule add -b <upstream-branch> \
  https://github.com/<owner>/<repo>.git \
  <category>/<technology>/upstream/<name>
```

Note `-b <upstream-branch>`: **do not assume `main`.** Chart.js and
react-chartjs-2 both track `master`. Confirm it:

```bash
curl -s https://api.github.com/repos/<owner>/<repo> | jq -r '.default_branch'
```

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
    upstream: https://github.com/owner/repo
    ref: main                             # the branch you passed to -b
    sync_method: git-submodule
    path: frontend/mylib/upstream/repo    # MUST match the submodule path exactly
    internal_dir: frontend/mylib/examples # our code — sync may never touch it
    license: MIT                          # SPDX id verified in step 0
    license_ok: true
    enabled: true
    auto_merge: false                     # always false
    description: >-
      One or two sentences: what this is and why it is in the library.
    used_for:                             # read by AI agents — be concrete
      - The specific thing we consult it for
```

Required fields: `name`, `title`, `category`, `upstream`, `ref`, `sync_method`,
`internal_dir`, `license`, `license_ok`, `enabled`.

---

## Step 3 — Create the internal directory

Upstream is read-only, so our code needs somewhere to live. At minimum add a
`README.md`; add a package if there is code to share.

```bash
mkdir -p frontend/mylib/examples
```

If you add an npm package, register it in two more places:

- `.github/dependabot.yml` — a new `npm` entry for its directory
- `.github/workflows/validate.yml` — add the path to the `internal` job matrix

---

## Step 4 — Regenerate docs and validate

```bash
npm run docs:render     # regenerates docs/upstream-sources.md — never hand-edit it
npm run validate        # registry + docs + licence audit
npm run check:upstream  # confirm the new source is detected
```

`npm run validate` fails if:

- a required field is missing, or `sync_method` is unknown
- `enabled: true` while `license_ok: false`
- `enabled: false` without a `blocked_reason`
- `path` is not under an `upstream/` directory
- `internal_dir` sits under `upstream/`
- the registry and `.gitmodules` disagree in either direction
- `docs/upstream-sources.md` is stale

---

## Step 5 — Open a pull request

```bash
git add .gitmodules sources.yml docs/upstream-sources.md frontend/mylib
git commit -m "feat(sources): track <My Library> upstream"
```

The PR should state the upstream URL, the licence and how it was verified, why
this source belongs in the library, and which internal directory will hold our
code.

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
