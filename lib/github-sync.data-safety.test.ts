import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syncGithubProfile } from "@/lib/github-sync";

// Integration-style guard for the AGENTS.md non-negotiable: nothing private —
// the GitHub access token, private account fields, private repos, raw API
// payloads — may ever reach a database write. The GitHub API and the Supabase
// client are mocked; the assertions pin the exact shape of what gets written,
// so any new column is a conscious, reviewed choice instead of an accident.

const GITHUB_TOKEN = "ghp_FixtureAccessToken1234567890abcdef";
const USER_ID = "00000000-0000-4000-8000-000000000001";

// Authenticated GET /user response — deliberately carries the private account
// fields the real endpoint returns, to prove they get stripped.
const GITHUB_USER = {
  login: "octocat",
  id: 583231,
  node_id: "MDQ6VXNlcjU4MzIzMQ==",
  avatar_url: "https://avatars.githubusercontent.com/u/583231",
  name: "Octo Cat",
  bio: "Building things in public",
  location: "Recife, Brazil",
  public_repos: 2,
  followers: 7,
  created_at: "2024-01-15T00:00:00Z",
  email: "octocat-private@example.com",
  notification_email: "octocat-notify@example.com",
  two_factor_authentication: true,
  total_private_repos: 5,
  owned_private_repos: 5,
  disk_usage: 20000,
  collaborators: 3,
  plan: { name: "pro", space: 1, private_repos: 9999, collaborators: 0 },
};

// GET /user/repos item — includes the raw-payload fields (urls, permissions,
// temp clone token) that a careless object spread would leak into a row.
const PUBLIC_REPO = {
  id: 101,
  node_id: "R_kgDOJx101",
  name: "public-portfolio",
  full_name: "octocat/public-portfolio",
  private: false,
  visibility: "public",
  owner: { login: "octocat", id: 583231 },
  description: "A public project",
  fork: false,
  size: 120,
  stargazers_count: 5,
  forks_count: 1,
  language: "TypeScript",
  license: { key: "mit", name: "MIT License" },
  default_branch: "main",
  pushed_at: "2026-07-01T00:00:00Z",
  languages_url: "https://api.github.com/repos/octocat/public-portfolio/languages",
  ssh_url: "git@github.com:octocat/public-portfolio.git",
  clone_url: "https://github.com/octocat/public-portfolio.git",
  temp_clone_token: "ghs_FixtureTempCloneToken000000",
  permissions: { admin: true, maintain: true, push: true, triage: true, pull: true },
};

// A private repo must be dropped before any enrichment or persistence — even
// its name showing up in a public-facing row would be a leak.
const PRIVATE_REPO = {
  ...PUBLIC_REPO,
  id: 202,
  node_id: "R_kgDOJx202",
  name: "secret-internal-tool",
  full_name: "octocat/secret-internal-tool",
  private: true,
  visibility: "private",
  description: "Internal — do not disclose",
  languages_url: "https://api.github.com/repos/octocat/secret-internal-tool/languages",
};

// Every column the sync is allowed to write, and nothing else. Adding a key
// here must come with a check that the field is safe to expose — repos rows
// and (via the public_profiles view allowlist) profile fields are public.
const ALLOWED_REPO_COLUMNS = [
  "profile_id",
  "github_repo_id",
  "name",
  "description",
  "stack",
  "stars",
  "forks",
  "commits",
  "impact_score",
  "is_selected",
].sort();

const ALLOWED_PROFILE_COLUMNS = [
  "bio",
  "full_name",
  "avatar_url",
  "location",
  "public_repos",
  "followers",
  "github_created_at",
  "top_stack",
  "total_commits",
  "updated_at",
].sort();

// Strings that must never appear anywhere in a serialized database write.
const LEAK_MARKERS = [
  GITHUB_TOKEN,
  "ghp_",
  "ghs_",
  GITHUB_USER.email,
  GITHUB_USER.notification_email,
  "two_factor_authentication",
  "temp_clone_token",
  "ssh_url",
  "git@github.com",
  "permissions",
  "node_id",
  PRIVATE_REPO.name,
];

type QueryResult = { data: unknown; error: null };
type WriteCall = { table: string; method: "update" | "upsert"; payload: unknown };

type Builder = {
  select: (...args: unknown[]) => Builder;
  delete: (...args: unknown[]) => Builder;
  update: (payload: unknown) => Builder;
  upsert: (payload: unknown, options?: unknown) => Builder;
  eq: (...args: unknown[]) => Builder;
  not: (...args: unknown[]) => Builder;
  single: (...args: unknown[]) => Builder;
  then: <T>(
    onFulfilled?: ((value: QueryResult) => T | PromiseLike<T>) | null,
    onRejected?: ((reason: unknown) => T | PromiseLike<T>) | null
  ) => Promise<T>;
};

