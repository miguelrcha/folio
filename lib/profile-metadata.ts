import { localizedSummary, type PublicProfile } from "@/lib/profile";
import { translate, type Language } from "@/lib/i18n/translations";

// Social previews truncate around here; clamping ourselves keeps the cut
// intentional (whole-ish text + ellipsis) instead of mid-word by the platform.
const MAX_DESCRIPTION_LENGTH = 200;

type ProfileNameFields = Pick<PublicProfile, "full_name" | "github_username">;
type ProfileDescriptionFields = ProfileNameFields &
  Pick<PublicProfile, "bio" | "summary" | "summary_pt">;

export function profileDisplayName(profile: ProfileNameFields): string {
  return profile.full_name?.trim() || `@${profile.github_username}`;
}

// Meta description for a public profile: the person's own bio wins, the
// generated summary is the fallback, and a generic line covers profiles
// that have neither. Always single-line and length-clamped.
export function buildProfileMetaDescription(
  profile: ProfileDescriptionFields,
  lang: Language = "en"
): string {
  const source = profile.bio?.trim() || localizedSummary(profile, lang)?.trim();
  if (!source) {
    return translate(lang, "meta.profileFallbackDescription", {
      name: profileDisplayName(profile),
    });
  }

  const singleLine = source.replace(/\s+/g, " ");
  if (singleLine.length <= MAX_DESCRIPTION_LENGTH) return singleLine;
  return `${singleLine.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}
