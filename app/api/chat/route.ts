import { NextRequest, NextResponse } from 'next/server';
import { editResumeWithInstruction } from '@/lib/ai/editResume';
import type { AIProvider, Resume } from '@/types/resume';

export async function POST(req: NextRequest) {
  try {
    const { resume, instruction, provider } = (await req.json()) as {
      resume: Resume;
      instruction: string;
      provider?: AIProvider;
    };

    if (!instruction?.trim()) {
      return NextResponse.json({ error: 'Instruction is required.' }, { status: 400 });
    }

    const updated = await editResumeWithInstruction(resume, instruction, provider ?? 'anthropic');
    return NextResponse.json({ resume: updated });
  } catch (err: any) {
    console.error('chat edit error', err);
    return NextResponse.json({ error: 'Failed to apply edit.' }, { status: 500 });
  }
}
