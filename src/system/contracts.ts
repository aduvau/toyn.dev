import {
  button,
  eyebrow,
  impact,
  linkTo,
  postList,
  practice,
  shot,
  tags,
  themeToggle,
  timelineItem,
  workCard,
} from "../render/components.ts";
import { html, raw } from "../render/html.ts";
import { type Contract, defineContracts } from "./schema.ts";

/** Base text pairs: every page sets its text on `--color-bg`. */
const TEXT_ON_BG = [
  { fg: "--color-fg", bg: "--color-bg", min: 4.5, use: "body text" },
  { fg: "--color-muted", bg: "--color-bg", min: 4.5, use: "secondary text" },
] as const;

/**
 * Every component, layout block and utility class of the site. The `/system` page, `system.md`,
 * `llms.txt` and the guardrail tests are generated from this list: add a contract before adding a
 * class to `styles/main.css`.
 */
export const contracts = defineContracts([
  // Components
  {
    name: "Link",
    kind: "component",
    purpose: "Inline navigation, in text and lists. External links say so to screen readers.",
    classes: [],
    elements: ["a"],
    states: ["default", "hover (underline moves down)", "focus-visible (focus ring)"],
    a11y: [
      "Underlined, so links don't rely on colour alone.",
      'External links get a visually hidden “(external)” and `rel="noopener"`.',
      "Every focusable element shows the global `:focus-visible` ring (`--focus-width`, `--color-focus`).",
    ],
    do: ["Use `linkTo()` for links built from content, so external links are labelled."],
    dont: ["Don't remove the underline or the focus ring."],
    contrast: [
      { fg: "--color-accent", bg: "--color-bg", min: 4.5, use: "link text" },
      { fg: "--color-focus", bg: "--color-bg", min: 3, use: "focus ring" },
      { fg: "--color-focus", bg: "--color-surface", min: 3, use: "focus ring on surfaces" },
    ],
    example: (site) => {
      const link = site.profile.links[0];
      return html`<p>${link && linkTo(link.url, link.label)}</p>`;
    },
  },
  {
    name: "Button",
    kind: "component",
    purpose:
      "The one primary call to action of a page. A pill with inverted colours, on a link or a button.",
    classes: ["button"],
    states: ["default", "hover (lifts by `--lift-sm`)", "active", "focus-visible"],
    a11y: [
      'An `<a>` when it navigates; a `<button type="button">` only for an in-page action (the résumé\'s “Save as PDF”).',
      "The lift is a transform on `--duration-fast`, which is 0 under reduced motion.",
    ],
    do: ["Keep one per page, for the main action."],
    dont: ["Don't put it on an `<a>` for an action, or on a `<button>` for navigation."],
    contrast: [{ fg: "--color-bg", bg: "--color-fg", min: 4.5, use: "label on the inverted pill" }],
    example: () => html`<p>${button("#contact", "Get in touch")}</p>`,
  },
  {
    name: "Theme toggle",
    kind: "component",
    purpose:
      "Switches between the light and dark themes, at the end of every page's header. Follows the system until used; the choice is then remembered (ADR-0005).",
    classes: ["theme-toggle"],
    states: [
      "not pressed (light theme shown)",
      "pressed (dark theme shown; the disc turns over on `--duration-normal`)",
      "hover (border darkens)",
      "focus-visible",
      "narrow screens (below `48rem`): top of the header, 42px touch target",
      "hidden without JavaScript: the theme then follows the system",
    ],
    a11y: [
      'A `<button type="button">` named “Dark theme” (visually hidden text, the icon is `aria-hidden`), its state in `aria-pressed`, so screen readers say “Dark theme, toggle button, pressed”.',
      "`aria-pressed` reflects the theme shown, whether it comes from the system or the visitor's choice, and updates when the system changes.",
      "The stored theme is applied in `<head>` before the stylesheet, so there is no flash of the other theme.",
      "Hidden with `@media (scripting: none)`: no dead button without JavaScript.",
    ],
    do: ["Render it with `themeToggle()`; every `.theme-toggle` on a page acts on the same theme."],
    dont: [
      "Don't change the label with the state: the name stays “Dark theme”, `aria-pressed` carries the state.",
      "Don't print the chosen theme: dark tokens are screen-only.",
    ],
    // The icon is `--color-fg` on `--color-bg`, already held to 4.5:1 as body text (Page).
    contrast: [{ fg: "--color-focus", bg: "--color-bg", min: 3, use: "focus ring" }],
    example: () => html`<p>${themeToggle()}</p>`,
  },
  {
    name: "Card",
    kind: "component",
    purpose:
      "A case study teaser in the “Selected work” grid: cover, eyebrow, title, summary, impact.",
    classes: [
      "cards",
      "card",
      "card-cover",
      "is-portrait",
      "is-wide",
      "card-title",
      "card-link",
      "card-summary",
    ],
    states: [
      "default",
      "hover / focus-within (accent border, card lifts by `--lift-md`, the cover's detail rises by `--lift-lg`)",
      "contract open: construction lines, no lift, only the title links (see Card contract)",
      "portrait cover (centred at 56% width, cut by the bottom edge)",
      "wide cover (anchored left at 220% width, cut by the right edge)",
    ],
    a11y: [
      "One link per card, on the title; its `::after` stretches the hit area over the whole card.",
      "The “View contract” toggle comes after the `<article>`, so the article holds the teaser only.",
      "The focus ring is drawn around the card, through that `::after`.",
      "The cover keeps the alt text written in the content.",
    ],
    do: [
      'Wrap cards in `.cards` (a `<ul>`), one `<li class="card">` each.',
      "Use `cardCover` for one readable UI detail (a form, a component, a phone screen), cropped to the UI itself; the case study keeps its full screenshot in `cover`.",
      "Let the cover's shape pick the rule: taller than wide is `.is-portrait`, otherwise `.is-wide`.",
    ],
    dont: [
      "Don't add a second link or control inside a card, except the “View contract” toggle: the stretched link would cover it.",
      "Don't use a full page or a device mockup as a card cover, and don't zoom it on hover.",
    ],
    contrast: [
      { fg: "--color-fg", bg: "--color-surface", min: 4.5, use: "title and summary" },
      { fg: "--color-muted", bg: "--color-surface", min: 4.5, use: "eyebrow and impact labels" },
    ],
    example: (site, root) => {
      const work = site.work[0];
      return html`<ul class="cards">${work && workCard(work, root, cardContract())}</ul>`;
    },
  },
  {
    name: "Card contract",
    kind: "component",
    purpose:
      "“View contract” on a card: opens the Card contract the card was built from, and draws construction lines on each part, labelled with its class.",
    classes: ["card-contract", "card-contract-panel"],
    states: [
      "closed: a mono pill at the card's bottom right",
      "hover (accent text and border)",
      "focus-visible",
      "opening / closing: the panel unfolds, fades and slides down over `--duration-slow`, and the `{ }` opens up (instant under reduced motion, or where `::details-content` is unsupported)",
      "open: accent pill; the panel opens below it; every `data-part` gets crossing corner lines and a mono label; the card stops lifting and only its title links",
    ],
    a11y: [
      "A native `<details>` / `<summary>`: keyboard operable, announced as “View contract, collapsed / expanded”, and it works without JavaScript.",
      "The `{ }` is `aria-hidden`, so the name is “View contract” alone.",
      'The labels are CSS content with empty alternative text (`/ ""`), so headings keep their names. The panel\'s Selectors row carries the same information.',
      "The summary and the panel sit above the stretched card link (`z-index: 1`), so they can be clicked.",
    ],
    do: [
      "Render the panel from the contract with `workCard(work, root, contract)`, never by hand, so it can't drift.",
      "Label each part with `data-part`, set to a class the element has and a contract owns (a test checks both).",
    ],
    dont: [
      "Don't reuse `.contract`: that is the `/system` entry, with its top border.",
      "Don't animate the lines: the open card holds still.",
    ],
    contrast: [
      {
        fg: "--color-accent",
        bg: "--color-surface",
        min: 4.5,
        use: "open pill; construction lines",
      },
      { fg: "--color-accent-fg", bg: "--color-accent", min: 4.5, use: "part labels" },
      { fg: "--color-accent", bg: "--color-bg", min: 3, use: "construction lines on the cover" },
      { fg: "--color-muted", bg: "--color-bg", min: 4.5, use: "panel sources line" },
    ],
    example: (site, root) => {
      const work = site.work[1] ?? site.work[0];
      return html`<ul class="cards">${work && workCard(work, root, cardContract(), { open: true })}</ul>`;
    },
  },
  {
    name: "Eyebrow",
    kind: "component",
    purpose: "A short uppercase label above a title: client and period, or “Next”.",
    classes: ["eyebrow"],
    a11y: ["A plain paragraph, before the heading it introduces; uppercase is CSS only."],
    dont: ["Don't use it as a heading."],
    example: (site) => {
      const work = site.work[0];
      return work ? eyebrow(`${work.client} · ${work.period}`) : html``;
    },
  },
  {
    name: "Impact",
    kind: "component",
    purpose: "Measured results of a case study: a big figure and what it measures.",
    classes: ["impact", "impact-item"],
    a11y: [
      "A `<dl>` labelled “Impact”: the label (`dt`) comes before the figure (`dd`) in the source, the figure is shown first with `column-reverse`.",
      "Figures use tabular numbers.",
    ],
    do: ["Only figures with a source: the resume, or a before/after measurement."],
    dont: ["Don't round or invent numbers to fill the row."],
    example: (site) => {
      const work = site.work.find((w) => w.impact.length > 0);
      return work ? impact(work) : html``;
    },
  },
  {
    name: "Tags",
    kind: "component",
    purpose: "The stack of a case study, as small outlined pills.",
    classes: ["tags", "tag"],
    a11y: ["A `<ul>` labelled “Stack”, so it is announced as a list."],
    dont: ["Don't make tags interactive: they are not filters."],
    example: (site) => tags(site.work[0]?.stack ?? []),
  },
  {
    name: "Screenshot",
    kind: "component",
    purpose: "A WebP screenshot with an optional dark-mode variant and caption.",
    classes: ["case-cover", "shot", "gallery"],
    states: ["light", "dark (swapped with `prefers-color-scheme` when a dark shot exists)"],
    a11y: [
      "Alt text is required by the content schema; the build fails without it.",
      "Width and height come from the file, so images don't shift the layout.",
      "Lazy-loaded, except the cover of a case study.",
    ],
    example: (site, root) => {
      const img = site.work.flatMap((w) => w.gallery)[0];
      return img ? shot(img, root) : html``;
    },
  },
  {
    name: "Hero",
    kind: "component",
    purpose:
      "The top of the home page: name and role (the `h1`), tagline, intro and the call to action.",
    classes: ["hero", "hero-name", "hero-role", "tagline", "intro"],
    a11y: [
      "The `h1` holds the name and role; the tagline is a paragraph styled large.",
      "Only on the home page, since it holds the `h1`; the example shows the tagline and intro only.",
      "The résumé header reuses `.hero-name` and `.hero-role` for its own `h1`.",
    ],
    example: (site) =>
      html`<p class="tagline">${site.profile.tagline}</p><p class="intro">${site.profile.intro[0]}</p>`,
  },
  {
    name: "Practice",
    kind: "component",
    purpose: "One way of working, in the “How I work” grid.",
    classes: ["practices", "practice"],
    a11y: ["Each practice is a list item with an `h3`, under the section's `h2`."],
    example: (site) => {
      const first = site.profile.practices[0];
      return html`<ul class="practices">${first && practice(first)}</ul>`;
    },
  },
  {
    name: "Timeline",
    kind: "component",
    purpose: "Experience by organisation, with its roles; then education.",
    classes: [
      "timeline",
      "timeline-item",
      "timeline-org",
      "timeline-period",
      "timeline-role",
      "timeline-role-title",
      "education",
    ],
    a11y: ["An ordered list, most recent first; each organisation is an `h3`."],
    example: (site) => {
      const first = site.timeline.experience[0];
      return html`<ol class="timeline">${first && timelineItem(first)}</ol>`;
    },
  },
  {
    name: "Prose",
    kind: "component",
    purpose: "The Markdown body of a case study or a post, at a readable line length.",
    classes: ["prose"],
    a11y: [
      "Headings in the Markdown start at `h2`, under the page's `h1`.",
      "Code blocks wrap instead of scrolling sideways, so they never need a horizontal scroll or a keyboard stop.",
    ],
    contrast: [
      { fg: "--color-fg", bg: "--color-raised", min: 4.5, use: "callouts" },
      { fg: "--color-accent", bg: "--color-raised", min: 4.5, use: "links in callouts" },
    ],
    example: (site) => {
      const paragraph = site.work[0]?.html.match(/<p>[\s\S]*?<\/p>/)?.[0] ?? "";
      return html`<div class="prose">${raw(paragraph)}</div>`;
    },
  },

  // Layout
  {
    name: "Page",
    kind: "layout",
    purpose:
      "Page frame: centred column, header, sections, and the contact footer (home page only).",
    classes: [
      "page",
      "section",
      "subheading",
      "site-header",
      "site-nav",
      "site-footer",
      "contact-lead",
      "contact-links",
      "colophon",
    ],
    elements: ["body", "h1", "h2", "h3", "p", "ul", "ol", "img", "figcaption", "code"],
    a11y: [
      'One `h1` per page, headings never skip a level, `<html lang="en">`.',
      "Sections are labelled by their heading (`aria-labelledby`).",
      "Light and dark themes follow `prefers-color-scheme` until the visitor uses the Theme toggle.",
      'Every page has a header `<nav aria-label="Main">` (Home, Writing once a post is published, Résumé, Design system); the current page has `aria-current="page"` and stays underlined, so it doesn\'t rely on colour.',
    ],
    contrast: [...TEXT_ON_BG],
  },
  {
    name: "Case study",
    kind: "layout",
    purpose:
      "The structure of a case study page: back link, header, cover, impact, prose, links, next.",
    classes: ["case", "back", "case-header", "case-links", "next"],
    a11y: ["The “Next case study” block is a `<nav>` with its own label."],
  },
  {
    name: "Writing",
    kind: "layout",
    purpose:
      "The `/writing` index (posts newest first) and a post page (back link, case-study header, prose). Not built until a post is published.",
    classes: ["post-item"],
    a11y: [
      "The index is an ordered list; each title is an `h2` link under the page's `h1`.",
      "Dates are `<time datetime>` elements, so they're machine-readable.",
      "A post is an `<article>` inside `main`.",
    ],
    dont: ["Don't publish a post with open notes for Antoine: the build warns about them."],
    contrast: [...TEXT_ON_BG],
    example: (site, root) =>
      site.posts.length > 0
        ? postList(site.posts.slice(0, 1), root)
        : html`<p class="muted">No post is published yet.</p>`,
  },
  {
    name: "Design system page",
    kind: "layout",
    purpose: "This page: token swatches and scales, contrast table, and one entry per contract.",
    classes: [
      "system-toc",
      "swatches",
      "swatch",
      "swatch-chip",
      "table-scroll",
      "system-table",
      "type-sample",
      "space-bar",
      "contract",
      "contract-spec",
      "contract-example",
    ],
    a11y: [
      "Contrast ratios are computed at build time, in both themes, from `tokens.css`.",
      "Examples are rendered by the same functions as the real pages, with the real content.",
    ],
    contrast: [
      ...TEXT_ON_BG,
      { fg: "--color-fg", bg: "--color-surface", min: 4.5, use: "examples" },
      { fg: "--color-accent", bg: "--color-surface", min: 4.5, use: "links in examples" },
    ],
  },

  {
    name: "Résumé",
    kind: "layout",
    purpose:
      "`/resume`: profile, timeline and case studies as a résumé that prints on up to two A4 pages.",
    classes: [
      "resume",
      "resume-header",
      "resume-contact",
      "resume-hint",
      "resume-print",
      "resume-section",
      "resume-entry",
      "resume-role",
      "resume-role-title",
      "resume-period",
      "resume-more",
      "resume-impact",
      "resume-list",
    ],
    states: [
      "screen (follows the colour scheme); from `48rem` wide, section labels sit in a left gutter",
      "phone (labels stack above their content)",
      "with JavaScript: a “Save as PDF” button opens the print dialog",
      "without JavaScript: the button is hidden (`@media (scripting: none)`) and a `<noscript>` hint explains how to print",
      "print (A4, label gutter, black and grey only, no header, footer, button or hint; roles and short sections never split across pages)",
    ],
    a11y: [
      "The `h1` holds the name and role, like the home page; one `h2` per section, one `h3` per organisation or project.",
      "Links show their URL as text, so they still work on paper.",
      "The email is written as HTML entities: plain text for browsers and screen readers, not for naive scrapers.",
    ],
    do: [
      "Keep every claim in the content files; the page only rearranges them.",
      "Name a skill in `profile.yaml` only if the content already mentions it — a test checks.",
    ],
    dont: [
      "Don't add JavaScript beyond the button's inline `onclick=\"print()\"`; a test allows that one handler only.",
    ],
    contrast: [...TEXT_ON_BG],
    example: (site) => {
      const first = site.profile.skills[0];
      return html`<dl class="resume-list">${first && html`<div><dt>${first.group}</dt><dd>${first.items.join(", ")}</dd></div>`}</dl>`;
    },
  },

  // Utilities
  {
    name: "Skip link",
    kind: "utility",
    purpose: "“Skip to content”, the first focusable element of every page; visible on focus only.",
    classes: ["skip-link"],
    states: ["hidden", "focus-visible (slides in)"],
    a11y: [
      'Targets `#main`; every page has a `<main id="main">`. Press Tab at the top of any page to see it.',
    ],
    contrast: [{ fg: "--color-accent-fg", bg: "--color-accent", min: 4.5, use: "label" }],
  },
  {
    name: "Visually hidden",
    kind: "utility",
    purpose: "Text for screen readers only, e.g. “(external)” after a link.",
    classes: ["visually-hidden"],
    a11y: ["Hidden with `clip-path`, never `display: none`, so it is still read out."],
  },
  {
    name: "Muted",
    kind: "utility",
    purpose: "Secondary text colour.",
    classes: ["muted"],
    a11y: ["`--color-muted` passes AA on both backgrounds, in both themes."],
    contrast: [
      { fg: "--color-muted", bg: "--color-bg", min: 4.5, use: "secondary text" },
      { fg: "--color-muted", bg: "--color-surface", min: 4.5, use: "secondary text on surfaces" },
    ],
  },
]);

/** The Card contract, which every card prints in its "View contract" panel. */
export function cardContract(): Contract {
  const card = contracts.find((c) => c.name === "Card");
  if (!card) throw new Error("the Card contract is missing");
  return card;
}
