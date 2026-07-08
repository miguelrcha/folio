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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text(clean(data.name || data.githubUsername), PAGE_WIDTH / 2, y, { align: "center" });
  y += 6;

  if (data.bio) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(clean(data.bio), CONTENT_WIDTH);
    doc.text(lines, PAGE_WIDTH / 2, y, { align: "center" });
    y += lines.length * 4.2 + 2;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
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
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 1.5;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 5;
  };

  const paragraph = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BODY);
    const lines = doc.splitTextToSize(clean(text), CONTENT_WIDTH);
    ensureSpace(lines.length * 4);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4 + 5;
  };

  const bulletList = (items: string[]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BODY);
    items.filter(Boolean).forEach((item) => {
      const lines = doc.splitTextToSize(clean(item), CONTENT_WIDTH - 5);
      ensureSpace(lines.length * 4 + 1);
      doc.text("•", MARGIN, y);
      doc.text(lines, MARGIN + 4, y);
      y += lines.length * 4 + 1.5;
    });
    y += 3.5;
  };

  if (data.summary) {
    sectionHeading("Overview");
    paragraph(data.summary);
  }

  if (data.experiences.length > 0) {
    sectionHeading("Experiences");
    bulletList(
      data.experiences.map((exp) => {
        const range = formatExperienceRange(exp);
        const parts = [exp?.title ?? "", exp?.company ?? ""].filter(Boolean).join(" — ");
        return range ? `${parts} (${range})` : parts;
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
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...INK);
      const titleText = repo.description ? `${repo.name}  —  ${repo.description}` : repo.name;
      const titleLines = doc.splitTextToSize(clean(titleText), CONTENT_WIDTH - 5);
      ensureSpace(titleLines.length * 4 + (stackLine ? 4 : 0) + 2);
      doc.text("•", MARGIN, y);
      doc.text(titleLines, MARGIN + 4, y);
      y += titleLines.length * 4;
      if (stackLine) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(clean(stackLine), MARGIN + 4, y);
        y += 4;
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

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
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
