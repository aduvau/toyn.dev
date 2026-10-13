# v1 log — one page, deployed (2026-10-13)

- **Scaffold:** copied and trimmed from `../dadama` (ADR-0001): `src/cli.ts` (`serve` with live reload,
  `build`, `check`, `deploy`), build keeps `dist/.git`, Biome, strict tsc, `bun test`.
- **Content model:** `content/profile.yaml`, `content/timeline.yaml`, `content/work/*.md`, all validated
  by zod (`src/content/schemas.ts`); unknown keys and images without alt fail the build. `TODO(antoine)`
  notes become warnings (`bun run check:content`); drafts are skipped (climate sites are `draft: true`).
- **Tokens + CSS:** `styles/tokens.css` (OKLCH colours, both themes via `prefers-color-scheme`, type,
  space, radius, motion; durations drop to 0 under reduced motion).
- **Pages:** home (hero → selected work → how I work → experience → contact), one page per case study, 404.
  No client JS beyond an inline trailing-slash fix.
- **Craft:** skip link, visible `:focus-visible`, whole-card link hit areas, WebP screenshots with sizes
  and dark variants, view transitions when motion is allowed.
- **Guardrails:** `tests/build.test.ts` — budgets (CSS 12 KB, HTML 40 KB per page), one `h1`, heading
  order, alt text, internal links, no private data or `TODO`, `_redirects` shipped.
- **Deploy:** https://www.toyn.dev/ on Codeberg Pages (`toyn/toyn_output`, branch `pages`, cloned in
  `dist/`). Bare domain → www via `_redirects`. Pages needs a webhook on `toyn_output`; DNS TXT records
  alone weren't enough.
