import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { embed, flattenResumeForEmbedding } from '@/lib/ai/embeddings';
import type { Resume } from '@/types/resume';

export async function POST(req: NextRequest) {
  try {
    const { resume } = (await req.json()) as { resume: Resume };

    if (!resume.candidate_name?.trim()) {
      return NextResponse.json({ error: 'Candidate name is required to save.' }, { status: 400 });
    }

    const supabase = createClient();

    // --- FIX FOR DESIGNATION FOREIGN KEY ---
    // If a designation is provided, ensure it exists in the 'designations' table 
    // so the Foreign Key constraint doesn't fail.
    if (resume.designation?.trim()) {
      try {
        // This 'upsert' adds the new title to your dropdown list automatically
        await supabase
          .from('designations')
          .upsert(
            { name: resume.designation.trim() }, 
            { onConflict: 'name' }
          );
      } catch (e) {
        console.error('Failed to auto-add designation to library:', e);
        // We continue anyway; if it truly fails, the next step will catch the FK error
      }
    }

    // 1. Prepare text for embedding
    const flattenedText = flattenResumeForEmbedding(resume);
    
    // 2. Generate embedding
    let search_embedding: number[] | null = null;
    try {
      if (flattenedText && flattenedText.trim().length > 0) {
        search_embedding = await embed(flattenedText);
      }
    } catch (embedError) {
      console.error('Embedding generation failed:', embedError);
    }

    const isValidVector = Array.isArray(search_embedding) && search_embedding.length > 0;

    // 3. Prepare the save object
    const upsertData: any = {
      ...(resume.id ? { id: resume.id } : {}),
      candidate_name: resume.candidate_name,
      first_name: resume.first_name,
      last_name: resume.last_name,
      job_title: resume.job_title || resume.designation, // Fallback to designation
      designation: resume.designation || null,
      email: resume.email,
      phone: resume.phone,
      address: resume.address,
      profile_summary: resume.profile_summary,
      certifications: resume.certifications,
      education: resume.education,
      safety_tickets: resume.safety_tickets,
      skills: resume.skills,
      computer_skills: resume.computer_skills,
      employment: resume.employment,
      font: resume.font,
      status: resume.status ?? 'draft',
      updated_at: new Date().toISOString(),
    };

    if (isValidVector) {
      upsertData.search_embedding = search_embedding;
    }

    const { data, error } = await supabase
      .from('resumes')
      .upsert(upsertData, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ resume: data });
  } catch (err: any) {
    console.error('save resume error details:', {
      message: err.message,
      code: err.code,
      details: err.details
    });
    
    // Friendly error message for Foreign Key issues
    if (err.code === '23503') {
      return NextResponse.json(
        { error: `The designation "${err.details?.split('=').pop()}" is not valid. Please select from the list or contact admin.` }, 
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: err.message || 'Failed to save resume.' }, 
      { status: 500 }
    );
  }
}