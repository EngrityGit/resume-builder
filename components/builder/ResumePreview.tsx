'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Resume } from '@/types/resume';
import { getFont, HEADER_FONT } from '@/lib/fonts';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <div className="mb-5">
      <h3 className="text-sm font-bold text-engrity-navy underline mb-2 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function Check({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="flex gap-2 text-sm mb-1 text-engrity-navy items-start">
      <svg width="12" height="12" viewBox="0 0 24 24" className="mt-1 shrink-0">
        <path d="M4 12.5L9.5 18L20 6" stroke="#0071fe" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span>{text}</span>
    </div>
  );
}

export function ResumePreview({ resume }: { resume: Resume }) {
  const present = resume.employment?.filter((e) => e.is_present) || [];
  const past = resume.employment?.filter((e) => !e.is_present) || [];
  const containerRef = useRef<HTMLDivElement>(null);

  const bodyFont = getFont(resume.font);
  const headerFont = getFont(HEADER_FONT);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(containerRef.current, { opacity: 0.4, y: 6 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
  }, [resume]);

  return (
    <>
      {bodyFont.googleFontsCssUrl && <link rel="stylesheet" href={bodyFont.googleFontsCssUrl} />}
      {headerFont.googleFontsCssUrl && <link rel="stylesheet" href={headerFont.googleFontsCssUrl} />}
      <div
        ref={containerRef}
        style={{ fontFamily: bodyFont.cssFont }}
        className="bg-white p-[0.75in] w-full shadow-lg"
      >
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-2" style={{ fontFamily: headerFont.cssFont }}>
          <img src="/engrity-logo.png" alt="Engrity" className="w-14 h-14 object-contain" />
          <div className="flex-1 text-center">
            <p className="text-lg">Resume</p>
            <p className="font-bold text-engrity-navy text-xl">
              {resume.candidate_name} – {resume.designation || resume.job_title}
            </p>
            <p className="text-sm font-semibold">Engrity Inspection Services – Engrity Group Inc.</p>
          </div>
          <div className="w-14" />
        </div>
        
        <div className="border-b-2 border-engrity-blue mb-6" />

        <Section title="Profile:">
          <p className="text-sm leading-relaxed text-justify">{resume.profile_summary}</p>
        </Section>

        <Section title="Certification & Education:">
          {resume.certifications?.map((c, i) => <Check key={i} text={typeof c === 'string' ? c : c.name} />)}
          {resume.education?.map((e, i) => <Check key={i} text={`${e.credential}${e.institution ? ` — ${e.institution}` : ''}`} />)}
        </Section>

        <Section title="Safety Tickets:">
          {resume.safety_tickets?.map((t, i) => <Check key={i} text={t} />)}
        </Section>

        <Section title="Skills:">
          {resume.skills?.map((s, i) => <Check key={i} text={s} />)}
        </Section>

        <Section title="Computer Skills:">
          {resume.computer_skills?.map((s, i) => <Check key={i} text={s} />)}
        </Section>

        <Section title="Present Employment:">
          {present.map((e, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between text-sm font-bold">
                <span>{e.company}{e.location ? ` | ${e.location}` : ''}</span>
                <span className="font-normal">{e.start_date} - Till date</span>
              </div>
              <p className="text-sm italic mb-1">{e.title}</p>
              <p className="text-sm font-semibold underline mb-1">Responsibilities</p>
              {e.responsibilities?.map((r, j) => <Check key={j} text={r} />)}
            </div>
          ))}
        </Section>

        <Section title="Past Employment:">
          {past.map((e, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between text-sm font-bold">
                <span>{e.company}{e.location ? ` | ${e.location}` : ''}</span>
                <span className="font-normal">{e.start_date} – {e.end_date}</span>
              </div>
              <p className="text-sm italic mb-1">{e.title}</p>
              <p className="text-sm font-semibold underline mb-1">Responsibilities</p>
              {e.responsibilities?.map((r, j) => <Check key={j} text={r} />)}
            </div>
          ))}
        </Section>

        {/* Contact Info Section - At the very end */}
        <div className="mt-8 pt-4 border-t border-gray-200">
           <h3 className="text-sm font-bold text-engrity-navy underline mb-2 uppercase tracking-wide">Contact Information:</h3>
           <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex gap-2">
                <span className="font-bold text-engrity-navy">Email:</span>
                <span>{resume.email || 'N/A'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-engrity-navy">Phone:</span>
                <span>{resume.phone || 'N/A'}</span>
              </div>
              {resume.address && (
                <div className="flex gap-2 col-span-2">
                  <span className="font-bold text-engrity-navy">Address:</span>
                  <span>{resume.address}</span>
                </div>
              )}
           </div>
        </div>
      </div>
    </>
  );
}