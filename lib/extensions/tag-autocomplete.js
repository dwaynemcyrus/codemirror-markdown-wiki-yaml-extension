import { autocompletion } from '@codemirror/autocomplete';

/**
 * Tag autocomplete extension for the hybrid markdown editor.
 * Triggers after typing `#` and provides tag suggestions from a user-supplied list.
 *
 * @param {Object} options
 * @param {string[]} options.tags - Array of tag names (without #), e.g. ['javascript', 'project/active', 'todo']
 * @returns {Extension} CodeMirror extension
 *
 * @example
 * import { tagAutocomplete } from 'codemirror-for-writers';
 *
 * const extensions = [
 *   tagAutocomplete({ tags: ['javascript', 'project/active', 'todo'] }),
 * ];
 */
export function tagAutocomplete({ tags = [] } = {}) {
  if (!tags.length) return [];

  const source = (context) => {
    const match = context.matchBefore(/#[\w/-]*$/);
    if (!match) return null;

    // Don't trigger inside code blocks or at line start (headings)
    const line = context.state.doc.lineAt(match.from);
    const lineText = line.text;

    // Skip if this looks like a heading (line starts with #)
    if (/^#{1,6}\s/.test(lineText)) return null;

    const query = match.text.slice(1).toLowerCase();

    const options = tags
      .filter((tag) => tag.toLowerCase().includes(query))
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        // Prioritize prefix matches
        const aStarts = aLower.startsWith(query) ? 0 : 1;
        const bStarts = bLower.startsWith(query) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return aLower.localeCompare(bLower);
      })
      .map((tag) => ({
        label: `#${tag}`,
        apply: `#${tag}`,
        type: 'keyword',
      }));

    return {
      from: match.from,
      to: match.to,
      options,
      validFor: /^#[\w/-]*$/,
    };
  };

  return autocompletion({
    override: [source],
  });
}
