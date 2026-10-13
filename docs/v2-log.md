# v2 log — `/writing` and visual regression (2026-10-13)

## 1. The article, "Framing the agent"

- **Section (code):** `content/writing/<slug>.md`, front matter validated by a zod `postSchema`
  (`title`, `summary`, `date` ISO, `draft`); same loader rules as case studies (unknown keys refused,
  drafts skipped, `TODO(antoine)` = warning). Pages `writing/` (index, newest first, `<time datetime>`)
  and `writing/<slug>/`; URL constants in `src/render/urls.ts`.
- **Nav:** Home · Writing · Résumé · Design system. With no published post, `/writing` and its nav link
  aren't built. Writing lives in the nav only, no block on the home page.
- **Prose:** code blocks (`pre`/`code`, token-only styles) wrap instead of scrolling, so no extra tab
  stop; no syntax highlighting (no new dependency).
- **System:** new layout contracts (writing index, article); the Page contract's nav rule updated;
  `llms.txt` gets a "Writing" section.
- **Tests:** `tests/writing.test.ts` — posts built and linked from the index and `llms.txt`, bad front
  matter refused, drafts kept out of the output, the nav test covers the new link.
- **Article (content):** `content/writing/framing-the-agent.md`, written by Antoine; the agent outlined,
  edited for clarity and fact-checked against the repo. Links the source repo and `/system`; tells the
  "agent ran ahead" story as the guardrail Antoine was missing. Deploys were held until it was finished.
- **Deployed** 2026-10-13 (`toyn_output` commit "Deploy toyn 588dea7").

## 2. Visual regression on `/system`

- **Decision:** ADR-0004, approved by Antoine: `@playwright/test` as a dev dependency, baselines made
  on his Mac, components only (tokens are covered by the existing value and contrast tests).
- **How:** `bun run test:visual` builds into a temp directory (never `dist/`), serves it statically
  (`tests/visual/serve.ts`, no live-reload script) and screenshots each `article.contract` in light and
  dark (Chromium, 1280×800, scale 1, reduced motion, animations off). Baselines in
  `tests/visual/__screenshots__/` (38 PNGs, ~2.7 MB). `--update-snapshots` accepts a change on purpose.
- **Derived from contracts:** the shot list comes from `contracts`; one test checks `/system` has exactly
  one article per contract, another fails on a baseline left behind by a removed contract (this
  platform's set only, so a future Linux set can coexist).
- **Kept apart from `bun test`:** files are `*.visual.ts`, selected by Playwright's `testMatch`.
- **Checked:** stable across repeated runs; changing `--radius-pill` fails exactly the two Button shots;
  a stray PNG fails the orphan test.
- **Not a deploy gate**, like `TODO(antoine)`. `CLAUDE.md` now asks agents to run it after CSS or
  contract changes.
