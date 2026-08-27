export async function embed(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  const data = await res.json();
  return data?.data?.[0]?.embedding ?? [];
}

export function flattenResumeForEmbedding(resume: {
  candidate_name: string;
  job_title?: string;
  profile_summary?: string;
  certifications: { name: string }[];
  skills: string[];
  safety_tickets: string[];
  employment: { company: string; title: string; responsibilities: string[] }[];
}): string {
  return [
    resume.candidate_name,
    resume.job_title,
    resume.profile_summary,
    resume.certifications.map((c) => c.name).join(', '),
    resume.skills.join(', '),
    resume.safety_tickets.join(', '),
    ...resume.employment.map((e) => `${e.title} at ${e.company}: ${e.responsibilities.join(' ')}`),
  ]
    .filter(Boolean)
    .join('\n');
}
