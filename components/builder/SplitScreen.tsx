'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Download, FileText, Loader2, Plus, Save, Trash2, Mail, Phone, MapPin, Sparkles, GraduationCap, Award } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ExperienceBlock } from './ExperienceBlock';
import { ResumePreview } from './ResumePreview';
import { AIChatSidecar } from './AIChatSidecar';
import { useResumeBuilderStore } from '@/lib/store/resumeStore';
import { extractResumeText } from '@/lib/parsing/extractText';
import { FONT_OPTIONS } from '@/lib/fonts';
import type { AIProvider, Resume } from '@/types/resume';

const PROVIDER_LABELS: Record<AIProvider, string> = { anthropic: 'Claude', openai: 'OpenAI', gemini: 'Gemini' };

// Helper component for Point-based editing
function ListEditor({ items, onChange, placeholder }: { items: string[], onChange: (items: string[]) => void, placeholder: string }) {
  const safeItems = Array.isArray(items) ? items : [];
  
  const updateItem = (index: number, val: string) => {
    const next = [...safeItems];
    next[index] = val;
    onChange(next);
  };

  const addItem = () => onChange([...safeItems, ""]);
  const removeItem = (index: number) => onChange(safeItems.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {safeItems.map((item, i) => (
        <div key={i} className="flex gap-2 group">
          <Input 
            value={item} 
            onChange={(e) => updateItem(i, e.target.value)} 
            placeholder={placeholder}
            className="flex-1 h-9 text-sm"
          />
          <Button variant="ghost"  onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" onClick={addItem} className="text-engrity-blue text-xs hover:bg-blue-50 py-1 h-8">
        <Plus className="w-3 h-3 mr-1" /> Add Point
      </Button>
    </div>
  );
}

export function SplitScreen({ initialResume }: { initialResume?: Resume }) {
  const {
    resume, provider, setResume, updateField, setProvider,
    addExperience, updateExperience, removeExperience, reorderExperience, markSaved,
  } = useResumeBuilderStore();

  const [designations, setDesignations] = useState<{ id: string; name: string }[]>([]);
  const [parsing, setParsing] = useState(false);
  const [exporting, setExporting] = useState<'docx' | 'pdf' | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (initialResume) setResume(initialResume);
  }, [initialResume]);

  useEffect(() => {
    supabase.from('designations').select('id, name').order('name').then(({ data }) => setDesignations(data ?? []));
  }, []);

  async function handleUpload(file: File) {
    setParsing(true);
    try {
      const { text } = await extractResumeText(file);
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rawText: text, provider }),
      });
      const data = await res.json();
      if (data.resume) setResume(data.resume);
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/resumes/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resume }),
      });
      const data = await res.json();
      if (data.resume) {
        setResume(data.resume);
        markSaved();
        setSavedAt(new Date());
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(format: 'docx' | 'pdf') {
    setExporting(format);
    try {
      const res = await fetch(`/api/export-${format}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resume }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.candidate_name || 'resume'}-Engrity.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  const handleAIFormatSkills = () => {
    const prefixes = ["Proficient in", "Expertise in", "Hands-on experience with", "Skilled in"];
    const formatted = (resume.skills || []).map((s, i) => {
        if (s.startsWith("Proficient") || s.startsWith("Skilled") || s.startsWith("Expertise")) return s;
        return `${prefixes[i % prefixes.length]} ${s}`;
    });
    updateField('skills', formatted);
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) reorderExperience(active.id as string, over.id as string);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* --- TOP BAR --- */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm z-20">
        <div className="flex items-center gap-6">
            <h1 className="font-bold text-engrity-navy text-lg">Engrity Resume Builder</h1>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase">AI Model</span>
                <Select className="w-32 h-8 text-xs" value={provider} onChange={(e) => setProvider(e.target.value as AIProvider)}>
                    {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map((p) => <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>)}
                </Select>
            </div>
        </div>

        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          <Button variant="secondary"  onClick={() => fileRef.current?.click()} disabled={parsing}>
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
          </Button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          {savedAt && <span className="text-[10px] text-gray-400 italic mr-2">Saved {savedAt.toLocaleTimeString()}</span>}
          <Button variant="secondary"  onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </Button>
          <Button variant="secondary"  onClick={() => handleExport('docx')} disabled={exporting !== null}>
            <FileText className="w-4 h-4" /> Word
          </Button>
          <Button  onClick={() => handleExport('pdf')} disabled={exporting !== null} className="bg-engrity-blue hover:bg-engrity-blue/90 font-bold">
            <Download className="w-4 h-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 overflow-hidden">
        {/* --- LEFT EDITOR --- */}
        <div className="overflow-y-auto p-8 space-y-10 bg-white border-r">
          
          {/* General Info */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-black uppercase text-engrity-blue border-b pb-1 tracking-widest">General Info</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Full Name</label>
                    <Input placeholder="Candidate Name" value={resume.candidate_name} onChange={(e) => updateField('candidate_name', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Job Title / Designation</label>
                    <input 
                        list="designation-options"
                        className="w-full h-10 px-3 rounded-md border text-sm focus:ring-2 focus:ring-engrity-blue outline-none"
                        placeholder="Enter title..."
                        value={resume.designation || ''}
                        onChange={(e) => updateField('designation', e.target.value)}
                    />
                    <datalist id="designation-options">
                        {designations.map(d => <option key={d.id} value={d.name} />)}
                    </datalist>
                </div>
            </div>
          </section>

          {/* Professional Summary */}
          <section className="space-y-2">
            <h2 className="text-[11px] font-black uppercase text-engrity-blue border-b pb-1 tracking-widest">Professional Profile</h2>
            <textarea 
                className="w-full border rounded-md p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-engrity-blue outline-none leading-relaxed"
                placeholder="Describe your expertise..."
                value={resume.profile_summary}
                onChange={(e) => updateField('profile_summary', e.target.value)}
            />
          </section>

          {/* Point Lists (Certs, Education, Skills, Tickets) */}
          <div className="grid grid-cols-1 gap-8">
            {/* Certifications */}
            <div className="space-y-3">
                <h2 className="text-[11px] font-black uppercase text-engrity-blue border-b pb-1 tracking-widest flex items-center gap-2">
                    <Award className="w-3 h-3" /> Certifications
                </h2>
                <ListEditor 
                    items={resume.certifications?.map(c => typeof c === 'string' ? c : c.name) || []} 
                    onChange={(val) => updateField('certifications', val.map(v => ({ name: v })))} 
                    placeholder="e.g. CWB Level 2" 
                />
            </div>

            {/* Education - The "Missing" Section */}
            <div className="space-y-3">
                <h2 className="text-[11px] font-black uppercase text-engrity-blue border-b pb-1 tracking-widest flex items-center gap-2">
                    <GraduationCap className="w-3 h-3" /> Education
                </h2>
                <ListEditor 
                    items={resume.education?.map(e => `${e.credential}${e.institution ? ` — ${e.institution}` : ''}`) || []} 
                    onChange={(val) => {
                        const nextEdu = val.map(v => {
                            const [cred, inst] = v.split(' — ');
                            return { credential: cred || v, institution: inst || '' };
                        });
                        updateField('education', nextEdu);
                    }} 
                    placeholder="Degree — University Name" 
                />
            </div>

            {/* Safety Tickets */}
            <div className="space-y-3">
                <h2 className="text-[11px] font-black uppercase text-engrity-blue border-b pb-1 tracking-widest">Safety Tickets</h2>
                <ListEditor items={resume.safety_tickets || []} onChange={(val) => updateField('safety_tickets', val)} placeholder="e.g. H2S Alive" />
            </div>

            {/* Technical Skills */}
            <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-1">
                    <h2 className="text-[11px] font-black uppercase text-engrity-blue tracking-widest">Technical Skills</h2>
                    <Button variant="ghost"  onClick={handleAIFormatSkills} className="text-[10px] bg-blue-50 text-blue-600 h-6">
                        <Sparkles className="w-3 h-3 mr-1" /> AI Sentences
                    </Button>
                </div>
                <ListEditor items={resume.skills || []} onChange={(val) => updateField('skills', val)} placeholder="e.g. Visual Inspection" />
            </div>

            {/* Computer Skills */}
            <div className="space-y-3">
                <h2 className="text-[11px] font-black uppercase text-engrity-blue border-b pb-1 tracking-widest">Computer Skills</h2>
                <ListEditor items={resume.computer_skills || []} onChange={(val) => updateField('computer_skills', val)} placeholder="e.g. Bluebeam, Excel" />
            </div>
          </div>

          {/* Employment History */}
          <section className="space-y-4">
            <div className="flex justify-between items-center border-b pb-1">
                <h2 className="text-[11px] font-black uppercase text-engrity-blue tracking-widest">Employment History</h2>
                <Button variant="ghost"  onClick={addExperience} className="text-engrity-blue h-8"><Plus className="w-4 h-4 mr-1" /> Add Job</Button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={resume.employment.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                    {resume.employment.map((entry) => (
                    <ExperienceBlock key={entry.id} entry={entry} onChange={(n) => updateExperience(entry.id, n)} onRemove={() => removeExperience(entry.id)} />
                    ))}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          {/* Contact Details */}
          <section className="space-y-4 pt-10 border-t-2 border-gray-100">
            <h2 className="text-[11px] font-black uppercase text-engrity-blue tracking-widest">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label>
                    <div className="flex items-center gap-2 border rounded-md px-3 h-10 focus-within:ring-2 focus-within:ring-engrity-blue">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <input className="bg-transparent text-sm w-full outline-none" placeholder="email@example.com" value={resume.email || ''} onChange={(e) => updateField('email', e.target.value)} />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Phone</label>
                    <div className="flex items-center gap-2 border rounded-md px-3 h-10 focus-within:ring-2 focus-within:ring-engrity-blue">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <input className="bg-transparent text-sm w-full outline-none" placeholder="+1..." value={resume.phone || ''} onChange={(e) => updateField('phone', e.target.value)} />
                    </div>
                </div>
                <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Location</label>
                    <div className="flex items-center gap-2 border rounded-md px-3 h-10 focus-within:ring-2 focus-within:ring-engrity-blue">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <input className="bg-transparent text-sm w-full outline-none" placeholder="City, Province" value={resume.address || ''} onChange={(e) => updateField('address', e.target.value)} />
                    </div>
                </div>
            </div>
          </section>
        </div>

        {/* --- RIGHT PREVIEW --- */}
        <div className="bg-slate-200 overflow-y-auto flex justify-center p-12">
           <div className="shadow-2xl h-fit w-full max-w-[816px]">
              <ResumePreview resume={resume} />
           </div>
        </div>
      </div>
      
      <AIChatSidecar resume={resume} provider={provider} onUpdate={setResume} />
    </div>
  );
}