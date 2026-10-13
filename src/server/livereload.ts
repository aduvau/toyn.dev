import { existsSync, type FSWatcher, watch } from "node:fs";

export interface Watcher {
  close(): void;
}

/**
 * Watches `dirs` recursively and calls `onChange` once per burst of changes, `debounceMs` after
 * the last one, with the watched dirs that saw a change. Missing dirs are skipped. A burst that
 * arrives while `onChange` is still running is delivered after it finishes.
 *
 * Filenames are deliberately ignored: on macOS, Bun reports only the source of a rename (so an
 * atomic save of `a.md` shows up as `.a.md.tmp`) and drops the names of quick successive writes.
 * Filtering on them would miss real changes.
 */
export function watchDirs(
  dirs: string[],
  onChange: (dirs: Set<string>) => void | Promise<void>,
  debounceMs = 100,
): Watcher {
  let pending = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> = Promise.resolve();

  const flush = () => {
    timer = undefined;
    const changed = pending;
    pending = new Set();
    running = running.then(async () => {
      try {
        await onChange(changed);
      } catch (e) {
        console.error(e);
      }
    });
  };

  const watchers: FSWatcher[] = dirs.filter(existsSync).map((dir) =>
    watch(dir, { recursive: true }, () => {
      pending.add(dir);
      clearTimeout(timer);
      timer = setTimeout(flush, debounceMs);
    }),
  );

  return {
    close() {
      clearTimeout(timer);
      for (const w of watchers) w.close();
    },
  };
}
