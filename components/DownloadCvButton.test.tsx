import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/components/LanguageProvider";
import { DownloadCvButton } from "@/components/DownloadCvButton";
import type { PublicProfile, Repo } from "@/lib/profile";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
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

function renderButton(isOwner: boolean) {
  render(
    <LanguageProvider initialLang="en">
      <DownloadCvButton profile={profile} repos={repos} isOwner={isOwner} />
    </LanguageProvider>
  );
}

describe("DownloadCvButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends an owner straight to the CV Studio route instead of opening a preview", () => {
    renderButton(true);
    fireEvent.click(screen.getByText("View CV"));

    expect(push).toHaveBeenCalledWith("/octocat/cv-studio");
    expect(screen.queryByText("Download CV")).not.toBeInTheDocument();
  });

  it("opens a docked preview panel for a visitor, with a Download CV action inside", () => {
    const printSpy = vi.fn();
    vi.stubGlobal("print", printSpy);

    renderButton(false);
    fireEvent.click(screen.getByText("View CV"));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Download CV"));
    expect(printSpy).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });

  it("toggles the panel closed when View CV is clicked again", () => {
    renderButton(false);
    const viewCv = screen.getByText("View CV");

    fireEvent.click(viewCv);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();

    fireEvent.click(viewCv);
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
  });
});
