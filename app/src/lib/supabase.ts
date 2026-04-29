import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { invoke } from "@tauri-apps/api/core";
import { resolveAuthStorageConfig } from "./auth-storage";

// __SUPABASE_URL__ / __SUPABASE_ANON_KEY__ baked at build time by Vite.
// Empty values → Supabase client still constructs but all auth calls are
// no-ops (isAuthConfigured() returns false so the UI won't attempt sign-in).
const URL_ = typeof __SUPABASE_URL__ !== "undefined" ? __SUPABASE_URL__ : "";
const KEY = typeof __SUPABASE_ANON_KEY__ !== "undefined" ? __SUPABASE_ANON_KEY__ : "";

/**
 * Release storage adapter that round-trips to Rust via the `auth_*` Tauri
 * commands, so Supabase session tokens live in macOS Keychain / Windows
 * Credential Manager, never localStorage or disk. Supabase stores the PKCE
 * code verifier here too during OAuth, so release auth is Keychain-backed.
 */
const keychainStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await invoke<string | null>("auth_get_item", { key });
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await invoke("auth_set_item", { key, value });
    } catch {
      // Keychain unavailable — session won't persist across launches, but the
      // in-memory session on this run still works.
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await invoke("auth_remove_item", { key });
    } catch {
      // best-effort
    }
  },
};

const browserStorage = {
  getItem(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Dev fallback. Session won't persist if browser storage is blocked.
    }
  },
  removeItem(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // best-effort
    }
  },
};

const authStorageConfig = resolveAuthStorageConfig({
  storageMode:
    typeof __HOUSTON_AUTH_STORAGE_MODE__ !== "undefined"
      ? __HOUSTON_AUTH_STORAGE_MODE__
      : "browser",
  storageScope:
    typeof __HOUSTON_AUTH_STORAGE_SCOPE__ !== "undefined"
      ? __HOUSTON_AUTH_STORAGE_SCOPE__
      : "",
});

export const supabase: SupabaseClient = createClient(
  URL_ || "https://placeholder.supabase.co",
  KEY || "placeholder-anon-key",
  {
    auth: {
      storage:
        authStorageConfig.mode === "keychain" ? keychainStorage : browserStorage,
      storageKey: authStorageConfig.storageKey,
      autoRefreshToken: true,
      persistSession: true,
      // We listen for the deep-link URL in the app and call
      // `exchangeCodeForSession` ourselves — disable the built-in URL sniffer
      // so Supabase doesn't also try to consume window.location.
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  },
);

export const isAuthConfigured = (): boolean => Boolean(URL_ && KEY);
