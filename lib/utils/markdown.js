import MarkdownIt from 'markdown-it';
import { full as markdownItEmoji } from 'markdown-it-emoji';
import katex from 'katex';

export const CUSTOM_TASK_TYPES = ['i', '!', '?', '*', '>', '<'];

const CUSTOM_TASK_META = {
  i: { emoji: '🧠', label: 'Idea', className: 'idea' },
  '!': { emoji: '⚠️', label: 'Urgent', className: 'urgent' },
  '?': { emoji: '❓', label: 'Question', className: 'question' },
  '*': { emoji: '⭐', label: 'Important', className: 'important' },
  '>': { emoji: '➡️', label: 'Forwarded', className: 'forwarded' },
  '<': { emoji: '📅', label: 'Scheduled', className: 'scheduled' },
};

const WIKI_LINK_OPEN = '[[';
const WIKI_LINK_CLOSE = ']]';

function isTrimmed(value) {
  return value === value.trim();
}

function parseWikiLinkContent(content) {
  if (!content || !isTrimmed(content)) return null;
  if (content.includes('\n')) return null;
  if (content.includes('[') || content.includes(']')) return null;

  const pipeIndex = content.indexOf('|');
  const target = pipeIndex === -1 ? content : content.slice(0, pipeIndex);
  const alias = pipeIndex === -1 ? null : content.slice(pipeIndex + 1);

  if (!target || (alias !== null && (!alias || !isTrimmed(alias)))) return null;

  const hashIndex = target.indexOf('#');
  const title = hashIndex === -1 ? target : target.slice(0, hashIndex);
  const section = hashIndex === -1 ? null : target.slice(hashIndex + 1);

  if (!title || !isTrimmed(title)) return null;
  if (section !== null && (!section || !isTrimmed(section))) return null;

  const display = alias ?? (section ?? title);

  return {
    raw: `${WIKI_LINK_OPEN}${content}${WIKI_LINK_CLOSE}`,
    title,
    section,
    alias,
    display,
  };
}

function findClosingBackticks(text, start, tickCount) {
  const ticks = '`'.repeat(tickCount);
  return text.indexOf(ticks, start + tickCount);
}

export function findWikiLinks(text) {
  const matches = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === '`') {
      let tickCount = 1;
      while (text[i + tickCount] === '`') {
        tickCount += 1;
      }
      const end = findClosingBackticks(text, i, tickCount);
      if (end === -1) {
        i += tickCount;
        continue;
      }
      i = end + tickCount;
      continue;
    }

    if (text.startsWith(WIKI_LINK_OPEN, i)) {
      const end = text.indexOf(WIKI_LINK_CLOSE, i + 2);
      if (end === -1) {
        i += 2;
        continue;
      }

      const content = text.slice(i + 2, end);
      const meta = parseWikiLinkContent(content);
      if (meta) {
        matches.push({ from: i, to: end + 2, meta });
        i = end + 2;
        continue;
      }

      i += 2;
      continue;
    }

    i += 1;
  }

  return matches;
}

const FIND_TAGS_REGEX = /(?:^|(?<=\s))#([a-zA-Z][\w/-]*)/g;

/**
 * Find all tags in a line of text, returning their positions
 * Skips tags inside backtick code spans
 */
