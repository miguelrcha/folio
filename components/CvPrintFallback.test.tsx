import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CvExportCoordinator, useCvExport } from "@/components/CvExportCoordinator";
import { CvPrintFallback } from "@/components/CvPrintFallback";
import { DEFAULT_CV_CONFIG } from "@/lib/cv/config";
import type { PublicProfile, Repo } from "@/lib/profile";

const profile: PublicProfile = {
  id: "user-1",
  github_username: "octocat",
  full_name: "Ada Lovelace",
  avatar_url: null,
  bio: null,
  location: null,
  contact_email: null,
  summary: null,
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

// A stand-in for DownloadCvButton, which is the real consumer of setStudioOpen.
function OpenStudioButton() {
  const { setStudioOpen } = useCvExport();
  return <button onClick={() => setStudioOpen(true)}>open studio</button>;
}

describe("CvPrintFallback", () => {
  it("renders the print target by default, and steps aside once the studio opens", () => {
    render(
      <CvExportCoordinator>
        <OpenStudioButton />
        <CvPrintFallback profile={profile} repos={repos} config={DEFAULT_CV_CONFIG} />
      </CvExportCoordinator>
    );

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();

    fireEvent.click(screen.getByText("open studio"));

    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
  });
});
