import { expect, type Page, test } from "@playwright/test";

// Executable QA for the theme toggle (ADR-0005), one test per check of
// `.story-pipeline/theme-toggle/qa-procedure.md` (numbers in the titles). Runs against the static
// build served by `playwright.config.ts`, never production. Each test gets a fresh browser context,
// so storage starts empty.

/** The header's toggle (`/system` also shows one as the contract's example). */
const toggle = (page: Page) => page.getByRole("banner").getByRole("button", { name: "Dark theme" });

/** The theme on screen, read from the page background's OKLCH lightness. */
async function shown(page: Page, property = "background-color", element = "body") {
  const colour = await page.evaluate(
    ([el, prop]) =>
      getComputedStyle(document.querySelector(el as string) as Element).getPropertyValue(
        prop as string,
      ),
    [element, property],
  );
  const lightness = Number(colour.match(/oklch\(\s*([\d.]+)(%?)/)?.[1]);
  expect(lightness, `unexpected colour ${colour}`).not.toBeNaN();
  return (colour.includes("%") ? lightness / 100 : lightness) < 0.5 ? "dark" : "light";
}

/** Lets queued rendering-time events (e.g. `matchMedia` changes) run. */
const nextFrames = (page: Page) =>
  page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );

for (const system of ["light", "dark"] as const) {
  test(`#${system === "light" ? 1 : 2} first visit follows a ${system} system`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: system });
    await page.goto("/");
    expect(await shown(page)).toBe(system);
    await expect(toggle(page)).toHaveAttribute("aria-pressed", String(system === "dark"));
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  });
}

test("#3 #4 the toggle switches light → dark → light", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await toggle(page).click();
  expect(await shown(page)).toBe("dark");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await toggle(page).click();
  expect(await shown(page)).toBe("light");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("#5 the toggle is reachable and usable from the keyboard", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const button = toggle(page);
  for (
    let tabs = 0;
    tabs < 10 && !(await button.evaluate((b) => b === document.activeElement));
    tabs++
  )
    await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  expect(await button.evaluate((b) => getComputedStyle(b).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  expect(await shown(page)).toBe("dark");
  await page.keyboard.press("Space");
  expect(await shown(page)).toBe("light");
});

for (const [system, chosen] of [
  ["light", "dark"],
  ["dark", "light"],
] as const) {
  test(`#${chosen === "dark" ? 6 : 7} a ${chosen} choice on a ${system} system survives a browser restart`, async ({
    browser,
    page,
  }) => {
    await page.emulateMedia({ colorScheme: system });
    await page.goto("/");
    await toggle(page).click();
    // A restart keeps the origin's storage and nothing else: carry it into a brand-new context.
    const storageState = await page.context().storageState();
    const restarted = await browser.newContext({ storageState, colorScheme: system });
    const again = await restarted.newPage();
    await again.goto("/");
    expect(await shown(again)).toBe(chosen);
    await expect(toggle(again)).toHaveAttribute("aria-pressed", String(chosen === "dark"));
    expect(await again.evaluate(() => localStorage.getItem("theme"))).toBe(chosen);
    await restarted.close();
  });
}

test("#8 the chosen theme applies on every page of the nav", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await toggle(page).click();
  const nav = page.getByRole("navigation", { name: "Main" }).getByRole("link");
  const labels = await nav.allTextContents();
  expect(labels.length).toBeGreaterThan(1);
  for (const label of labels) {
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: label }).click();
    await expect(page.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    expect(await shown(page), label).toBe("dark");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  }
});

test("#9 a stored theme is applied before the stylesheet can paint", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await toggle(page).click();
  // Hold the render-blocking stylesheet: nothing can paint until it arrives, so the theme must
  // already be on <html> while it's pending.
  let themeWhileBlocked: string | undefined;
  await page.route("**/styles/main.css", async (route) => {
    themeWhileBlocked = await page.evaluate(() => document.documentElement.dataset.theme);
    await route.continue();
  });
  await page.reload();
  expect(themeWhileBlocked).toBe("dark");
});

test("#10 a system change is followed until the visitor chooses", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await shown(page)).toBe("dark");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await toggle(page).click(); // light chosen on a dark system
  // Once chosen, a system change must not win: back to light, then dark again, page stays light.
  // `matchMedia` is evaluated once per frame: let one pass after each change, or none is seen.
  await page.emulateMedia({ colorScheme: "light" });
  await nextFrames(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await nextFrames(page);
  expect(await shown(page)).toBe("light");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
});

test("#11 with storage blocked, the toggle still works and nothing throws", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("The operation is insecure.", "SecurityError");
      },
    });
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await toggle(page).click();
  expect(await shown(page)).toBe("dark");
  await page.reload();
  expect(await shown(page)).toBe("light");
  expect(errors).toEqual([]);
});

test("#12 printing uses the light colours after choosing dark", async ({ page }) => {
  await page.goto("/resume/");
  await toggle(page).click();
  expect(await shown(page, "--color-bg", "html")).toBe("dark");
  await page.emulateMedia({ media: "print" });
  expect(await shown(page, "--color-bg", "html")).toBe("light");
});

test.describe("#13 without JavaScript", () => {
  test.use({ javaScriptEnabled: false, colorScheme: "dark" });

  test("the theme follows a dark system and no toggle is shown", async ({ page }) => {
    await page.goto("/");
    expect(await shown(page)).toBe("dark");
    await expect(page.locator(".theme-toggle")).toBeHidden();
  });
});

test("#14 the toggle meets the target size and doesn't animate under reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const box = await toggle(page).boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(24);
  expect(box?.height).toBeGreaterThanOrEqual(24);
  // playwright.config.ts emulates `reducedMotion: "reduce"`, which zeroes the duration tokens.
  expect(
    await toggle(page)
      .locator("svg")
      .evaluate((svg) => getComputedStyle(svg).transitionDuration),
  ).toBe("0s");
});

test("#14 on a phone, the toggle sits at the top of the header with a bigger target", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  const box = await toggle(page).boundingBox();
  const nav = await page.getByRole("navigation", { name: "Main" }).boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(40);
  expect(box?.height).toBeGreaterThanOrEqual(40);
  expect(box?.y).toBeCloseTo(nav?.y ?? Number.NaN, 0);
});
