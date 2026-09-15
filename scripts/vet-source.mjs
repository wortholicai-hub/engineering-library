/**
 * Candidate vetting.
 *
 * Before a repository is allowed into sources.yml it has to be checked, not
 * assumed. This script answers — from the GitHub API, not from memory — the
 * four questions that decide whether we may adopt something:
 *
 *   1. LICENCE       Is there one, and is it permissive enough for us to use
 *                    and derive internal wrappers from with attribution?
 *   2. MAINTENANCE   Is it archived, or has it gone quiet?
 *   3. IDENTITY      What is the real default branch? (`main` is an
 *                    assumption; Chart.js still tracks `master`.)
 *   4. WEIGHT        How big is the repository? This decides the ingest tier:
 *                    something we clone as a submodule has to be a size CI can
 *                    carry, otherwise it is tracked as `reference-only`.
 *
 * One API request per candidate, so a whole batch fits inside the
 * unauthenticated rate limit. Export GITHUB_TOKEN for a bigger allowance.
 *
 *   node scripts/vet-source.mjs tanstack/table mantinedev/mantine
 *   node scripts/vet-source.mjs --file candidates.txt
 *   node scripts/vet-source.mjs --json tanstack/table
 *   node scripts/vet-source.mjs --emit-registry tanstack/table
 *
 * Exit code is non-zero if any candidate is a BLOCK, so this can gate CI.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRepo } from './github.mjs';

/**
 * Licences we accept without a legal conversation: permissive, allow
 * commercial use, allow derivative works, require only attribution.
 * Weak-copyleft and copyleft are deliberately absent — they are not
 * "no", they are "ask first", which is what `review` means below.
 */
export const PERMISSIVE = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'Unlicense']);

/** Above this packed size (KB) a repository is too heavy to clone in CI. */
export const SUBMODULE_SIZE_LIMIT_KB = 250_000;

/** Quiet for longer than this and "actively maintained" is no longer a claim we can make. */
const STALE_DAYS = 365;

const DAY_MS = 86_400_000;

export function classify(repo, { now }) {
  const spdx = repo.license?.spdx_id ?? null;
  const pushedAt = repo.pushed_at ? new Date(repo.pushed_at) : null;
  const quietDays = pushedAt ? Math.round((now - pushedAt.getTime()) / DAY_MS) : null;

  const notes = [];
  let verdict = 'adopt';

  // --- licence: the hard gate ------------------------------------------------
  if (!spdx || spdx === 'NOASSERTION') {
    verdict = 'BLOCK';
    notes.push(
      spdx === 'NOASSERTION'
        ? 'licence file present but GitHub cannot identify it — treat as unlicensed until a human reads it'
        : 'NO LICENCE — default copyright applies, we have no permission to use it',
    );
  } else if (!PERMISSIVE.has(spdx)) {
    verdict = 'review';
    notes.push(`${spdx} is not on the permissive allow-list — needs a deliberate licence decision`);
  }

  // --- maintenance -----------------------------------------------------------
  if (repo.archived) {
    if (verdict === 'adopt') verdict = 'review';
    notes.push('ARCHIVED — read-only upstream, no fixes will ever land');
  }
  if (quietDays !== null && quietDays > STALE_DAYS) {
    if (verdict === 'adopt') verdict = 'review';
    notes.push(`no push for ${quietDays} days`);
  }
  if (repo.fork) {
    if (verdict === 'adopt') verdict = 'review';
    notes.push('this is a FORK — track the canonical repository instead');
  }

  // --- ingest tier -----------------------------------------------------------
  const tier = repo.size > SUBMODULE_SIZE_LIMIT_KB ? 'reference-only' : 'git-submodule';
  if (tier === 'reference-only' && verdict !== 'BLOCK') {
    notes.push(
      `${(repo.size / 1000).toFixed(0)} MB packed — too heavy to clone in CI, track as reference-only`,
    );
  }

  return {
    slug: repo.full_name,
    url: repo.html_url,
    description: repo.description,
    license: spdx,
    licensePermissive: spdx ? PERMISSIVE.has(spdx) : false,
    defaultBranch: repo.default_branch,
    archived: Boolean(repo.archived),
    fork: Boolean(repo.fork),
    stars: repo.stargazers_count,
    sizeKb: repo.size,
    pushedAt: repo.pushed_at,
    quietDays,
    suggestedSyncMethod: tier,
    verdict,
    notes,
  };
}

