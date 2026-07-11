import { describe, expect, it } from "vitest";
import { formatLanguageEntry } from "@/lib/language";

describe("formatLanguageEntry", () => {
  const entry = { language: "portuguese", proficiency: "Native" };

  it("includes the flag emoji by default", () => {
    expect(formatLanguageEntry(entry)).toBe("🇧🇷 Portuguese - Native");
  });

  it("omits the flag emoji when showFlag is false", () => {
    expect(formatLanguageEntry(entry, { showFlag: false })).toBe("Portuguese - Native");
  });

  it("returns an empty string for an unknown language code", () => {
    expect(formatLanguageEntry({ language: "klingon", proficiency: "Fluent" })).toBe("");
  });
});
