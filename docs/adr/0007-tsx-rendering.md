# ADR-0007: Render pages with TSX and a local JSX runtime

**Status:** Accepted; replaces the "tagged template literals" HTML choice of ADR-0001
**Date:** 2026-11-03
**Deciders:** Project owner

## Context
Pages were built with an `html` tagged template (`src/render/html.ts`): interpolations escaped
unless `SafeHtml`, markup kept as plain text. That text is whitespace-sensitive, and a formatter
can't tell. A reformat in `e5636fa` reflowed the templates. That added line breaks and spaces inside
tags and between inline elements, and 14 tests went red. Nothing typed the markup either: a missing
`>` or a misspelt attribute only showed in the output.

## Decision
The render layer (`src/render/*.tsx`, and `src/system/contracts.tsx` for the live examples) is TSX.
`tsconfig.json` sets `"jsx": "react-jsx"` and `"jsxImportSource": "#jsx"`, with a `paths` entry
pointing `#jsx/jsx-runtime` at `src/render/jsx-runtime.ts`. Bun, `tsc` and Playwright all resolve it.

The runtime is about 50 lines. `jsx()` returns `SafeHtml`, so components are functions from props to
an HTML string, as before:
- Text children and attribute values are escaped; `SafeHtml` (`raw()`, the Markdown output) is not.
- `true` writes a bare attribute (`open`); `false`, `null`, `undefined` leave it out.
- Attributes keep their HTML names (`class`, `aria-*`, `stroke-width`), not React's.
- Void elements have no closing tag. The doctype is added by `toDocument()`.

Whitespace now follows JSX rules: line breaks between tags are dropped, and a space that matters is
written `{" "}`. Biome formats TSX without changing the output.

`llms.txt`, `system.md` and the dev server's error page stay template strings: they are Markdown or
plain text, not page markup.

## Options Considered
- **Local runtime (chosen):** no dependency, server-only, output identical to the templates up to
  whitespace (checked by diffing both builds). Cost: we own 50 lines and their tests.
- **`@kitajs/html`:** the same idea as a package, with typed intrinsic elements. A dependency for
  what fits in one file, and its types are wider than this site needs.
- **Preact + `preact-render-to-string`:** a real framework on the server. React attribute names
  (`className`), and it pulls a UI framework into a "no framework" site (ADR-0001).
- **Keep the templates, stop the formatter touching them:** fixes the symptom only; markup stays
  untyped.

## Consequences
- Components are PascalCase and take props: `<WorkCard work root contract />`. The contract text
  that names them (`system.md`, `llms.txt`) says `<LinkTo>`, `<SocialLinks>`, `<ThemeToggle>`,
  `<WorkCard …>`.
- Pages are about 10% smaller, since the template indentation is gone.
- Still no client JavaScript: JSX runs at build time only (ADR-0003 unchanged).
- `JSX.IntrinsicElements` accepts any tag and attribute: typos in attribute names are not caught.
  Tighten it if that becomes a problem.
- Two intended ARIA patterns carry a `biome-ignore` with a reason (`role="group"` on contract
  examples, `role="region"` on scrolling tables).
