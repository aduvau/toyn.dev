import { afterAll, beforeAll, expect, test } from "bun:test";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../src/build/build.ts";
import { makeConfig } from "../src/config.ts";
import { loadSite } from "../src/content/load.ts";

// The writing section, on a copy of the real content with posts added on purpose: the real posts
// may all still be drafts.

const ROOT = join(import.meta.dir, "..");
let dir: string;
let out: string;
let files: string[];
const read = (file: string) => Bun.file(join(out, file)).text();

const post = (front: string, body = "## A section\n\nText.\n\n```\nconst a = 1;\n```\n") =>
  `---\n${front}\n---\n${body}`;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "toyn-writing-"));
  await cp(join(ROOT, "content"), join(dir, "content"), { recursive: true });
  for (const sub of ["styles", "public"]) {
    await cp(join(ROOT, sub), join(dir, sub), { recursive: true });
  }
  const writing = join(dir, "content/writing");
  await writeFile(
    join(writing, "older.md"),
    post("title: Older post\nsummary: The first one.\ndate: 2026-01-05"),
  );
  await writeFile(
    join(writing, "newer.md"),
    post("title: Newer post\nsummary: The second one.\ndate: 2026-03-01"),
  );
  await writeFile(
    join(writing, "unfinished.md"),
    post("title: Unfinished\nsummary: Not yet.\ndate: 2026-04-01\ndraft: true"),
  );
  out = await mkdtemp(join(tmpdir(), "toyn-writing-out-"));
  const result = await build(makeConfig({ root: dir }), out);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  files = result.files;
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
  await rm(out, { recursive: true, force: true });
});

test("the real site doesn't build /writing or link it until a post is published", async () => {
  const real = await loadSite(makeConfig({ root: ROOT }));
  if (!real.ok) throw new Error(real.errors.join("\n"));
  if (real.site.posts.length > 0) return;
  const realOut = await mkdtemp(join(tmpdir(), "toyn-writing-real-"));
  try {
    const result = await build(makeConfig({ root: ROOT }), realOut);
    if (!result.ok) throw new Error(result.errors.join("\n"));
    expect(result.files.filter((f) => f.startsWith("writing/"))).toEqual([]);
    const home = await Bun.file(join(realOut, "index.html")).text();
    expect(home).not.toContain(">Writing</a>");
  } finally {
    await rm(realOut, { recursive: true, force: true });
  }
});

test("published posts get a page, drafts don't", () => {
  expect(files).toContain("writing/index.html");
  expect(files).toContain("writing/older/index.html");
  expect(files).toContain("writing/newer/index.html");
  expect(files.some((f) => f.startsWith("writing/unfinished/"))).toBe(false);
});

test("the index lists posts newest first, with machine-readable dates", async () => {
  const index = await read("writing/index.html");
  expect(index).toContain('aria-current="page">Writing<');
  const links = [...index.matchAll(/<h2><a href="([^"]+)"/g)].map((m) => m[1]);
  // Real posts, if published, sit around the fixtures; only their relative order is checked.
  expect(links.filter((l) => /\/(newer|older)\/$/.test(l ?? ""))).toEqual([
    "../writing/newer/",
    "../writing/older/",
  ]);
  expect(index).toContain('<time datetime="2026-03-01">1 March 2026</time>');
});

test("a post is an article with its date, a way back, and wrapping code blocks", async () => {
  const page = await read("writing/newer/index.html");
  expect(page).toMatch(/<main id="main"[^>]*>[\s\S]*<article>[\s\S]*<\/article>[\s\S]*<\/main>/);
  expect(page).toContain('<time datetime="2026-03-01">');
  expect(page).toContain('href="../../writing/">← All writing</a>');
  expect(page).toContain("<pre><code>const a = 1;");
  expect(page).toContain(">Writing</a>");
  const css = await read("styles/main.css");
  expect(css).toMatch(/\.prose pre\{[^}]*white-space:pre-wrap/);
});

test("llms.txt lists every published post and no draft", async () => {
  const txt = await read("llms.txt");
  expect(txt).toContain("## Writing");
  expect(txt).toContain("https://www.toyn.dev/writing/newer/");
  expect(txt).toContain("https://www.toyn.dev/writing/older/");
  expect(txt).not.toContain("Unfinished");
});

test("a post with an unknown front matter key or a bad date is refused", async () => {
  const writing = join(dir, "content/writing");
  await writeFile(
    join(writing, "bad.md"),
    post("title: T\nsummary: S\ndate: 2026-02-30\ntags: [x]"),
  );
  try {
    const result = await loadSite(makeConfig({ root: dir }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const errors = result.errors.join("\n");
      expect(errors).toContain("content/writing/bad.md: date");
      expect(errors).toContain("content/writing/bad.md");
      expect(errors).toMatch(/tags/);
    }
  } finally {
    await rm(join(writing, "bad.md"));
  }
});
