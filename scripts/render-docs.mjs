/**
 * Generates the documentation that must never drift from the registry:
 *
 *   docs/upstream-sources.md   — the compliance view: what we track, at which
 *                                commit, under which licence.
 *   docs/frontend-catalog.md   — the developer view: what exists, when to use
 *                                it, when not to, and how to install it.
 *
 * Both are derived, never hand-maintained, so they cannot drift away from the
 * registry that actually drives the automation. CI runs this with --check and
 * fails if a committed file is stale.
 *
 *   node scripts/render-docs.mjs           # write
 *   node scripts/render-docs.mjs --check   # verify committed copies are current
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, loadRegistry, sourcesByGroup } from './registry.mjs';
import { pinnedSha } from './check-upstream.mjs';

const GENERATED_HEADER = (extra = '') =>
  `<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Source of truth: /sources.yml
     Regenerate with: npm run docs:render
     CI enforces that this file matches the registry.${extra} -->`;

/** Collapse a folded YAML string to a single line for table cells. */
const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

const MATURITY_LABEL = {
  standard: '🟢 standard',
  established: '🔵 established',
  emerging: '🟡 emerging',
};

// ---------------------------------------------------------------------------
// docs/upstream-sources.md — compliance view
// ---------------------------------------------------------------------------
function renderUpstreamSources() {
  const registry = loadRegistry();
  const enabled = registry.sources.filter((s) => s.enabled);
  const disabled = registry.sources.filter((s) => !s.enabled);
  const ingested = enabled.filter((s) => s.sync_method === 'git-submodule');
  const referenced = enabled.filter((s) => s.sync_method === 'reference-only');

  const row = (s) =>
    `| [${s.title}](${s.upstream}) | ${s.upstream} | ${s.category} | \`${s.sync_method}\` | \`${s.ref}\` | ${s.license} | ${s.enabled ? 'Active' : 'Blocked'} |`;

  const pinRow = (s) => {
    const sha = s.path ? pinnedSha(s.path) : null;
    return `| ${s.title} | \`${s.path}\` | ${
      sha ? `[\`${sha.slice(0, 10)}\`](${s.upstream}/commit/${sha})` : '—'
    } | ${s.internal_dir ? `\`${s.internal_dir}\`` : '— _(nothing of ours depends on it)_'} |`;
  };

  return `${GENERATED_HEADER()}

# Upstream Sources

Every external repository the Engineering Library tracks, why it is here, and
how it is connected. This page is generated from [\`sources.yml\`](../sources.yml).

Looking for "which library should I use?" — read
[the frontend catalog](./frontend-catalog.md) instead. This page is the
compliance record.

## How a source is connected

| \`sync_method\` | Count | What it means |
| --- | --- | --- |
| \`git-submodule\` | ${ingested.length} | The upstream code is on disk at a pinned commit, read-only. Drift is detected daily and the pointer is moved by automation. |
| \`reference-only\` | ${referenced.length} | No code is ingested. The repository is catalogued, its licence is re-verified, and it is monitored for archival and relicensing. |

## Active sources

| Technology | Upstream Repository | Category | Sync Method | Tracked Ref | Licence | Status |
| --- | --- | --- | --- | --- | --- | --- |
${enabled.map(row).join('\n')}

### Where the code lives

Upstream code is **referenced as a pinned git submodule**, never copied into
this repository. The commit below is the exact upstream revision this library
currently points at.

| Technology | Submodule path (upstream — do not edit) | Pinned commit | Internal code (safe to edit) |
| --- | --- | --- | --- |
${ingested.map(pinRow).join('\n')}

### Catalogued, not ingested

No code from these repositories exists in this library. They are recorded so
the licence and maintenance status are verified and monitored, and so the
catalog can recommend them with evidence rather than folklore.

| Technology | Tracked Ref | Licence | Install |
| --- | --- | --- | --- |
${referenced.map((s) => `| [${s.title}](${s.docs}) | \`${s.ref}\` | ${s.license} | ${s.install ? `\`${s.install}\`` : '—'} |`).join('\n')}

### What each source is used for

${enabled
  .map(
    (s) =>
      `#### ${s.title}\n\n${(s.description || '').trim()}\n\n` +
      (s.used_for?.length
        ? s.used_for.map((u) => `- ${u}`).join('\n') + '\n'
        : ''),
  )
  .join('\n')}

