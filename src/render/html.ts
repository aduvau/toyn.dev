/** A string that is already safe to insert into HTML. */
export class SafeHtml {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);
}

/** Marks trusted HTML (e.g. the markdown pipeline output) so JSX won't escape it. */
export function raw(value: string): SafeHtml {
  return new SafeHtml(value);
}

/** What JSX accepts as children: nested arrays are flattened, `false`/`null`/`undefined` skipped. */
export type Child = SafeHtml | string | number | boolean | null | undefined | Child[];

/** A child as HTML: escaped unless it is `SafeHtml`. Used by the JSX runtime (`jsx-runtime.ts`). */
export function renderChild(value: Child): string {
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(renderChild).join("");
  if (value === null || value === undefined || value === false || value === true) return "";
  return escapeHtml(String(value));
}

/**
 * JSON safe to embed in `<script type="application/json">`: `<`, `>` and `&` are escaped as
 * `\u003c`… so a value containing `</script>` or `<!--` can't end the element early.
 */
export function jsonForScript(value: unknown): SafeHtml {
  return new SafeHtml(
    JSON.stringify(value)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026"),
  );
}
