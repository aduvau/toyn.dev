---
title: "Framing the agent: how this site was built"
summary: A walkthrough of the context, decisions and automatic checks that let a coding agent build this portfolio without making things up.
date: 2026-10-13
draft: false
---

This site was built entirely with Claude Code, as an experiment. I already knew how fast it could build things; the remaining question was how well. And that does not depend on the agent itself, but on you as a product builder.

I had already experimented with it on [dadama](https://www.dadama.eu), and the real job is somewhere else: deciding what the agent should know, what it may decide on its own, and which mistakes should fail automatically instead of waiting for me to spot them.

That is what I mean by framing the agent. Here is what it looks like in this repository.

## CLAUDE.md: rules with a reason

`CLAUDE.md` is the file the agent reads at the start of every session. Mine is short, and most of it is rules (shortened here):

```
- Truthfulness: never claim experience, tools, numbers or results that aren't in the resume, in this repo, or confirmed by Antoine. If unsure, leave a special todo note for me instead of inventing.
- Colors, spacing, type and motion come from tokens only (styles/tokens.css).
- Never push, deploy, create remote repos or touch DNS without explicit approval.
```

The first rule matters most on a portfolio. An agent asked to write a case study will happily write a convincing one. Without the rule, it will also happily write a largely invented one. So when it doesn't know something, we need to explicitly force it to leave a note in the code instead of trying to fill the gaps itself. The build lists those notes as warnings, and a test makes sure none reaches the page.

The stack is in there too: Bun, TypeScript, no UI framework. The agent can challenge it, but it can't change it without my approval and a written decision. In my experience, that's the section to focus on when you're doing a revamp, for instance. Let's say you have a big legacy codebase, like the ones I had at [Holivia](/work/holivia) or [Rail Europe](/work/rail-europe-migration/). If you leave it unsupervised, the agent in charge of rewriting a jQuery + Bootstrap app to Stimulus + Tailwind will joyfully jump from one stack to another. It gets even worse once it starts to lose context, so a clearly enforced tech stack plus frequent fresh sessions is the best framing possible.

## Memory that doesn't rot

An agent starts every session from scratch, so the project needs a memory that stays true.

- `PLAN.md` holds the current plan and nothing else. When a phase is done, its notes are compacted into `docs/<phase>-log.md`, and the plan goes back to being short.
- Decisions go into ADRs: why this stack is copied from an earlier project, why one source feeds the docs and the tests, why every page must work without JavaScript.

If you think about it, that's just what being a senior dev is about. A few years ago, you would prepare the ground with tech decisions, and write ADRs so that everybody knows about them. Then you would plan implementation, implement, document. Your plan holds the short-term work, plus a mention of what's coming next. It's a Jira board you can't get lost in. Everything decided before implementation goes to /adrs; everything after goes to /docs. Seems obvious? Obvious is what you want when it comes to AI-assisted coding.

## Contracts: one source, four outputs

Every component on this site has a contract in `src/system/contracts.tsx`: what it's for, the CSS classes it owns, its states, its accessibility rules, what to do and not do. Here is part of the button's:

```
{
  name: "Button",
  purpose: "The one primary call to action of a page.",
  classes: ["button"],
  a11y: ["An `<a>` when it navigates; a `<button>` only for an in-page action."],
  dont: ["Don't put it on an `<a>` for an action, or on a `<button>` for navigation."],
  contrast: [{ fg: "--color-bg", bg: "--color-fg", min: 4.5 }],
}
```

From that one list, the build generates the [design system page](../../system/), a Markdown version for agents (`system.md`), the `llms.txt` index, and part of the test suite. The docs a human reads and the docs an agent reads can't drift apart, because neither is written by hand.

## Guardrail tests

Conventions only hold if something checks them. A few of the tests that fail the build:

- No raw colours, pixel values or durations outside `styles/tokens.css`.
- Every contrast pair named in a contract passes WCAG AA, in the light and the dark theme.
- Every CSS class used on a page has a contract, and every contract's classes are still used.
- The stylesheet and every page stay under a size budget.

I love the size budget. It's a very convenient rule, and I'll definitely write a full post on it, but I feel like I still need to refine my system. Here, it caught the agent while it was building the very writing section you're reading now: the new styles were 9 bytes over. My budget is still around 14 KB, so we're very, very far from bloated CSS. So the agent is allowed to raise the limit, as long as it says so. That's really different from a "don't care about the CSS budget" attitude, trust me. And because the limit was there, after a review it decided it could have fulfilled its contract better, so it undid the change and trimmed the CSS instead.

## What stayed human

Deciding, writing, saying no, getting pissed every once in a while.

Early on, I made a mistake. The agent ran ahead. It scaffolded the site, wrote copy and started capturing screenshots without asking. I got lost very quickly. The thing is, we all know we have to fight that loss of understanding of our own product, which we all experience from time to time. So having nothing in your setup that says "hey, check everything with Antoine first" is a sure path to failure. That used to be the "Plan mode → Accept edits" flow. Now you usually run in auto mode, which means that to keep track, you want to add "be slow enough for a dumb human" rules.

So that "let's do everything all at once without asking" behavior I experienced wasn't about the agent going rogue; it was about the human not being careful enough. Now I have a standing rule: propose, wait for the go-ahead, go.

> ## Links
>
> - The [design system page](../../system/) shows what the contracts generate.