## Blocked / not ingested

These repositories were evaluated and deliberately **not** brought into the
library. They stay listed so the decision is auditable and can be revisited.

${
  disabled.length
    ? disabled
        .map(
          (s) =>
            `### ${s.title}\n\n` +
            `- **Upstream:** ${s.upstream}\n` +
            `- **Licence:** \`${s.license}\`\n` +
            `- **Status:** not ingested — no code from this repository exists in this library\n` +
            `- **Reason:** ${(s.blocked_reason || '').trim()}\n`,
        )
        .join('\n')
    : '_None._'
}

## Licence compliance

| Requirement | How it is satisfied |
| --- | --- |
| Licence verified before ingest | \`scripts/vet-source.mjs\` checks the licence, maintenance status and weight against the GitHub API; \`license\` + \`license_ok\` are then recorded in \`sources.yml\` and \`scripts/registry.mjs\` refuses to enable a source with \`license_ok: false\` |
| Licence text preserved | Ingested upstream is a submodule, so the upstream \`LICENSE\` file is present verbatim at its original path |
| Relicensing detected | \`scripts/license-audit.mjs --remote\` re-checks the upstream SPDX id for **every** source — ingested and catalogued alike — on every sync and every PR |
| Licence GitHub cannot classify | Recorded as \`license_detected: NOASSERTION\` plus a written \`license_review\`; the audit then compares against the detected value, so a change is still caught |
| Unlicensed code excluded | Sources without a licence grant are recorded as blocked and never ingested |
| Attribution | See [\`NOTICE\`](../NOTICE) |

## Adding a source

See [adding-a-source.md](./adding-a-source.md).
`;
}

// ---------------------------------------------------------------------------
// docs/frontend-catalog.md — developer view
// ---------------------------------------------------------------------------
function renderCatalog() {
  const registry = loadRegistry();
  const groups = sourcesByGroup(registry).map((g) => ({
    ...g,
    sources: g.sources.filter((s) => s.enabled),
  }));
  const enabled = registry.sources.filter((s) => s.enabled);
  const blocked = registry.sources.filter((s) => !s.enabled);

  const byName = new Map(registry.sources.map((s) => [s.name, s]));
  const link = (name) => {
    const s = byName.get(name);
    return s ? `[${s.title}](#${anchor(s)})` : `\`${name}\``;
  };
  const anchor = (s) =>
    s.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const summaryRow = (s) =>
    `| **[${s.title}](${s.docs})** | ${oneLine(s.use_when) || oneLine(s.description)} | ${
      s.install ? `\`${s.install}\`` : '—'
    } | ${MATURITY_LABEL[s.maturity] ?? '—'} | ${s.license} |`;

  const detail = (s) => {
    const lines = [`#### ${s.title}`, ''];
    lines.push(oneLine(s.description), '');

    const facts = [
      `- **Docs:** ${s.docs}`,
      `- **Repository:** ${s.upstream} (tracked branch \`${s.ref}\`)`,
      s.install ? `- **Install:** \`${s.install}\`` : null,
      `- **Licence:** ${s.license}${s.license_detected ? ` — GitHub reports \`${s.license_detected}\`; see the recorded licence review in \`sources.yml\`` : ''}`,
      s.path
        ? `- **Source on disk:** \`${s.path}\` — pinned submodule, read it, never edit it`
        : '- **Source on disk:** not ingested — use the docs link above',
      s.internal_dir
        ? `- **Our code for it:** [\`${s.internal_dir}\`](../${s.internal_dir}) — reuse or extend this first`
        : null,
      s.use_when ? `- **Use when:** ${oneLine(s.use_when)}` : null,
      s.avoid_when ? `- **Avoid when:** ${oneLine(s.avoid_when)}` : null,
      s.alternatives?.length
        ? `- **Alternatives here:** ${s.alternatives.map(link).join(' · ')}`
        : null,
      s.maintenance_note ? `- **⚠️ Maintenance:** ${oneLine(s.maintenance_note)}` : null,
      s.tags?.length ? `- **Tags:** ${s.tags.map((t) => `\`${t}\``).join(' ')}` : null,
      s.vetted_at ? `- **Licence and maintenance last verified:** ${s.vetted_at}` : null,
    ].filter(Boolean);

    lines.push(facts.join('\n'), '');
    return lines.join('\n');
  };

  const ingestedCount = enabled.filter((s) => s.sync_method === 'git-submodule').length;

  return `${GENERATED_HEADER(`
     Prose that is NOT generated (stack recipes, decision guides) lives in
     docs/frontend-stack.md.`)}