export function findTags(text) {
  const matches = [];
  // First, find code span ranges to exclude
  const codeRanges = [];
  let tickMatch;
  const tickRegex = /`+/g;
  while ((tickMatch = tickRegex.exec(text)) !== null) {
    const tickCount = tickMatch[0].length;
    const closePos = findClosingBackticks(text, tickMatch.index, tickCount);
    if (closePos !== -1) {
      codeRanges.push({ from: tickMatch.index, to: closePos + tickCount });
      tickRegex.lastIndex = closePos + tickCount;
    }
  }

  const isInCode = (pos) => codeRanges.some(r => pos >= r.from && pos < r.to);

  FIND_TAGS_REGEX.lastIndex = 0;
  let m;
  while ((m = FIND_TAGS_REGEX.exec(text)) !== null) {
    const hashPos = m.index + (m[0].startsWith('#') ? 0 : m[0].indexOf('#'));
    if (!isInCode(hashPos)) {
      matches.push({ from: hashPos, to: hashPos + 1 + m[1].length, tag: m[1] });
    }
  }

  return matches;
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: false,
});

md.use(markdownItEmoji);

function addWikiLinkRule(markdown) {
  markdown.inline.ruler.before('link', 'wikilink', (state, silent) => {
    if (!state.env || state.env.enableWikiLinks !== true) return false;

    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x5b || state.src.charCodeAt(start + 1) !== 0x5b) {
      return false;
    }

    const end = state.src.indexOf(WIKI_LINK_CLOSE, start + 2);
    if (end === -1) return false;

    const content = state.src.slice(start + 2, end);
    const meta = parseWikiLinkContent(content);
    if (!meta) return false;

    if (!silent) {
      const token = state.push('wikilink', '', 0);
      token.meta = meta;
    }

    state.pos = end + 2;
    return true;
  });

  markdown.renderer.rules.wikilink = (tokens, idx) => {
    const meta = tokens[idx].meta || {};
    const escape = markdown.utils.escapeHtml;
    const attrs = [
      'class="md-wikilink"',
      `data-wikilink="${escape(meta.raw || '')}"`,
      `data-wikilink-title="${escape(meta.title || '')}"`,
    ];

    if (meta.section) {
      attrs.push(`data-wikilink-section="${escape(meta.section)}"`);
    }
    if (meta.alias) {
      attrs.push(`data-wikilink-alias="${escape(meta.alias)}"`);
    }

    const label = escape(meta.display || meta.title || '');
    return `<span ${attrs.join(' ')}>${label}</span>`;
  };
}

// Tag regex: #tag or #tag/subtag, must have at least one letter
const TAG_REGEX = /^#([a-zA-Z][\w/-]*)/;

function addTagRule(markdown) {
  markdown.inline.ruler.before('link', 'tag', (state, silent) => {
    if (!state.env || state.env.enableTags !== true) return false;

    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x23) return false; // #

    // Must be at start of string or preceded by whitespace
    if (start > 0) {
      const prev = state.src.charCodeAt(start - 1);
      // Space, tab, newline, or start of line
      if (prev !== 0x20 && prev !== 0x09 && prev !== 0x0a && prev !== 0x0d) return false;
    }

    const remaining = state.src.slice(start);
    const match = remaining.match(TAG_REGEX);
    if (!match) return false;

    const tagName = match[1];

    if (!silent) {
      const token = state.push('tag', '', 0);
      token.meta = { tag: tagName };
    }

    state.pos = start + 1 + tagName.length;
    return true;
  });

  markdown.renderer.rules.tag = (tokens, idx) => {
    const meta = tokens[idx].meta || {};
    const escape = markdown.utils.escapeHtml;
    const tagName = escape(meta.tag || '');
    return `<span class="md-tag" data-tag="${tagName}">#${tagName}</span>`;
  };
}

function addInlineMathRule(markdown) {
  markdown.inline.ruler.before('escape', 'katex_inline', (state, silent) => {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x24) return false; // $
    if (state.src.charCodeAt(start + 1) === 0x24) return false; // $$

    let end = start + 1;
    while ((end = state.src.indexOf('$', end)) !== -1) {
      if (state.src.charCodeAt(end - 1) !== 0x5c) break; // ignore escaped $
      end += 1;
    }

    if (end === -1) return false;

    const content = state.src.slice(start + 1, end);
    if (!content || content.includes('\n')) return false;

    if (!silent) {
      const token = state.push('math_inline', '', 0);
      token.content = content;
    }

    state.pos = end + 1;
    return true;
  });

  markdown.renderer.rules.math_inline = (tokens, idx) => {
    try {
      return katex.renderToString(tokens[idx].content, { displayMode: false, throwOnError: false });
    } catch (e) {
      return tokens[idx].content;
    }
  };
}

