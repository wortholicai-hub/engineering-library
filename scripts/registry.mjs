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
const REQUIRED_FIELDS = [
  'name',
  'title',
  'category',
  'upstream',
  'ref',
  'sync_method',
  'internal_dir',
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

  return { version: doc.version, defaults, sources };
}

export function enabledSources(registry = loadRegistry()) {
  return registry.sources.filter((s) => s.enabled === true);
}

/** Sources whose code is actually ingested as a pinned git submodule. */
export function submoduleSources(registry = loadRegistry()) {
  return enabledSources(registry).filter((s) => s.sync_method === 'git-submodule');
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

  const seenNames = new Set();
  const seenPaths = new Set();

  for (const s of registry.sources) {
    const id = s.name ?? '<unnamed>';

    for (const field of REQUIRED_FIELDS) {
      if (s[field] === undefined || s[field] === null) {
        problems.push(`${id}: missing required field \`${field}\``);
      }
    }

    if (seenNames.has(s.name)) problems.push(`${id}: duplicate source name`);
    seenNames.add(s.name);

    if (!VALID_SYNC_METHODS.has(s.sync_method)) {
      problems.push(`${id}: invalid sync_method \`${s.sync_method}\``);
    }

    try {
      parseUpstream(s.upstream);
    } catch (err) {
      problems.push(`${id}: ${err.message}`);
    }

    // Upstream code must never be auto-merged.
    if (s.auto_merge === true) {
      problems.push(`${id}: auto_merge must be false — upstream changes require review`);
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
