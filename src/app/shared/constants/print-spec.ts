/** Keep in sync with resuradar-api/src/config/print-spec.js */
export const PAGE_HEIGHT_MM = 297;
export const MARGIN_MM = 12;
export const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - 2 * MARGIN_MM;

/** CSS length: 1mm ≈ 96/25.4 px at 96dpi */
export function mmToPx(mm: number): number {
  return (mm * 96) / 25.4;
}
