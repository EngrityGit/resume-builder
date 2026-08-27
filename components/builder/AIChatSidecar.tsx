'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import type { AIProvider, Resume } from '@/types/resume';

interface Message { role: 'user' | 'assistant'; text: string }

export function AIChatSidecar({
  resume,
  provider,
  onUpdate,
}: {
  resume: Resume;
  provider: AIProvider;
  onUpdate: (resume: Resume) => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Ask me to tweak any part of this resume — e.g. "Make the Silent-Aire bullets sound more QC-focused."' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    if (!input.trim() || loading) return;
    const instruction = input.trim();
    setMessages((m) => [...m, { role: 'user', text: instruction }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resume, instruction, provider }),
      });
      const data = await res.json();
      if (data.resume) {
        onUpdate(data.resume);
        setMessages((m) => [...m, { role: 'assistant', text: 'Done — updated the preview.' }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: "I couldn't apply that edit — try rephrasing." }]);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 bg-engrity-blue text-white rounded-full p-4 shadow-card hover:brightness-110 transition-all">
        <MessageCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-2xl border border-engrity-gray shadow-card flex flex-col overflow-hidden">
      <div className="bg-engrity-navy text-white px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-semibold">Resume Assistant</span>
        <button onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm rounded-xl px-3 py-2 max-w-[85%] ${m.role === 'user' ? 'bg-engrity-blue text-white ml-auto' : 'bg-engrity-gray text-engrity-navy'}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="border-t border-engrity-gray p-2 flex gap-2">
        <input
          className="flex-1 text-sm rounded-xl border border-engrity-gray px-3 py-2 focus:outline-none focus:ring-2 focus:ring-engrity-blue/40"
          placeholder="Type an edit request..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} disabled={loading} className="text-engrity-blue disabled:opacity-40">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
