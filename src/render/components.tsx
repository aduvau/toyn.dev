import type { Image, Post, Site, Work } from "../content/load.ts";
import type { Profile } from "../content/schemas.ts";
import { type Contract, contractId } from "../system/schema.ts";
import type { Child, SafeHtml } from "./html.ts";
import { Inline, SelectorsRow, SpecList } from "./spec.tsx";
import { postPath, RESUME_PATH, SYSTEM_PATH, WRITING_PATH, workPath } from "./urls.ts";

// The site's components. Each one has a contract in `src/system/contracts.tsx`; `root` is the prefix
// from the current page back to the site root (`""`, `"../"`, `"../../"`).

const external = (url: string) => /^https?:\/\//.test(url);

export function LinkTo({ url, children }: { url: string; children: Child }): SafeHtml {
  return external(url) ? (
    <a href={url} rel="noopener">
      {children}
      <span class="visually-hidden"> (external)</span>
    </a>
  ) : (
    <a href={url}>{children}</a>
  );
}

export function Button({ href, children }: { href: string; children: Child }): SafeHtml {
  return (
    <a class="button" href={href}>
      {children}
    </a>
  );
}

/** `part` labels it for the card's construction lines (see `WorkCard`). */
export function Eyebrow({ part, children }: { part?: string; children: Child }): SafeHtml {
  return (
    <p class="eyebrow" data-part={part}>
      {children}
    </p>
  );
}

