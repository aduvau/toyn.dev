# v1.x log — `/system`, the site's own design system (2026-10-13)

See ADR-0002 for the why.

- **Contracts:** `src/system/schema.ts` (zod) + `src/system/contracts.ts` — 17 contracts (components,
  layout, utilities). Each owns its classes; `defineContracts` throws on duplicate names or classes.
  Examples call the real renderers, now in `src/render/components.ts` (they take a `root` prefix).
- **Tokens:** raw px moved into tokens (`--radius-pill`, `--border-width-thick`, `--focus-offset`,
  `--lift-sm/md`), same values. `src/system/tokens.ts` parses `tokens.css` and computes WCAG contrast
  from OKLCH. Unused `.contact-email` removed.
- **Outputs:** `/system/` (swatches, contrast table, type and space scales, all tokens, one entry per
  contract), `system.md` and `llms.txt`, all from `renderPages`. Footer colophon links to `/system/`.
  The dev server serves `.txt`/`.md` as text.
- **Guardrails:** `tests/system.test.ts` (class coverage both ways, raw values, undefined `var()`,
  contrast in both themes, focus ring, docs in sync, snapshots). Checked by injecting a rogue class, a
  raw colour/px/duration and an `outline: none`: all caught.
- **Budgets:** CSS is 11.2 KB of 12 KB; `/system/` is 27 KB of 40 KB.
