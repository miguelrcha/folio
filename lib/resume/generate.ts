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

export type ResumeRepo = {
  name: string;
  description?: string | null;
  stack?: string[] | null;
  stars: number;
  forks: number;
};

export type ResumeData = {
  name: string;
  githubUsername: string;
  location?: string | null;
  bio?: string | null;
  summary?: string | null;
  topStack: { name: string; percentage: number }[];
  repos: ResumeRepo[];
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

function projectParagraphs(repo: ResumeRepo) {
  const stackLine = (repo.stack ?? []).slice(0, 6).join(", ");

  return [
    new Paragraph({
      spacing: { before: 160 },
      tabStops: [{ type: TabStopType.RIGHT, position: 9638 }],
      children: [
        new TextRun({ text: repo.name, bold: true, italics: true, size: 22, font: "Georgia" }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: `★ ${repo.stars}   ⑂ ${repo.forks}`, size: 18, color: MUTED }),
      ],
    }),
    ...(repo.description
      ? [
          new Paragraph({
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: repo.description,
                italics: true,
                size: 20,
                color: "333333",
                font: "Georgia",
              }),
            ],
          }),
        ]
      : []),
    ...(stackLine
      ? [
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: stackLine, size: 18, color: MUTED, font: "Georgia" })],
          }),
        ]
      : []),
  ];
}

export async function generateResumeDocx(data: ResumeData): Promise<Buffer> {
  const contactLine = [
    data.location ?? undefined,
    `github.com/${data.githubUsername}`,
    `folio.dev/${data.githubUsername}`,
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

  // Cabeçalho: foto à esquerda (se disponível) + nome/cargo/contato à direita,
  // igual ao layout de referência. Sem foto, o bloco de texto ocupa a largura toda.
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

          ...(data.topStack.length > 0
            ? [
                sectionHeading("Skills"),
                ...data.topStack.map(
                  (s) =>
                    new Paragraph({
                      bullet: { level: 0 },
                      spacing: { after: 20 },
                      children: [new TextRun({ text: s.name, size: 21, font: "Georgia" })],
                    })
                ),
              ]
            : []),

          ...(data.repos.length > 0
            ? [sectionHeading("Projects"), ...data.repos.flatMap(projectParagraphs)]
            : []),

          new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `folio.dev/${data.githubUsername}`,
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