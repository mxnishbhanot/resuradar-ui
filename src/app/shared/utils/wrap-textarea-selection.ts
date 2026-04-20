const HEX6 = /^#[0-9a-fA-F]{6}$/;

/** Expand #rgb to #rrggbb for storage consistency. */
export function normalizeHex6(hex: string): string | null {
  const t = hex.trim();
  if (t.length === 4 && /^#[0-9a-fA-F]{3}$/i.test(t)) {
    return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`.toLowerCase();
  }
  if (HEX6.test(t)) return t.toLowerCase();
  return null;
}

/**
 * Wraps the current textarea selection with `[color:#hex]…[/color]` markers
 * (parsed by the PDF `fmt` helper). Returns null if there is no selection.
 */
export function wrapTextareaSelection(
  value: string,
  start: number,
  end: number,
  hex: string
): { value: string; caret: number } | null {
  if (start === end || start < 0 || end > value.length || start > end) return null;
  const safe = normalizeHex6(hex.startsWith('#') ? hex : `#${hex}`);
  if (!safe) return null;
  const open = `[color:${safe}]`;
  const close = '[/color]';
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);
  const next = before + open + selected + close + after;
  const caret = start + open.length + selected.length + close.length;
  return { value: next, caret };
}
