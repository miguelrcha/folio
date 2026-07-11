import { ImageResponse } from "next/og";
import { getPublicProfile } from "@/app/[username]/profile-data";

export const size = { width: 1200, height: 630 };

// Brand palette from app/globals.css — satori can't read CSS variables, so
// the values are mirrored here (same values as app/[username]/opengraph-image.tsx).
const INK = "#000000";
const SURFACE = "#0a0a0a";
const BORDER = "#262626";
const TEXT = "#ededed";
const TEXT_MUTED = "#8c8c8c";

// satori fails the whole render if a remote <img> can't be fetched, so every
// image (avatar, logo) is resolved to a data URL first and dropped gracefully
// on failure — shared with opengraph-image.tsx's fetchAvatarDataUrl.
async function fetchImageDataUrl(url: string): Promise<string | null> {
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

// User-triggered "share this profile" card — distinct from
// app/[username]/opengraph-image.tsx, which is the automatic social-unfurl
// meta image. This one is previewed/downloaded from ShareCardModal so a
// visitor or the owner can post it to Instagram/X/LinkedIn.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    return new Response("Not found", { status: 404 });
  }

  const [avatar, logo] = await Promise.all([
    profile.avatar_url ? fetchImageDataUrl(profile.avatar_url) : Promise.resolve(null),
    fetchImageDataUrl(new URL("/logo.png", request.url).toString()),
  ]);

  const githubSinceYear = profile.github_created_at
    ? new Date(profile.github_created_at).getFullYear()
    : "—";

  const stats = [
    { label: "followers", value: profile.followers ?? 0 },
    { label: "public repositories", value: profile.public_repos ?? 0 },
    { label: "total commits", value: profile.total_commits ?? 0 },
    { label: "on github since", value: githubSinceYear },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: INK,
          padding: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              width={120}
              height={120}
              style={{ borderRadius: 20, border: `1px solid ${BORDER}`, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 20,
                backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`,
              }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              {profile.full_name && (
                <div style={{ fontSize: 46, color: TEXT }}>{profile.full_name}</div>
              )}
              <div
                style={{
                  fontSize: profile.full_name ? 28 : 46,
                  color: profile.full_name ? TEXT_MUTED : TEXT,
                }}
              >
                {`@${profile.github_username}`}
              </div>
            </div>
            {(profile.location || profile.contact_email) && (
              <div style={{ display: "flex", gap: 18, fontSize: 22, color: TEXT_MUTED }}>
                {profile.location && <div style={{ display: "flex" }}>{profile.location}</div>}
                {profile.contact_email && (
                  <div style={{ display: "flex" }}>{profile.contact_email}</div>
                )}
              </div>
            )}
            {profile.bio && (
              <div style={{ display: "flex", fontSize: 24, color: TEXT, marginTop: 4 }}>
                {profile.bio}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div
            style={{
              display: "flex",
              gap: 1,
              backgroundColor: BORDER,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: SURFACE,
                  padding: "20px 24px",
                }}
              >
                <div style={{ fontSize: 32, color: TEXT }}>{String(stat.value)}</div>
                <div style={{ fontSize: 16, color: TEXT_MUTED, marginTop: 6 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 26, color: TEXT }}>{`meufolio.dev/${profile.github_username}`}</div>
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" width={40} height={40} style={{ borderRadius: 8 }} />
            )}
          </div>
        </div>
      </div>
    ),
    size
  );
}
