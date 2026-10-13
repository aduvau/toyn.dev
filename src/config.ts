import { join, resolve } from "node:path";

export interface Config {
  root: string;
  contentDir: string;
  publicDir: string;
  stylesDir: string;
  /** Where `build` writes the static site. A git clone of the deploy repo when deploying. */
  distDir: string;
  port: number;
  /** Watch files and reload open pages on change (serve mode only). */
  liveReload: boolean;
}

export function makeConfig(
  options: Partial<Pick<Config, "root" | "port" | "liveReload">> = {},
): Config {
  const root = resolve(options.root ?? process.cwd());
  return {
    root,
    contentDir: join(root, "content"),
    publicDir: join(root, "public"),
    stylesDir: join(root, "styles"),
    distDir: join(root, "dist"),
    port: options.port ?? 3000,
    liveReload: options.liveReload ?? false,
  };
}