function addHighlightRule(markdown) {
  markdown.inline.ruler.before('emphasis', 'highlight', (state, silent) => {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x3d || state.src.charCodeAt(start + 1) !== 0x3d) {
      return false; // ==
    }

    let end = start + 2;
    while ((end = state.src.indexOf('==', end)) !== -1) {
      if (end > start + 2) break;
      end += 2;
    }

    if (end === -1) return false;

    const content = state.src.slice(start + 2, end);
    if (!content || content.includes('\n')) return false;

    if (!silent) {
      const token = state.push('mark_open', 'mark', 1);
      token.attrSet('class', 'md-highlight');
      markdown.inline.parse(content, markdown, state.env, state.tokens);
      state.push('mark_close', 'mark', -1);
    }

    state.pos = end + 2;
    return true;
  });
}

function addSubscriptRule(markdown) {
  markdown.inline.ruler.before('emphasis', 'subscript', (state, silent) => {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x7e) return false; // ~
    if (state.src.charCodeAt(start + 1) === 0x7e) return false; // ~~

    let end = start + 1;
    while ((end = state.src.indexOf('~', end)) !== -1) {
      if (state.src.charCodeAt(end - 1) === 0x5c) {
        end += 1;
        continue;
      }
      if (state.src.charCodeAt(end + 1) === 0x7e) {
        end += 1;
        continue;
      }
      break;
    }

    if (end === -1) return false;

    const content = state.src.slice(start + 1, end);
    if (!content || content.includes('\n')) return false;

    if (!silent) {
      const token = state.push('sub_open', 'sub', 1);
      token.attrSet('class', 'md-subscript');
      markdown.inline.parse(content, markdown, state.env, state.tokens);
      state.push('sub_close', 'sub', -1);
    }

    state.pos = end + 1;
    return true;
  });
}

function addSuperscriptRule(markdown) {
  markdown.inline.ruler.before('emphasis', 'superscript', (state, silent) => {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x5e) return false; // ^
    if (state.src.charCodeAt(start + 1) === 0x5e) return false; // ^^ (ignore)

    let end = start + 1;
    while ((end = state.src.indexOf('^', end)) !== -1) {
      if (state.src.charCodeAt(end - 1) === 0x5c) {
        end += 1;
        continue;
      }
      break;
    }

    if (end === -1) return false;

    const content = state.src.slice(start + 1, end);
    if (!content || content.includes('\n')) return false;

    if (!silent) {
      const token = state.push('sup_open', 'sup', 1);
      token.attrSet('class', 'md-superscript');
      markdown.inline.parse(content, markdown, state.env, state.tokens);
      state.push('sup_close', 'sup', -1);
    }

    state.pos = end + 1;
    return true;
  });
}

function addFootnoteReferenceRule(markdown) {
  markdown.inline.ruler.before('link', 'footnote_ref', (state, silent) => {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x5b) return false; // [
    if (state.src.charCodeAt(start + 1) !== 0x5e) return false; // ^

    const end = state.src.indexOf(']', start + 2);
    if (end === -1) return false;

    const id = state.src.slice(start + 2, end);
    if (!id) return false;

    if (!silent) {
      const token = state.push('footnote_ref', '', 0);
      token.meta = { id };
    }

    state.pos = end + 1;
    return true;
  });

  markdown.renderer.rules.footnote_ref = (tokens, idx) => {
    const id = tokens[idx].meta.id;
    return `<sup class="footnote-ref"><span class="footnote-link" data-footnote="${id}">[${id}]</span></sup>`;
  };
}

addInlineMathRule(md);
addHighlightRule(md);
addSubscriptRule(md);
addSuperscriptRule(md);
addFootnoteReferenceRule(md);
addWikiLinkRule(md);
addTagRule(md);

/**
 * Render block math $$...$$
 */
export function renderBlockMath(content) {
  try {
    return katex.renderToString(content, { displayMode: true, throwOnError: false });
  } catch (e) {
    return `<span class="math-error">${content}</span>`;
  }
}

/**
 * Render a footnote reference [^id]
 */
export function renderFootnoteRef(id) {
  return `<sup class="footnote-ref"><span class="footnote-link" data-footnote="${id}">[${id}]</span></sup>`;
}

/**
 * Render a footnote definition [^id]: content
 */
export function renderFootnoteDef(id, content, options = {}) {
  const rendered = renderInline(content, options);
  return `<span class="footnote-def">[${id}]: ${rendered} <span class="md-footnote-backref-link" data-footnote-ref="${id}" title="Back to reference">↩</span></span>`;
}

