import { complete } from './providers';
import type { AIProvider, Resume } from '@/types/resume';

const EDIT_SYSTEM_PROMPT = `You are editing a single candidate's resume for Engrity Group Inc. You will be given the
full resume as JSON and a natural-language instruction from a recruiter, e.g.
"Make the bullet points for my time at Silent-Aire sound more focused on quality control" or
"Summarize my skills for an oil and gas project."

Apply ONLY the requested change. Preserve every other field exactly as given, including every "id" field.
Keep the same JSON shape as the input. Bullets should remain professional, specific, and checklist-style.`;

export async function editResumeWithInstruction(
  resume: Resume,
  instruction: string,
  provider: AIProvider
): Promise<Resume> {
  const response = await complete({
    provider,
    tier: 'balanced',
    system: EDIT_SYSTEM_PROMPT,
    prompt: `CURRENT RESUME JSON:\n${JSON.stringify(resume, null, 2)}\n\nINSTRUCTION:\n${instruction}\n\nReturn ONLY the full updated JSON, same shape, no markdown fences.`,
    jsonMode: true,
  });

  const cleaned = response.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
  return JSON.parse(cleaned) as Resume;
}
