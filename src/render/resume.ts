import type { Site, Work } from "../content/load.ts";
import type { Timeline } from "../content/schemas.ts";
import { siteFooter, siteHeader } from "./components.ts";
import { html, raw, type SafeHtml } from "./html.ts";
import { layout } from "./layout.ts";
import { RESUME_ROOT, SITE_URL, workPath } from "./urls.ts";

// `/resume`: the timeline, case studies and profile as a printable résumé (Print → Save as PDF).

/** A URL as it reads on paper: no protocol, no `www.`, no trailing slash. */
export const shortUrl = (url: string) =>
  url.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "");

/**
 * Every character as an HTML entity. Browsers and screen readers read it as plain text; naive
 * scrapers looking for `mailto:` or `@` in the source don't. Weak on purpose: no JavaScript.
 */
const entities = (text: string) => raw([...text].map((c) => `&#${c.codePointAt(0)};`).join(""));

/** A link whose visible text is the URL itself, so it survives printing. */
const printableLink = (url: string) => html`<a href="${url}">${shortUrl(url)}</a>`;

function contact(site: Site): SafeHtml {
  const { profile } = site;
  const email = html`<a href="${entities(`mailto:${profile.email}`)}">${entities(profile.email)}</a>`;
  return html`<ul class="resume-contact" aria-label="Contact">
<li>${email}</li>
<li>${printableLink(SITE_URL)}</li>
${profile.links.map((l) => html`<li>${printableLink(l.url)}</li>`)}
</ul>`;
}

function role(site: Site, r: Timeline["experience"][number]["roles"][number]): SafeHtml {
  const work = r.work ? site.work.find((w) => w.slug === r.work) : undefined;
  return html`<div class="resume-role">
<p class="resume-role-title">${r.title} <span class="resume-period">${r.period}</span></p>
<p>${r.summary}</p>
${work && html`<p class="resume-more">Case study: ${printableLink(`${SITE_URL}${workPath(work.slug)}`)}</p>`}
</div>`;
}

function project(w: Work): SafeHtml {
  return html`<li class="resume-entry">
<h3><span>${w.title}</span> <span class="resume-period">${w.period}</span></h3>
<p>${w.summary}</p>
${w.impact.length > 0 && html`<p class="resume-impact">${w.impact.map((i) => `${i.value} ${i.label}`).join(" · ")}</p>`}
<p class="resume-more">${w.stack.join(", ")}. Case study: ${printableLink(`${SITE_URL}${workPath(w.slug)}`)}</p>
</li>`;
}

export function resumePage(site: Site): string {
  const { profile, timeline } = site;
  // Case studies not tied to a role (side projects) get their own section.
  const linked = new Set(timeline.experience.flatMap((e) => e.roles.map((r) => r.work)));
  const projects = site.work.filter((w) => !linked.has(w.slug));
  const body = html`${siteHeader(site, RESUME_ROOT, "resume")}
<main id="main" class="page resume">
<header class="resume-header">
<h1><span class="hero-name">${profile.name}</span> <span class="hero-role">${profile.title} · ${profile.location}</span></h1>
${contact(site)}
<button class="button resume-print" type="button" onclick="print()">Save as PDF</button>
<noscript><p class="resume-hint muted">To get a PDF, print this page and choose “Save as PDF”.</p></noscript>
</header>

<section class="resume-section" aria-labelledby="summary-title">
<h2 id="summary-title">Summary</h2>
<p>${profile.tagline} ${profile.intro[0]}</p>
</section>

<section class="resume-section" aria-labelledby="experience-title">
<h2 id="experience-title">Experience</h2>
<ol>${timeline.experience.map(
    (e) =>
      html`<li class="resume-entry"><h3><span>${e.org}</span> <span class="resume-period">${e.period}</span></h3>${e.roles.map((r) => role(site, r))}</li>`,
  )}</ol>
</section>

${
  projects.length > 0 &&
  html`<section class="resume-section" aria-labelledby="projects-title">
<h2 id="projects-title">Projects</h2>
<ul>${projects.map(project)}</ul>
</section>`
}

<section class="resume-section" aria-labelledby="skills-title">
<h2 id="skills-title">Skills</h2>
<dl class="resume-list">${profile.skills.map(
    (s) => html`<div><dt>${s.group}</dt><dd>${s.items.join(", ")}</dd></div>`,
  )}</dl>
</section>

<section class="resume-section" aria-labelledby="languages-title">
<h2 id="languages-title">Languages</h2>
<p>${profile.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</p>
</section>

<section class="resume-section" aria-labelledby="education-title">
<h2 id="education-title">Education</h2>
<ul>${timeline.education.map(
    (e) =>
      html`<li class="resume-entry"><p><strong>${e.degree}</strong>, ${e.school} <span class="resume-period">${e.period}</span></p>${e.note && html`<p class="muted">${e.note}</p>`}</li>`,
  )}</ul>
</section>
</main>
${siteFooter(site, RESUME_ROOT)}`;
  return layout({
    title: `Résumé — ${profile.name}, ${profile.title}`,
    description: `Résumé of ${profile.name}, ${profile.title} in ${profile.location}. ${profile.tagline}`,
    body,
    root: RESUME_ROOT,
  });
}
