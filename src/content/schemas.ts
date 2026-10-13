import { z } from "zod";

const link = z.strictObject({ label: z.string().min(1), url: z.string().min(1) });

export const profileSchema = z.strictObject({
  name: z.string().min(1),
  title: z.string().min(1),
  location: z.string().min(1),
  tagline: z.string().min(1),
  intro: z.array(z.string().min(1)).min(1),
  /** Shown on `/resume` only, obfuscated in the markup. */
  email: z.email(),
  links: z.array(link),
  practices: z.array(z.strictObject({ title: z.string().min(1), body: z.string().min(1) })).min(1),
  /** Résumé skills. Every item must be named elsewhere in the content (see `tests/content.test.ts`). */
  skills: z
    .array(z.strictObject({ group: z.string().min(1), items: z.array(z.string().min(1)).min(1) }))
    .min(1),
  languages: z.array(z.strictObject({ name: z.string().min(1), level: z.string().min(1) })).min(1),
});

const role = z.strictObject({
  title: z.string().min(1),
  period: z.coerce.string().min(1),
  summary: z.string().min(1),
  /** Slug of the published case study about this role, linked from the résumé. */
  work: z.string().min(1).optional(),
});

export const timelineSchema = z.strictObject({
  experience: z.array(
    z.strictObject({
      org: z.string().min(1),
      period: z.coerce.string().min(1),
      /** One or more roles inside the same organisation (freelance clients, promotions). */
      roles: z.array(role).min(1),
    }),
  ),
  education: z.array(
    z.strictObject({
      school: z.string().min(1),
      degree: z.string().min(1),
      period: z.coerce.string().min(1),
      note: z.string().optional(),
    }),
  ),
});

/** A screenshot under `public/`, e.g. `work/holivia/video-call.webp`. WebP only (sizes are read from it). */
const image = z.strictObject({
  src: z.string().regex(/^work\/[\w./-]+\.webp$/, "must be a .webp path under public/work/"),
  /** Same shot in dark mode, swapped in with `prefers-color-scheme`. */
  srcDark: z
    .string()
    .regex(/^work\/[\w./-]+\.webp$/, "must be a .webp path under public/work/")
    .optional(),
  alt: z.string().min(1),
  caption: z.string().min(1).optional(),
});

export const workSchema = z.strictObject({
  title: z.string().min(1),
  client: z.string().min(1),
  role: z.string().min(1),
  period: z.coerce.string().min(1),
  /** Position in the "Selected work" list, lowest first. */
  order: z.number().int(),
  summary: z.string().min(1),
  impact: z
    .array(z.strictObject({ value: z.string().min(1), label: z.string().min(1) }))
    .default([]),
  stack: z.array(z.string().min(1)).default([]),
  links: z.array(link).default([]),
  /** Shown on the home page card and at the top of the case study. */
  cover: image.optional(),
  /** Screenshots shown after the text of the case study. */
  gallery: z.array(image).default([]),
  draft: z.boolean().default(false),
});

export const postSchema = z.strictObject({
  title: z.string().min(1),
  /** One or two sentences, shown on the index, in the meta description and in `llms.txt`. */
  summary: z.string().min(1),
  /** Publication date, `YYYY-MM-DD`. Posts are listed newest first. */
  date: z.iso.date(),
  draft: z.boolean().default(false),
});

export type Profile = z.infer<typeof profileSchema>;
export type Timeline = z.infer<typeof timelineSchema>;
export type WorkMeta = z.infer<typeof workSchema>;
export type PostMeta = z.infer<typeof postSchema>;
export type ImageMeta = z.infer<typeof image>;
