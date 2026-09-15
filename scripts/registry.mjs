/**
 * Registry loader + validator for the Engineering Library.
 *
 * Everything else in scripts/ and .github/workflows/ consumes the registry
 * through this module. No technology name is ever hardcoded downstream.
 *
 *   import { loadRegistry, enabledSources } from './registry.mjs'
 *
 * CLI:  node scripts/registry.mjs --validate
 *       node scripts/registry.mjs --list          (JSON, for workflow matrices)
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import YAML from 'yaml';

export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const REGISTRY_PATH = path.join(REPO_ROOT, 'sources.yml');
const GITMODULES_PATH = path.join(REPO_ROOT, '.gitmodules');

const VALID_SYNC_METHODS = new Set(['git-submodule', 'reference-only']);
const VALID_UPDATE_STRATEGIES = new Set(['auto', 'pull-request']);
/** Does OUR code compile against it? See the schema notes in sources.yml. */
const VALID_COUPLINGS = new Set(['type-coupled', 'reference']);
const VALID_MATURITIES = new Set(['standard', 'established', 'emerging']);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `internal_dir` is deliberately absent: it is required only for type-coupled
 * sources, which is checked separately. A source nothing of ours imports has
 * no internal directory to declare.
 */
const REQUIRED_FIELDS = [
  'name',
  'title',
  'category',
  'group',
  'upstream',
  'ref',
  'sync_method',
  'coupling',
  'update_strategy',
  'license',
  'license_ok',
  'enabled',
];

/** Parse .gitmodules into [{ name, path, url }]. */
export function parseGitmodules() {
  if (!existsSync(GITMODULES_PATH)) return [];
  const text = readFileSync(GITMODULES_PATH, 'utf8');
  const entries = [];
  let current = null;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    const header = line.match(/^\[submodule "(.+)"\]$/);
    if (header) {
      current = { name: header[1], path: null, url: null };
      entries.push(current);
      continue;
    }
    if (!current) continue;
    const kv = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (kv) current[kv[1]] = kv[2].trim();
  }
  return entries;
}

/**
 * Load sources.yml, apply `defaults`, and return a normalised registry.
 * Throws on a malformed registry so CI fails loudly rather than silently
 * skipping a source.
 */
export function loadRegistry() {
  if (!existsSync(REGISTRY_PATH)) {
    throw new Error(`Registry not found at ${REGISTRY_PATH}`);
  }
  const doc = YAML.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  if (!doc || typeof doc !== 'object') {
    throw new Error('sources.yml did not parse to an object');
  }
  if (doc.version !== 1) {
    throw new Error(`Unsupported registry version: ${doc.version}`);
  }
  if (!Array.isArray(doc.sources)) {
    throw new Error('sources.yml must contain a `sources:` array');
  }

  const defaults = doc.defaults ?? {};
  const sources = doc.sources.map((raw) => ({
    ...defaults,
    ...raw,
    // `path` is intentionally nullable for reference-only sources.
    path: raw.path ?? null,
  }));

  return { version: doc.version, defaults, groups: doc.groups ?? [], sources };
}

export function enabledSources(registry = loadRegistry()) {
  return registry.sources.filter((s) => s.enabled === true);
}

/** Sources whose code is actually ingested as a pinned git submodule. */
export function submoduleSources(registry = loadRegistry()) {
  return enabledSources(registry).filter((s) => s.sync_method === 'git-submodule');
}

/**
 * Enabled sources that are catalogued and monitored but whose code is NOT
 * ingested. They have no pinned commit, so drift detection does not apply —
 * what matters is whether they are still maintained and still licensed the way
 * the registry claims.
 */
export function referenceSources(registry = loadRegistry()) {
  return enabledSources(registry).filter((s) => s.sync_method === 'reference-only');
}

/**
 * The SPDX id the GitHub API is expected to report for a source.
 *
 * Normally that is simply `license`. It differs only where GitHub cannot
 * classify the licence file (SPDX `NOASSERTION`) and a human has read it
 * instead: `license` then records the human conclusion and `license_detected`
 * records what the API says, so the audit still detects a change rather than
 * being permanently red or silently disabled.
 */
export function expectedSpdx(source) {
  return source.license_detected ?? source.license;
}

/** Sources in a catalog group, in registry order. */
export function sourcesByGroup(registry = loadRegistry()) {
  return registry.groups.map((g) => ({
    ...g,
    sources: registry.sources.filter((s) => s.group === g.id),
  }));
}

export function findSource(name, registry = loadRegistry()) {
  const hit = registry.sources.find((s) => s.name === name);
  if (!hit) throw new Error(`Unknown source: ${name}`);
  return hit;
}

/**
 * Split an upstream GitHub URL into { owner, repo }.
 * Repository names may contain dots (e.g. `Chart.js`), so the optional
 * `.git` suffix is stripped explicitly rather than via a greedy pattern.
 */
