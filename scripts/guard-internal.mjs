/**
 * Internal-code guard.
 *
 * This is the mechanical enforcement of the library's central rule:
 *
 *     AN UPSTREAM SYNC MAY NEVER MODIFY INTERNAL CODE.
 *
 * An automated sync is only ever allowed to change:
 *   - the gitlink of a submodule path declared in sources.yml
 *   - .gitmodules
 *   - generated documentation (docs/upstream-sources.md)
 *
 * Anything else — in particular anything under an `internal_dir` — aborts the
 * sync. The check reads the allow-list from the registry, so it automatically
 * covers new sources without being edited.
 *
 *   node scripts/guard-internal.mjs                 # check staged changes
 *   node scripts/guard-internal.mjs --base <ref>    # check a range (CI/PR)
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { REPO_ROOT, loadRegistry, submoduleSources } from './registry.mjs';

const ALWAYS_ALLOWED = new Set(['.gitmodules', 'docs/upstream-sources.md']);

function git(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

function changedFiles({ base } = {}) {
  const out = base
    ? git(['diff', '--name-only', `${base}...HEAD`])
    : git(['diff', '--cached', '--name-only']);
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

export function checkPaths(files) {
  const registry = loadRegistry();
  const allowedPaths = new Set(submoduleSources(registry).map((s) => s.path));
  const internalDirs = [
    ...new Set(registry.sources.map((s) => s.internal_dir).filter(Boolean)),
  ];

  const violations = [];
  for (const file of files) {
    const normalised = file.split(path.sep).join('/');

    if (ALWAYS_ALLOWED.has(normalised)) continue;
    if (allowedPaths.has(normalised)) continue;

    const internal = internalDirs.find(
      (dir) => normalised === dir || normalised.startsWith(`${dir}/`),
    );
    if (internal) {
      violations.push({
        file: normalised,
        reason: `writes into internal code directory \`${internal}\``,
      });
    } else {
      violations.push({
        file: normalised,
        reason: 'is not a registered upstream submodule path',
      });
    }
  }
  return violations;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith('guard-internal.mjs');
if (isMain) {
  const argv = process.argv.slice(2);
  const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : null;

  const files = changedFiles({ base });
  if (!files.length) {
    console.log('Guard: no changes to inspect.');
    process.exit(0);
  }

  const violations = checkPaths(files);
  console.log(`Guard: inspecting ${files.length} changed path(s).`);
  for (const f of files) console.log(`    ~ ${f}`);

  if (violations.length) {
    console.error('\n✗ UPSTREAM SYNC GUARD FAILED — this change is not a pure submodule bump:\n');
    for (const v of violations) console.error(`    ✗ ${v.file} ${v.reason}`);
    console.error(
      '\nAn automated upstream sync may only move a registered submodule pointer.\n' +
        'If this change is intentional, make it in a normal human-authored PR.',
    );
    process.exit(1);
  }
  console.log('\n✓ Guard passed: only registered upstream submodule pointers changed.');
}
