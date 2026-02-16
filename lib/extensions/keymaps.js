import { keymap } from '@codemirror/view';
import { actions } from './actions.js';
import {
  setTypewriterEffect,
  setFocusModeEffect,
  writingModeField,
} from './writing-mode-state.js';

export const markdownKeymap = keymap.of([
  {
    key: 'Mod-Shift-t',
    run: (view) => {
      const current = view.state.field(writingModeField).typewriter;
      view.dispatch({ effects: setTypewriterEffect.of(!current) });
      return true;
    },
  },
  {
    key: 'Mod-Shift-f',
    run: (view) => {
      const current = view.state.field(writingModeField).focusMode;
      view.dispatch({ effects: setFocusModeEffect.of(!current) });
      return true;
    },
  },
  {
    key: 'Mod-b',
    run: (view) => {
      actions.bold(view);
      return true;
    },
  },
  {
    key: 'Mod-i',
    run: (view) => {
      actions.italic(view);
      return true;
    },
  },
  {
    key: 'Mod-k',
    run: (view) => {
      actions.link(view);
      return true;
    },
  },
  {
    key: 'Mod-`',
    run: (view) => {
      actions.inlineCode(view);
      return true;
    },
  },
  {
    key: 'Mod-Shift-`',
    run: (view) => {
      actions.codeBlock(view);
      return true;
    },
  },
]);
