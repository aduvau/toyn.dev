---
title: Modernising a ten-year-old booking platform, one layer at a time
client: Rail Europe
role: Senior Frontend Engineer
period: 2025 — now
order: 1
summary: Instead of a rewrite, a revamp — a legacy Rails monolith moved toward modern Rails and Hotwire, the mobile apps brought onto the same codebase, and booking pages made to feel faster.
impact:
  - value: "−40%"
    label: front-end bundle size
  - value: "−1.3 s"
    label: average, critical booking pages
stack:
  [
    TypeScript,
    React,
    React Native,
    Capacitor,
    Ruby on Rails,
    Hotwire,
    Turbo,
    Stimulus,
  ]
cover:
  src: work/rail-europe-migration/home.webp
  alt: Rail Europe homepage with the train ticket search form on the left — from, to, dates and passengers — over a photo of Paris with the Eiffel Tower.
cardCover:
  src: work/rail-europe-migration/search-form-a.webp
  alt: The Rail Europe train ticket search form — from, to, dates and passengers.
gallery:
  - src: work/rail-europe-migration/results-mobile.webp
    alt: Search results for Paris to Madrid on a phone, with two trains, their times, changes and prices, a price-trend hint and buttons for earlier and later trains.
    caption: Search results on mobile.
---

## Context

Rail Europe sells train tickets across Europe. Its customer-facing site was a
Rails monolith more than ten years old, with layers of frontend history:
CoffeeScript, jQuery, Sass, AJAX-driven partials, and a separate React SPA plus
an API that mainly served the mobile apps.

After the from-scratch SvelteKit rebuild was stopped, the plan became revamping
this platform in place, toward a modern Rails and Hotwire stack. I joined that
effort as a senior engineer, and took over the mobile apps.

## What I did

- **Brought the mobile apps onto the main codebase with Capacitor.** The apps
  now render the Rails site in a webview, with native capabilities where they
  matter — one codebase for the web and the apps.
- **Removed the React SPA and its API** once the apps no longer needed them,
  with a graceful path for older app versions.
- **Moved legacy scripts to plain JavaScript and Stimulus**, and interactive
  pieces like fare cards to Turbo.
- **Designed a perceived-performance strategy** for the booking funnel: live
  polling, optimistic rendering and progressive enhancement, so pages respond
  before the network does.
- **Brought linting back into the pipeline**, Stimulus controllers included, so
  the new conventions are checked rather than remembered.

## Outcome

The front-end bundle shrank by 40%, and the critical pages of the ticket-booking
funnel got 1.3 seconds faster on average.
