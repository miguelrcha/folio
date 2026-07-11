// Maps the status of a failed /api/sync-github response to what the UI
// should do about it. Kept apart from lib/github-sync.ts on purpose: that
// module pulls in server-only imports (node:crypto via lib/crypto), so
// client components import the mapping from here instead.
export type SyncFailureKind = "auth" | "rateLimit" | "transient";

export function syncFailureKind(status: number): SyncFailureKind {
  // 401: no session or a legacy plaintext token — only case a re-login fixes.
  // 400: no stored token at all, which likewise needs a fresh sign-in.
  if (status === 400 || status === 401) return "auth";
  // 429: GitHub rate limit — waiting and retrying is enough.
  if (status === 429) return "rateLimit";
  // Anything else (502 GitHub down, 500) is transient: offer a plain retry.
  return "transient";
}