export function parseUpstream(url) {
  const cleaned = String(url).trim().replace(/\/+$/, '').replace(/\.git$/, '');
  const m = cleaned.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/);
  if (!m) throw new Error(`Not a parseable GitHub URL: ${url}`);
  return { owner: m[1], repo: m[2] };
}

/**
 * Full consistency check. Returns an array of human-readable problems;
 * empty array means the registry is sound.
 */
export function validateRegistry() {
  const problems = [];
  let registry;
  try {
    registry = loadRegistry();
  } catch (err) {
    return [`registry: ${err.message}`];
  }

  // --- catalog groups -------------------------------------------------------
  // Every source declares a group, and the generated catalog is rendered from
  // the group list, so an unknown group would silently drop a source out of
  // the documentation developers actually read.
  const groupIds = new Set();
  if (!Array.isArray(registry.groups) || registry.groups.length === 0) {
    problems.push('registry: `groups:` must list at least one catalog group');
  } else {
    for (const g of registry.groups) {
      if (!g?.id) {
        problems.push('groups: every group needs an `id`');
        continue;
      }
      if (groupIds.has(g.id)) problems.push(`groups: duplicate group id \`${g.id}\``);
      groupIds.add(g.id);
      if (!g.title) problems.push(`groups: \`${g.id}\` is missing a \`title\``);
      if (!g.summary) problems.push(`groups: \`${g.id}\` is missing a \`summary\``);
    }
  }

  const seenNames = new Set();
  const seenPaths = new Set();
  const usedGroups = new Set();

  for (const s of registry.sources) {
    const id = s.name ?? '<unnamed>';

    for (const field of REQUIRED_FIELDS) {
      if (s[field] === undefined || s[field] === null) {
        problems.push(`${id}: missing required field \`${field}\``);
      }
    }

    if (seenNames.has(s.name)) problems.push(`${id}: duplicate source name`);
    seenNames.add(s.name);

    if (s.group && !groupIds.has(s.group)) {
      problems.push(
        `${id}: group \`${s.group}\` is not declared in the top-level \`groups:\` list`,
      );
    }
    usedGroups.add(s.group);

    if (!VALID_SYNC_METHODS.has(s.sync_method)) {
      problems.push(`${id}: invalid sync_method \`${s.sync_method}\``);
    }

    if (!VALID_COUPLINGS.has(s.coupling)) {
      problems.push(
        `${id}: invalid coupling \`${s.coupling}\` ` +
          `(expected one of: ${[...VALID_COUPLINGS].join(', ')})`,
      );
    }

    // Our code compiles against it, so there must be somewhere for that code
    // to live — and the sync gate runs its tests.
    if (s.coupling === 'type-coupled' && !s.internal_dir) {
      problems.push(
        `${id}: coupling=type-coupled requires an internal_dir — that package's ` +
          `typecheck and tests are what prove an upstream bump did not break us`,
      );
    }

    // A catalog entry nobody can read is dead weight.
    if (s.enabled === true && !s.docs) {
      problems.push(`${id}: enabled sources must declare a \`docs\` URL`);
    }
    for (const field of ['docs', 'upstream']) {
      if (s[field] && !/^https:\/\//.test(String(s[field]))) {
        problems.push(`${id}: \`${field}\` must be an https URL (got ${s[field]})`);
      }
    }

    // A licence the API cannot classify is only acceptable with a recorded
    // human reading of the actual licence text.
    if (s.license_detected && !s.license_review) {
      problems.push(
        `${id}: license_detected is set, so \`license_review\` must record the ` +
          `human decision that justifies it`,
      );
    }

    if (s.maturity && !VALID_MATURITIES.has(s.maturity)) {
      problems.push(
        `${id}: invalid maturity \`${s.maturity}\` ` +
          `(expected one of: ${[...VALID_MATURITIES].join(', ')})`,
      );
    }
    if (s.vetted_at && !ISO_DATE_RE.test(String(s.vetted_at))) {
      problems.push(`${id}: vetted_at must be YYYY-MM-DD (got ${s.vetted_at})`);
    }
    if (s.tags && (!Array.isArray(s.tags) || s.tags.some((t) => typeof t !== 'string'))) {
      problems.push(`${id}: tags must be a list of strings`);
    }
    if (s.alternatives && !Array.isArray(s.alternatives)) {
      problems.push(`${id}: alternatives must be a list of source names`);
    }

    try {
      parseUpstream(s.upstream);
    } catch (err) {
      problems.push(`${id}: ${err.message}`);
    }

    if (!VALID_UPDATE_STRATEGIES.has(s.update_strategy)) {
      problems.push(
        `${id}: invalid update_strategy \`${s.update_strategy}\` ` +
          `(expected one of: ${[...VALID_UPDATE_STRATEGIES].join(', ')})`,
      );
    }

    // `auto` removes the human review step, so the validation gate becomes the
    // only safeguard. A type-coupled source may only run unattended if it
    // declares an internal_dir whose tests can act as that gate; for a
    // reference source there is nothing of ours to break, and the guard plus
    // the licence re-check are the whole gate.
    if (s.update_strategy === 'auto' && s.enabled === true) {
      if (s.license_ok !== true) {
        problems.push(`${id}: update_strategy=auto requires license_ok: true`);
      }
      if (s.coupling === 'type-coupled' && !s.internal_dir) {
        problems.push(
          `${id}: update_strategy=auto requires an internal_dir — its tests are ` +
            `the only gate protecting the default branch`,
        );
      }
      if (s.sync_method === 'reference-only') {
        problems.push(
          `${id}: update_strategy=auto is meaningless for a reference-only source ` +
            `(there is no pinned commit to move) — use pull-request`,
        );
      }
    }

    // A source may only be enabled if its licence was cleared.
    if (s.enabled === true && s.license_ok !== true) {
      problems.push(
        `${id}: enabled but license_ok is not true (license: ${s.license})`,
      );
    }

    // A disabled source must explain itself.
    if (s.enabled === false && !s.blocked_reason) {
      problems.push(`${id}: disabled sources must provide \`blocked_reason\``);
    }

    if (s.sync_method === 'git-submodule') {
      if (!s.path) {
        problems.push(`${id}: git-submodule sources require \`path\``);
      } else {
        if (seenPaths.has(s.path)) problems.push(`${id}: duplicate path ${s.path}`);
        seenPaths.add(s.path);

        // Upstream code must live under an `upstream/` boundary...
        if (!s.path.split('/').includes('upstream')) {
          problems.push(`${id}: path \`${s.path}\` must sit under an \`upstream/\` directory`);
        }
        // ...and must never overlap our own code.
        if (s.internal_dir && s.path.startsWith(`${s.internal_dir}/`)) {
          problems.push(`${id}: upstream path must not live inside internal_dir`);
        }
        if (s.internal_dir && s.internal_dir.split('/').includes('upstream')) {
          problems.push(`${id}: internal_dir \`${s.internal_dir}\` must not sit under \`upstream/\``);
        }
      }
    } else if (s.path) {
      problems.push(`${id}: reference-only sources must not declare a \`path\``);
    }
  }

  // `alternatives` is how a developer is pointed from the wrong choice to the
  // right one, so a stale name there is a dead end in the catalog.
  for (const s of registry.sources) {
    for (const alt of s.alternatives ?? []) {
      if (!seenNames.has(alt)) {
        problems.push(`${s.name}: alternatives references unknown source \`${alt}\``);
      }
      if (alt === s.name) problems.push(`${s.name}: lists itself as an alternative`);
    }
  }

  // An empty group renders as an empty section in the generated catalog.
  for (const g of registry.groups ?? []) {
    if (g?.id && !usedGroups.has(g.id)) {
      problems.push(`groups: \`${g.id}\` has no sources — remove it or populate it`);
    }
  }

  // Registry <-> .gitmodules must agree in BOTH directions, so a submodule
  // can never be added or removed without the registry noticing.
  const modules = parseGitmodules();
  const modulePaths = new Set(modules.map((m) => m.path));
  for (const s of submoduleSources(registry)) {
    if (!modulePaths.has(s.path)) {
      problems.push(`${s.name}: path \`${s.path}\` is not registered in .gitmodules`);
      continue;
    }
    const mod = modules.find((m) => m.path === s.path);
    const expected = parseUpstream(s.upstream);
    let actual;
    try {
      actual = parseUpstream(mod.url);
    } catch {
      problems.push(`${s.name}: .gitmodules url \`${mod.url}\` is not a GitHub URL`);
      continue;
    }
    if (
      expected.owner.toLowerCase() !== actual.owner.toLowerCase() ||
      expected.repo.toLowerCase() !== actual.repo.toLowerCase()
    ) {
      problems.push(
        `${s.name}: .gitmodules points at ${mod.url} but registry declares ${s.upstream}`,
      );
    }
  }
  const registeredPaths = new Set(submoduleSources(registry).map((s) => s.path));
  for (const mod of modules) {
    if (!registeredPaths.has(mod.path)) {
      problems.push(
        `.gitmodules: submodule \`${mod.path}\` is not declared in sources.yml (unregistered upstream code)`,
      );
    }
  }

  return problems;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    process.stdout.write(JSON.stringify(submoduleSources(), null, 2) + '\n');
  } else {
    const problems = validateRegistry();
    if (problems.length) {
      console.error('Registry validation FAILED:\n');
      for (const p of problems) console.error(`  ✗ ${p}`);
      process.exit(1);
    }
    const reg = loadRegistry();
    const on = enabledSources(reg).length;
    console.log(
      `Registry OK — ${reg.sources.length} source(s): ${on} enabled, ` +
        `${reg.sources.length - on} disabled.`,
    );
  }
}
