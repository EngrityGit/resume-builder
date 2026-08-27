import { NextRequest, NextResponse } from 'next/server';
import { parseResumeText } from '@/lib/ai/parseResume';
import type { AIProvider } from '@/types/resume';

export async function POST(req: NextRequest) {
  try {
    // Check if body exists
    const body = await req.json().catch(() => ({}));
    const { rawText, provider } = body as { rawText: string; provider?: AIProvider };

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json({ error: 'No resume text provided.' }, { status: 400 });
    }

    const resume = await parseResumeText(rawText, provider ?? 'anthropic');
    return NextResponse.json({ resume });
  } catch (err: any) {
    console.error('parse-resume error', err);
    return NextResponse.json({ error: 'Failed to parse resume.' }, { status: 500 });
  }
}