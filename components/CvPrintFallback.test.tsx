import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CvPrintFallback } from "@/components/CvPrintFallback";
import { LanguageProvider } from "@/components/LanguageProvider";
import { DEFAULT_CV_CONFIG } from "@/lib/cv/config";
import type { PublicProfile, Repo } from "@/lib/profile";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const profile: PublicProfile = {
  id: "user-1",
  github_username: "octocat",
  full_name: "Ada Lovelace",
  avatar_url: null,
  bio: null,
  location: null,
  contact_email: null,
  summary: null,
  summary_pt: null,
  public_repos: 0,
  followers: 0,
  top_stack: null,
  github_created_at: null,
  experiences_json: null,
  certifications_json: null,
  languages_json: null,
  total_commits: 0,
  cv_config: null,
};

const repos: Repo[] = [];

describe("CvPrintFallback", () => {
  it("renders the print target reflecting the saved config", () => {
    render(
      <LanguageProvider initialLang="en">
        <CvPrintFallback profile={profile} repos={repos} config={DEFAULT_CV_CONFIG} />
      </LanguageProvider>
    );

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });
});
