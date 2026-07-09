import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "@/components/Logo";

// Smoke test that proves the Vitest + React Testing Library setup works end to
// end. It is intentionally trivial — real coverage lands in follow-up issues.
describe("Logo", () => {
  it("renders the wordmark", () => {
    render(<Logo />);
    expect(screen.getByText("folio")).toBeInTheDocument();
  });
});
