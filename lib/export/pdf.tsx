import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path, renderToBuffer } from '@react-pdf/renderer';
import type { Resume } from '@/types/resume';
import path from 'path';
import fs from 'fs';

const BLUE = '#0071FE';
const NAVY = '#070B20';
const GRAY = '#808080';

const styles = StyleSheet.create({
  page: { 
    paddingTop: 150, 
    paddingBottom: 60, 
    paddingHorizontal: 50, 
    fontSize: 10, 
    color: NAVY, 
    fontFamily: 'Helvetica' 
  },
  // Fixed Repeating Header
  headerContainer: { position: 'absolute', top: 40, left: 50, right: 50 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 65, height: 65, marginRight: 15 },
  headerText: { flex: 1, alignItems: 'center' },
  headerName: { fontSize: 13, fontWeight: 'bold', fontFamily: 'Times-Bold' },
  rule: { borderBottomWidth: 1.5, borderBottomColor: BLUE, marginTop: 5, width: '100%' },
  
  // Fixed Repeating Watermark
  watermark: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    width: '80%',
    opacity: 0.12, 
    zIndex: -1,
  },

  // Content Styles
  sectionTitle: { fontSize: 11, fontWeight: 'bold', textDecoration: 'underline', marginTop: 15, marginBottom: 8, textTransform: 'uppercase' },
  bulletRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
  bulletText: { flex: 1, lineHeight: 1.3 },
  
  // Employment Styles
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  companyName: { fontWeight: 'bold', fontSize: 11 },
  jobTitle: { fontStyle: 'italic', marginBottom: 4 },
  respLabel: { fontWeight: 'bold', textDecoration: 'underline', marginTop: 6, marginBottom: 4 },

  // Final Contact Box
  contactBox: { marginTop: 30, borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingTop: 15 },
  pageNumber: { position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: GRAY }
});

function CheckMark() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" style={{ marginRight: 6, marginTop: 2 }}>
      <Path d="M4 12.5L9.5 18L20 6" stroke={BLUE} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function Bullet({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View style={styles.bulletRow}>
      <CheckMark />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export function ResumePdfDocument({ resume }: { resume: Resume }) {
  let logoBase64 = "";
  let wmBase64 = "";
  try {
    logoBase64 = `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public/engrity-logo.png')).toString('base64')}`;
    wmBase64 = `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public/watermark.png')).toString('base64')}`;
  } catch (e) {}

  const present = resume.employment.filter(e => e.is_present);
  const past = resume.employment.filter(e => !e.is_present);

  return (
    <Document title={`Resume - ${resume.candidate_name}`}>
      <Page size="LETTER" style={styles.page}>
        {wmBase64 && <Image src={wmBase64} style={styles.watermark} fixed />}

        <View style={styles.headerContainer} fixed>
          <View style={styles.headerRow}>
            {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
            <View style={styles.headerText}>
              <Text style={{ fontSize: 16, color: GRAY, fontFamily: 'Times-Roman' }}>Resume</Text>
              <Text style={styles.headerName}>{resume.candidate_name} – {resume.designation || resume.job_title}</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', fontFamily: 'Times-Bold' }}>Engrity Inspection Services – Engrity Group Inc.</Text>
              <View style={styles.rule} />
            </View>
            <View style={{ width: 65 }} />
          </View>
        </View>

        {/* --- PROFILE --- */}
        <Text style={styles.sectionTitle}>Profile:</Text>
        <Text style={{ lineHeight: 1.4, marginBottom: 10 }}>{resume.profile_summary}</Text>

        {/* --- CERTS & EDUCATION --- */}
        <Text style={styles.sectionTitle}>Certification & Education:</Text>
        {resume.certifications?.map((c: any, i) => <Bullet key={`c-${i}`} text={typeof c === 'string' ? c : c.name} />)}
        {resume.education?.map((e, i) => <Bullet key={`e-${i}`} text={`${e.credential}${e.institution ? ` — ${e.institution}` : ''}`} />)}

        {/* --- TICKETS & SKILLS --- */}
        {resume.safety_tickets?.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Safety Tickets:</Text>
            {resume.safety_tickets.map((t, i) => <Bullet key={`t-${i}`} text={t} />)}
          </View>
        )}

        {resume.skills?.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Skills:</Text>
            {resume.skills.map((s, i) => <Bullet key={`s-${i}`} text={s} />)}
          </View>
        )}

        {/* --- PRESENT EMPLOYMENT --- */}
        {present.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Present Employment:</Text>
            {present.map((e, i) => (
              <View key={`pres-${i}`} wrap={false} style={{ marginBottom: 15 }}>
                <View style={styles.jobHeader}>
                  <Text style={styles.companyName}>{e.company}{e.location ? ` | ${e.location}` : ''}</Text>
                  <Text>{e.start_date} - Till date</Text>
                </View>
                <Text style={styles.jobTitle}>{e.title}</Text>
                <Text style={styles.respLabel}>Responsibilities</Text>
                {e.responsibilities.map((r, idx) => <Bullet key={idx} text={r} />)}
              </View>
            ))}
          </View>
        )}

        {/* --- PAST EMPLOYMENT --- */}
        {past.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Past Employment:</Text>
            {past.map((e, i) => (
              <View key={`past-${i}`} wrap={false} style={{ marginBottom: 15 }}>
                <View style={styles.jobHeader}>
                  <Text style={styles.companyName}>{e.company}{e.location ? ` | ${e.location}` : ''}</Text>
                  <Text>{e.start_date} – {e.end_date}</Text>
                </View>
                <Text style={styles.jobTitle}>{e.title}</Text>
                <Text style={styles.respLabel}>Responsibilities</Text>
                {e.responsibilities.map((r, idx) => <Bullet key={idx} text={r} />)}
              </View>
            ))}
          </View>
        )}

        {/* --- CONTACT INFO --- */}
        <View style={styles.contactBox} wrap={false}>
          <Text style={styles.sectionTitle}>Contact Information:</Text>
          <View style={{ flexDirection: 'row', gap: 30 }}>
            <Text><Text style={{ fontWeight: 'bold' }}>Email:</Text> {resume.email || 'N/A'}</Text>
            <Text><Text style={{ fontWeight: 'bold' }}>Phone:</Text> {resume.phone || 'N/A'}</Text>
          </View>
          {resume.address && <Text style={{ marginTop: 5 }}><Text style={{ fontWeight: 'bold' }}>Address:</Text> {resume.address}</Text>}
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

export async function buildResumePdf(resume: Resume): Promise<Buffer> {
  return await renderToBuffer(<ResumePdfDocument resume={resume} />);
}