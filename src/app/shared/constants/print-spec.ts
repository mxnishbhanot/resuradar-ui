/** Keep in sync with resuradar-api/src/config/print-spec.js */
export const STANDARD_RESUME_COLORS = {
  light: {
    ink: '#000000',
    heading: '#000000',
    muted: '#333333',
    border: '#cccccc',
    bg: '#ffffff',
    soft: '#ffffff',
    link: '#0563c1',
  },
  dark: {
    ink: '#f1f5f9',
    heading: '#f8fafc',
    muted: '#94a3b8',
    border: '#334155',
    bg: '#0f172a',
    soft: '#1e293b',
    link: '#e2e8f0',
  },
} as const;

export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
export const MARGIN_MM = 14;
export const INNER_PAD_X_MM = 5;
export const INNER_PAD_Y_MM = 5;
export const PDF_MARGIN_X_MM = MARGIN_MM + INNER_PAD_X_MM;
export const PDF_MARGIN_Y_MM = MARGIN_MM + INNER_PAD_Y_MM;

/** Printable content box inside Playwright margins (matches injected `body.rr-resume` max-width). */
export const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - 2 * PDF_MARGIN_X_MM;
export const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - 2 * PDF_MARGIN_Y_MM;

/** CSS length: 1mm ≈ 96/25.4 px at 96dpi */
export function mmToPx(mm: number): number {
  return (mm * 96) / 25.4;
}
