'use client';

/**
 * Extracts plain text from an uploaded resume file entirely in the browser,
 * so the server only ever receives text (never has to parse binary formats).
 *
 * - .txt           -> read directly
 * - .pdf           -> pdfjs-dist, page by page
 * - .docx          -> mammoth
 * - .doc (legacy)  -> NOT reliably parseable client-side (it's a binary OLE2
 *   format, not XML like .docx). We attempt a best-effort text scrape and
 *   flag the result as low-confidence rather than silently failing; for
 *   production use, route .doc through a server-side conversion step
 *   (e.g. LibreOffice headless `soffice --convert-to docx`) before parsing.
 */
export async function extractResumeText(file: File): Promise<{ text: string; lowConfidence?: boolean }> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'txt') {
    return { text: await file.text() };
  }

  if (ext === 'pdf') {
    return { text: await extractPdfText(file) };
  }

  if (ext === 'docx') {
    return { text: await extractDocxText(file) };
  }

  if (ext === 'doc') {
    return { text: await bestEffortLegacyDocText(file), lowConfidence: true };
  }

  throw new Error(`Unsupported file type: .${ext}. Upload a PDF, Word (.doc/.docx), or .txt file.`);
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    fullText += `${content.items.map((item: any) => item.str).join(' ')}\n\n`;
  }
  return fullText.trim();
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value.trim();
}

/** Crude fallback: scans the legacy binary .doc for printable ASCII/UTF-16 runs. Good enough to feed the AI parser, not for display. */
async function bestEffortLegacyDocText(file: File): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const decoder = new TextDecoder('utf-16le', { fatal: false });
  const text = decoder.decode(buffer);
  const printable = text.replace(/[^\x20-\x7E\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return printable;
}
