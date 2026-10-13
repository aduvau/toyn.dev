import type { Image, Site, Work } from "../content/load.ts";
import { html, raw, type SafeHtml } from "./html.ts";
import { layout } from "./layout.ts";
import { WORK_ROOT, workPath } from "./urls.ts";

const external = (url: string) => /^https?:\/\//.test(url);

function linkTo(url: string, label: string): SafeHtml {
  return external(url)
    ? html`<a href="${url}" rel="noopener">${label}<span class="visually-hidden"> (external)</span></a>`
    : html`<a href="${url}">${label}</a>`;
}

function impact(work: Work): SafeHtml {
  if (work.impact.length === 0) return html``;
  return html`<dl class="impact" aria-label="Impact">${work.impact.map(
    (i) => html`<div class="impact-item"><dt>${i.label}</dt><dd>${i.value}</dd></div>`,
  )}</dl>`;
}

/** A screenshot, with its dark-mode variant when there is one. Sized to avoid layout shifts. */
function picture(img: Image, root: string, eager = false): SafeHtml {
  return html`<picture>${img.srcDark && html`<source srcset="${root}public/${img.srcDark}" media="(prefers-color-scheme: dark)">`}<img src="${root}public/${img.src}" alt="${img.alt}" width="${img.width}" height="${img.height}" ${eager ? "" : raw('loading="lazy" ')}decoding="async"></picture>`;
}

function gallery(work: Work): SafeHtml {
  if (work.gallery.length === 0) return html``;
  return html`<section class="gallery" aria-label="Screenshots">${work.gallery.map(
    (img) =>
      html`<figure class="shot">${picture(img, WORK_ROOT)}${img.caption && html`<figcaption>${img.caption}</figcaption>`}</figure>`,
  )}</section>`;
}

function stack(items: string[]): SafeHtml {
  if (items.length === 0) return html``;
  return html`<ul class="tags" aria-label="Stack">${items.map((s) => html`<li class="tag">${s}</li>`)}</ul>`;
}

function siteHeader(site: Site, root: string): SafeHtml {
  return html`<header class="site-header"><a class="site-name" href="${root || "./"}">${site.profile.name}</a></header>`;
}

function footer(site: Site): SafeHtml {
  const { profile } = site;
  return html`<footer class="site-footer" id="contact">
<h2>Contact</h2>
<p class="contact-lead">Open to design-engineering and product-engineering roles. The best way to reach me is a message on LinkedIn.</p>
${profile.links.length > 0 && html`<ul class="contact-links">${profile.links.map((l) => html`<li>${linkTo(l.url, l.label)}</li>`)}</ul>`}
<p class="colophon">Built with vanilla TypeScript and Bun, no framework, no client-side bundle. Hosted on Codeberg Pages.</p>
</footer>`;
}

function workCard(work: Work): SafeHtml {
  return html`<li class="card">
<article>
${work.cover && html`<div class="card-cover${work.cover.height > work.cover.width ? " is-portrait" : ""}">${picture(work.cover, "")}</div>`}
<p class="eyebrow">${work.client} · ${work.period}</p>
<h3 class="card-title"><a class="card-link" href="${workPath(work.slug)}">${work.title}</a></h3>
<p>${work.summary}</p>
${impact(work)}
</article>
</li>`;
}

export function homePage(site: Site): string {
  const { profile, timeline } = site;
  const body = html`<main id="main" class="page">
<section class="hero" aria-labelledby="hero-title">
<h1 id="hero-title"><span class="hero-name">${profile.name}</span> <span class="hero-role">${profile.title} · ${profile.location}</span></h1>
<p class="tagline">${profile.tagline}</p>
${profile.intro.map((p) => html`<p class="intro">${p}</p>`)}
<p><a class="button" href="#contact">Get in touch</a></p>
</section>

<section class="section" aria-labelledby="work-title">
<h2 id="work-title">Selected work</h2>
<ul class="cards">${site.work.map(workCard)}</ul>
</section>

<section class="section" aria-labelledby="practices-title">
<h2 id="practices-title">How I work</h2>
<ul class="practices">${profile.practices.map(
    (p) => html`<li class="practice"><h3>${p.title}</h3><p>${p.body}</p></li>`,
  )}</ul>
</section>

<section class="section" aria-labelledby="experience-title">
<h2 id="experience-title">Experience</h2>
<ol class="timeline">${timeline.experience.map(
    (e) => html`<li class="timeline-item">
<h3><span class="timeline-org">${e.org}</span> <span class="timeline-period">${e.period}</span></h3>
${e.roles.map(
  (r) =>
    html`<div class="timeline-role"><p class="timeline-role-title">${r.title} <span class="timeline-period">${r.period}</span></p><p>${r.summary}</p></div>`,
)}
</li>`,
  )}</ol>
<h3 class="subheading">Education</h3>
<ul class="education">${timeline.education.map(
    (e) =>
      html`<li><p><strong>${e.degree}</strong>, ${e.school} <span class="timeline-period">${e.period}</span></p>${e.note && html`<p class="muted">${e.note}</p>`}</li>`,
  )}</ul>
</section>
</main>
${footer(site)}`;
  return layout({
    title: `${profile.name} — ${profile.title}`,
    description: profile.tagline,
    body,
    root: "",
  });
}

export function workPage(site: Site, work: Work): string {
  const index = site.work.indexOf(work);
  const next = site.work[(index + 1) % site.work.length];
  const body = html`${siteHeader(site, WORK_ROOT)}
<main id="main" class="page case">
<p class="back"><a href="${WORK_ROOT}#work-title">← All work</a></p>
<header class="case-header">
<p class="eyebrow">${work.client} · ${work.period}</p>
<h1>${work.title}</h1>
<p class="tagline">${work.summary}</p>
<p class="muted">${work.role}</p>
${stack(work.stack)}
</header>
${work.cover && html`<figure class="case-cover">${picture(work.cover, WORK_ROOT, true)}${work.cover.caption && html`<figcaption>${work.cover.caption}</figcaption>`}</figure>`}
${impact(work)}
<div class="prose">${raw(work.html)}</div>
${gallery(work)}
${work.links.length > 0 && html`<ul class="case-links">${work.links.map((l) => html`<li>${linkTo(l.url, l.label)}</li>`)}</ul>`}
${next && next !== work && html`<nav class="next" aria-label="Next case study"><p class="eyebrow">Next</p><a href="${WORK_ROOT}${workPath(next.slug)}">${next.title}</a></nav>`}
</main>
${footer(site)}`;
  return layout({
    title: `${work.title} — ${site.profile.name}`,
    description: work.summary,
    body,
    root: WORK_ROOT,
  });
}

export function notFoundPage(site: Site): string {
  // Served at any depth by the host, so links are absolute (the site lives at the domain root).
  const body = html`${siteHeader(site, "/")}
<main id="main" class="page"><h1>Page not found</h1><p><a href="/">Back to the home page</a></p></main>`;
  return layout({
    title: `Not found — ${site.profile.name}`,
    description: "Page not found",
    body,
    root: "/",
  });
}

/** Every page of the site, keyed by its output path. */
export function renderPages(site: Site): Map<string, string> {
  const pages = new Map<string, string>([
    ["index.html", homePage(site)],
    ["404.html", notFoundPage(site)],
  ]);
  for (const work of site.work) pages.set(`${workPath(work.slug)}index.html`, workPage(site, work));
  return pages;
}
