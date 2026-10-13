# v1.y log — `/resume`, a printable résumé (2026-10-13)

- **Content:** `profile.yaml` gains `email` (`a@toyn.dev`), `skills` (grouped) and `languages`;
  timeline roles gain an optional `work: <slug>` linking the matching case study. An unknown or draft
  slug is a load error. The summary reuses the tagline and first intro paragraph; no new claims.
- **Page:** `src/render/resume.ts` → `/resume/`: header (name, role, contact), summary, experience
  (with case-study links), projects (case studies not tied to a role, i.e. dadama), skills,
  languages, education. Links show their URL as text so they survive print. Linked from the footer
  and `llms.txt`.
- **Email:** only on `/resume`, written as numeric HTML entities (no JS allowed, so obfuscation is
  deliberately light; the PDF carries it in plain text anyway). Tests decode entities before checking,
  so encoding can't sneak the address onto other pages.
- **Print:** `@page` A4 with `--print-margin`, root size `--print-root-size`; header, footer and hint
  hidden; entries never split. Dark tokens are now `@media screen and (prefers-color-scheme: dark)`, so
  printing from a dark system stays light. Checked with headless Chrome: 2 A4 pages, light and dark.
- **Print design:** editorial "label gutter" layout (small uppercase section labels left, content
  right), shared with wide screens; black and grey only; italic role titles, dates beside titles; skills
  as one grid sized to the longest label; 9pt root, `--leading-print` 1.45. Short sections and roles
  never split across pages. Still 2 A4 pages.
- **Save as PDF:** progressive enhancement (ADR-0003). A `<button onclick="print()">` (the `.button` pill, now
  also allowed on a `<button>` for in-page actions) is hidden by `@media (scripting: none)`; the how-to
  sits in `<noscript>`. Still no `<script>` beyond the trailing-slash fix: a test allows exactly this
  one inline handler, on `/resume` only. Checked in Chrome with scripting disabled (CDP): hint, no button.
- **Guardrails:** new tests — résumé built, email only on the résumé and obfuscated, every case study
  linked, no dark tokens in print, A4 `@page`; every skill must be named elsewhere in the content
  (whole-word match; fake "Go", "Rust", "Kubernetes" all caught); unknown role → work link refused. New "Résumé" contract.
- **Budget:** CSS raised from 12 KB to 14 KB (now ~13 KB), one stylesheet kept on purpose — per
  Antoine, a second request costs more than a slightly bigger file.
