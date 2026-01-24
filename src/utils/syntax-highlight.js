import { highlightTree, classHighlighter } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';

const languageMap = {
  javascript: javascript,
  js: javascript,
  typescript: () => javascript({ typescript: true }),
  ts: () => javascript({ typescript: true }),
  jsx: () => javascript({ jsx: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  python: python,
  py: python,
  css: css,
  html: html,
  json: json,
};

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlightCode(code, language) {
  const langFn = languageMap[language?.toLowerCase()];

  if (!langFn) {
    return escapeHtml(code);
  }

  const lang = typeof langFn === 'function' ? langFn() : langFn();
  const tree = lang.language.parser.parse(code);

  let result = '';
  let pos = 0;

  highlightTree(tree, classHighlighter, (from, to, classes) => {
    if (from > pos) {
      result += escapeHtml(code.slice(pos, from));
    }
    result += `<span class="${classes}">${escapeHtml(code.slice(from, to))}</span>`;
    pos = to;
  });

  if (pos < code.length) {
    result += escapeHtml(code.slice(pos));
  }

  return result;
}

export function getSupportedLanguages() {
  return Object.keys(languageMap);
}