/**
 * Render inline content with extensions
 */
function renderInline(text, options = {}) {
  const env = {
    enableWikiLinks: options.enableWikiLinks === true,
    enableTags: options.enableTags === true,
  };
  return md.renderInline(text, env);
}

/**
 * Render a multi-line footnote definition block
 */
export function renderFootnoteBlock(id, lines, options = {}) {
  if (!lines.length) return '';
  const firstMatch = lines[0].match(/^\[\^([^\]]+)\]:\s*(.*)$/);
  const firstContent = firstMatch ? firstMatch[2] : lines[0];
  const parts = [];

  const firstRendered = renderInline(firstContent, options);
  parts.push(`<div class="md-footnote-line md-footnote-first">[${id}]: ${firstRendered}</div>`);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/^\s{2,}|\t/, '');
    const rendered = line.trim() ? renderInline(line, options) : '';
    parts.push(`<div class="md-footnote-line md-footnote-continuation">${rendered}</div>`);
  }

  parts.push(`<div class="md-footnote-backref"><span class="md-footnote-backref-link" data-footnote-ref="${id}" title="Back to reference">↩</span></div>`);

  return `<div class="md-footnote-block" data-footnote="${id}">${parts.join('')}</div>`;
}

/**
 * Render a definition list block (single term with one or more definitions)
 */
export function renderDefinitionList(lines, options = {}) {
  if (lines.length === 0) return '';
  const term = lines[0].trim();
  const definitions = [];
  let current = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const defMatch = line.match(/^\s*:\s*(.*)$/);
    if (defMatch) {
      if (current) {
        definitions.push(current);
      }
      current = [defMatch[1]];
      continue;
    }

    if (current) {
      const continuation = line.replace(/^\s{2,}|\t/, '');
      current.push(continuation);
    }
  }

  if (current) {
    definitions.push(current);
  }

  const termHtml = renderInline(term, options);
  const defHtml = definitions.map((defLines) => {
    const rendered = defLines.map((line) => renderInline(line, options)).join('<br>');
    return `<dd>${rendered}</dd>`;
  }).join('');

  return `<dl class="md-definition-list"><dt>${termHtml}</dt>${defHtml}</dl>`;
}

/**
 * Render a single line of markdown to HTML
 * Handles both block elements (headers) and inline elements
 */
