import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../src/build/build.ts";
import { makeConfig } from "../src/config.ts";
import { contracts } from "../src/system/contracts.tsx";
import { contrastRows } from "../src/system/report.ts";
import { contractId } from "../src/system/schema.ts";
import { contrast, isColor, readTokens, TOKENS_FILE } from "../src/system/tokens.ts";

// Guardrails derived from the component contracts and the tokens.

const ROOT = join(import.meta.dir, "..");
const STYLES = join(ROOT, "styles");
const tokens = readTokens();

let out: string;
let pages: string[];
const read = (file: string) => Bun.file(join(out, file)).text();

/** Every stylesheet except the tokens, without comments and `@import`s. */
async function stylesheets(): Promise<[string, string][]> {
  const files = (await readdir(STYLES)).filter((f) => f.endsWith(".css") && f !== "tokens.css");
  return Promise.all(
    files.map(
      async (f): Promise<[string, string]> => [
        f,
        (await Bun.file(join(STYLES, f)).text())
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/@import[^;]+;/g, ""),
      ],
    ),
  );
}

beforeAll(async () => {
  out = await mkdtemp(join(tmpdir(), "toyn-system-"));
  const result = await build(makeConfig({ root: ROOT }), out);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  pages = result.files.filter((f) => f.endsWith(".html"));
});

afterAll(() => rm(out, { recursive: true, force: true }));

describe("contracts", () => {
  const owned = new Set(contracts.flatMap((c) => c.classes));

  test("every class used on a page has a contract", async () => {
    const missing = new Set<string>();
    for (const page of pages) {
      for (const [, attr] of (await read(page)).matchAll(/class="([^"]*)"/g)) {
        for (const cls of attr?.split(/\s+/).filter(Boolean) ?? []) {
          if (!owned.has(cls)) missing.add(`${page}: .${cls}`);
        }
      }
    }
    expect([...missing]).toEqual([]);
  });

  test("every class styled in the CSS has a contract", async () => {
    const missing = new Set<string>();
    for (const [file, css] of await stylesheets()) {
      for (const [, cls] of css.matchAll(/\.([a-z][a-z0-9-]*)/g)) {
        if (!owned.has(cls ?? "")) missing.add(`${file}: .${cls}`);
      }
    }
    expect([...missing]).toEqual([]);
  });

  test("every class a contract owns is styled or used, so contracts don't outlive the code", async () => {
    const css = (await stylesheets()).map(([, text]) => text).join("\n");
    const markup = (await Promise.all(pages.map(read))).join("\n");
    const unused = [...owned].filter(
      (cls) => !css.includes(`.${cls}`) && !new RegExp(`class="[^"]*\\b${cls}\\b`).test(markup),
    );
    expect(unused).toEqual([]);
  });
});

describe("tokens", () => {
  test("no raw colours, px or durations outside tokens.css", async () => {
    const RAW = {
      colour: /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/i,
      px: /\dpx\b/,
      duration: /\b\d*\.?\d+m?s\b/,
    };
    const found: string[] = [];
    for (const [file, raw] of await stylesheets()) {
      // The visually-hidden pattern needs a real 1px box; it is the one allowed exception.
      const css = raw.replace(/\.visually-hidden\s*\{[^}]*\}/, "");
      for (const [decl] of css.matchAll(/[\w-]+\s*:\s*[^;{}]+;/g)) {
        for (const [kind, pattern] of Object.entries(RAW)) {
          if (pattern.test(decl)) found.push(`${file}: raw ${kind} in \`${decl}\``);
        }
      }
    }
    expect(found).toEqual([]);
  });

  test("every var() points to a defined token", async () => {
    const undefinedTokens: string[] = [];
    for (const [file, css] of await stylesheets()) {
      for (const [, name] of css.matchAll(/var\((--[\w-]+)/g)) {
        if (!tokens.light.has(name ?? "")) undefinedTokens.push(`${file}: ${name}`);
      }
    }
    expect(undefinedTokens).toEqual([]);
  });

  test("the dark theme only overrides colour tokens that exist in the light theme", () => {
    const stray = [...tokens.dark.keys()].filter((n) => !isColor(n) || !tokens.light.has(n));
    expect(stray).toEqual([]);
  });

  test("the toggle's dark theme repeats the system's dark theme exactly (ADR-0005)", () => {
    expect(tokens.dark.size).toBeGreaterThan(0);
    expect([...tokens.chosenDark]).toEqual([...tokens.dark]);
  });

  test("contrast maths matches known values", () => {
    expect(contrast("oklch(100% 0 0)", "oklch(0% 0 0)")).toBeCloseTo(21, 1);
    expect(contrast("oklch(50% 0.1 200)", "oklch(50% 0.1 200)")).toBeCloseTo(1, 5);
  });

  test("every contrast pair in the contracts passes WCAG AA in both themes", () => {
    const failing = contrastRows(contracts, tokens)
      .filter((r) => r.light < r.min || r.dark < r.min)
      .map((r) => `${r.fg} on ${r.bg}: ${r.light.toFixed(2)} / ${r.dark.toFixed(2)} < ${r.min}`);
    expect(failing).toEqual([]);
  });
});

describe("focus", () => {
  test("there is a global :focus-visible ring made of tokens", async () => {
    const css = (await stylesheets()).map(([, text]) => text).join("\n");
    expect(css).toMatch(
      /(?:^|\n|\}\s*):focus-visible\s*\{[^}]*outline:\s*var\(--focus-width\)\s+solid\s+var\(--color-focus\)/,
    );
  });

  test("a focus ring is only removed where it is redrawn on a pseudo-element", async () => {
    const css = (await stylesheets()).map(([, text]) => text).join("\n");
    for (const [, selector] of css.matchAll(/([^{}]+)\{[^}]*outline:\s*(?:none|0)\s*;/g)) {
      const sel = (selector ?? "").trim();
      expect(sel).toMatch(/:focus-visible$/);
      const redrawn = new RegExp(
        `${sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}::(?:after|before)\\s*\\{[^}]*outline:\\s*var\\(--focus-width\\)`,
      );
      expect(redrawn.test(css) ? sel : `${sel} removes the ring without redrawing it`).toBe(sel);
    }
  });
});

describe("generated docs stay in sync with the contracts", () => {
  test("/system has an entry for every contract", async () => {
    const page = await read("system/index.html");
    for (const contract of contracts) expect(page).toContain(`id="${contractId(contract)}"`);
  });

  test("system.md documents every contract and every token", async () => {
    const md = await read("system.md");
    for (const contract of contracts) expect(md).toContain(`### ${contract.name}\n`);
    for (const name of tokens.light.keys()) expect(md).toContain(`\`${name}\``);
  });

  test("llms.txt links to the design system and every case study", async () => {
    const txt = await read("llms.txt");
    expect(txt).toContain("https://www.toyn.dev/system.md");
    for (const page of pages.filter((p) => p.startsWith("work/"))) {
      expect(txt).toContain(`https://www.toyn.dev/${page.replace(/index\.html$/, "")}`);
    }
  });

  test("snapshots: llms.txt and system.md", async () => {
    expect(await read("llms.txt")).toMatchSnapshot();
    expect(await read("system.md")).toMatchSnapshot();
  });

  test("tokens are read from styles/tokens.css", () => {
    expect(TOKENS_FILE).toBe(join(STYLES, "tokens.css"));
  });
});