# Frontend Catalog

**${enabled.length} vetted frontend sources.** Every one has had its licence,
maintenance status and repository weight verified against the GitHub API, and
every one is re-checked automatically.

**Before you install anything or build a component from scratch, look here.**
For "I am building X, what do I use?" recipes, read
[the frontend stack guide](./frontend-stack.md).

| | |
| --- | --- |
| Catalogued sources | **${enabled.length}** |
| Code ingested on disk (pinned submodules) | **${ingestedCount}** |
| Catalogued and monitored, installed from npm | **${enabled.length - ingestedCount}** |
| Evaluated and **rejected** on licence grounds | **${blocked.length}** |

Legend — **maturity**: ${MATURITY_LABEL.standard} pick this unless you have a
reason not to · ${MATURITY_LABEL.established} proven, but a considered choice ·
${MATURITY_LABEL.emerging} promising, expect API churn.

## Contents

${groups.map((g) => `- [${g.title}](#${g.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')}) — ${oneLine(g.summary)}`).join('\n')}

${groups
  .map(
    (g) => `---

## ${g.title}

${oneLine(g.summary)}

| Technology | Use it for | Install | Maturity | Licence |
| --- | --- | --- | --- | --- |
${g.sources.map(summaryRow).join('\n')}

${g.sources.map(detail).join('\n')}`,
  )
  .join('\n')}

---

## Rejected on licence grounds

Recorded so the decision is auditable, and so nobody re-proposes them. **Do not
copy code from these repositories.**

| Repository | Licence | Why it is not here |
| --- | --- | --- |
${blocked.map((s) => `| [${s.title}](${s.upstream}) | \`${s.license}\` | ${oneLine(s.blocked_reason)} |`).join('\n')}

---

## How to add something to this catalog

\`\`\`bash
npm run vet -- owner/repo      # licence, maintenance, weight — from the API
\`\`\`

Then follow [adding-a-source.md](./adding-a-source.md). A source with no
licence file is never added, however useful it looks.
`;
}

// ---------------------------------------------------------------------------
const OUTPUTS = [
  { file: path.join(REPO_ROOT, 'docs', 'upstream-sources.md'), render: renderUpstreamSources },
  { file: path.join(REPO_ROOT, 'docs', 'frontend-catalog.md'), render: renderCatalog },
];

const check = process.argv.includes('--check');
let stale = 0;

for (const out of OUTPUTS) {
  const rel = path.relative(REPO_ROOT, out.file).split(path.sep).join('/');
  const content = out.render();

  if (!check) {
    writeFileSync(out.file, content);
    console.log(`✓ wrote ${rel}`);
    continue;
  }

  if (!existsSync(out.file)) {
    console.error(`✗ ${rel} does not exist. Run: npm run docs:render`);
    stale++;
    continue;
  }
  const current = readFileSync(out.file, 'utf8').replace(/\r\n/g, '\n');
  if (current.trim() !== content.trim()) {
    console.error(`✗ ${rel} is out of date with sources.yml.\n  Run: npm run docs:render`);
    stale++;
    continue;
  }
  console.log(`✓ ${rel} matches sources.yml`);
}

if (stale) process.exit(1);
