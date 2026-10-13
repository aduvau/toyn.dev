import type { Site, Work } from "../content/load.ts";
import {
  button,
  eyebrow,
  gallery,
  impact,
  linkTo,
  picture,
  practice,
  siteFooter,
  siteHeader,
  tags,
  timelineItem,
  workCard,
} from "./components.ts";
import { html, raw } from "./html.ts";
import { layout } from "./layout.ts";
import { llmsTxt, systemMarkdown } from "./llms.ts";
import { resumePage } from "./resume.ts";
import { systemPage } from "./system.ts";
import { RESUME_PATH, SYSTEM_PATH, WORK_ROOT, workPath } from "./urls.ts";

export function homePage(site: Site): string {
  const { profile, timeline } = site;
  const body = html`<main id="main" class="page">
<section class="hero" aria-labelledby="hero-title">
<h1 id="hero-title"><span class="hero-name">${profile.name}</span> <span class="hero-role">${profile.title} · ${profile.location}</span></h1>
<p class="tagline">${profile.tagline}</p>
${profile.intro.map((p) => html`<p class="intro">${p}</p>`)}
<p>${button("#contact", "Get in touch")}</p>
</section>

<section class="section" aria-labelledby="work-title">
<h2 id="work-title">Selected work</h2>
<ul class="cards">${site.work.map((w) => workCard(w, ""))}</ul>
</section>

<section class="section" aria-labelledby="practices-title">
<h2 id="practices-title">How I work</h2>
<ul class="practices">${profile.practices.map(practice)}</ul>
</section>

<section class="section" aria-labelledby="experience-title">
<h2 id="experience-title">Experience</h2>
<ol class="timeline">${timeline.experience.map(timelineItem)}</ol>
<h3 class="subheading">Education</h3>
<ul class="education">${timeline.education.map(
    (e) =>
      html`<li><p><strong>${e.degree}</strong>, ${e.school} <span class="timeline-period">${e.period}</span></p>${e.note && html`<p class="muted">${e.note}</p>`}</li>`,
  )}</ul>
</section>
</main>
${siteFooter(site, "")}`;
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
${eyebrow(`${work.client} · ${work.period}`)}
<h1>${work.title}</h1>
<p class="tagline">${work.summary}</p>
<p class="muted">${work.role}</p>
${tags(work.stack)}
</header>
${work.cover && html`<figure class="case-cover">${picture(work.cover, WORK_ROOT, true)}${work.cover.caption && html`<figcaption>${work.cover.caption}</figcaption>`}</figure>`}
${impact(work)}
<div class="prose">${raw(work.html)}</div>
${gallery(work, WORK_ROOT)}
${work.links.length > 0 && html`<ul class="case-links">${work.links.map((l) => html`<li>${linkTo(l.url, l.label)}</li>`)}</ul>`}
${next && next !== work && html`<nav class="next" aria-label="Next case study">${eyebrow("Next")}<a href="${WORK_ROOT}${workPath(next.slug)}">${next.title}</a></nav>`}
</main>
${siteFooter(site, WORK_ROOT)}`;
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

/** Every file the site generates (pages, `llms.txt`, `system.md`), keyed by its output path. */
export function renderPages(site: Site): Map<string, string> {
  const pages = new Map<string, string>([
    ["index.html", homePage(site)],
    ["404.html", notFoundPage(site)],
    [`${SYSTEM_PATH}index.html`, systemPage(site)],
    [`${RESUME_PATH}index.html`, resumePage(site)],
    ["llms.txt", llmsTxt(site)],
    ["system.md", systemMarkdown(site)],
  ]);
  for (const work of site.work) pages.set(`${workPath(work.slug)}index.html`, workPage(site, work));
  return pages;
}
