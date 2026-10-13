# toyn.dev — Implementation plan

Last updated 2026-10-13.

## Current status

- **Planning:** done 2026-10-13.
- **v1 steps 1–6:** done 2026-10-13 (scaffold, content model, tokens, pages, craft pass, guardrail tests). `bun run check:content` lists the open `TODO(antoine)` notes.
- **v1 deployed** 2026-10-13 at https://www.toyn.dev/ (bare domain → www). Publishing needs a **webhook on `toyn_output`** (Settings → Webhooks, same as `dadama-output`) so Codeberg Pages picks up pushes; DNS TXT records alone aren't enough.
- **Next:** polish pass (next session), then v1.x `/system`. Open: Rail Europe confidentiality check, "What I took from it" paragraph, before/after search-form screenshots.

## 1. Decisions

| Topic         | Decision |
| ------------- | -------- |
| Positioning   | Title **Product Engineer** (matches LinkedIn). Tagline bridges to design engineering: *"I build design systems, polished UI, and the guardrails that let teams — and agents — ship them."* Not Front-specific: aimed at design-engineering / product-engineering roles in general |
| Language      | English only, `<html lang="en">` |
| Hosting       | Codeberg Pages. Source `toyn/toyn`, output `toyn/toyn_output` (branch `pages`), cloned into `dist/` |
| Domain        | Served at `https://www.toyn.dev/`; the bare `toyn.dev` redirects there (`_redirects`, same pattern as dadama). DNS: apex A `217.197.84.141`, `www` CNAME `codeberg.page.`, `_git-pages-repository` TXT on both → `https://codeberg.org/toyn/toyn_output.git` |
| Stack         | Same as `../dadama` (see `CLAUDE.md`); no d3 unless a case study needs a chart |
| Design        | Tokens as CSS custom properties (`styles/tokens.css`); light/dark via `prefers-color-scheme` only, no toggle, no JS; system fonts |
| Privacy       | No phone, no date of birth. Email + LinkedIn + Codeberg/GitHub only |
| Truthfulness  | Only claims backed by the resume, this repo, or Antoine. The learning-in-public items (§4) are claimed only once built here |

## 2. v1 — One page, deployed

1. **Scaffold** from dadama: `src/cli.ts` (`serve` with live reload, `build`, `check`, `deploy`), `build.ts` (keeps `dist/.git`), `deploy.ts`, Biome, tsconfig, tests skeleton. ADR-0001 "reuse the dadama stack".
2. **Content model:** `content/profile.yaml`, `content/timeline.yaml`, `content/work/*.md` (front matter: title, role, period, tags, impact numbers, screenshots, links), zod schemas.
3. **Tokens + base CSS:** color, type scale, spacing, radius, motion; both themes; focus ring.
4. **Page:** hero → selected work → how I work → timeline → contact.
5. **Craft pass:** keyboard nav, skip link, focus states, reduced motion, a few micro-interactions, responsive images (screenshots).
6. **Guardrails (minimal):** build fails on broken links/missing alt; budgets test (CSS/JS/HTML weight, like dadama).
7. **Deploy** (after approval): create repos, clone output into `dist/`, DNS.

### Content outline

**Selected work (case studies: problem → what I did → impact)**
1. **Rail Europe — legacy migration & perceived performance.** 10+-year-old Rails 6 / CoffeeScript / jQuery / Sass codebase migrated; Capacitor + webview bridge for mobile apps; −40% front bundle, −1.3 s average on critical booking-funnel pages; perceived-performance strategy (live polling, optimistic rendering, progressive enhancement).
2. **Rail Europe B2C — SvelteKit redesign.** Coached a 21-person team; testing practices; "Context-First Component Architecture"; booking and exchange funnels. Scrum Master.
3. **dadama — AI-assisted, with guardrails.** Vanilla TS data-journalism engine built with Claude Code: `CLAUDE.md` with approval-gated stack rules, phased `PLAN.md` compacted into logs, ADRs, a test suite incl. performance budgets (fails the build if CSS/JS grow) and accessibility (generated chart alt text, data tables, keyboard tooltips). The angle: *the job is framing the agent — context, decisions, and automatic checks*.
4. **Agence Parisienne du Climat & Clong — accessible, eco-designed sites.** Svelte/SvelteKit + DatoCMS (forumhabiterdurable.fr, sportzeroplastique.com, clong-volontariat.org).
5. **Holivia — frontend overhaul.** Rails frontend rebuilt; unit + feature test strategy; in-house audio player and video-conferencing libraries.

