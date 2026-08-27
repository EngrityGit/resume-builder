import { resolveModel, type Provider, type TaskTier } from './modelRegistry';

interface CompletionArgs {
  provider: Provider;
  tier: TaskTier;
  system: string;
  prompt: string;
  jsonMode?: boolean;
}

/**
 * Thin abstraction so the rest of the app never talks to a specific vendor SDK,
 * or a specific model snapshot, directly. The exact model id is resolved fresh
 * from lib/ai/modelRegistry per call, based on the task's tier — so this keeps
 * working when providers ship new models, without a code change.
 */
export async function complete({ provider, tier, system, prompt, jsonMode }: CompletionArgs): Promise<string> {
  const { id: model } = await resolveModel(provider, tier);

  switch (provider) {
    case 'anthropic':
      return completeClaude(model, system, prompt, jsonMode);
    case 'openai':
      return completeOpenAI(model, system, prompt, jsonMode);
    case 'gemini':
      return completeGemini(model, system, prompt, jsonMode);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function completeClaude(model: string, system: string, prompt: string, jsonMode?: boolean): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: jsonMode ? `${system}\n\nRespond with ONLY valid JSON. No prose, no markdown fences.` : system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data?.content?.map((b: any) => b.text ?? '').join('\n') ?? '';
}

async function completeOpenAI(model: string, system: string, prompt: string, jsonMode?: boolean): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function completeGemini(model: string, system: string, prompt: string, jsonMode?: boolean): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: jsonMode ? { responseMimeType: 'application/json' } : undefined,
      }),
    }
  );
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') ?? '';
}
