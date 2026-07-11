import { ImageResponse } from "next/og";
import { getPublicProfile } from "./profile-data";
import { profileDisplayName } from "@/lib/profile-metadata";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Folio profile card";

// Brand palette from app/globals.css — satori can't read CSS variables, so
// the values are mirrored here.
const INK = "#000000";
const SURFACE = "#141414";
const BORDER = "#262626";
const TEXT = "#ededed";
const TEXT_MUTED = "#8c8c8c";
const GRAPH_GREENS = ["#1a1a1a", "#2d4a2f", "#3d6640", "#4a7d4f"];

// satori fails the whole render if a remote <img> can't be fetched, so the
// avatar is resolved to a data URL first and dropped gracefully on failure.
async function fetchAvatarDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
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

// Decorative contribution-graph strip. Deterministic per cell (no
// randomness), so the same profile always renders the same card.
function ContributionStrip() {
  const weeks = 52;
  const days = 7;
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: weeks }, (_, w) => (
        <div key={w} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: days }, (_, d) => (
            <div
              key={d}
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                backgroundColor: GRAPH_GREENS[(w * 3 + d * 5) % GRAPH_GREENS.length],
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: INK,
            color: TEXT,
          }}
        >
          <div style={{ fontSize: 96, fontWeight: 600 }}>folio</div>
          <div style={{ fontSize: 32, color: TEXT_MUTED, marginTop: 16 }}>
            Turn your GitHub into a professional resume
          </div>
        </div>
      ),
      size
    );
  }

  const displayName = profileDisplayName(profile);
  const avatar = await fetchAvatarDataUrl(profile.avatar_url);
  const stack = (profile.top_stack ?? []).slice(0, 4).map((s) => s.name);

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
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              width={160}
              height={160}
              style={{ borderRadius: 9999, border: `2px solid ${BORDER}` }}
            />
          ) : (
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 9999,
                backgroundColor: SURFACE,
                border: `2px solid ${BORDER}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 72,
                color: TEXT_MUTED,
              }}
            >
              {profile.github_username.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 60, fontWeight: 600, color: TEXT }}>{displayName}</div>
            <div style={{ fontSize: 32, color: TEXT_MUTED, marginTop: 8 }}>
              {`@${profile.github_username}`}
            </div>
            {stack.length > 0 && (
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                {stack.map((name) => (
                  <div
                    key={name}
                    style={{
                      display: "flex",
                      padding: "8px 20px",
                      borderRadius: 9999,
                      border: `1px solid ${BORDER}`,
                      backgroundColor: SURFACE,
                      color: TEXT,
                      fontSize: 26,
                    }}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <ContributionStrip />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 600, color: TEXT }}>folio</div>
            <div style={{ fontSize: 28, color: TEXT_MUTED }}>
              {`meufolio.dev/${profile.github_username}`}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
