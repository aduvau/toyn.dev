import { readFileSync } from "node:fs";
import { join } from "node:path";

// Reads `styles/tokens.css` (the single source of raw values) and checks colour contrast with it.

export interface Tokens {
  /** Every token with its light-theme (default) value, in source order. */
  light: Map<string, string>;
  /** Tokens overridden by `prefers-color-scheme: dark`. */
  dark: Map<string, string>;
}

export const TOKENS_FILE = join(import.meta.dir, "../../styles/tokens.css");

function declarations(block: string): Map<string, string> {
  return new Map(
    [...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1] ?? "", (m[2] ?? "").trim()]),
  );
}

/** The `{…}` body that follows `start`, with nested braces matched. */
function blockAfter(css: string, start: string): string {
  const from = css.indexOf("{", css.indexOf(start));
  if (from === -1) return "";
  let depth = 0;
  for (let i = from; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(from + 1, i);
  }
  return "";
}

export function parseTokens(css: string): Tokens {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return {
    light: declarations(blockAfter(noComments, ":root")),
    dark: declarations(blockAfter(noComments, "@media (prefers-color-scheme: dark)")),
  };
}

/** Read on every render (sync, it's one small file), so the dev server picks up token edits. */
export function readTokens(file = TOKENS_FILE): Tokens {
  return parseTokens(readFileSync(file, "utf8"));
}

export const isColor = (name: string) => name.startsWith("--color-");

/** Value of a token in a theme (dark falls back to light, like the cascade does). */
export function tokenValue(tokens: Tokens, name: string, theme: "light" | "dark"): string {
  const value = (theme === "dark" && tokens.dark.get(name)) || tokens.light.get(name);
  if (value === undefined) throw new Error(`unknown token ${name}`);
  return value;
}

/**
 * Relative luminance (WCAG) of an `oklch(L% C H)` colour. OKLCH → OKLab → linear sRGB: WCAG works
 * on linear values, so no gamma step is needed. Out-of-gamut channels are clamped, as browsers do.
 */
export function luminance(color: string): number {
  const m = color.match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!m) throw new Error(`unsupported colour ${color}: tokens are written as oklch(L% C H)`);
  const L = Number(m[1]) / 100;
  const C = Number(m[2]);
  const h = (Number(m[3]) * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const r = clamp(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s);
  const g = clamp(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s);
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

/** WCAG contrast ratio between two colours, from 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
