import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSummary,
  extractReadmeStacks,
  impactScore,
  joinStack,
} from "@/lib/github-sync";

describe("extractReadmeStacks", () => {
  describe("skillicons.dev", () => {
    it("maps short codes to readable names", () => {
      const md = "![stack](https://skillicons.dev/icons?i=js,ts,react)";
      expect(extractReadmeStacks(md)).toEqual(["JavaScript", "TypeScript", "React"]);
    });

    it("ignores unknown codes and keeps the known ones", () => {
      const md = "https://skillicons.dev/icons?i=js,notareal thing,go";
      // The regex stops the code list at the space, so only `js` is captured.
      expect(extractReadmeStacks(md)).toEqual(["JavaScript"]);
    });

    it("is case-insensitive", () => {
      const md = "https://skillicons.dev/icons?i=JS,TS";
      expect(extractReadmeStacks(md)).toEqual(["JavaScript", "TypeScript"]);
    });

    it("collapses duplicate codes to a single entry", () => {
      const md = "https://skillicons.dev/icons?i=react,react,react";
      expect(extractReadmeStacks(md)).toEqual(["React"]);
    });
  });

  describe("devicon", () => {
    it("reads the slug from the icon path, not the alt text", () => {
      const md =
        '<img alt="totally wrong" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" />';
      expect(extractReadmeStacks(md)).toEqual(["Java"]);
    });

    it("matches variant folder names (devicon-plain, etc.)", () => {
      const md =
        "https://raw.githubusercontent.com/devicon/icons/go/go-original.svg";
      expect(extractReadmeStacks(md)).toEqual(["Go"]);
    });
  });

  describe("cdn.simpleicons.org", () => {
    it("maps the slug via the shields logo table", () => {
      const md = '<img src="https://cdn.simpleicons.org/python" />';
      expect(extractReadmeStacks(md)).toEqual(["Python"]);
    });
  });

  describe("shields.io badges", () => {
    it("extracts the technology from the logo query param", () => {
      const md =
        "https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white";
      expect(extractReadmeStacks(md)).toEqual(["Python"]);
    });

    it("decodes url-encoded logo slugs", () => {
      const md = "https://img.shields.io/badge/Node-339933?logo=node.js";
      expect(extractReadmeStacks(md)).toEqual(["Node.js"]);
    });

    it("ignores badges that carry no logo param", () => {
      const md = "https://img.shields.io/badge/just-a-label-blue";
      expect(extractReadmeStacks(md)).toEqual([]);
    });
  });

  describe("across formats", () => {
    it("deduplicates the same technology seen in different formats", () => {
      const md = [
        "https://skillicons.dev/icons?i=js",
        "https://img.shields.io/badge/JavaScript-000?logo=javascript",
      ].join("\n");
      expect(extractReadmeStacks(md)).toEqual(["JavaScript"]);
    });

    it("collects technologies from a mixed real-world readme", () => {
      const md = `
        # Hi there
        ![stack](https://skillicons.dev/icons?i=ts,react)
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" />
        ![py](https://img.shields.io/badge/Python-3776AB?logo=python)
        <img src="https://cdn.simpleicons.org/figma" />
      `;
      expect(extractReadmeStacks(md).sort()).toEqual(
        ["Docker", "Figma", "Python", "React", "TypeScript"].sort()
      );
    });
  });

  describe("edge cases", () => {
    it("returns an empty array for empty input", () => {
      expect(extractReadmeStacks("")).toEqual([]);
    });

    it("returns an empty array when there are no badges or icons", () => {
      expect(extractReadmeStacks("# Just a plain readme, no icons here.")).toEqual([]);
    });
  });

  describe("data safety", () => {
    it("only ever emits mapped technology names, never raw readme content", () => {
      const md = [
        "github_access_token=ghp_SECRETTOKEN1234567890",
        "https://skillicons.dev/icons?i=js",
        "some random prose that should never surface",
      ].join("\n");
      const result = extractReadmeStacks(md);
      expect(result).toEqual(["JavaScript"]);
      expect(result.join(" ")).not.toMatch(/token|ghp_|prose/i);
    });
  });
});

