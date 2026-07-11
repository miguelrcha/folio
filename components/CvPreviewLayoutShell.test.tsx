import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CvPreviewCoordinator, useCvPreview } from "@/components/CvPreviewCoordinator";
import { CvPreviewLayoutShell } from "@/components/CvPreviewLayoutShell";

// Stand-in for DownloadCvButton, which is the real consumer of setPanelOpen.
function ToggleButton() {
  const { setPanelOpen, panelOpen } = useCvPreview();
  return <button onClick={() => setPanelOpen(!panelOpen)}>toggle</button>;
}

describe("CvPreviewLayoutShell", () => {
  it("reflows to make room for the panel once it's open", () => {
    render(
      <CvPreviewCoordinator>
        <ToggleButton />
        <CvPreviewLayoutShell>
          <div data-testid="content">content</div>
        </CvPreviewLayoutShell>
      </CvPreviewCoordinator>
    );

    const shell = screen.getByTestId("content").parentElement!;
    expect(shell.className).not.toContain("sm:pr-[640px]");

    fireEvent.click(screen.getByText("toggle"));

    expect(shell.className).toContain("sm:pr-[640px]");
  });
});
