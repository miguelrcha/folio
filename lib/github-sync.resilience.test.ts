import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapWithConcurrency, syncGithubProfile, syncProfileIfStale } from "@/lib/github-sync";

// Guards for the sync's resilience fixes (issue #77): repo pagination (an
// account with >100 repos must never lose repos 101+ to the stale-repo
// cleanup), bounded fan-out, and the failed-background-sync retry backoff
// (a failure must not silently block retries for the full 1h TTL).

const adminClientHolder = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => adminClientHolder.current,
}));
vi.mock("@/lib/crypto", () => ({ decrypt: () => "decrypted-token" }));

const GITHUB_USER = {
  login: "octocat",
  bio: null,
  name: null,
  avatar_url: null,
  location: null,
  public_repos: 2,
  followers: 0,
  created_at: "2026-01-15T00:00:00Z",
};

function makeRepo(id: number, name: string) {
  return {
    id,
    name,
    description: null,
    private: false,
    fork: false,
    size: 10,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: "2026-07-01T00:00:00Z",
    languages_url: `https://api.github.com/repos/octocat/${name}/languages`,
    license: null,
    default_branch: "main",
    owner: { login: "octocat" },
  };
}

function response(body: unknown, opts: { status?: number; headers?: Record<string, string> } = {}) {
  const status = opts.status ?? 200;
  const normalized = Object.fromEntries(
    Object.entries(opts.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => normalized[name.toLowerCase()] ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

type SupabaseCall = { table: string; method: string; args: unknown[] };

// Chainable Supabase stand-in recording every call; reads resolve from the
// `reads` callback so each test controls what selects return.
function createSupabaseMock(reads: (table: string, selectArgs: unknown[]) => unknown) {
  const calls: SupabaseCall[] = [];

  const from = (table: string) => {
    let selectArgs: unknown[] = [];
    let verb = "select";

    const record = (method: string, ...args: unknown[]) => {
      calls.push({ table, method, args });
    };

    const builder = {
      select: (...args: unknown[]) => {
        if (verb === "select") selectArgs = args;
        return builder;
      },
      delete: (...args: unknown[]) => {
        verb = "delete";
        record("delete", ...args);
        return builder;
      },
      update: (payload: unknown) => {
        verb = "update";
        record("update", payload);
        return builder;
      },
      upsert: (payload: unknown, options?: unknown) => {
        verb = "upsert";
        record("upsert", payload, options);
        return builder;
      },
      eq: (...args: unknown[]) => {
        record(`${verb}.eq`, ...args);
        return builder;
      },
      not: (...args: unknown[]) => {
        record(`${verb}.not`, ...args);
        return builder;
      },
      single: () => builder,
      then: <T>(
        onFulfilled?: ((value: { data: unknown; error: null }) => T | PromiseLike<T>) | null,
        onRejected?: ((reason: unknown) => T | PromiseLike<T>) | null
      ) => {
        // Updates resolve to a non-empty row set so the optimistic-lock
        // claim in syncProfileIfStale (update ... select("id")) succeeds.
        const data =
          verb === "select"
            ? reads(table, selectArgs)
            : verb === "update"
              ? [{ id: "user-1" }]
              : null;
        return Promise.resolve({ data, error: null }).then(onFulfilled, onRejected);
      },
    };

    return builder;
  };

  return { supabase: { from } as unknown as SupabaseClient, calls };
}

const REPOS_PAGE_1 =
  "https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner";
const REPOS_PAGE_2 = `${REPOS_PAGE_1}&page=2`;

function stubPaginatedGithub() {
  const fetched: string[] = [];
  vi.stubGlobal("fetch", async (input: unknown) => {
    const url = String(input);
    fetched.push(url);

    if (url === "https://api.github.com/user") return response(GITHUB_USER);
    if (url === REPOS_PAGE_1) {
      return response([makeRepo(1, "alpha")], {
        headers: { link: `<${REPOS_PAGE_2}>; rel="next"` },
      });
    }
    if (url === REPOS_PAGE_2) return response([makeRepo(2, "beta")]);
    if (url.endsWith("/languages")) return response({ TypeScript: 100 });
    if (url.includes("/git/trees/")) return response({ truncated: false, tree: [] });
    if (url.endsWith("/octocat/octocat/readme")) return response("Not Found", { status: 404 });
    if (url === "https://api.github.com/graphql") {
      return response({
        data: { viewer: { contributionsCollection: { totalCommitContributions: 0 } } },
      });
    }
    throw new Error(`unexpected fetch in test: ${url}`);
  });
  return fetched;
}

describe("syncGithubProfile pagination", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows the Link header and persists repos beyond the first page", async () => {
    const fetched = stubPaginatedGithub();
    const { supabase, calls } = createSupabaseMock((table) =>
      table === "profiles" ? { top_stack: [], summary_manual: true } : []
    );

    await syncGithubProfile(supabase, "user-1", "token");

    expect(fetched).toContain(REPOS_PAGE_2);
    const upsert = calls.find((c) => c.table === "repos" && c.method === "upsert");
    const rows = upsert?.args[0] as { github_repo_id: number }[];
    expect(rows.map((r) => r.github_repo_id).sort()).toEqual([1, 2]);
  });

  it("scopes the stale-repo delete to every fetched page, not just the first", async () => {
    stubPaginatedGithub();
    const { supabase, calls } = createSupabaseMock((table) =>
      table === "profiles" ? { top_stack: [], summary_manual: true } : []
    );

    await syncGithubProfile(supabase, "user-1", "token");

    const deleteFilter = calls.find((c) => c.table === "repos" && c.method === "delete.not");
    expect(deleteFilter?.args).toEqual(["github_repo_id", "in", "(1,2)"]);
  });
});

