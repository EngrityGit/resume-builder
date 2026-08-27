import { NextRequest, NextResponse } from 'next/server';
import { buildResumeDocx } from '@/lib/export/docx';
import type { Resume } from '@/types/resume';

export async function POST(req: NextRequest) {
  try {
    const { resume } = (await req.json()) as { resume: Resume };
    const buffer = await buildResumeDocx(resume);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${resume.candidate_name.replace(/\s+/g, '-')}-Engrity-Resume.docx"`,
      },
    });
  } catch (err: any) {
    console.error('export-docx error', err);
    return NextResponse.json({ error: 'Failed to generate Word document.' }, { status: 500 });
  }
}
