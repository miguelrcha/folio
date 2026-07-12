import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ShareCardButton } from "@/components/ShareCardButton";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const CAPTION =
  "Check out my profile on Folio — a platform that turns your GitHub activity into an auto-generated resume. https://meufolio.dev/octocat";

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

  afterEach(() => {
    // navigator.share/canShare are assigned directly onto the shared jsdom
    // navigator by the native-share test below — remove them so later tests
    // (which assert the native Share button is absent by default) aren't
    // affected by state left over from an earlier test in this file.
    delete (navigator as { share?: unknown }).share;
    delete (navigator as { canShare?: unknown }).canShare;
    vi.unstubAllGlobals();
  });

  it("opens the share card modal with the generated image and an English caption", () => {
    renderButton();
    expect(screen.queryByText("Share your profile")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Share as image" }));

    expect(screen.getByText("Share your profile")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", "/api/share-card/octocat");
    expect(screen.getByText(CAPTION)).toBeInTheDocument();
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

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(CAPTION);
    expect(await screen.findByText("Copied ✓")).toBeInTheDocument();
  });

  it("has no native Share button when the browser doesn't implement the Web Share API", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: "Share as image" }));

    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
  });

  it("hands the image file and caption to the OS share sheet when the Web Share API is available", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const canShareMock = vi.fn().mockReturnValue(true);
    Object.assign(navigator, { share: shareMock, canShare: canShareMock });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob(["fake"], { type: "image/png" })) })
    );

    renderButton();
    fireEvent.click(screen.getByRole("button", { name: "Share as image" }));
    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() => expect(shareMock).toHaveBeenCalledTimes(1));
    const shareData = shareMock.mock.calls[0][0];
    expect(shareData.files[0].name).toBe("octocat-folio.png");
    expect(shareData.text).toBe(CAPTION);
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
