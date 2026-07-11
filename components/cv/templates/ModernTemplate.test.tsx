import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModernTemplate } from "@/components/cv/templates/ModernTemplate";
import { DEFAULT_CV_CONFIG } from "@/lib/cv/config";
import type { PublicProfile, Repo } from "@/lib/profile";

const minimalProfile: PublicProfile = {
  id: "user-1",
  github_username: "octocat",
  full_name: null,
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
};

const fullProfile: PublicProfile = {
  ...minimalProfile,
  full_name: "Ada Lovelace",
  avatar_url: "https://example.com/avatar.png",
  bio: "Builds things.",
  location: "London",
  contact_email: "ada@example.com",
  summary: "Engineer with a knack for the analytical engine.",
  top_stack: [{ name: "TypeScript", percentage: 80 }],
  experiences_json: [
    {
      title: "Engineer",
      company: "Analytical Engines Ltd",
      startMonth: 1,
      startYear: 2020,
      endMonth: null,
      endYear: null,
      current: true,
      bullets: ["Wrote the first algorithm"],
    },
  ],
  certifications_json: [
    {
      name: "Certified Engine Operator",
      issuer: "Royal Society",
      issueMonth: 1,
      issueYear: 2021,
      hasExpiration: false,
      expirationMonth: null,
      expirationYear: null,
    },
  ],
  languages_json: [{ language: "english", proficiency: "Native" }],
};

const repos: Repo[] = [
  {
    id: "repo-1",
    name: "difference-engine",
    description: "A mechanical calculator",
    summary: "Computes polynomial functions.",
    stack: ["C++"],
    stars: 10,
    forks: 2,
    impact_score: 5,
  },
];

describe("ModernTemplate", () => {
  it("renders without crashing for a profile with no optional fields and no repos", () => {
    render(<ModernTemplate profile={minimalProfile} repos={[]} config={DEFAULT_CV_CONFIG} />);
    expect(screen.getByText("@octocat")).toBeInTheDocument();
  });

  it("renders sidebar and main sections when populated and visible", () => {
    const { container } = render(
      <ModernTemplate profile={fullProfile} repos={repos} config={DEFAULT_CV_CONFIG} />
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Stacks")).toBeInTheDocument();
    expect(screen.getByText("Languages")).toBeInTheDocument();
    expect(container.textContent).toContain("difference-engine");
  });

  it("hides a sidebar section when its config entry is not visible", () => {
    const config = {
      ...DEFAULT_CV_CONFIG,
      sections: DEFAULT_CV_CONFIG.sections.map((s) =>
        s.key === "stacks" ? { ...s, visible: false } : s
      ),
    };
    render(<ModernTemplate profile={fullProfile} repos={repos} config={config} />);
    expect(screen.queryByText("Stacks")).not.toBeInTheDocument();
  });

  it("only shows the photo when config.showPhoto is true", () => {
    const { rerender } = render(
      <ModernTemplate profile={fullProfile} repos={repos} config={DEFAULT_CV_CONFIG} />
    );
    expect(screen.queryByAltText("octocat")).not.toBeInTheDocument();

    rerender(
      <ModernTemplate
        profile={fullProfile}
        repos={repos}
        config={{ ...DEFAULT_CV_CONFIG, showPhoto: true }}
      />
    );
    expect(screen.getByAltText("octocat")).toBeInTheDocument();
  });

  it("hides the bio when config.hideBio is true", () => {
    const { rerender } = render(
      <ModernTemplate profile={fullProfile} repos={repos} config={DEFAULT_CV_CONFIG} />
    );
    expect(screen.getByText(fullProfile.bio!)).toBeInTheDocument();

    rerender(
      <ModernTemplate
        profile={fullProfile}
        repos={repos}
        config={{ ...DEFAULT_CV_CONFIG, hideBio: true }}
      />
    );
    expect(screen.queryByText(fullProfile.bio!)).not.toBeInTheDocument();
  });

  it("only applies the print-only hidden class for variant=\"print\"", () => {
    const { container, rerender } = render(
      <ModernTemplate profile={minimalProfile} repos={[]} config={DEFAULT_CV_CONFIG} />
    );
    expect(container.firstElementChild?.className).toContain("hidden");

    rerender(
      <ModernTemplate
        profile={minimalProfile}
        repos={[]}
        config={DEFAULT_CV_CONFIG}
        variant="preview"
      />
    );
    expect(container.firstElementChild?.className).not.toContain("hidden");
  });
});
