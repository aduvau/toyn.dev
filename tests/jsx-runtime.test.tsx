import { expect, test } from "bun:test";
import { raw } from "../src/render/html.ts";
import { toDocument } from "../src/render/layout.tsx";

// The JSX runtime (ADR-0007): JSX compiles to escaped HTML strings, with HTML's own attribute names.

test("text and attribute values are escaped, SafeHtml is not", () => {
  const title = `"Tom" & <Jerry>`;
  expect((<p title={title}>{title}</p>).value).toBe(
    '<p title="&quot;Tom&quot; &amp; &lt;Jerry&gt;">&quot;Tom&quot; &amp; &lt;Jerry&gt;</p>',
  );
  expect((<a href={raw("&#109;")}>{raw("<b>ok</b>")}</a>).value).toBe(
    '<a href="&#109;"><b>ok</b></a>',
  );
});

test("true is a bare attribute; false, null and undefined leave it out", () => {
  expect((<details open hidden={false} title={undefined} />).value).toBe(
    "<details open></details>",
  );
  expect((<button type="button" aria-pressed="false" />).value).toBe(
    '<button type="button" aria-pressed="false"></button>',
  );
});

test("children: arrays are flattened, booleans and nullish values render nothing", () => {
  const items = ["a", "b"];
  expect(
    (
      <ul>
        {items.map((i) => (
          <li>{i}</li>
        ))}
        {false}
        {null}
        {undefined}
        {true}
        {0}
      </ul>
    ).value,
  ).toBe("<ul><li>a</li><li>b</li>0</ul>");
});

test("void elements have no closing tag; fragments add no element", () => {
  expect(
    (
      <>
        <img src="a.webp" alt="" />
        <br />
      </>
    ).value,
  ).toBe('<img src="a.webp" alt=""><br>');
});

test("components get their props and children", () => {
  const Greeting = ({ name, children }: { name: string; children: string }) => (
    <p data-name={name}>{children}</p>
  );
  expect((<Greeting name="Ada">Hello</Greeting>).value).toBe('<p data-name="Ada">Hello</p>');
});

test("a page file starts with the doctype", () => {
  expect(toDocument(<html lang="en" />)).toBe('<!doctype html>\n<html lang="en"></html>\n');
});