// Minimal chainable stand-in for the Supabase query builder: every write
// payload is captured, and awaiting the chain resolves to a canned result
// picked by the first verb called on it.
function createSupabaseMock(profileRow: Record<string, unknown>) {
  const writes: WriteCall[] = [];

  const from = (table: string) => {
    let verb = "select";

    const resolveResult = (): QueryResult => {
      if (verb === "select" && table === "profiles") return { data: profileRow, error: null };
      if (verb === "select" && table === "repos") {
        return { data: [{ github_repo_id: PUBLIC_REPO.id, is_selected: true }], error: null };
      }
      return { data: null, error: null };
    };

    const builder: Builder = {
      select: () => {
        verb = "select";
        return builder;
      },
      delete: () => {
        verb = "delete";
        return builder;
      },
      update: (payload) => {
        verb = "update";
        writes.push({ table, method: "update", payload });
        return builder;
      },
      upsert: (payload) => {
        verb = "upsert";
        writes.push({ table, method: "upsert", payload });
        return builder;
      },
      eq: () => builder,
      not: () => builder,
      single: () => builder,
      then: (onFulfilled, onRejected) =>
        Promise.resolve(resolveResult()).then(onFulfilled, onRejected),
    };

    return builder;
  };

  return { supabase: { from } as unknown as SupabaseClient, writes };
}

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => null },
  json: async () => body,
  text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
});

// Routes every fetch the sync makes to a realistic canned payload. Anything
// outside this list fails the test — a new outbound call must be sanctioned
// here on purpose.
function stubGithubApi() {
  vi.stubGlobal("fetch", async (input: unknown) => {
    const url = String(input);

    if (url === "https://api.github.com/user") return jsonResponse(GITHUB_USER);
    if (url.startsWith("https://api.github.com/user/repos")) {
      return jsonResponse([PUBLIC_REPO, PRIVATE_REPO]);
    }
    if (url === PUBLIC_REPO.languages_url) {
      return jsonResponse({ TypeScript: 8000, CSS: 2000 });
    }
    if (url.includes("/git/trees/")) {
      return jsonResponse({ truncated: false, tree: [{ path: "README.md" }] });
    }
    if (url === "https://api.github.com/repos/octocat/octocat/readme") {
      return jsonResponse("Not Found", 404);
    }
    if (url === "https://api.github.com/graphql") {
      return jsonResponse({
        data: { viewer: { contributionsCollection: { totalCommitContributions: 42 } } },
      });
    }
    throw new Error(`unexpected fetch in test: ${url}`);
  });
}

function getWrite(writes: WriteCall[], table: string, method: WriteCall["method"]) {
  const write = writes.find((w) => w.table === table && w.method === method);
  if (!write) throw new Error(`expected a ${method} write on ${table}`);
  return write.payload;
}

async function runSync(profileRow: Record<string, unknown> = { top_stack: [], summary_manual: false }) {
  const { supabase, writes } = createSupabaseMock(profileRow);
  const result = await syncGithubProfile(supabase, USER_ID, GITHUB_TOKEN);
  return { writes, result };
}

describe("syncGithubProfile data safety", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fixed clock: keeps the recency boost, active-repos window and the
    // GraphQL year loop (2024–2026 given the fixture created_at) stable.
    vi.setSystemTime(new Date("2026-07-10T12:00:00Z"));
    stubGithubApi();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("upserts only the allowlisted repo columns", async () => {
    const { writes } = await runSync();
    const rows = getWrite(writes, "repos", "upsert") as Record<string, unknown>[];

    expect(rows).toHaveLength(1);
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual(ALLOWED_REPO_COLUMNS);
    }
  });

  it("drops private repos before anything is persisted", async () => {
    const { writes } = await runSync();
    const rows = getWrite(writes, "repos", "upsert") as { github_repo_id: number }[];

    expect(rows.map((r) => r.github_repo_id)).toEqual([PUBLIC_REPO.id]);
    expect(JSON.stringify(writes)).not.toContain(PRIVATE_REPO.name);
  });

  it("updates only the allowlisted profile columns (plus the generated summary)", async () => {
    const { writes } = await runSync();
    const update = getWrite(writes, "profiles", "update") as Record<string, unknown>;

    expect(Object.keys(update).sort()).toEqual(
      [...ALLOWED_PROFILE_COLUMNS, "summary", "summary_pt"].sort()
    );
    // Spot-check that values are field-by-field picks, not payload spreads.
    expect(update.bio).toBe(GITHUB_USER.bio);
    expect(update.total_commits).toBe(126); // 3 mocked years × 42 commits
  });

  it("does not overwrite a manually edited summary", async () => {
    const { writes } = await runSync({ top_stack: [], summary_manual: true });
    const update = getWrite(writes, "profiles", "update") as Record<string, unknown>;

    expect(Object.keys(update).sort()).toEqual(ALLOWED_PROFILE_COLUMNS);
  });

  it("keeps the github access token out of every database write", async () => {
    const { writes } = await runSync();

    for (const write of writes) {
      expect(JSON.stringify(write.payload)).not.toContain(GITHUB_TOKEN);
    }
  });

  it("never carries private account or raw payload fields into a write", async () => {
    const { writes } = await runSync();
    const serialized = JSON.stringify(writes);

    for (const marker of LEAK_MARKERS) {
      expect(serialized).not.toContain(marker);
    }
  });
});
