import { describe, expect, it } from "vitest";
import { buildProfileMetaDescription, profileDisplayName } from "@/lib/profile-metadata";

const base = {
  github_username: "octocat",
  full_name: "Octo Cat",
  bio: null as string | null,
  summary: null as string | null,
};

describe("profileDisplayName", () => {
  it("prefers the full name", () => {
    expect(profileDisplayName(base)).toBe("Octo Cat");
  });

  it("falls back to the @username when the name is missing or blank", () => {
    expect(profileDisplayName({ ...base, full_name: null })).toBe("@octocat");
    expect(profileDisplayName({ ...base, full_name: "   " })).toBe("@octocat");
  });
});

describe("buildProfileMetaDescription", () => {
  it("uses the person's own bio when present", () => {
    const description = buildProfileMetaDescription({ ...base, bio: "I build compilers." });
    expect(description).toBe("I build compilers.");
  });

  it("falls back to the generated summary when there is no bio", () => {
    const description = buildProfileMetaDescription({
      ...base,
      summary: "Developer focused on TypeScript.",
    });
    expect(description).toBe("Developer focused on TypeScript.");
  });

  it("falls back to a generic line naming the person when there is neither", () => {
    expect(buildProfileMetaDescription(base)).toBe(
      "See Octo Cat's projects, tech stack and resume on Folio."
    );
    expect(buildProfileMetaDescription({ ...base, full_name: null })).toBe(
      "See @octocat's projects, tech stack and resume on Folio."
    );
  });

  it("collapses newlines and repeated whitespace into single spaces", () => {
    const description = buildProfileMetaDescription({
      ...base,
      bio: "Line one\n\nLine two\t indented",
    });
    expect(description).toBe("Line one Line two indented");
  });

  it("clamps long bios with an ellipsis and never exceeds the limit", () => {
    const description = buildProfileMetaDescription({ ...base, bio: "long ".repeat(100) });
    expect(description.length).toBeLessThanOrEqual(200);
    expect(description.endsWith("…")).toBe(true);
  });

  it("treats whitespace-only bio as absent", () => {
    const description = buildProfileMetaDescription({ ...base, bio: "   ", summary: "Real one." });
    expect(description).toBe("Real one.");
  });
});
