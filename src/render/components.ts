import type { Image, Post, Site, Work } from "../content/load.ts";
import type { Profile } from "../content/schemas.ts";
import { type Contract, contractId } from "../system/schema.ts";
import { html, raw, type SafeHtml } from "./html.ts";
import { inline, selectorsRow, specList } from "./spec.ts";
import { postPath, RESUME_PATH, SYSTEM_PATH, WRITING_PATH, workPath } from "./urls.ts";

// The site's components. Each one has a contract in `src/system/contracts.ts`; `root` is the prefix
// from the current page back to the site root (`""`, `"../"`, `"../../"`).

const external = (url: string) => /^https?:\/\//.test(url);

export function linkTo(url: string, label: string): SafeHtml {
  return external(url)
    ? html`<a href="${url}" rel="noopener">${label}<span class="visually-hidden"> (external)</span></a>`
    : html`<a href="${url}">${label}</a>`;
}

export function button(href: string, label: string): SafeHtml {
  return html`<a class="button" href="${href}">${label}</a>`;
}

/** `part` labels it for the card's construction lines (see `workCard`). */
export function eyebrow(text: string, part?: string): SafeHtml {
  return html`<p class="eyebrow"${part && html` data-part="${part}"`}>${text}</p>`;
}

export function impact(work: Work, part?: string): SafeHtml {
  if (work.impact.length === 0) return html``;
  return html`<dl class="impact" aria-label="Impact"${part && html` data-part="${part}"`}>${work.impact.map(
    (i) => html`<div class="impact-item"><dt>${i.label}</dt><dd>${i.value}</dd></div>`,
  )}</dl>`;
}

/** A screenshot, with its dark-mode variant when there is one. Sized to avoid layout shifts. */
export function picture(img: Image, root: string, eager = false): SafeHtml {
  return html`<picture>${img.srcDark && html`<source srcset="${root}public/${img.srcDark}" media="(prefers-color-scheme: dark)">`}<img src="${root}public/${img.src}" alt="${img.alt}" width="${img.width}" height="${img.height}" ${eager ? "" : raw('loading="lazy" ')}decoding="async"></picture>`;
}

export function shot(img: Image, root: string): SafeHtml {
  return html`<figure class="shot">${picture(img, root)}${img.caption && html`<figcaption>${img.caption}</figcaption>`}</figure>`;
}

export function gallery(work: Work, root: string): SafeHtml {
  if (work.gallery.length === 0) return html``;
  return html`<section class="gallery" aria-label="Screenshots">${work.gallery.map((img) => shot(img, root))}</section>`;
}

export function tags(items: string[]): SafeHtml {
  if (items.length === 0) return html``;
  return html`<ul class="tags" aria-label="Stack">${items.map((s) => html`<li class="tag">${s}</li>`)}</ul>`;
}

/**
 * A case study teaser. It ends with a "View contract" toggle that prints the card's own `contract`;
 * when open, CSS draws construction lines on every `data-part` (each labelled with its class).
 */
export function workCard(
  work: Work,
  root: string,
  contract: Contract,
  { open = false }: { open?: boolean } = {},
): SafeHtml {
  return html`<li class="card">
<article>
${work.cardCover && html`<div class="card-cover ${work.cardCover.height > work.cardCover.width ? "is-portrait" : "is-wide"}" data-part=".card-cover">${picture(work.cardCover, root)}</div>`}
${eyebrow(`${work.client} · ${work.period}`, ".eyebrow")}
<h3 class="card-title" data-part=".card-title"><a class="card-link" href="${root}${workPath(work.slug)}">${work.title}</a></h3>
<p class="card-summary" data-part=".card-summary">${work.summary}</p>
${impact(work, ".impact")}
</article>
${contractToggle(contract, root, open)}
</li>`;
}

