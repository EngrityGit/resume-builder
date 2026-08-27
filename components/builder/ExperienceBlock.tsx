'use client';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { EmploymentEntry } from '@/types/resume';

interface Props {
  entry: EmploymentEntry;
  onChange: (entry: EmploymentEntry) => void;
  onRemove: () => void;
}

export function ExperienceBlock({ entry, onChange, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function update<K extends keyof EmploymentEntry>(key: K, value: EmploymentEntry[K]) {
    onChange({ ...entry, [key]: value });
  }

  function updateBullet(i: number, text: string) {
    const next = [...entry.responsibilities];
    next[i] = text;
    update('responsibilities', next);
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-engrity-gray p-4 mb-4 bg-white">
      <div className="flex justify-between mb-3">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-engrity-navy/30 hover:text-engrity-navy/60">
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-engrity-navy/50 uppercase tracking-wide">Experience Block</span>
        </div>
        <button onClick={onRemove} className="text-engrity-navy/40 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input placeholder="Company" value={entry.company} onChange={(e) => update('company', e.target.value)} />
        <Input placeholder="Location" value={entry.location ?? ''} onChange={(e) => update('location', e.target.value)} />
        <Input placeholder="Job title" value={entry.title} onChange={(e) => update('title', e.target.value)} />
        <div className="flex gap-2">
          <Input placeholder="Start (e.g. April 2021)" value={entry.start_date} onChange={(e) => update('start_date', e.target.value)} />
          <Input placeholder="End" value={entry.end_date ?? ''} disabled={entry.is_present} onChange={(e) => update('end_date', e.target.value)} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm mb-3 text-engrity-navy/70">
        <input type="checkbox" checked={entry.is_present} onChange={(e) => update('is_present', e.target.checked)} />
        Present role (&quot;Till date&quot;)
      </label>

      <p className="text-xs font-semibold text-engrity-navy/50 uppercase tracking-wide mb-2">Responsibilities</p>
      {entry.responsibilities.map((r, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <span className="text-engrity-blue font-bold pt-2.5">✓</span>
          <textarea
            className="w-full rounded-xl border border-engrity-gray px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-engrity-blue/40"
            rows={2}
            value={r}
            onChange={(e) => updateBullet(i, e.target.value)}
          />
        </div>
      ))}
      <Button variant="ghost" className="text-xs" onClick={() => update('responsibilities', [...entry.responsibilities, ''])}>
        <Plus className="w-3.5 h-3.5" /> Add responsibility
      </Button>
    </div>
  );
}
