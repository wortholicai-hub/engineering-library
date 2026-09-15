/**
 * Licence audit.
 *
 * Two independent checks, because "it is public on GitHub" is not a licence:
 *
 *   1. LOCAL  — every checked-out submodule must physically contain a
 *               LICENSE file. If upstream code is present on disk without a
 *               licence text, that is a compliance problem.
 *   2. REMOTE — the SPDX identifier GitHub detects for the upstream repo at
 *               our pinned commit must still match what sources.yml declares.
 *               Catches upstream relicensing.
 *
 * Disabled sources are audited too — the point is to prove we are *not*
 * ingesting code we have no licence for.
 *
 *   node scripts/license-audit.mjs            # local checks (offline-safe)
 *   node scripts/license-audit.mjs --remote   # also verify SPDX via API
 */

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, loadRegistry, parseUpstream, expectedSpdx } from './registry.mjs';
import { getLicenseAt } from './github.mjs';
import { pinnedSha } from './check-upstream.mjs';

const LICENSE_FILE_RE = /^(LICENSE|LICENCE|COPYING|NOTICE)(\.(md|txt|rst))?$/i;

/**
 * Returns the licence files present in a checked-out submodule, or `null` when
 * the submodule is not checked out.
 *
 * An *uninitialised* submodule leaves an empty directory on disk, so "missing"
 * and "empty" both mean "not checked out". Only a directory with content but
 * no licence file is a genuine compliance problem — CI jobs deliberately
 * initialise a single submodule, and the rest must not be reported as
 * violations.
 */
function findLicenseFiles(dir) {
  if (!existsSync(dir)) return null;
  const entries = readdirSync(dir);
  if (entries.length === 0) return null;
  return entries.filter((f) => LICENSE_FILE_RE.test(f));
}

const argv = process.argv.slice(2);
const remote = argv.includes('--remote');
const registry = loadRegistry();

const problems = [];
const rows = [];

for (const s of registry.sources) {
  const row = {
    name: s.name,
    title: s.title,
    declared: s.license,
    // What the API is expected to report — differs from `declared` only where
    // a human read a licence GitHub could not classify.
    expected: expectedSpdx(s),
    enabled: s.enabled,
    licenseOk: s.license_ok,
    localFiles: null,
    remoteSpdx: null,
    verdict: 'ok',
  };

  // --- rule: a source may only be enabled if its licence was cleared -------
  if (s.enabled && !s.license_ok) {
    problems.push(`${s.name}: enabled although license_ok=false`);
    row.verdict = 'blocked';
  }

  // --- rule: disabled-for-licence sources must not have ingested code -----
  if (!s.license_ok) {
    row.verdict = 'not-ingested';
    if (s.path && existsSync(path.join(REPO_ROOT, s.path))) {
      problems.push(
        `${s.name}: licence not cleared (${s.license}) yet code exists at ${s.path}`,
      );
      row.verdict = 'VIOLATION';
    }
    rows.push(row);
    continue;
  }

  // --- local: licence text must be present alongside the code -------------
  if (s.sync_method === 'git-submodule' && s.path) {
    const files = findLicenseFiles(path.join(REPO_ROOT, s.path));
    if (files === null) {
      row.localFiles = '(submodule not checked out)';
    } else if (!files.length) {
      problems.push(`${s.name}: no LICENSE file found in ${s.path}`);
      row.localFiles = 'MISSING';
      row.verdict = 'VIOLATION';
    } else {
      row.localFiles = files.join(', ');
    }
  }

  // --- remote: SPDX must still match the registry -------------------------
  // Reference-only sources are audited too. We ingest none of their code, but
  // the catalog tells developers they may use them, so a relicensing there is
  // exactly as consequential as one in a submodule — it is just harder to
  // notice, because nothing on disk changes.
  if (remote) {
    const { owner, repo } = parseUpstream(s.upstream);
    // Submodule sources are checked at the commit we actually pinned;
    // reference-only sources have no pinned commit, so the tracked branch is
    // the only meaningful reference point.
    const ref = (s.path ? pinnedSha(s.path) : null) ?? s.ref;
    const expected = expectedSpdx(s);
    try {
      const lic = await getLicenseAt(owner, repo, ref);
      row.remoteSpdx = lic.spdx ?? 'UNDETECTED';
      if (lic.spdx !== expected) {
        problems.push(
          `${s.name}: upstream SPDX is ${lic.spdx ?? 'UNDETECTED'} at ${String(ref).slice(0, 10)} ` +
            `but sources.yml expects ${expected}` +
            (s.license_detected
              ? ` (declared ${s.license} after a recorded human licence review — re-read the licence file)`
              : ''),
        );
        row.verdict = 'RELICENSED';
      }
    } catch (err) {
      problems.push(`${s.name}: licence lookup failed — ${err.message}`);
      row.verdict = 'unknown';
    }
  }

  rows.push(row);
}

console.log('Licence audit\n');
for (const r of rows) {
  console.log(`  ${r.verdict === 'ok' ? '✓' : r.verdict === 'not-ingested' ? '·' : '✗'} ${r.title}`);
  console.log(
    `      declared : ${r.declared}  (license_ok=${r.licenseOk}, enabled=${r.enabled})` +
      (r.expected !== r.declared ? `  [API reports ${r.expected} — human-reviewed]` : ''),
  );
  if (r.localFiles !== null) console.log(`      local    : ${r.localFiles}`);
  if (r.remoteSpdx !== null) console.log(`      upstream : ${r.remoteSpdx}`);
  console.log(`      verdict  : ${r.verdict}`);
  console.log('');
}

if (problems.length) {
  console.error('Licence audit FAILED:\n');
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`Licence audit passed for ${rows.length} source(s).`);
