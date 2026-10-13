# ADR-0002: Component contracts are the single source for docs, agent docs and tests

**Status:** Accepted
**Date:** 2026-10-13
**Deciders:** Project owner

## Context
The site claims a documented design system and agent guardrails. Hand-written docs drift from the code,
and an agent can't follow a style guide it can't read. We need one place that says what each part of the
UI is, and checks that fail when the code stops matching it.

## Decision
Every component, layout block and utility class has a **contract** in `src/system/contracts.ts`
(validated by zod in `src/system/schema.ts`): purpose, owned classes, states, accessibility rules,
do/don't, the colour pairs it relies on, and an optional example rendered from the real content.

From the contracts and `styles/tokens.css`, the build generates `/system/`, `system.md` and `llms.txt`,
and `tests/system.test.ts` checks that:
- every class in the CSS or the built HTML belongs to exactly one contract, and every owned class is used;
- no raw colour, px or duration appears outside `tokens.css`, and every `var()` is a defined token;
- every declared colour pair passes WCAG AA in both themes (contrast computed from the OKLCH tokens, no
  colour library);
- the global `:focus-visible` ring exists and is only removed where it is redrawn;
- `/system`, `system.md` and `llms.txt` cover every contract (plus snapshots).

## Options Considered
- **Contracts in TypeScript (chosen):** typed, can reference the real render functions, no new tooling.
- **Storybook:** the usual tool, but a framework and a client bundle for a static site with no JS.
- **Hand-written style guide page:** quick, but nothing keeps it true.

## Consequences
- Adding a CSS class means adding or updating a contract first, or the tests fail.
- Contrast is computed in-house (OKLCH → linear sRGB); tokens must stay written as `oklch(L% C H)`.
- Snapshots of `llms.txt` and `system.md` change with content edits; update them with `bun test -u`.
