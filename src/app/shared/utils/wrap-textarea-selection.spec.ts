import { normalizeHex6, wrapTextareaSelection } from './wrap-textarea-selection';

describe('wrapTextareaSelection', () => {
  it('wraps selection with color markers', () => {
    const r = wrapTextareaSelection('hello world', 6, 11, '#2563eb');
    expect(r?.value).toBe('hello [color:#2563eb]world[/color]');
    expect(r?.caret).toBe(r!.value.length);
  });

  it('returns null for empty selection', () => {
    expect(wrapTextareaSelection('abc', 1, 1, '#000000')).toBeNull();
  });
});

describe('normalizeHex6', () => {
  it('expands 3-digit hex', () => {
    expect(normalizeHex6('#03f')).toBe('#0033ff');
  });
});
