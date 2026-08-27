import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CandidatesClient } from './CandidatesClient';
import { Button } from '@/components/ui/Button';

export default async function CandidatesPage() {
  const supabase = createClient();
  const { data: resumes } = await supabase
    .from('resumes')
    .select('id, candidate_name, first_name, last_name, designation, job_title, email, phone, address, certifications, safety_tickets')
    .order('updated_at', { ascending: false });

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-engrity-navy">Candidates</h1>
          <p className="text-engrity-navy/60 text-sm mt-1">Every resume built in Engrity Resume Flow, searchable by anything in it.</p>
        </div>
        <Link href="/builder/new">
          <Button><Plus className="w-4 h-4" /> New Resume</Button>
        </Link>
      </div>

      <CandidatesClient initialRows={resumes ?? []} />
    </main>
  );
}
