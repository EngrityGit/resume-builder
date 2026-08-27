import { complete } from './providers';
import type { AIProvider, Resume } from '@/types/resume';
import { v4 as uuidv4 } from 'uuid';

/**
 * SYSTEM PROMPT
 * Optimized to be concise and prevent "infinite" generation that causes truncation.
 */
const EXTRACTION_SYSTEM_PROMPT = `You are a resume parser for Engrity Group Inc.
Extract structured data into the Engrity standard section order.

Rules:
- Split name into: first_name, last_name, candidate_name.
- Designation: Use "QC Inspector", "API Inspector", "Third Party Inspector" or closest match.
- Extract ALL certifications and safety tickets exactly as written.
- For Employment: If responsibilities are thin, GENERATE 3-4 high-quality technical bullets referencing codes (ASME B31.3, CSA W47.1/W59, API 510/570).
- CONSTRAINT: Do not exceed 5 bullets per job title to ensure the response remains under token limits.
- IMPORTANT: Return ONLY valid JSON. No markdown, no conversational text.`;

/**
 * SCHEMA HINT
 * Providing empty values helps the AI understand the expected types.
 */
const OUTPUT_SCHEMA_HINT = `Return a JSON object exactly like this:
{
  "candidate_name": "", "first_name": "", "last_name": "", "job_title": "", "designation": "",
  "email": "", "phone": "", "address": "", "profile_summary": "",
  "certifications": [{ "name": "", "endorsements": [] }],
  "education": [{ "credential": "", "institution": "" }],
  "safety_tickets": [], "skills": [], "computer_skills": [],
  "employment": [{
    "company": "", "location": "", "title": "", "start_date": "", "end_date": "", "is_present": false,
    "responsibilities": []
  }]
}`;

/**
 * UTILITY: Attempts to fix truncated JSON by closing open brackets.
 */
function attemptJsonRescue(str: string): string {
  let json = str.trim();
  const openBraces = (json.match(/\{/g) || []).length;
  const closeBraces = (json.match(/\}/g) || []).length;
  const openBrackets = (json.match(/\[/g) || []).length;
  const closeBrackets = (json.match(/\]/g) || []).length;

  // Add missing closing brackets/braces in the correct order
  // Usually, employment is the last array, so we close ] then }
  if (openBrackets > closeBrackets) json += '"]'.repeat(openBrackets - closeBrackets);
  if (openBraces > closeBraces) json += '}'.repeat(openBraces - closeBraces);
  
  return json;
}

export async function parseResumeText(rawText: string, provider: AIProvider): Promise<Resume> {
  // Use 'quality' tier for larger context window if possible
  const tier = 'quality'; 

  const response = await complete({
    provider,
    tier,
    system: EXTRACTION_SYSTEM_PROMPT,
    prompt: `${OUTPUT_SCHEMA_HINT}\n\nProcess this text:\n\n${rawText}`,
    jsonMode: true,
  });

  let parsed: any;

  try {
    // 1. Clean Markdown backticks
    let cleaned = response.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');

    // 2. Extract strictly between first { and last }
    const startBracket = cleaned.indexOf('{');
    const endBracket = cleaned.lastIndexOf('}');
    
    if (startBracket === -1) {
      throw new Error("No JSON object detected in AI response.");
    }

    // Use a substring. If endBracket is missing (truncated), take everything from start
    let jsonString = endBracket !== -1 
      ? cleaned.substring(startBracket, endBracket + 1) 
      : cleaned.substring(startBracket);

    try {
      parsed = JSON.parse(jsonString);
    } catch (firstParseError) {
      // 3. RESCUE: If parsing failed, the JSON might be truncated.
      console.warn("Standard JSON parse failed. Attempting rescue logic...");
      const rescuedJson = attemptJsonRescue(jsonString);
      parsed = JSON.parse(rescuedJson);
    }

  } catch (err) {
    console.error("Critical AI Parsing Error. Raw response snippet:", response.substring(0, 300));
    throw new Error("The resume is too long or the AI response was cut off. Please try again or shorten the text.");
  }

  // 4. DATA SANITIZATION & DEFAULTS
  // Ensure we don't crash if certain keys are missing due to truncation
  const sanitized: Resume = {
    candidate_name: parsed.candidate_name || '',
    first_name: parsed.first_name || '',
    last_name: parsed.last_name || '',
    job_title: parsed.job_title || '',
    designation: parsed.designation || '',
    email: parsed.email || '',
    phone: parsed.phone || '',
    address: parsed.address || '',
    profile_summary: parsed.profile_summary || '',
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
    safety_tickets: Array.isArray(parsed.safety_tickets) ? parsed.safety_tickets : [],
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    computer_skills: Array.isArray(parsed.computer_skills) ? parsed.computer_skills : [],
    employment: (Array.isArray(parsed.employment) ? parsed.employment : []).map((e: any) => ({
      id: uuidv4(),
      company: e.company || '',
      location: e.location || '',
      title: e.title || '',
      start_date: e.start_date || '',
      end_date: e.end_date || '',
      is_present: !!e.is_present,
      responsibilities: Array.isArray(e.responsibilities) ? e.responsibilities : []
    }))
  };

  // Sort employment: Present jobs first
  sanitized.employment.sort((a, b) => Number(b.is_present) - Number(a.is_present));

  return sanitized;
}