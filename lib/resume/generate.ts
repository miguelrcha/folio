import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  TabStopType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  VerticalAlign,
} from "docx";
import type { ExperienceEntry } from "@/lib/experience";
import { formatExperienceRange } from "@/lib/experience";
import type { CertificationEntry } from "@/lib/certification";
import { formatCertificationRange } from "@/lib/certification";
import type { LanguageEntry } from "@/lib/language";
import { formatLanguageEntry } from "@/lib/language";

export type ResumeRepo = {
  name: string;
  description?: string | null;
  stack?: string[] | null;
};

export type ResumeStats = {
  publicRepos: number;
  totalCommits: number;
  githubSinceYear: number | null;
};

export type ResumeData = {
  name: string;
  githubUsername: string;
  location?: string | null;
  email?: string | null;
  bio?: string | null;
  summary?: string | null;
  topStack: { name: string; percentage: number }[];
  experiences: ExperienceEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  repos: ResumeRepo[];
  stats: ResumeStats;
  /** bytes da foto (avatar do GitHub), já baixados. Se omitido, o cabeçalho fica só com o texto. */
  photo?: { data: Buffer; type: "jpg" | "png" | "gif" | "bmp" } | null;
};

const INK = "1a1a1a";
const MUTED = "555555";
const RULE = "999999";

function sectionHeading(text: string) {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 3 },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 21,
        color: INK,
        font: "Georgia",
      }),
    ],
  });
}

function bulletText(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 21, font: "Georgia" })],
  });
}

function experienceParagraphs(exp: ExperienceEntry) {
  const range = formatExperienceRange(exp);
  const bullets = exp.bullets ?? [];
  return [
    new Paragraph({
      bullet: { level: 0 },
      spacing: { after: bullets.length > 0 ? 20 : 60 },
      children: [
        new TextRun({ text: exp.title || "", bold: true, size: 21, font: "Georgia" }),
        ...(exp.company
          ? [new TextRun({ text: `  —  ${exp.company}`, size: 21, font: "Georgia" })]
          : []),
        ...(range ? [new TextRun({ text: `  (${range})`, size: 18, color: MUTED, font: "Georgia" })] : []),
      ],
    }),
    ...bullets.map(
      (bullet) =>
        new Paragraph({
          bullet: { level: 1 },
          spacing: { after: 20 },
          children: [new TextRun({ text: bullet, size: 18, color: MUTED, font: "Georgia" })],
        })
    ),
    ...(bullets.length > 0 ? [new Paragraph({ spacing: { after: 40 }, children: [] })] : []),
  ];
}

function certificationParagraph(cert: CertificationEntry) {
  const range = formatCertificationRange(cert);
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: cert.name || "", bold: true, size: 21, font: "Georgia" }),
      ...(cert.issuer
        ? [new TextRun({ text: `  —  ${cert.issuer}`, size: 21, font: "Georgia" })]
        : []),
      ...(range ? [new TextRun({ text: `  (${range})`, size: 18, color: MUTED, font: "Georgia" })] : []),
    ],
  });
}

function projectParagraphs(repo: ResumeRepo) {
  const stackLine = (repo.stack ?? []).slice(0, 6).join(", ");

  return [
    new Paragraph({
      bullet: { level: 0 },
      spacing: { before: 100, after: stackLine ? 20 : 60 },
      children: [
        new TextRun({ text: repo.name, bold: true, size: 21, font: "Georgia" }),
        ...(repo.description
          ? [
              new TextRun({
                text: `  —  ${repo.description}`,
                italics: true,
                size: 20,
                color: "333333",
                font: "Georgia",
              }),
            ]
          : []),
      ],
    }),
    ...(stackLine
      ? [
          new Paragraph({
            indent: { left: 340 },
            spacing: { after: 80 },
            children: [new TextRun({ text: stackLine, size: 18, color: MUTED, font: "Georgia" })],
          }),
        ]
      : []),
  ];
}

function githubStatsParagraphs(stats: ResumeStats) {
  const lines = [
    `${stats.publicRepos} repositórios públicos`,
    `${stats.totalCommits} commits totais`,
  ];
  if (stats.githubSinceYear) lines.push(`no github desde ${stats.githubSinceYear}`);
  return lines.map(bulletText);
}

export async function generateResumeDocx(data: ResumeData): Promise<Buffer> {
  const contactLine = [
    data.location ?? undefined,
    data.email ?? undefined,
    `github.com/${data.githubUsername}`,
    `meufolio.dev/${data.githubUsername}`,
  ]
    .filter(Boolean)
    .join("  |  ");

  const headerNameBlock = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: (data.name || data.githubUsername).toUpperCase(),
          bold: true,
          size: 34,
          font: "Georgia",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: contactLine, size: 16, color: MUTED, font: "Georgia" })],
    }),
  ];

  // Cabeçalho: foto à esquerda (se disponível) + nome/contato à direita.
  // De propósito, sem cargo/título fixo abaixo do nome — esse texto é só
  // o que vem do GitHub, sem inventar um título de vaga.
  const headerChildren = data.photo
    ? [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 22, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: data.photo.data,
                          type: data.photo.type,
                          transformation: { width: 90, height: 90 },
                        } as ConstructorParameters<typeof ImageRun>[0]),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 78, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  children: headerNameBlock,
                }),
              ],
            }),
          ],
        }),
      ]
    : headerNameBlock;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...headerChildren,

          ...(data.bio
            ? [
                sectionHeading("About me"),
                new Paragraph({
                  children: [new TextRun({ text: data.bio, italics: true, size: 21, font: "Georgia" })],
                }),
              ]
            : []),

          ...(data.summary
            ? [
                sectionHeading("Overview"),
                new Paragraph({
                  children: [new TextRun({ text: data.summary, size: 21, font: "Georgia" })],
                }),
              ]
            : []),

          ...(data.experiences.length > 0
            ? [sectionHeading("Experiences"), ...data.experiences.flatMap(experienceParagraphs)]
            : []),

          ...(data.topStack.length > 0
            ? [sectionHeading("Stacks"), ...data.topStack.map((s) => bulletText(s.name))]
            : []),

          ...(data.repos.length > 0
            ? [sectionHeading("Projects, by impact"), ...data.repos.flatMap(projectParagraphs)]
            : []),

          ...(data.certifications.length > 0
            ? [sectionHeading("Certificates"), ...data.certifications.map(certificationParagraph)]
            : []),

          ...(data.languages.length > 0
            ? [sectionHeading("Languages"), ...data.languages.map((l) => bulletText(formatLanguageEntry(l)))]
            : []),

          ...(data.stats.publicRepos > 0 || data.stats.totalCommits > 0
            ? [sectionHeading("GitHub"), ...githubStatsParagraphs(data.stats)]
            : []),

          new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `meufolio.dev/${data.githubUsername}`,
                size: 15,
                color: "999999",
                font: "Georgia",
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
