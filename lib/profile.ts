import type { ExperienceEntry } from "@/lib/experience";
import type { CertificationEntry } from "@/lib/certification";
import type { Language } from "@/lib/i18n/translations";
import type { LanguageEntry } from "@/lib/language";

export type PublicProfile = {
  id: string;
  github_username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  contact_email: string | null;
  summary: string | null;
  /** Generated PT-BR variant of `summary`; null when the overview was manually edited. */
  summary_pt: string | null;
  public_repos: number | null;
  followers: number | null;
  top_stack: { name: string; percentage: number; manual?: boolean }[] | null;
  github_created_at: string | null;
  experiences_json: ExperienceEntry[] | null;
  certifications_json: CertificationEntry[] | null;
  languages_json: LanguageEntry[] | null;
  total_commits: number | null;
  /** Opaque on purpose — always narrow through resolveCvConfig() before use. */
  cv_config: unknown;
};

// The generated summary is stored once per language (summary / summary_pt).
// A manually edited overview lives in `summary` alone and is shown verbatim
// in every locale (summary_pt is cleared on manual save).
export function localizedSummary(
  profile: Pick<PublicProfile, "summary" | "summary_pt">,
  lang: Language
): string | null {
  if (lang === "pt" && profile.summary_pt?.trim()) return profile.summary_pt;
  return profile.summary;
}

export type Repo = {
  id: string;
  name: string;
  description: string | null;
  summary: string | null;
  stack: string[] | null;
  stars: number;
  forks: number;
  impact_score: number;
};
