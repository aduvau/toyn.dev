# Story: card-contract

**Source:** PLAN.md §8 item B, "View contract" on cards (line 91), and Antoine's brief in the Claude
Code session of 2026-10-13 (`/story-pipeline`):

> I don't like the design provided in the sketch, with an horizontal line and the button left
> unpositioned. Please position it at the bottom right of the card and make it clear that it's
> construction lines.

The sketch was the design review's `sketches/2-contract.html`. It reused the `/system` page's `.contract`
class, which brings a `border-top`: that is the horizontal line. Its summary sat inline at the left.

**Decisions taken with Antoine before specifying (2026-10-13):**
- The open card shows **crossing corner lines**: thin accent lines along each part's edges that
  overshoot at the corners, like a technical drawing, with a mono class label. There are no dashed boxes and no grid.
- The `{ } View contract` button sits at the bottom right of the card. The panel opens below it, so
  the button doesn't move under the pointer.

## Stages
| # | Stage | Artifact | Status |
| - | ----- | -------- | ------ |
| 1 | Specify | `acceptance.feature`, `qa-procedure.md` | done |
| 2 | Code | `implementation.md` | — |
| 3 | Clean | `crap-report.md` | — |
| 4 | Harden | `mutation-report.md` | — |
| 5 | Automate QA | `qa-automation.md` | — |
