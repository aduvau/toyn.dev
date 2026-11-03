import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import type { Config } from "../config.ts";
import { loadSite } from "../content/load.ts";
import { isInside } from "../paths.ts";
import { renderPages } from "../render/pages.ts";

export type BuildResult =
  | { ok: true; outDir: string; files: string[]; warnings: string[] }
  | { ok: false; errors: string[] };

/** Copies `from` into `to`, skipping dotfiles. A missing `from` is fine. */
async function copyDir(from: string, to: string): Promise<void> {
  try {
    await readdir(from);
  } catch {
    return;
  }
  await cp(from, to, { recursive: true, filter: (src) => !basename(src).startsWith(".") });
}

/** Bundles and minifies `styles/main.css` (its `@import`s inlined). */
export async function bundleStyles(stylesDir: string, minify: boolean): Promise<string> {
  const result = await Bun.build({ entrypoints: [join(stylesDir, "main.css")], minify });
  const output = result.outputs[0];
  if (!result.success || !output) throw new AggregateError(result.logs, "styles failed to bundle");
  return output.text();
}

async function emptyDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)))
    .sort();
}

/**
 * Renders the site into `outDir` (default `dist/`). Content errors fail the build before `outDir`
 * is touched, so a broken build never replaces a good one.
 */
export async function build(config: Config, outDir = config.distDir): Promise<BuildResult> {
  if (isInside(outDir, config.root)) {
    throw new Error(`refusing to build into ${outDir}: it contains the project`);
  }
  const loaded = await loadSite(config);
  if (!loaded.ok) return { ok: false, errors: loaded.errors };

  const pages = renderPages(loaded.site);
  const css = await bundleStyles(config.stylesDir, true);

  await emptyDir(outDir);
  for (const [path, content] of pages) {
    const file = join(outDir, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  await mkdir(join(outDir, "styles"), { recursive: true });
  await writeFile(join(outDir, "styles", "main.css"), css);
  await copyDir(config.publicDir, join(outDir, "public"));
  return { ok: true, outDir, files: await listFiles(outDir), warnings: loaded.warnings };
}
