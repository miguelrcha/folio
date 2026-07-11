import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider } from "@/components/LanguageProvider";
import { SearchUsers } from "@/components/ProfileHeader";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

const maybeSingle = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        ilike: () => ({
          maybeSingle,
          // Debounced dropdown query — irrelevant to these tests.
          limit: async () => ({ data: [] }),
        }),
      }),
    }),
  }),
}));

function renderSearch() {
  render(
    <LanguageProvider initialLang="en">
      <SearchUsers />
    </LanguageProvider>
  );
  const input = screen.getByPlaceholderText("Search Github username");
  return { input, form: input.closest("form")! };
}

describe("SearchUsers submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a not-found hint instead of navigating to a missing profile", async () => {
    maybeSingle.mockResolvedValue({ data: null });
    const { input, form } = renderSearch();

    fireEvent.change(input, { target: { value: "ghostuser" } });
    fireEvent.submit(form);

    expect(await screen.findByText("This username isn't on Folio yet.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates using the canonical username when the profile exists", async () => {
    maybeSingle.mockResolvedValue({ data: { github_username: "octocat" } });
    const { input, form } = renderSearch();

    fireEvent.change(input, { target: { value: "OCTOCAT" } });
    fireEvent.submit(form);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/octocat"));
  });

  it("clears the not-found hint as soon as the query changes", async () => {
    maybeSingle.mockResolvedValue({ data: null });
    const { input, form } = renderSearch();

    fireEvent.change(input, { target: { value: "ghostuser" } });
    fireEvent.submit(form);
    await screen.findByText("This username isn't on Folio yet.");

    fireEvent.change(input, { target: { value: "ghostuse" } });
    expect(screen.queryByText("This username isn't on Folio yet.")).not.toBeInTheDocument();
  });
});
