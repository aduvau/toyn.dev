# toyn.dev — Implementation plan

Last updated 2026-10-13.

## Current status

- **v1** done and deployed 2026-10-13 at https://www.toyn.dev/ — see `docs/v1-log.md`. Publishing needs the **webhook on `toyn_output`** (Settings → Webhooks).
- **v1.x `/system`** done and deployed 2026-10-13 — see `docs/v1x-log.md`, ADR-0002.
- **v1.y `/resume`** done and deployed 2026-10-13 — see `docs/v1y-log.md`.
- **v2** done 2026-10-13: `/writing` with the article "Framing the agent" (deployed), and visual regression on `/system` (dev only, ADR-0004) — see `docs/v2-log.md`. No open `TODO(antoine)` notes.
- **Theme toggle** built 2026-10-13 through the story pipeline (Gherkin → code → CRAP → mutation → e2e), ADR-0005; packet in `.story-pipeline/theme-toggle/`. Not deployed.
- **Next:** nothing scheduled; see the parked items in §7.

## 1. Decisions

| Topic        | Decision                                                                                                                                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Positioning  | Title **Product Engineer** (matches LinkedIn). Tagline bridges to design engineering: _"I build design systems, polished UI, and the guardrails that let teams — and agents — ship them."_ Not Front-specific: aimed at design-engineering / product-engineering roles in general |
| Language     | English only, `<html lang="en">`                                                                                                                                                                                                                                                  |
| Hosting      | Codeberg Pages. Source `toyn/toyn`, output `toyn/toyn_output` (branch `pages`), cloned into `dist/`                                                                                                                                                                               |
| Domain       | Served at `https://www.toyn.dev/`; the bare `toyn.dev` redirects there (`_redirects`, same pattern as dadama). DNS: apex A `217.197.84.141`, `www` CNAME `codeberg.page.`, `_git-pages-repository` TXT on both → `https://codeberg.org/toyn/toyn_output.git`                      |
| Stack        | Same as `../dadama` (see `CLAUDE.md`); no d3 unless a case study needs a chart                                                                                                                                                                                                    |
| Design       | Tokens as CSS custom properties (`styles/tokens.css`); light/dark follows `prefers-color-scheme`, with a remembered theme toggle (ADR-0005); system fonts                                                                                                                                        |
| Privacy      | No phone, no date of birth. LinkedIn + Codeberg/GitHub; email (`a@toyn.dev`) on `/resume` only, entity-encoded                                                                                                                                                                    |
| Truthfulness | Only claims backed by the resume, this repo, or Antoine. The learning-in-public items (§4) are claimed only once built here                                                                                                                                                       |

## 2. v1 — One page, deployed

Done; build notes in `docs/v1-log.md`.

### Content outline

**Selected work (case studies: problem → what I did → impact)**

1. **Rail Europe — legacy migration & perceived performance.** 10+-year-old Rails 6 / CoffeeScript / jQuery / Sass codebase migrated; Capacitor + webview bridge for mobile apps; −40% front bundle, −1.3 s average on critical booking-funnel pages; perceived-performance strategy (live polling, optimistic rendering, progressive enhancement).
2. **Rail Europe B2C — SvelteKit redesign.** Coached a 21-person team; testing practices; "Context-First Component Architecture"; booking and exchange funnels. Scrum Master.
3. **dadama — AI-assisted, with guardrails.** Vanilla TS data-journalism engine built with Claude Code: `CLAUDE.md` with approval-gated stack rules, phased `PLAN.md` compacted into logs, ADRs, a test suite incl. performance budgets (fails the build if CSS/JS grow) and accessibility (generated chart alt text, data tables, keyboard tooltips). The angle: _the job is framing the agent — context, decisions, and automatic checks_.
4. **Agence Parisienne du Climat & Clong — accessible, eco-designed sites.** Svelte/SvelteKit + DatoCMS (forumhabiterdurable.fr, sportzeroplastique.com, clong-volontariat.org).
5. **Holivia — frontend overhaul.** Rails frontend rebuilt; unit + feature test strategy; in-house audio player and video-conferencing libraries.

