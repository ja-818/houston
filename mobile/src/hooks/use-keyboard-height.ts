import { useEffect, useState } from "react";

/**
 * Track the keyboard height on mobile browsers using `window.visualViewport`.
 *
 * When the on-screen keyboard opens, the visual viewport shrinks relative to
 * the layout viewport. The difference is the keyboard height.
 *
 * Falls back to 0 when `visualViewport` isn't available (older browsers).
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const delta = Math.max(0, window.innerHeight - vv.height);
      setHeight(delta);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}