export async function vet(slug, { now = Date.now() } = {}) {
  const [owner, name] = String(slug).trim().replace(/^https:\/\/github\.com\//, '').split('/');
  if (!owner || !name) throw new Error(`Not an owner/repo slug: ${slug}`);
  const repo = await getRepo(owner, name);
  if (!repo) {
    return {
      slug: `${owner}/${name}`,
      verdict: 'BLOCK',
      notes: ['repository not found (renamed, deleted or private)'],
      license: null,
      suggestedSyncMethod: null,
    };
  }
  return classify(repo, { now });
}

/** A registry stanza with everything the API can answer already filled in. */
function emitRegistry(r, today) {
  const slugName = r.slug.split('/')[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const submodule = r.suggestedSyncMethod === 'git-submodule';
  return [
    `  - name: ${slugName}`,
    `    title: ${r.slug.split('/')[1]}`,
    `    category: frontend            # TODO confirm`,
    `    group: TODO                   # must exist in the top-level \`groups:\``,
    `    upstream: ${r.url}`,
    `    ref: ${r.defaultBranch}`,
    `    sync_method: ${r.suggestedSyncMethod}`,
    submodule
      ? `    path: frontend/TODO/upstream/${slugName}`
      : `    path: null`,
    `    internal_dir: ${submodule ? 'frontend/TODO/TODO' : 'null'}`,
    `    docs: TODO                    # official documentation URL`,
    `    install: TODO                 # npm package name`,
    `    license: ${r.license}`,
    `    license_ok: ${r.verdict !== 'BLOCK'}`,
    `    enabled: ${r.verdict === 'adopt'}`,
    `    update_strategy: ${submodule ? 'auto' : 'pull-request'}`,
    `    vetted_at: '${today}'`,
    `    description: >-`,
    `      ${r.description ?? 'TODO'}`,
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const argv = process.argv.slice(2);
  const flag = (f) => argv.includes(f);
  const valueOf = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : null);

  let slugs = argv.filter((a) => !a.startsWith('--') && a.includes('/'));
  const file = valueOf('--file');
  if (file) {
    slugs = readFileSync(file, 'utf8')
      .split('\n')
      .map((l) => l.replace(/#.*$/, '').trim())
      .filter(Boolean);
  }
  if (!slugs.length) {
    console.error('Usage: node scripts/vet-source.mjs <owner/repo>... [--file list.txt] [--json] [--emit-registry]');
    process.exit(64);
  }

  const results = [];
  for (const slug of slugs) {
    try {
      results.push(await vet(slug));
    } catch (err) {
      results.push({ slug, verdict: 'BLOCK', notes: [err.message], license: null });
    }
  }

  if (flag('--json')) {
    process.stdout.write(JSON.stringify(results, null, 2) + '\n');
  } else if (flag('--emit-registry')) {
    const today = new Date().toISOString().slice(0, 10);
    for (const r of results.filter((x) => x.verdict !== 'BLOCK')) {
      process.stdout.write(emitRegistry(r, today));
    }
  } else {
    const icon = { adopt: '✓', review: '?', BLOCK: '✗' };
    for (const r of results) {
      console.log(`${icon[r.verdict] ?? '?'} ${r.slug}`);
      console.log(
        `      licence  : ${r.license ?? 'NONE'}   branch: ${r.defaultBranch ?? '—'}   ` +
          `size: ${r.sizeKb != null ? `${(r.sizeKb / 1000).toFixed(0)} MB` : '—'}   ` +
          `stars: ${r.stars ?? '—'}   last push: ${r.quietDays != null ? `${r.quietDays}d ago` : '—'}`,
      );
      console.log(`      ingest   : ${r.suggestedSyncMethod ?? '—'}`);
      for (const n of r.notes ?? []) console.log(`      note     : ${n}`);
      console.log('');
    }
    const blocked = results.filter((r) => r.verdict === 'BLOCK');
    const review = results.filter((r) => r.verdict === 'review');
    console.log(
      `${results.length} candidate(s): ${results.length - blocked.length - review.length} adopt, ` +
        `${review.length} need a decision, ${blocked.length} blocked.`,
    );
  }

  if (results.some((r) => r.verdict === 'BLOCK')) process.exit(1);
}
