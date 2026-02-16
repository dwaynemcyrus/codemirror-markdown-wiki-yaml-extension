/**
 * Writing Mode Sheet Overlay
 *
 * A slide-up bottom sheet that provides unified controls for writing modes:
 * mode selection (Normal/Typewriter/Focus/Both), focus level (Line/Sentence/Paragraph),
 * and dim intensity slider. Modeled on frontmatter-sheet.js.
 */

import { ViewPlugin } from '@codemirror/view';
import {
  writingModeField,
  setWritingModeSheetEffect,
  setTypewriterEffect,
  setFocusModeEffect,
  setFocusLevelEffect,
  setDimIntensityEffect,
} from './writing-mode-state.js';

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
const modKey = isMac ? '\u2318' : 'Ctrl+';

export const writingModeSheetPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.view = view;
      this.backdrop = null;
      this.sheet = null;
      this.escHandler = null;
      this.isOpen = view.state.field(writingModeField).writingModeSheet;
      if (this.isOpen) this.open();
    }

    update(update) {
      const wasOpen = this.isOpen;
      const state = update.state.field(writingModeField);
      this.isOpen = state.writingModeSheet;

      if (!wasOpen && this.isOpen) {
        this.open();
      } else if (wasOpen && !this.isOpen) {
        this.close();
      } else if (this.isOpen) {
        // Rebuild content if state changed (mode toggled, level changed, etc.)
        this.rebuildContent();
      }
    }

    open() {
      const view = this.view;

      // Create backdrop
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'cm-writing-mode-sheet-backdrop';
      this.backdrop.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        view.dispatch({ effects: setWritingModeSheetEffect.of(false) });
      });

      // Create sheet container
      this.sheet = document.createElement('div');
      this.sheet.className = 'cm-writing-mode-sheet';

      // Header
      const header = document.createElement('div');
      header.className = 'cm-writing-mode-sheet-header';

      const title = document.createElement('span');
      title.className = 'cm-writing-mode-sheet-title';
      title.textContent = 'Writing Mode';
      header.appendChild(title);

      const closeBtn = document.createElement('button');
      closeBtn.className = 'cm-writing-mode-sheet-close';
      closeBtn.textContent = '\u00d7';
      closeBtn.title = 'Close';
      closeBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        view.dispatch({ effects: setWritingModeSheetEffect.of(false) });
      });
      header.appendChild(closeBtn);

      this.sheet.appendChild(header);

      // Content area
      this.contentEl = document.createElement('div');
      this.contentEl.className = 'cm-writing-mode-sheet-content';
      this.sheet.appendChild(this.contentEl);

      this.buildContent();

      // Append to view.dom
      view.dom.appendChild(this.backdrop);
      view.dom.appendChild(this.sheet);

      // Lock scroll
      view.scrollDOM.style.overflow = 'hidden';

      // Escape key handler
      this.escHandler = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          view.dispatch({ effects: setWritingModeSheetEffect.of(false) });
        }
      };
      view.dom.addEventListener('keydown', this.escHandler, true);

      // Trigger slide-up animation
      requestAnimationFrame(() => {
        if (this.backdrop) this.backdrop.classList.add('cm-writing-mode-sheet-backdrop-visible');
        if (this.sheet) this.sheet.classList.add('cm-writing-mode-sheet-open');
      });
    }

    close() {
      const view = this.view;

      view.scrollDOM.style.overflow = '';

      if (this.escHandler) {
        view.dom.removeEventListener('keydown', this.escHandler, true);
        this.escHandler = null;
      }

      if (this.sheet) this.sheet.classList.remove('cm-writing-mode-sheet-open');
      if (this.backdrop) this.backdrop.classList.remove('cm-writing-mode-sheet-backdrop-visible');

      const sheet = this.sheet;
      const backdrop = this.backdrop;
      setTimeout(() => {
        sheet?.remove();
        backdrop?.remove();
      }, 200);

      this.sheet = null;
      this.backdrop = null;
      this.contentEl = null;
    }

    buildContent() {
      if (!this.contentEl) return;
      this.contentEl.innerHTML = '';

      const view = this.view;
      const state = view.state.field(writingModeField);
      const { typewriter, focusMode, focusLevel, dimIntensity } = state;

      // Determine current mode
      let currentMode = 'normal';
      if (typewriter && focusMode) currentMode = 'both';
      else if (typewriter) currentMode = 'typewriter';
      else if (focusMode) currentMode = 'focus';

      // === MODE SECTION ===
      const modeSection = this.createSection('MODE');
      const modeOptions = document.createElement('div');
      modeOptions.className = 'cm-writing-mode-options';

      const modes = [
        { id: 'normal', label: 'Normal', icon: '\u2014' },
        { id: 'typewriter', label: 'Typewriter', icon: '\u2338' },
        { id: 'focus', label: 'Focus', icon: '\u25CE' },
        { id: 'both', label: 'Both', icon: '\u29BF' },
      ];

      for (const mode of modes) {
        const btn = document.createElement('button');
        btn.className = 'cm-writing-mode-option';
        if (mode.id === currentMode) btn.classList.add('cm-writing-mode-option-active');
        btn.title = mode.label;

        const icon = document.createElement('span');
        icon.className = 'cm-writing-mode-option-icon';
        icon.textContent = mode.icon;
        btn.appendChild(icon);

        const label = document.createElement('span');
        label.className = 'cm-writing-mode-option-label';
        label.textContent = mode.label;
        btn.appendChild(label);

        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const tw = mode.id === 'typewriter' || mode.id === 'both';
          const fm = mode.id === 'focus' || mode.id === 'both';
          view.dispatch({
            effects: [
              setTypewriterEffect.of(tw),
              setFocusModeEffect.of(fm),
            ],
          });
        });

        modeOptions.appendChild(btn);
      }

      modeSection.appendChild(modeOptions);
      this.contentEl.appendChild(modeSection);

      // === FOCUS LEVEL SECTION (only when focus mode is active) ===
      if (focusMode) {
        const levelSection = this.createSection('FOCUS LEVEL');
        const pills = document.createElement('div');
        pills.className = 'cm-writing-mode-pills';

        const levels = [
          { id: 'line', label: 'Line' },
          { id: 'sentence', label: 'Sentence' },
          { id: 'paragraph', label: 'Paragraph' },
        ];

        for (const lvl of levels) {
          const pill = document.createElement('button');
          pill.className = 'cm-writing-mode-pill';
          if (lvl.id === focusLevel) pill.classList.add('cm-writing-mode-pill-active');
          pill.textContent = lvl.label;

          pill.addEventListener('mousedown', (e) => e.preventDefault());
          pill.addEventListener('click', (e) => {
            e.stopPropagation();
            view.dispatch({ effects: setFocusLevelEffect.of(lvl.id) });
          });

          pills.appendChild(pill);
        }

        levelSection.appendChild(pills);
        this.contentEl.appendChild(levelSection);

        // === DIM INTENSITY SECTION ===
        const dimSection = this.createSection(`DIM INTENSITY: ${dimIntensity}%`);
        this.dimLabel = dimSection.querySelector('.cm-writing-mode-section-label');

        const sliderWrap = document.createElement('div');
        sliderWrap.className = 'cm-writing-mode-slider-wrap';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'cm-writing-mode-slider';
        slider.min = '0';
        slider.max = '100';
        slider.step = '10';
        slider.value = String(dimIntensity);

        slider.addEventListener('mousedown', (e) => e.stopPropagation());
        slider.addEventListener('input', (e) => {
          e.stopPropagation();
          const val = Number(e.target.value);
          if (this.dimLabel) {
            this.dimLabel.textContent = `DIM INTENSITY: ${val}%`;
          }
          view.dispatch({ effects: setDimIntensityEffect.of(val) });
        });

        const labels = document.createElement('div');
        labels.className = 'cm-writing-mode-slider-labels';
        const lessLabel = document.createElement('span');
        lessLabel.textContent = 'Less dim';
        const moreLabel = document.createElement('span');
        moreLabel.textContent = 'More dim';
        labels.appendChild(lessLabel);
        labels.appendChild(moreLabel);

        sliderWrap.appendChild(slider);
        sliderWrap.appendChild(labels);
        dimSection.appendChild(sliderWrap);
        this.contentEl.appendChild(dimSection);
      }

      // === SHORTCUTS SECTION ===
      const shortcuts = document.createElement('div');
      shortcuts.className = 'cm-writing-mode-shortcuts';

      const shortcutLabel = document.createElement('span');
      shortcutLabel.className = 'cm-writing-mode-shortcuts-label';
      shortcutLabel.textContent = 'Shortcuts:';
      shortcuts.appendChild(shortcutLabel);

      const twKbd = document.createElement('kbd');
      twKbd.className = 'cm-writing-mode-kbd';
      twKbd.textContent = `${modKey}Shift+T`;
      shortcuts.appendChild(twKbd);

      const twDesc = document.createElement('span');
      twDesc.className = 'cm-writing-mode-kbd-desc';
      twDesc.textContent = 'Typewriter';
      shortcuts.appendChild(twDesc);

      const fmKbd = document.createElement('kbd');
      fmKbd.className = 'cm-writing-mode-kbd';
      fmKbd.textContent = `${modKey}Shift+F`;
      shortcuts.appendChild(fmKbd);

      const fmDesc = document.createElement('span');
      fmDesc.className = 'cm-writing-mode-kbd-desc';
      fmDesc.textContent = 'Focus';
      shortcuts.appendChild(fmDesc);

      this.contentEl.appendChild(shortcuts);
    }

    createSection(labelText) {
      const section = document.createElement('div');
      section.className = 'cm-writing-mode-section';

      const label = document.createElement('label');
      label.className = 'cm-writing-mode-section-label';
      label.textContent = labelText;
      section.appendChild(label);

      return section;
    }

    rebuildContent() {
      this.buildContent();
    }

    destroy() {
      if (this.isOpen) {
        if (this.escHandler) {
          this.view.dom.removeEventListener('keydown', this.escHandler, true);
        }
        this.sheet?.remove();
        this.backdrop?.remove();
        this.view.scrollDOM.style.overflow = '';
      }
    }
  }
);
