export function runLoop(step: (dtMs: number) => void, now: () => number): void {
  let last = now();
  const frame = () => {
    const t = now();
    const dt = Math.max(0, Math.min(48, t - last));
    last = t;
    step(dt);
    nextFrame(frame);
  };
  frame();
}

function nextFrame(cb: () => void): void {
  const host = globalThis as unknown as {
    requestAnimationFrame?: (fn: () => void) => number;
  };
  if (typeof host.requestAnimationFrame === 'function') host.requestAnimationFrame(cb);
  else setTimeout(cb, 16);
}
