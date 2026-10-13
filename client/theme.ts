/**
 * The theme toggle (ADR-0005). Runs inline in `<head>`, before the stylesheet, so a stored theme is
 * applied before the first paint. Without a stored choice, `<html>` has no `data-theme` and the CSS
 * follows `prefers-color-scheme`. A click on any `.theme-toggle` flips the theme shown and stores it.
 *
 * `layout()` inlines this function's source with `toString()`: keep it self-contained (no imports,
 * no outer names) and in syntax every current browser runs.
 */
export function initTheme(doc: Document, win: Window): void {
  const root = doc.documentElement;
  const system = win.matchMedia("(prefers-color-scheme: dark)");
  /** Whether the dark theme is shown: the visitor's choice, or else the system's. */
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : system.matches);
  const sync = () => {
    for (const button of doc.querySelectorAll(".theme-toggle"))
      button.setAttribute("aria-pressed", String(isDark()));
  };

  // Storage can throw (blocked site data, some private modes): the toggle then lasts for the page.
  try {
    const stored = win.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") root.dataset.theme = stored;
  } catch {}

  doc.addEventListener("DOMContentLoaded", sync);
  system.addEventListener("change", sync);
  doc.addEventListener("click", (event) => {
    if (!(event.target as Element).closest(".theme-toggle")) return;
    const theme = isDark() ? "light" : "dark";
    root.dataset.theme = theme;
    sync();
    try {
      win.localStorage.setItem("theme", theme);
    } catch {}
  });
}
