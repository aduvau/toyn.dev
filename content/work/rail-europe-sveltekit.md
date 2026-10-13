---
title: A SvelteKit rebuild, stopped at 80% — and the team I helped hold together
client: Rail Europe
role: Software Engineer & Scrum Master
period: 2024
order: 2
summary: First in-house engineer on a from-scratch rebuild of the B2C booking site, alongside a team of consultants. Developer, Scrum Master and facilitator — and, for months, a bit of the missing roles too.
impact:
  - value: "21"
    label: people on the team
  - value: "1st"
    label: in-house engineer
stack: [Svelte 5, SvelteKit, TypeScript, Storybook, Playwright, Vitest, Tailwind, Superforms]
cover:
  src: work/rail-europe-sveltekit/storybook.webp
  alt: Storybook with the ExchangeItem component selected, showing a Paris to Rennes trip for six travellers, with its controls panel below.
  caption: The team's Storybook — each component documented with its states and controls.
cardCover:
  src: work/rail-europe-sveltekit/exchange-item.webp
  alt: The ExchangeItem component — a Paris Montparnasse to Rennes trip for six travellers, expiring in 27 seconds.
gallery:
  - src: work/rail-europe-sveltekit/tokens-colors.webp
    alt: Colour tokens documented in Storybook — background, text and border tokens, each with semantic names like accent, error, warning and success.
    caption: Semantic colour tokens, documented in Storybook.
  - src: work/rail-europe-sveltekit/cart-expired.webp
    alt: Cart with four trips, two of them marked as expired in red with an alert at the top, the others showing a countdown before they expire.
    caption: Cart items and their states — valid, expiring, expired.
  - src: work/rail-europe-sveltekit/exchange-item.webp
    alt: Exchange item card for a Paris Montparnasse to Rennes trip, with travellers, price and an expiry countdown.
    caption: An item of the exchange flow.
  - src: work/rail-europe-sveltekit/checkout-form.webp
    alt: Payment form with card number, expiration date, CCV and name on card.
    caption: The payment form, migrated to Svelte 5 and Superforms.
---

## Context

In February 2024, Rail Europe hired me to rebuild its customer-facing booking
site from scratch in SvelteKit. I was the first engineer recruited in-house; the
rest of the team were consultants from Mainmatter. My role was developer and
Scrum Master, keeping a 21-person team in rhythm.

For months the team had no engineering manager, no principal engineer, and then
no product owner. So I stepped into parts of those roles when needed — helping
the team decide, prioritise and keep moving.

## What I did

- **Facilitated the team** as Scrum Master: rituals, delivery rhythm, and
  keeping a mixed in-house and consultant team aligned.
- **Built product features**: the My Trips area and the ticket-exchange flow —
  searching for a trip to exchange, selecting new offers, and the exchange quote
  screen.
- **Migrated the checkout and payment forms** to Svelte 5 and Superforms, with
  shared validation schemas.
- **Contributed to the UI kit in Storybook**: stories for design tokens (colours,
  sizes, typography) and for form components with their states.
- **Pushed testing practices**: component stories, Playwright smoke tests and
  unit tests.

## Outcome

At around 80%, the company decided to stop the rebuild and revamp the existing
platform instead. I moved to that revamp, and took the testing and component
habits with me.

## What I took from it

A rewrite is a big bet that pays nothing until it ships. Since then I favour
change that's sequenced so a team can adopt it step by step, on the system
that's already running.
