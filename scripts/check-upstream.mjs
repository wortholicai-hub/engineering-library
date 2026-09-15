/**
 * Upstream drift detection.
 *
 * For every enabled git-submodule source in sources.yml:
 *   1. read the commit we currently have PINNED (the gitlink in our tree)
 *   2. ask GitHub for the current tip of the tracked upstream branch
 *   3. compare the two and classify the drift
 *   4. detect whether upstream dependency manifests changed
 *   5. re-verify the upstream licence at the NEW commit
 *
 * This script never writes to the working tree. It only reports.
 *
 *   node scripts/check-upstream.mjs              human summary
 *   node scripts/check-upstream.mjs --json       machine output
 *   node scripts/check-upstream.mjs --source X   single source
 *   node scripts/check-upstream.mjs --github-output   write GHA outputs
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import {
  REPO_ROOT,
  submoduleSources,
  referenceSources,
  parseUpstream,
  loadRegistry,
  expectedSpdx,
} from './registry.mjs';
import { compare, getRefHead, getLicenseAt, getLatestRelease, getRepo } from './github.mjs';

/** Dependency manifests we care about when reporting "did deps change?". */
const MANIFEST_RE =
  /(^|\/)(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb)$/;

/**
 * The commit currently pinned for a submodule.
 *
 * Read from the git INDEX (`git ls-files -s`), not from HEAD. The index is
 * what will actually be committed, so a staged-but-uncommitted submodule bump
 * is visible here. That matters during a sync: `render-docs.mjs` regenerates
 * the pinned-commit table after the bump is staged, and reading HEAD would
 * emit the old SHA — leaving the docs stale the moment the PR merged.
 *
 * Falls back to HEAD if the path is not in the index.
 */
