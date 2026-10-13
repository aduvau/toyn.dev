import { isAbsolute, relative, sep } from "node:path";

/** Whether `path` resolves inside `dir` (used to refuse `..` traversal). */
export function isInside(dir: string, path: string): boolean {
  const rel = relative(dir, path);
  return !(rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel));
}
