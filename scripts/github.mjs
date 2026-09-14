/**
 * Minimal GitHub REST client (no dependencies — uses Node's global fetch).
 *
 * Auth: GITHUB_TOKEN / GH_TOKEN if present. Unauthenticated calls work too but
 * are rate-limited to 60/h, which is why CI always passes a token.
 */

const API = 'https://api.github.com';

function token() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
}

export async function gh(pathname, { raw = false } = {}) {
  const headers = {
    Accept: raw ? 'application/vnd.github.raw' : 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'engineering-library-sync',
  };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch(`${API}${pathname}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status} on ${pathname}: ${body.slice(0, 300)}`);
  }
  return raw ? res.text() : res.json();
}

/**
 * Write request (PUT/POST/PATCH/DELETE).
 *
 * Returns { ok, status, data } rather than throwing, because callers such as
 * the auto-merge sweep need to distinguish "not mergeable yet" (retry later)
 * from a hard failure, and must never abort the whole sweep over one PR.
 */
export async function ghWrite(method, pathname, body) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'engineering-library-sync',
  };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch(`${API}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

/** All check-runs for a commit, flattened. */
export async function getCheckRuns(owner, repo, sha) {
  const data = await gh(`/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`);
  return data?.check_runs ?? [];
}

/** Legacy commit statuses (some tools still report here rather than as checks). */
export async function getCombinedStatus(owner, repo, sha) {
  const data = await gh(`/repos/${owner}/${repo}/commits/${sha}/status`);
  return data ?? { state: 'pending', statuses: [] };
}

export async function listOpenPulls(owner, repo) {
  return (await gh(`/repos/${owner}/${repo}/pulls?state=open&per_page=100`)) ?? [];
}

export async function getPull(owner, repo, number) {
  return gh(`/repos/${owner}/${repo}/pulls/${number}`);
}

/** Current tip commit of `ref` on owner/repo. */
export async function getRefHead(owner, repo, ref) {
  const data = await gh(`/repos/${owner}/${repo}/commits/${encodeURIComponent(ref)}`);
  if (!data) throw new Error(`Ref ${ref} not found on ${owner}/${repo}`);
  return {
    sha: data.sha,
    date: data.commit.author.date,
    message: data.commit.message.split('\n')[0],
  };
}

/**
 * Compare base...head. Returns null when `base` is unknown upstream
 * (e.g. the commit was rewritten away by a force-push) so callers can
 * treat that as a hard error rather than a silent no-op.
 */
export async function compare(owner, repo, base, head) {
  const data = await gh(
    `/repos/${owner}/${repo}/compare/${base}...${encodeURIComponent(head)}`,
  );
  if (!data) return null;
  return {
    status: data.status, // identical | behind | ahead | diverged
    aheadBy: data.ahead_by,
    behindBy: data.behind_by,
    permalinkUrl: data.permalink_url,
    htmlUrl: data.html_url,
    commits: (data.commits || []).map((c) => ({
      sha: c.sha,
      shortSha: c.sha.slice(0, 7),
      date: c.commit.author.date,
      message: c.commit.message.split('\n')[0],
      author: c.author?.login || c.commit.author.name,
      url: c.html_url,
    })),
    files: (data.files || []).map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
    })),
  };
}

export async function getRepo(owner, repo) {
  return gh(`/repos/${owner}/${repo}`);
}

/** SPDX id of the repository licence as GitHub detects it at a given ref. */
export async function getLicenseAt(owner, repo, ref) {
  const data = await gh(`/repos/${owner}/${repo}/license?ref=${encodeURIComponent(ref)}`);
  if (!data) return { spdx: null, path: null, url: null };
  return {
    spdx: data.license?.spdx_id ?? null,
    name: data.license?.name ?? null,
    path: data.path ?? null,
    url: data.html_url ?? null,
  };
}

export async function getLatestRelease(owner, repo) {
  const data = await gh(`/repos/${owner}/${repo}/releases/latest`);
  if (!data) return null;
  return { tag: data.tag_name, name: data.name, url: data.html_url, publishedAt: data.published_at };
}
