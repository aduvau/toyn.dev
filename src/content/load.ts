import { readdir } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import type { z } from "zod";
import type { Config } from "../config.ts";
import { webpSize } from "./images.ts";
import { renderMarkdown, splitFrontMatter } from "./markdown.ts";
import {
  type ImageMeta,
  type PostMeta,
  type Profile,
  postSchema,
  profileSchema,
  type Timeline,
  timelineSchema,
  type WorkMeta,
  workSchema,
} from "./schemas.ts";

export interface Image extends ImageMeta {
  width: number;
  height: number;
}

export interface Work extends Omit<WorkMeta, "cover" | "gallery"> {
  slug: string;
  html: string;
  cover?: Image;
  gallery: Image[];
}

export interface Post extends PostMeta {
  slug: string;
  html: string;
}

export interface Site {
  profile: Profile;
  timeline: Timeline;
  /** Published case studies, in display order. */
  work: Work[];
  /** Published posts, newest first. Empty while every post is a draft. */
  posts: Post[];
}

export type LoadResult =
  | { ok: true; site: Site; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

const TODO = /TODO\(antoine\)(?:(?!-->)[^\n])*/g;

function issues(file: string, error: z.ZodError): string[] {
  return error.issues.map((i) => `${file}: ${i.path.join(".") || "(root)"}: ${i.message}`);
}

/** Loads and validates everything under `content/`. Never throws on bad content: it reports it. */
export async function loadSite(config: Config): Promise<LoadResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rel = (path: string) => relative(config.root, path);

  /** Reads a file, collecting its open `TODO(antoine)` notes as warnings. */
  const read = async (path: string): Promise<string | undefined> => {
    const file = Bun.file(path);
    if (!(await file.exists())) {
      errors.push(`${rel(path)}: missing`);
      return undefined;
    }
    const text = await file.text();
    for (const todo of text.match(TODO) ?? []) warnings.push(`${rel(path)}: ${todo.trim()}`);
    return text;
  };

  const yaml = async <T>(name: string, schema: z.ZodType<T>): Promise<T | undefined> => {
    const path = join(config.contentDir, name);
    const text = await read(path);
    if (text === undefined) return undefined;
    try {
      const parsed = schema.safeParse(parseYaml(text));
      if (parsed.success) return parsed.data;
      errors.push(...issues(rel(path), parsed.error));
    } catch (e) {
      errors.push(`${rel(path)}: ${(e as Error).message}`);
    }
    return undefined;
  };

  const profile = await yaml("profile.yaml", profileSchema);
  const timeline = await yaml("timeline.yaml", timelineSchema);

  const workDir = join(config.contentDir, "work");
  const names = (await readdir(workDir).catch(() => [])).filter((n) => n.endsWith(".md")).sort();
  const work: Work[] = [];
  for (const name of names) {
    const path = join(workDir, name);
    const source = await read(path);
    if (source === undefined) continue;
    try {
      const { data, body } = splitFrontMatter(source);
      const meta = workSchema.safeParse(data);
      if (!meta.success) {
        errors.push(...issues(rel(path), meta.error));
        continue;
      }
      if (meta.data.draft) continue;
      const rendered = await renderMarkdown(body);
      errors.push(...rendered.errors.map((e) => `${rel(path)}: ${e}`));
      /** Checks an image exists (dark variant too) and reads its size. */
      const sized = async (img: ImageMeta): Promise<Image | undefined> => {
        let size: { width: number; height: number } | undefined;
        for (const src of [img.src, img.srcDark]) {
          if (src === undefined) continue;
          const file = Bun.file(join(config.publicDir, src));
          if (!(await file.exists())) {
            errors.push(`${rel(path)}: image public/${src} not found`);
            return undefined;
          }
          size ??= webpSize(await file.bytes());
        }
        if (!size) {
          errors.push(`${rel(path)}: image public/${img.src} is not a readable WebP`);
          return undefined;
        }
        return { ...img, ...size };
      };
      const cover = meta.data.cover && (await sized(meta.data.cover));
      const gallery: Image[] = [];
      for (const img of meta.data.gallery) {
        const s = await sized(img);
        if (s) gallery.push(s);
      }
      work.push({ ...meta.data, slug: basename(name, ".md"), html: rendered.html, cover, gallery });
    } catch (e) {
      errors.push(`${rel(path)}: ${(e as Error).message}`);
    }
  }
  work.sort((a, b) => a.order - b.order);

  const postDir = join(config.contentDir, "writing");
  const postNames = (await readdir(postDir).catch(() => []))
    .filter((n) => n.endsWith(".md"))
    .sort();
  const posts: Post[] = [];
  for (const name of postNames) {
    const path = join(postDir, name);
    const source = await read(path);
    if (source === undefined) continue;
    try {
      const { data, body } = splitFrontMatter(source);
      const meta = postSchema.safeParse(data);
      if (!meta.success) {
        errors.push(...issues(rel(path), meta.error));
        continue;
      }
      if (meta.data.draft) continue;
      const rendered = await renderMarkdown(body);
      errors.push(...rendered.errors.map((e) => `${rel(path)}: ${e}`));
      posts.push({ ...meta.data, slug: basename(name, ".md"), html: rendered.html });
    } catch (e) {
      errors.push(`${rel(path)}: ${(e as Error).message}`);
    }
  }
  posts.sort((a, b) => b.date.localeCompare(a.date));

  const slugs = new Set(work.map((w) => w.slug));
  for (const role of timeline?.experience.flatMap((e) => e.roles) ?? []) {
    if (role.work && !slugs.has(role.work)) {
      errors.push(
        `content/timeline.yaml: "${role.title}" links to unknown or draft work "${role.work}"`,
      );
    }
  }

  if (errors.length > 0 || !profile || !timeline) return { ok: false, errors, warnings };
  return { ok: true, site: { profile, timeline, work, posts }, warnings };
}
