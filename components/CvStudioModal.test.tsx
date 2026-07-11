import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CvStudioModal } from "@/components/CvStudioModal";
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
  languages_json: [],
  total_commits: 0,
  cv_config: null,
};

const repos: Repo[] = [];

function renderModal(onClose = vi.fn()) {
  render(
    <LanguageProvider initialLang="en">
      <CvStudioModal profile={profile} repos={repos} onClose={onClose} />
    </LanguageProvider>
  );
  return { onClose };
}

describe("CvStudioModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue({ error: null });
  });

  // The modal always renders two instances of the selected template at once
  // (an on-screen "preview" one and a print-only "print" one, kept in sync
  // via the same live config — see CvStudioModal's portal comment) — content
  // shared by both shows up twice in the DOM, hence getAllByText below.

  it("renders the editor with a live preview of the current config", () => {
    renderModal();
    expect(screen.getByText("Customize CV")).toBeInTheDocument();
    expect(screen.getAllByText("Ada Lovelace")).toHaveLength(2);
    expect(screen.getAllByText("Overview")).toHaveLength(3); // sidebar checkbox label + preview + print heading
  });

  it("hides a section from the preview as soon as it's unchecked", () => {
    renderModal();
    const overviewToggle = screen.getByRole("checkbox", { name: "Overview" });
    expect(screen.getAllByText(profile.summary!)).toHaveLength(2);

    fireEvent.click(overviewToggle);

    expect(screen.queryByText(profile.summary!)).not.toBeInTheDocument();
  });

  it("hides the bio as soon as 'Hide bio' is checked", () => {
    renderModal();
    expect(screen.getAllByText(profile.bio!)).toHaveLength(2);

    fireEvent.click(screen.getByRole("checkbox", { name: "Hide bio" }));

    expect(screen.queryByText(profile.bio!)).not.toBeInTheDocument();
  });

  it("switches the preview font when a Font option is clicked", () => {
    renderModal();
    // Portaled content attaches to document.body, outside RTL's own render
    // container — query the document directly. Preview and print variants
    // share the same live config, so either match reflects the same font.
    const templateRoot = document.querySelector('[style*="font-family"]') as HTMLElement;
    expect(templateRoot.style.fontFamily).toContain("var(--font-sans)");

    fireEvent.click(screen.getByRole("button", { name: "Serif" }));

    expect(templateRoot.style.fontFamily).toContain("Georgia");
  });

  it("saves the current config and refreshes on Save", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("checkbox", { name: "Hide bio" }));
    fireEvent.click(screen.getByText("Save"));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ cv_config: expect.objectContaining({ hideBio: true }) })
    );
  });

  it("calls onClose without saving when Cancel is clicked", () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
