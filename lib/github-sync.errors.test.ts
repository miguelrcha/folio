import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syncGithubProfile, SyncError } from "@/lib/github-sync";

// Regression guard for the sync's failure modes: a GitHub error response
// must surface as a typed SyncError (rate limits with their own status, so
// the UI can offer a plain retry) — never as a TypeError from parsing an
// error body, and never after having written anything to the database.

type FetchStub = {
  ok: boolean;
  status: number;
  headers: { get: (name: string) => string | null };
  json: () => Promise<unknown>;
};

function response(status: number, body: unknown, headers: Record<string, string> = {}): FetchStub {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => normalized[name.toLowerCase()] ?? null },
    json: async () => body,
  };
}

const GITHUB_USER = {
  login: "octocat",
  bio: null,
  name: null,
  avatar_url: null,
  location: null,
  public_repos: 0,
  followers: 0,
  created_at: "2024-01-15T00:00:00Z",
};

// Failing responses carry the real error body GitHub sends — the old code
// would happily .filter() over this object and crash with a TypeError.
const RATE_LIMIT_BODY = {
  message: "API rate limit exceeded for user ID 583231.",
  documentation_url: "https://docs.github.com/rest/overview/rate-limits",
};

// Chainable Supabase stand-in that records every write attempt; reads
// resolve to an empty-but-valid profile row.
function createSupabaseMock() {
  const writes: string[] = [];

  const from = (table: string) => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      not: () => builder,
      single: () => builder,
      delete: () => {
        writes.push(`delete:${table}`);
        return builder;
      },
      update: () => {
        writes.push(`update:${table}`);
        return builder;
      },
      upsert: () => {
        writes.push(`upsert:${table}`);
        return builder;
      },
      then: <T>(
        onFulfilled?: ((value: { data: unknown; error: null }) => T | PromiseLike<T>) | null,
        onRejected?: ((reason: unknown) => T | PromiseLike<T>) | null
      ) =>
        Promise.resolve({ data: { top_stack: [], summary_manual: false }, error: null }).then(
          onFulfilled,
          onRejected
        ),
    };
    return builder;
  };

  return { supabase: { from } as unknown as SupabaseClient, writes };
}

function stubFetch(routes: Record<string, FetchStub>) {
  vi.stubGlobal("fetch", async (input: unknown) => {
    const url = String(input);
    for (const [prefix, stub] of Object.entries(routes)) {
      if (url.startsWith(prefix)) return stub;
    }
    throw new Error(`unexpected fetch in test: ${url}`);
  });
}

async function expectSyncError(run: Promise<unknown>): Promise<SyncError> {
  try {
    await run;
  } catch (err) {
    expect(err).toBeInstanceOf(SyncError);
    return err as SyncError;
  }
  throw new Error("expected syncGithubProfile to throw");
}

describe("syncGithubProfile error handling", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps a rate-limited repos fetch (403 + exhausted quota header) to a 429 SyncError", async () => {
    const { supabase, writes } = createSupabaseMock();
    stubFetch({
      "https://api.github.com/user/repos": response(403, RATE_LIMIT_BODY, {
        "x-ratelimit-remaining": "0",
      }),
      "https://api.github.com/user": response(200, GITHUB_USER),
    });

    const err = await expectSyncError(syncGithubProfile(supabase, "user-1", "token"));
    expect(err.status).toBe(429);
    expect(err.message).toMatch(/rate limit/i);
    expect(writes).toEqual([]);
  });

  it("passes a native 429 from github straight through as a rate limit", async () => {
    const { supabase } = createSupabaseMock();
    stubFetch({
      "https://api.github.com/user/repos": response(429, RATE_LIMIT_BODY),
      "https://api.github.com/user": response(200, GITHUB_USER),
    });

    const err = await expectSyncError(syncGithubProfile(supabase, "user-1", "token"));
    expect(err.status).toBe(429);
  });

  it("maps any other repos failure to a 502 without touching the database", async () => {
    const { supabase, writes } = createSupabaseMock();
    stubFetch({
      "https://api.github.com/user/repos": response(500, { message: "Server Error" }),
      "https://api.github.com/user": response(200, GITHUB_USER),
    });

    const err = await expectSyncError(syncGithubProfile(supabase, "user-1", "token"));
    expect(err.status).toBe(502);
    expect(err.message).toBe("github repos fetch failed");
    expect(writes).toEqual([]);
  });

  it("detects the rate limit on the user fetch too, where it hits first", async () => {
    const { supabase, writes } = createSupabaseMock();
    stubFetch({
      "https://api.github.com/user": response(403, RATE_LIMIT_BODY, {
        "x-ratelimit-remaining": "0",
      }),
    });

    const err = await expectSyncError(syncGithubProfile(supabase, "user-1", "token"));
    expect(err.status).toBe(429);
    expect(writes).toEqual([]);
  });

  it("keeps an ordinary 403 (no exhausted quota) as a 502, not a rate limit", async () => {
    const { supabase } = createSupabaseMock();
    stubFetch({
      "https://api.github.com/user": response(403, { message: "Forbidden" }, {
        "x-ratelimit-remaining": "4999",
      }),
    });

    const err = await expectSyncError(syncGithubProfile(supabase, "user-1", "token"));
    expect(err.status).toBe(502);
    expect(err.message).toBe("github user fetch failed");
  });
});
