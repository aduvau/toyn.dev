# Stage 4 — Mutation report

**Tool:** StrykerJS `@stryker-mutator/core` 10.0.0 (dev dependency, approved by Antoine 2026-10-13, ADR-0005).
**Command:** `bun run test:mutation` (`stryker.config.json`: command runner `bun test tests/theme.test.ts`,
`mutate: ["client/theme.ts"]`, `coverageAnalysis: off`). No threshold is configured, and none was invented.
**Scope:** `client/theme.ts`, the only file with branching logic in this story. Markup, CSS and the build
wiring are covered by `tests/build.test.ts`, `tests/system.test.ts` and the visual and e2e tests.

**Setup fix:** the repo uses TypeScript 7 (the native port), which has no JS API. Stryker's sandbox step
that rewrites `tsconfig.json` paths crashed (`ts.parseConfigFileTextToJson is not a function`).
`"tsconfigFile": ""` skips that step. It is harmless here, since the tsconfig has no `extends` or
`references` to rewrite, and `bun test` doesn't read it for resolution.

## Results
| Run | Mutants | Killed | Survived | Timeout | No cov. | Errors | Score |
| --- | ------- | ------ | -------- | ------- | ------- | ------ | ----- |
| Baseline | 42 | 40 | 2 | 0 | 0 | 0 | 95.24 % |
| Final | 35 | 35 | 0 | 0 | 0 | 0 | 100.00 % |

## Surviving mutants (baseline)
1. **`system.addEventListener("change", sync)` → `""`: missing assertion (killed).** The fake `matchMedia`
   ignored the event type, so registering on the wrong event would pass. The fake now keys listeners by
   type and fires only `"change"`, so a real defect (no update on a system change) is caught.
2. **`system.matches ? "dark" : "light"` → `"dark" : ""`: equivalent.** Every caller only compared the
   result with `"dark"`. The function was reshaped into the boolean its callers use,
   `isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : system.matches)`. That is simpler
   on its own terms, and in fairness it also removes this equivalent mutant, plus 6 others. That's why
   the count drops from 42 to 35.

## Files changed in this stage
- `tests/theme.test.ts`: the `matchMedia` fake records listeners by event type.
- `client/theme.ts`: `shown()` → `isDark()` (no behaviour change, all 12 unit tests unchanged and passing).
- `stryker.config.json`, `package.json` (`test:mutation`), `.gitignore` (`.stryker-tmp/`, `reports/`), `bun.lock`.

## Checks after hardening
`bun test` → 56 pass, 0 fail · `bun run check` → clean. HTML report: `reports/mutation/index.html` (git-ignored).
