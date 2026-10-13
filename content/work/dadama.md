---
title: dadama — an AI-built data-journalism engine, with guardrails
client: Side project
role: Design, product and engineering
period: 2026
order: 3
summary: A framework-free static site generator for data stories, built with Claude Code in a few days. The interesting part isn't the speed — it's the frame that kept the agent honest.
impact:
  - value: "379"
    label: automated tests
  - value: "5"
    label: architecture decision records
  - value: "1 day"
    label: empty repo to live site
stack: [TypeScript, Bun, D3, remark/unified, zod, Biome]
cover:
  src: work/dadama/chart-area-light.webp
  srcDark: work/dadama/chart-area-dark.webp
  alt: Stacked area chart of rail passenger-kilometres in Germany, France, Italy and Spain from 2012 to 2025, with the Covid-19 dip highlighted and a dashed line at the 2019 total.
  caption: A dadama chart — annotations, direct labels, a source line and a "Show data" table for every chart. Switches with your colour scheme.
gallery:
  - src: work/dadama/chart-bars-light.webp
    srcDark: work/dadama/chart-bars-dark.webp
    alt: Grouped bar chart comparing 2019 and 2025 rail passenger-kilometres for Germany, France, Italy and Spain.
    caption: Every chart has light and dark themes.
  - src: work/dadama/article-light.webp
    srcDark: work/dadama/article-dark.webp
    alt: A dadama article page with a serif headline, a summary, and a "key points" box.
    caption: An article page — an airy editorial layout, system fonts only.
  - src: work/dadama/mobile.webp
    alt: The same article on a phone-sized screen.
    caption: On a phone.
links:
  - label: Visit dadama.eu
    url: https://www.dadama.eu/
---

## Context

dadama turns Markdown articles and CSV files into data stories with accessible,
interactive D3 charts and scrollytelling. No framework, no database: vanilla
TypeScript, built by Bun into a static site on Codeberg Pages.

I built it with Claude Code. Most of my work was not writing the code — it was
designing the frame the agent works inside.

## The frame

- **A `CLAUDE.md` with approval-gated rules.** The stack is written down and
  "challengeable, but not edited without human approval". When the agent wanted
  to change it, it had to ask.
- **A phased plan, compacted as it goes.** `PLAN.md` holds only what later work
  depends on; each finished phase is compacted into its own log, so the context
  stays small and current.
- **Decisions as ADRs.** Every stack choice — Bun, D3, no database, no UI
  framework, the Markdown pipeline — has an architecture decision record with the
  options considered. A reversed decision gets a new ADR, not a silent edit.
- **Tests as guardrails.** 379 tests, including some that fail the build when
  the agent drifts: performance budgets on CSS and JavaScript weight, and
  accessibility checks on every chart (generated alt text, a data table for
  every chart, keyboard-reachable tooltips).

## Outcome

The project went from an empty repository to a live static site in a day, then
through two more versions in the next two. Every chart ships with a text
alternative and a data table, and the build refuses to grow past its budgets.

This portfolio is built the same way.
