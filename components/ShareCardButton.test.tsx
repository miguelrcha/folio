import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ShareCardButton } from "@/components/ShareCardButton";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

function renderButton() {
  render(
    <LanguageProvider initialLang="en">
      <ShareCardButton username="octocat" />
    </LanguageProvider>
  );
}

describe("ShareCardButton", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("opens the share card modal with the generated image and an English caption", () => {
    renderButton();
    expect(screen.queryByText("Share your profile")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Share as image" }));

    expect(screen.getByText("Share your profile")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", "/api/share-card/octocat");
    expect(
      screen.getByText("This is my profile on Folio — check it out: meufolio.dev/octocat")
    ).toBeInTheDocument();
  });

  it("offers a download link pointing at the share card image endpoint", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: "Share as image" }));

    const downloadLink = screen.getByRole("link", { name: "Download image" });
    expect(downloadLink).toHaveAttribute("href", "/api/share-card/octocat");
    expect(downloadLink).toHaveAttribute("download", "octocat-folio.png");
  });

  it("copies the caption to the clipboard", async () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: "Share as image" }));

    fireEvent.click(screen.getByRole("button", { name: "Copy caption" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "This is my profile on Folio — check it out: meufolio.dev/octocat"
    );
    expect(await screen.findByText("Copied ✓")).toBeInTheDocument();
  });

  it("closes the modal", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: "Share as image" }));
    // Both the close (X) icon and the footer button share the "Cancel"
    // accessible name (same as CvPreviewModal) — the footer one is last.
    const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);

    expect(screen.queryByText("Share your profile")).not.toBeInTheDocument();
  });
});
