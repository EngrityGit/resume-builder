import { NextRequest, NextResponse } from 'next/server';
import { buildResumePdf } from '@/lib/export/pdf';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // DEBUG: Look at your terminal! If this prints "RECEIVED DATA: {}", 
    // it means your frontend is not sending the resume data correctly.
    console.log('RECEIVED DATA:', JSON.stringify(body, null, 2));

    // Sometimes the data is wrapped in a "data" property depending on your frontend fetch
    const resumeData = body.resume || body.data || body;

    const pdfBuffer = await buildResumePdf(resumeData);
    const bodyBinary = new Uint8Array(pdfBuffer);

    return new NextResponse(bodyBinary, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Resume.pdf"`,
        'Content-Length': bodyBinary.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('PDF EXPORT ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}