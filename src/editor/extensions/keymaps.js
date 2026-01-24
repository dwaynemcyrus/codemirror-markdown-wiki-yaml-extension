import { keymap } from '@codemirror/view';
import { actions } from '../../toolbar/actions.js';

export const markdownKeymap = keymap.of([
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
