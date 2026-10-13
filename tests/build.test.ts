import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../src/build/build.ts";
import { makeConfig } from "../src/config.ts";

// Guardrails on a real build of the site's own content.
// CSS raised from 12 KB for the résumé and print styles (v1.y), kept in one file on purpose.
const BUDGETS = { css: 14 * 1024, html: 40 * 1024 };

let out: string;
let pages: string[];
/** Numeric HTML entities decoded, so obfuscated text (the résumé email) is checked like plain text. */
const decode = (text: string) =>
  text.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
const read = async (file: string) => decode(await Bun.file(join(out, file)).text());

beforeAll(async () => {
  out = await mkdtemp(join(tmpdir(), "toyn-build-"));
  const result = await build(makeConfig({ root: join(import.meta.dir, "..") }), out);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  pages = result.files.filter((f) => f.endsWith(".html"));
});

afterAll(() => rm(out, { recursive: true, force: true }));

test("home, 404, résumé and one page per case study are built", () => {
  expect(pages).toContain("index.html");
  expect(pages).toContain("404.html");
  expect(pages).toContain("resume/index.html");
  expect(pages.filter((p) => p.startsWith("work/")).length).toBeGreaterThan(0);
});

test("stylesheet and pages stay within budget", async () => {
  expect(Bun.file(join(out, "styles/main.css")).size).toBeLessThanOrEqual(BUDGETS.css);
  for (const page of pages)
    expect(Bun.file(join(out, page)).size).toBeLessThanOrEqual(BUDGETS.html);
});

test("no page ships JavaScript beyond the trailing-slash fix and the résumé's print button", async () => {
  for (const page of pages) {
    const html = await read(page);
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html.match(/<script>/g)?.length ?? 0).toBeLessThanOrEqual(1);
    const handlers = [...html.matchAll(/\son[a-z]+="[^"]*"/g)].map((m) => m[0].trim());
    expect(handlers).toEqual(page === "resume/index.html" ? ['onclick="print()"'] : []);
  }
});

test("the print button is progressively enhanced: hidden without JavaScript, hint in <noscript>", async () => {
  const resume = await read("resume/index.html");
  expect(resume).toMatch(
    /<button class="[^"]*\bresume-print\b[^"]*" type="button" onclick="print\(\)">/,
  );
  expect(resume).toMatch(/<noscript><p class="resume-hint[^"]*">[^<]+<\/p><\/noscript>/);
  const css = await Bun.file(join(out, "styles/main.css")).text();
  expect(css).toMatch(/@media \(scripting:\s*none\)\s*\{\s*\.resume-print\s*\{\s*display:\s*none/);
});

test("every page has one h1, a lang, a title and a skip link to #main", async () => {
  for (const page of pages) {
    const html = await read(page);
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(html).toContain('<html lang="en">');
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toContain('href="#main"');
    expect(html).toContain('id="main"');
  }
});

test("headings never skip a level", async () => {
  for (const page of pages) {
    const levels = [...(await read(page)).matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    levels.forEach((level, i) => {
      if (i > 0) expect(level - (levels[i - 1] ?? 1)).toBeLessThanOrEqual(1);
    });
  }
});

test("every image has alt text", async () => {
  for (const page of pages) {
    for (const img of (await read(page)).match(/<img[^>]*>/g) ?? []) {
      expect(img).toMatch(/alt="[^"]+"/);
    }
  }
});

test("internal links point to built pages", async () => {
  for (const page of pages) {
    const dir = page.slice(0, page.lastIndexOf("/") + 1);
    for (const [, href] of (await read(page)).matchAll(/href="([^"#:]+)(?:#[^"]*)?"/g)) {
      if (!href || href.startsWith("/") || href.startsWith("http")) continue;
      const target = new URL(href, `file:///${dir}`).pathname.slice(1);
      const file = target.endsWith("/") || target === "" ? `${target}index.html` : target;
      expect(await Bun.file(join(out, file)).exists()).toBe(true);
    }
  }
});

test("no private data or unresolved notes reach the output", async () => {
  for (const page of [...pages, "llms.txt", "system.md"]) {
    const html = await read(page);
    expect(html).not.toMatch(/0?6[ .]?62[ .]?70/); // phone number
    expect(html).not.toMatch(/1984/); // date of birth
    expect(html).not.toMatch(/@duvauchelle\.co/); // personal address
    expect(html).not.toContain("TODO");
  }
});

test("the email is only on the résumé, and obfuscated there", async () => {
  for (const page of [...pages, "llms.txt", "system.md"]) {
    if (page === "resume/index.html") continue;
    expect(await read(page)).not.toMatch(/mailto:|@toyn\.dev/);
  }
  const resume = await read("resume/index.html");
  expect(resume).toContain('href="mailto:a@toyn.dev"');
  const source = await Bun.file(join(out, "resume/index.html")).text();
  expect(source).not.toMatch(/mailto:|@toyn\.dev/);
});

test("the résumé links every case study and prints without dark colours", async () => {
  const resume = await read("resume/index.html");
  for (const page of pages.filter((p) => p.startsWith("work/"))) {
    expect(resume).toContain(`https://www.toyn.dev/${page.replace(/index\.html$/, "")}`);
  }
  const css = await Bun.file(join(out, "styles/main.css")).text();
  // Dark tokens are screen-only. (Bun adds its own unrelated `prefers-color-scheme` helper on `html`.)
  expect(css).not.toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root/);
  expect(css).toMatch(/@page\s*\{[^}]*size:\s*A4/);
});

test("_redirects reaches the output, so the bare domain keeps redirecting to www", async () => {
  expect(await read("_redirects")).toContain("//toyn.dev/* https://www.toyn.dev/:splat 302!");
});

test("every page has the main nav, marking the current page", async () => {
  const current: Record<string, string | undefined> = {
    "index.html": "Home",
    "resume/index.html": "Résumé",
    "system/index.html": "Design system",
  };
  for (const page of pages) {
    const html = await read(page);
    expect(html).toContain('<nav class="site-nav" aria-label="Main">');
    const marked = [...html.matchAll(/aria-current="page">([^<]+)</g)].map((m) => m[1]);
    expect(marked).toEqual(current[page] ? [current[page]] : []);
  }
});
