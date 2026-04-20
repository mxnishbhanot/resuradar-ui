/** Keep in sync with resuradar-api/src/config/print-spec.js */
export const STANDARD_RESUME_COLORS = {
  light: {
    ink: '#171717',
    heading: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
    bg: '#ffffff',
    soft: '#f8fafc',
    link: '#334155',
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

export const PAGE_HEIGHT_MM = 297;
export const MARGIN_MM = 14;
export const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - 2 * MARGIN_MM;

/** CSS length: 1mm ≈ 96/25.4 px at 96dpi */
export function mmToPx(mm: number): number {
  return (mm * 96) / 25.4;
}
