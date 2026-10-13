import { join } from "node:path";
import { $ } from "bun";
import type { Config } from "../config.ts";
import { build } from "./build.ts";

/** Codeberg Pages publishes this branch. Pushed explicitly, whatever the local branch is. */
export const DEPLOY_BRANCH = "pages";

export type DeployResult =
  | { ok: true; commit: string | null; files: number }
  | { ok: false; errors: string[] };

class GitError extends Error {}

async function git(cwd: string, ...args: string[]): Promise<string> {
  const result = await $`git ${args}`.cwd(cwd).quiet().nothrow();
  if (result.exitCode !== 0) {
    throw new GitError(`git ${args.join(" ")}: ${result.stderr.toString().trim()}`);
  }
  return result.stdout.toString().trim();
}

/** `abc1234`, `abc1234 (uncommitted changes)`, or `no git` when the project isn't a repo. */
async function sourceRevision(root: string): Promise<string> {
  try {
    const hash = await git(root, "rev-parse", "--short", "HEAD");
    const dirty = (await git(root, "status", "--porcelain")) !== "";
    return dirty ? `${hash} (uncommitted changes)` : hash;
  } catch {
    return "no git";
  }
}

/**
 * Builds into `outDir`, which must be a git clone of the deploy repo, then commits whatever
 * changed and pushes to `origin/pages`. `commit` is null when the site didn't change; the push
 * still runs, so a deploy whose push failed earlier goes out on the next try.
 */
export async function deploy(config: Config, outDir = config.distDir): Promise<DeployResult> {
  if (!(await Bun.file(join(outDir, ".git/HEAD")).exists())) {
    return {
      ok: false,
      errors: [
        `${outDir} is not a git repo. Clone the deploy repo there first, e.g.\n` +
          `  git clone -b ${DEPLOY_BRANCH} <url> ${outDir}`,
      ],
    };
  }
  const built = await build(config, outDir);
  if (!built.ok) return built;

  try {
    await git(outDir, "add", "--all");
    const changed = (await git(outDir, "status", "--porcelain")) !== "";
    let commit: string | null = null;
    if (changed) {
      const message = `Deploy toyn ${await sourceRevision(config.root)}`;
      await git(outDir, "commit", "--quiet", "--message", message);
      commit = await git(outDir, "rev-parse", "--short", "HEAD");
    }
    await git(outDir, "push", "--quiet", "origin", `HEAD:${DEPLOY_BRANCH}`);
    return { ok: true, commit, files: built.files.length };
  } catch (e) {
    if (e instanceof GitError) return { ok: false, errors: [e.message] };
    throw e;
  }
}
