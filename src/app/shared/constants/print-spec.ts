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
/** Printable content width inside Playwright margins (matches injected `body.rr-resume` max-width). */
export const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - 2 * MARGIN_MM;
export const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - 2 * MARGIN_MM;

/** CSS length: 1mm ≈ 96/25.4 px at 96dpi */
export function mmToPx(mm: number): number {
  return (mm * 96) / 25.4;
}
