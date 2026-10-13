import type { Site } from "../content/load.ts";
import { contracts } from "../system/contracts.ts";
import { contrastRows, ratio, tokenGroups } from "../system/report.ts";
import { type Contract, contractId } from "../system/schema.ts";
import { isColor, readTokens, type Tokens } from "../system/tokens.ts";
import { eyebrow, siteFooter, siteHeader } from "./components.ts";
import { escapeHtml, html, raw, type SafeHtml } from "./html.ts";
import { layout } from "./layout.ts";
import { SYSTEM_ROOT } from "./urls.ts";

/** Contract text is plain text with `code` spans, like Markdown. */
export const inline = (text: string): SafeHtml =>
  raw(escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>"));

const KINDS = { component: "Components", layout: "Layout", utility: "Utilities" } as const;

function list(label: string, items: string[]): SafeHtml {
  if (items.length === 0) return html``;
  return html`<div><dt>${label}</dt><dd><ul>${items.map((i) => html`<li>${inline(i)}</li>`)}</ul></dd></div>`;
}

function contractEntry(contract: Contract, site: Site): SafeHtml {
  const selectors = [
    ...contract.classes.map((c) => `\`.${c}\``),
    ...contract.elements.map((e) => `\`${e}\``),
  ];
  return html`<article class="contract" id="${contractId(contract)}" aria-labelledby="${contractId(contract)}-title">
<h3 id="${contractId(contract)}-title">${contract.name}</h3>
<p>${inline(contract.purpose)}</p>
<dl class="contract-spec">
${selectors.length > 0 && html`<div><dt>Selectors</dt><dd>${inline(selectors.join(" "))}</dd></div>`}
${list("States", contract.states)}
${list("Accessibility", contract.a11y)}
${list("Do", contract.do)}
${list("Don't", contract.dont)}
</dl>
${contract.example && html`<div class="contract-example" role="group" aria-label="${contract.name} example">${contract.example(site, SYSTEM_ROOT)}</div>`}
</article>`;
}

/** Wide tables scroll inside a focusable region, so keyboard users can scroll them too. */
function scroll(label: string, table: SafeHtml): SafeHtml {
  return html`<div class="table-scroll" role="region" aria-label="${label}" tabindex="0">${table}</div>`;
}

function colors(tokens: Tokens): SafeHtml {
  const names = [...tokens.light.keys()].filter(isColor);
  return html`<ul class="swatches">${names.map(
    (name) =>
      html`<li class="swatch"><span class="swatch-chip" style="background: var(${name})"></span><code>${name}</code><span class="muted">${tokens.light.get(name)}<br>${tokens.dark.get(name) ?? tokens.light.get(name)}</span></li>`,
  )}</ul>`;
}

function contrastTable(tokens: Tokens): SafeHtml {
  return html`<table class="system-table">
<caption>Every colour pair the contracts rely on, checked in both themes by the tests.</caption>
<thead><tr><th scope="col">Text / UI</th><th scope="col">On</th><th scope="col">Used for</th><th scope="col">Minimum</th><th scope="col">Light</th><th scope="col">Dark</th></tr></thead>
<tbody>${contrastRows(contracts, tokens).map(
    (r) =>
      html`<tr><td><code>${r.fg}</code></td><td><code>${r.bg}</code></td><td>${r.uses.join("; ")}</td><td>${ratio(r.min)}</td><td>${ratio(r.light)}</td><td>${ratio(r.dark)}</td></tr>`,
  )}</tbody>
</table>`;
}

function typeScale(tokens: Tokens): SafeHtml {
  const names = [...tokens.light.keys()].filter((n) => n.startsWith("--text-"));
  return html`<ul>${names.map(
    (name) =>
      html`<li class="type-sample"><code>${name}</code><span style="font-size: var(${name})">Ship the right path</span></li>`,
  )}</ul>`;
}

function spaceScale(tokens: Tokens): SafeHtml {
  const names = [...tokens.light.keys()].filter((n) => n.startsWith("--space-"));
  return html`<ul>${names.map(
    (name) =>
      html`<li class="type-sample"><code>${name}</code><span class="space-bar" style="inline-size: var(${name})"></span></li>`,
  )}</ul>`;
}

function otherTokens(tokens: Tokens): SafeHtml {
  const skip = new Set(["color", "text", "space"]);
  const rows = [...tokenGroups(tokens)].filter(([family]) => !skip.has(family));
  return html`<table class="system-table">
<caption>Type, layout, shape and motion. Durations drop to 0 under <code>prefers-reduced-motion</code>.</caption>
<thead><tr><th scope="col">Token</th><th scope="col">Value</th></tr></thead>
<tbody>${rows.map(([, names]) =>
    names.map(
      (name) =>
        html`<tr><td><code>${name}</code></td><td><code>${tokens.light.get(name)}</code></td></tr>`,
    ),
  )}</tbody>
</table>`;
}

export function systemPage(site: Site): string {
  const tokens = readTokens();
  const body = html`${siteHeader(SYSTEM_ROOT, "system")}
<main id="main" class="page">
<header class="case-header">
${eyebrow("Design system")}
<h1>How this site is built</h1>
<p class="tagline">Tokens and component contracts, generated from the code. The same contracts feed <a href="${SYSTEM_ROOT}llms.txt">llms.txt</a>, <a href="${SYSTEM_ROOT}system.md">system.md</a> and the tests that fail when a page breaks them.</p>
</header>
<nav class="system-toc" aria-label="On this page"><ul>
<li><a href="#tokens-title">Tokens</a></li>
${Object.entries(KINDS).map(([, label]) => html`<li><a href="#${label.toLowerCase()}-title">${label}</a></li>`)}
</ul></nav>

<section class="section" aria-labelledby="tokens-title">
<h2 id="tokens-title">Tokens</h2>
<p class="contact-lead">Every colour, pixel value and duration lives in <code>styles/tokens.css</code>; a test fails if one appears anywhere else.</p>
<h3 class="subheading">Colour</h3>
<p class="muted">Light value, then dark value. The chips follow your system theme.</p>
${colors(tokens)}
<h3 class="subheading">Contrast</h3>
${scroll("Contrast pairs", contrastTable(tokens))}
<h3 class="subheading">Type scale</h3>
${typeScale(tokens)}
<h3 class="subheading">Space</h3>
${spaceScale(tokens)}
<h3 class="subheading">Everything else</h3>
${scroll("Other tokens", otherTokens(tokens))}
</section>
${Object.entries(KINDS).map(
  ([kind, label]) => html`
<section class="section" aria-labelledby="${label.toLowerCase()}-title">
<h2 id="${label.toLowerCase()}-title">${label}</h2>
${contracts.filter((c) => c.kind === kind).map((c) => contractEntry(c, site))}
</section>`,
)}
</main>
${siteFooter(site, SYSTEM_ROOT)}`;
  return layout({
    title: `Design system — ${site.profile.name}`,
    description: "The tokens and component contracts of toyn.dev, generated from the code.",
    body,
    root: SYSTEM_ROOT,
  });
}
