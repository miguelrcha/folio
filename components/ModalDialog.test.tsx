import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ModalDialog } from "@/components/ModalDialog";

describe("ModalDialog", () => {
  it("renders a labelled dialog with its children", () => {
    render(
      <ModalDialog label="Edit overview" onClose={() => {}} panelClassName="panel">
        <p>body</p>
      </ModalDialog>
    );

    const dialog = screen.getByRole("dialog", { name: "Edit overview" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("moves focus to the panel on open", () => {
    render(
      <ModalDialog label="Edit overview" onClose={() => {}} panelClassName="panel">
        <p>body</p>
      </ModalDialog>
    );

    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(
      <ModalDialog label="Edit overview" onClose={onClose} panelClassName="panel">
        <p>body</p>
      </ModalDialog>
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ModalDialog label="Edit overview" onClose={onClose} panelClassName="panel">
        <p>body</p>
      </ModalDialog>
    );

    fireEvent.click(container.querySelector(".absolute.inset-0")!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
