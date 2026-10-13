# Story: theme-toggle

**Source:** Antoine, in the Claude Code session of 2026-10-13 (`/story-pipeline`):

> Build a toggle to switch from light to dark mode. On startup, the theme matches the preferences of
> the browser. On switch, it goes from light to dark and from dark to light. It remembers it between sessions.

**Decisions taken with Antoine before specifying (2026-10-13):**
- Reopens PLAN §1/§6 ("`prefers-color-scheme` only, no toggle"): recorded in ADR-0005.
- Header icon button on every page, accessible name "Dark theme", state in `aria-pressed`.
- Without JavaScript: the toggle is hidden (`@media (scripting: none)`), the theme follows the OS, no `<noscript>` text.
- CSS: duplicate the dark token block for `[data-theme="dark"]`, raise the CSS budget.
- Mutation testing: add StrykerJS as a dev dependency (ADR-0005).

## Stages
| # | Stage | Artifact | Status |
| - | ----- | -------- | ------ |
| 1 | Specify | `acceptance.feature`, `qa-procedure.md` | done |
| 2 | Code | `implementation.md` | done |
| 3 | Clean | `crap-report.md` | done (no refactor needed) |
| 4 | Harden | `mutation-report.md` | done (100 %, 35/35) |
| 5 | Automate QA | `qa-automation.md` | done (13/13) |
