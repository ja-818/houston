// Small persistent banner that shows when the engine is unreachable.
// Mobile keeps rendering cached TanStack Query state underneath so the
// user always sees *something* — we just disable writes via the banner.

import { useEffect, useState } from "react";
import { getEngine, isEngineReady } from "../lib/engine";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (!isEngineReady()) return;
    let alive = true;
    async function ping() {
      try {
        await getEngine().health();
        if (alive) setOnline(true);
      } catch {
        if (alive) setOnline(false);
      }
    }
    ping();
    const id = setInterval(ping, 10_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (online) return null;
  return (
    <div className="w-full bg-destructive/90 px-4 py-2 text-center text-xs font-medium text-white">
      Your Mac is unreachable. Showing the last known state.
    </div>
  );
}
