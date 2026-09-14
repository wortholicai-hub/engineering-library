/**
 * Generates docs/upstream-sources.md from sources.yml.
 *
 * The documentation is derived, never hand-maintained, so it cannot drift away
 * from the registry that actually drives the automation. CI runs this with
 * --check and fails if the committed file is stale.
 *
 *   node scripts/render-docs.mjs           # write
 *   node scripts/render-docs.mjs --check   # verify committed copy is current
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, loadRegistry } from './registry.mjs';
import { pinnedSha } from './check-upstream.mjs';

const OUT = path.join(REPO_ROOT, 'docs', 'upstream-sources.md');

function render() {
  const registry = loadRegistry();
  const enabled = registry.sources.filter((s) => s.enabled);
  const disabled = registry.sources.filter((s) => !s.enabled);

  const row = (s) => {
    const status = s.enabled ? 'Active' : 'Blocked';
    return `| [${s.title}](${s.upstream}) | ${s.upstream} | ${s.category} | \`${s.sync_method}\` | \`${s.ref}\` | ${s.license} | ${status} |`;
  };

  const pinRow = (s) => {
    const sha = s.path ? pinnedSha(s.path) : null;
    return `| ${s.title} | \`${s.path}\` | ${
      sha ? `[\`${sha.slice(0, 10)}\`](${s.upstream}/commit/${sha})` : '—'
    } | \`${s.internal_dir}\` |`;
  };

  return `<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Source of truth: /sources.yml
     Regenerate with: npm run docs:render
     CI enforces that this file matches the registry. -->

# Upstream Sources

Every external repository the Engineering Library tracks, why it is here, and
how it is connected. This page is generated from [\`sources.yml\`](../sources.yml).

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
${enabled.filter((s) => s.path).map(pinRow).join('\n')}

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
| Licence verified before ingest | \`license\` + \`license_ok\` recorded in \`sources.yml\`; \`scripts/registry.mjs\` refuses to enable a source with \`license_ok: false\` |
| Licence text preserved | Upstream is a submodule, so the upstream \`LICENSE\` file is present verbatim at its original path |
| Relicensing detected | \`scripts/license-audit.mjs --remote\` re-checks the upstream SPDX id on every sync and every PR |
| Unlicensed code excluded | Sources without a licence grant are recorded as blocked and never ingested |
| Attribution | See [\`NOTICE\`](../NOTICE) |

## Adding a source

See [adding-a-source.md](./adding-a-source.md).
`;
}

const content = render();

if (process.argv.includes('--check')) {
  if (!existsSync(OUT)) {
    console.error(`✗ ${path.relative(REPO_ROOT, OUT)} does not exist. Run: npm run docs:render`);
    process.exit(1);
  }
  const current = readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n');
  if (current.trim() !== content.trim()) {
    console.error(
      `✗ docs/upstream-sources.md is out of date with sources.yml.\n` +
        `  Run: npm run docs:render`,
    );
    process.exit(1);
  }
  console.log('✓ docs/upstream-sources.md matches sources.yml');
} else {
  writeFileSync(OUT, content);
  console.log(`✓ wrote ${path.relative(REPO_ROOT, OUT)}`);
}
