import { beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { makeConfig } from "../src/config.ts";
import { loadSite, type Work } from "../src/content/load.ts";
import { WorkCard } from "../src/render/components.tsx";
import { escapeHtml } from "../src/render/html.ts";
import { cardContract, contracts } from "../src/system/contracts.tsx";
import { type Contract, defineContracts } from "../src/system/schema.ts";

// "View contract" on cards (PLAN §8 B, `.story-pipeline/card-contract/`): the panel is rendered from
// the Card contract, and every part it draws construction lines on is a class a contract owns.

let work: Work;

beforeAll(async () => {
  const result = await loadSite(makeConfig({ root: join(import.meta.dir, "..") }));
  if (!result.ok) throw new Error(result.errors.join("\n"));
  const first = result.site.work.find((w) => w.cardCover && w.impact.length > 0);
  if (!first) throw new Error("no case study with a card cover and impact figures");
  work = first;
});

const card = (w: Work = work, root = "", contract = cardContract(), open = false) =>
  WorkCard({ work: w, root, contract, open }).value;

/** A made-up contract, to prove the panel prints whatever the contract says. */
const fake: Contract = defineContracts([
  {
    name: "Fake card",
    kind: "component",
    purpose: "Purpose with <markup> & `code`.",
    classes: ["fake-a", "fake-b"],
    a11y: ["First a11y rule.", "Second a11y rule."],
    dont: ["Never this.", "Never that."],
    contrast: [{ fg: "--color-fg", bg: "--color-surface", min: 4.5, use: "body copy" }],
  },
])[0] as Contract;

describe("the contract toggle", () => {
  test("closes every card, after its article, with a collapsed summary", () => {
    expect(card()).toMatch(
      /<\/article>\s*<details class="card-contract"><summary><span aria-hidden="true">\{ \}<\/span> View contract<\/summary>/,
    );
    expect(card()).toMatch(/<\/details>\s*<\/li>$/);
  });

  test("is closed unless asked otherwise", () => {
    expect(WorkCard({ work, root: "", contract: cardContract() }).value).toContain(
      '<details class="card-contract"><summary>',
    );
  });

  test("renders open on request", () => {
    expect(card(work, "", cardContract(), true)).toContain('<details class="card-contract" open>');
  });

  test("the summary's name is “View contract” alone: the braces are hidden", () => {
    const summary = card().match(/<summary>(.*?)<\/summary>/)?.[1] ?? "";
    expect(summary.replace(/<span aria-hidden="true">.*?<\/span>/, "").trim()).toBe(
      "View contract",
    );
  });
});

describe("the panel is generated from the contract", () => {
  const panel = (contract: Contract, root = "") =>
    card(work, root, contract).match(
      /<div class="card-contract-panel">([\s\S]*?)<\/div>\s*<\/details>/,
    )?.[1] ?? "";

  test("purpose, selectors, accessibility, contrast and don'ts, escaped", () => {
    const text = panel(fake);
    expect(text).toContain("<p>Purpose with &lt;markup&gt; &amp; <code>code</code>.</p>");
    expect(text).toContain("<dt>Selectors</dt><dd><code>.fake-a</code> <code>.fake-b</code></dd>");
    expect(text).toContain(
      "<dt>Accessibility</dt><dd><ul><li>First a11y rule.</li><li>Second a11y rule.</li></ul></dd>",
    );
    expect(text).toContain(
      "<dt>Contrast</dt><dd><ul><li><code>--color-fg</code> on <code>--color-surface</code> ≥ 4.5: body copy</li></ul></dd>",
    );
    expect(text).toContain(
      "<dt>Don&#39;t</dt><dd><ul><li>Never this.</li><li>Never that.</li></ul></dd>",
    );
  });

  test("rows without content are left out", () => {
    const [bare] = defineContracts([
      { name: "Bare", kind: "component", purpose: "Only a purpose.", classes: [], a11y: ["One."] },
    ]);
    expect(panel(bare as Contract)).toContain(
      "<dl><div><dt>Accessibility</dt><dd><ul><li>One.</li></ul></dd></div></dl>",
    );
  });

  test("it names its sources and links to the contract's entry on /system", () => {
    expect(panel(fake)).toContain(
      '<p class="muted">From <code>src/system/contracts.tsx</code> · checked by <code>tests/system.test.ts</code> · <a href="system/#c-fake-card">Fake card on /system</a></p>',
    );
    expect(panel(fake, "../")).toContain('<a href="../system/#c-fake-card">');
  });

  test("on the site, it prints the real Card contract", () => {
    const real = cardContract();
    expect(real.name).toBe("Card");
    const text = panel(real);
    for (const rule of [...real.a11y, ...real.dont]) {
      expect(text).toContain(escapeHtml(rule).replace(/`([^`]+)`/g, "<code>$1</code>"));
    }
    for (const pair of real.contrast) expect(text).toContain(pair.use);
  });
});

describe("construction lines", () => {
  const parts = (markup: string) => [
    ...markup.matchAll(/class="([^"]*)"[^>]*data-part="([^"]*)"/g),
  ];

  test("cover, eyebrow, title, summary and impact are each a labelled part", () => {
    expect(parts(card()).map(([, , label]) => label)).toEqual([
      ".card-cover",
      ".eyebrow",
      ".card-title",
      ".card-summary",
      ".impact",
    ]);
  });

  test("each label is a class the element has, owned by a contract", () => {
    const owned = new Set(contracts.flatMap((c) => c.classes));
    for (const [, classes, label] of parts(card())) {
      const cls = (label ?? "").slice(1);
      expect(classes?.split(/\s+/)).toContain(cls);
      expect(owned.has(cls) ? cls : `.${cls} has no contract`).toBe(cls);
    }
  });

  test("a card without a cover or impact figures has no part for them", () => {
    const labels = parts(card({ ...work, cardCover: undefined, impact: [] })).map(([, , l]) => l);
    expect(labels).toEqual([".eyebrow", ".card-title", ".card-summary"]);
  });
});

describe("the card's content", () => {
  test("eyebrow, title link, summary and every impact figure", () => {
    const markup = card();
    expect(markup).toContain(
      `data-part=".eyebrow">${escapeHtml(`${work.client} · ${work.period}`)}</p>`,
    );
    expect(markup).toContain(`<a class="card-link" href="work/${work.slug}/">`);
    expect(markup).toContain(`data-part=".card-summary">${escapeHtml(work.summary)}</p>`);
    for (const i of work.impact) {
      expect(markup).toContain(
        `<div class="impact-item"><dt>${escapeHtml(i.label)}</dt><dd>${escapeHtml(i.value)}</dd></div>`,
      );
    }
  });

  test("no impact figures, no impact list and nothing in its place", () => {
    const markup = card({ ...work, impact: [] });
    expect(markup).not.toContain('class="impact"');
    expect(markup).toMatch(/<\/p>\s*<\/article>/);
  });

  test("the cover's shape picks its rule: taller than wide is portrait, otherwise wide", () => {
    const cover = work.cardCover;
    if (!cover) throw new Error("no cover");
    const shape = (width: number, height: number) =>
      card({ ...work, cardCover: { ...cover, width, height } }).match(
        /class="card-cover ([^"]+)"/,
      )?.[1];
    expect(shape(100, 101)).toBe("is-portrait");
    expect(shape(100, 100)).toBe("is-wide");
    expect(shape(101, 100)).toBe("is-wide");
  });
});

describe("contracts", () => {
  test("the toggle has its own contract", () => {
    const toggle = contracts.find((c) => c.classes.includes("card-contract"));
    expect(toggle?.name).toBe("Card contract");
    expect(toggle?.classes).toEqual(["card-contract", "card-contract-panel"]);
  });

  test("the Card contract allows this one control besides the title link", () => {
    expect(cardContract().dont.join(" ")).toMatch(/second link.*except.*View contract/i);
  });
});
