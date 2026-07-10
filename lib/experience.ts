import type { Language } from "@/lib/i18n/translations";

export type ExperienceEntry = {
  title: string;
  company: string;
  startMonth: number; // 1-12
  startYear: number;
  endMonth: number | null; // null if "current"
  endYear: number | null;
  current: boolean;
  /** Short lines describing what was done in this experience (stack, responsibilities). */
  bullets?: string[];
};

const MONTHS_BY_LANG: Record<Language, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  pt: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
};

export function getMonths(lang: Language = "en") {
  return MONTHS_BY_LANG[lang];
}

// English default, kept for any call site that doesn't (yet) thread a language through.
export const MONTHS = MONTHS_BY_LANG.en;

export function formatExperienceRange(exp: ExperienceEntry, lang: Language = "en"): string {
  const months = getMonths(lang);
  const hasValidStart =
    typeof exp?.startMonth === "number" &&
    exp.startMonth >= 1 &&
    exp.startMonth <= 12 &&
    typeof exp?.startYear === "number";

  if (!hasValidStart) return "";

  const start = `${months[exp.startMonth - 1]}/${exp.startYear}`;

  if (exp.current) return `${start} – ${lang === "pt" ? "atual" : "present"}`;

  const hasValidEnd =
    typeof exp.endMonth === "number" &&
    exp.endMonth >= 1 &&
    exp.endMonth <= 12 &&
    typeof exp.endYear === "number";

  const end = hasValidEnd ? `${months[exp.endMonth! - 1]}/${exp.endYear}` : "?";
  return `${start} – ${end}`;
}

export function emptyExperienceEntry(): ExperienceEntry {
  const now = new Date();
  return {
    title: "",
    company: "",
    startMonth: now.getMonth() + 1,
    startYear: now.getFullYear(),
    endMonth: null,
    endYear: null,
    current: true,
    bullets: [],
  };
}
