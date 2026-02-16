# Integration Guide (React / Next.js)

This guide shows a minimal integration of `codemirror-for-writers` in a client component.

## Install

```bash
npm install codemirror-for-writers @codemirror/state @codemirror/view @codemirror/lang-markdown @codemirror/commands @codemirror/search
```

Optional peers (only if used):

```bash
npm install @codemirror/autocomplete katex mermaid
```

## Minimal Editor Component

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { hybridMarkdown, moreMenu, toggleToolbar, isToolbar } from 'codemirror-for-writers';

type Props = {
  value?: string;
  onChange?: (next: string) => void;
};

export function MarkdownEditor({ value = '', onChange }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        hybridMarkdown({
          theme: 'light',
          enableWikiLinks: true,
          enableTags: true,
          wordCount: true,
          frontmatterKeys: ['title', 'date', 'tags', 'draft'],
        }),
        moreMenu({
          items: [
            { label: 'Toolbar', handler: (v) => toggleToolbar(v), getState: (v) => isToolbar(v) },
          ],
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: rootRef.current });
    viewRef.current = view;

    return () => view.destroy();
  }, [onChange, value]);

  return <div ref={rootRef} style={{ minHeight: 420 }} />;
}
```

## Common Runtime Toggles

```ts
import {
  toggleTheme,
  toggleHybridMode,
  toggleReadOnly,
  toggleToolbar,
  toggleFrontmatterSheet,
} from 'codemirror-for-writers';

toggleTheme(view);
toggleHybridMode(view);
toggleReadOnly(view);
toggleToolbar(view);
toggleFrontmatterSheet(view);
```

## Autocomplete (Wiki Links + Tags)

```ts
import { autocompletion } from '@codemirror/autocomplete';
import {
  createNoteIndex,
  wikiLinkAutocomplete,
  tagAutocomplete,
} from 'codemirror-for-writers';

const noteIndex = createNoteIndex([
  { title: 'Project Plan', aliases: ['Plan'] },
  { title: 'Meeting Notes' },
]);

const autocompleteExt = autocompletion({
  override: [
    wikiLinkAutocomplete({ noteIndex }),
    tagAutocomplete({ tags: ['writing', 'project/active', 'todo'] }),
  ],
});
```

## Next.js Notes

- Use a client component (`'use client'`) for editor creation.
- If needed, lazy-load the editor component with `next/dynamic` and `ssr: false`.
- Keep editor CSS loaded in your app layout or client bundle.
