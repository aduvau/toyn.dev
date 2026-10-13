import { afterEach, expect, test } from "bun:test";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
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
