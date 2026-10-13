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

/** Marks trusted HTML (e.g. the markdown pipeline output) so `html` won't escape it. */
export function raw(value: string): SafeHtml {
  return new SafeHtml(value);
}

type Value = SafeHtml | string | number | boolean | null | undefined | Value[];

function render(value: Value): string {
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join("");
  if (value === null || value === undefined || value === false) return "";
  return escapeHtml(String(value));
}

/** Tagged template: interpolated values are escaped unless they are `SafeHtml`. */
export function html(strings: TemplateStringsArray, ...values: Value[]): SafeHtml {
  let out = strings[0] ?? "";
  values.forEach((value, i) => {
    out += render(value) + (strings[i + 1] ?? "");
  });
  return new SafeHtml(out);
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
