import { getMonths } from "@/lib/experience";
import type { Language } from "@/lib/i18n/translations";

export type CertificationEntry = {
  name: string;
  issuer: string;
  issueMonth: number; // 1-12
  issueYear: number;
  hasExpiration: boolean;
  expirationMonth: number | null;
  expirationYear: number | null;
};

export function emptyCertificationEntry(): CertificationEntry {
  const now = new Date();
  return {
    name: "",
    issuer: "",
    issueMonth: now.getMonth() + 1,
    issueYear: now.getFullYear(),
    hasExpiration: false,
    expirationMonth: null,
    expirationYear: null,
  };
}

export function formatCertificationRange(cert: CertificationEntry, lang: Language = "en"): string {
  const months = getMonths(lang);
  const hasValidIssue =
    typeof cert?.issueMonth === "number" &&
    cert.issueMonth >= 1 &&
    cert.issueMonth <= 12 &&
    typeof cert?.issueYear === "number";

  if (!hasValidIssue) return "";

  const issued = `${months[cert.issueMonth - 1]}/${cert.issueYear}`;

  if (!cert.hasExpiration) return issued;

  const hasValidExpiration =
    typeof cert.expirationMonth === "number" &&
    cert.expirationMonth >= 1 &&
    cert.expirationMonth <= 12 &&
    typeof cert.expirationYear === "number";

  const expires = hasValidExpiration
    ? `${months[cert.expirationMonth! - 1]}/${cert.expirationYear}`
    : "?";

  return `${issued} – ${expires}`;
}
