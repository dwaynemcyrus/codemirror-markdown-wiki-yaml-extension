import { test, expect } from '@playwright/test';

async function ensureMoreMenuOpen(page) {
  const dropdown = page.locator('.cm-more-menu-dropdown');
  if (!(await dropdown.isVisible())) {
    await page.locator('.cm-more-menu-trigger').click();
    await expect(dropdown).toBeVisible();
  }
}

async function closeMoreMenu(page) {
  const dropdown = page.locator('.cm-more-menu-dropdown');
  if (await dropdown.isVisible()) {
    await page.keyboard.press('Escape');
    await expect(dropdown).toBeHidden();
  }
}

async function clickMoreMenuItem(page, label) {
  await ensureMoreMenuOpen(page);
  await page.locator('.cm-more-menu-item', { hasText: label }).click();
}

test.describe('Hybrid Markdown Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#empty');
    await page.waitForSelector('.cm-editor');
  });

  test('should load the editor', async ({ page }) => {
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('.cm-content')).toBeVisible();
  });

  test('should render more menu (toolbar off by default)', async ({ page }) => {
    await expect(page.locator('.cm-bottom-toolbar')).toHaveCount(0);
    await expect(page.locator('.cm-more-menu-trigger')).toBeVisible();
  });

  test('should accept text input', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('Hello World');
    await expect(page.locator('.cm-content')).toContainText('Hello World');
  });

  test('should render header preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('# Hello');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Some text');
    await expect(page.locator('.cm-markdown-preview .md-h1')).toBeVisible();
  });

  test('should show raw markdown when line is focused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('**bold text**');
    await expect(page.locator('.cm-content')).toContainText('**bold text**');
  });

  test('should render bold preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('**bold text**');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview strong')).toBeVisible();
  });

  test('should render italic preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('*italic text*');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview em')).toBeVisible();
  });

  test('should render link preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('[link](https://example.com)');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview a')).toBeVisible();
  });

  test('should render inline code preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('Use `code` here');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview code')).toBeVisible();
  });

  test('should style code blocks', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('```javascript');
    await page.keyboard.press('Enter');
    await page.keyboard.type('const x = 1;');
    await page.keyboard.press('Enter');
    await page.keyboard.type('```');
    await page.keyboard.press('Enter');
    await page.keyboard.type('text after');
    await expect(page.locator('.cm-code-block-line')).toBeVisible();
  });

  test('should render table preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('| A | B |');
    await page.keyboard.press('Enter');
    await page.keyboard.type('|---|---|');
    await page.keyboard.press('Enter');
    await page.keyboard.type('| 1 | 2 |');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('text after table');
    await expect(page.locator('.md-table')).toBeVisible();
  });

  test('should render blockquote preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('> This is a quote');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview .md-blockquote')).toBeVisible();
  });

  test('should render list items when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('- Item 1');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- Item 2');
    await page.keyboard.press('Enter');
    await page.keyboard.type('text after');
    await expect(page.locator('.cm-markdown-preview .md-list-marker').first()).toBeVisible();
  });

  test('should render highlight when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('==highlighted==');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview .md-highlight')).toBeVisible();
  });

  test('should render subscript when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('H~2~O');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview .md-subscript')).toBeVisible();
  });

  test('should render superscript when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('x^2^');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview .md-superscript')).toBeVisible();
  });

  test('should render heading IDs when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('### Heading [#heading-id]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview [data-heading-id="heading-id"]')).toBeVisible();
  });

  test('should render definition lists when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('Term One');
    await page.keyboard.press('Enter');
    await page.keyboard.type(': First definition');
    await page.keyboard.press('Enter');
    await page.keyboard.type(': Second definition');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-definition-list-preview .md-definition-list')).toBeVisible();
  });

  test('should render multi-line footnotes when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('Footnote ref[^note]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('[^note]: First line');
    await page.keyboard.press('Enter');
    await page.keyboard.type('  Second line');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await page.evaluate(() => document.querySelector('.cm-content')?.blur());
    await expect(page.locator('.cm-footnote-preview')).toBeVisible();
  });

  test('should render emoji shortcodes when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('Camping :tent:');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview')).toContainText('⛺');
  });

  test('should render wiki links when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('See [[Project Plan]]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview .md-wikilink')).toHaveText('Project Plan');
  });

  test('should render section-only wiki links when no alias is provided', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('See [[Research Notes#Open Questions]]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview .md-wikilink')).toHaveText('Open Questions');
  });

  test('should not parse wiki links inside inline code', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('`[[NotALink]]`');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview code')).toContainText('[[NotALink]]');
    await expect(page.locator('.cm-markdown-preview .md-wikilink')).toHaveCount(0);
  });

  test('should handle wiki link clicks inside table preview', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('| Link |');
    await page.keyboard.press('Enter');
    await page.keyboard.type('|---|');
    await page.keyboard.press('Enter');
    await page.keyboard.type('| [[Project Plan]] |');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await page.locator('.cm-table-preview .md-wikilink').click();
    const lastTitle = await page.evaluate(() => window.__wikiLinkTelemetry?.last?.title || '');
    await expect(lastTitle).toBe('Project Plan');
  });

  test('should handle wiki link clicks inside definition list preview', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('Term One');
    await page.keyboard.press('Enter');
    await page.keyboard.type(': See [[Meeting Notes]]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await page.locator('.cm-definition-list-preview .md-wikilink').click();
    const lastTitle = await page.evaluate(() => window.__wikiLinkTelemetry?.last?.title || '');
    await expect(lastTitle).toBe('Meeting Notes');
  });

  test('should handle wiki link clicks inside footnote preview', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('Footnote ref[^note]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('[^note]: See [[Project Plan]]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await page.evaluate(() => document.querySelector('.cm-content')?.blur());
    await expect(page.locator('.cm-footnote-preview .md-wikilink')).toBeVisible();
    await page.locator('.cm-footnote-preview .md-wikilink').click();
    const lastTitle = await page.evaluate(() => window.__wikiLinkTelemetry?.last?.title || '');
    await expect(lastTitle).toBe('Project Plan');
  });

  test('should render custom task icons when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('- [i] Info task');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview .md-task-icon[data-task="i"]')).toBeVisible();
  });

  test('should cycle custom task types on click', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('- [x] Cycle task');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await page.locator('.cm-markdown-preview .md-task-icon.md-task-complete').first().click();
    await page.locator('.cm-markdown-preview').first().click();
    await expect(page.locator('.cm-content')).toContainText('[i] Cycle task');
  });
});

