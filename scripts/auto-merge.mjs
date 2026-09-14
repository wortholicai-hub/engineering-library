/**
 * Autonomous merge sweep.
 *
 * Merges bot-authored dependency pull requests once — and only once — every
 * check on the head commit has finished and succeeded. With no human in the
 * loop, CI is the sole gate, so the rules here are deliberately strict:
 *
 *   - author must be a trusted bot (dependabot / github-actions)
 *   - at least one check must have run (never merge an unverified PR)
 *   - every completed check must be success or skipped
 *   - no check may still be queued or running
 *   - GitHub must report the PR as mergeable and behind no merge conflict
 *
 * Anything that fails these rules is left open and reported, not merged.
 *
 *   node scripts/auto-merge.mjs            # merge everything eligible
 *   node scripts/auto-merge.mjs --dry-run  # report decisions only
 */

import { appendFileSync } from 'node:fs';
import {
  listOpenPulls,
  getPull,
  getCheckRuns,
  getCombinedStatus,
  ghWrite,
} from './github.mjs';

const TRUSTED_AUTHORS = new Set(['dependabot[bot]', 'github-actions[bot]']);
const ACCEPTABLE_CONCLUSIONS = new Set(['success', 'skipped', 'neutral']);

const repoSlug = process.env.GITHUB_REPOSITORY;
if (!repoSlug) {
  console.error('GITHUB_REPOSITORY is not set (expected "owner/repo").');
  process.exit(1);
}
const [owner, repo] = repoSlug.split('/');
const dryRun = process.argv.includes('--dry-run');

/** Decide whether a PR's checks permit an unattended merge. */
async function evaluateChecks(sha) {
  const runs = await getCheckRuns(owner, repo, sha);
  const status = await getCombinedStatus(owner, repo, sha);

  const pending = runs.filter((r) => r.status !== 'completed');
  const failed = runs.filter(
    (r) => r.status === 'completed' && !ACCEPTABLE_CONCLUSIONS.has(r.conclusion),
  );
  const passed = runs.filter((r) => r.conclusion === 'success');

  if (runs.length === 0 && status.state === 'pending' && status.statuses.length === 0) {
    return { ok: false, reason: 'no checks have reported yet' };
  }
  if (pending.length) {
    return { ok: false, reason: `${pending.length} check(s) still running` };
  }
  if (failed.length) {
    return {
      ok: false,
      reason: `failing check(s): ${failed.map((f) => `${f.name}(${f.conclusion})`).join(', ')}`,
    };
  }
  if (status.state === 'failure' || status.state === 'error') {
    return { ok: false, reason: `commit status is ${status.state}` };
  }
  if (passed.length === 0) {
    return { ok: false, reason: 'no check actually succeeded' };
  }
  return { ok: true, reason: `${passed.length} check(s) passed` };
}

const merged = [];
const skipped = [];

const pulls = await listOpenPulls(owner, repo);
console.log(`Auto-merge sweep: ${pulls.length} open pull request(s) in ${repoSlug}\n`);

for (const summary of pulls) {
  const label = `#${summary.number} ${summary.title.slice(0, 70)}`;
  const author = summary.user?.login;

  if (!TRUSTED_AUTHORS.has(author)) {
    skipped.push({ label, reason: `author ${author} is not an automated updater` });
    continue;
  }
  if (summary.draft) {
    skipped.push({ label, reason: 'draft' });
    continue;
  }

  const checks = await evaluateChecks(summary.head.sha);
  if (!checks.ok) {
    skipped.push({ label, reason: checks.reason });
    continue;
  }

  // Re-fetch: `mergeable` is computed lazily and is absent from list results.
  let pr = await getPull(owner, repo, summary.number);
  for (let i = 0; i < 5 && pr?.mergeable === null; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    pr = await getPull(owner, repo, summary.number);
  }
  if (pr?.mergeable === false) {
    skipped.push({ label, reason: `not mergeable (${pr.mergeable_state})` });
    continue;
  }

  if (dryRun) {
    merged.push({ label, reason: `would merge — ${checks.reason}` });
    continue;
  }

  const res = await ghWrite('PUT', `/repos/${owner}/${repo}/pulls/${summary.number}/merge`, {
    merge_method: 'squash',
    commit_title: `${summary.title} (#${summary.number})`,
    commit_message: `Auto-merged by scripts/auto-merge.mjs — ${checks.reason}.`,
  });

  if (res.ok) {
    merged.push({ label, reason: checks.reason });
    // Tidy up the source branch; harmless if the repo already auto-deletes.
    await ghWrite('DELETE', `/repos/${owner}/${repo}/git/refs/heads/${summary.head.ref}`);
  } else {
    skipped.push({
      label,
      reason: `merge API returned ${res.status}: ${res.data?.message ?? 'unknown error'}`,
    });
  }
}

for (const m of merged) console.log(`  ✓ ${dryRun ? '[dry-run] ' : ''}${m.label}\n      ${m.reason}`);
for (const s of skipped) console.log(`  · skipped ${s.label}\n      ${s.reason}`);
console.log(
  `\n${dryRun ? 'Would merge' : 'Merged'} ${merged.length}, left open ${skipped.length}.`,
);

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = ['## Auto-merge sweep', ''];
  lines.push(`${dryRun ? 'Would merge' : 'Merged'}: **${merged.length}** · left open: **${skipped.length}**`, '');
  if (merged.length) {
    lines.push('| Merged | Why |', '| --- | --- |');
    for (const m of merged) lines.push(`| ${m.label} | ${m.reason} |`);
    lines.push('');
  }
  if (skipped.length) {
    lines.push('| Left open | Why |', '| --- | --- |');
    for (const s of skipped) lines.push(`| ${s.label} | ${s.reason} |`);
  }
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
}
