# Stage 5 — Executable QA

**Script:** `tests/visual/theme-toggle.e2e.ts` (Playwright, Chromium), one test per QA-procedure check.
**Environment:** the static build that `playwright.config.ts` serves on `http://localhost:4173` (built
into a temp dir, never `dist/`, never production). Each test gets a fresh context, so storage starts empty.
**Command:** `bun run test:visual` (runs the visual and e2e tests), or `bunx playwright test theme-toggle`.

## Results (2026-10-13)
- `bun run test:visual` → **56 passed** (43 visual + 13 e2e).
- `bunx playwright test theme-toggle`, ×3 → 13 passed each time (no flakiness seen).
- **#10 rewritten after review:** the first version let the system end up agreeing with the choice, so it
  proved nothing, and two `matchMedia` changes in one frame fire no event. It now waits a frame after each
  change. With a defect injected (the change handler clears the choice), #10 failed; restored, it passed 3/3.
- **Sanity check that it can fail:** with the head script moved after the stylesheet, #9 failed
  (1 failed, 12 passed). The file was restored and the tests rerun green.

## Coverage of the QA procedure
| QA # | Scenario | Automated as |
| ---- | -------- | ------------ |
| 1, 2 | First visit matches system | background lightness + `aria-pressed`, no `data-theme` |
| 3, 4 | Toggle switches both ways | clicks; background, `aria-pressed`, `data-theme` |
| 5 | Keyboard | Tab until focused, outline not `none`, Enter → dark, Space → light |
| 6, 7 | Remembered | `storageState` carried into a **new browser context** (what a restart keeps) |
| 8 | Every page | toggle on `/`, then every link of the main nav |
| 9 | No flash | stylesheet request held; `data-theme` already `dark` while it's pending |
| 10 | System change followed until chosen | `emulateMedia` before and after a click |
| 11 | Storage blocked | `localStorage` getter throws; toggle works, no page or console errors |
| 12 | Print stays light | `emulateMedia({ media: "print" })`; `--color-bg` back to light |
| 13 | No JavaScript | `javaScriptEnabled: false`, dark system → dark, toggle hidden |
| 14 | Target size, reduced motion | box ≥ 24×24 px; transition `0s` under `reducedMotion: "reduce"` |

## Manual-only gaps
- **Screen-reader speech** ("Dark theme, toggle button, pressed"): checked through the accessible role,
  name and `aria-pressed`, not through a real screen reader.
- **Focus-ring contrast and look:** covered by the contracts' contrast test and the visual baselines,
  not by this script.
- **Firefox/Safari:** Chromium only (ADR-0004). A manual spot check is in the procedure.
- **404 page:** the test server answers plain "Not found", unlike Codeberg. Covered by the build test
  (the toggle is in every built page's header, `404.html` included).