test.describe('Bottom Toolbar Actions', () => {
  const selectAllKey = process.platform === 'darwin' ? 'Meta+a' : 'Control+a';

  test.beforeEach(async ({ page }) => {
    await page.goto('/#empty');
    await page.waitForSelector('.cm-editor');
    // Toolbar is off by default — enable it via the more menu
    await clickMoreMenuItem(page, 'Toolbar');
    await closeMoreMenu(page);
    await expect(page.locator('.cm-bottom-toolbar')).toBeVisible();
    await page.locator('.cm-content').click();
  });

  test('should insert bold markers with toolbar button', async ({ page }) => {
    await page.keyboard.type('text');
    await page.keyboard.press(selectAllKey);
    await page.locator('.cm-bottom-toolbar-btn[title="Bold"]').click();
    await expect(page.locator('.cm-content')).toContainText('**text**');
  });

  test('should insert italic markers with toolbar button', async ({ page }) => {
    await page.keyboard.type('text');
    await page.keyboard.press(selectAllKey);
    await page.locator('.cm-bottom-toolbar-btn[title="Italic"]').click();
    await expect(page.locator('.cm-content')).toContainText('_text_');
  });

  test('should insert heading prefix with toolbar button', async ({ page }) => {
    await page.keyboard.type('Title');
    await page.locator('.cm-bottom-toolbar-btn[title="Heading 1"]').click();
    await expect(page.locator('.cm-content')).toContainText('# Title');
  });

  test('should insert code block with toolbar button', async ({ page }) => {
    await page.locator('.cm-bottom-toolbar-btn[title="Code Block"]').click();
    await expect(page.locator('.cm-content')).toContainText('```');
  });

  test('should insert table with toolbar button', async ({ page }) => {
    await page.locator('.cm-bottom-toolbar-btn[title="Table"]').click();
    await expect(page.locator('.cm-content')).toContainText('| Column 1 |');
  });

  test('should insert link with toolbar button', async ({ page }) => {
    await page.locator('.cm-bottom-toolbar-btn[title="Link"]').click();
    await expect(page.locator('.cm-content')).toContainText('[link text]');
  });

  test('should insert horizontal rule with toolbar button', async ({ page }) => {
    await page.keyboard.type('Some text');
    await page.locator('.cm-bottom-toolbar-btn[title="Horizontal Rule"]').click();
    await expect(page.locator('.cm-markdown-preview hr, .md-hr')).toBeVisible();
  });

  test('should insert bullet list with toolbar button', async ({ page }) => {
    await page.locator('.cm-bottom-toolbar-btn[title="Bullet List"]').click();
    await expect(page.locator('.cm-content')).toContainText('- ');
  });

  test('should undo and redo with toolbar buttons', async ({ page }) => {
    const undoBtn = page.locator('.cm-bottom-toolbar-btn[title="Undo"]');
    const redoBtn = page.locator('.cm-bottom-toolbar-btn[title="Redo"]');

    await expect(undoBtn).toBeDisabled();
    await expect(redoBtn).toBeDisabled();

    await page.keyboard.type('Hello');
    await expect(undoBtn).toBeEnabled();

    await undoBtn.click();
    await expect(page.locator('.cm-content')).not.toContainText('Hello');
    await expect(redoBtn).toBeEnabled();

    await redoBtn.click();
    await expect(page.locator('.cm-content')).toContainText('Hello');
  });
});

