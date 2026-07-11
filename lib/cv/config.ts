export type CvTemplateKey = "classic" | "modern";
export type CvFont = "sans" | "serif";

export type CvSectionKey =
  | "overview"
  | "experiences"
  | "stacks"
  | "projects"
  | "certifications"
  | "languages";

export type CvSectionConfig = {
  key: CvSectionKey;
  visible: boolean;
};

export type CvConfig = {
  template: CvTemplateKey;
  showPhoto: boolean;
  hideBio: boolean;
  font: CvFont;
  /** Array order is display order. */
  sections: CvSectionConfig[];
};

// Hard caps that keep the printed CV on a single A4 page regardless of how
// many entries a profile has (sized by print-to-pdf runs against overstuffed
// fixtures; Modern's narrower main column fits fewer projects than Classic).
// They don't bound the length of a single free-text field, and per-section
// controls belong to the CV Studio (#29) — until then these are the only bound.
export type CvSectionLimits = {
  experiences: number;
  bulletsPerExperience: number;
  projects: number;
  certifications: number;
};

export const CV_SECTION_LIMITS: Record<CvTemplateKey, CvSectionLimits> = {
  classic: { experiences: 4, bulletsPerExperience: 2, projects: 4, certifications: 4 },
  modern: { experiences: 4, bulletsPerExperience: 2, projects: 3, certifications: 4 },
};

// No font files to ship: "sans" reuses the app's existing Inter stack (reads
// like Arial/Helvetica), "serif" is a web-safe Times-like stack.
export const CV_FONT_STACKS: Record<CvFont, string> = {
  sans: "var(--font-sans)",
  serif: "Georgia, 'Times New Roman', Times, serif",
};

const SECTION_ORDER: CvSectionKey[] = [
  "overview",
  "experiences",
  "stacks",
  "projects",
  "certifications",
  "languages",
];

const TEMPLATE_KEYS: CvTemplateKey[] = ["classic", "modern"];
const FONT_KEYS: CvFont[] = ["sans", "serif"];

export const DEFAULT_CV_CONFIG: CvConfig = {
  template: "classic",
  showPhoto: false,
  hideBio: false,
  font: "sans",
  sections: SECTION_ORDER.map((key) => ({ key, visible: true })),
};

function isSectionKey(value: unknown): value is CvSectionKey {
  return typeof value === "string" && (SECTION_ORDER as string[]).includes(value);
}

// Normalizes a possibly-partial/unknown config: unknown or missing keys fall back to
// defaults, and `sections` is re-synced against the canonical key set (dropping stale
// keys, backfilling missing ones as visible) so a malformed or outdated config can
// never crash a template.
export function resolveCvConfig(raw: unknown): CvConfig {
  const input = (raw && typeof raw === "object" ? raw : {}) as Partial<CvConfig>;

  const template =
    typeof input.template === "string" && (TEMPLATE_KEYS as string[]).includes(input.template)
      ? (input.template as CvTemplateKey)
      : DEFAULT_CV_CONFIG.template;

  const showPhoto = typeof input.showPhoto === "boolean" ? input.showPhoto : DEFAULT_CV_CONFIG.showPhoto;
  const hideBio = typeof input.hideBio === "boolean" ? input.hideBio : DEFAULT_CV_CONFIG.hideBio;
  const font =
    typeof input.font === "string" && (FONT_KEYS as string[]).includes(input.font)
      ? (input.font as CvFont)
      : DEFAULT_CV_CONFIG.font;

  const rawSections = Array.isArray(input.sections) ? input.sections : [];
  const validSections = rawSections.filter(
    (s): s is CvSectionConfig =>
      !!s && isSectionKey(s.key) && typeof s.visible === "boolean"
  );
  const seenKeys = new Set(validSections.map((s) => s.key));
  const missingSections = SECTION_ORDER.filter((key) => !seenKeys.has(key)).map((key) => ({
    key,
    visible: true,
  }));

  return {
    template,
    showPhoto,
    hideBio,
    font,
    sections: [...validSections, ...missingSections],
  };
}
