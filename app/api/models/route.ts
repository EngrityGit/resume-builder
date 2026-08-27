import { NextResponse } from 'next/server';
import { getResolvedModelMatrix } from '@/lib/ai/modelRegistry';

export async function GET() {
  try {
    const matrix = await getResolvedModelMatrix();
    return NextResponse.json({ matrix });
  } catch (err: any) {
    console.error('models matrix error', err);
    return NextResponse.json({ error: 'Failed to resolve models.' }, { status: 500 });
  }
}
