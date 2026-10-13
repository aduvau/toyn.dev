import type { Contract } from "../system/schema.ts";
import { escapeHtml, html, raw, type SafeHtml } from "./html.ts";

// Contract text as HTML, shared by the `/system` page and the cards' "View contract" panel.

/** Contract text is plain text with `code` spans, like Markdown. */
export const inline = (text: string): SafeHtml =>
  raw(escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>"));

/** One row of a contract's `<dl>`: a label and a bulleted list, or nothing when the list is empty. */
export function specList(label: string, items: string[]): SafeHtml {
  if (items.length === 0) return html``;
  return html`<div><dt>${label}</dt><dd><ul>${items.map((i) => html`<li>${inline(i)}</li>`)}</ul></dd></div>`;
}

/** The "Selectors" row: the contract's classes and elements as `code` spans, or nothing. */
export function selectorsRow(contract: Contract): SafeHtml {
  const list = [...contract.classes.map((c) => `.${c}`), ...contract.elements];
  if (list.length === 0) return html``;
  return html`<div><dt>Selectors</dt><dd>${inline(list.map((s) => `\`${s}\``).join(" "))}</dd></div>`;
}
