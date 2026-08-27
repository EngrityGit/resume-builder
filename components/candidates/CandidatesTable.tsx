'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Row {
  id: string;
  candidate_name: string;
  first_name?: string;
  last_name?: string;
  designation?: string;
  job_title?: string;
  email?: string;
  phone?: string;
  address?: string;
  certifications?: { name: string }[];
  safety_tickets?: string[];
}

export function CandidatesTable({ rows }: { rows: Row[] }) {
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    if (!bodyRef.current) return;
    gsap.fromTo(
      bodyRef.current.querySelectorAll('tr'),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
    );
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-engrity-navy/50 text-sm">
        No candidates yet — head to Chat and drop in a resume to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-engrity-gray">
      <table className="w-full text-sm">
        <thead className="bg-engrity-soft/50 text-engrity-navy">
          <tr>
            {['Name', 'Designation', 'Email', 'Phone', 'Address', 'Certifications', 'Safety Tickets', ''].map((h) => (
              <th key={h} className="text-left font-semibold px-4 py-3 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-engrity-gray hover:bg-engrity-gray/30 transition-colors">
              <td className="px-4 py-3 font-medium whitespace-nowrap">
                {r.first_name || r.last_name ? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() : r.candidate_name}
              </td>
              <td className="px-4 py-3 text-engrity-navy/70 whitespace-nowrap">{r.designation ?? r.job_title}</td>
              <td className="px-4 py-3 text-engrity-navy/70 whitespace-nowrap">{r.email}</td>
              <td className="px-4 py-3 text-engrity-navy/70 whitespace-nowrap">{r.phone}</td>
              <td className="px-4 py-3 text-engrity-navy/70 max-w-[220px] truncate">{r.address}</td>
              <td className="px-4 py-3 text-engrity-navy/70 max-w-[220px] truncate">
                {(r.certifications ?? []).map((c) => c.name).join(', ')}
              </td>
              <td className="px-4 py-3 text-engrity-navy/70 max-w-[220px] truncate">
                {(r.safety_tickets ?? []).join(', ')}
              </td>
              <td className="px-4 py-3 text-right">
                <Link href={`/builder/${r.id}`} className="inline-flex items-center gap-1 text-engrity-blue hover:underline whitespace-nowrap">
                  Open <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
