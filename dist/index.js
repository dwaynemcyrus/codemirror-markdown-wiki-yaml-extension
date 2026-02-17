import { ViewPlugin as N, Decoration as p, WidgetType as A, keymap as st, showPanel as we, EditorView as H, rectangularSelection as Ft, crosshairCursor as Nt } from "@codemirror/view";
import { Annotation as Dt, StateField as J, Facet as j, StateEffect as R, RangeSet as He, Compartment as P, EditorState as Q } from "@codemirror/state";
import { markdown as It } from "@codemirror/lang-markdown";
import { redo as Rt, undo as Bt, undoDepth as Wt, redoDepth as At, history as Pt, defaultKeymap as Ot, historyKeymap as $t } from "@codemirror/commands";
import { selectNextOccurrence as je, selectSelectionMatches as zt, openSearchPanel as _e, searchKeymap as Ht, search as jt } from "@codemirror/search";
import at from "js-yaml";
import _t from "markdown-it";
import { full as qt } from "markdown-it-emoji";
import ct from "katex";
import { highlightTree as Vt, classHighlighter as Kt } from "@lezer/highlight";
import { javascript as Y } from "@codemirror/lang-javascript";
import { python as qe } from "@codemirror/lang-python";
import { css as Ut } from "@codemirror/lang-css";
import { html as Yt } from "@codemirror/lang-html";
import { json as Xt } from "@codemirror/lang-json";
import lt from "mermaid";
const B = Dt.define(), dt = ["i", "!", "?", "*", ">", "<"], Gt = {
  i: { emoji: "🧠", label: "Idea", className: "idea" },
  "!": { emoji: "⚠️", label: "Urgent", className: "urgent" },
  "?": { emoji: "❓", label: "Question", className: "question" },
  "*": { emoji: "⭐", label: "Important", className: "important" },
  ">": { emoji: "➡️", label: "Forwarded", className: "forwarded" },
  "<": { emoji: "📅", label: "Scheduled", className: "scheduled" }
}, mt = "[[", xe = "]]";
function ie(e) {
  return e === e.trim();
}
function ft(e) {
  if (!e || !ie(e) || e.includes(`
`) || e.includes("[") || e.includes("]")) return null;
  const t = e.indexOf("|"), n = t === -1 ? e : e.slice(0, t), o = t === -1 ? null : e.slice(t + 1);
  if (!n || o !== null && (!o || !ie(o))) return null;
  const i = n.indexOf("#"), s = i === -1 ? n : n.slice(0, i), a = i === -1 ? null : n.slice(i + 1);
  if (!s || !ie(s) || a !== null && (!a || !ie(a))) return null;
  const r = o ?? a ?? s;
  return {
    raw: `${mt}${e}${xe}`,
    title: s,
    section: a,
    alias: o,
    display: r
  };
}
function ut(e, t, n) {
  const o = "`".repeat(n);
  return e.indexOf(o, t + n);
}
function Zt(e) {
  const t = [];
  let n = 0;
  for (; n < e.length; ) {
    if (e[n] === "`") {
      let o = 1;
      for (; e[n + o] === "`"; )
        o += 1;
      const i = ut(e, n, o);
      if (i === -1) {
        n += o;
        continue;
      }
      n = i + o;
      continue;
    }
    if (e.startsWith(mt, n)) {
      const o = e.indexOf(xe, n + 2);
      if (o === -1) {
        n += 2;
        continue;
      }
      const i = e.slice(n + 2, o), s = ft(i);
      if (s) {
        t.push({ from: n, to: o + 2, meta: s }), n = o + 2;
        continue;
      }
      n += 2;
      continue;
    }
    n += 1;
  }
  return t;
}
const Ve = new RegExp("(?:^|(?<=\\s))#([a-zA-Z][\\w/-]*)", "g");
function Jt(e) {
  const t = [], n = [];
  let o;
  const i = /`+/g;
  for (; (o = i.exec(e)) !== null; ) {
    const r = o[0].length, l = ut(e, o.index, r);
    l !== -1 && (n.push({ from: o.index, to: l + r }), i.lastIndex = l + r);
  }
  const s = (r) => n.some((l) => r >= l.from && r < l.to);
  Ve.lastIndex = 0;
  let a;
  for (; (a = Ve.exec(e)) !== null; ) {
    const r = a.index + (a[0].startsWith("#") ? 0 : a[0].indexOf("#"));
    s(r) || t.push({ from: r, to: r + 1 + a[1].length, tag: a[1] });
  }
  return t;
}
const O = new _t({
  html: !1,
  linkify: !0,
  breaks: !1,
  typographer: !1
});
O.use(qt);
function Qt(e) {
  e.inline.ruler.before("link", "wikilink", (t, n) => {
    if (!t.env || t.env.enableWikiLinks !== !0) return !1;
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 91 || t.src.charCodeAt(o + 1) !== 91)
      return !1;
    const i = t.src.indexOf(xe, o + 2);
    if (i === -1) return !1;
    const s = t.src.slice(o + 2, i), a = ft(s);
    if (!a) return !1;
    if (!n) {
      const r = t.push("wikilink", "", 0);
      r.meta = a;
    }
    return t.pos = i + 2, !0;
  }), e.renderer.rules.wikilink = (t, n) => {
    const o = t[n].meta || {}, i = e.utils.escapeHtml, s = [
      'class="md-wikilink"',
      `data-wikilink="${i(o.raw || "")}"`,
      `data-wikilink-title="${i(o.title || "")}"`
    ];
    o.section && s.push(`data-wikilink-section="${i(o.section)}"`), o.alias && s.push(`data-wikilink-alias="${i(o.alias)}"`);
    const a = i(o.display || o.title || "");
    return `<span ${s.join(" ")}>${a}</span>`;
  };
}
const en = /^#([a-zA-Z][\w/-]*)/;
function tn(e) {
  e.inline.ruler.before("link", "tag", (t, n) => {
    if (!t.env || t.env.enableTags !== !0) return !1;
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 35) return !1;
    if (o > 0) {
      const r = t.src.charCodeAt(o - 1);
      if (r !== 32 && r !== 9 && r !== 10 && r !== 13) return !1;
    }
    const s = t.src.slice(o).match(en);
    if (!s) return !1;
    const a = s[1];
    if (!n) {
      const r = t.push("tag", "", 0);
      r.meta = { tag: a };
    }
    return t.pos = o + 1 + a.length, !0;
  }), e.renderer.rules.tag = (t, n) => {
    const o = t[n].meta || {}, i = e.utils.escapeHtml, s = i(o.tag || "");
    return `<span class="md-tag" data-tag="${s}">#${s}</span>`;
  };
}
function nn(e) {
  e.inline.ruler.before("escape", "katex_inline", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 36 || t.src.charCodeAt(o + 1) === 36) return !1;
    let i = o + 1;
    for (; (i = t.src.indexOf("$", i)) !== -1 && t.src.charCodeAt(i - 1) === 92; )
      i += 1;
    if (i === -1) return !1;
    const s = t.src.slice(o + 1, i);
    if (!s || s.includes(`
`)) return !1;
    if (!n) {
      const a = t.push("math_inline", "", 0);
      a.content = s;
    }
    return t.pos = i + 1, !0;
  }), e.renderer.rules.math_inline = (t, n) => {
    try {
      return ct.renderToString(t[n].content, { displayMode: !1, throwOnError: !1 });
    } catch {
      return t[n].content;
    }
  };
}
function on(e) {
  e.inline.ruler.before("emphasis", "highlight", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 61 || t.src.charCodeAt(o + 1) !== 61)
      return !1;
    let i = o + 2;
    for (; (i = t.src.indexOf("==", i)) !== -1 && !(i > o + 2); )
      i += 2;
    if (i === -1) return !1;
    const s = t.src.slice(o + 2, i);
    return !s || s.includes(`
`) ? !1 : (n || (t.push("mark_open", "mark", 1).attrSet("class", "md-highlight"), e.inline.parse(s, e, t.env, t.tokens), t.push("mark_close", "mark", -1)), t.pos = i + 2, !0);
  });
}
function rn(e) {
  e.inline.ruler.before("emphasis", "subscript", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 126 || t.src.charCodeAt(o + 1) === 126) return !1;
    let i = o + 1;
    for (; (i = t.src.indexOf("~", i)) !== -1; ) {
      if (t.src.charCodeAt(i - 1) === 92) {
        i += 1;
        continue;
      }
      if (t.src.charCodeAt(i + 1) === 126) {
        i += 1;
        continue;
      }
      break;
    }
    if (i === -1) return !1;
    const s = t.src.slice(o + 1, i);
    return !s || s.includes(`
`) ? !1 : (n || (t.push("sub_open", "sub", 1).attrSet("class", "md-subscript"), e.inline.parse(s, e, t.env, t.tokens), t.push("sub_close", "sub", -1)), t.pos = i + 1, !0);
  });
}
function sn(e) {
  e.inline.ruler.before("emphasis", "superscript", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 94 || t.src.charCodeAt(o + 1) === 94) return !1;
    let i = o + 1;
    for (; (i = t.src.indexOf("^", i)) !== -1; ) {
      if (t.src.charCodeAt(i - 1) === 92) {
        i += 1;
        continue;
      }
      break;
    }
    if (i === -1) return !1;
    const s = t.src.slice(o + 1, i);
    return !s || s.includes(`
`) ? !1 : (n || (t.push("sup_open", "sup", 1).attrSet("class", "md-superscript"), e.inline.parse(s, e, t.env, t.tokens), t.push("sup_close", "sup", -1)), t.pos = i + 1, !0);
  });
}
function an(e) {
  e.inline.ruler.before("link", "footnote_ref", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 91 || t.src.charCodeAt(o + 1) !== 94) return !1;
    const i = t.src.indexOf("]", o + 2);
    if (i === -1) return !1;
    const s = t.src.slice(o + 2, i);
    if (!s) return !1;
    if (!n) {
      const a = t.push("footnote_ref", "", 0);
      a.meta = { id: s };
    }
    return t.pos = i + 1, !0;
  }), e.renderer.rules.footnote_ref = (t, n) => {
    const o = t[n].meta.id;
    return `<sup class="footnote-ref"><span class="footnote-link" data-footnote="${o}">[${o}]</span></sup>`;
  };
}
nn(O);
on(O);
rn(O);
sn(O);
an(O);
Qt(O);
tn(O);
function cn(e) {
  try {
    return ct.renderToString(e, { displayMode: !0, throwOnError: !1 });
  } catch {
    return `<span class="math-error">${e}</span>`;
  }
}
function ln(e, t, n = {}) {
  const o = D(t, n);
  return `<span class="footnote-def">[${e}]: ${o} <span class="md-footnote-backref-link" data-footnote-ref="${e}" title="Back to reference">↩</span></span>`;
}
function D(e, t = {}) {
  const n = {
    enableWikiLinks: t.enableWikiLinks === !0,
    enableTags: t.enableTags === !0
  };
  return O.renderInline(e, n);
}
function dn(e, t, n = {}) {
  if (!t.length) return "";
  const o = t[0].match(/^\[\^([^\]]+)\]:\s*(.*)$/), i = o ? o[2] : t[0], s = [], a = D(i, n);
  s.push(`<div class="md-footnote-line md-footnote-first">[${e}]: ${a}</div>`);
  for (let r = 1; r < t.length; r++) {
    const l = t[r].replace(/^\s{2,}|\t/, ""), c = l.trim() ? D(l, n) : "";
    s.push(`<div class="md-footnote-line md-footnote-continuation">${c}</div>`);
  }
  return s.push(`<div class="md-footnote-backref"><span class="md-footnote-backref-link" data-footnote-ref="${e}" title="Back to reference">↩</span></div>`), `<div class="md-footnote-block" data-footnote="${e}">${s.join("")}</div>`;
}
function mn(e, t = {}) {
  if (e.length === 0) return "";
  const n = e[0].trim(), o = [];
  let i = null;
  for (let r = 1; r < e.length; r++) {
    const l = e[r], c = l.match(/^\s*:\s*(.*)$/);
    if (c) {
      i && o.push(i), i = [c[1]];
      continue;
    }
    if (i) {
      const d = l.replace(/^\s{2,}|\t/, "");
      i.push(d);
    }
  }
  i && o.push(i);
  const s = D(n, t), a = o.map((r) => `<dd>${r.map((c) => D(c, t)).join("<br>")}</dd>`).join("");
  return `<dl class="md-definition-list"><dt>${s}</dt>${a}</dl>`;
}
function pt(e, t = {}) {
  if (!e.trim())
    return e;
  const n = t.enableCustomTasks === !0, o = Array.isArray(t.customTaskTypes) ? t.customTaskTypes : dt, i = t.customTaskTypeSet ?? new Set(o), s = t.enableWikiLinks === !0, a = { ...t, enableWikiLinks: s }, r = e.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
  if (r)
    return ln(r[1], r[2], a);
  const l = e.match(/^(#{1,6})\s+(.*)$/);
  if (l) {
    const d = l[1].length;
    let m = l[2], f = null;
    const u = m.match(/^(.*)\s+(?:\[#([A-Za-z0-9_-]+)\]|\{#([A-Za-z0-9_-]+)\})\s*$/);
    u && (m = u[1], f = u[2] || u[3]);
    const h = f ? ` id="${f}" data-heading-id="${f}"` : "";
    return `<span class="md-header md-h${d}"${h}>${D(m, a)}</span>`;
  }
  if (e.match(/^>\s*\[!/)) {
    const d = e.replace(/^>\s*/, "");
    return `<span class="md-blockquote">${D(d, a)}</span>`;
  }
  if (e.startsWith(">")) {
    const d = e.replace(/^>\s*/, "");
    return `<span class="md-blockquote">${D(d, a)}</span>`;
  }
  const c = e.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
  if (c) {
    const d = c[2], m = c[3], f = m.match(/^\[([ xX])\]\s*(.*)$/);
    if (f) {
      const u = f[1].toLowerCase() === "x", h = u ? "✅" : "⬜️", g = u ? "Completed" : "Incomplete";
      return `<span class="md-list-item md-task-item"><span class="md-list-marker">${d}</span> <span class="md-task-icon md-task-${u ? "complete" : "incomplete"}" data-task="${u ? "x" : " "}" role="button" aria-label="${g}" title="${g}">${h}</span> ${D(f[2], a)}</span>`;
    }
    if (n) {
      const u = m.match(/^\[([!?>i*<])\]\s*(.*)$/);
      if (u) {
        const h = u[1], g = Gt[h];
        if (g && i.has(h))
          return `<span class="md-list-item md-task-item"><span class="md-list-marker">${d}</span> <span class="md-task-icon md-task-${g.className}" data-task="${h}" role="button" aria-label="${g.label}" title="${g.label}">${g.emoji}</span> ${D(u[2], a)}</span>`;
      }
    }
    return `<span class="md-list-item"><span class="md-list-marker">${d}</span> ${D(m, a)}</span>`;
  }
  if (/^(-{3,}|_{3,}|\*{3,})$/.test(e.trim()))
    return '<hr class="md-hr">';
  if (e.trim().startsWith("|") && e.trim().endsWith("|")) {
    const d = e.trim();
    return /^\|[-:\s|]+\|$/.test(d) && d.includes("-") ? '<span class="md-table-separator"></span>' : `<span class="md-table-row">${d.slice(1, -1).split("|").map((u) => u.trim()).map((u) => `<span class="md-table-cell">${D(u, a)}</span>`).join("")}</span>`;
  }
  return D(e, a);
}
function fn(e, t = {}) {
  if (e.length === 0) return "";
  const n = (l) => {
    const c = l.trim();
    return !c.startsWith("|") || !c.endsWith("|") ? null : c.slice(1, -1).split("|").map((d) => d.trim());
  }, o = (l) => {
    const c = l.trim();
    return /^\|[-:\s|]+\|$/.test(c) && c.includes("-");
  };
  let i = null, s = [], a = !1;
  for (const l of e) {
    if (o(l)) {
      a = !0;
      continue;
    }
    const c = n(l);
    c && (!a && !i ? i = c : s.push(c));
  }
  let r = '<table class="md-table">';
  if (i) {
    r += "<thead><tr>";
    for (const l of i)
      r += `<th>${D(l, t)}</th>`;
    r += "</tr></thead>";
  }
  if (s.length > 0) {
    r += "<tbody>";
    for (const l of s) {
      r += "<tr>";
      for (const c of l)
        r += `<td>${D(c, t)}</td>`;
      r += "</tr>";
    }
    r += "</tbody>";
  }
  return r += "</table>", r;
}
const un = {
  javascript: Y,
  js: Y,
  typescript: () => Y({ typescript: !0 }),
  ts: () => Y({ typescript: !0 }),
  jsx: () => Y({ jsx: !0 }),
  tsx: () => Y({ jsx: !0, typescript: !0 }),
  python: qe,
  py: qe,
  css: Ut,
  html: Yt,
  json: Xt
};
function re(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function pn(e, t) {
  const n = un[t == null ? void 0 : t.toLowerCase()];
  if (!n)
    return re(e);
  const i = n().language.parser.parse(e);
  let s = "", a = 0;
  return Vt(i, Kt, (r, l, c) => {
    r > a && (s += re(e.slice(a, r))), s += `<span class="${c}">${re(e.slice(r, l))}</span>`, a = l;
  }), a < e.length && (s += re(e.slice(a))), s;
}
const ht = {
  note: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    color: "#448aff"
  },
  abstract: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
    color: "#00bcd4"
  },
  info: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    color: "#448aff"
  },
  tip: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 0 1-10 0c0-1.5.5-2 1-3 .5-1 2-3.5 4-5z"/><path d="M10 15v2a2 2 0 0 0 4 0v-2"/></svg>',
    color: "#00bcd4"
  },
  success: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    color: "#4caf50"
  },
  question: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    color: "#ff9800"
  },
  warning: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    color: "#ff9800"
  },
  failure: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    color: "#f44336"
  },
  danger: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    color: "#f44336"
  },
  bug: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="6" width="8" height="14" rx="4"/><path d="M19 10h2"/><path d="M3 10h2"/><path d="M19 14h2"/><path d="M3 14h2"/><path d="m21 6-2 2"/><path d="m3 6 2 2"/><path d="M12 2v4"/></svg>',
    color: "#f44336"
  },
  example: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    color: "#7c4dff"
  },
  quote: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>',
    color: "#9e9e9e"
  }
}, hn = {
  summary: "abstract",
  tldr: "abstract",
  hint: "tip",
  important: "tip",
  check: "success",
  done: "success",
  help: "question",
  faq: "question",
  caution: "warning",
  attention: "warning",
  fail: "failure",
  missing: "failure",
  error: "danger",
  cite: "quote"
};
function gn(e) {
  const t = e.toLowerCase(), n = hn[t] || t;
  return ht[n] ? n : "note";
}
const gt = j.define({
  combine(e) {
    return e.length > 0 ? e[e.length - 1] : !0;
  }
}), be = dt, kt = /^(\s*(?:[-*+]|\d+\.)\s+)\[([ xX!?>i*<])\]/;
function kn(e) {
  if (!Array.isArray(e))
    return [...be];
  const t = [], n = /* @__PURE__ */ new Set();
  for (const o of e) {
    if (typeof o != "string" || o.length === 0) continue;
    const i = o.toLowerCase();
    be.includes(i) && (n.has(i) || (n.add(i), t.push(i)));
  }
  return t;
}
function bn(e) {
  return [" ", "x", ...e];
}
function bt(e, t) {
  const n = kn(t);
  return {
    enableCustomTasks: e === !0,
    customTaskTypes: n,
    customTaskTypeSet: new Set(n),
    taskCycle: bn(n)
  };
}
const ce = j.define({
  combine(e) {
    return e.length === 0 ? bt(!1, be) : e[e.length - 1];
  }
});
function wt(e, t, n) {
  const o = e === !0;
  return {
    enableWikiLinks: o,
    renderWikiLinks: o && t !== !1,
    onWikiLinkClick: typeof n == "function" ? n : null
  };
}
const _ = j.define({
  combine(e) {
    return e.length === 0 ? wt(!1, !1, null) : e[e.length - 1];
  }
});
function xt(e, t) {
  return { enableTags: e === !0, onTagClick: typeof t == "function" ? t : null };
}
const de = j.define({
  combine(e) {
    return e.length === 0 ? xt(!1, null) : e[e.length - 1];
  }
});
function wn(e, t) {
  const n = e.match(kt);
  if (!n) return null;
  const o = n[2].toLowerCase();
  return o === " " || o === "x" || t.enableCustomTasks && t.customTaskTypeSet.has(o) ? o : null;
}
function xn(e, t) {
  if (!Array.isArray(t) || t.length === 0) return e;
  const n = t.indexOf(e);
  return n === -1 ? t[0] : t[(n + 1) % t.length];
}
function Cn(e, t) {
  return e.replace(kt, `$1[${t}]`);
}
function U(e) {
  return {
    raw: e.getAttribute("data-wikilink") || "",
    title: e.getAttribute("data-wikilink-title") || "",
    section: e.getAttribute("data-wikilink-section") || "",
    alias: e.getAttribute("data-wikilink-alias") || "",
    display: e.textContent || ""
  };
}
const Ce = R.define(), Ct = J.define({
  create() {
    return /* @__PURE__ */ new Set();
  },
  update(e, t) {
    let n = e;
    for (const o of t.effects)
      o.is(Ce) && (n = new Set(e), n.has(o.value) ? n.delete(o.value) : n.add(o.value));
    if (t.docChanged && n.size > 0) {
      const o = /* @__PURE__ */ new Set();
      for (const i of n) {
        const s = t.startState.doc;
        if (i <= s.lines) {
          const a = s.line(i), r = t.changes.mapPos(a.from), l = t.newDoc.lineAt(r).number, c = t.newDoc.line(l).text;
          /^#{1,6}\s/.test(c) && o.add(l);
        }
      }
      n = o;
    }
    return n;
  }
});
lt.initialize({
  startOnLoad: !1,
  theme: "base",
  securityLevel: "loose",
  themeVariables: {
    primaryColor: "#f5f5f5",
    secondaryColor: "#f5f5f5",
    tertiaryColor: "#f5f5f5",
    primaryBorderColor: "#ddd",
    secondaryBorderColor: "#ddd",
    tertiaryBorderColor: "#ddd",
    lineColor: "#aaa",
    edgeLabelBackground: "#fff"
  }
});
class yn extends A {
  constructor(t, n, o) {
    super(), this.content = t, this.lineFrom = n, this.lineTo = o;
  }
  toDOM(t) {
    const n = document.createElement("span");
    n.className = "cm-markdown-preview";
    const o = t.state.facet(ce), i = t.state.facet(_), s = t.state.facet(de);
    n.innerHTML = pt(this.content, {
      ...o,
      enableWikiLinks: i.renderWikiLinks,
      enableTags: s.enableTags
    });
    const a = this.lineFrom, r = this.lineTo, l = this.content;
    return n.addEventListener("mousedown", (c) => {
      const d = c.target.closest("[data-tag]");
      if (d && s.onTagClick) {
        c.preventDefault(), c.stopPropagation(), s.onTagClick(d.getAttribute("data-tag"));
        return;
      }
      const m = c.target.closest("[data-footnote]");
      if (m) {
        c.preventDefault(), c.stopPropagation();
        const C = m.getAttribute("data-footnote"), L = t.state.doc;
        for (let E = 1; E <= L.lines; E++) {
          const M = L.line(E);
          if (M.text.match(new RegExp(`^\\[\\^${C}\\]:`))) {
            t.dispatch({
              selection: { anchor: M.from },
              scrollIntoView: !0
            }), t.focus();
            return;
          }
        }
        return;
      }
      const f = c.target.closest("[data-footnote-ref]");
      if (f) {
        c.preventDefault(), c.stopPropagation();
        const C = f.getAttribute("data-footnote-ref"), L = t.state.doc;
        for (let E = 1; E <= L.lines; E++) {
          const M = L.line(E);
          if (M.text.match(new RegExp(`\\[\\^${C}\\](?!:)`))) {
            t.dispatch({
              selection: { anchor: M.from },
              scrollIntoView: !0
            }), t.focus();
            return;
          }
        }
        return;
      }
      const u = c.target.closest("[data-wikilink]");
      if (u && i.onWikiLinkClick) {
        c.preventDefault(), c.stopPropagation(), i.onWikiLinkClick(U(u));
        return;
      }
      const h = c.target.closest("a");
      if (h && h.href) {
        c.preventDefault(), c.stopPropagation(), window.open(h.href, "_blank", "noopener,noreferrer");
        return;
      }
      if (c.target.closest('input[type="checkbox"], .md-task-icon')) {
        c.preventDefault(), c.stopPropagation();
        const C = t.state.facet(ce), L = wn(l, C);
        if (!L)
          return;
        const E = C.enableCustomTasks ? xn(L, C.taskCycle) : L === "x" ? " " : "x", M = Cn(l, E);
        M !== l && t.dispatch({
          changes: { from: a, to: r, insert: M },
          annotations: B.of(!0)
        });
        return;
      }
      c.preventDefault(), c.stopPropagation();
      const b = n.getBoundingClientRect(), k = c.clientX - b.left, w = b.width, v = l.length;
      let x;
      if (w > 0 && v > 0) {
        const C = k / w;
        x = Math.round(C * v), x = Math.max(0, Math.min(x, v));
      } else
        x = 0;
      const y = a + x;
      t.dispatch({
        selection: { anchor: y },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.content === this.content && t.lineFrom === this.lineFrom && t.lineTo === this.lineTo;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
class vn extends A {
  constructor(t, n, o, i, s, a, r) {
    super(), this.content = t, this.lineFrom = n, this.lineTo = o, this.lineNumber = i, this.level = s, this.isCollapsed = a, this.hasContent = r;
  }
  toDOM(t) {
    const n = document.createElement("span");
    if (n.className = "cm-markdown-preview cm-heading-preview", this.hasContent) {
      const c = document.createElement("span");
      c.className = `cm-collapse-toggle ${this.isCollapsed ? "collapsed" : "expanded"}`, c.textContent = "›", c.title = this.isCollapsed ? "Expand" : "Collapse";
      const d = this.lineNumber;
      c.addEventListener("click", (m) => {
        m.preventDefault(), m.stopPropagation(), m.stopImmediatePropagation(), t.dispatch({
          effects: Ce.of(d)
        });
      }), c.addEventListener("mousedown", (m) => {
        m.preventDefault(), m.stopPropagation(), m.stopImmediatePropagation();
      }), n.appendChild(c);
    }
    const o = document.createElement("span"), i = t.state.facet(ce), s = t.state.facet(_), a = t.state.facet(de);
    o.innerHTML = pt(this.content, {
      ...i,
      enableWikiLinks: s.renderWikiLinks,
      enableTags: a.enableTags
    }), n.appendChild(o);
    const r = this.lineFrom;
    this.lineTo;
    const l = this.content;
    return o.addEventListener("mousedown", (c) => {
      const d = c.target.closest("[data-tag]");
      if (d && a.onTagClick) {
        c.preventDefault(), c.stopPropagation(), a.onTagClick(d.getAttribute("data-tag"));
        return;
      }
      const m = c.target.closest("[data-wikilink]");
      if (m && s.onWikiLinkClick) {
        c.preventDefault(), c.stopPropagation(), s.onWikiLinkClick(U(m));
        return;
      }
      const f = c.target.closest("a");
      if (f && f.href) {
        c.preventDefault(), c.stopPropagation(), window.open(f.href, "_blank", "noopener,noreferrer");
        return;
      }
      c.preventDefault(), c.stopPropagation();
      const u = o.getBoundingClientRect(), h = c.clientX - u.left, g = u.width, b = l.length;
      let k;
      if (g > 0 && b > 0) {
        const v = h / g;
        k = Math.round(v * b), k = Math.max(0, Math.min(k, b));
      } else
        k = 0;
      const w = r + k;
      t.dispatch({
        selection: { anchor: w },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.content === this.content && t.lineFrom === this.lineFrom && t.lineTo === this.lineTo && t.isCollapsed === this.isCollapsed && t.hasContent === this.hasContent;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
function W(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of e.selection.ranges) {
    const o = e.doc.lineAt(n.from).number, i = e.doc.lineAt(n.to).number;
    for (let s = o; s <= i; s++)
      t.add(s);
  }
  return t;
}
function Ln(e) {
  if (e.lines < 2 || e.line(1).text.trim() !== "---") return null;
  for (let n = 2; n <= e.lines; n++) {
    const o = e.line(n).text.trim();
    if (o === "---" || o === "...")
      return { start: 1, end: n };
  }
  return null;
}
function Sn(e) {
  const t = [];
  let n = !1, o = 0, i = "";
  for (let s = 1; s <= e.lines; s++) {
    const r = e.line(s).text;
    r.startsWith("```") && (n ? (t.push({ start: o, end: s, language: i }), n = !1, i = "") : (n = !0, o = s, i = r.slice(3).trim()));
  }
  return n && t.push({ start: o, end: e.lines, language: i }), t;
}
function En(e, t) {
  const n = [];
  let o = null;
  for (let i = 1; i <= e.lines; i++) {
    if (t.has(i)) {
      o !== null && (o = null);
      continue;
    }
    e.line(i).text.trim() === "$$" && (o === null ? o = i : (n.push({ start: o, end: i }), o = null));
  }
  return n;
}
function Tn(e, t) {
  const n = [];
  let o = null;
  for (let i = 1; i <= e.lines; i++) {
    if (t.has(i)) {
      o !== null && (n.push({ start: o, end: i - 1 }), o = null);
      continue;
    }
    const a = e.line(i).text.trim();
    a.startsWith("|") && a.endsWith("|") ? o === null && (o = i) : o !== null && (n.push({ start: o, end: i - 1 }), o = null);
  }
  return o !== null && n.push({ start: o, end: e.lines }), n;
}
function yt(e) {
  return /^(\s{2,}|\t)/.test(e);
}
function Mn(e, t) {
  const n = [];
  for (let o = 1; o <= e.lines; o++) {
    if (t.has(o)) continue;
    const s = e.line(o).text.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (!s) continue;
    const a = s[1];
    let r = o;
    for (let l = o + 1; l <= e.lines && !t.has(l); l++) {
      const c = e.line(l).text;
      if (!yt(c))
        break;
      r = l;
    }
    n.push({ start: o, end: r, id: a }), o = r;
  }
  return n;
}
function Fn(e, t, n) {
  const o = [], i = (a) => /^\s*:\s*/.test(a), s = (a) => {
    if (!a.trim() || /^\s/.test(a) || /^[-*+]\s+/.test(a) || /^\d+\.\s+/.test(a) || /^>/.test(a) || /^#{1,6}\s+/.test(a)) return !1;
    const r = a.trim();
    return !(r.startsWith("|") && r.endsWith("|") || /^\[\^([^\]]+)\]:/.test(a));
  };
  for (let a = 1; a <= e.lines; a++) {
    if (t.has(a) || n.has(a)) continue;
    const r = e.line(a).text;
    if (!s(r)) continue;
    const l = a + 1;
    if (l > e.lines || t.has(l) || n.has(l)) continue;
    const c = e.line(l).text;
    if (!i(c)) continue;
    let d = l;
    for (let m = l + 1; m <= e.lines && !(t.has(m) || n.has(m)); m++) {
      const f = e.line(m).text;
      if (i(f) || yt(f)) {
        d = m;
        continue;
      }
      break;
    }
    o.push({ start: a, end: d }), a = d;
  }
  return o;
}
function Nn(e, t) {
  const n = [], o = /^>\s*\[!(\w+)\]([+-])?\s*(.*)?$/;
  for (let i = 1; i <= e.lines; i++) {
    if (t.has(i)) continue;
    const a = e.line(i).text.match(o);
    if (!a) continue;
    const r = a[1].toLowerCase(), l = a[2] || null, c = a[3] || "", d = l === "+" || l === "-", m = l !== "-";
    let f = i;
    for (let u = i + 1; u <= e.lines && !(t.has(u) || !e.line(u).text.startsWith(">")); u++)
      f = u;
    n.push({ start: i, end: f, type: r, title: c, foldable: d, defaultOpen: m }), i = f;
  }
  return n;
}
function $(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of e)
    for (let o = n.start; o <= n.end; o++)
      t.add(o);
  return t;
}
function Dn(e, t) {
  const n = [];
  for (let o = 1; o <= e.lines; o++) {
    if (t.has(o)) continue;
    const s = e.line(o).text.match(/^(#{1,6})\s+/);
    s && n.push({
      line: o,
      level: s[1].length,
      endLine: e.lines
      // Will be adjusted in second pass
    });
  }
  for (let o = 0; o < n.length; o++) {
    const i = n[o];
    for (let s = o + 1; s < n.length; s++)
      if (n[s].level <= i.level) {
        i.endLine = n[s].line - 1;
        break;
      }
  }
  return n;
}
function In(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e)
    for (let o = n.line + 1; o <= n.endLine; o++)
      t.has(o) || t.set(o, n.line);
  return t;
}
const S = J.define({
  create(e) {
    return Ke(e.doc);
  },
  update(e, t) {
    return t.docChanged ? Ke(t.newDoc) : e;
  }
});
function Ke(e) {
  const t = Ln(e), n = t ? $([t]) : /* @__PURE__ */ new Set(), o = Sn(e), i = $(o), s = En(e, i), a = $(s), r = Tn(e, i), l = $(r), c = Mn(e, i), d = $(c), m = Fn(e, i, d), f = $(m), u = o.filter((v) => v.language === "mermaid"), h = $(u), g = Nn(e, i), b = $(g), k = Dn(e, i), w = In(k);
  return {
    frontmatter: t,
    frontmatterLines: n,
    codeBlocks: o,
    codeBlockLines: i,
    mathBlocks: s,
    mathBlockLines: a,
    tables: r,
    tableLines: l,
    footnoteBlocks: c,
    footnoteBlockLines: d,
    definitionLists: m,
    definitionListLines: f,
    mermaidBlocks: u,
    mermaidBlockLines: h,
    calloutBlocks: g,
    calloutBlockLines: b,
    headings: k,
    headingMap: w
  };
}
class Rn extends A {
  constructor(t, n, o) {
    super(), this.content = t, this.mathFrom = n, this.mathTo = o;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-math-preview", n.innerHTML = cn(this.content);
    const o = this.mathFrom;
    return n.addEventListener("mousedown", (i) => {
      i.preventDefault(), i.stopPropagation(), t.dispatch({
        selection: { anchor: o },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.content === this.content;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
class Bn extends A {
  constructor(t, n, o) {
    super(), this.content = t, this.mermaidFrom = n, this.mermaidTo = o, this.id = "mermaid-" + Math.random().toString(36).substr(2, 9);
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-mermaid-preview";
    const o = this.mermaidFrom, i = this.content, s = this.id;
    return (async () => {
      try {
        const { svg: a } = await lt.render(s, i);
        n.innerHTML = a;
      } catch (a) {
        n.innerHTML = `<pre class="mermaid-error">${a.message}</pre>`;
      }
    })(), n.addEventListener("mousedown", (a) => {
      a.preventDefault(), a.stopPropagation(), t.dispatch({
        selection: { anchor: o },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.content === this.content;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
class Wn extends A {
  constructor(t, n, o) {
    super(), this.rows = t, this.tableFrom = n, this.tableTo = o;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-table-preview";
    const o = t.state.facet(_);
    n.innerHTML = fn(this.rows, { enableWikiLinks: o.renderWikiLinks });
    const i = this.tableFrom;
    return n.addEventListener("mousedown", (s) => {
      const a = s.target.closest("[data-wikilink]");
      if (a && o.onWikiLinkClick) {
        s.preventDefault(), s.stopPropagation(), o.onWikiLinkClick(U(a));
        return;
      }
      s.preventDefault(), s.stopPropagation(), t.dispatch({
        selection: { anchor: i },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    if (t.rows.length !== this.rows.length) return !1;
    for (let n = 0; n < this.rows.length; n++)
      if (t.rows[n] !== this.rows[n]) return !1;
    return !0;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
class An extends A {
  constructor(t, n, o, i) {
    super(), this.id = t, this.lines = n, this.from = o, this.to = i;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-footnote-preview";
    const o = t.state.facet(_);
    n.innerHTML = dn(this.id, this.lines, { enableWikiLinks: o.renderWikiLinks });
    const i = this.from;
    return n.addEventListener("mousedown", (s) => {
      const a = s.target.closest("[data-wikilink]");
      if (a && o.onWikiLinkClick) {
        s.preventDefault(), s.stopPropagation(), o.onWikiLinkClick(U(a));
        return;
      }
      const r = s.target.closest("[data-footnote-ref]");
      if (r) {
        s.preventDefault(), s.stopPropagation();
        const l = r.getAttribute("data-footnote-ref"), c = t.state.doc;
        for (let d = 1; d <= c.lines; d++) {
          const m = c.line(d);
          if (m.text.match(new RegExp(`\\[\\^${l}\\](?!:)`))) {
            t.dispatch({
              selection: { anchor: m.from },
              scrollIntoView: !0
            }), t.focus();
            return;
          }
        }
      }
      s.preventDefault(), s.stopPropagation(), t.dispatch({
        selection: { anchor: i },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    if (t.id !== this.id || t.lines.length !== this.lines.length) return !1;
    for (let n = 0; n < this.lines.length; n++)
      if (t.lines[n] !== this.lines[n]) return !1;
    return !0;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
class Pn extends A {
  constructor(t, n, o) {
    super(), this.lines = t, this.from = n, this.to = o;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-definition-list-preview";
    const o = t.state.facet(_);
    n.innerHTML = mn(this.lines, { enableWikiLinks: o.renderWikiLinks });
    const i = this.from;
    return n.addEventListener("mousedown", (s) => {
      const a = s.target.closest("[data-wikilink]");
      if (a && o.onWikiLinkClick) {
        s.preventDefault(), s.stopPropagation(), o.onWikiLinkClick(U(a));
        return;
      }
      s.preventDefault(), s.stopPropagation(), t.dispatch({
        selection: { anchor: i },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    if (t.lines.length !== this.lines.length) return !1;
    for (let n = 0; n < this.lines.length; n++)
      if (t.lines[n] !== this.lines[n]) return !1;
    return !0;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
class On extends A {
  constructor(t, n, o, i, s, a, r) {
    super(), this.lines = t, this.type = n, this.title = o, this.foldable = i, this.defaultOpen = s, this.blockFrom = a, this.blockTo = r;
  }
  toDOM(t) {
    const n = gn(this.type), o = ht[n], i = t.state.facet(_), s = { enableWikiLinks: i.renderWikiLinks }, a = document.createElement("div");
    a.className = "cm-callout-preview", a.style.setProperty("--callout-color", o.color);
    const r = document.createElement("div");
    r.className = "cm-callout-title", r.innerHTML = o.icon;
    const l = document.createElement("span"), c = this.title || n.charAt(0).toUpperCase() + n.slice(1);
    l.innerHTML = D(c, s), r.appendChild(l);
    const d = document.createElement("div");
    d.className = "cm-callout-content";
    for (let f = 1; f < this.lines.length; f++) {
      const u = this.lines[f].replace(/^>\s?/, ""), h = document.createElement("p");
      h.innerHTML = u.trim() ? D(u, s) : "&nbsp;", d.appendChild(h);
    }
    if (this.foldable) {
      const f = document.createElement("span");
      f.className = "cm-callout-fold" + (this.defaultOpen ? "" : " collapsed"), f.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>', r.appendChild(f), this.defaultOpen || (d.style.display = "none"), r.style.cursor = "pointer", r.addEventListener("mousedown", (u) => {
        if (u.target.closest(".cm-callout-fold") || u.target === r || r.contains(u.target)) {
          u.preventDefault(), u.stopPropagation();
          const h = f.classList.toggle("collapsed");
          d.style.display = h ? "none" : "";
        }
      });
    }
    a.appendChild(r), this.lines.length > 1 && a.appendChild(d);
    const m = this.blockFrom;
    return this.foldable ? d.addEventListener("mousedown", (f) => {
      const u = f.target.closest("[data-wikilink]");
      if (u && i.onWikiLinkClick) {
        f.preventDefault(), f.stopPropagation(), i.onWikiLinkClick(U(u));
        return;
      }
      f.preventDefault(), f.stopPropagation(), t.dispatch({
        selection: { anchor: m },
        scrollIntoView: !0
      }), t.focus();
    }) : a.addEventListener("mousedown", (f) => {
      const u = f.target.closest("[data-wikilink]");
      if (u && i.onWikiLinkClick) {
        f.preventDefault(), f.stopPropagation(), i.onWikiLinkClick(U(u));
        return;
      }
      f.preventDefault(), f.stopPropagation(), t.dispatch({
        selection: { anchor: m },
        scrollIntoView: !0
      }), t.focus();
    }), a;
  }
  eq(t) {
    if (t.type !== this.type || t.title !== this.title || t.foldable !== this.foldable || t.defaultOpen !== this.defaultOpen || t.lines.length !== this.lines.length) return !1;
    for (let n = 0; n < this.lines.length; n++)
      if (t.lines[n] !== this.lines[n]) return !1;
    return !0;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
function $n(e, t, n) {
  for (const o of t)
    if (n.has(o.line) && e > o.line && e <= o.endLine)
      return !0;
  return !1;
}
function zn(e, t) {
  for (const n of t)
    if (n.line === e)
      return n;
  return null;
}
function Ue(e, t) {
  const { state: n } = e, i = e.hasFocus ? W(n) : /* @__PURE__ */ new Set(), {
    frontmatterLines: s,
    codeBlockLines: a,
    tableLines: r,
    mathBlockLines: l,
    footnoteBlockLines: c,
    definitionListLines: d,
    calloutBlockLines: m,
    headings: f
  } = t, u = [], h = n.facet(gt), g = h ? n.field(Ct) : /* @__PURE__ */ new Set();
  for (const { from: b, to: k } of e.visibleRanges) {
    const w = n.doc.lineAt(b).number, v = n.doc.lineAt(k).number;
    for (let x = w; x <= v; x++) {
      if (h && $n(x, f, g)) {
        const L = n.doc.line(x);
        u.push(
          p.line({ class: "cm-collapsed-line" }).range(L.from)
        );
        continue;
      }
      if (s.has(x) || i.has(x) || a.has(x) || r.has(x) || l.has(x) || c.has(x) || d.has(x) || m.has(x))
        continue;
      const y = n.doc.line(x), C = y.text;
      if (!vt(C) && C.trim()) {
        if (h) {
          const L = zn(x, f);
          if (L) {
            const E = L.endLine > L.line, M = g.has(x);
            u.push(
              p.replace({
                widget: new vn(
                  C,
                  y.from,
                  y.to,
                  x,
                  L.level,
                  M,
                  E
                ),
                inclusive: !1,
                block: !1
              }).range(y.from, y.to)
            );
            continue;
          }
        }
        u.push(
          p.replace({
            widget: new yn(C, y.from, y.to),
            inclusive: !1,
            block: !1
          }).range(y.from, y.to)
        );
      }
    }
  }
  return p.set(u, !0);
}
function Ye(e, t) {
  if (!e.state.facet(_).enableWikiLinks)
    return p.none;
  if (!e.hasFocus)
    return p.none;
  const { state: o } = e, i = W(o), { codeBlockLines: s } = t, a = [];
  for (const { from: r, to: l } of e.visibleRanges) {
    const c = o.doc.lineAt(r).number, d = o.doc.lineAt(l).number;
    for (let m = c; m <= d; m++) {
      if (!i.has(m) || s.has(m)) continue;
      const f = o.doc.line(m);
      if (!f.text.includes("[[")) continue;
      const u = Zt(f.text);
      for (const h of u)
        a.push(
          p.mark({ class: "cm-wikilink" }).range(
            f.from + h.from,
            f.from + h.to
          )
        );
    }
  }
  return p.set(a, !0);
}
const Hn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = Ue(e, t);
    }
    update(e) {
      const t = e.transactions.some(
        (n) => n.effects.some((o) => o.is(Ce))
      );
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged || t) {
        const n = e.state.field(S);
        this.decorations = Ue(e.view, n);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
), jn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = Ye(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged) {
        const t = e.state.field(S);
        this.decorations = Ye(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Xe(e, t) {
  if (!e.state.facet(de).enableTags)
    return p.none;
  if (!e.hasFocus)
    return p.none;
  const { state: o } = e, i = W(o), { codeBlockLines: s } = t, a = [];
  for (const { from: r, to: l } of e.visibleRanges) {
    const c = o.doc.lineAt(r).number, d = o.doc.lineAt(l).number;
    for (let m = c; m <= d; m++) {
      if (!i.has(m) || s.has(m)) continue;
      const f = o.doc.line(m);
      if (!f.text.includes("#")) continue;
      const u = Jt(f.text);
      for (const h of u)
        a.push(
          p.mark({ class: "cm-tag-mark" }).range(
            f.from + h.from,
            f.from + h.to
          )
        );
    }
  }
  return p.set(a, !0);
}
const _n = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = Xe(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged) {
        const t = e.state.field(S);
        this.decorations = Xe(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
class qn extends A {
  constructor(t, n, o, i) {
    super(), this.content = t, this.language = n, this.lineFrom = o, this.lineTo = i;
  }
  toDOM(t) {
    const n = document.createElement("span");
    n.className = "cm-highlighted-code", n.innerHTML = pn(this.content, this.language);
    const o = this.lineFrom;
    this.lineTo;
    const i = this.content;
    return n.addEventListener("mousedown", (s) => {
      s.preventDefault(), s.stopPropagation();
      const a = n.getBoundingClientRect(), r = s.clientX - a.left, l = a.width, c = i.length;
      let d = 0;
      if (l > 0 && c > 0) {
        const f = r / l;
        d = Math.round(f * c), d = Math.max(0, Math.min(d, c));
      }
      const m = o + d;
      t.dispatch({
        selection: { anchor: m },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.content === this.content && t.language === this.language;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
function Ge(e, t) {
  const { state: n } = e, o = e.hasFocus, i = [], { codeBlocks: s } = t, a = o ? W(n) : /* @__PURE__ */ new Set();
  for (const r of s) {
    if (r.language === "mermaid")
      continue;
    let l = !1;
    for (let d = r.start; d <= r.end; d++)
      if (a.has(d)) {
        l = !0;
        break;
      }
    const c = r.end - r.start > 1;
    for (let d = r.start; d <= r.end; d++) {
      const m = n.doc.line(d), f = d === r.start || d === r.end;
      if (f && !l && c) {
        i.push(
          p.replace({}).range(m.from, m.to)
        );
        continue;
      }
      const u = l ? "cm-code-block-line cm-code-block-focused" : "cm-code-block-line";
      i.push(
        p.line({ class: u }).range(m.from)
      );
      const h = a.has(d);
      !f && !h && m.text.length > 0 && i.push(
        p.replace({
          widget: new qn(m.text, r.language, m.from, m.to)
        }).range(m.from, m.to)
      );
    }
  }
  return p.set(i, !0);
}
const Vn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = Ge(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(S);
        this.decorations = Ge(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Ze(e, t) {
  const { state: n } = e, o = e.hasFocus, i = [], { tables: s } = t, a = o ? W(n) : /* @__PURE__ */ new Set();
  for (const r of s) {
    let l = !1;
    for (let c = r.start; c <= r.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = r.start; c <= r.end; c++) {
        const d = n.doc.line(c);
        i.push(
          p.line({ class: "cm-table-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let m = r.start; m <= r.end; m++)
        c.push(n.doc.line(m).text);
      const d = n.doc.line(r.start);
      i.push(
        p.replace({
          widget: new Wn(c, d.from, d.to)
        }).range(d.from, d.to)
      );
      for (let m = r.start + 1; m <= r.end; m++) {
        const f = n.doc.line(m);
        i.push(
          p.line({ class: "cm-hidden-line" }).range(f.from),
          p.replace({}).range(f.from, f.to)
        );
      }
    }
  }
  return p.set(i, !0);
}
const Kn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = Ze(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(S);
        this.decorations = Ze(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Je(e, t) {
  const { state: n } = e, o = e.hasFocus, i = [], { footnoteBlocks: s } = t, a = o ? W(n) : /* @__PURE__ */ new Set();
  for (const r of s) {
    let l = !1;
    for (let c = r.start; c <= r.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = r.start; c <= r.end; c++) {
        const d = n.doc.line(c);
        i.push(
          p.line({ class: "cm-footnote-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let m = r.start; m <= r.end; m++)
        c.push(n.doc.line(m).text);
      const d = n.doc.line(r.start);
      i.push(
        p.replace({
          widget: new An(r.id, c, d.from, d.to)
        }).range(d.from, d.to)
      );
      for (let m = r.start + 1; m <= r.end; m++) {
        const f = n.doc.line(m);
        i.push(
          p.line({ class: "cm-hidden-line" }).range(f.from),
          p.replace({}).range(f.from, f.to)
        );
      }
    }
  }
  return p.set(i, !0);
}
const Un = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = Je(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(S);
        this.decorations = Je(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Qe(e, t) {
  const { state: n } = e, o = e.hasFocus, i = [], { definitionLists: s } = t, a = o ? W(n) : /* @__PURE__ */ new Set();
  for (const r of s) {
    let l = !1;
    for (let c = r.start; c <= r.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = r.start; c <= r.end; c++) {
        const d = n.doc.line(c);
        i.push(
          p.line({ class: "cm-definition-list-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let m = r.start; m <= r.end; m++)
        c.push(n.doc.line(m).text);
      const d = n.doc.line(r.start);
      i.push(
        p.replace({
          widget: new Pn(c, d.from, d.to)
        }).range(d.from, d.to)
      );
      for (let m = r.start + 1; m <= r.end; m++) {
        const f = n.doc.line(m);
        i.push(
          p.line({ class: "cm-hidden-line" }).range(f.from),
          p.replace({}).range(f.from, f.to)
        );
      }
    }
  }
  return p.set(i, !0);
}
const Yn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = Qe(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(S);
        this.decorations = Qe(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function et(e, t) {
  const { state: n } = e, o = e.hasFocus, i = [], { calloutBlocks: s } = t, a = o ? W(n) : /* @__PURE__ */ new Set();
  for (const r of s) {
    let l = !1;
    for (let c = r.start; c <= r.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = r.start; c <= r.end; c++) {
        const d = n.doc.line(c);
        i.push(
          p.line({ class: "cm-callout-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let m = r.start; m <= r.end; m++)
        c.push(n.doc.line(m).text);
      const d = n.doc.line(r.start);
      i.push(
        p.replace({
          widget: new On(
            c,
            r.type,
            r.title,
            r.foldable,
            r.defaultOpen,
            d.from,
            d.to
          )
        }).range(d.from, d.to)
      );
      for (let m = r.start + 1; m <= r.end; m++) {
        const f = n.doc.line(m);
        i.push(
          p.line({ class: "cm-hidden-line" }).range(f.from),
          p.replace({}).range(f.from, f.to)
        );
      }
    }
  }
  return p.set(i, !0);
}
const Xn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = et(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(S);
        this.decorations = et(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function tt(e, t) {
  const { state: n } = e, o = e.hasFocus, i = [], { mathBlocks: s } = t, a = o ? W(n) : /* @__PURE__ */ new Set();
  for (const r of s) {
    let l = !1;
    for (let c = r.start; c <= r.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = r.start; c <= r.end; c++) {
        const d = n.doc.line(c);
        i.push(
          p.line({ class: "cm-math-block-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let f = r.start + 1; f < r.end; f++)
        c.push(n.doc.line(f).text);
      const d = c.join(`
`), m = n.doc.line(r.start);
      i.push(
        p.replace({
          widget: new Rn(d, m.from, m.to)
        }).range(m.from, m.to)
      );
      for (let f = r.start + 1; f <= r.end; f++) {
        const u = n.doc.line(f);
        i.push(
          p.line({ class: "cm-hidden-line" }).range(u.from),
          p.replace({}).range(u.from, u.to)
        );
      }
    }
  }
  return p.set(i, !0);
}
const Gn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = tt(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(S);
        this.decorations = tt(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function nt(e, t) {
  const { state: n } = e, o = e.hasFocus, i = [], { mermaidBlocks: s } = t, a = o ? W(n) : /* @__PURE__ */ new Set();
  for (const r of s) {
    let l = !1;
    for (let c = r.start; c <= r.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = r.start; c <= r.end; c++) {
        const d = n.doc.line(c);
        i.push(
          p.line({ class: "cm-mermaid-block-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let f = r.start + 1; f < r.end; f++)
        c.push(n.doc.line(f).text);
      const d = c.join(`
`), m = n.doc.line(r.start);
      i.push(
        p.replace({
          widget: new Bn(d, m.from, m.to)
        }).range(m.from, m.to)
      );
      for (let f = r.start + 1; f <= r.end; f++) {
        const u = n.doc.line(f);
        i.push(
          p.line({ class: "cm-hidden-line" }).range(u.from),
          p.replace({}).range(u.from, u.to)
        );
      }
    }
  }
  return p.set(i, !0);
}
const Zn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = nt(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(S);
        this.decorations = nt(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
), Jn = /^!\[([^\]]*)\]\(([^)]+)\)$/;
function vt(e) {
  const t = e.trim().match(Jn);
  return t ? { alt: t[1], url: t[2].trim() } : null;
}
class Qn extends A {
  constructor(t, n, o, i) {
    super(), this.alt = t, this.url = n, this.lineFrom = o, this.lineTo = i;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-image-preview";
    const o = document.createElement("img");
    if (o.src = this.url, o.alt = this.alt, o.loading = "lazy", o.addEventListener("error", () => {
      n.textContent = "";
      const s = document.createElement("div");
      s.className = "cm-image-error", s.textContent = `Image not found: ${this.url}`, n.appendChild(s);
    }), n.appendChild(o), this.alt) {
      const s = document.createElement("span");
      s.className = "cm-image-alt", s.textContent = this.alt, n.appendChild(s);
    }
    const i = this.lineFrom;
    return n.addEventListener("mousedown", (s) => {
      s.preventDefault(), s.stopPropagation(), t.dispatch({
        selection: { anchor: i },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.url === this.url && t.alt === this.alt;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
function ot(e, t) {
  const { state: n } = e, o = e.hasFocus, i = [], s = o ? W(n) : /* @__PURE__ */ new Set(), {
    frontmatterLines: a,
    codeBlockLines: r,
    tableLines: l,
    mathBlockLines: c,
    footnoteBlockLines: d,
    definitionListLines: m,
    mermaidBlockLines: f
  } = t;
  for (const { from: u, to: h } of e.visibleRanges) {
    const g = n.doc.lineAt(u).number, b = n.doc.lineAt(h).number;
    for (let k = g; k <= b; k++) {
      if (s.has(k) || a.has(k) || r.has(k) || l.has(k) || c.has(k) || d.has(k) || m.has(k) || f.has(k)) continue;
      const w = n.doc.line(k), v = vt(w.text);
      v && i.push(
        p.replace({
          widget: new Qn(v.alt, v.url, w.from, w.to)
        }).range(w.from, w.to)
      );
    }
  }
  return p.set(i, !0);
}
const eo = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = ot(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged) {
        const t = e.state.field(S);
        this.decorations = ot(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
), X = R.define(), Z = J.define({
  create() {
    return !1;
  },
  update(e, t) {
    for (const n of t.effects)
      if (n.is(X))
        return n.value;
    return e;
  }
});
function z(e) {
  return !e || typeof e != "object" || Object.keys(e).length === 0 ? "" : at.dump(e, {
    indent: 2,
    lineWidth: -1,
    noRefs: !0,
    quotingType: '"',
    forceQuotes: !1
  }).trimEnd();
}
function to(e, t, n, o, i, s) {
  const a = document.createElement("span");
  if (a.className = "cm-frontmatter-value", typeof t == "boolean") {
    const l = document.createElement("input");
    return l.type = "checkbox", l.checked = t, l.className = "cm-frontmatter-checkbox", l.addEventListener("change", (c) => {
      c.stopPropagation();
      const d = { ...n, [e]: l.checked }, m = z(d);
      s.dispatch({
        changes: { from: o, to: i, insert: m },
        annotations: B.of(!0)
      });
    }), a.appendChild(l), a;
  }
  if (Array.isArray(t)) {
    for (let c = 0; c < t.length; c++) {
      const d = document.createElement("span");
      d.className = "cm-frontmatter-tag", d.textContent = String(t[c]), d.contentEditable = "true", d.spellcheck = !1;
      const m = c;
      d.addEventListener("blur", (f) => {
        f.stopPropagation();
        const u = [...t], h = d.textContent.trim();
        h === "" ? u.splice(m, 1) : u[m] = h;
        const g = { ...n, [e]: u }, b = z(g);
        s.dispatch({
          changes: { from: o, to: i, insert: b },
          annotations: B.of(!0)
        });
      }), d.addEventListener("keydown", (f) => {
        f.key === "Enter" && (f.preventDefault(), d.blur()), f.stopPropagation();
      }), d.addEventListener("mousedown", (f) => f.stopPropagation()), a.appendChild(d);
    }
    const l = document.createElement("span");
    return l.className = "cm-frontmatter-add-tag", l.textContent = "+", l.title = "Add item", l.addEventListener("mousedown", (c) => {
      c.preventDefault(), c.stopPropagation();
    }), l.addEventListener("click", (c) => {
      c.stopPropagation();
      const d = [...t, "new"], m = { ...n, [e]: d }, f = z(m);
      s.dispatch({
        changes: { from: o, to: i, insert: f },
        annotations: B.of(!0)
      });
    }), a.appendChild(l), a;
  }
  if (t !== null && typeof t == "object") {
    const l = document.createElement("input");
    return l.type = "text", l.className = "cm-frontmatter-input", l.value = JSON.stringify(t), l.addEventListener("blur", (c) => {
      c.stopPropagation();
      try {
        const d = JSON.parse(l.value), m = { ...n, [e]: d }, f = z(m);
        s.dispatch({
          changes: { from: o, to: i, insert: f },
          annotations: B.of(!0)
        });
      } catch {
        l.value = JSON.stringify(t);
      }
    }), l.addEventListener("keydown", (c) => {
      c.key === "Enter" && (c.preventDefault(), l.blur()), c.stopPropagation();
    }), l.addEventListener("mousedown", (c) => c.stopPropagation()), a.appendChild(l), a;
  }
  const r = document.createElement("input");
  return r.type = "text", r.className = "cm-frontmatter-input", r.value = t === null ? "" : String(t), r.placeholder = t === null ? "empty" : "", r.addEventListener("blur", (l) => {
    l.stopPropagation();
    const c = r.value;
    let d;
    c === "" || c === "null" ? d = null : c === "true" ? d = !0 : c === "false" ? d = !1 : !isNaN(c) && c.trim() !== "" ? d = Number(c) : d = c;
    const m = { ...n, [e]: d }, f = z(m);
    s.dispatch({
      changes: { from: o, to: i, insert: f },
      annotations: B.of(!0)
    });
  }), r.addEventListener("keydown", (l) => {
    l.key === "Enter" && (l.preventDefault(), r.blur()), l.stopPropagation();
  }), r.addEventListener("mousedown", (l) => l.stopPropagation()), a.appendChild(r), a;
}
function no(e, t, n, o, i, s = {}) {
  const { knownKeys: a = [] } = s, r = document.createElement("div");
  r.className = "cm-frontmatter-preview";
  let l;
  try {
    l = at.load(e);
  } catch {
    const g = document.createElement("div");
    return g.className = "cm-frontmatter-error", g.textContent = "Invalid YAML frontmatter — click to edit", r.appendChild(g), { dom: r, error: !0 };
  }
  (!l || typeof l != "object") && (l = {});
  const c = document.createElement("table");
  c.className = "cm-frontmatter-table";
  const d = "cm-fm-keys-" + Math.random().toString(36).slice(2, 8), m = document.createElement("datalist");
  m.id = d;
  const f = new Set(Object.keys(l));
  for (const g of a)
    if (!f.has(g)) {
      const b = document.createElement("option");
      b.value = g, m.appendChild(b);
    }
  r.appendChild(m);
  const u = Object.keys(l);
  for (const g of u) {
    const b = document.createElement("tr"), k = document.createElement("td");
    k.className = "cm-frontmatter-key";
    const w = document.createElement("input");
    w.type = "text", w.className = "cm-frontmatter-key-input", w.value = g, w.size = Math.max(g.length, 1), w.spellcheck = !1, w.setAttribute("list", d), w.addEventListener("blur", (C) => {
      C.stopPropagation();
      const L = w.value.trim();
      if (L === "" || L === g) {
        w.value = g;
        return;
      }
      const E = {};
      for (const I of Object.keys(l))
        I === g ? E[L] = l[I] : E[I] = l[I];
      const M = z(E);
      i.dispatch({
        changes: { from: t, to: n, insert: M },
        annotations: B.of(!0)
      });
    }), w.addEventListener("keydown", (C) => {
      C.key === "Enter" && (C.preventDefault(), w.blur()), C.stopPropagation();
    }), w.addEventListener("mousedown", (C) => C.stopPropagation()), k.appendChild(w), b.appendChild(k);
    const v = document.createElement("td");
    v.className = "cm-frontmatter-value-cell", v.appendChild(
      to(g, l[g], l, t, n, i)
    ), b.appendChild(v);
    const x = document.createElement("td");
    x.className = "cm-frontmatter-action-cell";
    const y = document.createElement("span");
    y.className = "cm-frontmatter-delete", y.textContent = "×", y.title = "Remove property", y.addEventListener("mousedown", (C) => {
      C.preventDefault(), C.stopPropagation();
    }), y.addEventListener("click", (C) => {
      C.stopPropagation();
      const L = { ...l };
      delete L[g];
      const E = z(L);
      i.dispatch({
        changes: { from: t, to: n, insert: E },
        annotations: B.of(!0)
      });
    }), x.appendChild(y), b.appendChild(x), c.appendChild(b);
  }
  r.appendChild(c);
  const h = document.createElement("div");
  return h.className = "cm-frontmatter-add", h.textContent = "+ Add property", h.addEventListener("mousedown", (g) => {
    g.preventDefault(), g.stopPropagation();
  }), h.addEventListener("click", (g) => {
    g.stopPropagation();
    let b = "property", k = 1;
    for (; l[b] !== void 0; )
      b = `property${k}`, k++;
    const w = { ...l, [b]: "" }, v = z(w);
    i.dispatch({
      changes: { from: t, to: n, insert: v },
      annotations: B.of(!0)
    });
  }), r.appendChild(h), { dom: r, error: !1 };
}
function it(e, t) {
  const { state: n } = e, { frontmatter: o } = t;
  if (!o)
    return p.none;
  const i = [], s = n.doc.line(o.start);
  i.push(
    p.replace({}).range(s.from, s.to)
  ), i.push(
    p.line({ class: "cm-hidden-line" }).range(s.from)
  );
  for (let a = o.start + 1; a <= o.end; a++) {
    const r = n.doc.line(a);
    i.push(
      p.line({ class: "cm-hidden-line" }).range(r.from),
      p.replace({}).range(r.from, r.to)
    );
  }
  return p.set(i, !0);
}
const oo = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(S);
      this.decorations = it(e, t);
    }
    update(e) {
      if (e.docChanged) {
        const t = e.state.field(S);
        this.decorations = it(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function ye(e = {}) {
  const {
    enableCollapse: t = !0,
    enableCustomTasks: n = !1,
    customTaskTypes: o,
    enableWikiLinks: i = !1,
    renderWikiLinks: s = !0,
    onWikiLinkClick: a,
    enableTags: r = !1,
    onTagClick: l
  } = e, c = bt(n, o), d = wt(i, s, a), m = xt(r, l);
  return [
    // Configuration facet for collapse functionality
    gt.of(t),
    // Configuration facet for custom task types
    ce.of(c),
    // Configuration facet for wiki links
    _.of(d),
    // Configuration facet for tags
    de.of(m),
    // State for tracking collapsed headings (always included, but only used if collapse enabled)
    Ct,
    // Frontmatter sheet open/closed state
    Z,
    // Shared state for block ranges (computed once per doc change)
    S,
    // ViewPlugins that read from the shared state
    oo,
    eo,
    Hn,
    jn,
    _n,
    Vn,
    Kn,
    Un,
    Yn,
    Xn,
    Gn,
    Zn
  ];
}
function io(e) {
  requestAnimationFrame(() => {
    const t = e.dom.querySelector(".cm-search"), n = t == null ? void 0 : t.querySelector('input[name="replace"]');
    n instanceof HTMLInputElement && (n.focus(), n.select());
  });
}
function se(e, t, n) {
  const { from: o, to: i } = e.state.selection.main, s = e.state.sliceDoc(o, i);
  e.dispatch({
    changes: { from: o, to: i, insert: t + s + n },
    selection: { anchor: o + t.length, head: i + t.length }
  });
}
function ro(e, t) {
  const { from: n } = e.state.selection.main, o = e.state.doc.lineAt(n);
  e.dispatch({
    changes: { from: o.from, to: o.from, insert: t }
  });
}
function ue(e, t) {
  const { from: n } = e.state.selection.main, o = e.state.doc.lineAt(n), s = o.text.match(/^(#{1,6})\s/), a = "#".repeat(t) + " ";
  if (s) {
    const r = s[0];
    r === a ? e.dispatch({
      changes: { from: o.from, to: o.from + r.length, insert: "" }
    }) : e.dispatch({
      changes: { from: o.from, to: o.from + r.length, insert: a }
    });
  } else
    e.dispatch({
      changes: { from: o.from, to: o.from, insert: a }
    });
}
function pe(e, t) {
  const { from: n } = e.state.selection.main, o = e.state.doc.lineAt(n), i = o.text, s = i.match(/^(-|\*|\+)\s(?!\[[ xX]\])/), a = i.match(/^(\d+)\.\s/), r = i.match(/^(-|\*|\+)\s\[[ xX]\]\s/), c = {
    bullet: "- ",
    numbered: "1. ",
    task: "- [ ] "
  }[t];
  let d = null, m = null;
  r ? (d = r[0], m = "task") : a ? (d = a[0], m = "numbered") : s && (d = s[0], m = "bullet"), d ? m === t ? e.dispatch({
    changes: { from: o.from, to: o.from + d.length, insert: "" }
  }) : e.dispatch({
    changes: { from: o.from, to: o.from + d.length, insert: c }
  }) : e.dispatch({
    changes: { from: o.from, to: o.from, insert: c }
  });
}
function so(e) {
  const { from: t, to: n } = e.state.selection.main;
  return t !== n ? e.state.sliceDoc(t, n) : null;
}
const F = {
  undo(e) {
    Bt(e);
  },
  redo(e) {
    Rt(e);
  },
  search(e) {
    _e(e);
  },
  replace(e) {
    _e(e), io(e);
  },
  selectNextOccurrence(e) {
    je(e);
  },
  selectAllOccurrences(e) {
    e.state.selection.main.empty && je(e), zt(e);
  },
  bold(e) {
    se(e, "**", "**");
  },
  italic(e) {
    se(e, "_", "_");
  },
  strikethrough(e) {
    se(e, "~~", "~~");
  },
  h1(e) {
    ue(e, 1);
  },
  h2(e) {
    ue(e, 2);
  },
  h3(e) {
    ue(e, 3);
  },
  link(e) {
    const t = so(e), n = "url";
    if (t) {
      const { from: o, to: i } = e.state.selection.main;
      e.dispatch({
        changes: { from: o, to: i, insert: `[${t}](${n})` },
        selection: { anchor: o + t.length + 3, head: o + t.length + 3 + n.length }
      });
    } else {
      const { from: o } = e.state.selection.main;
      e.dispatch({
        changes: { from: o, insert: `[link text](${n})` },
        selection: { anchor: o + 1, head: o + 10 }
      });
    }
  },
  image(e) {
    const { from: t } = e.state.selection.main;
    e.dispatch({
      changes: { from: t, insert: "![alt text](url)" },
      selection: { anchor: t + 2, head: t + 10 }
    });
  },
  bulletList(e) {
    pe(e, "bullet");
  },
  numberedList(e) {
    pe(e, "numbered");
  },
  taskList(e) {
    pe(e, "task");
  },
  inlineCode(e) {
    se(e, "`", "`");
  },
  codeBlock(e) {
    const { from: t, to: n } = e.state.selection.main, o = e.state.sliceDoc(t, n), s = o ? "```\n" + o + "\n```" : "```" + `javascript
function hello() {
  alert("hello world");
}
hello();` + "\n```";
    e.dispatch({
      changes: { from: t, to: n, insert: s },
      selection: { anchor: t + 4 }
    });
  },
  hr(e) {
    const { from: t } = e.state.selection.main, n = e.state.doc.lineAt(t);
    e.dispatch({
      changes: { from: n.to, insert: `

---
` }
    });
  },
  quote(e) {
    ro(e, "> ");
  },
  table(e) {
    const { from: t } = e.state.selection.main, n = e.state.doc.lineAt(t);
    e.dispatch({
      changes: { from: n.to, insert: `

` + `| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |` + `
` },
      selection: { anchor: n.to + 4 }
    });
  },
  diagram(e) {
    const { from: t } = e.state.selection.main, n = e.state.doc.lineAt(t);
    e.dispatch({
      changes: { from: n.to, insert: `

` + "```mermaid\nflowchart LR\n    A[Start] --> B[Process]\n    B --> C{Decision}\n    C -->|Yes| D[Result 1]\n    C -->|No| E[Result 2]\n```" + `
` },
      selection: { anchor: n.to + 4 }
    });
  },
  emoji(e) {
    const { from: t } = e.state.selection.main;
    e.dispatch({
      changes: { from: t, insert: ":smile:" },
      selection: { anchor: t + 1, head: t + 6 }
    });
  }
}, Lt = j.define({
  combine(e) {
    return e.length === 0 ? {} : e[e.length - 1];
  }
}), K = R.define(), q = R.define(), V = R.define(), ee = R.define(), te = R.define(), G = J.define({
  create(e) {
    const t = e.facet(Lt);
    return {
      writingModeSheet: !1,
      typewriter: t.typewriter === !0,
      focusMode: t.focusMode === !0,
      focusLevel: t.focusLevel || "paragraph",
      dimIntensity: t.dimIntensity != null ? t.dimIntensity : 30
    };
  },
  update(e, t) {
    for (const n of t.effects)
      n.is(K) ? e = { ...e, writingModeSheet: n.value } : n.is(q) ? e = { ...e, typewriter: n.value } : n.is(V) ? e = { ...e, focusMode: n.value } : n.is(ee) ? e = { ...e, focusLevel: n.value } : n.is(te) && (e = { ...e, dimIntensity: n.value });
    return e;
  }
}), ao = st.of([
  {
    key: "Mod-Shift-t",
    run: (e) => {
      const t = e.state.field(G).typewriter;
      return e.dispatch({ effects: q.of(!t) }), !0;
    }
  },
  {
    key: "Mod-Shift-f",
    run: (e) => {
      const t = e.state.field(G).focusMode;
      return e.dispatch({ effects: V.of(!t) }), !0;
    }
  },
  {
    key: "Mod-b",
    run: (e) => (F.bold(e), !0)
  },
  {
    key: "Mod-i",
    run: (e) => (F.italic(e), !0)
  },
  {
    key: "Mod-k",
    run: (e) => (F.link(e), !0)
  },
  {
    key: "Mod-`",
    run: (e) => (F.inlineCode(e), !0)
  },
  {
    key: "Mod-Shift-`",
    run: (e) => (F.codeBlock(e), !0)
  },
  {
    key: "Mod-h",
    run: (e) => (F.replace(e), !0)
  },
  {
    key: "Mod-d",
    run: (e) => (F.selectNextOccurrence(e), !0)
  },
  {
    key: "Mod-Shift-l",
    run: (e) => (F.selectAllOccurrences(e), !0)
  },
  {
    key: "Mod-Shift-x",
    run: (e) => (F.strikethrough(e), !0)
  },
  {
    key: "Mod-1",
    run: (e) => (F.h1(e), !0)
  },
  {
    key: "Mod-2",
    run: (e) => (F.h2(e), !0)
  },
  {
    key: "Mod-3",
    run: (e) => (F.h3(e), !0)
  },
  {
    key: "Mod-Shift-8",
    run: (e) => (F.bulletList(e), !0)
  },
  {
    key: "Mod-Shift-7",
    run: (e) => (F.numberedList(e), !0)
  },
  {
    key: "Mod-Shift-9",
    run: (e) => (F.taskList(e), !0)
  },
  {
    key: "Mod-Shift-.",
    run: (e) => (F.quote(e), !0)
  },
  {
    key: "Mod-Shift-i",
    run: (e) => (F.image(e), !0)
  }
]), co = p.line({ class: "cm-selectedLine" }), ve = N.fromClass(
  class {
    constructor(e) {
      this.decorations = this.buildDecorations(e);
    }
    update(e) {
      (e.docChanged || e.selectionSet || e.focusChanged) && (this.decorations = this.buildDecorations(e.view));
    }
    buildDecorations(e) {
      if (!e.hasFocus)
        return p.none;
      const t = [], n = /* @__PURE__ */ new Set(), o = e.state;
      for (const i of o.selection.ranges) {
        const s = o.doc.lineAt(i.from).number, a = o.doc.lineAt(i.to).number;
        for (let r = s; r <= a; r++)
          n.add(r);
      }
      for (const i of n) {
        const s = o.doc.line(i);
        t.push(co.range(s.from));
      }
      return p.set(t, !0);
    }
  },
  {
    decorations: (e) => e.decorations
  }
), St = N.fromClass(
  class {
    constructor(e) {
      this.view = e;
    }
    update(e) {
      !e.selectionSet && !e.docChanged && !e.geometryChanged || this.view.requestMeasure({
        key: "typewriter-scroll",
        read: (t) => {
          const n = t.state.selection.main.head, o = t.coordsAtPos(n);
          if (!o) return null;
          const i = t.scrollDOM.getBoundingClientRect(), s = i.top + i.height / 2, a = o.top - s;
          return Math.abs(a) < 2 ? null : a;
        },
        write: (t, n) => {
          t != null && n.scrollDOM.scrollBy({ top: t, behavior: "auto" });
        }
      });
    }
  }
), lo = p.line({ class: "cm-unfocused-line" });
function mo(e, t) {
  const n = e.lineAt(t);
  let o = n.number, i = n.number;
  for (; o > 1 && e.line(o - 1).text.trim() !== ""; )
    o--;
  for (; i < e.lines && e.line(i + 1).text.trim() !== ""; )
    i++;
  return { from: o, to: i };
}
function fo(e, t) {
  const n = e.toString();
  let o = 0;
  for (let r = t - 1; r >= 0; r--) {
    const l = n[r];
    if ((l === "." || l === "!" || l === "?") && r + 1 < n.length && /\s/.test(n[r + 1])) {
      for (o = r + 1; o < t && /\s/.test(n[o]); ) o++;
      break;
    }
    if (l === `
` && r > 0 && n[r - 1] === `
`) {
      o = r + 1;
      break;
    }
  }
  let i = n.length;
  for (let r = t; r < n.length; r++) {
    const l = n[r];
    if ((l === "." || l === "!" || l === "?") && (r + 1 >= n.length || /\s/.test(n[r + 1]))) {
      i = r + 1;
      break;
    }
    if (l === `
` && r + 1 < n.length && n[r + 1] === `
`) {
      i = r;
      break;
    }
  }
  const s = e.lineAt(Math.max(0, o)).number, a = e.lineAt(Math.min(n.length, Math.max(o, i - 1))).number;
  return { from: s, to: a };
}
function Le(e = "paragraph", t = 30) {
  return N.fromClass(
    class {
      constructor(n) {
        this.setIntensity(n, t), this.decorations = this.buildDecorations(n);
      }
      update(n) {
        (n.selectionSet || n.docChanged || n.focusChanged) && (this.decorations = this.buildDecorations(n.view));
      }
      setIntensity(n, o) {
        const i = Math.max(0, Math.min(1, 1 - o / 100));
        n.dom.style.setProperty("--cm-unfocused-opacity", String(i));
      }
      buildDecorations(n) {
        if (!n.hasFocus)
          return He.empty;
        const o = n.state.doc, i = /* @__PURE__ */ new Set();
        for (const a of n.state.selection.ranges) {
          let r;
          if (e === "line") {
            const l = o.lineAt(a.head);
            r = { from: l.number, to: l.number };
          } else e === "sentence" ? r = fo(o, a.head) : r = mo(o, a.head);
          for (let l = r.from; l <= r.to; l++)
            i.add(l);
        }
        const s = [];
        for (let a = 1; a <= o.lines; a++)
          if (!i.has(a)) {
            const r = o.line(a);
            s.push(lo.range(r.from));
          }
        return He.of(s);
      }
      destroy() {
      }
    },
    {
      decorations: (n) => n.decorations
    }
  );
}
const Yo = Le("paragraph", 30);
function uo(e, t) {
  const n = e.toString(), o = n.split(/\s+/).filter((d) => d.length > 0).length, i = n.length, s = n.replace(/\s/g, "").length, a = Math.max(1, Math.ceil(o / 238));
  let r = 0, l = 0;
  const c = t && !t.main.empty;
  if (c) {
    const d = e.sliceString(t.main.from, t.main.to);
    r = d.split(/\s+/).filter((m) => m.length > 0).length, l = d.length;
  }
  return { words: o, chars: i, charsNoSpaces: s, readingTime: a, selWords: r, selChars: l, hasSelection: c };
}
function po(e) {
  return e < 1 ? "< 1 min read" : e === 1 ? "1 min read" : `${e} min read`;
}
function he(e, t) {
  const n = document.createElement("span");
  n.className = "cm-word-count-stat";
  const o = document.createElement("span");
  o.className = "cm-word-count-value", o.textContent = t;
  const i = document.createElement("span");
  return i.className = "cm-word-count-label", i.textContent = ` ${e}`, n.appendChild(o), n.appendChild(i), n;
}
function ge() {
  const e = document.createElement("span");
  return e.className = "cm-word-count-divider", e;
}
function ho(e) {
  const t = document.createElement("div");
  t.className = "cm-word-count-panel";
  function n(o) {
    const i = uo(o.doc, o.selection);
    if (t.textContent = "", t.appendChild(he("words", i.words.toLocaleString())), t.appendChild(ge()), t.appendChild(he("characters", i.chars.toLocaleString())), t.appendChild(ge()), t.appendChild(he("", po(i.readingTime))), i.hasSelection) {
      t.appendChild(ge());
      const s = document.createElement("span");
      s.className = "cm-word-count-stat cm-word-count-selection";
      const a = document.createElement("span");
      a.className = "cm-word-count-value", a.textContent = `${i.selWords} words, ${i.selChars} chars`;
      const r = document.createElement("span");
      r.className = "cm-word-count-label", r.textContent = " selected", s.appendChild(a), s.appendChild(r), t.appendChild(s);
    }
  }
  return n(e.state), {
    dom: t,
    top: !1,
    update(o) {
      (o.docChanged || o.selectionSet) && n(o.state);
    }
  };
}
const Se = we.of(ho), go = [
  { icon: "↶", title: "Undo", action: "undo" },
  { icon: "↷", title: "Redo", action: "redo" },
  { icon: "B", title: "Bold", action: "bold" },
  { icon: "I", title: "Italic", action: "italic" },
  { icon: "S", title: "Strikethrough", action: "strikethrough" },
  { icon: "H₁", title: "Heading 1", action: "h1" },
  { icon: "H₂", title: "Heading 2", action: "h2" },
  { icon: "H₃", title: "Heading 3", action: "h3" },
  { icon: "🔗", title: "Link", action: "link" },
  { icon: "🖼", title: "Image", action: "image" },
  { icon: "•", title: "Bullet List", action: "bulletList" },
  { icon: "1.", title: "Numbered List", action: "numberedList" },
  { icon: "☑", title: "Task List", action: "taskList" },
  { icon: "< >", title: "Inline Code", action: "inlineCode" },
  { icon: "{ }", title: "Code Block", action: "codeBlock" },
  { icon: "—", title: "Horizontal Rule", action: "hr" },
  { icon: "“", title: "Blockquote", action: "quote" },
  { icon: "⊞", title: "Table", action: "table" }
], ko = H.baseTheme({
  ".cm-bottom-toolbar": {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "6px 8px",
    paddingBottom: "max(6px, env(safe-area-inset-bottom))",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    whiteSpace: "nowrap",
    borderTop: "1px solid #dee2e6",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: "#f8f9fa",
    overscrollBehaviorX: "contain",
    touchAction: "pan-x"
  },
  ".cm-bottom-toolbar::-webkit-scrollbar": {
    display: "none"
  },
  ".cm-bottom-toolbar-btn": {
    minWidth: "36px",
    height: "36px",
    flexShrink: "0",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    color: "inherit",
    transition: "background 0.1s",
    padding: "0 4px",
    fontFamily: "inherit"
  },
  ".cm-bottom-toolbar-btn:hover": {
    background: "rgba(0, 0, 0, 0.08)"
  },
  ".cm-bottom-toolbar-btn:active": {
    background: "rgba(0, 0, 0, 0.15)"
  },
  ".cm-bottom-toolbar-btn:disabled": {
    opacity: "0.3",
    cursor: "not-allowed"
  },
  // Dark mode
  "&dark .cm-bottom-toolbar": {
    background: "#252526",
    borderTopColor: "#3c3c3c",
    color: "#d4d4d4"
  },
  "&dark .cm-bottom-toolbar-btn:hover": {
    background: "rgba(255, 255, 255, 0.1)"
  },
  "&dark .cm-bottom-toolbar-btn:active": {
    background: "rgba(255, 255, 255, 0.18)"
  }
});
function Ee(e = {}) {
  const t = e.buttons || go, n = e.extraButtons || [];
  return [we.of((i) => {
    const s = document.createElement("div");
    s.className = "cm-bottom-toolbar";
    const a = /* @__PURE__ */ new Map();
    for (const c of t) {
      const d = document.createElement("button");
      d.className = "cm-bottom-toolbar-btn", d.textContent = c.icon, d.title = c.title, c.action && (a.set(c.action, d), d.addEventListener("click", (m) => {
        m.preventDefault(), F[c.action] && (F[c.action](i), i.focus());
      })), s.appendChild(d);
    }
    for (const c of n) {
      const d = document.createElement("button");
      d.className = "cm-bottom-toolbar-btn", d.textContent = c.icon, d.title = c.title, d.addEventListener("click", (m) => {
        m.preventDefault(), c.handler && c.handler(i), i.focus();
      }), s.appendChild(d);
    }
    let r = 0;
    s.addEventListener("touchstart", (c) => {
      r = c.touches[0].clientX;
    }, { passive: !0 }), s.addEventListener("touchmove", (c) => {
      const d = c.touches[0].clientX - r, m = s.scrollLeft <= 0, f = s.scrollLeft + s.clientWidth >= s.scrollWidth - 1;
      (m && d > 0 || f && d < 0) && c.preventDefault();
    }, { passive: !1 });
    const l = (c) => {
      const d = a.get("undo");
      d && (d.disabled = Wt(c) === 0);
      const m = a.get("redo");
      m && (m.disabled = At(c) === 0);
    };
    return l(i.state), {
      dom: s,
      top: !1,
      update(c) {
        l(c.state);
      }
    };
  }), ko];
}
const ae = j.define({
  combine(e) {
    return e.length === 0 ? { docTitle: null, onBacklinksRequested: null, onBacklinkClick: null } : e[e.length - 1];
  }
});
function bo(e) {
  if (e.lines < 2 || e.line(1).text.trim() !== "---") return null;
  for (let n = 2; n <= e.lines; n++) {
    const o = e.line(n).text.trim();
    if (o === "---" || o === "...") {
      for (let i = 2; i < n; i++) {
        const a = e.line(i).text.match(/^title:\s*(.+)$/);
        if (a) {
          let r = a[1].trim();
          return (r.startsWith('"') && r.endsWith('"') || r.startsWith("'") && r.endsWith("'")) && (r = r.slice(1, -1)), r;
        }
      }
      return null;
    }
  }
  return null;
}
function ke(e, t, n) {
  e.textContent = "";
  const o = document.createElement("span");
  if (o.className = "cm-backlinks-label", o.textContent = "Backlinks", e.appendChild(o), !t || t.length === 0) {
    const s = document.createElement("span");
    s.className = "cm-backlinks-empty", s.textContent = "None", e.appendChild(s);
    return;
  }
  const i = document.createElement("span");
  i.className = "cm-backlinks-list";
  for (const s of t) {
    const a = document.createElement("span");
    a.className = "cm-backlinks-link", a.textContent = s.title, s.excerpt && (a.title = s.excerpt), a.addEventListener("mousedown", (r) => {
      r.preventDefault(), n && n(s);
    }), i.appendChild(a);
  }
  e.appendChild(i);
}
function wo(e) {
  const t = document.createElement("div");
  t.className = "cm-backlinks-panel", e.state.facet(ae);
  let n = null, o = 0;
  function i(a) {
    const r = a.facet(ae);
    return r.docTitle ? r.docTitle : bo(a.doc);
  }
  async function s(a) {
    const r = a.facet(ae);
    if (!r.onBacklinksRequested) {
      t.textContent = "";
      return;
    }
    const l = i(a);
    if (l === n) return;
    if (n = l, !l) {
      ke(t, [], r.onBacklinkClick);
      return;
    }
    t.textContent = "";
    const c = document.createElement("span");
    c.className = "cm-backlinks-label", c.textContent = "Backlinks", t.appendChild(c);
    const d = document.createElement("span");
    d.className = "cm-backlinks-empty", d.textContent = "Loading…", t.appendChild(d);
    const m = ++o;
    try {
      const f = await r.onBacklinksRequested(l);
      m === o && ke(t, f, r.onBacklinkClick);
    } catch {
      m === o && ke(t, [], r.onBacklinkClick);
    }
  }
  return s(e.state), {
    dom: t,
    top: !1,
    update(a) {
      a.docChanged && s(a.state);
    }
  };
}
const Te = we.of(wo), Et = j.define({
  combine(e) {
    return e.length === 0 ? [] : e[e.length - 1];
  }
}), xo = N.fromClass(
  class {
    constructor(e) {
      this.view = e, this.backdrop = null, this.sheet = null, this.escHandler = null, this.isOpen = e.state.field(Z), this.isOpen && this.open();
    }
    update(e) {
      const t = this.isOpen;
      this.isOpen = e.state.field(Z), !t && this.isOpen ? this.open() : t && !this.isOpen ? this.close() : this.isOpen && e.docChanged && this.rebuildContent();
    }
    open() {
      const e = this.view;
      this.backdrop = document.createElement("div"), this.backdrop.className = "cm-frontmatter-sheet-backdrop", this.backdrop.addEventListener("mousedown", (i) => {
        i.preventDefault(), i.stopPropagation(), e.dispatch({ effects: X.of(!1) });
      }), this.sheet = document.createElement("div"), this.sheet.className = "cm-frontmatter-sheet";
      const t = document.createElement("div");
      t.className = "cm-frontmatter-sheet-header";
      const n = document.createElement("span");
      n.className = "cm-frontmatter-sheet-title", n.textContent = "Properties", t.appendChild(n);
      const o = document.createElement("button");
      o.className = "cm-frontmatter-sheet-close", o.textContent = "×", o.title = "Close", o.addEventListener("mousedown", (i) => {
        i.preventDefault(), i.stopPropagation();
      }), o.addEventListener("click", (i) => {
        i.stopPropagation(), e.dispatch({ effects: X.of(!1) });
      }), t.appendChild(o), this.sheet.appendChild(t), this.contentEl = document.createElement("div"), this.contentEl.className = "cm-frontmatter-sheet-content", this.sheet.appendChild(this.contentEl), this.buildContent(), e.dom.appendChild(this.backdrop), e.dom.appendChild(this.sheet), e.scrollDOM.style.overflow = "hidden", this.escHandler = (i) => {
        i.key === "Escape" && (i.preventDefault(), i.stopPropagation(), e.dispatch({ effects: X.of(!1) }));
      }, e.dom.addEventListener("keydown", this.escHandler, !0), requestAnimationFrame(() => {
        this.backdrop && this.backdrop.classList.add("cm-frontmatter-sheet-backdrop-visible"), this.sheet && this.sheet.classList.add("cm-frontmatter-sheet-open");
      });
    }
    close() {
      const e = this.view;
      e.scrollDOM.style.overflow = "", this.escHandler && (e.dom.removeEventListener("keydown", this.escHandler, !0), this.escHandler = null), this.sheet && this.sheet.classList.remove("cm-frontmatter-sheet-open"), this.backdrop && this.backdrop.classList.remove("cm-frontmatter-sheet-backdrop-visible");
      const t = this.sheet, n = this.backdrop;
      setTimeout(() => {
        t == null || t.remove(), n == null || n.remove();
      }, 200), this.sheet = null, this.backdrop = null, this.contentEl = null;
    }
    buildContent() {
      if (!this.contentEl) return;
      this.contentEl.innerHTML = "";
      const e = this.view.state, t = e.field(S), { frontmatter: n } = t;
      if (!n) {
        const m = document.createElement("div");
        m.className = "cm-frontmatter-sheet-empty", m.textContent = "No frontmatter in this document.", this.contentEl.appendChild(m);
        const f = document.createElement("button");
        f.className = "cm-frontmatter-sheet-add-btn", f.textContent = "Add Frontmatter", f.addEventListener("click", (u) => {
          u.stopPropagation(), this.view.dispatch({
            changes: { from: 0, to: 0, insert: `---
---
` },
            annotations: B.of(!0)
          });
        }), this.contentEl.appendChild(f);
        return;
      }
      const o = n.end - n.start > 1, i = o ? e.doc.line(n.start + 1).from : e.doc.line(n.start).to + 1, s = o ? e.doc.line(n.end - 1).to : i, a = [];
      for (let m = n.start + 1; m < n.end; m++)
        a.push(e.doc.line(m).text);
      const r = a.join(`
`), l = e.doc.line(n.start).from, c = this.view.state.facet(Et), { dom: d } = no(
        r,
        i,
        s,
        l,
        this.view,
        { knownKeys: c }
      );
      this.contentEl.appendChild(d);
    }
    rebuildContent() {
      this.buildContent();
    }
    destroy() {
      var e, t;
      this.isOpen && (this.escHandler && this.view.dom.removeEventListener("keydown", this.escHandler, !0), (e = this.sheet) == null || e.remove(), (t = this.backdrop) == null || t.remove(), this.view.scrollDOM.style.overflow = "");
    }
  }
), Co = typeof navigator < "u" && /Mac/.test(navigator.platform), rt = Co ? "⌘" : "Ctrl+", yo = N.fromClass(
  class {
    constructor(e) {
      this.view = e, this.backdrop = null, this.sheet = null, this.escHandler = null, this.isOpen = e.state.field(G).writingModeSheet, this.isOpen && this.open();
    }
    update(e) {
      const t = this.isOpen, n = e.state.field(G);
      this.isOpen = n.writingModeSheet, !t && this.isOpen ? this.open() : t && !this.isOpen ? this.close() : this.isOpen && this.rebuildContent();
    }
    open() {
      const e = this.view;
      this.backdrop = document.createElement("div"), this.backdrop.className = "cm-writing-mode-sheet-backdrop", this.backdrop.addEventListener("mousedown", (i) => {
        i.preventDefault(), i.stopPropagation(), e.dispatch({ effects: K.of(!1) });
      }), this.sheet = document.createElement("div"), this.sheet.className = "cm-writing-mode-sheet";
      const t = document.createElement("div");
      t.className = "cm-writing-mode-sheet-header";
      const n = document.createElement("span");
      n.className = "cm-writing-mode-sheet-title", n.textContent = "Writing Mode", t.appendChild(n);
      const o = document.createElement("button");
      o.className = "cm-writing-mode-sheet-close", o.textContent = "×", o.title = "Close", o.addEventListener("mousedown", (i) => {
        i.preventDefault(), i.stopPropagation();
      }), o.addEventListener("click", (i) => {
        i.stopPropagation(), e.dispatch({ effects: K.of(!1) });
      }), t.appendChild(o), this.sheet.appendChild(t), this.contentEl = document.createElement("div"), this.contentEl.className = "cm-writing-mode-sheet-content", this.sheet.appendChild(this.contentEl), this.buildContent(), e.dom.appendChild(this.backdrop), e.dom.appendChild(this.sheet), e.scrollDOM.style.overflow = "hidden", this.escHandler = (i) => {
        i.key === "Escape" && (i.preventDefault(), i.stopPropagation(), e.dispatch({ effects: K.of(!1) }));
      }, e.dom.addEventListener("keydown", this.escHandler, !0), requestAnimationFrame(() => {
        this.backdrop && this.backdrop.classList.add("cm-writing-mode-sheet-backdrop-visible"), this.sheet && this.sheet.classList.add("cm-writing-mode-sheet-open");
      });
    }
    close() {
      const e = this.view;
      e.scrollDOM.style.overflow = "", this.escHandler && (e.dom.removeEventListener("keydown", this.escHandler, !0), this.escHandler = null), this.sheet && this.sheet.classList.remove("cm-writing-mode-sheet-open"), this.backdrop && this.backdrop.classList.remove("cm-writing-mode-sheet-backdrop-visible");
      const t = this.sheet, n = this.backdrop;
      setTimeout(() => {
        t == null || t.remove(), n == null || n.remove();
      }, 200), this.sheet = null, this.backdrop = null, this.contentEl = null;
    }
    buildContent() {
      if (!this.contentEl) return;
      this.contentEl.innerHTML = "";
      const e = this.view, t = e.state.field(G), { typewriter: n, focusMode: o, focusLevel: i, dimIntensity: s } = t;
      let a = "normal";
      n && o ? a = "both" : n ? a = "typewriter" : o && (a = "focus");
      const r = this.createSection("MODE"), l = document.createElement("div");
      l.className = "cm-writing-mode-options";
      const c = [
        { id: "normal", label: "Normal", icon: "—" },
        { id: "typewriter", label: "Typewriter", icon: "⌸" },
        { id: "focus", label: "Focus", icon: "◎" },
        { id: "both", label: "Both", icon: "⦿" }
      ];
      for (const b of c) {
        const k = document.createElement("button");
        k.className = "cm-writing-mode-option", b.id === a && k.classList.add("cm-writing-mode-option-active"), k.title = b.label;
        const w = document.createElement("span");
        w.className = "cm-writing-mode-option-icon", w.textContent = b.icon, k.appendChild(w);
        const v = document.createElement("span");
        v.className = "cm-writing-mode-option-label", v.textContent = b.label, k.appendChild(v), k.addEventListener("mousedown", (x) => x.preventDefault()), k.addEventListener("click", (x) => {
          x.stopPropagation();
          const y = b.id === "typewriter" || b.id === "both", C = b.id === "focus" || b.id === "both";
          e.dispatch({
            effects: [
              q.of(y),
              V.of(C)
            ]
          });
        }), l.appendChild(k);
      }
      if (r.appendChild(l), this.contentEl.appendChild(r), o) {
        const b = this.createSection("FOCUS LEVEL"), k = document.createElement("div");
        k.className = "cm-writing-mode-pills";
        const w = [
          { id: "line", label: "Line" },
          { id: "sentence", label: "Sentence" },
          { id: "paragraph", label: "Paragraph" }
        ];
        for (const M of w) {
          const I = document.createElement("button");
          I.className = "cm-writing-mode-pill", M.id === i && I.classList.add("cm-writing-mode-pill-active"), I.textContent = M.label, I.addEventListener("mousedown", (fe) => fe.preventDefault()), I.addEventListener("click", (fe) => {
            fe.stopPropagation(), e.dispatch({ effects: ee.of(M.id) });
          }), k.appendChild(I);
        }
        b.appendChild(k), this.contentEl.appendChild(b);
        const v = this.createSection(`DIM INTENSITY: ${s}%`);
        this.dimLabel = v.querySelector(".cm-writing-mode-section-label");
        const x = document.createElement("div");
        x.className = "cm-writing-mode-slider-wrap";
        const y = document.createElement("input");
        y.type = "range", y.className = "cm-writing-mode-slider", y.min = "0", y.max = "100", y.step = "10", y.value = String(s), y.addEventListener("mousedown", (M) => M.stopPropagation()), y.addEventListener("input", (M) => {
          M.stopPropagation();
          const I = Number(M.target.value);
          this.dimLabel && (this.dimLabel.textContent = `DIM INTENSITY: ${I}%`), e.dispatch({ effects: te.of(I) });
        });
        const C = document.createElement("div");
        C.className = "cm-writing-mode-slider-labels";
        const L = document.createElement("span");
        L.textContent = "Less dim";
        const E = document.createElement("span");
        E.textContent = "More dim", C.appendChild(L), C.appendChild(E), x.appendChild(y), x.appendChild(C), v.appendChild(x), this.contentEl.appendChild(v);
      }
      const d = document.createElement("div");
      d.className = "cm-writing-mode-shortcuts";
      const m = document.createElement("span");
      m.className = "cm-writing-mode-shortcuts-label", m.textContent = "Shortcuts:", d.appendChild(m);
      const f = document.createElement("kbd");
      f.className = "cm-writing-mode-kbd", f.textContent = `${rt}Shift+T`, d.appendChild(f);
      const u = document.createElement("span");
      u.className = "cm-writing-mode-kbd-desc", u.textContent = "Typewriter", d.appendChild(u);
      const h = document.createElement("kbd");
      h.className = "cm-writing-mode-kbd", h.textContent = `${rt}Shift+F`, d.appendChild(h);
      const g = document.createElement("span");
      g.className = "cm-writing-mode-kbd-desc", g.textContent = "Focus", d.appendChild(g), this.contentEl.appendChild(d);
    }
    createSection(e) {
      const t = document.createElement("div");
      t.className = "cm-writing-mode-section";
      const n = document.createElement("label");
      return n.className = "cm-writing-mode-section-label", n.textContent = e, t.appendChild(n), t;
    }
    rebuildContent() {
      this.buildContent();
    }
    destroy() {
      var e, t;
      this.isOpen && (this.escHandler && this.view.dom.removeEventListener("keydown", this.escHandler, !0), (e = this.sheet) == null || e.remove(), (t = this.backdrop) == null || t.remove(), this.view.scrollDOM.style.overflow = "");
    }
  }
);
if (typeof document < "u") {
  const e = document.createElement("style");
  e.textContent = "@keyframes cmFadeIn { from { opacity: 0 } to { opacity: 1 } }", document.head.appendChild(e);
}
const vo = H.baseTheme({
  // Editor base
  "&": {
    height: "100%",
    fontSize: "17px"
  },
  ".cm-content": {
    fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
    padding: "20px 48px",
    lineHeight: "1.75"
  },
  ".cm-line": {
    padding: "4px 0"
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif'
  },
  "&.cm-focused": {
    outline: "none"
  },
  // Markdown preview container
  ".cm-markdown-preview": {
    display: "inline",
    animation: "cmFadeIn 0.12s ease-out"
  },
  // Headers
  ".cm-markdown-preview .md-header": {
    display: "inline",
    fontWeight: "600",
    lineHeight: "1.4"
  },
  ".cm-markdown-preview .md-h1": {
    fontSize: "2em"
  },
  ".cm-markdown-preview .md-h2": {
    fontSize: "1.5em"
  },
  ".cm-markdown-preview .md-h3": {
    fontSize: "1.25em"
  },
  ".cm-markdown-preview .md-h4": {
    fontSize: "1.1em"
  },
  ".cm-markdown-preview .md-h5": {
    fontSize: "1em"
  },
  ".cm-markdown-preview .md-h6": {
    fontSize: "0.9em"
  },
  // Bold and italic
  ".cm-markdown-preview strong": {
    fontWeight: "700"
  },
  ".cm-markdown-preview em": {
    fontStyle: "italic"
  },
  ".cm-markdown-preview del": {
    textDecoration: "line-through"
  },
  ".cm-markdown-preview .md-highlight, .cm-markdown-preview mark": {
    backgroundColor: "#fde68a",
    color: "inherit",
    padding: "0 2px",
    borderRadius: "3px"
  },
  ".cm-markdown-preview .md-subscript, .cm-markdown-preview sub": {
    fontSize: "0.85em",
    verticalAlign: "sub"
  },
  ".cm-markdown-preview .md-superscript, .cm-markdown-preview sup": {
    fontSize: "0.85em",
    verticalAlign: "super"
  },
  // Inline code
  ".cm-markdown-preview code": {
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.9em"
  },
  // Links
  ".cm-markdown-preview a": {
    textDecoration: "none",
    cursor: "pointer"
  },
  ".cm-markdown-preview a:hover": {
    textDecoration: "underline"
  },
  // Images
  ".cm-markdown-preview img": {
    maxWidth: "100%",
    height: "auto",
    borderRadius: "4px"
  },
  // Blockquotes
  ".cm-markdown-preview .md-blockquote": {
    display: "inline",
    fontStyle: "italic",
    paddingLeft: "16px",
    marginLeft: "0"
  },
  // List items
  ".cm-markdown-preview .md-list-item": {
    display: "inline"
  },
  ".cm-markdown-preview .md-list-marker": {
    marginRight: "4px"
  },
  // Horizontal rule
  ".cm-markdown-preview .md-hr, .cm-markdown-preview hr": {
    display: "block",
    border: "none",
    margin: "16px 0",
    height: "1px"
  },
  // Checkboxes
  '.cm-markdown-preview input[type="checkbox"]': {
    width: "19.2px",
    height: "19.2px",
    marginRight: "6px",
    cursor: "pointer"
  },
  ".cm-markdown-preview .md-task-icon": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.2em",
    marginRight: "6px",
    cursor: "pointer",
    userSelect: "none"
  },
  ".cm-markdown-preview .md-task-idea": {
    color: "#0ea5e9"
  },
  ".cm-markdown-preview .md-task-urgent": {
    color: "#ef4444"
  },
  ".cm-markdown-preview .md-task-question": {
    color: "#a855f7"
  },
  ".cm-markdown-preview .md-task-important": {
    color: "#ec4899"
  },
  ".cm-markdown-preview .md-task-forwarded": {
    color: "#3b82f6"
  },
  ".cm-markdown-preview .md-task-scheduled": {
    color: "#f59e0b"
  },
  // Code block lines
  ".cm-code-block-line": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.9em"
  },
  // Highlighted code
  ".cm-highlighted-code": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace'
  },
  // Table preview container
  ".cm-table-preview": {
    display: "block",
    margin: "0",
    animation: "cmFadeIn 0.15s ease-out"
  },
  // Definition list preview
  ".cm-definition-list-preview": {
    display: "block",
    margin: "0",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".md-definition-list": {
    margin: "4px 0 8px 0"
  },
  ".md-definition-list dt": {
    fontWeight: "600"
  },
  ".md-definition-list dd": {
    margin: "2px 0 6px 16px"
  },
  // Footnote preview
  ".cm-footnote-preview": {
    display: "block",
    margin: "4px 0",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".md-footnote-block": {
    display: "block"
  },
  ".md-footnote-line": {
    display: "block"
  },
  ".md-footnote-backref": {
    display: "block"
  },
  ".md-footnote-backref-link": {
    cursor: "pointer",
    fontSize: "0.85em"
  },
  ".md-wikilink": {
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: "2px"
  },
  ".cm-wikilink": {
    textDecoration: "underline",
    textUnderlineOffset: "2px"
  },
  // Table styling
  ".md-table": {
    borderCollapse: "collapse",
    borderRadius: "6px",
    overflow: "hidden"
  },
  ".md-table th, .md-table td": {
    padding: "8px 12px",
    textAlign: "left"
  },
  ".md-table th": {
    fontWeight: "600"
  },
  // Legacy single-line table styles
  ".cm-markdown-preview .md-table-row": {
    display: "inline-flex",
    borderRadius: "4px"
  },
  ".cm-markdown-preview .md-table-cell": {
    display: "inline-block",
    padding: "6px 12px",
    minWidth: "80px"
  },
  ".cm-markdown-preview .md-table-cell:last-child": {
    borderRight: "none"
  },
  ".cm-markdown-preview .md-table-separator": {
    display: "none"
  },
  // Math block preview
  ".cm-math-preview": {
    display: "block",
    padding: "8px 0",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".cm-math-preview .katex-display": {
    textAlign: "left !important",
    margin: "0 !important",
    justifyContent: "flex-start !important"
  },
  ".cm-math-preview .katex-display > .katex": {
    textAlign: "left !important"
  },
  // Mermaid diagram preview
  ".cm-mermaid-preview": {
    display: "block",
    padding: "16px 0",
    cursor: "pointer",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".cm-mermaid-preview svg": {
    maxWidth: "100%",
    height: "auto"
  },
  ".cm-mermaid-preview .mermaid-error": {
    color: "#d73a49",
    fontFamily: "monospace",
    fontSize: "0.9em"
  },
  ".cm-mermaid-block-line": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.9em"
  },
  // Callout/admonition blocks
  ".cm-callout-preview": {
    display: "block",
    borderRadius: "4px",
    borderLeft: "3px solid var(--callout-color)",
    margin: "4px 0",
    overflow: "hidden",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".cm-callout-title": {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    fontWeight: "600",
    fontSize: "0.95em"
  },
  ".cm-callout-title svg": {
    width: "18px",
    height: "18px",
    flexShrink: "0"
  },
  ".cm-callout-fold": {
    marginLeft: "auto",
    cursor: "pointer",
    transition: "transform 0.2s ease"
  },
  ".cm-callout-fold.collapsed": {
    transform: "rotate(-90deg)"
  },
  ".cm-callout-content": {
    padding: "2px 12px 8px"
  },
  ".cm-callout-content p": {
    margin: "2px 0"
  },
  ".cm-callout-line": {
    animation: "cmFadeIn 0.1s ease-out"
  },
  // Hidden lines (for multi-line blocks like tables, math, mermaid)
  ".cm-hidden-line": {
    height: "0 !important",
    padding: "0 !important",
    minHeight: "0 !important"
  },
  // Collapsed heading content (animated)
  ".cm-collapsed-line": {
    height: "0 !important",
    minHeight: "0 !important",
    padding: "0 !important",
    margin: "0 !important",
    overflow: "hidden !important",
    opacity: "0",
    lineHeight: "0 !important",
    transition: "height 0.15s ease-out, opacity 0.1s ease-out, padding 0.15s ease-out"
  },
  // Heading preview with collapse toggle
  ".cm-heading-preview": {
    display: "inline-flex",
    alignItems: "center",
    animation: "cmFadeIn 0.12s ease-out"
  },
  // Collapse toggle button
  ".cm-collapse-toggle": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
    fontSize: "0.8em",
    opacity: "0",
    transition: "opacity 0.15s ease, transform 0.15s ease",
    marginLeft: "-20px",
    width: "20px",
    height: "1em",
    flexShrink: "0"
  },
  // Collapsed: always visible
  ".cm-collapse-toggle.collapsed": {
    transform: "rotate(0deg)",
    opacity: "0.4"
  },
  ".cm-collapse-toggle.collapsed:hover": {
    opacity: "1"
  },
  // Expanded: only visible on hover
  ".cm-collapse-toggle.expanded": {
    transform: "rotate(90deg)"
  },
  ".cm-line:hover .cm-collapse-toggle.expanded": {
    opacity: "0.4"
  },
  ".cm-line:hover .cm-collapse-toggle.expanded:hover": {
    opacity: "1"
  },
  // Footnotes
  ".footnote-ref .footnote-link": {
    cursor: "pointer",
    fontSize: "0.85em"
  },
  ".footnote-def": {
    display: "inline",
    fontSize: "0.9em"
  },
  ".footnote-def sup": {
    marginRight: "4px"
  },
  // Syntax highlighting (base classes)
  ".tok-keyword": {},
  ".tok-operator": {},
  ".tok-variableName": {},
  ".tok-function, .tok-definition": {},
  ".tok-string, .tok-string2": {},
  ".tok-number": {},
  ".tok-bool, .tok-null": {},
  ".tok-comment": { fontStyle: "italic" },
  ".tok-punctuation": {},
  ".tok-propertyName": {},
  ".tok-typeName, .tok-className": {},
  ".tok-tagName": {},
  ".tok-attributeName": {},
  ".tok-attributeValue": {},
  ".tok-regexp": {},
  ".tok-meta": {},
  // Inline image preview
  ".cm-image-preview": {
    display: "block",
    padding: "8px 0",
    cursor: "pointer",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".cm-image-preview img": {
    maxWidth: "100%",
    maxHeight: "400px",
    objectFit: "contain",
    borderRadius: "6px",
    display: "block"
  },
  ".cm-image-alt": {
    display: "block",
    fontSize: "0.8em",
    marginTop: "4px",
    fontStyle: "italic"
  },
  ".cm-image-error": {
    display: "block",
    padding: "12px",
    fontSize: "0.85em",
    borderRadius: "6px",
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace'
  },
  // Frontmatter property editor
  ".cm-frontmatter-preview": {
    display: "block",
    margin: "0",
    padding: "8px 12px",
    borderRadius: "6px",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".cm-frontmatter-table": {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9em"
  },
  ".cm-frontmatter-table td": {
    padding: "3px 8px",
    verticalAlign: "middle"
  },
  ".cm-frontmatter-key": {
    fontWeight: "600",
    whiteSpace: "nowrap",
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.9em",
    width: "1%",
    paddingRight: "16px"
  },
  ".cm-frontmatter-key-input": {
    fontFamily: "inherit",
    fontWeight: "inherit",
    fontSize: "inherit",
    color: "inherit",
    background: "transparent",
    border: "none",
    outline: "none",
    padding: "2px 4px",
    borderRadius: "3px",
    boxSizing: "border-box",
    minWidth: "3ch",
    appearance: "none",
    MozAppearance: "none",
    WebkitAppearance: "none"
  },
  ".cm-frontmatter-key-input::-webkit-calendar-picker-indicator": {
    display: "none !important"
  },
  ".cm-frontmatter-value-cell": {
    width: "100%"
  },
  ".cm-frontmatter-value": {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    alignItems: "center"
  },
  ".cm-frontmatter-input": {
    border: "none",
    background: "transparent",
    width: "100%",
    font: "inherit",
    fontSize: "1em",
    outline: "none",
    padding: "2px 4px",
    borderRadius: "3px"
  },
  ".cm-frontmatter-input:focus": {
    outline: "none"
  },
  ".cm-frontmatter-checkbox": {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    margin: "0"
  },
  ".cm-frontmatter-tag": {
    display: "inline-block",
    padding: "1px 8px",
    borderRadius: "10px",
    fontSize: "0.9em",
    cursor: "text",
    outline: "none",
    lineHeight: "1.5"
  },
  ".cm-frontmatter-add-tag": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "0.85em",
    opacity: "0.4",
    userSelect: "none"
  },
  ".cm-frontmatter-add-tag:hover": {
    opacity: "1"
  },
  ".cm-frontmatter-action-cell": {
    width: "1%",
    whiteSpace: "nowrap"
  },
  ".cm-frontmatter-delete": {
    cursor: "pointer",
    opacity: "0",
    fontSize: "1.1em",
    padding: "0 4px",
    userSelect: "none",
    transition: "opacity 0.1s ease"
  },
  ".cm-frontmatter-table tr:hover .cm-frontmatter-delete": {
    opacity: "0.3"
  },
  ".cm-frontmatter-table tr:hover .cm-frontmatter-delete:hover": {
    opacity: "1"
  },
  ".cm-frontmatter-add": {
    cursor: "pointer",
    opacity: "0.4",
    fontSize: "0.85em",
    padding: "4px 8px",
    userSelect: "none"
  },
  ".cm-frontmatter-add:hover": {
    opacity: "0.8"
  },
  ".cm-frontmatter-error": {
    fontStyle: "italic",
    fontSize: "0.9em",
    padding: "4px 0",
    cursor: "pointer"
  },
  ".cm-frontmatter-line": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.9em",
    animation: "cmFadeIn 0.1s ease-out"
  },
  // Frontmatter sheet overlay
  ".cm-frontmatter-sheet-backdrop": {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    zIndex: "10",
    opacity: "0",
    transition: "opacity 0.2s ease"
  },
  ".cm-frontmatter-sheet-backdrop-visible": {
    opacity: "1"
  },
  ".cm-frontmatter-sheet": {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    zIndex: "11",
    maxHeight: "70%",
    overflowY: "auto",
    transform: "translateY(-100%)",
    transition: "transform 0.2s ease",
    borderBottomLeftRadius: "8px",
    borderBottomRightRadius: "8px"
  },
  ".cm-frontmatter-sheet-open": {
    transform: "translateY(0)"
  },
  ".cm-frontmatter-sheet-header": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px 0"
  },
  ".cm-frontmatter-sheet-title": {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "0.9em",
    fontWeight: "600"
  },
  ".cm-frontmatter-sheet-close": {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: "1",
    opacity: "0.5"
  },
  ".cm-frontmatter-sheet-close:hover": {
    opacity: "1"
  },
  ".cm-frontmatter-sheet-content": {
    padding: "8px 20px 16px"
  },
  ".cm-frontmatter-sheet-content .cm-frontmatter-preview": {
    border: "none",
    padding: "0",
    margin: "0",
    borderRadius: "0",
    animation: "none"
  },
  ".cm-frontmatter-sheet-empty": {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "0.9em",
    padding: "8px 0",
    opacity: "0.6"
  },
  ".cm-frontmatter-sheet-add-btn": {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "0.85em",
    padding: "6px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "1px solid",
    marginTop: "8px"
  },
  // Word count panel
  ".cm-word-count-panel": {
    display: "flex",
    alignItems: "center",
    gap: "0",
    padding: "4px 16px",
    fontSize: "12px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    userSelect: "none"
  },
  ".cm-word-count-stat": {
    display: "inline-flex",
    alignItems: "center",
    padding: "0 10px"
  },
  ".cm-word-count-value": {
    fontWeight: "600",
    fontVariantNumeric: "tabular-nums"
  },
  ".cm-word-count-label": {
    fontWeight: "400"
  },
  ".cm-word-count-divider": {
    width: "1px",
    height: "12px",
    flexShrink: "0"
  },
  // Tag pills
  ".md-tag": {
    display: "inline-block",
    padding: "1px 8px",
    borderRadius: "10px",
    fontSize: "0.9em",
    cursor: "pointer",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: "1.5",
    verticalAlign: "baseline"
  },
  ".cm-tag-mark": {
    borderRadius: "3px"
  },
  // Smooth transitions: focused lines fade in when raw markdown appears
  ".cm-selectedLine": {
    animation: "cmFadeIn 0.1s ease-out"
  },
  ".cm-table-line": {
    animation: "cmFadeIn 0.1s ease-out"
  },
  ".cm-math-block-line": {
    animation: "cmFadeIn 0.1s ease-out"
  },
  ".cm-mermaid-block-line": {
    animation: "cmFadeIn 0.1s ease-out"
  },
  // Backlinks panel
  ".cm-backlinks-panel": {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 16px",
    fontSize: "12px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    userSelect: "none"
  },
  ".cm-backlinks-label": {
    fontWeight: "600",
    flexShrink: "0"
  },
  ".cm-backlinks-list": {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    alignItems: "center"
  },
  ".cm-backlinks-link": {
    display: "inline-block",
    padding: "1px 8px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "11px",
    lineHeight: "1.5"
  },
  ".cm-backlinks-link:hover": {
    textDecoration: "underline"
  },
  ".cm-backlinks-empty": {
    fontStyle: "italic",
    opacity: "0.6"
  },
  // Focus mode: unfocused lines
  ".cm-unfocused-line": {
    opacity: "var(--cm-unfocused-opacity, 0.25)",
    transition: "opacity 0.2s ease"
  },
  // Writing mode sheet overlay
  ".cm-writing-mode-sheet-backdrop": {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    zIndex: "10",
    opacity: "0",
    transition: "opacity 0.2s ease"
  },
  ".cm-writing-mode-sheet-backdrop-visible": {
    opacity: "1"
  },
  ".cm-writing-mode-sheet": {
    position: "absolute",
    bottom: "48px",
    left: "0",
    right: "0",
    zIndex: "11",
    maxHeight: "70%",
    overflowY: "auto",
    transform: "translateY(100%)",
    transition: "transform 0.2s ease",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px"
  },
  ".cm-writing-mode-sheet-open": {
    transform: "translateY(0)"
  },
  ".cm-writing-mode-sheet-header": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 0"
  },
  ".cm-writing-mode-sheet-title": {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "0.95em",
    fontWeight: "600"
  },
  ".cm-writing-mode-sheet-close": {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: "1",
    opacity: "0.5"
  },
  ".cm-writing-mode-sheet-close:hover": {
    opacity: "1"
  },
  ".cm-writing-mode-sheet-content": {
    padding: "12px 20px 20px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  ".cm-writing-mode-section": {
    marginBottom: "16px"
  },
  ".cm-writing-mode-section-label": {
    display: "block",
    fontSize: "0.7em",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "8px"
  },
  ".cm-writing-mode-options": {
    display: "flex",
    gap: "8px"
  },
  ".cm-writing-mode-option": {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "10px 8px",
    borderRadius: "8px",
    border: "1px solid transparent",
    cursor: "pointer",
    fontSize: "0.85em",
    background: "none",
    transition: "background 0.15s ease, border-color 0.15s ease"
  },
  ".cm-writing-mode-option-icon": {
    fontSize: "1.4em",
    lineHeight: "1"
  },
  ".cm-writing-mode-option-label": {
    fontSize: "0.8em"
  },
  ".cm-writing-mode-pills": {
    display: "flex",
    gap: "6px"
  },
  ".cm-writing-mode-pill": {
    padding: "5px 14px",
    borderRadius: "16px",
    border: "1px solid transparent",
    cursor: "pointer",
    fontSize: "0.82em",
    fontWeight: "500",
    background: "none",
    transition: "background 0.15s ease, border-color 0.15s ease",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  ".cm-writing-mode-slider-wrap": {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  ".cm-writing-mode-slider": {
    width: "100%",
    height: "4px",
    appearance: "none",
    WebkitAppearance: "none",
    borderRadius: "2px",
    outline: "none",
    cursor: "pointer"
  },
  ".cm-writing-mode-slider-labels": {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.7em"
  },
  ".cm-writing-mode-shortcuts": {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.75em",
    flexWrap: "wrap",
    marginTop: "4px",
    paddingTop: "12px"
  },
  ".cm-writing-mode-shortcuts-label": {
    fontWeight: "500"
  },
  ".cm-writing-mode-kbd": {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "0.9em",
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    lineHeight: "1.4"
  },
  ".cm-writing-mode-kbd-desc": {
    marginRight: "8px"
  }
}), Lo = H.theme({
  // Editor background
  "&": {
    backgroundColor: "#fff"
  },
  ".cm-content": {
    caretColor: "#333"
  },
  ".cm-cursor": {
    borderLeftColor: "#333",
    borderLeftWidth: "2px"
  },
  ".cm-selectionBackground": {
    backgroundColor: "#b4d5fe"
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "#b4d5fe"
  },
  // Header colors
  ".cm-markdown-preview .md-h1": { color: "#1a1a2e" },
  ".cm-markdown-preview .md-h2": { color: "#2d2d3f" },
  ".cm-markdown-preview .md-h3": { color: "#3d3d4d" },
  ".cm-markdown-preview .md-h4": { color: "#555566" },
  ".cm-markdown-preview .md-h5": { color: "#666677" },
  ".cm-markdown-preview .md-h6": { color: "#777788" },
  // Text colors
  ".cm-markdown-preview del": { color: "#868e96" },
  ".cm-markdown-preview code": {
    backgroundColor: "#f1f3f5",
    color: "#e83e8c"
  },
  ".cm-markdown-preview a": { color: "#228be6" },
  ".cm-markdown-preview .md-blockquote": {
    color: "#555",
    borderLeft: "3px solid #c0c8d0"
  },
  ".cm-markdown-preview .md-list-marker": { color: "#888" },
  ".cm-markdown-preview .md-hr, .cm-markdown-preview hr": {
    background: "linear-gradient(to right, transparent, #c0c8d0, transparent)"
  },
  // Code block lines
  ".cm-code-block-line": {
    backgroundColor: "#f6f8fa !important",
    borderLeft: "3px solid #e1e4e8"
  },
  ".cm-code-block-line.cm-code-block-focused": {
    backgroundColor: "#e8f4fc !important",
    borderLeft: "3px solid #228be6"
  },
  // Selected lines: no background change, keep serif font, blue caret
  ".cm-selectedLine, .cm-table-line, .cm-math-block-line, .cm-mermaid-block-line, .cm-callout-line": {
    caretColor: "#228be6 !important"
  },
  ".cm-selectedLine.cm-code-block-line": {
    backgroundColor: "#e8f4fc !important",
    borderLeft: "3px solid #228be6"
  },
  // Inline image preview
  ".cm-image-preview img": {
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)"
  },
  ".cm-image-alt": {
    color: "#888"
  },
  ".cm-image-error": {
    backgroundColor: "#fff3f3",
    color: "#d73a49",
    border: "1px solid #fdd"
  },
  // Frontmatter property editor
  ".cm-frontmatter-preview": {
    backgroundColor: "#f8f9fa",
    border: "1px solid #e1e4e8"
  },
  ".cm-frontmatter-table td": {
    borderBottom: "1px solid #eee"
  },
  ".cm-frontmatter-table tr:last-child td": {
    borderBottom: "none"
  },
  ".cm-frontmatter-key": {
    color: "#555"
  },
  ".cm-frontmatter-key-input:focus": {
    backgroundColor: "#fff",
    boxShadow: "0 0 0 1px #228be6"
  },
  ".cm-frontmatter-input:focus": {
    backgroundColor: "#fff",
    boxShadow: "0 0 0 1px #228be6"
  },
  ".cm-frontmatter-tag": {
    backgroundColor: "#e8f0fe",
    color: "#1a73e8",
    border: "1px solid #d2e3fc"
  },
  ".cm-frontmatter-add-tag": {
    backgroundColor: "#e8f0fe",
    color: "#1a73e8"
  },
  ".cm-frontmatter-delete": {
    color: "#d73a49"
  },
  ".cm-frontmatter-error": {
    color: "#d73a49"
  },
  ".cm-frontmatter-line": {
    backgroundColor: "#f6f8fa !important",
    borderLeft: "3px solid #e1e4e8"
  },
  // Frontmatter sheet overlay
  ".cm-frontmatter-sheet-backdrop": {
    backgroundColor: "rgba(0, 0, 0, 0.3)"
  },
  ".cm-frontmatter-sheet": {
    backgroundColor: "#fff",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)"
  },
  ".cm-frontmatter-sheet-title": {
    color: "#333"
  },
  ".cm-frontmatter-sheet-close": {
    color: "#666"
  },
  ".cm-frontmatter-sheet-add-btn": {
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e4e8",
    color: "#333"
  },
  ".cm-frontmatter-sheet-add-btn:hover": {
    backgroundColor: "#e9ecef"
  },
  // Word count panel
  ".cm-word-count-panel": {
    backgroundColor: "#f8f9fa",
    borderTop: "1px solid #e1e4e8",
    color: "#555"
  },
  ".cm-word-count-value": {
    color: "#333"
  },
  ".cm-word-count-label": {
    color: "#888"
  },
  ".cm-word-count-divider": {
    backgroundColor: "#dee2e6"
  },
  ".cm-word-count-selection": {
    color: "#228be6"
  },
  ".cm-word-count-selection .cm-word-count-value": {
    color: "#228be6"
  },
  ".cm-word-count-selection .cm-word-count-label": {
    color: "#228be6",
    opacity: "0.7"
  },
  // Gutters
  ".cm-gutters": {
    background: "#f8f9fa",
    borderRight: "1px solid #dee2e6"
  },
  // Table styling
  ".md-table": { border: "1px solid #d0d7de" },
  ".md-table th, .md-table td": { border: "1px solid #d0d7de" },
  ".md-table th": { background: "#f6f8fa" },
  ".md-table tbody tr:hover": { background: "#f6f8fa" },
  ".cm-markdown-preview .md-table-row": {
    background: "#fff",
    border: "1px solid #d0d7de"
  },
  ".cm-markdown-preview .md-table-cell": {
    borderRight: "1px solid #d0d7de"
  },
  // Syntax highlighting (light theme colors)
  ".tok-keyword": { color: "#d73a49" },
  ".tok-operator": { color: "#d73a49" },
  ".tok-variableName": { color: "#24292e" },
  ".tok-function, .tok-definition": { color: "#6f42c1" },
  ".tok-string, .tok-string2": { color: "#032f62" },
  ".tok-number": { color: "#005cc5" },
  ".tok-bool, .tok-null": { color: "#005cc5" },
  ".tok-comment": { color: "#6a737d" },
  ".tok-punctuation": { color: "#24292e" },
  ".tok-propertyName": { color: "#005cc5" },
  ".tok-typeName, .tok-className": { color: "#22863a" },
  ".tok-tagName": { color: "#22863a" },
  ".tok-attributeName": { color: "#6f42c1" },
  ".tok-attributeValue": { color: "#032f62" },
  ".tok-regexp": { color: "#032f62" },
  ".tok-meta": { color: "#6a737d" },
  // Backlinks panel
  ".cm-backlinks-panel": {
    backgroundColor: "#f8f9fa",
    borderTop: "1px solid #e1e4e8",
    color: "#555"
  },
  ".cm-backlinks-label": {
    color: "#333"
  },
  ".cm-backlinks-link": {
    backgroundColor: "#e8f0fe",
    color: "#1a73e8",
    border: "1px solid #d2e3fc"
  },
  // Tag pills
  ".md-tag": {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    border: "1px solid #c8e6c9"
  },
  ".cm-tag-mark": {
    color: "#2e7d32"
  },
  // Writing mode sheet
  ".cm-writing-mode-sheet-backdrop": {
    backgroundColor: "rgba(0, 0, 0, 0.3)"
  },
  ".cm-writing-mode-sheet": {
    backgroundColor: "#fff",
    boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.12)"
  },
  ".cm-writing-mode-sheet-title": {
    color: "#333"
  },
  ".cm-writing-mode-sheet-close": {
    color: "#666"
  },
  ".cm-writing-mode-section-label": {
    color: "#888"
  },
  ".cm-writing-mode-option": {
    color: "#555",
    backgroundColor: "#f5f5f5"
  },
  ".cm-writing-mode-option:hover": {
    backgroundColor: "#eee"
  },
  ".cm-writing-mode-option-active": {
    backgroundColor: "#e8f0fe !important",
    borderColor: "#1a73e8 !important",
    color: "#1a73e8 !important"
  },
  ".cm-writing-mode-pill": {
    color: "#555",
    backgroundColor: "#f5f5f5"
  },
  ".cm-writing-mode-pill:hover": {
    backgroundColor: "#eee"
  },
  ".cm-writing-mode-pill-active": {
    backgroundColor: "#e8f0fe !important",
    borderColor: "#1a73e8 !important",
    color: "#1a73e8 !important"
  },
  ".cm-writing-mode-slider": {
    background: "#ddd"
  },
  ".cm-writing-mode-slider-labels": {
    color: "#999"
  },
  ".cm-writing-mode-shortcuts": {
    color: "#888",
    borderTop: "1px solid #eee"
  },
  ".cm-writing-mode-kbd": {
    backgroundColor: "#f0f0f0",
    border: "1px solid #ddd",
    color: "#555"
  },
  // Callout/admonition blocks
  ".cm-callout-preview": {
    backgroundColor: "color-mix(in srgb, var(--callout-color) 8%, white)"
  },
  ".cm-callout-title": {
    color: "var(--callout-color)"
  },
  ".cm-callout-title svg": {
    fill: "none",
    stroke: "var(--callout-color)"
  },
  ".cm-callout-content": {
    color: "#333"
  },
  // Footnotes
  ".footnote-ref .footnote-link": { color: "#228be6" },
  ".footnote-def": { color: "#666" },
  ".footnote-def sup": { color: "#228be6" },
  ".md-wikilink, .cm-wikilink": { color: "#228be6" }
}), So = H.theme({
  // Editor background
  "&": {
    backgroundColor: "#1e1e1e"
  },
  ".cm-content": {
    caretColor: "#fff",
    color: "#d4d4d4"
  },
  ".cm-cursor": {
    borderLeftColor: "#fff",
    borderLeftWidth: "2px"
  },
  ".cm-selectionBackground": {
    backgroundColor: "#264f78"
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "#264f78"
  },
  // Header colors
  ".cm-markdown-preview .md-h1": { color: "#e8e8ec" },
  ".cm-markdown-preview .md-h2": { color: "#d5d5db" },
  ".cm-markdown-preview .md-h3": { color: "#c2c2ca" },
  ".cm-markdown-preview .md-h4": { color: "#acacb8" },
  ".cm-markdown-preview .md-h5": { color: "#9696a4" },
  ".cm-markdown-preview .md-h6": { color: "#808090" },
  // Text colors
  ".cm-markdown-preview del": { color: "#777" },
  ".cm-markdown-preview code": {
    backgroundColor: "#2d2d2d",
    color: "#ce9178"
  },
  ".cm-markdown-preview a": { color: "#228be6" },
  ".cm-markdown-preview .md-blockquote": {
    color: "#aaa",
    borderLeft: "3px solid #4a4a5a"
  },
  ".cm-markdown-preview .md-list-marker": { color: "#888" },
  ".cm-markdown-preview .md-hr, .cm-markdown-preview hr": {
    background: "linear-gradient(to right, transparent, #4a4a5a, transparent)"
  },
  // Code block lines
  ".cm-code-block-line": {
    backgroundColor: "#2d2d2d !important",
    borderLeft: "3px solid #444"
  },
  ".cm-code-block-line.cm-code-block-focused": {
    backgroundColor: "#3a3d41 !important",
    borderLeft: "3px solid #569cd6"
  },
  // Selected lines: no background change, keep serif font, blue caret
  ".cm-selectedLine, .cm-table-line, .cm-math-block-line, .cm-mermaid-block-line, .cm-callout-line": {
    caretColor: "#228be6 !important"
  },
  ".cm-selectedLine.cm-code-block-line": {
    backgroundColor: "#3a3d41 !important",
    borderLeft: "3px solid #569cd6"
  },
  // Inline image preview
  ".cm-image-preview img": {
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.3)"
  },
  ".cm-image-alt": {
    color: "#888"
  },
  ".cm-image-error": {
    backgroundColor: "#3a2020",
    color: "#f48771",
    border: "1px solid #5a3030"
  },
  // Frontmatter property editor
  ".cm-frontmatter-preview": {
    backgroundColor: "#2d2d2d",
    border: "1px solid #444"
  },
  ".cm-frontmatter-table td": {
    borderBottom: "1px solid #3c3c3c"
  },
  ".cm-frontmatter-table tr:last-child td": {
    borderBottom: "none"
  },
  ".cm-frontmatter-key": {
    color: "#9cdcfe"
  },
  ".cm-frontmatter-input": {
    color: "#d4d4d4"
  },
  ".cm-frontmatter-key-input:focus": {
    backgroundColor: "#3a3d41",
    boxShadow: "0 0 0 1px #569cd6"
  },
  ".cm-frontmatter-input:focus": {
    backgroundColor: "#3a3d41",
    boxShadow: "0 0 0 1px #569cd6"
  },
  ".cm-frontmatter-tag": {
    backgroundColor: "#264f78",
    color: "#9cdcfe",
    border: "1px solid #3a6ea5"
  },
  ".cm-frontmatter-add-tag": {
    backgroundColor: "#264f78",
    color: "#9cdcfe"
  },
  ".cm-frontmatter-delete": {
    color: "#f48771"
  },
  ".cm-frontmatter-error": {
    color: "#f48771"
  },
  ".cm-frontmatter-line": {
    backgroundColor: "#2d2d2d !important",
    borderLeft: "3px solid #444"
  },
  // Frontmatter sheet overlay
  ".cm-frontmatter-sheet-backdrop": {
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  ".cm-frontmatter-sheet": {
    backgroundColor: "#252526",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)"
  },
  ".cm-frontmatter-sheet-title": {
    color: "#d4d4d4"
  },
  ".cm-frontmatter-sheet-close": {
    color: "#aaa"
  },
  ".cm-frontmatter-sheet-add-btn": {
    backgroundColor: "#3c3c3c",
    borderColor: "#555",
    color: "#d4d4d4"
  },
  ".cm-frontmatter-sheet-add-btn:hover": {
    backgroundColor: "#4a4a4a"
  },
  // Word count panel
  ".cm-word-count-panel": {
    backgroundColor: "#252526",
    borderTop: "1px solid #3c3c3c",
    color: "#aaa"
  },
  ".cm-word-count-value": {
    color: "#d4d4d4"
  },
  ".cm-word-count-label": {
    color: "#777"
  },
  ".cm-word-count-divider": {
    backgroundColor: "#444"
  },
  ".cm-word-count-selection": {
    color: "#569cd6"
  },
  ".cm-word-count-selection .cm-word-count-value": {
    color: "#569cd6"
  },
  ".cm-word-count-selection .cm-word-count-label": {
    color: "#569cd6",
    opacity: "0.7"
  },
  // Gutters
  ".cm-gutters": {
    background: "#252526",
    borderRight: "1px solid #3c3c3c"
  },
  // Table styling
  ".md-table": { border: "1px solid #444" },
  ".md-table th, .md-table td": { border: "1px solid #444" },
  ".md-table th": { background: "#2d2d2d" },
  ".md-table tbody tr:hover": { background: "#2d2d2d" },
  ".cm-markdown-preview .md-table-row": {
    background: "#1e1e1e",
    border: "1px solid #444"
  },
  ".cm-markdown-preview .md-table-cell": {
    borderRight: "1px solid #444"
  },
  // Syntax highlighting (dark theme colors)
  ".tok-keyword": { color: "#569cd6" },
  ".tok-operator": { color: "#d4d4d4" },
  ".tok-variableName": { color: "#9cdcfe" },
  ".tok-function, .tok-definition": { color: "#dcdcaa" },
  ".tok-string, .tok-string2": { color: "#ce9178" },
  ".tok-number": { color: "#b5cea8" },
  ".tok-bool, .tok-null": { color: "#569cd6" },
  ".tok-comment": { color: "#6a9955" },
  ".tok-punctuation": { color: "#d4d4d4" },
  ".tok-propertyName": { color: "#9cdcfe" },
  ".tok-typeName, .tok-className": { color: "#4ec9b0" },
  ".tok-tagName": { color: "#569cd6" },
  ".tok-attributeName": { color: "#9cdcfe" },
  ".tok-attributeValue": { color: "#ce9178" },
  ".tok-regexp": { color: "#d16969" },
  ".tok-meta": { color: "#6a9955" },
  // Backlinks panel
  ".cm-backlinks-panel": {
    backgroundColor: "#252526",
    borderTop: "1px solid #3c3c3c",
    color: "#aaa"
  },
  ".cm-backlinks-label": {
    color: "#d4d4d4"
  },
  ".cm-backlinks-link": {
    backgroundColor: "#264f78",
    color: "#9cdcfe",
    border: "1px solid #3a6ea5"
  },
  // Tag pills
  ".md-tag": {
    backgroundColor: "#1b3a1b",
    color: "#81c784",
    border: "1px solid #2e5a2e"
  },
  ".cm-tag-mark": {
    color: "#81c784"
  },
  // Writing mode sheet
  ".cm-writing-mode-sheet-backdrop": {
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  ".cm-writing-mode-sheet": {
    backgroundColor: "#252526",
    boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.4)"
  },
  ".cm-writing-mode-sheet-title": {
    color: "#d4d4d4"
  },
  ".cm-writing-mode-sheet-close": {
    color: "#aaa"
  },
  ".cm-writing-mode-section-label": {
    color: "#777"
  },
  ".cm-writing-mode-option": {
    color: "#aaa",
    backgroundColor: "#2d2d2d"
  },
  ".cm-writing-mode-option:hover": {
    backgroundColor: "#3a3a3a"
  },
  ".cm-writing-mode-option-active": {
    backgroundColor: "#264f78 !important",
    borderColor: "#569cd6 !important",
    color: "#9cdcfe !important"
  },
  ".cm-writing-mode-pill": {
    color: "#aaa",
    backgroundColor: "#2d2d2d"
  },
  ".cm-writing-mode-pill:hover": {
    backgroundColor: "#3a3a3a"
  },
  ".cm-writing-mode-pill-active": {
    backgroundColor: "#264f78 !important",
    borderColor: "#569cd6 !important",
    color: "#9cdcfe !important"
  },
  ".cm-writing-mode-slider": {
    background: "#444"
  },
  ".cm-writing-mode-slider-labels": {
    color: "#666"
  },
  ".cm-writing-mode-shortcuts": {
    color: "#666",
    borderTop: "1px solid #3c3c3c"
  },
  ".cm-writing-mode-kbd": {
    backgroundColor: "#3c3c3c",
    border: "1px solid #555",
    color: "#aaa"
  },
  // Callout/admonition blocks
  ".cm-callout-preview": {
    backgroundColor: "color-mix(in srgb, var(--callout-color) 10%, #1e1e1e)"
  },
  ".cm-callout-title": {
    color: "var(--callout-color)"
  },
  ".cm-callout-title svg": {
    fill: "none",
    stroke: "var(--callout-color)"
  },
  ".cm-callout-content": {
    color: "#d4d4d4"
  },
  // Footnotes
  ".footnote-ref .footnote-link": { color: "#228be6" },
  ".footnote-def": { color: "#aaa" },
  ".footnote-def sup": { color: "#228be6" },
  ".md-wikilink, .cm-wikilink": { color: "#228be6" }
}), Eo = H.theme({
  // Use monospace font everywhere in raw mode
  ".cm-scroller, .cm-content, .cm-line": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace !important'
  },
  // No inversion on selected lines - just subtle highlight
  ".cm-selectedLine, .cm-selectedLine.cm-code-block-line": {
    backgroundColor: "rgba(0, 0, 0, 0.05) !important",
    color: "inherit !important",
    caretColor: "#333 !important",
    filter: "none !important",
    borderRadius: "0",
    fontSize: "inherit !important"
  }
}), To = H.theme({
  // Use monospace font everywhere in raw mode
  ".cm-scroller, .cm-content, .cm-line": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace !important'
  },
  // Dark mode: subtle highlight
  ".cm-selectedLine, .cm-selectedLine.cm-code-block-line": {
    backgroundColor: "rgba(255, 255, 255, 0.1) !important",
    color: "inherit !important",
    caretColor: "#fff !important",
    filter: "none !important",
    borderRadius: "0",
    fontSize: "inherit !important"
  }
});
function Xo({ tags: e = [] } = {}) {
  return (t) => {
    const n = t.matchBefore(/#[\w/-]*$/);
    if (!n) return null;
    const i = t.state.doc.lineAt(n.from).text;
    if (/^#{1,6}\s/.test(i)) return null;
    const s = n.text.slice(1).toLowerCase(), a = e.filter((r) => r.toLowerCase().includes(s)).sort((r, l) => {
      const c = r.toLowerCase(), d = l.toLowerCase(), m = c.startsWith(s) ? 0 : 1, f = d.startsWith(s) ? 0 : 1;
      return m !== f ? m - f : c.localeCompare(d);
    }).map((r) => ({
      label: `#${r}`,
      apply: `#${r}`,
      type: "keyword"
    }));
    return {
      from: n.from,
      to: n.to,
      options: a,
      validFor: /^#[\w/-]*$/
    };
  };
}
function Go(e = []) {
  const t = e.map((n) => ({
    title: n.title,
    aliases: Array.isArray(n.aliases) ? n.aliases : [],
    normalizedTitle: n.title.toLowerCase(),
    normalizedAliases: Array.isArray(n.aliases) ? n.aliases.map((o) => o.toLowerCase()) : []
  }));
  return {
    search(n) {
      const o = n.trim().toLowerCase();
      return o ? t.map((s) => {
        const a = s.normalizedTitle.indexOf(o), r = s.normalizedAliases.length ? Math.min(
          ...s.normalizedAliases.map((c) => c.indexOf(o)).filter((c) => c !== -1)
        ) : -1, l = Math.min(
          a === -1 ? Number.POSITIVE_INFINITY : a,
          r === -1 ? Number.POSITIVE_INFINITY : r
        );
        return { entry: s, score: l };
      }).filter((s) => Number.isFinite(s.score)).sort((s, a) => s.score - a.score).map((s) => s.entry) : t;
    },
    resolve(n) {
      const o = n.trim().toLowerCase();
      return t.find((i) => i.normalizedTitle === o) || t.find((i) => i.normalizedAliases.includes(o)) || null;
    }
  };
}
function Mo(e) {
  return `${e.title}]]`;
}
function Zo(e, t) {
  return !e || !t || !t.title ? null : e.resolve(t.title);
}
function Jo({ noteIndex: e, formatLink: t } = {}) {
  const n = typeof t == "function" ? t : Mo;
  return (o) => {
    if (!e) return null;
    const i = o.matchBefore(/\[\[[^\[\]\n]*$/);
    if (!i) return null;
    const s = i.text.slice(2), r = e.search(s).map((l) => ({
      label: l.title,
      detail: l.aliases.length ? `aliases: ${l.aliases.join(", ")}` : void 0,
      apply: n(l),
      type: "text"
    }));
    return {
      from: i.from + 2,
      to: i.to,
      options: r,
      validFor: /^[^\[\]\n]*$/
    };
  };
}
const Fo = H.baseTheme({
  ".cm-more-menu-container": {
    position: "absolute",
    top: "8px",
    right: "8px",
    zIndex: "6"
  },
  ".cm-more-menu-trigger": {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "none",
    background: "rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#555",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  ".cm-more-menu-trigger:hover": {
    background: "rgba(0, 0, 0, 0.1)"
  },
  ".cm-more-menu-dropdown": {
    position: "absolute",
    top: "100%",
    right: "0",
    marginTop: "4px",
    minWidth: "180px",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)",
    padding: "4px 0",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "14px",
    overflow: "hidden"
  },
  ".cm-more-menu-item": {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "8px 12px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    color: "#333",
    fontSize: "inherit",
    fontFamily: "inherit",
    lineHeight: "1.3"
  },
  ".cm-more-menu-item:hover": {
    background: "rgba(0, 0, 0, 0.05)"
  },
  ".cm-more-menu-check": {
    width: "16px",
    textAlign: "center",
    flexShrink: "0",
    fontSize: "13px",
    color: "#555"
  },
  // Dark mode
  "&dark .cm-more-menu-trigger": {
    background: "rgba(255, 255, 255, 0.08)",
    color: "#aaa"
  },
  "&dark .cm-more-menu-trigger:hover": {
    background: "rgba(255, 255, 255, 0.14)"
  },
  "&dark .cm-more-menu-dropdown": {
    background: "#2d2d2d",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)"
  },
  "&dark .cm-more-menu-item": {
    color: "#d4d4d4"
  },
  "&dark .cm-more-menu-item:hover": {
    background: "rgba(255, 255, 255, 0.08)"
  },
  "&dark .cm-more-menu-check": {
    color: "#aaa"
  },
  ".cm-more-menu-separator": {
    height: "1px",
    margin: "4px 8px",
    backgroundColor: "#e1e4e8"
  },
  "&dark .cm-more-menu-separator": {
    backgroundColor: "#3c3c3c"
  }
});
function Qo(e = {}) {
  const t = e.items || [];
  return [N.fromClass(class {
    constructor(o) {
      this.view = o, this.open = !1, this.container = document.createElement("div"), this.container.className = "cm-more-menu-container", Object.assign(this.container.style, {
        position: "absolute",
        top: "8px",
        right: "8px",
        zIndex: "6"
      }), this.trigger = document.createElement("button"), this.trigger.className = "cm-more-menu-trigger", this.trigger.textContent = "⋯", this.trigger.title = "More options", this.trigger.addEventListener("click", (i) => {
        i.preventDefault(), i.stopPropagation(), this.toggle();
      }), this.container.appendChild(this.trigger), this.dropdown = document.createElement("div"), this.dropdown.className = "cm-more-menu-dropdown", this.dropdown.style.display = "none", this.container.appendChild(this.dropdown), this.checkEls = [];
      for (const i of t) {
        if (i.type === "separator") {
          const a = document.createElement("div");
          a.className = "cm-more-menu-separator", this.dropdown.appendChild(a);
          continue;
        }
        const s = document.createElement("button");
        if (s.className = "cm-more-menu-item", i.type === "action") {
          const a = document.createElement("span");
          a.textContent = i.label, s.appendChild(a), s.addEventListener("click", (r) => {
            r.preventDefault(), r.stopPropagation(), i.handler(o), this.close();
          });
        } else {
          const a = document.createElement("span");
          a.className = "cm-more-menu-check", a.textContent = i.getState && i.getState(o) ? "✓" : "", this.checkEls.push({ check: a, item: i });
          const r = document.createElement("span");
          r.textContent = i.label, s.appendChild(a), s.appendChild(r), s.addEventListener("click", (l) => {
            l.preventDefault(), l.stopPropagation(), i.handler(o), this.refreshChecks();
          });
        }
        this.dropdown.appendChild(s);
      }
      this._onDocClick = (i) => {
        this.open && !this.container.contains(i.target) && this.close();
      }, this._onKeyDown = (i) => {
        this.open && i.key === "Escape" && this.close();
      }, document.addEventListener("click", this._onDocClick, !0), document.addEventListener("keydown", this._onKeyDown), o.dom.appendChild(this.container);
    }
    toggle() {
      this.open ? this.close() : this.show();
    }
    show() {
      this.open = !0, this.refreshChecks(), this.dropdown.style.display = "";
    }
    close() {
      this.open = !1, this.dropdown.style.display = "none";
    }
    refreshChecks() {
      for (const { check: o, item: i } of this.checkEls)
        o.textContent = i.getState && i.getState(this.view) ? "✓" : "";
    }
    update(o) {
      this.open && this.refreshChecks();
    }
    destroy() {
      document.removeEventListener("click", this._onDocClick, !0), document.removeEventListener("keydown", this._onKeyDown), this.container.remove();
    }
  }), Fo];
}
const me = j.define({
  combine(e) {
    return {
      enablePreview: e.reduce((t, n) => n.enablePreview ?? t, !0),
      enableKeymap: e.reduce((t, n) => n.enableKeymap ?? t, !0),
      enableCollapse: e.reduce((t, n) => n.enableCollapse ?? t, !0),
      enableCustomTasks: e.reduce((t, n) => n.enableCustomTasks ?? t, !1),
      customTaskTypes: e.reduce((t, n) => n.customTaskTypes ?? t, void 0),
      enableWikiLinks: e.reduce((t, n) => n.enableWikiLinks ?? t, !1),
      enableTags: e.reduce((t, n) => n.enableTags ?? t, !1),
      onTagClick: e.reduce((t, n) => n.onTagClick ?? t, void 0),
      renderWikiLinks: e.reduce((t, n) => n.renderWikiLinks ?? t, !0),
      onWikiLinkClick: e.reduce((t, n) => n.onWikiLinkClick ?? t, void 0),
      readOnly: e.reduce((t, n) => n.readOnly ?? t, !1),
      typewriter: e.reduce((t, n) => n.typewriter ?? t, !1),
      focusMode: e.reduce((t, n) => n.focusMode ?? t, !1),
      focusLevel: e.reduce((t, n) => n.focusLevel ?? t, "paragraph"),
      dimIntensity: e.reduce((t, n) => n.dimIntensity ?? t, 30),
      toolbar: e.reduce((t, n) => n.toolbar ?? t, !0),
      wordCount: e.reduce((t, n) => n.wordCount ?? t, !1),
      backlinks: e.reduce((t, n) => n.backlinks ?? t, !1),
      docTitle: e.reduce((t, n) => n.docTitle ?? t, void 0),
      onBacklinksRequested: e.reduce((t, n) => n.onBacklinksRequested ?? t, void 0),
      onBacklinkClick: e.reduce((t, n) => n.onBacklinkClick ?? t, void 0),
      frontmatterKeys: e.reduce((t, n) => n.frontmatterKeys ?? t, void 0),
      theme: e.reduce((t, n) => n.theme ?? t, "light")
    };
  }
}), Me = R.define(), Fe = R.define(), Ne = R.define(), De = R.define(), Ie = R.define(), Re = R.define(), T = J.define({
  create(e) {
    const t = e.facet(me);
    return {
      theme: t.theme || "light",
      mode: t.enablePreview !== !1 ? "hybrid" : "raw",
      readOnly: t.readOnly === !0,
      typewriter: t.typewriter === !0,
      focusMode: t.focusMode === !0,
      focusLevel: t.focusLevel || "paragraph",
      dimIntensity: t.dimIntensity != null ? t.dimIntensity : 30,
      writingModeSheet: !1,
      toolbar: t.toolbar !== !1,
      wordCount: t.wordCount === !0,
      backlinks: t.backlinks === !0
    };
  },
  update(e, t) {
    for (const n of t.effects)
      n.is(Me) ? e = { ...e, theme: n.value } : n.is(Fe) ? e = { ...e, mode: n.value } : n.is(Ne) ? e = { ...e, readOnly: n.value } : n.is(q) ? e = { ...e, typewriter: n.value } : n.is(V) ? e = { ...e, focusMode: n.value } : n.is(ee) ? e = { ...e, focusLevel: n.value } : n.is(te) ? e = { ...e, dimIntensity: n.value } : n.is(K) ? e = { ...e, writingModeSheet: n.value } : n.is(De) ? e = { ...e, toolbar: n.value } : n.is(Ie) ? e = { ...e, wordCount: n.value } : n.is(Re) && (e = { ...e, backlinks: n.value });
    return e;
  }
}), Be = new P(), le = new P(), ne = new P(), We = new P(), Ae = new P(), Tt = new P(), Mt = new P(), Pe = new P(), Oe = new P(), $e = new P(), No = Q.transactionFilter.of((e) => !e.startState.readOnly || !e.docChanged || e.annotation(B) ? e : { changes: [] }), Do = Q.transactionExtender.of((e) => {
  const t = [];
  let n = null, o = null, i = null, s = null;
  for (const r of e.effects)
    r.is(q) && (n = r.value), r.is(V) && (o = r.value), r.is(ee) && (i = r.value), r.is(te) && (s = r.value);
  const a = e.startState.field(T);
  if (n !== null && t.push(Tt.reconfigure(n ? St : [])), o !== null || i !== null || s !== null) {
    const r = o !== null ? o : a.focusMode, l = i !== null ? i : a.focusLevel, c = s !== null ? s : a.dimIntensity;
    t.push(Mt.reconfigure(r ? Le(l, c) : []));
  }
  return t.length > 0 ? { effects: t } : null;
});
function ze(e) {
  return e === "dark" ? So : Lo;
}
function oe(e, t) {
  return t ? e === "dark" ? To : Eo : [];
}
function ei(e = {}) {
  const {
    enablePreview: t = !0,
    enableKeymap: n = !0,
    enableCollapse: o = !0,
    theme: i = "light",
    enableCustomTasks: s = !1,
    customTaskTypes: a,
    enableWikiLinks: r = !1,
    renderWikiLinks: l = !0,
    onWikiLinkClick: c,
    enableTags: d = !1,
    onTagClick: m,
    readOnly: f = !1,
    typewriter: u = !1,
    focusMode: h = !1,
    focusLevel: g = "paragraph",
    dimIntensity: b = 30,
    toolbar: k = !0,
    wordCount: w = !1,
    backlinks: v = !1,
    docTitle: x,
    onBacklinksRequested: y,
    onBacklinkClick: C,
    frontmatterKeys: L
  } = e, E = [
    // Store configuration in facet (for StateField to read initial values)
    me.of(e),
    // StateField for tracking theme/mode per editor instance
    T,
    // Read-only enforcement
    No,
    // Auto-reconfigure compartments when writing mode effects are dispatched
    Do,
    Ae.of(Q.readOnly.of(f)),
    // Core functionality
    Pt(),
    st.of([...Ot, ...$t, ...Ht]),
    // Search panel + keybindings
    jt(),
    // Multiple selections (rectangular selection + crosshair cursor)
    Ft(),
    Nt(),
    // Markdown language support
    It(),
    // Base theme (required styles)
    vo,
    // Theme (in compartment for dynamic switching)
    Be.of(ze(i)),
    // Raw mode theme (in compartment for toggling)
    ne.of(oe(i, !t)),
    // Highlight selected lines (disabled in raw mode)
    We.of(t ? ve : []),
    // Typewriter mode (cursor stays vertically centered)
    Tt.of(u ? St : []),
    // Focus mode (dims non-active paragraphs)
    Mt.of(h ? Le(g, b) : []),
    // Bottom formatting toolbar
    Pe.of(k ? Ee() : []),
    // Word count panel (bottom status bar)
    Oe.of(w ? Se : []),
    // Backlinks panel (bottom panel showing incoming links)
    ae.of({
      docTitle: x || null,
      onBacklinksRequested: typeof y == "function" ? y : null,
      onBacklinkClick: typeof C == "function" ? C : null
    }),
    $e.of(v ? Te : []),
    // Frontmatter sheet overlay (always loaded, just hidden when closed)
    Et.of(Array.isArray(L) ? L : []),
    xo,
    // Writing mode shared state (used by writing-mode-sheet plugin)
    Lt.of({ typewriter: u, focusMode: h, focusLevel: g, dimIntensity: b }),
    G,
    // Writing mode sheet overlay (always loaded, just hidden when closed)
    yo,
    // Line wrapping
    H.lineWrapping
  ];
  return t ? E.push(le.of(ye({
    enableCollapse: o,
    enableCustomTasks: s,
    customTaskTypes: a,
    enableWikiLinks: r,
    renderWikiLinks: l,
    onWikiLinkClick: c,
    enableTags: d,
    onTagClick: m
  }))) : E.push(le.of([])), n && E.push(ao), E;
}
function ti(e) {
  const t = e.state.field(T), n = t.theme === "light" ? "dark" : "light";
  return e.dispatch({
    effects: [
      Me.of(n),
      Be.reconfigure(ze(n)),
      ne.reconfigure(oe(n, t.mode === "raw"))
    ]
  }), n === "dark";
}
function ni(e) {
  const t = e.state.field(T), n = t.mode === "hybrid" ? "raw" : "hybrid", o = n === "hybrid", i = e.state.facet(me);
  return e.dispatch({
    effects: [
      Fe.of(n),
      le.reconfigure(o ? ye({
        enableCollapse: i.enableCollapse,
        enableCustomTasks: i.enableCustomTasks,
        customTaskTypes: i.customTaskTypes
      }) : []),
      ne.reconfigure(oe(t.theme, !o)),
      We.reconfigure(o ? ve : [])
    ]
  }), o;
}
function oi(e) {
  const n = !e.state.field(T).readOnly;
  return e.dispatch({
    effects: [
      Ne.of(n),
      Ae.reconfigure(Q.readOnly.of(n))
    ]
  }), n;
}
function ii(e, t) {
  e.dispatch({
    effects: [
      Ne.of(t),
      Ae.reconfigure(Q.readOnly.of(t))
    ]
  });
}
function ri(e) {
  const n = !e.state.field(T).typewriter;
  return e.dispatch({ effects: q.of(n) }), n;
}
function si(e, t) {
  e.dispatch({ effects: q.of(t) });
}
function ai(e) {
  return e.state.field(T).typewriter;
}
function ci(e) {
  const n = !e.state.field(T).focusMode;
  return e.dispatch({ effects: V.of(n) }), n;
}
function li(e, t) {
  e.dispatch({ effects: V.of(t) });
}
function di(e) {
  return e.state.field(T).focusMode;
}
function mi(e, t) {
  e.dispatch({ effects: ee.of(t) });
}
function fi(e) {
  return e.state.field(T).focusLevel;
}
function ui(e, t) {
  e.dispatch({ effects: te.of(t) });
}
function pi(e) {
  return e.state.field(T).dimIntensity;
}
function hi(e) {
  const t = e.state.field(T);
  return t.typewriter && t.focusMode ? "both" : t.typewriter ? "typewriter" : t.focusMode ? "focus" : "normal";
}
function gi(e, t) {
  const n = t === "typewriter" || t === "both", o = t === "focus" || t === "both";
  e.dispatch({
    effects: [
      q.of(n),
      V.of(o)
    ]
  });
}
function ki(e) {
  const t = e.state.field(T).writingModeSheet;
  return e.dispatch({ effects: K.of(!t) }), !t;
}
function bi(e, t) {
  e.dispatch({ effects: K.of(t) });
}
function wi(e) {
  return e.state.field(T).writingModeSheet;
}
function xi(e) {
  const n = !e.state.field(T).toolbar;
  return e.dispatch({
    effects: [
      De.of(n),
      Pe.reconfigure(n ? Ee() : [])
    ]
  }), n;
}
function Ci(e, t) {
  e.dispatch({
    effects: [
      De.of(t),
      Pe.reconfigure(t ? Ee() : [])
    ]
  });
}
function yi(e) {
  return e.state.field(T).toolbar;
}
function vi(e) {
  const n = !e.state.field(T).wordCount;
  return e.dispatch({
    effects: [
      Ie.of(n),
      Oe.reconfigure(n ? Se : [])
    ]
  }), n;
}
function Li(e, t) {
  e.dispatch({
    effects: [
      Ie.of(t),
      Oe.reconfigure(t ? Se : [])
    ]
  });
}
function Si(e) {
  return e.state.field(T).wordCount;
}
function Ei(e) {
  const n = !e.state.field(T).backlinks;
  return e.dispatch({
    effects: [
      Re.of(n),
      $e.reconfigure(n ? Te : [])
    ]
  }), n;
}
function Ti(e, t) {
  e.dispatch({
    effects: [
      Re.of(t),
      $e.reconfigure(t ? Te : [])
    ]
  });
}
function Mi(e) {
  return e.state.field(T).backlinks;
}
function Fi(e) {
  const t = e.state.field(Z);
  return e.dispatch({ effects: X.of(!t) }), !t;
}
function Ni(e, t) {
  e.dispatch({ effects: X.of(t) });
}
function Di(e) {
  return e.state.field(Z);
}
function Ii(e, t) {
  const n = e.state.field(T);
  e.dispatch({
    effects: [
      Me.of(t),
      Be.reconfigure(ze(t)),
      ne.reconfigure(oe(t, n.mode === "raw"))
    ]
  });
}
function Ri(e, t) {
  const n = e.state.field(T), o = t === "hybrid", i = e.state.facet(me);
  e.dispatch({
    effects: [
      Fe.of(t),
      le.reconfigure(o ? ye({
        enableCollapse: i.enableCollapse,
        enableCustomTasks: i.enableCustomTasks,
        customTaskTypes: i.customTaskTypes
      }) : []),
      ne.reconfigure(oe(n.theme, !o)),
      We.reconfigure(o ? ve : [])
    ]
  });
}
function Bi(e) {
  return e.state.field(T).readOnly;
}
function Wi(e) {
  return e.state.field(T).theme;
}
function Ai(e) {
  return e.state.field(T).mode;
}
export {
  me as HybridMarkdownConfig,
  F as actions,
  Te as backlinksPanel,
  vo as baseTheme,
  Ee as bottomToolbar,
  Le as createFocusModePlugin,
  Go as createNoteIndex,
  So as darkTheme,
  Yo as focusModePlugin,
  pi as getDimIntensity,
  fi as getFocusLevel,
  Ai as getMode,
  Wi as getTheme,
  hi as getWritingMode,
  ve as highlightSelectedLines,
  ei as hybridMarkdown,
  ye as hybridPreview,
  Mi as isBacklinks,
  di as isFocusMode,
  Di as isFrontmatterSheet,
  Bi as isReadOnly,
  yi as isToolbar,
  ai as isTypewriter,
  Si as isWordCount,
  wi as isWritingModeSheet,
  Lo as lightTheme,
  ao as markdownKeymap,
  Qo as moreMenu,
  Zo as resolveWikiLink,
  Ti as setBacklinks,
  ui as setDimIntensity,
  mi as setFocusLevel,
  li as setFocusMode,
  Ni as setFrontmatterSheet,
  Ri as setMode,
  ii as setReadOnly,
  Ii as setTheme,
  Ci as setToolbar,
  si as setTypewriter,
  Li as setWordCount,
  gi as setWritingMode,
  bi as setWritingModeSheet,
  Xo as tagAutocomplete,
  Ei as toggleBacklinks,
  ci as toggleFocusMode,
  Fi as toggleFrontmatterSheet,
  ni as toggleHybridMode,
  oi as toggleReadOnly,
  ti as toggleTheme,
  xi as toggleToolbar,
  ri as toggleTypewriter,
  vi as toggleWordCount,
  ki as toggleWritingModeSheet,
  St as typewriterPlugin,
  Jo as wikiLinkAutocomplete,
  Se as wordCountPanel,
  yo as writingModeSheetPlugin
};
//# sourceMappingURL=index.js.map
