export type CvTemplateKey = "classic" | "modern";

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
  /** Array order is display order. */
  sections: CvSectionConfig[];
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

export const DEFAULT_CV_CONFIG: CvConfig = {
  template: "classic",
  showPhoto: false,
  hideBio: false,
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
    sections: [...validSections, ...missingSections],
  };
}
