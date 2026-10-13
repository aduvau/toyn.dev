# Stage 3: CRAP analysis

**Metric source:** the repo has no CRAP or complexity tool, the same as for theme-toggle.
- Coverage is **measured** with `bun test --coverage` (lines and functions; Bun reports no branches).
- Complexity is **counted by hand** (1 + each `if`, `&&` / `||` used as a branch, ternary, loop).
- CRAP = c² × (1 − cov)³ + c, computed from those two numbers.

| Function | File | Complexity | Line cov. | CRAP |
| -------- | ---- | ---------- | --------- | ---- |
| `workCard` | `src/render/components.ts` | 3 (`&&` cover, ternary shape) | 100 % | 3 |
| `contractToggle` | `src/render/components.ts` | 2 (ternary `open`) | 100 % | 2 |
| `eyebrow` | `src/render/components.ts` | 2 (`part &&`) | 100 % | 2 |
| `impact` | `src/render/components.ts` | 3 (`if`, `part &&`) | 100 % | 3 |
| `specList` | `src/render/spec.ts` | 2 (`if`) | 100 % | 2 |
| `selectorsRow` | `src/render/spec.ts` | 2 (`if`) | 100 % | 2 |
| `cardContract` | `src/system/contracts.ts` | 2 (`if`) | 100 % of lines; the `throw` branch is never taken | 2 |
| `contractEntry` | `src/render/system.ts` | 1 (was 2) | 100 % | 1 |

## Refactor
The Selectors row was built twice: once in `system.ts` (a `selectors` array, then `&&`) and once in
the panel. Both now call `selectorsRow()` in `spec.ts`. `contractEntry` dropped from complexity 2
to 1. The `/system` markup is byte-identical: the `system.md` snapshot passes and the visual
baselines are unchanged.

**After:** `bun test --coverage`: 68 pass, all changed files 100 % lines and functions. `bun run check`:
clean. The highest computed score is 3.

**Unresolved risk:** the CSS (most of this story) has no CRAP measure. It is covered by the visual
baselines and the stage 5 browser checks.
