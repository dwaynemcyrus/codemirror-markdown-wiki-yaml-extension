import { Decoration, ViewPlugin } from '@codemirror/view';

/**
 * Custom extension to highlight all selected lines (only when editor is focused)
 */
const selectedLineDecoration = Decoration.line({ class: 'cm-selectedLine' });

export const highlightSelectedLines = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = this.buildDecorations(view);
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.focusChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view) {
      // Only highlight when editor is focused
      if (!view.hasFocus) {
        return Decoration.none;
      }

      const decorations = [];
      const selectedLines = new Set();
      const state = view.state;

      for (const range of state.selection.ranges) {
        const startLine = state.doc.lineAt(range.from).number;
        const endLine = state.doc.lineAt(range.to).number;
        for (let i = startLine; i <= endLine; i++) {
          selectedLines.add(i);
        }
      }

      for (const lineNum of selectedLines) {
        const line = state.doc.line(lineNum);
        decorations.push(selectedLineDecoration.range(line.from));
      }

      return Decoration.set(decorations, true);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
