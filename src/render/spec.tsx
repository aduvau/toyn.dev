import type { Contract } from "../system/schema.ts";
import { escapeHtml, raw, type SafeHtml } from "./html.ts";

// Contract text as HTML, shared by the `/system` page and the cards' "View contract" panel.

/** Contract text is plain text with `code` spans, like Markdown. */
export function Inline({ text }: { text: string }): SafeHtml {
  return raw(escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>"));
}

/** One row of a contract's `<dl>`: a label and a bulleted list, or nothing when the list is empty. */
export function SpecList({ label, items }: { label: string; items: string[] }): SafeHtml {
  return (
    <>
      {items.length > 0 && (
        <div>
          <dt>{label}</dt>
          <dd>
            <ul>
              {items.map((i) => (
                <li>
                  <Inline text={i} />
                </li>
              ))}
            </ul>
          </dd>
        </div>
      )}
    </>
  );
}

/** The "Selectors" row: the contract's classes and elements as `code` spans, or nothing. */
export function SelectorsRow({ contract }: { contract: Contract }): SafeHtml {
  const list = [...contract.classes.map((c) => `.${c}`), ...contract.elements];
  return (
    <>
      {list.length > 0 && (
        <div>
          <dt>Selectors</dt>
          <dd>
            <Inline text={list.map((s) => `\`${s}\``).join(" ")} />
          </dd>
        </div>
      )}
    </>
  );
}
