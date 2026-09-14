/**
 * Upstream synchronisation.
 *
 * Moves the PINNED COMMIT of a submodule forward to the current tip of the
 * tracked upstream branch, and writes a PR body describing exactly what
 * changed. It does not merge, rebase or modify upstream file contents — the
 * only thing that changes in our repository is a 40-character gitlink.
 *
 * Safety properties (enforced, not just documented):
 *   - only paths declared in sources.yml are ever staged
 *   - `internal_dir` of every source is never touched (see guard-internal.mjs)
 *   - a source whose upstream licence changed is refused
 *   - a source whose pinned commit vanished upstream is refused
 *
 *   node scripts/sync-upstream.mjs --source chartjs
 *   node scripts/sync-upstream.mjs --source chartjs --dry-run
 *   node scripts/sync-upstream.mjs --all
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, findSource, submoduleSources, parseUpstream } from './registry.mjs';
import { checkSource } from './check-upstream.mjs';

function git(args, opts = {}) {
  return execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...opts,
  }).trim();
}

/** Fetch upstream inside the submodule and move its checkout to `sha`. */
function moveSubmodule(submodulePath, ref, sha) {
  const abs = path.join(REPO_ROOT, submodulePath);
  git(['fetch', 'origin', ref], { cwd: abs });
  git(['checkout', '--detach', sha], { cwd: abs });
}

function bullet(c) {
  return `- [\`${c.shortSha}\`](${c.url}) ${c.message.replace(/\|/g, '\\|')} — @${c.author}`;
}

/** Compose the PR body. Every value here is read from the live upstream. */
export function renderPrBody(source, check, validation) {
  const { owner, repo } = parseUpstream(source.upstream);
  const preview = source.pr_commit_preview ?? 20;
  const shown = check.commits.slice(-preview).reverse();
  const hidden = check.commits.length - shown.length;

  const depsLine = check.dependenciesChanged
    ? `**Yes** — upstream dependency manifests changed:\n` +
      check.changedManifests.map((f) => `  - \`${f}\``).join('\n')
    : 'No upstream dependency manifest changed in this range.';

  return `## Upstream sync — ${source.title}

Automated by \`.github/workflows/upstream-sync.yml\`. This PR moves a **pinned
git submodule** forward. No upstream source file is copied into this
repository and **no internal code is modified**.

### Upstream repository
| | |
|---|---|
| Repository | [\`${owner}/${repo}\`](${source.upstream}) |
| Tracked branch | \`${source.ref}\` |
| Submodule path | \`${source.path}\` |
| Internal code (untouched) | \`${source.internal_dir}\` |

### Version change
| | |
|---|---|
| Previous commit | [\`${check.current.slice(0, 10)}\`](${source.upstream}/commit/${check.current}) |
| New commit | [\`${check.latest.slice(0, 10)}\`](${source.upstream}/commit/${check.latest}) |
| Commits ahead | **${check.aheadBy}** |
| Files changed upstream | ${check.filesChanged} |
| Full diff | [compare view](${check.compareUrl}) |
${check.latestRelease ? `| Latest upstream release | [${check.latestRelease.tag}](${check.latestRelease.url}) |` : ''}

### What changed upstream
${shown.length ? shown.map(bullet).join('\n') : '_No commit detail available._'}
${hidden > 0 ? `\n_…and ${hidden} earlier commit(s). See the [compare view](${check.compareUrl})._` : ''}

### Did dependencies change?
${depsLine}

> Dependencies **inside the upstream submodule are upstream's own** and are not
> installed or built by this repository. Our internal packages
> (\`${source.internal_dir}\`) are dependency-managed separately by Dependabot.

### Licence check
| | |
|---|---|
| Declared in \`sources.yml\` | \`${source.license}\` |
| Detected upstream at new commit | \`${check.license.upstream ?? 'UNDETECTED'}\` |
| Result | ${check.license.ok ? '✅ unchanged' : '❌ **MISMATCH — do not merge**'} |

### Validation
${validation}

---
<sub>Generated from \`sources.yml\`. Merging changes only the submodule pointer
\`${check.current.slice(0, 7)} → ${check.latest.slice(0, 7)}\`.</sub>
`;
}

export async function syncSource(name, { dryRun = false } = {}) {
  const source = findSource(name);

  if (!source.enabled) {
    throw new Error(`Source "${name}" is disabled: ${source.blocked_reason ?? 'no reason given'}`);
  }
  if (source.sync_method !== 'git-submodule') {
    throw new Error(`Source "${name}" uses sync_method=${source.sync_method}; nothing to sync.`);
  }

  const check = await checkSource(source);

  if (check.status === 'error' || check.status === 'unreachable') {
    throw new Error(`Cannot sync ${name}: ${check.error}`);
  }
  if (check.status === 'up-to-date') {
    return { source, check, changed: false, reason: 'already up to date' };
  }
  // Refuse to adopt a relicensed upstream automatically.
  if (!check.license.ok) {
    throw new Error(
      `Refusing to sync ${name}: ${check.licenseWarning} ` +
        `Update sources.yml deliberately after a licence review.`,
    );
  }

  if (dryRun) {
    return { source, check, changed: true, reason: 'dry-run — no changes written' };
  }

  moveSubmodule(source.path, source.ref, check.latest);
  git(['add', '--', source.path]);

  const staged = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
  if (!staged.length) {
    return { source, check, changed: false, reason: 'submodule already at target commit' };
  }

  return { source, check, changed: true, staged };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith('sync-upstream.mjs');
if (isMain) {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const names = argv.includes('--all')
    ? submoduleSources().map((s) => s.name)
    : argv.includes('--source')
      ? [argv[argv.indexOf('--source') + 1]]
      : [];

  if (!names.length) {
    console.error('Usage: sync-upstream.mjs --source <name> [--dry-run] | --all');
    process.exit(1);
  }

  const outDir = path.join(REPO_ROOT, '.sync-output');
  mkdirSync(outDir, { recursive: true });

  let anyChanged = false;
  for (const name of names) {
    const res = await syncSource(name, { dryRun });
    if (!res.changed) {
      console.log(`• ${name}: no change (${res.reason})`);
      continue;
    }
    anyChanged = true;
    const { source, check } = res;
    console.log(
      `• ${name}: ${check.current.slice(0, 7)} → ${check.latest.slice(0, 7)} ` +
        `(+${check.aheadBy} commits)${dryRun ? ' [dry-run]' : ''}`,
    );

    // Artefacts consumed by the workflow to build the commit + PR.
    writeFileSync(
      path.join(outDir, `${name}.pr-body.md`),
      renderPrBody(source, check, '_Validation results are appended by CI._'),
    );
    writeFileSync(
      path.join(outDir, `${name}.json`),
      JSON.stringify(
        {
          name,
          title: source.title,
          path: source.path,
          internal_dir: source.internal_dir,
          from: check.current,
          to: check.latest,
          aheadBy: check.aheadBy,
          dependenciesChanged: check.dependenciesChanged,
          compareUrl: check.compareUrl,
          branch: `sync/${name}/${check.latest.slice(0, 7)}`,
          commitSubject:
            `chore(upstream): bump ${source.title} to ${check.latest.slice(0, 7)} (+${check.aheadBy})`,
        },
        null,
        2,
      ),
    );
  }

  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_OUTPUT, `changed=${anyChanged}\n`);
  }
}