test.describe('More Menu Toggles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#empty');
    await page.waitForSelector('.cm-editor');
    await page.locator('.cm-content').click();
  });

  test('should toggle raw mode from more menu', async ({ page }) => {
    await page.keyboard.type('# Heading');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');
    await expect(page.locator('.cm-markdown-preview .md-h1')).toBeVisible();

    await clickMoreMenuItem(page, 'Raw mode');
    await closeMoreMenu(page);
    await expect(page.locator('.cm-markdown-preview .md-h1')).toHaveCount(0);
  });

  test('should toggle dark mode from more menu', async ({ page }) => {
    await ensureMoreMenuOpen(page);
    const darkItem = page.locator('.cm-more-menu-item', { hasText: 'Dark mode' });
    const darkCheck = darkItem.locator('.cm-more-menu-check');
    await expect(darkCheck).toHaveText('');
    await darkItem.click();
    await expect(darkCheck).toHaveText('✓');
    await darkItem.click();
    await expect(darkCheck).toHaveText('');
    await closeMoreMenu(page);
  });

  test('should block typing in read-only mode', async ({ page }) => {
    await clickMoreMenuItem(page, 'Read-only');
    await closeMoreMenu(page);
    await page.keyboard.type('Cannot edit');
    await expect(page.locator('.cm-content')).not.toContainText('Cannot edit');
  });

  test('should allow task toggles in read-only mode', async ({ page }) => {
    await page.keyboard.type('- [ ] Task');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await clickMoreMenuItem(page, 'Read-only');
    await closeMoreMenu(page);

    await page.locator('.cm-markdown-preview .md-task-icon').first().click();
    await page.locator('.cm-markdown-preview').first().click();
    await expect(page.locator('.cm-content')).toContainText('[x] Task');
  });

  test('should toggle word count panel from more menu', async ({ page }) => {
    await expect(page.locator('.cm-word-count-panel')).toHaveCount(0);
    await clickMoreMenuItem(page, 'Word count');
    await expect(page.locator('.cm-word-count-panel')).toBeVisible();
    await clickMoreMenuItem(page, 'Word count');
    await expect(page.locator('.cm-word-count-panel')).toHaveCount(0);
  });

  test('should toggle bottom toolbar from more menu', async ({ page }) => {
    await expect(page.locator('.cm-bottom-toolbar')).toHaveCount(0);
    await clickMoreMenuItem(page, 'Toolbar');
    await expect(page.locator('.cm-bottom-toolbar')).toBeVisible();
    await clickMoreMenuItem(page, 'Toolbar');
    await expect(page.locator('.cm-bottom-toolbar')).toHaveCount(0);
  });

  test('should open properties sheet and add frontmatter', async ({ page }) => {
    await clickMoreMenuItem(page, 'Properties');
    await expect(page.locator('.cm-frontmatter-sheet')).toBeVisible();
    await expect(page.locator('.cm-frontmatter-sheet-add-btn')).toBeVisible();
    await page.locator('.cm-frontmatter-sheet-add-btn').click();
    await expect(page.locator('.cm-frontmatter-preview')).toBeVisible();
    await page.locator('.cm-frontmatter-sheet-close').click();
    await expect(page.locator('.cm-frontmatter-sheet')).toHaveCount(0);
  });
});

test.describe('Keyboard Shortcuts', () => {
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

  test.beforeEach(async ({ page }) => {
    await page.goto('/#empty');
    await page.waitForSelector('.cm-editor');
    await page.locator('.cm-content').click();
  });

  test('should insert bold with keyboard shortcut', async ({ page }) => {
    await page.keyboard.type('text');
    await page.keyboard.press(`${modifier}+a`);
    await page.keyboard.press(`${modifier}+b`);
    await expect(page.locator('.cm-content')).toContainText('**text**');
  });

  test('should insert italic with keyboard shortcut', async ({ page }) => {
    await page.keyboard.type('text');
    await page.keyboard.press(`${modifier}+a`);
    await page.keyboard.press(`${modifier}+i`);
    await expect(page.locator('.cm-content')).toContainText('_text_');
  });

  test('should insert link with keyboard shortcut', async ({ page }) => {
    await page.keyboard.type('text');
    await page.keyboard.press(`${modifier}+a`);
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.locator('.cm-content')).toContainText('[text](https://example.com)');
  });

  test('should undo with keyboard shortcut', async ({ page }) => {
    await page.keyboard.type('Hello');
    await expect(page.locator('.cm-content')).toContainText('Hello');
    await page.keyboard.press(`${modifier}+z`);
    await expect(page.locator('.cm-content')).not.toContainText('Hello');
  });
});
