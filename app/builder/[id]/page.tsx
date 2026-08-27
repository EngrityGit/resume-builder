import { createClient } from '@/lib/supabase/server';
import { SplitScreen } from '@/components/builder/SplitScreen';

export default async function BuilderPage({ params }: { params: { id: string } }) {
  if (params.id === 'new') {
    return <SplitScreen />;
  }

  const supabase = createClient();
  const { data: resume } = await supabase.from('resumes').select('*').eq('id', params.id).single();

  return <SplitScreen initialResume={resume ?? undefined} />;
}