/** The card's "View contract" disclosure: a `<details>`, so it works without JavaScript. */
function contractToggle(contract: Contract, root: string, open: boolean): SafeHtml {
  const contrast = contract.contrast.map((c) => `\`${c.fg}\` on \`${c.bg}\` ≥ ${c.min}: ${c.use}`);
  return html`<details class="card-contract"${open ? raw(" open") : ""}><summary><span aria-hidden="true">{ }</span> View contract</summary><div class="card-contract-panel">
<p>${inline(contract.purpose)}</p>
<dl>${selectorsRow(contract)}${specList("Accessibility", contract.a11y)}${specList("Contrast", contrast)}${specList("Don't", contract.dont)}</dl>
<p class="muted">From <code>src/system/contracts.ts</code> · checked by <code>tests/system.test.ts</code> · <a href="${root}${SYSTEM_PATH}#${contractId(contract)}">${contract.name} on /system</a></p>
</div>
</details>`;
}

/** A post's date, e.g. "13 October 2026", machine-readable in `datetime`. */
export function postDate(post: Post): SafeHtml {
  const label = new Date(`${post.date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return html`<time datetime="${post.date}">${label}</time>`;
}

/** The list of posts on `/writing`, newest first. */
export function postList(posts: Post[], root: string): SafeHtml {
  return html`<ol>${posts.map(
    (p) =>
      html`<li class="post-item"><p class="eyebrow">${postDate(p)}</p><h2><a href="${root}${postPath(p.slug)}">${p.title}</a></h2><p>${p.summary}</p></li>`,
  )}</ol>`;
}

export function practice(p: Profile["practices"][number]): SafeHtml {
  return html`<li class="practice"><h3>${p.title}</h3><p>${p.body}</p></li>`;
}

/** A flat banner that sends the visitor to the résumé, at the end of the home page. */
export function resumeBanner(root: string): SafeHtml {
  return html`<section class="cta-banner" aria-labelledby="resume-banner-title">
<div><h2 id="resume-banner-title">Want the full picture?</h2><p>Every role, project and skill on one page, ready to print.</p></div>
${button(root + RESUME_PATH, "Read my résumé")}
</section>`;
}

/** The pages linked from the header nav, keyed by what a page passes as `current`. */
const NAV = [
  { key: "home", label: "Home", path: "" },
  { key: "writing", label: "Writing", path: WRITING_PATH },
  { key: "resume", label: "Résumé", path: RESUME_PATH },
  { key: "system", label: "Design system", path: SYSTEM_PATH },
] as const;

/**
 * Header of every page. `current` marks the page you're on, if it's in the nav. "Writing" only
 * shows once a post is published, since `/writing` isn't built before.
 */
export function siteHeader(
  site: Site,
  root: string,
  current?: (typeof NAV)[number]["key"],
): SafeHtml {
  const items = NAV.filter((item) => item.key !== "writing" || site.posts.length > 0);
  return html`<header class="site-header"><nav class="site-nav" aria-label="Main"><ul>${items.map(
    (item) =>
      html`<li><a href="${root + item.path || "./"}"${item.key === current ? raw(' aria-current="page"') : ""}>${item.label}</a></li>`,
  )}</ul></nav>${themeToggle()}</header>`;
}

/**
 * Switches between the light and dark themes (ADR-0005). The state is `aria-pressed`, set by the
 * head script from the theme shown; the half-filled disc turns over when dark is on.
 */
export function themeToggle(): SafeHtml {
  return html`<button class="theme-toggle" type="button" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg><span class="visually-hidden">Dark theme</span></button>`;
}

export function siteFooter(site: Site, root: string): SafeHtml {
  const { profile } = site;
  return html`<footer class="site-footer" id="contact">
<h2>Contact</h2>
<p class="contact-lead">Open to design-engineering and product-engineering roles. The best way to reach me is a message on LinkedIn.</p>
<ul class="contact-links"><li><a href="${root}${RESUME_PATH}">Résumé</a></li>${profile.links.map((l) => html`<li>${linkTo(l.url, l.label)}</li>`)}</ul>
<p class="colophon">Built with vanilla TypeScript and Bun, no framework, no client-side bundle. Hosted on Codeberg Pages. Its <a href="${root}${SYSTEM_PATH}">design system</a> is generated from the code.</p>
</footer>`;
}
