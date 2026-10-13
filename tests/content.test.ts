import { afterEach, expect, test } from "bun:test";
import { cp, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeConfig } from "../src/config.ts";
import { loadSite } from "../src/content/load.ts";

const ROOT = join(import.meta.dir, "..");
let dir: string | undefined;

/** A copy of the real content, to break on purpose. */
async function copy(): Promise<string> {
  dir = await mkdtemp(join(tmpdir(), "toyn-content-"));
  await cp(join(ROOT, "content"), join(dir, "content"), { recursive: true });
  return dir;
}

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
});

test("the real content loads without errors", async () => {
  const result = await loadSite(makeConfig({ root: ROOT }));
  expect(result.ok ? [] : result.errors).toEqual([]);
});

test("a case study with an unknown front matter key is refused", async () => {
  const root = await copy();
  await writeFile(
    join(root, "content/work/bad.md"),
    "---\ntitle: T\nclient: C\nrole: R\nperiod: 2020\norder: 9\nsummary: S\ncolour: red\n---\nBody\n",
  );
  const result = await loadSite(makeConfig({ root }));
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors.join("\n")).toContain("content/work/bad.md");
});

test("an image without alt text is refused", async () => {
  const root = await copy();
  await writeFile(
    join(root, "content/work/noalt.md"),
    "---\ntitle: T\nclient: C\nrole: R\nperiod: 2020\norder: 9\nsummary: S\n---\n![](shot.png)\n",
  );
  const result = await loadSite(makeConfig({ root }));
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors.join("\n")).toContain("has no alt text");
});

test("drafts are left out, and TODO(antoine) notes become warnings", async () => {
  const root = await copy();
  await writeFile(
    join(root, "content/work/draft.md"),
    "---\ntitle: Draft\nclient: C\nrole: R\nperiod: 2020\norder: 9\nsummary: S\ndraft: true\n---\n<!-- TODO(antoine): later -->\n",
  );
  const result = await loadSite(makeConfig({ root }));
  expect(result.ok && result.site.work.some((w) => w.title === "Draft")).toBe(false);
  expect(result.warnings.some((w) => w.includes("draft.md: TODO(antoine): later"))).toBe(true);
});

test("a timeline role linking to an unknown case study is refused", async () => {
  const root = await copy();
  const file = join(root, "content/timeline.yaml");
  await writeFile(file, (await readFile(file, "utf8")).replace("work: holivia", "work: nope"));
  const result = await loadSite(makeConfig({ root }));
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors.join("\n")).toContain('unknown or draft work "nope"');
});

test("every résumé skill is already named elsewhere in the content, so none is made up", async () => {
  const result = await loadSite(makeConfig({ root: ROOT }));
  if (!result.ok) throw new Error(result.errors.join("\n"));
  const { skills, ...profile } = result.site.profile;
  // Case studies, drafts included: they are Antoine's own words, just not featured.
  const workDir = join(ROOT, "content/work");
  const work = await Promise.all(
    (await readdir(workDir)).map((name) => readFile(join(workDir, name), "utf8")),
  );
  const corpus = [JSON.stringify(profile), JSON.stringify(result.site.timeline), ...work]
    .join("\n")
    .toLowerCase();
  // Whole words only, so a made-up "Go" can't hide inside "Google".
  const named = (item: string) =>
    new RegExp(
      `(?<![\\w.])${item.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w])`,
    ).test(corpus);
  const unbacked = skills.flatMap((s) => s.items).filter((i) => !named(i));
  expect(unbacked).toEqual([]);
});
