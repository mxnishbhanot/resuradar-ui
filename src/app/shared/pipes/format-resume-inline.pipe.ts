import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function expandHex3(h: string): string {
  if (h.length === 4) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
}

/** Mirrors `resuradar-api/src/config/text-format.js` `formatInlineText` for safe builder previews. */
@Pipe({ name: 'formatResumeInline', standalone: true })
export class FormatResumeInlinePipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (value == null || value === '') {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    let t = escapeHtml(String(value));

    t = t.replace(/\[color:(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6})\]([\s\S]*?)\[\/color\]/gi, (_, hex: string, inner: string) => {
      if (!HEX.test(hex)) return inner;
      const safe = expandHex3(hex);
      return `<span style="color:${safe}">${inner}</span>`;
    });

    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(
      /__([^_]+)__/g,
      '<span style="text-decoration:underline;text-underline-offset:2px">$1</span>'
    );
    t = t.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    t = t.replace(
      /`([^`]+)`/g,
      '<code style="font-family:ui-monospace,monospace;font-size:0.9em;background:rgba(0,0,0,0.06);padding:0.05em 0.25em;border-radius:2px">$1</code>'
    );

    return this.sanitizer.bypassSecurityTrustHtml(t);
  }
}
