import { describe, expect, it } from "vitest";
import { pickLanguageFromAcceptHeader } from "@/lib/i18n/translations";

describe("pickLanguageFromAcceptHeader", () => {
  it("resolves a Brazilian browser header to pt", () => {
    expect(pickLanguageFromAcceptHeader("pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7")).toBe("pt");
  });

  it("resolves an English browser header to en", () => {
    expect(pickLanguageFromAcceptHeader("en-US,en;q=0.9")).toBe("en");
  });

  it("skips unsupported languages until a supported one appears", () => {
    expect(pickLanguageFromAcceptHeader("fr-FR,fr;q=0.9,pt;q=0.8")).toBe("pt");
  });

  it("returns null when nothing is supported", () => {
    expect(pickLanguageFromAcceptHeader("fr-FR,de;q=0.9")).toBeNull();
    expect(pickLanguageFromAcceptHeader("")).toBeNull();
    expect(pickLanguageFromAcceptHeader(null)).toBeNull();
  });

  it("handles the wildcard entry", () => {
    expect(pickLanguageFromAcceptHeader("*")).toBeNull();
  });
});
