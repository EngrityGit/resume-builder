import type { FontId } from '@/types/resume';

export interface FontOption {
  id: FontId;
  label: string;
  /** Font name to hand to docx — Word resolves this to whatever's installed locally. */
  docxFont: string;
  /** CSS font-family for the live web preview. */
  cssFont: string;
  /** Google Fonts CSS URL used to load the family for the live preview. */
  googleFontsCssUrl?: string;
  /** Direct TTF URLs (regular/bold) for @react-pdf/renderer Font.register — PDFs can't use system fonts. */
  pdf: { regular: string; bold: string };
}

// Times New Roman and Arial aren't distributable, so PDF embedding uses the
// metric-compatible, freely-licensed Google Fonts equivalents (Tinos / Arimo).
// Word export uses the real font names directly — nearly every Office install has them.
export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'times-new-roman',
    label: 'Times New Roman',
    docxFont: 'Times New Roman',
    cssFont: "'Tinos', 'Times New Roman', serif",
    googleFontsCssUrl: 'https://fonts.googleapis.com/css2?family=Tinos:wght@400;700&display=swap',
    pdf: {
      regular: 'https://fonts.gstatic.com/s/tinos/v23/buE4poGnedXvwjX-EQ-1a1I.ttf',
      bold: 'https://fonts.gstatic.com/s/tinos/v23/buE2poGnedXvwj1AtA-jr3ov6Sc.ttf',
    },
  },
  {
    id: 'plus-jakarta-sans',
    label: 'Plus Jakarta Sans',
    docxFont: 'Plus Jakarta Sans',
    cssFont: "'Plus Jakarta Sans', sans-serif",
    googleFontsCssUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap',
    pdf: {
      regular: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU7NSg.ttf',
      bold: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU7NSg.ttf',
    },
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    docxFont: 'Open Sans',
    cssFont: "'Open Sans', sans-serif",
    googleFontsCssUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap',
    pdf: {
      regular: 'https://fonts.gstatic.com/s/opensans/v40/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVIUwaEQbjA.ttf',
      bold: 'https://fonts.gstatic.com/s/opensans/v40/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVIUwaEQbjA.ttf',
    },
  },
  {
    id: 'inter',
    label: 'Inter',
    docxFont: 'Inter',
    cssFont: "'Inter', sans-serif",
    googleFontsCssUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
    pdf: {
      regular: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.ttf',
      bold: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1JL7SUc.ttf',
    },
  },
  {
    id: 'poppins',
    label: 'Poppins',
    docxFont: 'Poppins',
    cssFont: "'Poppins', sans-serif",
    googleFontsCssUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap',
    pdf: {
      regular: 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.ttf',
      bold: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.ttf',
    },
  },
  {
    id: 'calibri',
    label: 'Calibri',
    docxFont: 'Calibri',
    cssFont: "'Carlito', 'Calibri', sans-serif",
    pdf: {
      // Carlito isn't reliably hosted on the Google Fonts CDN — fall back to a
      // metrically-similar humanist sans (PT Sans) for PDF; Word export still uses real Calibri.
      regular: 'https://fonts.gstatic.com/s/ptsans/v17/jizaRExUiTo99u79D0-ExdGM.ttf',
      bold: 'https://fonts.gstatic.com/s/ptsans/v17/jizfRExUiTo99u79B_mh0O6tLR8a5g.ttf',
    },
  },
  {
    id: 'arial',
    label: 'Arial',
    docxFont: 'Arial',
    cssFont: "'Arimo', 'Arial', sans-serif",
    googleFontsCssUrl: 'https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap',
    pdf: {
      regular: 'https://fonts.gstatic.com/s/arimo/v29/P5sPzZCDf9_T_3cV7NCUECyoxNk37cxsCki-Ir5nx7VYAA.ttf',
      bold: 'https://fonts.gstatic.com/s/arimo/v29/P5sFzZCDf9_T_3cV7NCUECyoxNk37cxsCki-IyyRxbtclV4B_A.ttf',
    },
  },
];

export const DEFAULT_FONT: FontId = 'plus-jakarta-sans';
export const HEADER_FONT: FontId = 'times-new-roman'; // header always renders Times New Roman per the Engrity standard

export function getFont(id?: FontId): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS.find((f) => f.id === DEFAULT_FONT)!;
}
