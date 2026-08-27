import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { embed } from '@/lib/ai/embeddings';

// e.g. "Show me all inspectors with API 510 and over 5 years of experience."
export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query: string };
    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const vector = await embed(query);
    const supabase = createClient();

    // `match_resumes` is defined in lib/supabase/schema.sql — cosine similarity
    // over resumes.search_embedding, kept fresh by /api/resumes/save.
    const { data, error } = await supabase.rpc('match_resumes', {
      query_embedding: vector,
      match_count: 20,
    });

    if (error) throw error;
    return NextResponse.json({ results: data });
  } catch (err: any) {
    console.error('search error', err);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
