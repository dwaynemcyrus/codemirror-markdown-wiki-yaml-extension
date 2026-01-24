# Hybrid Markdown Editor

This is a **hybrid** markdown editor built with CodeMirror 6. It shows rendered preview for unfocused lines and raw markdown for the line you're editing.

## Features

- **Live preview** - See your markdown rendered as you type
- *Italic*, **bold**, and ~~strikethrough~~ formatting
- Code blocks with syntax highlighting
- Tables, lists, and more!

### Inline Code

Use backticks for `inline code` snippets.

### Code Block

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet('World');
```

### Lists

- Bullet list item 1
- Bullet list item 2
- Bullet list item 3

1. Numbered list item 1
2. Numbered list item 2
3. Numbered list item 3

### Task List

- [x] Completed task
- [ ] Incomplete task
- [ ] Another task

### Blockquote

> This is a blockquote. It can span multiple lines and contain **formatted** text.

### Links and Images

Check out [CodeMirror](https://codemirror.net/) for more information.

![Sample Image](https://picsum.photos/400/200)

### Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Preview | Done | Works great |
| Themes | Done | Light and dark |
| Toolbar | Done | All buttons |

### Math (with KaTeX)

Inline math: $E = mc^2$

Block math:

$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

### Emoji

Supported emoji shortcodes: :smile: :heart: :rocket: :tada:

### Mermaid Diagrams

```mermaid
flowchart TB
    A[Markdown is awesome]
    A --> B[CodeMirror is amazing]
    B --> C{Line is focused?}
    C -->|Yes| D[Show as Markdown]
    C -->|No| E[Show as Preview]
    D --> F[Even better read/write experience]
    E --> F

    style A fill:#4CAF50,stroke:#2E7D32,color:#fff
    style B fill:#2196F3,stroke:#1565C0,color:#fff
    style C fill:#FF9800,stroke:#EF6C00,color:#fff
    style D fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style E fill:#009688,stroke:#00695C,color:#fff
    style F fill:#E91E63,stroke:#AD1457,color:#fff
```

---

*Click on any line to edit it!*
