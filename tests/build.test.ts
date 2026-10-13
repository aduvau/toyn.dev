import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../src/build/build.ts";
import { makeConfig } from "../src/config.ts";

// Guardrails on a real build of the site's own content.
const BUDGETS = { css: 12 * 1024, html: 40 * 1024 };

let out: string;
let pages: string[];
const read = (file: string) => Bun.file(join(out, file)).text();

beforeAll(async () => {
  out = await mkdtemp(join(tmpdir(), "toyn-build-"));
  const result = await build(makeConfig({ root: join(import.meta.dir, "..") }), out);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  pages = result.files.filter((f) => f.endsWith(".html"));
});

afterAll(() => rm(out, { recursive: true, force: true }));

test("home, 404 and one page per case study are built", () => {
  expect(pages).toContain("index.html");
  expect(pages).toContain("404.html");
  expect(pages.filter((p) => p.startsWith("work/")).length).toBeGreaterThan(0);
});

test("stylesheet and pages stay within budget", async () => {
  expect(Bun.file(join(out, "styles/main.css")).size).toBeLessThanOrEqual(BUDGETS.css);
  for (const page of pages)
    expect(Bun.file(join(out, page)).size).toBeLessThanOrEqual(BUDGETS.html);
});

test("no page ships JavaScript beyond the inline trailing-slash fix", async () => {
  for (const page of pages) {
    const html = await read(page);
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html.match(/<script>/g)?.length ?? 0).toBeLessThanOrEqual(1);
  }
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
  for (const page of pages) {
    const html = await read(page);
    expect(html).not.toMatch(/0?6[ .]?62[ .]?70/); // phone number
    expect(html).not.toMatch(/1984/); // date of birth
    expect(html).not.toMatch(/mailto:|@duvauchelle\.co/); // no email: LinkedIn only
    expect(html).not.toContain("TODO");
  }
});
