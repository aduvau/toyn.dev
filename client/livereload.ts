// Dev only: injected by the serve command, never part of the static build.

const SCROLL_KEY = `toyn:scroll:${location.pathname}`;
const RETRY_MS = 1000;
/** Charts draw a frame or two after load, so keep re-applying the scroll until it sticks. */
const MAX_RESTORE_FRAMES = 60;

function reload() {
  try {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  } catch {}
  // Our own restore below handles it; the browser's would be clamped by charts not drawn yet.
  history.scrollRestoration = "manual";
  location.reload();
}

function restoreScroll() {
  let saved: string | null = null;
  try {
    saved = sessionStorage.getItem(SCROLL_KEY);
    sessionStorage.removeItem(SCROLL_KEY);
  } catch {}
  history.scrollRestoration = "auto";
  if (saved === null) return;
  const y = Number(saved);
  let frames = 0;
  const step = () => {
    window.scrollTo(0, y);
    if (Math.abs(window.scrollY - y) > 1 && ++frames < MAX_RESTORE_FRAMES) {
      requestAnimationFrame(step);
    }
  };
  step();
}

/** Reloads on a `reload` message. If the server goes away, retries and reloads once it's back. */
function connect(wasDisconnected: boolean) {
  const socket = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/__livereload`,
  );
  socket.addEventListener("open", () => {
    if (wasDisconnected) reload();
  });
  socket.addEventListener("message", (event) => {
    if (event.data === "reload") reload();
  });
  socket.addEventListener("close", () => {
    setTimeout(() => connect(true), RETRY_MS);
  });
}

if (document.readyState === "complete") restoreScroll();
else window.addEventListener("load", restoreScroll, { once: true });
connect(false);
