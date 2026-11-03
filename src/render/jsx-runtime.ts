import { type Child, escapeHtml, renderChild, SafeHtml } from "./html.ts";

// The JSX runtime of the site's `.tsx` files (ADR-0007): JSX compiles to these calls, which return
// `SafeHtml` strings at build time. No virtual DOM, nothing shipped to the browser.
// Attributes are written as in HTML (`class`, `for`, `aria-*`, `stroke-width`), not React names.

type AttributeValue = SafeHtml | string | number | boolean | null | undefined;

type Props = { children?: Child } & Record<string, unknown>;

/** Elements without a closing tag. */
const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

/**
 * `true` writes a bare attribute (`open`), `false`/`null`/`undefined` leave it out. A `SafeHtml`
 * value is written as is, so it must not contain `"` (the résumé's entity-encoded `mailto:` only).
 */
function attribute(name: string, value: AttributeValue): string {
  if (value === true) return ` ${name}`;
  if (value === false || value === null || value === undefined) return "";
  const text = value instanceof SafeHtml ? value.value : escapeHtml(String(value));
  return ` ${name}="${text}"`;
}

export function jsx(
  type: string | ((props: Props) => SafeHtml),
  { children, ...attributes }: Props,
): SafeHtml {
  if (typeof type === "function") return type({ ...attributes, children });
  const open = `<${type}${Object.entries(attributes)
    .map(([name, value]) => attribute(name, value as AttributeValue))
    .join("")}>`;
  if (VOID.has(type)) return new SafeHtml(open);
  return new SafeHtml(`${open}${renderChild(children)}</${type}>`);
}

export const jsxs = jsx;
export const jsxDEV = jsx;

/** `<>…</>`: its children, with no element around them. */
export function Fragment({ children }: { children?: Child }): SafeHtml {
  return new SafeHtml(renderChild(children));
}

export declare namespace JSX {
  type Element = SafeHtml;
  interface IntrinsicElements {
    [tag: string]: { children?: Child } & Record<string, AttributeValue | Child>;
  }
  interface ElementChildrenAttribute {
    children: unknown;
  }
}