describe("mapWithConcurrency", () => {
  it("never runs more than the limit at once and preserves order", async () => {
    let inFlight = 0;
    let peak = 0;

    const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      inFlight--;
      return n * 10;
    });

    expect(results).toEqual([10, 20, 30, 40, 50]);
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("stops starting new work after the first failure and propagates it", async () => {
    const started: number[] = [];

    await expect(
      mapWithConcurrency([1, 2, 3, 4, 5], 1, async (n) => {
        started.push(n);
        if (n === 2) throw new Error("boom");
        return n;
      })
    ).rejects.toThrow("boom");

    expect(started).toEqual([1, 2]);
  });
});

describe("syncProfileIfStale retry backoff", () => {
  const NOW = new Date("2026-07-10T12:00:00Z");
  const STALE_UPDATED_AT = "2026-07-10T10:00:00.000Z"; // 2h old, past the 1h TTL

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function setupAdminMock(updatedAt: string) {
    const { supabase, calls } = createSupabaseMock((table, selectArgs) => {
      if (table !== "profiles") return [];
      // The stale-check select asks for the token column; the select inside
      // syncGithubProfile asks for top_stack/summary_manual.
      return String(selectArgs[0]).includes("github_access_token")
        ? { id: "user-1", github_access_token: "encrypted", updated_at: updatedAt }
        : { top_stack: [], summary_manual: true };
    });
    adminClientHolder.current = supabase;
    return calls;
  }

  it("rewinds the freshness stamp after a failed sync so a later visit retries", async () => {
    const calls = setupAdminMock(STALE_UPDATED_AT);
    vi.stubGlobal("fetch", async () => response({ message: "Server Error" }, { status: 500 }));

    await syncProfileIfStale("octocat");

    const updates = calls.filter((c) => c.table === "profiles" && c.method === "update");
    expect(updates).toHaveLength(2);

    // Claim stamp first (now), then the rewind: now - 1h TTL + 5min backoff.
    expect((updates[0].args[0] as { updated_at: string }).updated_at).toBe(NOW.toISOString());
    expect((updates[1].args[0] as { updated_at: string }).updated_at).toBe(
      new Date("2026-07-10T11:05:00.000Z").toISOString()
    );
  });

  it("does not touch the stamp when the profile is still fresh", async () => {
    const calls = setupAdminMock("2026-07-10T11:30:00.000Z"); // 30min old, within TTL
    vi.stubGlobal("fetch", async () => {
      throw new Error("no fetch expected for a fresh profile");
    });

    await syncProfileIfStale("octocat");

    expect(calls.filter((c) => c.method === "update")).toEqual([]);
  });
});
