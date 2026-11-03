import type { Post, Site, Work } from "../content/load.ts";
import { cardContract } from "../system/contracts.tsx";
import {
  Eyebrow,
  Gallery,
  Impact,
  LinkTo,
  Picture,
  PostDate,
  PostList,
  Practice,
  ResumeBanner,
  SiteFooter,
  SiteHeader,
  SocialLinks,
  Tags,
  WorkCard,
} from "./components.tsx";
import { raw, type SafeHtml } from "./html.ts";
import { Layout, toDocument } from "./layout.tsx";
import { llmsTxt, systemMarkdown } from "./llms.ts";
import { ResumePage } from "./resume.tsx";
import { SystemPage } from "./system.tsx";
import {
  POST_ROOT,
  postPath,
  RESUME_PATH,
  SYSTEM_PATH,
  WORK_ROOT,
  WRITING_PATH,
  WRITING_ROOT,
  workPath,
} from "./urls.ts";

export function HomePage({ site }: { site: Site }): SafeHtml {
  const { profile } = site;
  return (
    <Layout title={`${profile.name} — ${profile.title}`} description={profile.tagline} root="">
      <SiteHeader site={site} root="" current="home" />
      <main id="main" class="page">
        <section class="hero" aria-labelledby="hero-title">
          <h1 id="hero-title">
            <span class="hero-name">{profile.name}</span>{" "}
            <span class="hero-role">
              {profile.title} · {profile.location}
            </span>
          </h1>
          <p class="tagline">{profile.tagline}</p>
          {profile.intro.map((p) => (
            <p class="intro">{p}</p>
          ))}
          <SocialLinks site={site} />
        </section>

        <section class="section" aria-labelledby="work-title">
          <h2 id="work-title">Selected work</h2>
          <ul class="cards">
            {site.work.map((w) => (
              <WorkCard work={w} root="" contract={cardContract()} />
            ))}
          </ul>
        </section>

        <section class="section" aria-labelledby="practices-title">
          <h2 id="practices-title">How I work</h2>
          <ul class="practices">
            {profile.practices.map((p) => (
              <Practice practice={p} />
            ))}
          </ul>
        </section>

        <ResumeBanner root="" />
      </main>
      <SiteFooter site={site} />
    </Layout>
  );
}

export function WorkPage({ site, work }: { site: Site; work: Work }): SafeHtml {
  const index = site.work.indexOf(work);
  const next = site.work[(index + 1) % site.work.length];
  return (
    <Layout
      title={`${work.title} — ${site.profile.name}`}
      description={work.summary}
      root={WORK_ROOT}
    >
      <SiteHeader site={site} root={WORK_ROOT} />
      <main id="main" class="page case">
        <p class="back">
          <a href={`${WORK_ROOT}#work-title`}>← All work</a>
        </p>
        <header class="case-header">
          <Eyebrow>
            {work.client} · {work.period}
          </Eyebrow>
          <h1>{work.title}</h1>
          <p class="tagline">{work.summary}</p>
          <p class="muted">{work.role}</p>
          <Tags items={work.stack} />
        </header>
        {work.cover && (
          <figure class="case-cover">
            <Picture img={work.cover} root={WORK_ROOT} eager />
            {work.cover.caption && <figcaption>{work.cover.caption}</figcaption>}
          </figure>
        )}
        <Impact work={work} />
        <div class="prose">{raw(work.html)}</div>
        <Gallery work={work} root={WORK_ROOT} />
        {work.links.length > 0 && (
          <ul class="case-links">
            {work.links.map((l) => (
              <li>
                <LinkTo url={l.url}>{l.label}</LinkTo>
              </li>
            ))}
          </ul>
        )}
        {next && next !== work && (
          <nav class="next" aria-label="Next case study">
            <Eyebrow>Next</Eyebrow>
            <a href={`${WORK_ROOT}${workPath(next.slug)}`}>{next.title}</a>
          </nav>
        )}
      </main>
      <SiteFooter site={site} />
    </Layout>
  );
}

export function WritingPage({ site }: { site: Site }): SafeHtml {
  return (
    <Layout
      title={`Writing — ${site.profile.name}`}
      description={`Articles by ${site.profile.name}.`}
      root={WRITING_ROOT}
    >
      <SiteHeader site={site} root={WRITING_ROOT} current="writing" />
      <main id="main" class="page">
        <header class="case-header">
          <Eyebrow>Writing</Eyebrow>
          <h1>Notes on how I build</h1>
        </header>
        <PostList posts={site.posts} root={WRITING_ROOT} />
      </main>
      <SiteFooter site={site} />
    </Layout>
  );
}

export function PostPage({ site, post }: { site: Site; post: Post }): SafeHtml {
  return (
    <Layout
      title={`${post.title} — ${site.profile.name}`}
      description={post.summary}
      root={POST_ROOT}
    >
      <SiteHeader site={site} root={POST_ROOT} />
      <main id="main" class="page">
        <p class="back">
          <a href={`${POST_ROOT}${WRITING_PATH}`}>← All writing</a>
        </p>
        <article>
          <header class="case-header">
            <p class="eyebrow">
              <PostDate post={post} /> · {site.profile.name}
            </p>
            <h1>{post.title}</h1>
            <p class="tagline">{post.summary}</p>
          </header>
          <div class="prose">{raw(post.html)}</div>
        </article>
      </main>
      <SiteFooter site={site} />
    </Layout>
  );
}

export function NotFoundPage({ site }: { site: Site }): SafeHtml {
  // Served at any depth by the host, so links are absolute (the site lives at the domain root).
  return (
    <Layout title={`Not found — ${site.profile.name}`} description="Page not found" root="/">
      <SiteHeader site={site} root="/" />
      <main id="main" class="page">
        <h1>Page not found</h1>
        <p>
          <a href="/">Back to the home page</a>
        </p>
      </main>
      <SiteFooter site={site} />
    </Layout>
  );
}

/** Every file the site generates (pages, `llms.txt`, `system.md`), keyed by its output path. */
export function renderPages(site: Site): Map<string, string> {
  const pages = new Map<string, string>([
    ["index.html", toDocument(<HomePage site={site} />)],
    ["404.html", toDocument(<NotFoundPage site={site} />)],
    [`${SYSTEM_PATH}index.html`, toDocument(<SystemPage site={site} />)],
    [`${RESUME_PATH}index.html`, toDocument(<ResumePage site={site} />)],
    ["llms.txt", llmsTxt(site)],
    ["system.md", systemMarkdown(site)],
  ]);
  for (const work of site.work)
    pages.set(`${workPath(work.slug)}index.html`, toDocument(<WorkPage site={site} work={work} />));
  if (site.posts.length > 0)
    pages.set(`${WRITING_PATH}index.html`, toDocument(<WritingPage site={site} />));
  for (const post of site.posts)
    pages.set(`${postPath(post.slug)}index.html`, toDocument(<PostPage site={site} post={post} />));
  return pages;
}
