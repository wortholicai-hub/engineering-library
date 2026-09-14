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
import { REPO_ROOT, submoduleSources, parseUpstream, loadRegistry } from './registry.mjs';
import { compare, getRefHead, getLicenseAt, getLatestRelease } from './github.mjs';

/** Dependency manifests we care about when reporting "did deps change?". */
const MANIFEST_RE =
  /(^|\/)(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb)$/;

/**
 * The commit currently pinned for a submodule, read from the git index.
 * `git ls-tree HEAD <path>` gives the gitlink SHA — this is the authoritative
 * record of what our repository actually references, independent of whether
 * the submodule happens to be checked out on this machine.
 */
export function pinnedSha(submodulePath) {
  const out = execFileSync('git', ['ls-tree', 'HEAD', submodulePath], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
  if (!out) return null;
  const m = out.match(/^\d+\s+commit\s+([0-9a-f]{40})\s/);
  return m ? m[1] : null;
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

const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith('check-upstream.mjs');
if (isMain) {
  const argv = process.argv.slice(2);
  const only = argv.includes('--source') ? argv[argv.indexOf('--source') + 1] : null;

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
