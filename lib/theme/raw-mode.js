import { EditorView } from '@codemirror/view';

/**
 * Raw mode theme - overrides selected line styling
 * In raw mode, lines are not inverted, just use monospace everywhere
 */
export const rawModeTheme = EditorView.theme({
  // Use monospace font everywhere in raw mode
  '.cm-scroller, .cm-content, .cm-line': {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace !important',
  },

  // No inversion on selected lines - just subtle highlight
  '.cm-selectedLine, .cm-selectedLine.cm-code-block-line': {
    backgroundColor: 'rgba(0, 0, 0, 0.05) !important',
    color: 'inherit !important',
    caretColor: '#333 !important',
    filter: 'none !important',
    borderRadius: '0',
    fontSize: 'inherit !important',
  },
});

/**
 * Raw mode dark variant
 */
export const rawModeDarkTheme = EditorView.theme({
  // Use monospace font everywhere in raw mode
  '.cm-scroller, .cm-content, .cm-line': {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace !important',
  },

  // Dark mode: subtle highlight
  '.cm-selectedLine, .cm-selectedLine.cm-code-block-line': {
    backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
    color: 'inherit !important',
    caretColor: '#fff !important',
    filter: 'none !important',
    borderRadius: '0',
    fontSize: 'inherit !important',
  },
});