export function pinnedSha(submodulePath) {
  const fromIndex = execFileSync('git', ['ls-files', '-s', '--', submodulePath], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
  const indexMatch = fromIndex.match(/^160000\s+([0-9a-f]{40})\s/);
  if (indexMatch) return indexMatch[1];

  const fromHead = execFileSync('git', ['ls-tree', 'HEAD', '--', submodulePath], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
  const headMatch = fromHead.match(/^\d+\s+commit\s+([0-9a-f]{40})\s/);
  return headMatch ? headMatch[1] : null;
}

export async function checkSource(source) {
  const { owner, repo } = parseUpstream(source.upstream);
  const result = {
    name: source.name,
    title: source.title,
    category: source.category,
    upstream: source.upstream,
    ref: source.ref,
    path: source.path,
    internal_dir: source.internal_dir,
    current: null,
    latest: null,
    status: 'unknown',
    aheadBy: 0,
    commits: [],
    compareUrl: null,
    dependenciesChanged: false,
    changedManifests: [],
    filesChanged: 0,
    license: { declared: source.license, upstream: null, ok: false },
    latestRelease: null,
    error: null,
  };

  try {
    result.current = pinnedSha(source.path);
    if (!result.current) {
      result.error = `No pinned commit found for ${source.path}. Is the submodule committed?`;
      result.status = 'error';
      return result;
    }

    const head = await getRefHead(owner, repo, source.ref);
    result.latest = head.sha;
    result.latestCommitDate = head.date;

    if (head.sha === result.current) {
      result.status = 'up-to-date';
    } else {
      const cmp = await compare(owner, repo, result.current, source.ref);
      if (!cmp) {
        // Our pinned commit no longer exists upstream (force-push / history
        // rewrite). Never silently "fix" this — a human must look.
        result.status = 'unreachable';
        result.error =
          `Pinned commit ${result.current.slice(0, 7)} is not reachable in ` +
          `${owner}/${repo}. Upstream history may have been rewritten.`;
        return result;
      }
      result.status = cmp.status === 'identical' ? 'up-to-date' : cmp.status;
      result.aheadBy = cmp.aheadBy;
      result.behindBy = cmp.behindBy;
      result.compareUrl = cmp.htmlUrl;
      result.commits = cmp.commits;
      result.filesChanged = cmp.files.length;
      result.changedManifests = cmp.files
        .filter((f) => MANIFEST_RE.test(f.filename))
        .map((f) => f.filename);
      result.dependenciesChanged = result.changedManifests.length > 0;
    }

    // Licence is re-verified at the commit we would move TO, not at the
    // commit we already have. Catches upstream relicensing before we adopt it.
    const licenseRef = result.latest ?? result.current;
    const lic = await getLicenseAt(owner, repo, licenseRef);
    result.license.upstream = lic.spdx;
    result.license.url = lic.url;
    result.license.ok = lic.spdx === source.license;
    if (!result.license.ok) {
      result.licenseWarning =
        `Upstream licence at ${String(licenseRef).slice(0, 7)} is ` +
        `${lic.spdx ?? 'UNDETECTED'} but the registry declares ${source.license}.`;
    }

    result.latestRelease = await getLatestRelease(owner, repo);
  } catch (err) {
    result.status = 'error';
    result.error = err.message;
  }

  return result;
}

/**
 * Health check for a catalogued source whose code we do NOT ingest.
 *
 * There is no pinned commit here, so "drift" is meaningless. What can rot
 * instead is the recommendation itself: the project gets archived, goes quiet,
 * relicenses, or moves its development branch. Two API calls per source.
 */
export async function checkReference(source) {
  const { owner, repo } = parseUpstream(source.upstream);
  const result = {
    name: source.name,
    title: source.title,
    group: source.group,
    upstream: source.upstream,
    ref: source.ref,
    maturity: source.maturity ?? null,
    archived: false,
    defaultBranch: null,
    trackedRefIsDefault: true,
    quietDays: null,
    latestRelease: null,
    license: { declared: source.license, expected: expectedSpdx(source), upstream: null, ok: false },
    status: 'ok',
    warnings: [],
    error: null,
  };

  try {
    const data = await getRepo(owner, repo);
    if (!data) {
      result.status = 'unreachable';
      result.error = `${owner}/${repo} not found — renamed, deleted or made private`;
      return result;
    }

    result.archived = Boolean(data.archived);
    result.defaultBranch = data.default_branch;
    result.trackedRefIsDefault = data.default_branch === source.ref;
    result.quietDays = data.pushed_at
      ? Math.round((Date.now() - new Date(data.pushed_at).getTime()) / 86_400_000)
      : null;

    // The repository payload already carries the licence, so verifying it here
    // costs nothing extra.
    result.license.upstream = data.license?.spdx_id ?? null;
    result.license.ok = result.license.upstream === result.license.expected;
    if (!result.license.ok) {
      result.status = 'relicensed';
      result.warnings.push(
        `licence is ${result.license.upstream ?? 'UNDETECTED'} upstream but the registry expects ` +
          `${result.license.expected}`,
      );
    }

    if (result.archived) {
      if (result.status === 'ok') result.status = 'archived';
      result.warnings.push('upstream is ARCHIVED — no fixes will ever land');
    }
    if (result.quietDays !== null && result.quietDays > 365) {
      if (result.status === 'ok') result.status = 'quiet';
      result.warnings.push(`no upstream push for ${result.quietDays} days`);
    }
    if (!result.trackedRefIsDefault) {
      // Not a failure: Next.js is tracked on `canary` and Storybook on `next`
      // deliberately. Worth showing so an unintended mismatch is visible.
      result.warnings.push(
        `registry tracks \`${source.ref}\`; upstream default branch is \`${result.defaultBranch}\``,
      );
    }

    result.latestRelease = await getLatestRelease(owner, repo);
  } catch (err) {
    result.status = 'error';
    result.error = err.message;
  }

  return result;
}

export async function checkCatalog({ only = null } = {}) {
  let sources = referenceSources();
  if (only) sources = sources.filter((s) => s.name === only);
  return Promise.all(sources.map(checkReference));
}

export async function checkAll({ only = null } = {}) {
  const registry = loadRegistry();
  let sources = submoduleSources(registry);
  if (only) sources = sources.filter((s) => s.name === only);
  if (!sources.length) {
    throw new Error(only ? `No enabled submodule source named "${only}"` : 'No enabled sources');
  }
  return Promise.all(sources.map(checkSource));
}

function summarise(results) {
  const lines = [];
  for (const r of results) {
    const icon =
      r.status === 'up-to-date' ? '=' :
      r.status === 'ahead' ? '↑' :
      r.status === 'error' || r.status === 'unreachable' ? '✗' : '?';
    lines.push(`${icon} ${r.title} (${r.name})`);
    lines.push(`    upstream : ${r.upstream} @ ${r.ref}`);
    lines.push(`    pinned   : ${r.current ? r.current.slice(0, 10) : '—'}`);
    lines.push(`    latest   : ${r.latest ? r.latest.slice(0, 10) : '—'}`);
    lines.push(`    status   : ${r.status}${r.aheadBy ? ` (${r.aheadBy} new commit(s))` : ''}`);
    if (r.dependenciesChanged) {
      lines.push(`    deps     : CHANGED -> ${r.changedManifests.join(', ')}`);
    }
    lines.push(`    licence  : ${r.license.upstream ?? '—'} ${r.license.ok ? '(matches registry)' : '(MISMATCH)'}`);
    if (r.error) lines.push(`    error    : ${r.error}`);
    lines.push('');
  }
  const outdated = results.filter((r) => r.status === 'ahead' || r.status === 'diverged');
  lines.push(
    outdated.length
      ? `${outdated.length} source(s) behind upstream: ${outdated.map((r) => r.name).join(', ')}`
      : 'All sources are up to date with upstream.',
  );
  return lines.join('\n');
}

function summariseCatalog(results) {
  const lines = [];
  for (const r of results) {
    const icon = r.status === 'ok' ? '=' : r.status === 'error' || r.status === 'unreachable' || r.status === 'relicensed' ? '✗' : '!';
    lines.push(`${icon} ${r.title} (${r.name})`);
    lines.push(`    upstream : ${r.upstream} @ ${r.ref}`);
    lines.push(`    activity : ${r.quietDays !== null ? `last push ${r.quietDays}d ago` : '—'}${r.archived ? '  ARCHIVED' : ''}`);
    lines.push(`    release  : ${r.latestRelease ? `${r.latestRelease.tag} (${String(r.latestRelease.publishedAt).slice(0, 10)})` : '—'}`);
    lines.push(`    licence  : ${r.license.upstream ?? '—'} ${r.license.ok ? '(matches registry)' : '(MISMATCH)'}`);
    for (const w of r.warnings) lines.push(`    warning  : ${w}`);
    if (r.error) lines.push(`    error    : ${r.error}`);
    lines.push('');
  }
  const bad = results.filter((r) => r.status === 'relicensed' || r.status === 'unreachable' || r.status === 'error');
  const warn = results.filter((r) => r.status === 'archived' || r.status === 'quiet');
  lines.push(
    `${results.length} catalogued source(s): ${results.length - bad.length - warn.length} healthy, ` +
      `${warn.length} to review, ${bad.length} broken.`,
  );
  return lines.join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith('check-upstream.mjs');
if (isMain) {
  const argv = process.argv.slice(2);
  const only = argv.includes('--source') ? argv[argv.indexOf('--source') + 1] : null;

  // --catalog audits the sources whose code we do NOT ingest. They have no
  // pinned commit to drift, so they get their own report.
  if (argv.includes('--catalog')) {
    const catalog = await checkCatalog({ only });
    if (argv.includes('--json')) {
      process.stdout.write(JSON.stringify(catalog, null, 2) + '\n');
    } else {
      console.log(summariseCatalog(catalog));
    }
    const broken = catalog.filter(
      (r) => r.status === 'relicensed' || r.status === 'unreachable' || r.status === 'error',
    );
    process.exit(broken.length ? 2 : 0);
  }

  const results = await checkAll({ only });
  const outdated = results.filter((r) => r.status === 'ahead' || r.status === 'diverged');
  const errored = results.filter((r) => r.status === 'error' || r.status === 'unreachable');

  if (argv.includes('--json')) {
    process.stdout.write(JSON.stringify(results, null, 2) + '\n');
  } else {
    console.log(summarise(results));
  }

  if (argv.includes('--github-output') && process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `has_updates=${outdated.length > 0}\n` +
        `outdated=${JSON.stringify(outdated.map((r) => r.name))}\n` +
        `matrix=${JSON.stringify({ include: outdated.map((r) => ({ source: r.name })) })}\n`,
    );
  }

  // Non-zero only for genuine failures; "behind upstream" is normal.
  if (errored.length) process.exit(2);
}
