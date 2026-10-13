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
  { key: "resume", label: "CV", path: RESUME_PATH },
  { key: "system", label: "System", path: SYSTEM_PATH },
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

/**
 * Brand logos for the profile links, keyed by label. Paths from Simple Icons 9.21.0 (CC0), drawn
 * in `currentColor` on a 24×24 box.
 */
const SOCIAL_ICONS: Record<string, string> = {
  LinkedIn:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  Codeberg:
    "M11.955.49A12 12 0 0 0 0 12.49a12 12 0 0 0 1.832 6.373L11.838 5.928a.187.14 0 0 1 .324 0l10.006 12.935A12 12 0 0 0 24 12.49a12 12 0 0 0-12-12 12 12 0 0 0-.045 0zm.375 6.467l4.416 16.553a12 12 0 0 0 5.137-4.213z",
  GitHub:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
};

/**
 * The profile links as round logo buttons, in the hero and every footer. Named by their label
 * (visually hidden), since the logo is `aria-hidden`.
 */
export function socialLinks(site: Site): SafeHtml {
  return html`<ul class="social-links" aria-label="Elsewhere">${site.profile.links.map((l) => {
    const icon = SOCIAL_ICONS[l.label];
    if (!icon) throw new Error(`No logo for profile link "${l.label}" (add one to SOCIAL_ICONS)`);
    return html`<li><a class="social-link" href="${l.url}" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${icon}"/></svg><span class="visually-hidden">${l.label} (external)</span></a></li>`;
  })}</ul>`;
}

/** Every page's footer: copyright on the left, the profile links on the right. */
export function siteFooter(site: Site): SafeHtml {
  return html`<footer class="site-footer">
<p class="copyright">© ${new Date().getFullYear()} ${site.profile.name}</p>
${socialLinks(site)}
</footer>`;
}
