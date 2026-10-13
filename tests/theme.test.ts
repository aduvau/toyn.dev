import { describe, expect, test } from "bun:test";
import { initTheme } from "../client/theme.ts";

// The theme toggle's client logic (ADR-0005), run against small fakes of `document` and `window`:
// what it does to `<html data-theme>`, `aria-pressed` and `localStorage`.

type Listener = (event: { target: unknown }) => void;

function fakeButton() {
  let pressed = "false";
  const button = {
    closest: (selector: string) => (selector === ".theme-toggle" ? button : null),
    setAttribute: (name: string, value: string) => {
      if (name === "aria-pressed") pressed = value;
    },
    pressed: () => pressed,
  };
  return button;
}

function setup({
  system = "light",
  stored,
  storage = "ok",
}: {
  system?: "light" | "dark";
  stored?: string;
  storage?: "ok" | "blocked";
} = {}) {
  const docListeners = new Map<string, Listener[]>();
  const mediaListeners = new Map<string, (() => void)[]>();
  const store = new Map<string, string>(stored === undefined ? [] : [["theme", stored]]);
  const buttons = [fakeButton(), fakeButton()];
  const media = {
    matches: system === "dark",
    addEventListener: (type: string, fn: () => void) =>
      mediaListeners.set(type, [...(mediaListeners.get(type) ?? []), fn]),
  };
  const root = { dataset: {} as { theme?: string } };
  const blocked = () => {
    throw new Error("SecurityError: storage is blocked");
  };

  const doc = {
    documentElement: root,
    querySelectorAll: (selector: string) => (selector === ".theme-toggle" ? buttons : []),
    addEventListener: (type: string, fn: Listener) =>
      docListeners.set(type, [...(docListeners.get(type) ?? []), fn]),
  };
  const win = {
    matchMedia: (query: string) => {
      expect(query).toBe("(prefers-color-scheme: dark)");
      return media;
    },
    get localStorage() {
      return storage === "blocked"
        ? { getItem: blocked, setItem: blocked }
        : {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => store.set(key, value),
          };
    },
  };

  initTheme(doc as unknown as Document, win as unknown as Window);

  const fire = (type: string, target: unknown = null) => {
    for (const fn of docListeners.get(type) ?? []) fn({ target });
  };
  return {
    root,
    store,
    buttons,
    /** The DOM is parsed: the head script can now reach the buttons. */
    ready: () => fire("DOMContentLoaded"),
    click: (target: unknown = buttons[0]) => fire("click", target),
    systemChangesTo: (scheme: "light" | "dark") => {
      media.matches = scheme === "dark";
      for (const fn of mediaListeners.get("change") ?? []) fn();
    },
    pressed: () => buttons.map((b) => b.pressed()),
  };
}

const elsewhere = { closest: () => null };

describe("on first visit", () => {
  test.each(["light", "dark"] as const)("follows a %s system without forcing a theme", (system) => {
    const page = setup({ system });
    page.ready();
    expect(page.root.dataset.theme).toBeUndefined();
    const pressed = String(system === "dark");
    expect(page.pressed()).toEqual([pressed, pressed]);
  });

  test("follows a system change until the visitor chooses", () => {
    const page = setup({ system: "light" });
    page.ready();
    page.systemChangesTo("dark");
    expect(page.pressed()).toEqual(["true", "true"]);
    page.systemChangesTo("light");
    expect(page.pressed()).toEqual(["false", "false"]);
  });
});

describe("the toggle", () => {
  test("switches light → dark → light, and every toggle on the page shows it", () => {
    const page = setup({ system: "light" });
    page.ready();
    page.click();
    expect(page.root.dataset.theme).toBe("dark");
    expect(page.pressed()).toEqual(["true", "true"]);
    page.click(page.buttons[1]);
    expect(page.root.dataset.theme).toBe("light");
    expect(page.pressed()).toEqual(["false", "false"]);
  });

  test("flips the theme shown by the system", () => {
    const page = setup({ system: "dark" });
    page.ready();
    page.click();
    expect(page.root.dataset.theme).toBe("light");
    expect(page.pressed()).toEqual(["false", "false"]);
  });

  test("ignores clicks elsewhere on the page", () => {
    const page = setup({ system: "light" });
    page.ready();
    page.click(elsewhere);
    expect(page.root.dataset.theme).toBeUndefined();
    expect(page.store.size).toBe(0);
  });

  test("wins over later system changes once used", () => {
    const page = setup({ system: "light" });
    page.ready();
    page.click();
    page.systemChangesTo("light");
    expect(page.root.dataset.theme).toBe("dark");
    expect(page.pressed()).toEqual(["true", "true"]);
  });
});

describe("between sessions", () => {
  test("stores the choice", () => {
    const page = setup({ system: "light" });
    page.click();
    expect(page.store.get("theme")).toBe("dark");
    page.click();
    expect(page.store.get("theme")).toBe("light");
  });

  test.each([
    ["light", "dark"],
    ["dark", "light"],
  ] as const)(
    "on a %s system, a stored %s theme is applied before the DOM is parsed",
    (system, stored) => {
      const page = setup({ system, stored });
      expect(page.root.dataset.theme).toBe(stored);
      page.ready();
      const pressed = String(stored === "dark");
      expect(page.pressed()).toEqual([pressed, pressed]);
    },
  );

  test("ignores a stored value that isn't a theme", () => {
    const page = setup({ system: "dark", stored: "purple" });
    page.ready();
    expect(page.root.dataset.theme).toBeUndefined();
    expect(page.pressed()).toEqual(["true", "true"]);
  });
});

describe("when storage is blocked", () => {
  test("follows the system, and the toggle still works without throwing", () => {
    const page = setup({ system: "light", storage: "blocked" });
    page.ready();
    expect(page.root.dataset.theme).toBeUndefined();
    expect(() => page.click()).not.toThrow();
    expect(page.root.dataset.theme).toBe("dark");
    expect(page.pressed()).toEqual(["true", "true"]);
  });
});
