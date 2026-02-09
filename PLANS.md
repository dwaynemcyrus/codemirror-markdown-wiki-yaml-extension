# PLANS

## Feature: Custom Task Types (Initial Pass)

Plan
1. Align API and behavior: add `enableCustomTasks` and `customTaskTypes` options, default cycle order `[ ] -> [x] -> [i] -> [!] -> [?] -> [*] -> [>] -> [<]`, list-item-only detection, emoji mapping, and non-breaking defaults.
2. Implement custom task rendering and click-to-cycle in the library preview pipeline while preserving existing standard task behavior when the feature is disabled.
3. Style custom task visuals for light and dark themes without changing existing layout or typography.
4. Update the `demo/` app to enable custom tasks and showcase the new markers in the example content.
5. Update tests and package metadata (rename package to `codemirror-for-writers`) to reflect the new behavior and publishing target.
6. Run verification: lint/typecheck (if available), `npm run test`, and `npm run build:lib`/`npm run build`.

Expected Files
- package.json
- README.md
- lib/extensions/hybrid-preview.js
- lib/utils/markdown.js
- lib/theme/base.js
- demo/main.js
- demo/public/example.md
- demo/styles.css
- tests/editor.spec.js

Risks
- Changing task parsing could affect existing list rendering if detection is too broad.
- Emoji rendering varies by OS; ensure layout tolerates different glyph sizes.
- Package rename may require updates to demo imports and documentation.

Verification
- `npm run test`
- `npm run build:lib`
- `npm run build`
- Lint/typecheck scripts (if present in package.json)
