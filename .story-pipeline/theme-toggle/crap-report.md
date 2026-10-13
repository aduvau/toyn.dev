# Stage 3 — CRAP analysis

**Metric source:** the repo has no CRAP or complexity tool, and none was added for this stage.
- Coverage is **measured**: `bun test --coverage` (Bun 1.x, line + function coverage; Bun emits no branch data).
- Cyclomatic complexity is **counted by hand** (1 + each `if`, `||`, `??`, ternary, loop, `catch`).
- CRAP = c² × (1 − cov)³ + c is computed from those two numbers. It isn't a tool measurement.

## Changed surface
| Function | File | Complexity (manual) | Line cov. (measured) | CRAP (computed) |
| -------- | ---- | ------------------- | -------------------- | --------------- |
| `initTheme` (body) | `client/theme.ts` | 4 (`if`, `\|\|`, `catch`) | 100 % | 4 |
| `shown` | `client/theme.ts` | 3 (`??`, ternary) | 100 % | 3 |
| `sync` | `client/theme.ts` | 2 (`for`) | 100 % | 2 |
| click handler | `client/theme.ts` | 4 (`if`, ternary, `catch`) | 100 % | 4 |
| `themeToggle` | `src/render/components.ts` | 1 | 100 % | 1 |
| `siteHeader` (one interpolation added) | `src/render/components.ts` | unchanged | 100 % | — |
| `parseTokens` (one line added) | `src/system/tokens.ts` | 1 | 100 % of its lines (file 97.96 %: `blockAfter`'s unbalanced-brace fallback, pre-existing) | 1 |
| `layout` / `HEAD_SCRIPT` | `src/render/layout.ts` | 1 | 100 % | 1 |

**Branch evidence.** Bun doesn't report branches, so they're tied to tests instead. Stored `light`, `dark`,
invalid and absent; storage blocked on read and on write; click on and off the toggle; theme shown from
the system and from the choice; system changes before and after a choice. Each has a test in
`tests/theme.test.ts`.

**Superseded in stage 4:** `shown` was replaced by `isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : system.matches)`:
complexity 2 (ternary), 100 % lines, CRAP 2; the click handler drops to the same 4. The shipped code's highest computed score is 4.

## Before / after
No refactor: the highest computed score is 4, with every line covered. The functions are already
small and single-purpose, and no simplification would lower risk without changing behaviour.

## Tests run
`bun test` → 56 pass, 0 fail (same as stage 2; no code changed in this stage).

## Unresolved risk
Branch coverage isn't measured. Stage 4 (mutation) is the stronger check of whether each branch is asserted.
