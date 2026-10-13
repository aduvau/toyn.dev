# ADR-0001: Reuse the dadama stack, copied and trimmed

**Status:** Accepted
**Date:** 2026-10-13
**Deciders:** Project owner

## Context
The portfolio is a small static site that must ship quickly and double as a work sample.
`../dadama` already has a proven setup: Bun + strict TypeScript, vanilla HTML/CSS, a `serve | build | check | deploy` CLI, and a deploy to Codeberg Pages through a cloned output repo.

## Decision
Copy the relevant parts of dadama (HTML helper, build with `dist/.git` kept, deploy, live reload) and trim what the portfolio doesn't need (D3, charts, scrollytelling, tags). No shared package.

## Options Considered
- **Copy and trim (chosen):** fast, no coupling; the two projects can diverge freely. Cost: fixes don't propagate.
- **Shared package:** one place for fixes, but versioning overhead for two tiny projects.
- **A framework (SvelteKit, Astro):** familiar, but heavier, and loses the "no framework, no client JS" proof point.

## Consequences
- The site ships zero client-side JavaScript (beyond an inline trailing-slash fix); tests enforce it.
- Content is YAML + Markdown validated by zod; bad content fails the build before `dist/` is touched.
