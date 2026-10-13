# ADR-0005: A theme toggle, remembered, on top of `prefers-color-scheme`

**Status:** Accepted
**Date:** 2026-10-13
**Deciders:** Project owner

## Context
v1 decided "light/dark via `prefers-color-scheme` only, no toggle, no JS" (PLAN §1). The theme toggle was
parked as the first real use case for Gherkin specs (PLAN §7). Antoine asked for it on 2026-10-13: on
first visit the theme matches the browser's preference, the toggle switches light ↔ dark, and the
choice is remembered between sessions. The story packet (criteria, QA procedure, reports) is in
`.story-pipeline/theme-toggle/`.

## Decision
- **Control:** an icon button at the end of every page's header, `<button aria-pressed>` named
  "Dark theme". It's a contract (`Theme toggle`) like every other component (ADR-0002).
- **State:** `<html data-theme="light|dark">`, set only once the visitor has chosen. Until then there is
  no attribute and the CSS follows `prefers-color-scheme`, including a system change while the page is
  open. The choice is stored in `localStorage["theme"]`. If storage throws, the toggle works for the page.
- **Script:** `client/theme.ts` holds `initTheme(document, window)`, typed and unit-tested with fakes.
  `layout()` inlines its source (`toString()`) into the page's one `<script>` in `<head>`, before the
  stylesheet, so a stored theme is applied before the first paint. It listens on `document`, so
  there is no `on*` attribute and the handler allowlist (ADR-0003) doesn't change.
- **No JavaScript:** the toggle is hidden with `@media (scripting: none)`, and the theme follows the
  system as before. No `<noscript>` text, because nothing is missing.
- **Tokens:** the dark block is repeated: once for `prefers-color-scheme: dark` unless light was chosen,
  once for `[data-theme="dark"]`. Both are screen-only, so printing stays light. A test checks that
  they're identical. The CSS budget goes from 15 to 16 KB.
- **Mutation testing:** StrykerJS (`@stryker-mutator/core`), dev-only, through its command runner on
  `bun test`, scoped to `client/theme.ts`: `bun run test:mutation`. Like the visual test, it's a check
  you run, not a deploy gate.
- **Browser QA:** the QA procedure is automated in `tests/visual/theme-toggle.e2e.ts`. It reuses
  ADR-0004's Playwright setup and static-build server; `testMatch` also takes `*.e2e.ts`, which
  `bun test` ignores. It runs with `bun run test:visual`.

## Options Considered
- **`light-dark()` tokens:** each colour token holds both values, the toggle only switches
  `color-scheme`. No duplication, but the token parser and contrast tests would change, and browsers
  older than 2024 would show light only. Not chosen; the duplication is guarded by a test instead.
- **A second `<script>` after the button, or an `onclick`:** simpler, but adds a script or a handler
  on every page. The delegated listener keeps one script and no handlers.
- **Always set `data-theme` from `matchMedia` on load:** simpler CSS, but the site would stop
  following a system change until reload.

## Consequences
- The head script is no longer a one-liner, but stays one inline `<script>` (ADR-0003) and is tested:
  unit tests on `initTheme`, and a build test runs the emitted script against fakes.
- `aria-pressed` ships as `"false"` and is corrected on `DOMContentLoaded`: before that, a screen reader
  could read the wrong state. The button can't be reached before the DOM is parsed anyway.
- Adding a contract shifts every later `/system` article, so its visual baselines move (ADR-0004).