export function renderMarkdownLine(content, options = {}) {
  if (!content.trim()) {
    return content;
  }

  const enableCustomTasks = options.enableCustomTasks === true;
  const customTaskTypes = Array.isArray(options.customTaskTypes)
    ? options.customTaskTypes
    : CUSTOM_TASK_TYPES;
  const customTaskSet = options.customTaskTypeSet ?? new Set(customTaskTypes);
  const enableWikiLinks = options.enableWikiLinks === true;
  const renderOptions = { ...options, enableWikiLinks };

  // Check if it's a footnote definition [^id]: content
  const footnoteDefMatch = content.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
  if (footnoteDefMatch) {
    return renderFootnoteDef(footnoteDefMatch[1], footnoteDefMatch[2], renderOptions);
  }

  // Check if it's a header line
  const headerMatch = content.match(/^(#{1,6})\s+(.*)$/);
  if (headerMatch) {
    const level = headerMatch[1].length;
    let text = headerMatch[2];
    let headingId = null;
    const idMatch = text.match(/^(.*)\s+(?:\[#([A-Za-z0-9_-]+)\]|\{#([A-Za-z0-9_-]+)\})\s*$/);
    if (idMatch) {
      text = idMatch[1];
      headingId = idMatch[2] || idMatch[3];
    }
    const idAttr = headingId ? ` id="${headingId}" data-heading-id="${headingId}"` : '';
    return `<span class="md-header md-h${level}"${idAttr}>${renderInline(text, renderOptions)}</span>`;
  }

  // Check if it's a blockquote
  if (content.startsWith('>')) {
    const text = content.replace(/^>\s*/, '');
    return `<span class="md-blockquote">${renderInline(text, renderOptions)}</span>`;
  }

  // Check if it's a list item
  const listMatch = content.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
  if (listMatch) {
    const marker = listMatch[2];
    const text = listMatch[3];
    // Check for task list
    const taskMatch = text.match(/^\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      const checked = taskMatch[1].toLowerCase() === 'x';
      const emoji = checked ? '✅' : '⬜️';
      const label = checked ? 'Completed' : 'Incomplete';
      const stateClass = checked ? 'complete' : 'incomplete';
      const token = checked ? 'x' : ' ';
      return `<span class="md-list-item md-task-item"><span class="md-list-marker">${marker}</span> <span class="md-task-icon md-task-${stateClass}" data-task="${token}" role="button" aria-label="${label}" title="${label}">${emoji}</span> ${renderInline(taskMatch[2], renderOptions)}</span>`;
    }

    if (enableCustomTasks) {
      const customTaskMatch = text.match(/^\[([!?>i*<])\]\s*(.*)$/);
      if (customTaskMatch) {
        const token = customTaskMatch[1];
        const meta = CUSTOM_TASK_META[token];
        if (meta && customTaskSet.has(token)) {
          return `<span class="md-list-item md-task-item"><span class="md-list-marker">${marker}</span> <span class="md-task-icon md-task-${meta.className}" data-task="${token}" role="button" aria-label="${meta.label}" title="${meta.label}">${meta.emoji}</span> ${renderInline(customTaskMatch[2], renderOptions)}</span>`;
        }
      }
    }
    return `<span class="md-list-item"><span class="md-list-marker">${marker}</span> ${renderInline(text, renderOptions)}</span>`;
  }

  // Check if it's a horizontal rule
  if (/^(-{3,}|_{3,}|\*{3,})$/.test(content.trim())) {
    return '<hr class="md-hr">';
  }

  // Check if it's a table row
  if (content.trim().startsWith('|') && content.trim().endsWith('|')) {
    const trimmed = content.trim();
    // Check if it's a separator row (|---|---|) - only contains |, -, :, and spaces
    if (/^\|[-:\s|]+\|$/.test(trimmed) && trimmed.includes('-')) {
      return `<span class="md-table-separator"></span>`;
    }
    // Parse cells
    const cells = trimmed.slice(1, -1).split('|').map(cell => cell.trim());
    const renderedCells = cells.map(cell => {
      return `<span class="md-table-cell">${renderInline(cell, renderOptions)}</span>`;
    }).join('');
    return `<span class="md-table-row">${renderedCells}</span>`;
  }

  // Default: render as inline markdown with extensions
  return renderInline(content, renderOptions);
}

/**
 * Render a full markdown document
 */
export function renderDocument(content, options = {}) {
  const env = {
    enableWikiLinks: options.enableWikiLinks === true,
  };
  return md.render(content, env);
}

/**
 * Render a table from an array of row strings
 */
export function renderTable(rows, options = {}) {
  if (rows.length === 0) return '';

  const parseRow = (row) => {
    const trimmed = row.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
    return trimmed.slice(1, -1).split('|').map(cell => cell.trim());
  };

  const isSeparator = (row) => {
    const trimmed = row.trim();
    return /^\|[-:\s|]+\|$/.test(trimmed) && trimmed.includes('-');
  };

  // Find header and body rows
  let headerRow = null;
  let bodyRows = [];
  let separatorFound = false;

  for (const row of rows) {
    if (isSeparator(row)) {
      separatorFound = true;
      continue;
    }

    const cells = parseRow(row);
    if (!cells) continue;

    if (!separatorFound && !headerRow) {
      headerRow = cells;
    } else {
      bodyRows.push(cells);
    }
  }

  // Build HTML table
  let html = '<table class="md-table">';

  if (headerRow) {
    html += '<thead><tr>';
    for (const cell of headerRow) {
      html += `<th>${renderInline(cell, options)}</th>`;
    }
    html += '</tr></thead>';
  }

  if (bodyRows.length > 0) {
    html += '<tbody>';
    for (const row of bodyRows) {
      html += '<tr>';
      for (const cell of row) {
        html += `<td>${renderInline(cell, options)}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
  }

  html += '</table>';
  return html;
}
