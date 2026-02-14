/**
 * Word Count / Character Count / Reading Time Panel
 *
 * A bottom status bar showing live writing statistics:
 * - Word count
 * - Character count (with and without spaces)
 * - Estimated reading time
 * - Selection stats when text is selected
 */

import { showPanel } from '@codemirror/view';

/**
 * Compute document and selection statistics
 */
function computeStats(doc, selection) {
  const text = doc.toString();
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const readingTime = Math.max(1, Math.ceil(words / 238));

  let selWords = 0;
  let selChars = 0;
  const hasSelection = selection && !selection.main.empty;

  if (hasSelection) {
    const selText = doc.sliceString(selection.main.from, selection.main.to);
    selWords = selText.split(/\s+/).filter(w => w.length > 0).length;
    selChars = selText.length;
  }

  return { words, chars, charsNoSpaces, readingTime, selWords, selChars, hasSelection };
}

/**
 * Format reading time as a human-readable string
 */
function formatReadingTime(minutes) {
  if (minutes < 1) return '< 1 min read';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}

/**
 * Create a stat element (label + value)
 */
function createStat(label, value) {
  const stat = document.createElement('span');
  stat.className = 'cm-word-count-stat';

  const valueEl = document.createElement('span');
  valueEl.className = 'cm-word-count-value';
  valueEl.textContent = value;

  const labelEl = document.createElement('span');
  labelEl.className = 'cm-word-count-label';
  labelEl.textContent = ` ${label}`;

  stat.appendChild(valueEl);
  stat.appendChild(labelEl);
  return stat;
}

/**
 * Create a divider between stats
 */
function createDivider() {
  const div = document.createElement('span');
  div.className = 'cm-word-count-divider';
  return div;
}

/**
 * Create the word count panel extension
 */
function wordCountPanelFactory(view) {
  const dom = document.createElement('div');
  dom.className = 'cm-word-count-panel';

  function render(state) {
    const stats = computeStats(state.doc, state.selection);
    dom.textContent = '';

    dom.appendChild(createStat('words', stats.words.toLocaleString()));
    dom.appendChild(createDivider());
    dom.appendChild(createStat('characters', stats.chars.toLocaleString()));
    dom.appendChild(createDivider());
    dom.appendChild(createStat('', formatReadingTime(stats.readingTime)));

    if (stats.hasSelection) {
      dom.appendChild(createDivider());

      const selStat = document.createElement('span');
      selStat.className = 'cm-word-count-stat cm-word-count-selection';

      const selValue = document.createElement('span');
      selValue.className = 'cm-word-count-value';
      selValue.textContent = `${stats.selWords} words, ${stats.selChars} chars`;

      const selLabel = document.createElement('span');
      selLabel.className = 'cm-word-count-label';
      selLabel.textContent = ' selected';

      selStat.appendChild(selValue);
      selStat.appendChild(selLabel);
      dom.appendChild(selStat);
    }
  }

  render(view.state);

  return {
    dom,
    top: false,
    update(update) {
      if (update.docChanged || update.selectionSet) {
        render(update.state);
      }
    },
  };
}

/**
 * The word count panel extension.
 * Use with a Compartment for toggling.
 */
export const wordCountPanel = showPanel.of(wordCountPanelFactory);
