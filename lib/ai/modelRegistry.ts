/**
 * Model registry — NEVER hardcode a specific model snapshot name and call it done.
 * Providers retire/rename models constantly, so at runtime we ask each provider
 * what's currently available and pick the best fit for the task, instead of
 * trusting a name baked in months ago.
 *
 * Task tiers:
 *  - "fast"     structured extraction, simple field edits — cheapest/fastest capable model
 *  - "balanced" resume parsing, chat-sidecar edits — mid-tier
 *  - "quality"  generating responsibilities from thin input, full rewrites — top-tier reasoning model
 */

export type Provider = 'anthropic' | 'openai' | 'gemini';
export type TaskTier = 'fast' | 'balanced' | 'quality';

interface ResolvedModel {
  provider: Provider;
  id: string;
  tier: TaskTier;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h — model catalogs don't change minute to minute
let cache: { at: number; models: Record<Provider, string[]> } | null = null;

/** Hardcoded ONLY as a last-resort fallback if a provider's list-models call fails outright. */
const EMERGENCY_FALLBACK: Record<Provider, string[]> = {
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  openai: ['gpt-4o', 'gpt-4o-mini'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash'],
};

async function listAnthropicModels(): Promise<string[]> {
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
  });
  if (!res.ok) throw new Error('anthropic models list failed');
  const data = await res.json();
  return (data?.data ?? []).map((m: any) => m.id);
}

async function listOpenAIModels(): Promise<string[]> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
  });
  if (!res.ok) throw new Error('openai models list failed');
  const data = await res.json();
  return (data?.data ?? []).map((m: any) => m.id).filter((id: string) => id.startsWith('gpt-'));
}

async function listGeminiModels(): Promise<string[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
  );
  if (!res.ok) throw new Error('gemini models list failed');
  const data = await res.json();
  return (data?.models ?? [])
    .map((m: any) => (m.name as string).replace('models/', ''))
    .filter((id: string) => id.startsWith('gemini-'));
}

async function refreshCache(): Promise<Record<Provider, string[]>> {
  const [anthropic, openai, gemini] = await Promise.allSettled([
    listAnthropicModels(),
    listOpenAIModels(),
    listGeminiModels(),
  ]);

  const models: Record<Provider, string[]> = {
    anthropic: anthropic.status === 'fulfilled' && anthropic.value.length ? anthropic.value : EMERGENCY_FALLBACK.anthropic,
    openai: openai.status === 'fulfilled' && openai.value.length ? openai.value : EMERGENCY_FALLBACK.openai,
    gemini: gemini.status === 'fulfilled' && gemini.value.length ? gemini.value : EMERGENCY_FALLBACK.gemini,
  };

  cache = { at: Date.now(), models };
  return models;
}

async function getCatalog(): Promise<Record<Provider, string[]>> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.models;
  try {
    return await refreshCache();
  } catch {
    return EMERGENCY_FALLBACK;
  }
}

/**
 * Ranks a provider's model ids and picks the best match for a tier, using
 * naming heuristics rather than a fixed list — "flagship" size names sort to
 * "quality", "mini"/"flash"/"haiku" sort to "fast", everything else is "balanced".
 * Within a size class, the lexicographically-latest dated id wins (providers
 * consistently ship newer snapshots with later date suffixes or higher point
 * versions), which keeps this correct as new snapshots ship.
 */
function classify(id: string): TaskTier {
  const lower = id.toLowerCase();
  if (/(mini|flash|haiku|nano)/.test(lower)) return 'fast';
  if (/(opus|pro-max|o1-pro|ultra)/.test(lower)) return 'quality';
  if (/(sonnet|gpt-4o|gpt-4\.\d|pro)/.test(lower)) return 'balanced';
  return 'balanced';
}

function pickBest(ids: string[], tier: TaskTier): string {
  const inTier = ids.filter((id) => classify(id) === tier);
  const pool = inTier.length ? inTier : ids;
  const stable = pool.filter((id) => !/(preview|exp|deprecated)/i.test(id));
  const finalPool = stable.length ? stable : pool;
  return [...finalPool].sort().reverse()[0];
}

export async function resolveModel(provider: Provider, tier: TaskTier): Promise<ResolvedModel> {
  const catalog = await getCatalog();
  const id = pickBest(catalog[provider], tier);
  return { provider, id, tier };
}

/** For the Settings page — show what each provider currently resolves to per tier. */
export async function getResolvedModelMatrix(): Promise<Record<Provider, Record<TaskTier, string>>> {
  const providers: Provider[] = ['anthropic', 'openai', 'gemini'];
  const tiers: TaskTier[] = ['fast', 'balanced', 'quality'];
  const matrix = {} as Record<Provider, Record<TaskTier, string>>;

  for (const provider of providers) {
    matrix[provider] = {} as Record<TaskTier, string>;
    for (const tier of tiers) {
      matrix[provider][tier] = (await resolveModel(provider, tier)).id;
    }
  }
  return matrix;
}
