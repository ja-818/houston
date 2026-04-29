export const RELEASE_AUTH_STORAGE_KEY = "houston-auth";

const LOCAL_AUTH_STORAGE_PREFIX = "houston-auth-local";
const FALLBACK_LOCAL_SCOPE = "default";

export type AuthStorageMode = "keychain" | "browser";

export type AuthStorageConfig = {
  mode: AuthStorageMode;
  storageKey: string;
};

type AuthStorageOptions = {
  storageMode: string;
  storageScope: string;
};

export function normalizeAuthStorageMode(mode: string): AuthStorageMode {
  return mode === "keychain" ? "keychain" : "browser";
}

export function createLocalAuthStorageKey(storageScope: string): string {
  const scope = storageScope.trim() || FALLBACK_LOCAL_SCOPE;
  return `${LOCAL_AUTH_STORAGE_PREFIX}-${scope}`;
}

export function resolveAuthStorageConfig({
  storageMode,
  storageScope,
}: AuthStorageOptions): AuthStorageConfig {
  if (normalizeAuthStorageMode(storageMode) === "keychain") {
    return {
      mode: "keychain",
      storageKey: RELEASE_AUTH_STORAGE_KEY,
    };
  }

  return {
    mode: "browser",
    storageKey: createLocalAuthStorageKey(storageScope),
  };
}
