import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CvStudioScreen } from "@/components/CvStudioScreen";
import type { PublicProfile, Repo } from "@/lib/profile";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh }),
}));

const update = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      update: (payload: unknown) => ({
        eq: async () => update(payload),
      }),
    }),
    auth: {
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }),
}));

const profile: PublicProfile = {
  id: "user-1",
  github_username: "octocat",
  full_name: "Ada Lovelace",
  avatar_url: "https://example.com/avatar.png",
  bio: "Builds things that compute things.",
  location: "London",
  contact_email: "ada@example.com",
  summary: "Engineer with a knack for the analytical engine.",
  public_repos: 1,
  followers: 0,
  top_stack: [{ name: "TypeScript", percentage: 80 }],
  github_created_at: null,
  experiences_json: [],
  certifications_json: [],
  languages_json: [{ language: "portuguese", proficiency: "Native" }],
  total_commits: 0,
  cv_config: null,
};

const repos: Repo[] = [];

function renderScreen() {
  render(
    <LanguageProvider initialLang="en">
      <CvStudioScreen profile={profile} repos={repos} />
    </LanguageProvider>
  );
}

describe("CvStudioScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue({ error: null });
  });

  // The screen always renders two instances of the selected template at once
  // (an on-screen "preview" one and a print-only "print" one, kept in sync
  // via the same live config) — content shared by both shows up twice in the
  // DOM, hence getAllByText below.

  it("renders the editor with a live preview of the current config", () => {
    renderScreen();
    expect(screen.getByText("Customize CV")).toBeInTheDocument();
    expect(screen.getAllByText("Ada Lovelace")).toHaveLength(2);
    expect(screen.getAllByText("Overview")).toHaveLength(3); // sidebar checkbox label + preview + print heading
  });

  it("hides a section from the preview as soon as it's unchecked", () => {
    renderScreen();
    const overviewToggle = screen.getByRole("checkbox", { name: "Overview" });
    expect(screen.getAllByText(profile.summary!)).toHaveLength(2);

    fireEvent.click(overviewToggle);

    expect(screen.queryByText(profile.summary!)).not.toBeInTheDocument();
  });

  it("hides the bio as soon as 'Hide bio' is checked", () => {
    renderScreen();
    expect(screen.getAllByText(profile.bio!)).toHaveLength(2);

    fireEvent.click(screen.getByRole("checkbox", { name: "Hide bio" }));

    expect(screen.queryByText(profile.bio!)).not.toBeInTheDocument();
  });

  it("switches the preview font when a Font option is clicked", () => {
    renderScreen();
    const templateRoot = document.querySelector('[style*="font-family"]') as HTMLElement;
    expect(templateRoot.style.fontFamily).toContain("var(--font-sans)");

    fireEvent.click(screen.getByRole("button", { name: "Serif" }));

    expect(templateRoot.style.fontFamily).toContain("Georgia");
  });

  it("saves the current config and refreshes on Save", async () => {
    renderScreen();
    fireEvent.click(screen.getByRole("checkbox", { name: "Hide bio" }));
    fireEvent.click(screen.getByText("Save"));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ cv_config: expect.objectContaining({ hideBio: true }) })
    );
  });

  it("drops the flag emoji from the Languages section when unchecked", () => {
    renderScreen();
    expect(screen.getAllByText("🇧🇷 Portuguese - Native")).toHaveLength(2);

    fireEvent.click(screen.getByRole("checkbox", { name: "Show flag emoji" }));

    expect(screen.queryByText("🇧🇷 Portuguese - Native")).not.toBeInTheDocument();
    expect(screen.getAllByText("Portuguese - Native")).toHaveLength(2);
  });

  it("links back to the public profile", () => {
    renderScreen();
    const backLink = screen.getByText("Back to profile").closest("a");
    expect(backLink).toHaveAttribute("href", "/octocat");
  });

  it("on mobile, toggles between the CV preview and the controls panel", () => {
    renderScreen();
    // Defaults to the preview, with a floating button to open the panel.
    expect(screen.getByRole("button", { name: "Customize" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Customize" }));
    expect(screen.queryByRole("button", { name: "Customize" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View CV" }));
    expect(screen.getByRole("button", { name: "Customize" })).toBeInTheDocument();
  });
});
