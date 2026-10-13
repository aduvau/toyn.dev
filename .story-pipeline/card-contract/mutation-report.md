# Stage 4: mutation testing

**Tool:** StrykerJS (already a dev dependency, ADR-0005), command runner. The committed
`stryker.config.json` (scoped to `client/theme.ts`) is unchanged. This story uses its own config,
`.story-pipeline/card-contract/stryker.card-contract.json`.

**Command:** `bunx stryker run .story-pipeline/card-contract/stryker.card-contract.json`
**Test command per mutant:** `bun test tests/card-contract.test.ts tests/system.test.ts tests/build.test.ts`
**Scope:**
- `src/render/components.ts`, lines 22–34 (`eyebrow`, `impact`) and 54–86 (`workCard`, `contractToggle`)
- `src/render/spec.ts`
- `src/system/contracts.ts`, lines 461–466 (`cardContract`)

**Not in scope:** the CSS, which Stryker doesn't mutate, and the contract data. The construction lines, the
pill position and the no-lift rule are covered by the visual baselines and the stage 5 browser checks
only. The score below says nothing about them.

**No threshold** is configured for this scope, so none is claimed.

| Run | Killed | Survived | Timeout | No cov. | Score |
| --- | ------ | -------- | ------- | ------- | ----- |
| Baseline | 62 | 15 | 0 | 0 | 80.52 % |
| After the test additions | 75 | 2 | 0 | 0 | 97.40 % |

## Survivors and what was done
| Mutant | Kind | Action |
| ------ | ---- | ------ |
| `open = true` default | missing assertion (the helper always passed `open`) | test: closed unless asked |
| cover ternary `true` / `false` / `>=` / `<=` / `""` (6) | missing assertion (shape rule from story A, inside the mutated range) | test: 100×101 portrait, 100×100 and 101×100 wide |
| eyebrow text `""` | missing assertion | test: eyebrow, link, summary text |
| impact item `() => undefined` / `html```, empty-impact text | missing assertion | tests: every figure is printed; no impact means nothing in its place |
| `specList` / `selectorsRow` empty return text (2) | missing assertion | test: exact `<dl>` of a bare contract |
| `cardContract`: `if (false)` and empty error message (2) | **unreachable**: `contracts` is a constant that contains "Card"; a missing Card contract would also fail the guardrail tests and the build | kept as explicit residual risk |

**Production code changed:** none. No defect was found.

**Tests:** `bun test` 72 pass, 0 fail (16 in `tests/card-contract.test.ts`).
