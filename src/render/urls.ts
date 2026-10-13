/** Where the site is served. Only used where an absolute URL is required (llms.txt). */
export const SITE_URL = "https://www.toyn.dev/";

/** Case study URL, relative to the site root. Ends with a slash, like every page. */
export const workPath = (slug: string) => `work/${slug}/`;

/** From a case study page back to the root. */
export const WORK_ROOT = "../../";

/** The design system page, relative to the site root. */
export const SYSTEM_PATH = "system/";

/** From the design system page back to the root. */
export const SYSTEM_ROOT = "../";

/** The résumé page, relative to the site root. */
export const RESUME_PATH = "resume/";

/** From the résumé page back to the root. */
export const RESUME_ROOT = "../";
