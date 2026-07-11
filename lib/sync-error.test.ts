import { describe, expect, it } from "vitest";
import { syncFailureKind } from "@/lib/sync-error";

describe("syncFailureKind", () => {
  it("treats missing-session and legacy-token statuses as auth failures", () => {
    expect(syncFailureKind(401)).toBe("auth");
    expect(syncFailureKind(400)).toBe("auth");
  });

  it("treats a github rate limit as its own retry-later kind", () => {
    expect(syncFailureKind(429)).toBe("rateLimit");
  });

  it("treats everything else as transient and retryable", () => {
    expect(syncFailureKind(500)).toBe("transient");
    expect(syncFailureKind(502)).toBe("transient");
    expect(syncFailureKind(503)).toBe("transient");
  });
});
