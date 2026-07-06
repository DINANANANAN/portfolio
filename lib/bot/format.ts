export interface InlineSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

/**
 * Tokenizes a single line of WhatsApp-style markdown into plain/bold/italic
 * segments. Only handles non-nested `*bold*` and `_italic_` spans, which is
 * all the bot produces. Unmatched or rogue markers pass through as literal
 * text — this must never throw.
 */
export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  // Matches a *bold* span or an _italic_ span (non-nested, no empty content).
  const pattern = /\*([^*]+)\*|_([^_]+)_/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      segments.push({ text: match[1], bold: true });
    } else if (match[2] !== undefined) {
      segments.push({ text: match[2], italic: true });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ text: "" });
  }

  return segments;
}
