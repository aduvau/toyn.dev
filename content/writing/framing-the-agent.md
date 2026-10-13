---
title: "Framing the agent: how this site was built"
summary: A walkthrough of the context, decisions and automatic checks that let a coding agent build this portfolio without making things up.
date: 2026-10-13 # Set to the publication date.
draft: false
---

<!-- Short: ~800 words. A concrete walkthrough; every claim must be checkable in this repo. -->

## The premise

<!-- TODO(antoine): This site was built with Claude Code. The work wasn't typing code; it was framing the agent: context, decisions, and checks that fail. -->

## CLAUDE.md: rules with a reason

<!-- TODO(antoine): Truthfulness (no claim that isn't in the résumé or confirmed), tokens only, stack changes need approval, never deploy without asking. Quote one or two lines. -->

## Memory that doesn't rot

<!-- TODO(antoine): PLAN.md kept short; each phase compacted into docs/<phase>-log.md; ADRs for decisions (0001 reuse the dadama stack, 0002 contracts as single source, 0003 progressive enhancement). -->

## Contracts: one source, four outputs

<!-- TODO(antoine): src/system/contracts.ts feeds /system, system.md, llms.txt and the tests. Show a short contract excerpt in a code block. -->

## Guardrail tests

<!-- TODO(antoine): No raw colours or px outside tokens.css; AA contrast in both themes; every class has a contract; every résumé skill is named elsewhere in the content; CSS and HTML size budgets. -->

## What stayed human

<!-- TODO(antoine): Deciding, writing, saying no. The day the agent ran ahead (scaffolded, wrote copy, started screenshots without asking): a guardrail I hadn't set, now an "ask before acting" rule. -->

## Links

<!-- TODO(antoine): Source repo (codeberg.org/toyn/toyn.dev, public before this ships) and /system. -->
