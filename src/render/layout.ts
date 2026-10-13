import { html, type SafeHtml } from "./html.ts";

/**
 * Relative URLs need the page's canonical URL, which ends with a slash. Some static hosts serve
 * `/work/slug` without redirecting, and `../../` would then resolve one level too high.
 */
const TRAILING_SLASH_SCRIPT = html`<script>var p=location.pathname;if(!p.endsWith("/")&&!p.endsWith(".html"))location.replace(p+"/"+location.search+location.hash)</script>`;

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
${TRAILING_SLASH_SCRIPT}
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