describe("joinStack", () => {
  it("falls back when there are no names", () => {
    expect(joinStack([])).toBe("multiple technologies");
  });

  it("returns the single name as-is", () => {
    expect(joinStack(["React"])).toBe("React");
  });

  it("joins two names with 'and'", () => {
    expect(joinStack(["React", "Vue.js"])).toBe("React and Vue.js");
  });

  it("uses a comma list with a trailing 'and' for three or more", () => {
    expect(joinStack(["React", "Vue.js", "Svelte"])).toBe("React, Vue.js and Svelte");
  });

  it("uses the Portuguese conjunction and fallback for pt", () => {
    expect(joinStack(["React", "Vue.js", "Svelte"], "pt")).toBe("React, Vue.js e Svelte");
    expect(joinStack(["React", "Vue.js"], "pt")).toBe("React e Vue.js");
    expect(joinStack([], "pt")).toBe("múltiplas tecnologias");
  });
});

describe("impactScore", () => {
  const NO_SIGNALS = { hasReadme: false, hasTests: false, hasCi: false };
  const baseRepo = {
    stargazers_count: 0,
    forks_count: 0,
    fork: false,
    pushed_at: "2000-01-01T00:00:00Z", // old enough to never get the recency boost
    license: null,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("weights stars more heavily than forks and gives non-forks a base bonus", () => {
    const score = impactScore(
      { ...baseRepo, stargazers_count: 10, forks_count: 5 },
      NO_SIGNALS
    );
    // 10*3 + 5*2 + 10 (not a fork) = 50
    expect(score).toBe(50);
  });

  it("penalizes forks instead of rewarding them", () => {
    const original = impactScore(baseRepo, NO_SIGNALS);
    const fork = impactScore({ ...baseRepo, fork: true }, NO_SIGNALS);
    // Base bonus swings from +10 to -20, a 30-point gap.
    expect(original - fork).toBe(30);
  });

  it("adds a recency boost for repos pushed within 90 days", () => {
    const recent = impactScore(
      { ...baseRepo, pushed_at: "2026-07-01T00:00:00Z" },
      NO_SIGNALS
    );
    const stale = impactScore(baseRepo, NO_SIGNALS);
    expect(recent - stale).toBe(10);
  });

  it("adds structure and license boosts", () => {
    const score = impactScore(
      { ...baseRepo, license: { key: "mit" } },
      { hasReadme: true, hasTests: true, hasCi: true }
    );
    // 10 (not fork) + readme 5 + tests 8 + ci 8 + license 3 = 34
    expect(score).toBe(34);
  });
});

describe("buildSummary", () => {
  const opts = {
    username: "octocat",
    topStack: [
      { name: "TypeScript", percentage: 60 },
      { name: "Go", percentage: 30 },
    ],
    publicRepos: 12,
    activeRepos: 4,
    totalStars: 20,
    topRepoName: "folio",
  };

  it("is deterministic for the same username", () => {
    expect(buildSummary(opts)).toBe(buildSummary(opts));
  });

  it("mentions the top stack", () => {
    expect(buildSummary(opts)).toContain("TypeScript");
  });

  it("can pick a different variant for a different username", () => {
    // Not guaranteed for every pair, but these two hash to different variants.
    const a = buildSummary({ ...opts, username: "alice" });
    const b = buildSummary({ ...opts, username: "bob" });
    expect(a).not.toBe(b);
  });

  it("defaults to English", () => {
    expect(buildSummary(opts)).toBe(buildSummary(opts, "en"));
  });

  it("writes Portuguese prose for the pt locale", () => {
    // Every pt variant mentions "repositórios" — a language check that holds
    // regardless of which hash bucket the username lands in.
    const pt = buildSummary(opts, "pt");
    expect(pt).toContain("repositórios");
    expect(pt).toContain("TypeScript");
    expect(buildSummary(opts, "en")).not.toContain("repositórios");
  });

  it("is deterministic per language and keeps the variant index paired", () => {
    expect(buildSummary(opts, "pt")).toBe(buildSummary(opts, "pt"));
    expect(buildSummary(opts, "pt")).not.toBe(buildSummary(opts, "en"));
  });
});
