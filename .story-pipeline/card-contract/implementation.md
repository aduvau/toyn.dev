# Stage 2: implementation

## Changes
- `src/render/components.ts`: `workCard(work, root, contract, { open })`. It closes each card with a
  `<details class="card-contract">` placed after the `<article>`, rendered from `contract` by
  `contractToggle()`. The parts carry `data-part` (`.card-cover`, `.eyebrow`, `.card-title`,
  `.card-summary`, `.impact`). The summary paragraph gets the class `card-summary`. `eyebrow()` and
  `impact()` take an optional `part`.
- `src/render/spec.ts` (new): `inline`, `specList` and `selectorsRow`, shared by `/system` and the
  panel. They moved out of `system.ts`, so `components.ts` doesn't import the page that imports it.
- `src/system/contracts.ts`:
  - The Card contract owns `.card-summary`, has an "open" state, and its "no second link" rule now
    allows "View contract".
  - New "Card contract" contract, with the `.card-contract` and `.card-contract-panel` classes and 4
    contrast pairs. Its example is the second case study's card, open.
  - `cardContract()` looks the Card contract up lazily (no import cycle).
- `src/render/pages.ts`: the home grid passes `cardContract()`.
- `styles/main.css`:
  - The card is a flex column with `article { flex-grow: 1 }`, so the pill sits at the bottom right and
    the pills in a row align. The panel opens below the pill.
  - Open state (`.card:has(> .card-contract[open])`): no lift; `[data-part]::after` draws four 1px
    accent lines with gradients that overshoot the corners (`--space-3` horizontally, `--space-1`
    vertically); `::before` is a mono tab label with `content: attr(data-part) / ""`. The cover clips,
    so its lines cross inside it and its tab hangs down.
  - Tokens only: there are no new tokens.
- `tests/build.test.ts`: budgets raised. CSS goes from 16 to 19 KB (it is now 18.4 KB). HTML goes from 40
  to 48 KB, because `/system` reached 42.9 KB with two cards, each carrying a panel. The home page went
  from 12.9 to 19.9 KB.

## Tests
`tests/card-contract.test.ts` (12 tests). The panel prints a made-up contract verbatim and escaped, so
it is generated, not hand-written. Empty rows are dropped. The /system link respects `root`. The real
Card contract's rules appear. The parts are listed in order, and each label is a class the element has
and a contract owns. A card without a cover or impact figures has no part for them. The toggle has its
own contract. The Card rule is amended.

## Commands
- `bun test`: 68 pass, 0 fail. The `system.md` / `llms.txt` snapshot was updated on purpose (new
  contract, contrast rows, Card text).
- `bun run check` (tsc + biome): clean.
- `bun run test:visual --update-snapshots`, then `bun run test:visual`: 59 passed. Baselines:
  - Card (light/dark): the pill and the flex column. The image grew from 1574 to 1699 px tall.
  - Card contract (light/dark): new.
  - The rest: about 1% of pixels, from sub-pixel shifts after the contrast table gained a row.
- Manual look (Playwright screenshots at 1280 light/dark and 390): no horizontal scroll at 390.
