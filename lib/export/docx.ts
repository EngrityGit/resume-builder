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
  // Added these imports to fix the floating/watermark errors
  HorizontalPositionAlign,
  VerticalPositionAlign,
  TextWrappingType,
  TextWrappingSide,
} from 'docx';
import { NextResponse } from 'next/server';
import type { Resume } from '@/types/resume';
import { getFont, HEADER_FONT } from '@/lib/fonts';
import fs from 'fs/promises';
import path from 'path';

const ENGRITY_BLUE = '0071FE';
const ENGRITY_NAVY = '070B20';
const TEXT_GRAY = '808080';

type ExtendedEmployment = Resume['employment'][number];

// --- HELPERS ---
function createSpacer(points = 200) {
  return new Paragraph({ spacing: { before: points } });
}

function checkBullet(text: string, bodyFont: string) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360, hanging: 360 },
    children: [
      new TextRun({ text: 'ü', font: 'Wingdings', color: ENGRITY_BLUE, bold: true }),
      new TextRun({ text: `\t${text}`, color: ENGRITY_NAVY, font: bodyFont }),
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

function employmentTable(entry: ExtendedEmployment, bodyFont: string, isPresent: boolean) {
  const dateRange = isPresent
    ? `${entry.start_date} - Till date`
    : `${entry.start_date} – ${entry.end_date ?? ''}`;

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
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: entry.company, bold: true, color: ENGRITY_NAVY, size: 22, font: bodyFont }),
                  new TextRun({ text: entry.location ? ` | ${entry.location}` : '', color: ENGRITY_NAVY, size: 22, font: bodyFont }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
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
                children: [new TextRun({ text: entry.title, italics: true, color: ENGRITY_NAVY, font: bodyFont })],
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
              ...entry.responsibilities.map((r) => checkBullet(r, bodyFont)),
            ],
          }),
        ],
      }),
    ],
  });
}

// --- CORE GENERATOR ---
export async function buildResumeDocx(resume: Resume): Promise<Buffer> {
  const bodyFont = getFont(resume.font).docxFont;
  const headerFont = getFont(HEADER_FONT).docxFont;

  const logoPath = path.join(process.cwd(), 'public/engrity-logo.png');
  const watermarkPath = path.join(process.cwd(), 'public/watermark.png');
  const logoBuffer = await fs.readFile(logoPath).catch(() => null);
  const watermarkBuffer = await fs.readFile(watermarkPath).catch(() => null);

  // FIXED: Watermark definition using correct enums and wrapping
  const watermarkPara = watermarkBuffer ? new Paragraph({
    children: [
      new ImageRun({
        data: watermarkBuffer,
        transformation: { width: 550, height: 550 },
        floating: {
          horizontalPosition: { align: HorizontalPositionAlign.CENTER },
          verticalPosition: { align: VerticalPositionAlign.CENTER },
          wrap: {
            type: TextWrappingType.NONE,
            side: TextWrappingSide.BOTH_SIDES,
          },
          zIndex: -1, // This effectively puts the image behind the text
        },
      }),
    ],
  }) : new Paragraph({});

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
            width: { size: 15, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: logoBuffer ? [
              new Paragraph({ children: [new ImageRun({ data: logoBuffer, transformation: { width: 80, height: 80 } })] })
            ] : [],
          }),
          new TableCell({
            width: { size: 85, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Resume', size: 32, color: TEXT_GRAY, font: headerFont })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${resume.candidate_name} – ${resume.designation || resume.job_title || ''}`,
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
              new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ENGRITY_BLUE } } })
            ],
          }),
        ],
      }),
    ],
  });

  const bodyContent: (Paragraph | Table)[] = [];

  bodyContent.push(sectionHeading('Profile:', bodyFont));
  bodyContent.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: resume.profile_summary || '', color: ENGRITY_NAVY, font: bodyFont })]
  }));

  if (resume.certifications?.length || resume.education?.length) {
    bodyContent.push(sectionHeading('Certification & Education:', bodyFont));
    resume.certifications?.forEach(c => bodyContent.push(checkBullet(typeof c === 'string' ? c : c.name, bodyFont)));
    resume.education?.forEach(e => bodyContent.push(checkBullet(`${e.credential}${e.institution ? ` — ${e.institution}` : ''}`, bodyFont)));
  }

  if (resume.safety_tickets?.length) {
    bodyContent.push(sectionHeading('Safety Tickets:', bodyFont));
    resume.safety_tickets.forEach(t => bodyContent.push(checkBullet(t, bodyFont)));
  }

  if (resume.skills?.length) {
    bodyContent.push(sectionHeading('Skills:', bodyFont));
    resume.skills.forEach(s => bodyContent.push(checkBullet(s, bodyFont)));
  }

  if (resume.computer_skills?.length) {
    bodyContent.push(sectionHeading('Computer Skills:', bodyFont));
    resume.computer_skills.forEach(s => bodyContent.push(checkBullet(s, bodyFont)));
  }

  const presentJobs = resume.employment.filter(e => e.is_present);
  const pastJobs = resume.employment.filter(e => !e.is_present);

  if (presentJobs.length) {
    bodyContent.push(sectionHeading('Present Employment:', bodyFont));
    presentJobs.forEach(job => {
      bodyContent.push(employmentTable(job, bodyFont, true));
      bodyContent.push(createSpacer(300));
    });
  }

  if (pastJobs.length) {
    bodyContent.push(sectionHeading('Past Employment:', bodyFont));
    pastJobs.forEach(job => {
      bodyContent.push(employmentTable(job, bodyFont, false));
      bodyContent.push(createSpacer(300));
    });
  }

  bodyContent.push(sectionHeading('Contact Information:', bodyFont));
  bodyContent.push(new Paragraph({
    children: [
      new TextRun({ text: "Email: ", bold: true, color: ENGRITY_NAVY, font: bodyFont }),
      new TextRun({ text: resume.email || 'N/A', color: ENGRITY_NAVY, font: bodyFont }),
      new TextRun({ text: "   |   Phone: ", bold: true, color: ENGRITY_NAVY, font: bodyFont }),
      new TextRun({ text: resume.phone || 'N/A', color: ENGRITY_NAVY, font: bodyFont }),
    ]
  }));
  if (resume.address) {
    bodyContent.push(new Paragraph({
      children: [
        new TextRun({ text: `Address: ${resume.address}`, color: ENGRITY_NAVY, font: bodyFont })
      ]
    }));
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 800, bottom: 800, left: 1000, right: 1000 } },
      },
      headers: { 
        default: new Header({ 
          children: [watermarkPara, headerTable, new Paragraph({ spacing: { after: 200 } })] 
        }) 
      },
      children: bodyContent,
    }],
  });

  return Packer.toBuffer(doc);
}

// --- API ROUTE HANDLER FIX ---
export async function POST(req: Request) {
  try {
    const resume: Resume = await req.json();
    const buffer = await buildResumeDocx(resume);

    // FIXED: Convert Buffer to Uint8Array to satisfy NextResponse types
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${resume.candidate_name}_Resume.docx"`,
      },
    });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Failed to generate docx' }, { status: 500 });
  }
}