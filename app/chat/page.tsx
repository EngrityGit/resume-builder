'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { Select } from '@/components/ui/Select';
import { useChatStore } from '@/lib/store/resumeStore';
import { useResumeBuilderStore } from '@/lib/store/resumeStore';
import { extractResumeText } from '@/lib/parsing/extractText';
import type { AIProvider } from '@/types/resume';

const PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
};

export default function ChatPage() {
  const { messages, addMessage } = useChatStore();
  const { provider, setProvider, setResume } = useResumeBuilderStore();
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    if (listRef.current) {
      const last = listRef.current.lastElementChild;
      if (last) gsap.fromTo(last, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
    }
  }, [messages]);

  async function handleSend(text: string, file?: File) {
    setLoading(true);
    try {
      let rawText = text;
      let lowConfidence = false;

      if (file) {
        addMessage({ role: 'user', text: `📎 ${file.name}` });
        const extracted = await extractResumeText(file);
        rawText = extracted.text;
        lowConfidence = !!extracted.lowConfidence;
      } else {
        addMessage({ role: 'user', text });
      }

      if (!rawText || rawText.trim().length < 20) {
        addMessage({ role: 'assistant', text: "I couldn't find enough resume text there — try attaching a PDF/Word file or pasting the full resume text." });
        return;
      }

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rawText, provider }),
      });
      const data = await res.json();

      if (!data.resume) {
        addMessage({ role: 'assistant', text: data.error ?? 'Something went wrong parsing that resume.' });
        return;
      }

      // Persist immediately so it shows up on the Candidates page right away.
      const saveRes = await fetch('/api/resumes/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resume: data.resume }),
      });
      const saved = await saveRes.json();
      const resume = saved.resume ?? data.resume;

      setResume(resume);

      const confidenceNote = lowConfidence
        ? ' (heads up — that was a legacy .doc file, so extraction may be rougher than PDF/.docx; double-check the details.)'
        : '';

      addMessage({
        role: 'assistant',
        text: `Parsed and saved ${resume.candidate_name}'s resume as a ${resume.designation ?? resume.job_title ?? 'candidate'}.${confidenceNote}`,
        resumeId: resume.id,
        candidateName: resume.candidate_name,
      });
    } catch (err: any) {
      addMessage({ role: 'assistant', text: `Something went wrong: ${err?.message ?? 'unknown error'}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-engrity-gray">
        <div>
          <h1 className="font-bold text-engrity-navy">Resume Intake</h1>
          <p className="text-xs text-engrity-navy/50">Attach a resume, paste text, or just chat — I'll build and save the candidate record.</p>
        </div>
        <div className="w-40">
          <Select value={provider} onChange={(e) => setProvider(e.target.value as AIProvider)}>
            {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map((p) => (
              <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
            ))}
          </Select>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-engrity-navy/40">
            <img src="/engrity-logo.png" alt="" className="w-12 h-12 mb-4 opacity-60" />
            <p className="text-sm max-w-xs">
              Drop a resume in here — PDF, Word, or even an older .doc file — or paste the text directly.
            </p>
          </div>
        ) : (
          <div ref={listRef} className="max-w-3xl mx-auto space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} text={m.text} resumeId={m.resumeId} candidateName={m.candidateName} />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <ChatInput onSend={handleSend} loading={loading} />
      </div>
    </div>
  );
}
