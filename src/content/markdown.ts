import type { Image, Root, RootContent } from "mdast";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { parse as parseYaml } from "yaml";

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Splits `---` YAML front matter from the Markdown body. Throws on invalid YAML. */
export function splitFrontMatter(source: string): { data: unknown; body: string } {
  const match = source.match(FRONT_MATTER);
  if (!match) return { data: {}, body: source };
  return { data: parseYaml(match[1] ?? "") ?? {}, body: source.slice(match[0].length) };
}

function images(node: Root | RootContent, found: Image[] = []): Image[] {
  if (node.type === "image") found.push(node);
  if ("children" in node) for (const child of node.children) images(child, found);
  return found;
}

/**
 * Markdown → HTML. Raw HTML is dropped (so `<!-- TODO(antoine) -->` notes never reach the page).
 * Returns the problems the build must refuse, e.g. an image without alt text.
 */
export async function renderMarkdown(body: string): Promise<{ html: string; errors: string[] }> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify);
  const tree = processor.parse(body);
  const errors = images(tree)
    .filter((img) => !img.alt?.trim())
    .map((img) => `line ${img.position?.start.line}: image "${img.url}" has no alt text`);
  const hast = await processor.run(tree);
  return { html: processor.stringify(hast), errors };
}
