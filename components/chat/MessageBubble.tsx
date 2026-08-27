import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  role: 'user' | 'assistant';
  text: string;
  resumeId?: string;
  candidateName?: string;
}

export function MessageBubble({ role, text, resumeId, candidateName }: Props) {
  const isUser = role === 'user';
  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
          isUser ? 'bg-engrity-blue text-white' : 'bg-engrity-gray/60 text-engrity-navy'
        )}
      >
        {text}
        {resumeId && (
          <Link
            href={`/builder/${resumeId}`}
            className="mt-3 flex items-center gap-2 rounded-xl bg-white text-engrity-navy px-3 py-2 text-xs font-medium hover:bg-engrity-soft transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-engrity-blue" />
            Open {candidateName ?? 'candidate'}&apos;s resume
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </Link>
        )}
      </div>
    </div>
  );
}
