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
import { REPO_ROOT, loadRegistry, parseUpstream } from './registry.mjs';
import { getLicenseAt } from './github.mjs';
import { pinnedSha } from './check-upstream.mjs';

const LICENSE_FILE_RE = /^(LICENSE|LICENCE|COPYING|NOTICE)(\.(md|txt|rst))?$/i;

function findLicenseFiles(dir) {
  if (!existsSync(dir)) return null; // submodule not checked out
  return readdirSync(dir).filter((f) => LICENSE_FILE_RE.test(f));
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
  if (remote && s.sync_method === 'git-submodule' && s.path) {
    const { owner, repo } = parseUpstream(s.upstream);
    const ref = pinnedSha(s.path) ?? s.ref;
    try {
      const lic = await getLicenseAt(owner, repo, ref);
      row.remoteSpdx = lic.spdx ?? 'UNDETECTED';
      if (lic.spdx !== s.license) {
        problems.push(
          `${s.name}: upstream SPDX is ${lic.spdx ?? 'UNDETECTED'} at pinned commit ` +
            `but sources.yml declares ${s.license}`,
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
  console.log(`      declared : ${r.declared}  (license_ok=${r.licenseOk}, enabled=${r.enabled})`);
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
