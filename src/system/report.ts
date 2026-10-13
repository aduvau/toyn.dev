import type { Contract } from "./schema.ts";
import { contrast, type Tokens, tokenValue } from "./tokens.ts";

export interface ContrastRow {
  fg: string;
  bg: string;
  min: number;
  /** What the pair is used for, per contract: "Card: title and summary". */
  uses: string[];
  light: number;
  dark: number;
}

/** Every colour pair declared by the contracts, deduplicated, with its ratio in both themes. */
export function contrastRows(contracts: Contract[], tokens: Tokens): ContrastRow[] {
  const rows = new Map<string, ContrastRow>();
  for (const contract of contracts) {
    for (const pair of contract.contrast) {
      const key = `${pair.fg}|${pair.bg}|${pair.min}`;
      const row = rows.get(key) ?? {
        fg: pair.fg,
        bg: pair.bg,
        min: pair.min,
        uses: [],
        light: contrast(tokenValue(tokens, pair.fg, "light"), tokenValue(tokens, pair.bg, "light")),
        dark: contrast(tokenValue(tokens, pair.fg, "dark"), tokenValue(tokens, pair.bg, "dark")),
      };
      row.uses.push(`${contract.name}: ${pair.use}`);
      rows.set(key, row);
    }
  }
  return [...rows.values()];
}

export const ratio = (value: number) => `${value.toFixed(2)}:1`;

/** Tokens grouped by family (`--color-*`, `--text-*`…), in source order. */
export function tokenGroups(tokens: Tokens): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const name of tokens.light.keys()) {
    const family = name.slice(2).split("-")[0] ?? name;
    groups.set(family, [...(groups.get(family) ?? []), name]);
  }
  return groups;
}
