# ADR-0006: Host on GitHub Pages, published by GitHub Actions

**Status:** Accepted
**Date:** 2026-11-03
**Deciders:** Project owner

## Context
The site was hosted on Codeberg Pages (ADR-0001): source in `codeberg.org/toyn/toyn`, and
`bun run deploy` built into `dist/`, a clone of `toyn/toyn_output`, then committed and pushed its
`pages` branch. Codeberg-only host files rode along: `_redirects` (bare domain → www) and `.domains`.
Publishing also needed a webhook on the output repo.

The source moves to GitHub (`github.com/aduvau/toyn.dev`, public), and the site moves to GitHub Pages.

## Decision
A GitHub Actions workflow (`.github/workflows/pages.yml`) publishes the site. On every push to `main`
(or a manual run), it installs Bun at the local version, runs `bun install --frozen-lockfile` and
`bun run build`, and deploys `dist/` with the official Pages actions.

- **Pushing to `main` is deploying.** The rule "never push or deploy without explicit approval" now
  covers both at once.
- **Build only, no test gate.** The old deploy only built. Tests and `test:visual` stay checks you run
  locally (ADR-0004), and `TODO(antoine)` notes stay warnings. A failing build still stops the deploy.
- **`bun run deploy` and the output repo are gone.** `dist/` is a plain build folder, emptied on
  every build.
- **Domain:** `www.toyn.dev` is set as the custom domain in Settings → Pages, and GitHub redirects
  the bare `toyn.dev` to it. With an Actions deployment, GitHub ignores a `CNAME` file and runs no
  Jekyll, so neither `CNAME` nor `.nojekyll` is shipped. `_redirects` and `.domains` are removed.
- **Profile links:** the Codeberg link is dropped. LinkedIn and GitHub remain.

## Options Considered
- **GitHub Actions on push (chosen):** no second repo, no committed build output, and a build from a
  clean checkout, which catches files missing from git. Cost: a deploy is a push, and builds run on
  Linux with GitHub's runner.
- **Keep `bun run deploy`, pushed to a `gh-pages` branch:** the smallest code change and manual
  deploys as before. Cost: build output committed into the source repo's history, plus `CNAME`
  and `.nojekyll` to ship.
- **Keep `bun run deploy`, pushed to a separate output repo:** the Codeberg setup, unchanged. Cost:
  a second repo to create and keep in sync.

## Consequences
- DNS has to change once: apex A records to GitHub (`185.199.108–111.153`), `www` CNAME to
  `aduvau.github.io`, the Codeberg `_git-pages-repository` TXT records removed. The domain should be
  verified in the GitHub account to prevent takeover.
- The repo's own `aduvau.github.io/toyn.dev/` address is a subpath. Pages use relative links and
  work there, but `404.html` uses root-absolute ones and loses its styles. Only the custom domain is
  meant to be visited.
- GitHub already redirects `/resume` to `/resume/`. The inline trailing-slash script in
  `src/render/layout.tsx` is kept: it is harmless and keeps working on any other static host.
- The case study about dadama still says it runs on Codeberg Pages. That is true of dadama, so it stays.
