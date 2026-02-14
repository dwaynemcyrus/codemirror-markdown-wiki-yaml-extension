export function createNoteIndex(notes = []) {
  const entries = notes.map((note) => ({
    title: note.title,
    aliases: Array.isArray(note.aliases) ? note.aliases : [],
    normalizedTitle: note.title.toLowerCase(),
    normalizedAliases: Array.isArray(note.aliases)
      ? note.aliases.map((alias) => alias.toLowerCase())
      : [],
  }));

  return {
    search(query) {
      const needle = query.trim().toLowerCase();
      if (!needle) {
        return entries;
      }

      const scored = entries
        .map((entry) => {
          const titleIndex = entry.normalizedTitle.indexOf(needle);
          const aliasIndex = entry.normalizedAliases.length
            ? Math.min(
                ...entry.normalizedAliases
                  .map((alias) => alias.indexOf(needle))
                  .filter((index) => index !== -1)
              )
            : -1;
          const bestIndex = Math.min(
            titleIndex === -1 ? Number.POSITIVE_INFINITY : titleIndex,
            aliasIndex === -1 ? Number.POSITIVE_INFINITY : aliasIndex
          );
          return { entry, score: bestIndex };
        })
        .filter((result) => Number.isFinite(result.score))
        .sort((a, b) => a.score - b.score);

      return scored.map((result) => result.entry);
    },

    resolve(title) {
      const needle = title.trim().toLowerCase();
      return (
        entries.find((entry) => entry.normalizedTitle === needle) ||
        entries.find((entry) => entry.normalizedAliases.includes(needle)) ||
        null
      );
    },
  };
}

function defaultFormatLink(note) {
  return `${note.title}]]`;
}

export function resolveWikiLink(noteIndex, link) {
  if (!noteIndex || !link || !link.title) return null;
  return noteIndex.resolve(link.title);
}

export function wikiLinkAutocomplete({ noteIndex, formatLink } = {}) {
  const format = typeof formatLink === 'function' ? formatLink : defaultFormatLink;

  return (context) => {
    if (!noteIndex) return null;
    const match = context.matchBefore(/\[\[[^\[\]\n]*$/);
    if (!match) return null;

    const query = match.text.slice(2);
    const results = noteIndex.search(query);
    const options = results.map((note) => ({
      label: note.title,
      detail: note.aliases.length ? `aliases: ${note.aliases.join(', ')}` : undefined,
      apply: format(note),
      type: 'text',
    }));

    return {
      from: match.from + 2,
      to: match.to,
      options,
      validFor: /^[^\[\]\n]*$/,
    };
  };
}
