import {
  button,
  eyebrow,
  impact,
  linkTo,
  practice,
  shot,
  tags,
  timelineItem,
  workCard,
} from "../render/components.ts";
import { html, raw } from "../render/html.ts";
import { defineContracts } from "./schema.ts";

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
    purpose: "The one primary call to action of a page. A link styled as a pill, inverted colours.",
    classes: ["button"],
    states: ["default", "hover (lifts by `--lift-sm`)", "active", "focus-visible"],
    a11y: [
      "It is an `<a>`: it navigates, so it is a link, not a `<button>`.",
      "The lift is a transform on `--duration-fast`, which is 0 under reduced motion.",
    ],
    do: ["Keep one per page, for the main action."],
    dont: ["Don't use it for in-page actions that need a `<button>`."],
    contrast: [{ fg: "--color-bg", bg: "--color-fg", min: 4.5, use: "label on the inverted pill" }],
    example: () => html`<p>${button("#contact", "Get in touch")}</p>`,
  },
  {
    name: "Card",
    kind: "component",
    purpose:
      "A case study teaser in the “Selected work” grid: cover, eyebrow, title, summary, impact.",
    classes: ["cards", "card", "card-cover", "is-portrait", "card-title", "card-link"],
    states: [
      "default",
      "hover / focus-within (accent border, lifts, cover zooms)",
      "portrait cover",
    ],
    a11y: [
      "One link per card, on the title; its `::after` stretches the hit area over the whole card.",
      "The focus ring is drawn around the card, through that `::after`.",
      "The cover keeps the alt text written in the content.",
    ],
    do: ['Wrap cards in `.cards` (a `<ul>`), one `<li class="card">` each.'],
    dont: ["Don't add a second link inside a card: the stretched link would cover it."],
    contrast: [
      { fg: "--color-fg", bg: "--color-surface", min: 4.5, use: "title and summary" },
      { fg: "--color-muted", bg: "--color-surface", min: 4.5, use: "eyebrow and impact labels" },
    ],
    example: (site, root) => {
      const work = site.work[0];
      return html`<ul class="cards">${work && workCard(work, root)}</ul>`;
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
    purpose: "The Markdown body of a case study, at a readable line length.",
    classes: ["prose"],
    a11y: ["Headings in the Markdown start at `h2`, under the case study's `h1`."],
    example: (site) => {
      const paragraph = site.work[0]?.html.match(/<p>[\s\S]*?<\/p>/)?.[0] ?? "";
      return html`<div class="prose">${raw(paragraph)}</div>`;
    },
  },

  // Layout
  {
    name: "Page",
    kind: "layout",
    purpose: "Page frame: centred column, header, sections and the contact footer.",
    classes: [
      "page",
      "section",
      "subheading",
      "site-header",
      "site-name",
      "site-footer",
      "contact-lead",
      "contact-links",
      "colophon",
    ],
    elements: ["body", "h1", "h2", "h3", "p", "ul", "ol", "img", "figcaption", "code"],
    a11y: [
      'One `h1` per page, headings never skip a level, `<html lang="en">`.',
      "Sections are labelled by their heading (`aria-labelledby`).",
      "Light and dark themes follow `prefers-color-scheme`; there is no toggle and no JavaScript.",
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