**How I work** (mirrors design-engineering job specs): design systems for humans and agents · UI craft & accessibility · tooling & guardrails · enabling teams (coaching, pairing, docs).

**Timeline:** Rail Europe → Holivia → freelance (In the Memory, Atelier des Giboulées / Mallapixels, Cultur'In the City, Majelan) → **Slash Lab** (reworded, see §6) → Le Wagon → journalism (EJDG master, 2nd at France 24 "Jeunes Reporters d'Europe" — a writing/communication signal).

## 3. v1.x — `/system`: the site's own design system

A living style guide generated from the code, not written by hand.

1. **Component contracts** in `src/system/*.ts` (zod): name, purpose, props, states, a11y requirements, do/don't, example.
2. **`/system` page** rendered from the contracts + tokens: swatches, type scale, spacing, each component with its states.
3. **`llms.txt`** (+ `/system.md`) generated from the same contracts.
4. **Guardrail tests**, all deriving from the contracts/tokens:
   - every component class used on a page has a contract;
   - no raw hex / px outside `tokens.css` (lint);
   - contrast of token pairs ≥ AA in both themes;
   - heading order, one `h1`, every interactive element has `:focus-visible` styles;
   - `/system` and `llms.txt` stay in sync with the contracts (snapshot).

## 4. Learning notes (what each concept is, and how this repo shows it)

- **Component contract:** a machine-readable spec of a component — what it's for, its props, states, accessibility rules, do/don't. One source feeds the docs, the agent instructions and the tests, so they can't drift apart.
- **Agent-readable docs:** documentation shaped for an AI agent to discover and follow: `CLAUDE.md`/`AGENTS.md` (conventions), `llms.txt` (an index of the docs for LLMs), contracts. Antoine already does the first part (CLAUDE.md, plans, compaction, ADRs).
- **Guardrail tests / lint:** checks that fail when someone — human or agent — breaks a rule (raw colors, missing alt, too-heavy bundle). They turn conventions into something enforced, so you review less. dadama's budgets test is already one.
- **Figma Code Connect:** maps Figma components to their code, so Dev Mode (and Figma's MCP server, i.e. agents) show the real component usage instead of generated CSS. Possible v2: a small Figma file for the site's components + Code Connect mappings (needs a Figma plan with Dev Mode).
- **BDD / Gherkin:** executable behavior specs. A natural fit as contracts for interactive components (e.g. "Given the theme toggle has focus, when I press Space…"). Possible v2.

## 5. v1.y — `/resume`

`/resume` page rendered from `profile.yaml` + `timeline.yaml` + work front matter, with a print stylesheet → "Save as PDF". English, Product Engineer, AI work included, no phone / date of birth. Replaces the French PDF.

## 6. Open questions (for Antoine)

- **Slash Lab:** which startups, what the brand-identity work covered (logo, palette, type, UI kit?), how it reached the product; any visuals?
- **Slash Lab:** answered 2026-10-13 (brand platforms for Kawaa, Dress in Peace, Base Jaune; no visuals). Role title "Web integrator & brand identity" to confirm.
- **Screenshots:** none available. Capture public ones ourselves (dadama.eu, the three NGO sites, raileurope.com booking pages); Holivia and the SvelteKit app likely need Antoine.
- **Links:** done (LinkedIn, Codeberg, GitHub).
- **Confidentiality (Rail Europe):** check case by case before deploy. Not mentioned on the site: the platform's decommissioning after the acquisition.
- **Climate sites:** demoted to the timeline (`draft: true`), per Antoine.
- **Theme:** `prefers-color-scheme` only — decided 2026-10-13.

## Later (v2 candidates)

Figma file + Code Connect · Gherkin specs for interactive components · visual regression on `/system` · writing (a short article on "framing the agent").
