// Server-side avatar fetching for the satori image routes (share card and
// opengraph-image). The avatar URL comes from the database and the client
// write path can set arbitrary profile columns, so fetching it blindly from
// a serverless function is an SSRF vector (cloud metadata, internal hosts).
// The sync only ever stores GitHub CDN avatar URLs, so anything else is
// rejected before any request is made.

const ALLOWED_AVATAR_HOSTS = new Set(["avatars.githubusercontent.com"]);

export function isAllowedAvatarUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && ALLOWED_AVATAR_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

// satori fails the whole render if a remote <img> can't be fetched, so the
// avatar is resolved to a data URL first and dropped gracefully (null) on
// rejection or failure.
export async function fetchAvatarDataUrl(url: string | null): Promise<string | null> {
  if (!url || !isAllowedAvatarUrl(url)) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get("content-type") ?? "image/png";
    return `data:${type};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
