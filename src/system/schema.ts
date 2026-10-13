import { z } from "zod";
import type { Site } from "../content/load.ts";
import type { SafeHtml } from "../render/html.ts";

const colorToken = z.string().regex(/^--color-[\w-]+$/, "must be a --color-* token");

/** A foreground/background token pair the component relies on, checked in both themes. */
const contrastPair = z.strictObject({
  fg: colorToken,
  bg: colorToken,
  /** WCAG AA: 4.5 for text, 3 for large text and non-text UI (focus rings, borders that matter). */
  min: z.union([z.literal(4.5), z.literal(3)]),
  use: z.string().min(1),
});

/**
 * A component contract: the machine-readable spec of one part of the UI. It feeds the `/system`
 * page, `system.md` / `llms.txt` and the guardrail tests, so docs, agent instructions and checks
 * can't drift apart.
 */
export const contractSchema = z.strictObject({
  name: z.string().min(1),
  /** `component`: a reusable piece of UI. `layout`: page structure. `utility`: a helper class. */
  kind: z.enum(["component", "layout", "utility"]),
  purpose: z.string().min(1),
  /** CSS classes this contract owns (without the dot). A class belongs to exactly one contract. */
  classes: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)),
  /** Elements styled without a class (e.g. `a`), for contracts about base styles. */
  elements: z.array(z.string().min(1)).default([]),
  states: z.array(z.string().min(1)).default([]),
  a11y: z.array(z.string().min(1)).min(1),
  do: z.array(z.string().min(1)).default([]),
  dont: z.array(z.string().min(1)).default([]),
  contrast: z.array(contrastPair).default([]),
});

export type ContractData = z.input<typeof contractSchema>;

export type Contract = z.output<typeof contractSchema> & {
  /** A live example rendered from the site's real content (never made-up data). */
  example?: (site: Site, root: string) => SafeHtml;
};

/** Validates the contracts and checks that names and classes are unique. Throws on any problem. */
export function defineContracts(
  list: (ContractData & { example?: Contract["example"] })[],
): Contract[] {
  const owner = new Map<string, string>();
  const names = new Set<string>();
  return list.map(({ example, ...data }) => {
    const contract = contractSchema.parse(data);
    if (names.has(contract.name)) throw new Error(`duplicate contract ${contract.name}`);
    names.add(contract.name);
    for (const cls of contract.classes) {
      const other = owner.get(cls);
      if (other) throw new Error(`class .${cls} is owned by both ${other} and ${contract.name}`);
      owner.set(cls, contract.name);
    }
    return { ...contract, example };
  });
}

/** Anchor id of a contract on the `/system` page. */
export const contractId = (contract: Contract) =>
  `c-${contract.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
