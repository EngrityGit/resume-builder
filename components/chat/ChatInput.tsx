'use client';

import { useRef, useState } from 'react';
import { Paperclip, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  onSend: (text: string, file?: File) => void;
  loading?: boolean;
}

const ACCEPTED = '.pdf,.doc,.docx,.txt';

export function ChatInput({ onSend, loading }: Props) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    // Large pasted blocks are almost always a resume dropped straight from another doc —
    // let it land in the textarea as-is; the send button treats it as raw resume text.
    const pasted = e.clipboardData.getData('text');
    if (pasted.length > 400 && !text) {
      setText(pasted);
    }
  }

  function submit() {
    if (!text.trim() && !file) return;
    onSend(text.trim(), file ?? undefined);
    setText('');
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="border-t border-engrity-gray bg-white p-4">
      {file && (
        <div className="flex items-center gap-2 mb-2 text-xs bg-engrity-soft/60 text-engrity-navy rounded-lg px-3 py-1.5 w-fit">
          <Paperclip className="w-3.5 h-3.5" />
          {file.name}
          <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2.5 rounded-xl border border-engrity-gray text-engrity-navy/60 hover:bg-engrity-gray/40 transition-colors"
          title="Attach a resume (PDF, Word, or .doc)"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <textarea
          className="flex-1 resize-none rounded-xl border border-engrity-gray px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-engrity-blue/40 max-h-40"
          rows={1}
          placeholder="Paste a resume, describe what you need, or attach a file…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button onClick={submit} disabled={loading || (!text.trim() && !file)}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