**How I work** (mirrors design-engineering job specs): design systems for humans and agents · UI craft & accessibility · tooling & guardrails · enabling teams (coaching, pairing, docs).

**Timeline:** Rail Europe → Holivia → freelance (In the Memory, Atelier des Giboulées / Mallapixels, Cultur'In the City, Majelan) → **Slash Lab** (reworded, see §6) → Le Wagon → journalism (EJDG master, 2nd at France 24 "Jeunes Reporters d'Europe" — a writing/communication signal).

## 3. v1.x — `/system`: the site's own design system

Done; build notes in `docs/v1x-log.md`, decision in ADR-0002. Component contracts (`src/system/`) generate `/system/`, `system.md`, `llms.txt` and the guardrail tests (`tests/system.test.ts`).

## 4. Learning notes (what each concept is, and how this repo shows it)

- **Component contract:** a machine-readable spec of a component — what it's for, its props, states, accessibility rules, do/don't. One source feeds the docs, the agent instructions and the tests, so they can't drift apart.
- **Agent-readable docs:** documentation shaped for an AI agent to discover and follow: `CLAUDE.md`/`AGENTS.md` (conventions), `llms.txt` (an index of the docs for LLMs), contracts. Antoine already does the first part (CLAUDE.md, plans, compaction, ADRs).
- **Guardrail tests / lint:** checks that fail when someone — human or agent — breaks a rule (raw colors, missing alt, too-heavy bundle). They turn conventions into something enforced, so you review less. dadama's budgets test is already one.
- **Progressive enhancement:** build the page so it works with HTML and CSS only, then let JavaScript _add_ to it where available, never be required. Here: the résumé's "Save as PDF" button is hidden by CSS when scripting is off (`@media (scripting: none)`), and a `<noscript>` how-to replaces it; no script file. ADR-0003; a test allowlists the one inline handler.
- **Figma Code Connect:** maps Figma components to their code, so Dev Mode (and Figma's MCP server, i.e. agents) show the real component usage instead of generated CSS. Possible v2: a small Figma file for the site's components + Code Connect mappings (needs a Figma plan with Dev Mode).
- **BDD / Gherkin:** executable behavior specs. A natural fit as contracts for interactive components (e.g. "Given the theme toggle has focus, when I press Space…"). Possible v2.

## 5. v1.y — `/resume`

Done; build notes in `docs/v1y-log.md`. Prints to 2 A4 pages ("Save as PDF"); email `a@toyn.dev` on that page only.

## 6. Open questions (for Antoine)

- **Slash Lab:** answered 2026-10-13 (brand platforms for Kawaa, Dress in Peace, Base Jaune; no visuals). Role title: "Brand identity & Product builder".
- **Screenshots:** no Rail Europe before/after search-form shots exist; dropped.
- **Links:** done (LinkedIn, Codeberg, GitHub).
- **Confidentiality (Rail Europe):** case studies approved by Antoine 2026-10-13. Not mentioned on the site: the platform's decommissioning after the acquisition.
- **Climate sites:** demoted to the timeline (`draft: true`), per Antoine.
- **Theme:** `prefers-color-scheme` only — decided 2026-10-13; reopened the same day for a remembered toggle (ADR-0005).

## 7. v2 and after

v2 done 2026-10-13; build notes in `docs/v2-log.md`.

**Parked:**

- **Figma file + Code Connect.** Code Connect needs a paid plan with Dev Mode. Antoine's employer has a Figma plan, but nothing for this portfolio may live in a work account (it's for applying elsewhere). Revisit only with a personal plan. The cheaper version is a free Figma file with variables generated from `styles/tokens.css`.
- **Gherkin specs.** First use: the theme toggle (`.story-pipeline/theme-toggle/acceptance.feature`). Still parked: a blog article about it.
