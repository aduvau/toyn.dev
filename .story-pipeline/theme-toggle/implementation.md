# Stage 2 — Implementation notes

## Changed files
| File | Change |
| ---- | ------ |
| `client/theme.ts` | **new.** `initTheme(document, window)`: applies a stored theme, syncs `aria-pressed` on `DOMContentLoaded` and on system change, delegated click toggles + stores. |
| `src/render/layout.ts` | One head `<script>`: trailing-slash fix + `(${initTheme})(document,window)`, before the stylesheet. |
| `src/render/components.ts` | `themeToggle()` button; appended to `siteHeader()`. |
| `styles/tokens.css` | Dark block repeated: `:root:not([data-theme="light"])` under `prefers-color-scheme: dark`, and `:root[data-theme="dark"]`; both `@media screen`. |
| `styles/main.css` | `color-scheme` per chosen theme (dark screen-only), header flex, `.theme-toggle` styles, hidden under `scripting: none`. |
| `src/system/tokens.ts` | Parser also reads the chosen-dark block (`chosenDark`). |
| `src/system/contracts.ts` | New **Theme toggle** contract; Page a11y line updated. |
| `tests/theme.test.ts` | **new.** 12 unit tests with fake `document`/`window`. |
| `tests/build.test.ts` | Toggle on every page + hidden w/o JS; head script runs before CSS and applies a stored theme (eval of the emitted script); chosen dark is screen-only; CSS budget 15 → 16 KB; print-button regex loosened (rule now shared). |
| `tests/system.test.ts` | Both dark blocks identical. |
| `tests/__snapshots__/system.test.ts.snap` | Intended: new contract in `system.md`/`llms.txt`, focus-ring row lists Theme toggle. |
| `tests/visual/__screenshots__/` | 2 new (`c-theme-toggle-{light,dark}`), 34 updated: every article after Button moved down by the new article's height (fractional offset → anti-aliasing and ±1px heights). Link, Button unchanged. Verified by diff images, sizes. |
| `docs/adr/0005-theme-toggle.md` | **new.** Decision; PLAN §1/§6/§7, ADR-0003, ADR-0004 wording updated. |

## Criteria → evidence
| Scenario | Evidence (stage 2) |
| -------- | ------------------ |
| First visit matches system (light/dark) | `theme.test.ts` "on first visit" |
| Toggle switches both ways | "the toggle" tests |
| Keyboard | native `<button>` (Enter/Space); global `:focus-visible` ring — automated in stage 5 |
| Remembered on later visits | "between sessions" tests; build test evals emitted script |
| Every page | build test: toggle in every page's header; script in shared `layout()` |
| Applied before first paint | build test: `<script>` precedes stylesheet and sets `data-theme` synchronously |
| System change followed until chosen | "follows a system change…", "wins over later system changes" |
| Storage blocked | "when storage is blocked" |
| Printing light | build test: chosen dark only inside `@media screen` |
| No JS | build test: `scripting: none` hides `.theme-toggle`; tokens unchanged for system |

## Commands (all run 2026-10-13)
- `bun test` → 56 pass, 0 fail
- `bun run check` → tsc + Biome clean
- `bun run test:visual` → 43 passed (after an intended `--update-snapshots`)

## Later changes
- Stage 4: `shown()` → `isDark()` (see `mutation-report.md`). Stage 5: e2e #10 rewritten to discriminate (see `qa-automation.md`).

## Design notes
- Button is 26 px (≥24 px target) so it fits the nav's 27.2 px line and the header height doesn't change.
- Dropped a redundant `--color-fg`/`--color-bg` 3:1 pair: Page already holds it at 4.5:1.

## Follow-up (Antoine, 2026-10-13): mobile placement
Below `48rem` (the site's existing breakpoint) the header aligns to the top and the toggle grows to
42px (padding `--space-2`, icon `--space-6`), instead of a 26px button centred between the two nav
lines. Desktop is unchanged. A new e2e check (#14, 375px) asserts ≥40px and top alignment with the nav.
`/system` baselines: the toggle article gained one state line, so it and the 17 articles after it
moved down (×2 themes, 36 PNGs); Link and Button are unchanged.