export function Impact({ work, part }: { work: Work; part?: string }): SafeHtml {
  return (
    <>
      {work.impact.length > 0 && (
        <dl class="impact" aria-label="Impact" data-part={part}>
          {work.impact.map((i) => (
            <div class="impact-item">
              <dt>{i.label}</dt>
              <dd>{i.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}

/** A screenshot, with its dark-mode variant when there is one. Sized to avoid layout shifts. */
export function Picture({
  img,
  root,
  eager = false,
}: {
  img: Image;
  root: string;
  eager?: boolean;
}): SafeHtml {
  return (
    <picture>
      {img.srcDark && (
        <source srcset={`${root}public/${img.srcDark}`} media="(prefers-color-scheme: dark)" />
      )}
      <img
        src={`${root}public/${img.src}`}
        alt={img.alt}
        width={img.width}
        height={img.height}
        loading={eager ? undefined : "lazy"}
        decoding="async"
      />
    </picture>
  );
}

export function Shot({ img, root }: { img: Image; root: string }): SafeHtml {
  return (
    <figure class="shot">
      <Picture img={img} root={root} />
      {img.caption && <figcaption>{img.caption}</figcaption>}
    </figure>
  );
}

export function Gallery({ work, root }: { work: Work; root: string }): SafeHtml {
  return (
    <>
      {work.gallery.length > 0 && (
        <section class="gallery" aria-label="Screenshots">
          {work.gallery.map((img) => (
            <Shot img={img} root={root} />
          ))}
        </section>
      )}
    </>
  );
}

export function Tags({ items }: { items: string[] }): SafeHtml {
  return (
    <>
      {items.length > 0 && (
        <ul class="tags" aria-label="Stack">
          {items.map((s) => (
            <li class="tag">{s}</li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * A case study teaser. It ends with a "View contract" toggle that prints the card's own `contract`;
 * when open, CSS draws construction lines on every `data-part` (each labelled with its class).
 */
export function WorkCard({
  work,
  root,
  contract,
  open = false,
}: {
  work: Work;
  root: string;
  contract: Contract;
  open?: boolean;
}): SafeHtml {
  return (
    <li class="card">
      <article>
        {work.cardCover && (
          <div
            class={`card-cover ${work.cardCover.height > work.cardCover.width ? "is-portrait" : "is-wide"}`}
            data-part=".card-cover"
          >
            <Picture img={work.cardCover} root={root} />
          </div>
        )}
        <Eyebrow part=".eyebrow">
          {work.client} · {work.period}
        </Eyebrow>
        <h3 class="card-title" data-part=".card-title">
          <a class="card-link" href={`${root}${workPath(work.slug)}`}>
            {work.title}
          </a>
        </h3>
        <p class="card-summary" data-part=".card-summary">
          {work.summary}
        </p>
        <Impact work={work} part=".impact" />
      </article>
      <ContractToggle contract={contract} root={root} open={open} />
    </li>
  );
}

/** The card's "View contract" disclosure: a `<details>`, so it works without JavaScript. */
function ContractToggle({
  contract,
  root,
  open,
}: {
  contract: Contract;
  root: string;
  open: boolean;
}): SafeHtml {
  const contrast = contract.contrast.map((c) => `\`${c.fg}\` on \`${c.bg}\` ≥ ${c.min}: ${c.use}`);
  return (
    <details class="card-contract" open={open}>
      <summary>
        <span aria-hidden="true">{"{ }"}</span> View contract
      </summary>
      <div class="card-contract-panel">
        <p>
          <Inline text={contract.purpose} />
        </p>
        <dl>
          <SelectorsRow contract={contract} />
          <SpecList label="Accessibility" items={contract.a11y} />
          <SpecList label="Contrast" items={contrast} />
          <SpecList label="Don't" items={contract.dont} />
        </dl>
        <p class="muted">
          From <code>src/system/contracts.tsx</code> · checked by <code>tests/system.test.ts</code>{" "}
          · <a href={`${root}${SYSTEM_PATH}#${contractId(contract)}`}>{contract.name} on /system</a>
        </p>
      </div>
    </details>
  );
}

/** A post's date, e.g. "13 October 2026", machine-readable in `datetime`. */
export function PostDate({ post }: { post: Post }): SafeHtml {
  const label = new Date(`${post.date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return <time datetime={post.date}>{label}</time>;
}

/** The list of posts on `/writing`, newest first. */
export function PostList({ posts, root }: { posts: Post[]; root: string }): SafeHtml {
  return (
    <ol>
      {posts.map((p) => (
        <li class="post-item">
          <p class="eyebrow">
            <PostDate post={p} />
          </p>
          <h2>
            <a href={`${root}${postPath(p.slug)}`}>{p.title}</a>
          </h2>
          <p>{p.summary}</p>
        </li>
      ))}
    </ol>
  );
}

export function Practice({ practice }: { practice: Profile["practices"][number] }): SafeHtml {
  return (
    <li class="practice">
      <h3>{practice.title}</h3>
      <p>{practice.body}</p>
    </li>
  );
}

/** A flat banner that sends the visitor to the résumé, at the end of the home page. */
export function ResumeBanner({ root }: { root: string }): SafeHtml {
  return (
    <section class="cta-banner" aria-labelledby="resume-banner-title">
      <div>
        <h2 id="resume-banner-title">Want the full picture?</h2>
        <p>Every role, project and skill on one page, ready to print.</p>
      </div>
      <Button href={root + RESUME_PATH}>Read my CV</Button>
    </section>
  );
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
export function SiteHeader({
  site,
  root,
  current,
}: {
  site: Site;
  root: string;
  current?: (typeof NAV)[number]["key"];
}): SafeHtml {
  const items = NAV.filter((item) => item.key !== "writing" || site.posts.length > 0);
  return (
    <header class="site-header">
      <nav class="site-nav" aria-label="Main">
        <ul>
          {items.map((item) => (
            <li>
              <a
                href={root + item.path || "./"}
                aria-current={item.key === current ? "page" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <ThemeToggle />
    </header>
  );
}

/**
 * Switches between the light and dark themes (ADR-0005). The state is `aria-pressed`, set by the
 * head script from the theme shown; the half-filled disc turns over when dark is on.
 */
export function ThemeToggle(): SafeHtml {
  return (
    <button class="theme-toggle" type="button" aria-pressed="false">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
      </svg>
      <span class="visually-hidden">Dark theme</span>
    </button>
  );
}

/**
 * Brand logos for the profile links, keyed by label. Paths from Simple Icons 9.21.0 (CC0), drawn
 * in `currentColor` on a 24×24 box.
 */
const SOCIAL_ICONS: Record<string, string> = {
  LinkedIn:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  GitHub:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
};

/**
 * The profile links as round logo buttons, in the hero and every footer. Named by their label
 * (visually hidden), since the logo is `aria-hidden`.
 */
export function SocialLinks({ site }: { site: Site }): SafeHtml {
  return (
    <ul class="social-links" aria-label="Elsewhere">
      {site.profile.links.map((l) => {
        const icon = SOCIAL_ICONS[l.label];
        if (!icon)
          throw new Error(`No logo for profile link "${l.label}" (add one to SOCIAL_ICONS)`);
        return (
          <li>
            <a class="social-link" href={l.url} rel="noopener">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d={icon} />
              </svg>
              <span class="visually-hidden">{l.label} (external)</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** Every page's footer: copyright on the left, the profile links on the right. */
export function SiteFooter({ site }: { site: Site }): SafeHtml {
  return (
    <footer class="site-footer">
      <p class="copyright">
        © {new Date().getFullYear()} {site.profile.name}
      </p>
      <SocialLinks site={site} />
    </footer>
  );
}
