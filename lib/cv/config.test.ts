import { describe, expect, it } from "vitest";
import { DEFAULT_CV_CONFIG, resolveCvConfig } from "@/lib/cv/config";

describe("resolveCvConfig", () => {
  it("returns the default config for null/undefined", () => {
    expect(resolveCvConfig(null)).toEqual(DEFAULT_CV_CONFIG);
    expect(resolveCvConfig(undefined)).toEqual(DEFAULT_CV_CONFIG);
  });

  it("merges a partial config over the defaults", () => {
    const result = resolveCvConfig({ template: "modern" });
    expect(result.template).toBe("modern");
    expect(result.showPhoto).toBe(DEFAULT_CV_CONFIG.showPhoto);
    expect(result.sections).toEqual(DEFAULT_CV_CONFIG.sections);
  });

  it("falls back to the default template for an unknown template key", () => {
    expect(resolveCvConfig({ template: "brutalist" }).template).toBe("classic");
  });

  it("merges hideBio when present and boolean", () => {
    expect(resolveCvConfig({ hideBio: true }).hideBio).toBe(true);
    expect(resolveCvConfig({ hideBio: "yes" }).hideBio).toBe(DEFAULT_CV_CONFIG.hideBio);
  });

  it("merges font when present and a known key, defaults otherwise", () => {
    expect(resolveCvConfig({ font: "serif" }).font).toBe("serif");
    expect(resolveCvConfig({ font: "comic-sans" }).font).toBe(DEFAULT_CV_CONFIG.font);
    expect(resolveCvConfig({}).font).toBe("sans");
  });

  it("drops unknown section keys and backfills missing ones as visible", () => {
    const result = resolveCvConfig({
      sections: [
        { key: "overview", visible: false },
        { key: "hobbies", visible: true },
      ],
    });
    expect(result.sections.find((s) => s.key === "overview")).toEqual({
      key: "overview",
      visible: false,
    });
    expect(result.sections.find((s) => (s.key as string) === "hobbies")).toBeUndefined();
    expect(result.sections.map((s) => s.key)).toEqual(
      expect.arrayContaining(["overview", "experiences", "stacks", "projects", "certifications", "languages"])
    );
    expect(result.sections).toHaveLength(6);
  });

  it("ignores a malformed sections entry", () => {
    const result = resolveCvConfig({ sections: [{ key: "overview" }, "nonsense", null] });
    expect(result.sections).toHaveLength(6);
    expect(result.sections.every((s) => typeof s.visible === "boolean")).toBe(true);
  });
});
