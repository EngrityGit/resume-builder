'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FONT_OPTIONS } from '@/lib/fonts';
import type { Provider, TaskTier } from '@/lib/ai/modelRegistry';

interface Designation { id: string; name: string }

const PROVIDER_LABELS: Record<Provider, string> = { anthropic: 'Claude (Anthropic)', openai: 'OpenAI', gemini: 'Gemini (Google)' };
const TIERS: TaskTier[] = ['fast', 'balanced', 'quality'];

export default function SettingsPage() {
  const supabase = createClient();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [newDesignation, setNewDesignation] = useState('');
  const [modelMatrix, setModelMatrix] = useState<Record<Provider, Record<TaskTier, string>> | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);

  useEffect(() => {
    supabase.from('designations').select('*').order('name').then(({ data }) => setDesignations(data ?? []));
    fetch('/api/models').then((r) => r.json()).then((d) => setModelMatrix(d.matrix ?? null)).finally(() => setLoadingModels(false));
  }, []);

  async function addDesignation() {
    if (!newDesignation.trim()) return;
    const { data, error } = await supabase.from('designations').insert({ name: newDesignation.trim() }).select().single();
    if (!error && data) {
      setDesignations((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewDesignation('');
    }
  }

  async function removeDesignation(id: string) {
    await supabase.from('designations').delete().eq('id', id);
    setDesignations((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-engrity-navy">Settings</h1>

      <Card>
        <h2 className="font-semibold text-engrity-navy mb-1">Designations</h2>
        <p className="text-sm text-engrity-navy/60 mb-4">
          The role templates available when building a resume — e.g. QC Inspector, API Inspector, Third Party Inspector.
        </p>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Add a designation…" value={newDesignation} onChange={(e) => setNewDesignation(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDesignation()} />
          <Button onClick={addDesignation}><Plus className="w-4 h-4" /> Add</Button>
        </div>
        <div className="space-y-2">
          {designations.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-engrity-gray px-3 py-2 text-sm">
              {d.name}
              <button onClick={() => removeDesignation(d.id)} className="text-engrity-navy/40 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-engrity-navy mb-1">Available Fonts</h2>
        <p className="text-sm text-engrity-navy/60 mb-4">
          Selectable for a resume's body text in the builder. The header always renders in Times New Roman per the Engrity standard.
        </p>
        <div className="flex flex-wrap gap-2">
          {FONT_OPTIONS.map((f) => (
            <span key={f.id} className="text-xs rounded-lg bg-engrity-gray/60 text-engrity-navy px-3 py-1.5" style={{ fontFamily: f.cssFont }}>
              {f.label}
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-engrity-navy mb-1">AI Models</h2>
        <p className="text-sm text-engrity-navy/60 mb-4">
          No model is pinned by name — each provider's latest available model is resolved automatically per task,
          balancing capability against cost. This is what's currently resolving:
        </p>
        {loadingModels ? (
          <div className="flex items-center gap-2 text-sm text-engrity-navy/50"><Loader2 className="w-4 h-4 animate-spin" /> Resolving latest models…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-engrity-navy/50">
                <th className="py-1 font-medium">Provider</th>
                {TIERS.map((t) => <th key={t} className="py-1 font-medium capitalize">{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {modelMatrix && (Object.keys(modelMatrix) as Provider[]).map((p) => (
                <tr key={p} className="border-t border-engrity-gray">
                  <td className="py-2 font-medium">{PROVIDER_LABELS[p]}</td>
                  {TIERS.map((t) => <td key={t} className="py-2 text-engrity-navy/70 font-mono text-xs">{modelMatrix[p][t]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </main>
  );
}
