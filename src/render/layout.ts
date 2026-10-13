import { initTheme } from "../../client/theme.ts";
import { html, raw, type SafeHtml } from "./html.ts";

/**
 * The page's one inline script (ADR-0003), in `<head>` before the stylesheet:
 * - Relative URLs need the page's canonical URL, which ends with a slash. Some static hosts serve
 *   `/work/slug` without redirecting, and `../../` would then resolve one level too high.
 * - The theme toggle (ADR-0005) applies a stored theme before the first paint.
 */
export const HEAD_SCRIPT = raw(
  `<script>var p=location.pathname;if(!p.endsWith("/")&&!p.endsWith(".html"))location.replace(p+"/"+location.search+location.hash);(${initTheme})(document,window)</script>`,
);

export function layout({
  title,
  description,
  body,
  root,
}: {
  title: string;
  description: string;
  body: SafeHtml;
  /** Prefix from this page to the site root: `""` on the index, `"../../"` on a case study. */
  root: string;
}): string {
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${HEAD_SCRIPT}
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="icon" href="${root}public/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}styles/main.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${body}
</body>
</html>
`.value;
}
