// Typed wrapper around `localStorage` for the PWA's persisted state.
//
// Keys are versioned (`v1.*`) so a future schema change can invalidate
// stale entries without colliding. Values are JSON; unknown or
// corrupted entries are dropped on read rather than surfacing a parse
// error to the caller.

export interface PairedEngine {
  baseUrl: string;
  engineToken: string;
  deviceLabel: string;
  tunnelId: string;
  pairedAt: string;
}

const KEY_PAIRED = "v1.paired-engine";

function getRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setRaw(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* quota/private-mode — silently skip; engine can still run for the
     * lifetime of the tab, just won't persist across reloads. */
  }
}

export function loadPaired(): PairedEngine | null {
  const raw = getRaw(KEY_PAIRED);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PairedEngine;
  } catch {
    setRaw(KEY_PAIRED, null);
    return null;
  }
}

export function savePaired(p: PairedEngine): void {
  setRaw(KEY_PAIRED, JSON.stringify(p));
}

export function clearPaired(): void {
  setRaw(KEY_PAIRED, null);
}
