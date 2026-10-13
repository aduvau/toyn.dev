# QA procedure — theme toggle

**Environment:** a local static build, never production: `bun run test:visual` serves one on
`http://localhost:4173`, or `bun run build` into a temp dir and serve it. The dev server (`bun run dev`)
also works for manual checks. Browser: current Chrome (plus a spot check in Firefox and Safari).
**Test data:** none. **Storage key:** `localStorage["theme"]` (`"light"` or `"dark"`).

**Setup for every check:** a fresh profile or a private window, or DevTools → Application → clear
site data for the origin. "System theme" is set with DevTools → Rendering → *Emulate CSS media feature
prefers-color-scheme* (or the OS setting).

| # | Criterion (scenario) | Steps | Expected |
| - | -------------------- | ----- | -------- |
| 1 | First visit matches system (light) | System light. Open `/`. | Light background; toggle `aria-pressed="false"` (inspect, or a screen reader says "Dark theme, toggle button, not pressed"). |
| 2 | First visit matches system (dark) | System dark. Open `/`. | Dark background; toggle `aria-pressed="true"`. |
| 3 | Switch light → dark | From #1, click the toggle. | Dark theme; `aria-pressed="true"`; `<html data-theme="dark">`. |
| 4 | Switch dark → light | From #3, click again. | Light theme; `aria-pressed="false"`; `<html data-theme="light">`. |
| 5 | Keyboard | Tab from the top of the page until the toggle has focus; press Enter, then Space. | Focus ring visible on the toggle; Enter → dark, Space → light. |
| 6 | Remembered (light system, dark chosen) | System light. Toggle to dark. Quit the browser fully, reopen `/`. | Dark theme, `aria-pressed="true"`; `localStorage.theme === "dark"`. |
| 7 | Remembered (dark system, light chosen) | System dark. Toggle to light. Reload. | Light theme, `aria-pressed="false"`. |
| 8 | All pages | Toggle to dark on `/`, follow the nav to Résumé, Writing, Design system, a case study, and a 404 URL. | Every page dark, toggle pressed. |
| 9 | No flash | Toggle to dark; DevTools → Performance → record a reload with screenshots (or throttle CPU 6×). | No light frame before the dark page. |
| 10 | System change followed until chosen | Clear site data. System light, open `/`. Switch the emulation to dark. | Page turns dark and the toggle becomes pressed without reload. |
| 11 | Storage blocked | Chrome settings → block all site data for `localhost`. Open `/`, click the toggle. | Theme switches; console shows no error. After reload, the system theme is back (expected: nothing stored). |
| 12 | Print stays light | Toggle to dark on `/resume/`. Print preview. | Light colours in the preview. |
| 13 | No JavaScript | DevTools → Disable JavaScript. System dark. Open `/`. | Dark theme; no toggle in the header; nothing else missing. |
| 14 | Contrast and look | In both themes, inspect the toggle on `/` and on `/system/#theme-toggle`. | Icon visible, focus ring ≥3:1, target ≥24×24 px; reduced motion: no icon animation. |

**Cleanup:** clear site data for the origin; reset the media emulation; re-enable JavaScript and storage.

**Not testable automatically:** a screen reader's spoken output (#1–#2 are checked via `aria-pressed` and
the accessible name instead); a real browser restart (#6 is automated as a new page in the same
context with the same storage, which is what a restart preserves).
