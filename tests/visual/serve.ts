import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../../src/build/build.ts";
import { makeConfig } from "../../src/config.ts";
import { isInside } from "../../src/paths.ts";

// Static server for the visual tests (started by `playwright.config.ts`): a real build, served as
// Codeberg Pages would, without the dev server's live-reload script. Never builds into `dist/`.
const port = Number(process.argv[2] ?? 4173);
const out = await mkdtemp(join(tmpdir(), "toyn-visual-"));
const result = await build(makeConfig({ root: join(import.meta.dir, "../..") }), out);
if (!result.ok) {
  for (const error of result.errors) console.error(error);
  await rm(out, { recursive: true, force: true });
  process.exit(1);
}

const server = Bun.serve({
  port,
  async fetch(req) {
    const path = decodeURIComponent(new URL(req.url).pathname);
    const file = join(out, path.endsWith("/") ? `${path}index.html` : path);
    if (!isInside(out, file)) return new Response("Not found", { status: 404 });
    const found = Bun.file(file);
    return (await found.exists())
      ? new Response(found)
      : new Response("Not found", { status: 404 });
  },
});
console.log(`toyn: visual build served on ${server.url}`);

const stop = async () => {
  await server.stop(true);
  await rm(out, { recursive: true, force: true });
  process.exit(0);
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
