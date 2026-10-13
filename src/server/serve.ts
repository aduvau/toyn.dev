import { join } from "node:path";
import { bundleStyles } from "../build/build.ts";
import type { Config } from "../config.ts";
import { loadSite } from "../content/load.ts";
import { isInside } from "../paths.ts";
import { escapeHtml } from "../render/html.ts";
import { renderPages } from "../render/pages.ts";
import { watchDirs } from "./livereload.ts";

const HTML_HEADERS = { "Content-Type": "text/html; charset=utf-8" };
const LIVERELOAD_TOPIC = "livereload";
const LIVERELOAD_SCRIPT = '<script type="module" src="/__livereload.js"></script>\n';
const CLIENT_DIR = join(import.meta.dir, "../../client");

async function serveStatic(dir: string, rest: string): Promise<Response> {
  let decoded: string;
  try {
    decoded = decodeURIComponent(rest);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const path = join(dir, decoded);
  if (!isInside(dir, path)) return new Response("Not found", { status: 404 });
  const file = Bun.file(path);
  return (await file.exists()) ? new Response(file) : new Response("Not found", { status: 404 });
}

function inject(page: string, snippet: string): string {
  const at = page.lastIndexOf("</body>");
  return at === -1 ? page + snippet : page.slice(0, at) + snippet + page.slice(at);
}

export interface DevServer {
  url: URL;
  stop(): Promise<void>;
}

/** Dev server: re-renders the whole (small) site on every page request, so content is always fresh. */
export function startServer(config: Config): DevServer {
  const reload = config.liveReload ? LIVERELOAD_SCRIPT : "";

  const page = async (path: string): Promise<Response> => {
    const loaded = await loadSite(config);
    if (!loaded.ok) {
      const list = loaded.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("");
      return new Response(
        inject(`<!doctype html><h1>Content errors</h1><ul>${list}</ul></body>`, reload),
        {
          status: 500,
          headers: HTML_HEADERS,
        },
      );
    }
    const pages = renderPages(loaded.site);
    const found = pages.get(path);
    if (found !== undefined) return new Response(inject(found, reload), { headers: HTML_HEADERS });
    // Canonical URLs end with a slash, as in the static build.
    if (pages.has(`${path.replace(/\/?index\.html$/, "")}/index.html`)) {
      return new Response(null, {
        status: 308,
        headers: { Location: `/${path.replace(/index\.html$/, "")}/` },
      });
    }
    return new Response(inject(pages.get("404.html") ?? "Not found", reload), {
      status: 404,
      headers: HTML_HEADERS,
    });
  };

  const server = Bun.serve({
    port: config.port,
    routes: {
      "/styles/main.css": async () =>
        new Response(await bundleStyles(config.stylesDir, false), {
          headers: { "Content-Type": "text/css; charset=utf-8" },
        }),
      "/public/*": (req) => serveStatic(config.publicDir, new URL(req.url).pathname.slice(8)),
      "/__livereload.js": async () => {
        if (!config.liveReload) return new Response("Not found", { status: 404 });
        const result = await Bun.build({
          entrypoints: [join(CLIENT_DIR, "livereload.ts")],
          target: "browser",
        });
        return new Response(await result.outputs[0]?.text(), {
          headers: { "Content-Type": "text/javascript; charset=utf-8" },
        });
      },
      "/__livereload": (req, server) => {
        if (!config.liveReload) return new Response("Not found", { status: 404 });
        if (server.upgrade(req)) return;
        return new Response("WebSocket only", { status: 400 });
      },
    },
    websocket: {
      open: (ws) => {
        ws.subscribe(LIVERELOAD_TOPIC);
      },
      message: () => {},
    },
    fetch: (req) => {
      const path = decodeURIComponent(new URL(req.url).pathname).replace(/^\//, "");
      return page(path === "" || path.endsWith("/") ? `${path}index.html` : path);
    },
  });

  const watcher =
    config.liveReload &&
    watchDirs([config.contentDir, config.stylesDir, config.publicDir], () => {
      server.publish(LIVERELOAD_TOPIC, "reload");
    });

  return {
    url: server.url,
    async stop() {
      if (watcher) watcher.close();
      await server.stop(true);
    },
  };
}
