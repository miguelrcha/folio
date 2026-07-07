import type { ExperienceEntry } from "@/lib/experience";

export type PublicProfile = {
  id: string;
  github_username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  summary: string | null;
  public_repos: number | null;
  followers: number | null;
  top_stack: { name: string; percentage: number; manual?: boolean }[] | null;
  github_created_at: string | null;
  experiences: string | null;
  experiences_json: ExperienceEntry[] | null;
  certifications: string | null;
  languages: string | null;
};

export type Repo = {
  id: string;
  name: string;
  description: string | null;
  stack: string[] | null;
  stars: number;
  forks: number;
  impact_score: number;
};
