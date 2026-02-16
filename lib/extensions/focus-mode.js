import { ViewPlugin, Decoration } from '@codemirror/view';
import { RangeSet } from '@codemirror/state';

const unfocusedLine = Decoration.line({ class: 'cm-unfocused-line' });

/**
 * Find the paragraph boundaries (blank-line delimited) around a position.
 * Returns { from: lineNumber, to: lineNumber } (1-based line numbers).
 */
function findParagraphRange(doc, pos) {
  const line = doc.lineAt(pos);
  let from = line.number;
  let to = line.number;

  // Walk up to find first blank line or start of doc
  while (from > 1) {
    const prev = doc.line(from - 1);
    if (prev.text.trim() === '') break;
    from--;
  }

  // Walk down to find next blank line or end of doc
  while (to < doc.lines) {
    const next = doc.line(to + 1);
    if (next.text.trim() === '') break;
    to++;
  }

  return { from, to };
}

/**
 * Find the sentence boundaries around a position.
 * Returns { from: lineNumber, to: lineNumber } (1-based line numbers).
 * A sentence ends at `. `, `! `, `? ` or at a blank line boundary.
 */
function findSentenceRange(doc, pos) {
  const fullText = doc.toString();

  // Find sentence start: walk backwards from pos to find sentence boundary
  let sentenceStart = 0;
  for (let i = pos - 1; i >= 0; i--) {
    const ch = fullText[i];
    // Check for sentence-ending punctuation followed by space (we're at the space or after)
    if ((ch === '.' || ch === '!' || ch === '?') && i + 1 < fullText.length && /\s/.test(fullText[i + 1])) {
      sentenceStart = i + 1;
      // Skip whitespace after punctuation
      while (sentenceStart < pos && /\s/.test(fullText[sentenceStart])) sentenceStart++;
      break;
    }
    // Blank line = paragraph boundary = sentence boundary
    if (ch === '\n' && i > 0 && fullText[i - 1] === '\n') {
      sentenceStart = i + 1;
      break;
    }
  }

  // Find sentence end: walk forward from pos
  let sentenceEnd = fullText.length;
  for (let i = pos; i < fullText.length; i++) {
    const ch = fullText[i];
    if ((ch === '.' || ch === '!' || ch === '?') && (i + 1 >= fullText.length || /\s/.test(fullText[i + 1]))) {
      sentenceEnd = i + 1;
      break;
    }
    // Blank line boundary
    if (ch === '\n' && i + 1 < fullText.length && fullText[i + 1] === '\n') {
      sentenceEnd = i;
      break;
    }
  }

  // Convert character offsets to line numbers
  const fromLine = doc.lineAt(Math.max(0, sentenceStart)).number;
  const toLine = doc.lineAt(Math.min(fullText.length, Math.max(sentenceStart, sentenceEnd - 1))).number;

  return { from: fromLine, to: toLine };
}

/**
 * Create a focus mode plugin configured for a specific level and intensity.
 * @param {'line'|'sentence'|'paragraph'} level - Focus granularity
 * @param {number} intensity - Dim intensity 0-100 (higher = more dim)
 * @returns {ViewPlugin}
 */
export function createFocusModePlugin(level = 'paragraph', intensity = 30) {
  return ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.setIntensity(view, intensity);
        this.decorations = this.buildDecorations(view);
      }

      update(update) {
        if (
          update.selectionSet ||
          update.docChanged ||
          update.focusChanged
        ) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      setIntensity(view, value) {
        // Convert intensity (0-100, higher=more dim) to opacity (0-1, lower=more dim)
        const opacity = Math.max(0, Math.min(1, 1 - value / 100));
        view.dom.style.setProperty('--cm-unfocused-opacity', String(opacity));
      }

      buildDecorations(view) {
        if (!view.hasFocus) {
          return RangeSet.empty;
        }

        const doc = view.state.doc;
        const activeLines = new Set();

        for (const range of view.state.selection.ranges) {
          let result;
          if (level === 'line') {
            const line = doc.lineAt(range.head);
            result = { from: line.number, to: line.number };
          } else if (level === 'sentence') {
            result = findSentenceRange(doc, range.head);
          } else {
            result = findParagraphRange(doc, range.head);
          }
          for (let i = result.from; i <= result.to; i++) {
            activeLines.add(i);
          }
        }

        const decorations = [];
        for (let i = 1; i <= doc.lines; i++) {
          if (!activeLines.has(i)) {
            const line = doc.line(i);
            decorations.push(unfocusedLine.range(line.from));
          }
        }

        return RangeSet.of(decorations);
      }

      destroy() {
        // Clean up CSS variable
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

/**
 * Focus mode plugin - dims all paragraphs except the one(s) containing cursors.
 * Applies `cm-unfocused-line` decoration to non-active lines.
 * Only active when the editor has focus.
 * @deprecated Use createFocusModePlugin() for configurable focus levels
 */
export const focusModePlugin = createFocusModePlugin('paragraph', 30);
