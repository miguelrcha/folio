import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClassicTemplate } from "@/components/cv/templates/ClassicTemplate";
import { CV_SECTION_LIMITS, DEFAULT_CV_CONFIG } from "@/lib/cv/config";
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

describe("ClassicTemplate", () => {
  it("renders without crashing for a profile with no optional fields and no repos", () => {
    render(<ClassicTemplate profile={minimalProfile} repos={[]} config={DEFAULT_CV_CONFIG} />);
    expect(screen.getByText("@octocat")).toBeInTheDocument();
  });

  it("renders every section's content when populated and visible", () => {
    const { container } = render(
      <ClassicTemplate profile={fullProfile} repos={repos} config={DEFAULT_CV_CONFIG} />
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText(fullProfile.summary!)).toBeInTheDocument();
    expect(container.textContent).toContain("difference-engine");
    expect(container.textContent).toContain("A mechanical calculator");
    expect(container.textContent).toContain("meufolio.dev/octocat");
  });

  it("hides a section when its config entry is not visible", () => {
    const config = {
      ...DEFAULT_CV_CONFIG,
      sections: DEFAULT_CV_CONFIG.sections.map((s) =>
        s.key === "certifications" ? { ...s, visible: false } : s
      ),
    };
    render(<ClassicTemplate profile={fullProfile} repos={repos} config={config} />);
    expect(screen.queryByText("Certificates")).not.toBeInTheDocument();
  });

  it("only shows the photo when config.showPhoto is true", () => {
    const { rerender } = render(
      <ClassicTemplate profile={fullProfile} repos={repos} config={DEFAULT_CV_CONFIG} />
    );
    expect(screen.queryByAltText("octocat")).not.toBeInTheDocument();

    rerender(
      <ClassicTemplate
        profile={fullProfile}
        repos={repos}
        config={{ ...DEFAULT_CV_CONFIG, showPhoto: true }}
      />
    );
    expect(screen.getByAltText("octocat")).toBeInTheDocument();
  });

  it("hides the bio when config.hideBio is true", () => {
    const { rerender } = render(
      <ClassicTemplate profile={fullProfile} repos={repos} config={DEFAULT_CV_CONFIG} />
    );
    expect(screen.getByText(fullProfile.bio!)).toBeInTheDocument();

    rerender(
      <ClassicTemplate
        profile={fullProfile}
        repos={repos}
        config={{ ...DEFAULT_CV_CONFIG, hideBio: true }}
      />
    );
    expect(screen.queryByText(fullProfile.bio!)).not.toBeInTheDocument();
  });

  it("caps experiences, bullets, projects and certifications at the single-page limits", () => {
    const overstuffed: PublicProfile = {
      ...fullProfile,
      experiences_json: Array.from({ length: CV_SECTION_LIMITS.classic.experiences + 2 }, (_, i) => ({
        ...fullProfile.experiences_json![0],
        title: `Role ${i}`,
        bullets: Array.from(
          { length: CV_SECTION_LIMITS.classic.bulletsPerExperience + 2 },
          (_, bi) => `Bullet ${i}-${bi}`
        ),
      })),
      certifications_json: Array.from(
        { length: CV_SECTION_LIMITS.classic.certifications + 2 },
        (_, i) => ({ ...fullProfile.certifications_json![0], name: `Cert ${i}` })
      ),
    };
    const manyRepos: Repo[] = Array.from({ length: CV_SECTION_LIMITS.classic.projects + 2 }, (_, i) => ({
      ...repos[0],
      id: `id-${i}`,
      name: `project-${i}`,
    }));

    const { container } = render(
      <ClassicTemplate profile={overstuffed} repos={manyRepos} config={DEFAULT_CV_CONFIG} />
    );
    const text = container.textContent!;

    expect(text).toContain(`Role ${CV_SECTION_LIMITS.classic.experiences - 1}`);
    expect(text).not.toContain(`Role ${CV_SECTION_LIMITS.classic.experiences}`);
    expect(text).toContain(`Bullet 0-${CV_SECTION_LIMITS.classic.bulletsPerExperience - 1}`);
    expect(text).not.toContain(`Bullet 0-${CV_SECTION_LIMITS.classic.bulletsPerExperience}`);
    expect(text).toContain(`project-${CV_SECTION_LIMITS.classic.projects - 1}`);
    expect(text).not.toContain(`project-${CV_SECTION_LIMITS.classic.projects}`);
    expect(text).toContain(`Cert ${CV_SECTION_LIMITS.classic.certifications - 1}`);
    expect(text).not.toContain(`Cert ${CV_SECTION_LIMITS.classic.certifications}`);
  });

  it("only applies the print-only hidden class for variant=\"print\"", () => {
    const { container, rerender } = render(
      <ClassicTemplate profile={minimalProfile} repos={[]} config={DEFAULT_CV_CONFIG} />
    );
    expect(container.firstElementChild?.className).toContain("hidden");

    rerender(
      <ClassicTemplate
        profile={minimalProfile}
        repos={[]}
        config={DEFAULT_CV_CONFIG}
        variant="preview"
      />
    );
    expect(container.firstElementChild?.className).not.toContain("hidden");
  });
});
