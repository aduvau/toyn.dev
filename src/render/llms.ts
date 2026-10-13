import type { Site } from "../content/load.ts";
import { contracts } from "../system/contracts.ts";
import { contrastRows, ratio, tokenGroups } from "../system/report.ts";
import { readTokens } from "../system/tokens.ts";
import { RESUME_PATH, SITE_URL, SYSTEM_PATH, workPath } from "./urls.ts";

/** `llms.txt` (llmstxt.org): an index of the site for language models. */
export function llmsTxt(site: Site): string {
  const { profile } = site;
  return `# ${profile.name} — ${profile.title}

> ${profile.tagline}

${profile.intro.join("\n\n")}

## Case studies

${site.work.map((w) => `- [${w.title}](${SITE_URL}${workPath(w.slug)}): ${w.summary}`).join("\n")}

## Résumé

- [Résumé](${SITE_URL}${RESUME_PATH}): experience, projects, skills, languages and education, printable as a PDF.

## Design system

- [Design system](${SITE_URL}${SYSTEM_PATH}): tokens, contrast checks and component contracts, generated from the code.
- [Design system as Markdown](${SITE_URL}system.md): the same tokens and contracts, for agents. Follow it when changing the site.

## Optional

${profile.links.map((l) => `- [${l.label}](${l.url})`).join("\n")}
`;
}

const bullets = (label: string, items: string[]) =>
  items.length === 0 ? "" : `**${label}**\n\n${items.map((i) => `- ${i}`).join("\n")}\n\n`;

/** `system.md`: the design system as Markdown, generated from `tokens.css` and the contracts. */
export function systemMarkdown(site: Site): string {
  const tokens = readTokens();
  const groups = [...tokenGroups(tokens)].map(([family, names]) => {
    // Only colours change with the theme.
    const themed = family === "color";
    const head = themed
      ? "| Token | Light | Dark |\n| --- | --- | --- |"
      : "| Token | Value |\n| --- | --- |";
    const rows = names.map((n) => {
      const light = `\`${tokens.light.get(n)}\``;
      return themed
        ? `| \`${n}\` | ${light} | \`${tokens.dark.get(n) ?? tokens.light.get(n)}\` |`
        : `| \`${n}\` | ${light} |`;
    });
    return `### ${family}\n\n${head}\n${rows.join("\n")}\n`;
  });
  const pairs = contrastRows(contracts, tokens).map(
    (r) =>
      `| \`${r.fg}\` | \`${r.bg}\` | ${ratio(r.min)} | ${ratio(r.light)} | ${ratio(r.dark)} | ${r.uses.join("; ")} |`,
  );
  const entries = contracts.map((c) => {
    const selectors = [...c.classes.map((x) => `\`.${x}\``), ...c.elements.map((e) => `\`${e}\``)];
    return `### ${c.name}\n\n*${c.kind}.* ${c.purpose}\n\n${
      selectors.length > 0 ? `**Selectors:** ${selectors.join(" ")}\n\n` : ""
    }${bullets("States", c.states)}${bullets("Accessibility", c.a11y)}${bullets("Do", c.do)}${bullets("Don't", c.dont)}`;
  });
  return `# ${site.profile.name} — design system

Generated from \`styles/tokens.css\` and \`src/system/contracts.ts\`; don't edit by hand.
Rules for anyone changing the site, human or agent:

- Colours, px values and durations come from the tokens below; a test fails on any raw one elsewhere.
- Use the spacing, type and radius tokens too wherever one fits.
- Every CSS class belongs to exactly one contract. Add or update the contract first.
- Keep every contrast pair at or above its minimum, in both themes.
- Every page works without JavaScript. JavaScript only enhances: hide the enhanced control with
  \`@media (scripting: none)\`, put the fallback in \`<noscript>\`, no script files (ADR-0003).

## Tokens

${groups.join("\n")}
## Contrast pairs

| Text / UI | On | Minimum | Light | Dark | Used for |
| --- | --- | --- | --- | --- | --- |
${pairs.join("\n")}

## Contracts

${entries.join("").trimEnd()}
`;
}
