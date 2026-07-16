import { describe, expect, it } from "vitest";
import { formatLanguageEntry, languageName, proficiencyLabel } from "@/lib/language";

describe("languageName", () => {
  it("localizes known codes", () => {
    expect(languageName("english", "en")).toBe("English");
    expect(languageName("english", "pt")).toBe("Inglês");
  });

  it("returns an empty string for unknown codes", () => {
    expect(languageName("klingon", "pt")).toBe("");
  });
});

describe("proficiencyLabel", () => {
  it("localizes known levels", () => {
    expect(proficiencyLabel("Native", "pt")).toBe("Nativo");
    expect(proficiencyLabel("Native", "en")).toBe("Native");
  });

  it("keeps unknown stored values verbatim instead of leaking a dictionary key", () => {
    expect(proficiencyLabel("Conversational", "pt")).toBe("Conversational");
  });
});

describe("formatLanguageEntry", () => {
  const entry = { language: "portuguese", proficiency: "Native" };

  it("includes the flag emoji by default", () => {
    expect(formatLanguageEntry(entry)).toBe("🇧🇷 Portuguese - Native");
  });

  it("omits the flag emoji when showFlag is false", () => {
    expect(formatLanguageEntry(entry, { showFlag: false })).toBe("Portuguese - Native");
  });

  it("localizes the whole entry for pt", () => {
    expect(formatLanguageEntry(entry, { lang: "pt" })).toBe("🇧🇷 Português - Nativo");
  });

  it("returns an empty string for an unknown language code", () => {
    expect(formatLanguageEntry({ language: "klingon", proficiency: "Fluent" })).toBe("");
  });
});
