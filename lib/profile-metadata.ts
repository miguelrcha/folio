import type { PublicProfile } from "@/lib/profile";

// Social previews truncate around here; clamping ourselves keeps the cut
// intentional (whole-ish text + ellipsis) instead of mid-word by the platform.
const MAX_DESCRIPTION_LENGTH = 200;

type ProfileNameFields = Pick<PublicProfile, "full_name" | "github_username">;
type ProfileDescriptionFields = ProfileNameFields & Pick<PublicProfile, "bio" | "summary">;

export function profileDisplayName(profile: ProfileNameFields): string {
  return profile.full_name?.trim() || `@${profile.github_username}`;
}

// Meta description for a public profile: the person's own bio wins, the
// generated summary is the fallback, and a generic line covers profiles
// that have neither. Always single-line and length-clamped.
export function buildProfileMetaDescription(profile: ProfileDescriptionFields): string {
  const source = profile.bio?.trim() || profile.summary?.trim();
  if (!source) {
    return `See ${profileDisplayName(profile)}'s projects, tech stack and resume on Folio.`;
  }

  const singleLine = source.replace(/\s+/g, " ");
  if (singleLine.length <= MAX_DESCRIPTION_LENGTH) return singleLine;
  return `${singleLine.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}
