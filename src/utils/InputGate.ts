import type Phaser from 'phaser';

/**
 * Per-scene input lock + debounce so Space/Enter key-repeat from a prior
 * scene (or lag spikes) cannot skip panels / crawl accidentally.
 */
export class InputGate {
  private lockedUntil = 0;
  private lastAccept = 0;
  private debounceMs: number;

  constructor(lockMs = 500, debounceMs = 450) {
    this.debounceMs = debounceMs;
    this.lock(lockMs);
  }

  /** Call at scene create (or when re-entering). */
  lock(ms: number) {
    this.lockedUntil = performance.now() + ms;
  }

  canAccept(now = performance.now()): boolean {
    if (now < this.lockedUntil) return false;
    if (now - this.lastAccept < this.debounceMs) return false;
    return true;
  }

  /** Returns true once and stamps debounce; false if still locked. */
  tryAccept(now = performance.now()): boolean {
    if (!this.canAccept(now)) return false;
    this.lastAccept = now;
    return true;
  }
}

/** Focus game canvas and capture common UI keys. */
export function focusGameCanvas(game: Phaser.Game) {
  const canvas = game.canvas;
  if (!canvas) return;
  canvas.setAttribute('tabindex', '0');
  canvas.style.outline = 'none';
  try {
    canvas.focus({ preventScroll: true });
  } catch {
    canvas.focus();
  }
}
