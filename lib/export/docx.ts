import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ImageRun,
  Header,
  VerticalAlign,
  Packer,
} from 'docx';
import type { Resume } from '@/types/resume';
import { getFont, HEADER_FONT } from '@/lib/fonts';
import fs from 'fs/promises';
import path from 'path';

const ENGRITY_BLUE = '0071FE';
const ENGRITY_NAVY = '070B20';
const TEXT_GRAY = '808080'; // Hex value for gray

type ExtendedEmployment = Resume['employment'][number] & {
  project_name?: string;
};

function createSpacer(points = 200) {
  return new Paragraph({ spacing: { before: points } });
}

function checkGlyph() {
  return new TextRun({ 
    text: '\u00FC', 
    font: 'Wingdings', 
    color: ENGRITY_BLUE, 
    bold: true,
  });
}

function checkBullet(text: string, bodyFont: string) {
  return new Paragraph({
    spacing: { after: 100 },
    indent: { left: 360, hanging: 360 }, 
    tabStops: [{ type: 'left', position: 360 }],
    children: [
      checkGlyph(),
      new TextRun({ 
        text: `\t${text}`, 
        color: ENGRITY_NAVY, 
        font: bodyFont 
      }),
    ],
  });
}

function sectionHeading(text: string, bodyFont: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [
      new TextRun({ 
        text, 
        bold: true, 
        color: ENGRITY_NAVY, 
        font: bodyFont,
        underline: { type: 'single', color: ENGRITY_NAVY } 
      })
    ],
  });
}

function employmentTable(entry: ExtendedEmployment, bodyFont: string) {
  const dateRange = entry.is_present
    ? `${entry.start_date} - Till date`
    : `${entry.start_date} – ${entry.end_date ?? ''}`;

  const projectName = entry.project_name ? ` - ${entry.project_name}` : '';

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${entry.company}${projectName}`, bold: true, color: ENGRITY_NAVY, size: 22, font: bodyFont }),
                  new TextRun({ text: entry.location ? ` | ${entry.location}` : '', color: ENGRITY_NAVY, size: 22, font: bodyFont }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: entry.title, italics: true, color: ENGRITY_NAVY, font: bodyFont })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: dateRange, color: ENGRITY_NAVY, font: bodyFont })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            children: [
              new Paragraph({
                spacing: { before: 100, after: 80 },
                children: [
                  new TextRun({ text: 'Responsibilities', bold: true, underline: { type: 'single' }, color: ENGRITY_NAVY, font: bodyFont })
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            children: entry.responsibilities.map((r) => checkBullet(r, bodyFont)),
          }),
        ],
      }),
    ],
  });
}

export async function buildResumeDocx(resume: Resume, providedLogoBuffer?: Buffer): Promise<Buffer> {
  const bodyFont = getFont(resume.font).docxFont;
  const headerFont = getFont(HEADER_FONT).docxFont;

  let logoToUse: Buffer | undefined = providedLogoBuffer;
  if (!logoToUse) {
    try {
      const logoPath = path.join(process.cwd(), 'public/engrity-logo.png');
      logoToUse = await fs.readFile(logoPath);
    } catch (e) {
      console.warn("Logo file could not be loaded. Skipping logo.");
    }
  }

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: logoToUse ? [
              new Paragraph({
                children: [new ImageRun({ data: logoToUse, transformation: { width: 90, height: 90 } })],
              })
            ] : [],
          }),
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Resume', size: 32, color: TEXT_GRAY, font: headerFont })], // FIXED: Used hex code '808080'
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${resume.candidate_name} – ${resume.designation ?? resume.job_title ?? ''}`,
                    bold: true, size: 26, color: ENGRITY_NAVY, font: headerFont,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Engrity Inspection Services – Engrity Group Inc.', bold: true, color: ENGRITY_NAVY, font: headerFont }),
                ],
              }),
              new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ENGRITY_BLUE } },
              })
            ],
          }),
        ],
      }),
    ],
  });

  const body: (Paragraph | Table)[] = [
    sectionHeading('Profile:', bodyFont),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: resume.profile_summary ?? '', color: ENGRITY_NAVY, font: bodyFont })] }),

    sectionHeading('Certification & Education:', bodyFont),
    ...resume.certifications.flatMap((c) => [
      checkBullet(c.name, bodyFont),
      ...(c.endorsements ?? []).map(
        (e) => new Paragraph({ 
          indent: { left: 720, hanging: 360 }, 
          tabStops: [{ type: 'left', position: 720 }],
          children: [new TextRun({ text: `\t○  Endorsements: ${e}`, color: ENGRITY_NAVY, font: bodyFont })] 
        })
      ),
    ]),
    ...resume.education.map((e) => checkBullet(`${e.credential}${e.institution ? ` — ${e.institution}` : ''}`, bodyFont)),

    sectionHeading('Safety Tickets:', bodyFont),
    ...resume.safety_tickets.map((t) => checkBullet(t, bodyFont)),

    sectionHeading('Skills:', bodyFont),
    ...resume.skills.map((s) => checkBullet(s, bodyFont)),

    sectionHeading('Present Employment:', bodyFont),
    ...resume.employment.filter((e) => e.is_present).flatMap((e) => [
      employmentTable(e as ExtendedEmployment, bodyFont),
      createSpacer(300)
    ]),

    sectionHeading('Past Employment:', bodyFont),
    ...resume.employment.filter((e) => !e.is_present).flatMap((e) => [
      employmentTable(e as ExtendedEmployment, bodyFont),
      createSpacer(300)
    ]),
  ];

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 800, bottom: 800, left: 1000, right: 1000 },
        },
      },
      headers: { default: new Header({ children: [headerTable, createSpacer(200)] }) },
      children: body,
    }],
  });

  return Packer.toBuffer(doc);
}