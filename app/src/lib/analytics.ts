import posthog from "posthog-js";
import { getInstallId } from "./install-id";

// __POSTHOG_KEY__, __POSTHOG_HOST__, __APP_VERSION__ declared in vite-env.d.ts,
// baked at build time by Vite from POSTHOG_KEY / POSTHOG_HOST env vars.
const KEY = typeof __POSTHOG_KEY__ !== "undefined" ? __POSTHOG_KEY__ : "";
const HOST =
  typeof __POSTHOG_HOST__ !== "undefined" && __POSTHOG_HOST__
    ? __POSTHOG_HOST__
    : "https://us.i.posthog.com";

// Bootstrap PostHog at module load so events fired before `analytics.init()`
// finishes are still captured (posthog-js silently drops capture calls made
// before init). A temporary auto-generated distinct_id is used until the
// persisted install_id resolves and `identify()` switches to it.
let bootstrapped = false;
function bootstrap() {
  if (bootstrapped || !KEY) return;
  bootstrapped = true;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: "always",
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    loaded: (ph) => {
      ph.register({
        app_version: typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0",
        os: typeof navigator !== "undefined" ? navigator.platform : "unknown",
        is_debug: import.meta.env.DEV,
      });
    },
  });
}
bootstrap();

type Props = Record<string, string | number | boolean>;

/**
 * Fire-and-forget analytics wrapper. Never throws, never blocks.
 * Empty POSTHOG_KEY → silent no-op (local dev without secrets).
 */
export const analytics = {
  /**
   * Resolve the persistent install_id and identify the PostHog distinct_id.
   * Call once on app mount. Returns `isNew` so callers can derive the
   * `user_returned` event.
   */
  init: async (): Promise<{ installId: string; isNew: boolean }> => {
    if (!KEY) return { installId: "", isNew: false };
    const { id, isNew } = await getInstallId();
    try {
      posthog.identify(id);
      posthog.register({ install_id: id });
    } catch {
      // Analytics unavailable
    }
    return { installId: id, isNew };
  },

  track: (event: string, props?: Props) => {
    if (!KEY) return;
    try {
      posthog.capture(event, props);
    } catch {
      // Analytics unavailable
    }
  },

  /** Register a PostHog group (e.g., workspace). Enables per-group retention. */
  group: (type: string, key: string, props?: Props) => {
    if (!KEY) return;
    try {
      posthog.group(type, key, props);
    } catch {
      // Analytics unavailable
    }
  },

  /**
   * Merge anonymous install_id history into an identified user. Call on sign-in.
   * Reserved for PR 2 (Supabase auth) — safe to call now, no-op without KEY.
   */
  alias: (userId: string, traits?: Props) => {
    if (!KEY) return;
    try {
      posthog.alias(userId);
      posthog.identify(userId, traits);
    } catch {
      // Analytics unavailable
    }
  },

  /** Reset to a fresh anonymous distinct_id. Call on sign-out. */
  reset: () => {
    if (!KEY) return;
    try {
      posthog.reset();
    } catch {
      // Analytics unavailable
    }
  },
};
