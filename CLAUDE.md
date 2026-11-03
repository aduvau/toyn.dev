# toyn.dev — Antoine Duvauchelle's portfolio

## Description
A small, static, English-only portfolio for Antoine Duvauchelle, Product Engineer.
Target roles: Design Engineer / Product Engineer / design systems, e.g. Front's "Senior Design Engineer" (Paris).
The site is itself a work sample: craft, accessibility, a documented design system, and agent guardrails
must be real and visible in this repo.

The implementation plan, phases and content outline live in `PLAN.md`.
Architecture decisions (and why) live in `docs/adr/`; any stack change needs a new ADR.
When a phase is done, compact its build notes into `docs/<phase>-log.md` and keep `PLAN.md` short.

## Tech stack
Same setup as `../dadama` (copy and trim, don't share a package). Challengeable, but not edited without human approval.
- Bun (runtime, dev server, bundler, test runner) + TypeScript (strict)
- vanilla TS + CSS + HTML in the browser — no UI framework
- HTML: tagged template literals with an `escapeHtml()` helper, no template engine
- content: Markdown (remark/unified) for case studies, YAML for profile/timeline, validated with zod
- Biome (lint + format), `tsc --noEmit`, `bun test`
- Playwright (dev only, ADR-0004): `bun run test:visual` screenshots every `/system` component in both themes
- deploy: GitHub Pages via GitHub Actions (`.github/workflows/pages.yml`, ADR-0006): every push to `main` of
  `github.com/aduvau/toyn.dev` builds and publishes `dist/`, so pushing to `main` is deploying

## Rules
- **Truthfulness:** never claim experience, tools, numbers or results that aren't in the resume, in this repo, or
  confirmed by Antoine. If unsure, leave a `TODO(antoine)` instead of inventing.
- No phone number or date of birth anywhere on the site or the generated resume.
- Colors, spacing, type and motion come from tokens only (`styles/tokens.css`); no raw values elsewhere.
- Every component has a contract (`src/system/`); the `/system` page, `llms.txt` and guardrail tests derive from it.
- Progressive enhancement: every page works with HTML and CSS alone; JavaScript only adds to it, with a
  designed no-JS fallback (`@media (scripting: none)` + `<noscript>`) and no script files. See ADR-0003.
- After changing CSS, tokens or a contract, run `bun run test:visual`. Update baselines
  (`--update-snapshots`) only for an intended change, and say which screenshots changed and why.
- Accessibility is a requirement, not polish: semantic HTML, keyboard reachable, visible `:focus-visible`,
  `prefers-reduced-motion` respected, WCAG AA contrast in both themes.
- Never push, deploy, create remote repos or touch DNS without explicit approval in the current conversation.
