export type ExperienceEntry = {
  title: string;
  company: string;
  startMonth: number; // 1-12
  startYear: number;
  endMonth: number | null; // null se "atual"
  endYear: number | null;
  current: boolean;
  /** Linhas curtas do que foi feito nessa experiência (stack, responsabilidades). */
  bullets?: string[];
};

export const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function formatExperienceRange(exp: ExperienceEntry): string {
  const hasValidStart =
    typeof exp?.startMonth === "number" &&
    exp.startMonth >= 1 &&
    exp.startMonth <= 12 &&
    typeof exp?.startYear === "number";

  if (!hasValidStart) return "";

  const start = `${MONTHS[exp.startMonth - 1]}/${exp.startYear}`;

  if (exp.current) return `${start} – atual`;

  const hasValidEnd =
    typeof exp.endMonth === "number" &&
    exp.endMonth >= 1 &&
    exp.endMonth <= 12 &&
    typeof exp.endYear === "number";

  const end = hasValidEnd ? `${MONTHS[exp.endMonth! - 1]}/${exp.endYear}` : "?";
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
