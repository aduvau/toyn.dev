# ADR-0003: HTML and CSS first; JavaScript only as progressive enhancement

**Status:** Accepted
**Date:** 2026-10-13
**Deciders:** Project owner

## Context
The site ships no client-side JavaScript beyond an inline trailing-slash fix (v1). The résumé needed a
"Save as PDF" button, and the only way to open the print dialog from a button is `window.print()`.
Some visitors have JavaScript off or blocked, and a button that does nothing is worse than no button.

## Decision
Every page works fully with HTML and CSS alone. JavaScript may only **add** to a page that already works,
and the no-JS version is designed, not left to chance:
- The enhanced control is hidden when scripting is off, with the CSS media feature
  `@media (scripting: none)`, so nobody sees a dead button.
- The fallback goes in `<noscript>`, so visitors with JavaScript don't see it.
- No script files and no bundle: an enhancement is an inline handler, small enough to read in the HTML.

First use: the résumé's `<button onclick="print()">Save as PDF</button>`, with a `<noscript>` hint
("print this page and choose Save as PDF").

`tests/build.test.ts` enforces it: no `<script src>`, at most the one inline `<script>`, and an exact
allowlist of inline handlers per page (today: `onclick="print()"` on `/resume` only). It also checks
that the button and its fallback are both in place.

Second use (ADR-0005): the theme toggle, hidden with `scripting: none` (the theme then follows the
system). Its script joins the trailing-slash fix in the one inline `<script>`, with a delegated listener
instead of an `on*` handler.

## Options Considered
- **Progressive enhancement with CSS + `<noscript>` (chosen):** no script tag. Each case is handled by
  the browser itself: `scripting: none` hides the button, `<noscript>` shows the hint.
- **A script that reveals the button (`hidden` removed on load):** the classic pattern, but it adds a
  `<script>` and a flash of layout on every load, for nothing CSS can't do.
- **Generate `resume.pdf` at build time:** no JS at all, but the build would depend on a headless
  browser (a new tool, so a stack change).
- **Keep only the how-to:** no JS, but a worse experience for almost everyone.

## Consequences
- Adding an interaction means designing its no-JS state first, then adding its handler to the test's
  allowlist on purpose.
- Browsers without `@media (scripting)` (pre-2023) show both the button and, with JS off, the hint. That's
  acceptable: the button still works wherever JS runs.
- Blockers that stop scripts without the browser reporting `scripting: none` (some extensions) show a
  button that does nothing; the print shortcut still works.
