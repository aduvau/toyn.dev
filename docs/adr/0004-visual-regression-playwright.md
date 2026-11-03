# ADR-0004: Visual regression on `/system` with Playwright

**Status:** Accepted
**Date:** 2026-10-13
**Deciders:** Project owner

## Context
The guardrail tests check structure and tokens: no raw values, AA contrast in both themes, every class
has a contract. They can't see a rendered page. If a CSS change moves a component's padding,
breaks its dark theme or collapses its layout, every test still passes. The `/system` page already renders
every component from its contract (ADR-0002), one `<article class="contract">` each, so it's the natural
surface to screenshot.

Taking screenshots needs a headless browser. That's a new tool, so a stack change.

## Decision
Add Playwright as a **dev dependency only**. A visual test builds the site into a temporary directory
(never `dist/`), serves it statically, and screenshots each component on
`/system` in both themes. It fails when a screenshot differs from its committed baseline.

- **What gets screenshotted:** one element shot per `<article class="contract">`, in light and in dark.
  Emulating `colorScheme` covers both themes: until a visitor uses the theme toggle (ADR-0005), the site follows `prefers-color-scheme`.
  The list of shots is derived from the `contracts` array (ADR-0002: tests derive from contracts):
  a new contract gets screenshots automatically, a test checks `/system` shows exactly one article per
  contract, and another fails on a baseline left behind by a removed contract.
- **Determinism:** Chromium only, fixed viewport and `deviceScaleFactor`, `reducedMotion: "reduce"`
  with animations disabled. Screenshots come from a static build, not the dev server, which injects a
  live-reload script.
- **Runner:** `@playwright/test` and its `toHaveScreenshot()`, which brings pixel diffing, thresholds,
  a diff report and `--update-snapshots`. It runs under Node through `bunx playwright test`, as a
  separate script (`bun run test:visual`) beside `bun test`.
- **Keeping the runners apart:** `bun test` also picks up `*.spec.*` files. Visual tests live in
  `tests/visual/` and are named `*.visual.ts`. Playwright's `testMatch` selects that suffix, and
  `bun test` ignores it.
- **Baselines:** PNGs committed next to the test (`tests/visual/__screenshots__/`). Changing them is
  a reviewed diff like any other: the agent may regenerate them only when asked, and says which ones
  changed and why.
- **Command:** `bun run test:visual` compares; `bun run test:visual --update-snapshots` rewrites the
  baselines.
- **Not a deploy gate:** like `TODO(antoine)`, the visual test is a check you run, not something that
  blocks `deploy`. `bun run build` never needs a browser.

## Options Considered
- **`@playwright/test` with `toHaveScreenshot()` (chosen):** diffing and baseline updates are built in
  and well tested. Cost: a second test runner and a `playwright.config.ts`.
- **The `playwright` library driven from `bun test`, plus `pixelmatch` and `pngjs`:** one runner. Cost:
  three dependencies instead of one, and a diff and update flow we write and maintain ourselves.
  Playwright's support for the Bun runtime is also less proven than its support for Node.
- **Baselines rendered in Docker (the official Playwright image):** the same pixels on every machine,
  and it would survive OS updates and a future CI. Cost: Docker isn't installed here, and it's a
  heavier setup for a one-person repo.
- **Do nothing:** keep relying on manual review of `/system` after CSS changes.

## Consequences
- **Baselines are tied to the machine.** The site uses system font stacks (`system-ui`, `ui-monospace`),
  and baselines are made locally on macOS. Another OS or machine renders different pixels, and a macOS
  update can change fonts and break every shot at once. When that happens, check that only rendering
  changed, then regenerate. Playwright suffixes baselines per platform, so a Linux CI could add its
  own set later.
- Binary PNGs in git: two per contract (38 today, about 2.7 MB, mostly the case-study images).
- `bunx playwright install chromium` downloads a headless Chromium (~100 MB) into the user cache, outside
  `node_modules` and the repo.
- Nothing reaches `dist/`. The site still ships no script files (ADR-0001, ADR-0003). ADR-0003 rejected
  build-time PDF generation partly because the build would depend on a browser. This keeps the
  browser out of the build too.
- Token-section changes (colour chips, type scale) are not screenshotted unless added on purpose; the
  existing token and contrast tests cover their values.
