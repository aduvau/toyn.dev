# QA procedure: View contract on cards

**Environment:** a local static build, never production. `bun run test:visual` serves one on
`http://localhost:4173`; `bun run dev` also works for manual checks. Browser: current Chrome, plus a spot
check in Firefox and Safari. **Test data:** the real content (four case studies). Nothing is stored.

**Setup for every check:** open `/` in a fresh tab. The "first card" is the first one in "Selected
work". Set the theme with the header toggle, or DevTools → Rendering → `prefers-color-scheme`.

| # | Criterion (scenario) | Steps | Expected |
| - | -------------------- | ----- | -------- |
| 1 | Closed button at bottom right | Look at every card. | Each card ends with a `{ } View contract` pill, right-aligned, below the impact figures. In a row, both pills sit at the same height. `aria-expanded="false"` on the summary (DevTools → Accessibility). |
| 2 | Panel from the contract | Click the first card's pill. | Expanded. A panel opens below the pill with Purpose, Selectors, Accessibility, Contrast and Don't. The text matches the Card entry on `/system/#c-card`. The footer names `src/system/contracts.ts` and `tests/system.test.ts`, with a link "Card on /system". |
| 3 | Construction lines | Same as #2. | Cover, eyebrow, title, summary and impact each show thin accent lines along their edges, crossing and overshooting at the corners. Each has a mono label (`.card-cover`, `.eyebrow`, `.card-title`, `.card-summary`, `.impact`). The other cards have no lines. |
| 4 | Holds still | With #2 open, hover the first card. | No lift, and the cover image doesn't rise. Hovering another, closed card still lifts it. |
| 5 | Close | Click the pill again. | Collapsed, panel gone, lines and labels gone. |
| 6 | Keyboard | Reload. Tab until the first card's pill has focus, press Enter, then Space. | Focus ring visible on the pill. Enter opens it, Space closes it. The title link comes before the pill in tab order. |
| 7 | Button doesn't navigate | Click the pill. | URL still `/`. |
| 8 | Panel link | Open the first card's contract, click "Card on /system". | `/system/#c-card`, the Card entry in view. |
| 9 | Title only while open | Open the first contract. Click the summary paragraph, then the title. | The first click stays on `/`; the second opens the case study. |
| 10 | No JavaScript | DevTools → Disable JavaScript, reload, repeat #2 and #3. | Same result. |
| 11 | Phone | Device toolbar, 390 × 844. Open the first card's contract. | No horizontal scroll. Lines stay inside the card, and the labels are readable. |
| 12 | Contrast, both themes | Light and dark: open a contract and inspect a label, the pill (hover and open) and the panel. | Label text ≥ 4.5:1 on its chip; lines ≥ 3:1 on the card. These pairs are listed in the "Card contract" entry and the contrast table on `/system`. Reduced motion: nothing animates. |
| 13 | Screen reader | VoiceOver: navigate to the first card. | "View contract, collapsed" (no "{ }"). The title is read without the label text. |

**Cleanup:** re-enable JavaScript; reset the media emulation and the device toolbar.

**Not testable automatically:** a screen reader's spoken output (#13 is checked via the accessible name and
the label's empty alternative text); visual judgement of "reads as construction lines" (covered by the
visual baseline of the open example on `/system`, reviewed by Antoine).
