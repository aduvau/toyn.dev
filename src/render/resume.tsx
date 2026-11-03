import type { Site, Work } from "../content/load.ts";
import type { Timeline } from "../content/schemas.ts";
import { SiteFooter, SiteHeader } from "./components.tsx";
import { raw, type SafeHtml } from "./html.ts";
import { Layout } from "./layout.tsx";
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
function PrintableLink({ url }: { url: string }): SafeHtml {
  return <a href={url}>{shortUrl(url)}</a>;
}

function Contact({ site }: { site: Site }): SafeHtml {
  const { profile } = site;
  return (
    <ul class="resume-contact" aria-label="Contact">
      <li>
        <a href={entities(`mailto:${profile.email}`)}>{entities(profile.email)}</a>
      </li>
      <li>
        <PrintableLink url={SITE_URL} />
      </li>
      {profile.links.map((l) => (
        <li>
          <PrintableLink url={l.url} />
        </li>
      ))}
    </ul>
  );
}

function Role({
  site,
  role,
}: {
  site: Site;
  role: Timeline["experience"][number]["roles"][number];
}): SafeHtml {
  const work = role.work ? site.work.find((w) => w.slug === role.work) : undefined;
  return (
    <div class="resume-role">
      <p class="resume-role-title">
        {role.title} <span class="resume-period">{role.period}</span>
      </p>
      <p>{role.summary}</p>
      {work && (
        <p class="resume-more">
          Case study: <PrintableLink url={`${SITE_URL}${workPath(work.slug)}`} />
        </p>
      )}
    </div>
  );
}

function Project({ work }: { work: Work }): SafeHtml {
  return (
    <li class="resume-entry">
      <h3>
        <span>{work.title}</span> <span class="resume-period">{work.period}</span>
      </h3>
      <p>{work.summary}</p>
      {work.impact.length > 0 && (
        <p class="resume-impact">{work.impact.map((i) => `${i.value} ${i.label}`).join(" · ")}</p>
      )}
      <p class="resume-more">
        {work.stack.join(", ")}. Case study:{" "}
        <PrintableLink url={`${SITE_URL}${workPath(work.slug)}`} />
      </p>
    </li>
  );
}

export function ResumePage({ site }: { site: Site }): SafeHtml {
  const { profile, timeline } = site;
  // Case studies not tied to a role (side projects) get their own section.
  const linked = new Set(timeline.experience.flatMap((e) => e.roles.map((r) => r.work)));
  const projects = site.work.filter((w) => !linked.has(w.slug));
  return (
    <Layout
      title={`CV — ${profile.name}, ${profile.title}`}
      description={`CV of ${profile.name}, ${profile.title} in ${profile.location}. ${profile.tagline}`}
      root={RESUME_ROOT}
    >
      <SiteHeader site={site} root={RESUME_ROOT} current="resume" />
      <main id="main" class="page resume">
        <header class="resume-header">
          <h1>
            <span class="hero-name">{profile.name}</span>{" "}
            <span class="hero-role">
              {profile.title} · {profile.location}
            </span>
          </h1>
          <Contact site={site} />
          <button class="button resume-print" type="button" onclick="print()">
            Save as PDF
          </button>
          <noscript>
            <p class="resume-hint muted">To get a PDF, print this page and choose “Save as PDF”.</p>
          </noscript>
        </header>

        <section class="resume-section" aria-labelledby="summary-title">
          <h2 id="summary-title">Summary</h2>
          <p>
            {profile.tagline} {profile.intro[0]}
          </p>
        </section>

        <section class="resume-section" aria-labelledby="experience-title">
          <h2 id="experience-title">Experience</h2>
          <ol>
            {timeline.experience.map((e) => (
              <li class="resume-entry">
                <h3>
                  <span>{e.org}</span> <span class="resume-period">{e.period}</span>
                </h3>
                {e.roles.map((r) => (
                  <Role site={site} role={r} />
                ))}
              </li>
            ))}
          </ol>
        </section>

        {projects.length > 0 && (
          <section class="resume-section" aria-labelledby="projects-title">
            <h2 id="projects-title">Projects</h2>
            <ul>
              {projects.map((w) => (
                <Project work={w} />
              ))}
            </ul>
          </section>
        )}

        <section class="resume-section" aria-labelledby="skills-title">
          <h2 id="skills-title">Skills</h2>
          <dl class="resume-list">
            {profile.skills.map((s) => (
              <div>
                <dt>{s.group}</dt>
                <dd>{s.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section class="resume-section" aria-labelledby="languages-title">
          <h2 id="languages-title">Languages</h2>
          <p>{profile.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</p>
        </section>

        <section class="resume-section" aria-labelledby="education-title">
          <h2 id="education-title">Education</h2>
          <ul>
            {timeline.education.map((e) => (
              <li class="resume-entry">
                <p>
                  <strong>{e.degree}</strong>, {e.school}{" "}
                  <span class="resume-period">{e.period}</span>
                </p>
                {e.note && <p class="muted">{e.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter site={site} />
    </Layout>
  );
}
