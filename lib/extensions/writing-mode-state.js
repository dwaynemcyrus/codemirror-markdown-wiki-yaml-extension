/**
 * Shared state for writing mode features.
 * Both index.js and writing-mode-sheet.js import from here to avoid circular dependencies.
 */

import { Facet, StateEffect, StateField } from '@codemirror/state';

/**
 * Facet for providing initial writing mode config.
 * index.js populates this so writingModeField can read initial values.
 */
export const writingModeConfigFacet = Facet.define({
  combine(values) {
    if (values.length === 0) return {};
    return values[values.length - 1];
  },
});

/** Effect: toggle writing mode sheet open/close */
export const setWritingModeSheetEffect = StateEffect.define();

/** Effect: set typewriter mode */
export const setTypewriterEffect = StateEffect.define();

/** Effect: set focus mode */
export const setFocusModeEffect = StateEffect.define();

/** Effect: set focus level ('line'|'sentence'|'paragraph') */
export const setFocusLevelEffect = StateEffect.define();

/** Effect: set dim intensity (0-100) */
export const setDimIntensityEffect = StateEffect.define();

/**
 * StateField tracking all writing-mode-related state.
 * Responds to the effects above.
 */
export const writingModeField = StateField.define({
  create(state) {
    const config = state.facet(writingModeConfigFacet);
    return {
      writingModeSheet: false,
      typewriter: config.typewriter === true,
      focusMode: config.focusMode === true,
      focusLevel: config.focusLevel || 'paragraph',
      dimIntensity: config.dimIntensity != null ? config.dimIntensity : 30,
    };
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setWritingModeSheetEffect)) {
        value = { ...value, writingModeSheet: effect.value };
      } else if (effect.is(setTypewriterEffect)) {
        value = { ...value, typewriter: effect.value };
      } else if (effect.is(setFocusModeEffect)) {
        value = { ...value, focusMode: effect.value };
      } else if (effect.is(setFocusLevelEffect)) {
        value = { ...value, focusLevel: effect.value };
      } else if (effect.is(setDimIntensityEffect)) {
        value = { ...value, dimIntensity: effect.value };
      }
    }
    return value;
  },
});
