import { jsPDF } from "jspdf";
import type { ExperienceEntry } from "@/lib/experience";
import { formatExperienceRange } from "@/lib/experience";
import type { CertificationEntry } from "@/lib/certification";
import { formatCertificationRange } from "@/lib/certification";
import type { LanguageEntry } from "@/lib/language";
import { formatLanguageEntry } from "@/lib/language";

export type ResumePdfRepo = {
  name: string;
  description?: string | null;
  stack?: string[] | null;
};

export type ResumePdfStats = {
  publicRepos: number;
  totalCommits: number;
  githubSinceYear: number | null;
  followers: number;
};

export type ResumePdfData = {
  name: string;
  githubUsername: string;
  location?: string | null;
  email?: string | null;
  bio?: string | null;
  summary?: string | null;
  topStack: { name: string }[];
  experiences: ExperienceEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  repos: ResumePdfRepo[];
  stats: ResumePdfStats;
  /** Data URL (data:image/...;base64,...) já carregada. Se omitido, some do cabeçalho. */
  photoDataUrl?: string | null;
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK: [number, number, number] = [10, 10, 10];
const MUTED: [number, number, number] = [75, 85, 99];
const BODY: [number, number, number] = [55, 65, 81];
const RULE: [number, number, number] = [209, 213, 219];

const FONT = "times";
const NAME_SIZE = 22;
const BIO_SIZE = 11;
const BIO_LINE = 4.8;
const CONTACT_SIZE = 9.5;
const HEADING_SIZE = 10.5;
const BODY_SIZE = 10;
const BODY_LINE = 4.7;
const SUBTEXT_SIZE = 9;
const SUBTEXT_LINE = 4.3;
const FOOTER_SIZE = 8.5;

// As fontes padrão do jsPDF (Helvetica/Times/Courier) só cobrem WinAnsi
// (Latin-1) — bom o bastante pra acentos do português, mas emoji (as
// bandeirinhas de idioma, por exemplo) viram caixinhas quebradas. Corta
// qualquer coisa fora do BMP básico antes de desenhar.
function clean(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function imageFormatFromDataUrl(dataUrl: string): "JPEG" | "PNG" | "WEBP" | null {
  const match = dataUrl.match(/^data:image\/(\w+);base64,/);
  if (!match) return null;
  const type = match[1].toLowerCase();
  if (type === "jpeg" || type === "jpg") return "JPEG";
  if (type === "png") return "PNG";
  if (type === "webp") return "WEBP";
  return null;
}

export function generateResumePdf(data: ResumePdfData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Cabeçalho: foto (se disponível) + nome + contato, tudo centralizado.
  // De propósito, sem cargo/título fixo — só o que vem do GitHub.
  if (data.photoDataUrl) {
    const format = imageFormatFromDataUrl(data.photoDataUrl);
    if (format) {
      doc.addImage(data.photoDataUrl, format, PAGE_WIDTH / 2 - 8, y, 16, 16, undefined, "FAST");
      y += 25;
    }
  }

  doc.setFont(FONT, "bold");
  doc.setFontSize(NAME_SIZE);
  doc.setTextColor(...INK);
  doc.text(clean(data.name || data.githubUsername), PAGE_WIDTH / 2, y, { align: "center" });
  y += 7.5;

  if (data.bio) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(BIO_SIZE);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(clean(data.bio), CONTENT_WIDTH);
    doc.text(lines, PAGE_WIDTH / 2, y, { align: "center" });
    y += lines.length * BIO_LINE + 2;
  }

  doc.setFont(FONT, "normal");
  doc.setFontSize(CONTACT_SIZE);
  doc.setTextColor(...MUTED);
  const contactLine = [
    data.location ?? undefined,
    data.email ?? undefined,
    `github.com/${data.githubUsername}`,
    `meufolio.dev/${data.githubUsername}`,
  ]
    .filter(Boolean)
    .join("   |   ");
  doc.text(contactLine, PAGE_WIDTH / 2, y, { align: "center" });
  y += 9;

  const sectionHeading = (title: string) => {
    ensureSpace(11);
    doc.setFont(FONT, "bold");
    doc.setFontSize(HEADING_SIZE);
    doc.setTextColor(...INK);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 1.8;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 5.5;
  };

  const paragraph = (text: string) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...BODY);
    const lines = doc.splitTextToSize(clean(text), CONTENT_WIDTH);
    ensureSpace(lines.length * BODY_LINE);
    doc.text(lines, MARGIN, y);
    y += lines.length * BODY_LINE + 5;
  };

  const bulletList = (items: string[]) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...BODY);
    items.filter(Boolean).forEach((item) => {
      const lines = doc.splitTextToSize(clean(item), CONTENT_WIDTH - 5);
      ensureSpace(lines.length * BODY_LINE + 1);
      doc.text("•", MARGIN, y);
      doc.text(lines, MARGIN + 4, y);
      y += lines.length * BODY_LINE + 1.5;
    });
    y += 3.5;
  };

  // Cada experiência: uma linha principal (cargo — empresa (período)) e,
  // logo abaixo, sub-bullets menores e recuados com o que foi feito.
  const experienceList = (items: { headline: string; bullets: string[] }[]) => {
    items.forEach(({ headline, bullets }) => {
      doc.setFont(FONT, "normal");
      doc.setFontSize(BODY_SIZE);
      doc.setTextColor(...BODY);
      const headlineLines = doc.splitTextToSize(clean(headline), CONTENT_WIDTH - 5);
      ensureSpace(headlineLines.length * BODY_LINE + 1);
      doc.text("•", MARGIN, y);
      doc.text(headlineLines, MARGIN + 4, y);
      y += headlineLines.length * BODY_LINE + 1;

      doc.setFont(FONT, "normal");
      doc.setFontSize(SUBTEXT_SIZE);
      doc.setTextColor(...MUTED);
      bullets.filter(Boolean).forEach((bullet) => {
        const lines = doc.splitTextToSize(clean(bullet), CONTENT_WIDTH - 10);
        ensureSpace(lines.length * SUBTEXT_LINE + 0.5);
        doc.text("–", MARGIN + 6, y);
        doc.text(lines, MARGIN + 10, y);
        y += lines.length * SUBTEXT_LINE + 0.5;
      });
      y += 2;
    });
    y += 1.5;
  };

  if (data.summary) {
    sectionHeading("Overview");
    paragraph(data.summary);
  }

  if (data.experiences.length > 0) {
    sectionHeading("Experiences");
    experienceList(
      data.experiences.map((exp) => {
        const range = formatExperienceRange(exp);
        const parts = [exp?.title ?? "", exp?.company ?? ""].filter(Boolean).join(" — ");
        return { headline: range ? `${parts} (${range})` : parts, bullets: exp?.bullets ?? [] };
      })
    );
  }

  if (data.topStack.length > 0) {
    sectionHeading("Stacks");
    paragraph(data.topStack.map((s) => s.name).join("  ·  "));
  }

  if (data.repos.length > 0) {
    sectionHeading("Projects, by impact");
    data.repos.forEach((repo) => {
      const stackLine = (repo.stack ?? []).slice(0, 6).join(", ");
      doc.setFont(FONT, "bold");
      doc.setFontSize(BODY_SIZE);
      doc.setTextColor(...INK);
      const titleText = repo.description ? `${repo.name}  —  ${repo.description}` : repo.name;
      const titleLines = doc.splitTextToSize(clean(titleText), CONTENT_WIDTH - 5);
      ensureSpace(titleLines.length * BODY_LINE + (stackLine ? SUBTEXT_LINE : 0) + 2);
      doc.text("•", MARGIN, y);
      doc.text(titleLines, MARGIN + 4, y);
      y += titleLines.length * BODY_LINE;
      if (stackLine) {
        doc.setFont(FONT, "normal");
        doc.setFontSize(SUBTEXT_SIZE);
        doc.setTextColor(...MUTED);
        doc.text(clean(stackLine), MARGIN + 4, y);
        y += SUBTEXT_LINE;
      }
      y += 2;
    });
    y += 1.5;
  }

  if (data.certifications.length > 0) {
    sectionHeading("Certificates");
    bulletList(
      data.certifications.map((cert) => {
        const range = formatCertificationRange(cert);
        const parts = [cert?.name ?? "", cert?.issuer ?? ""].filter(Boolean).join(" — ");
        return range ? `${parts} (${range})` : parts;
      })
    );
  }

  if (data.languages.length > 0) {
    sectionHeading("Languages");
    bulletList(data.languages.map((entry) => formatLanguageEntry(entry)));
  }

  sectionHeading("GitHub");
  bulletList([
    `${data.stats.publicRepos} repositórios públicos`,
    `${data.stats.totalCommits} commits totais`,
    ...(data.stats.githubSinceYear ? [`no github desde ${data.stats.githubSinceYear}`] : []),
    `${data.stats.followers} followers`,
  ]);

  doc.setFont(FONT, "normal");
  doc.setFontSize(FOOTER_SIZE);
  doc.setTextColor(...MUTED);
  ensureSpace(6);
  doc.text(
    `generated automatically from github · meufolio.dev/@${data.githubUsername}`,
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - MARGIN + 5,
    { align: "center" }
  );

  return doc;
}
