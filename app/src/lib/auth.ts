import { listen } from "@tauri-apps/api/event";
import { supabase, isAuthConfigured } from "./supabase";
import { tauriSystem } from "./tauri";
import { analytics } from "./analytics";
import { logger } from "./logger";

// HTTPS bridge instead of a raw deep link so the user lands on a polished
// "Sign-in complete, you can close this tab" page after Google. The bridge
// at gethouston.ai/auth/callback then forwards the PKCE code into the
// `houston://auth-callback?code=...` deep link so macOS / Windows hand
// it to the running app. See website/src/auth/callback/index.html.
const REDIRECT_URI = "https://gethouston.ai/auth/callback/";

/**
 * Kick off an OAuth flow for the given provider. Supabase generates a
 * fresh PKCE verifier (stored in Keychain via our storage adapter),
 * returns an auth URL, and we open it in the user's system browser.
 * After consent the browser redirects to `houston://auth-callback?code=...`,
 * which the deep-link handler in Rust forwards to `installDeepLinkListener`.
 *
 * Idempotent — re-calling kicks off a brand-new PKCE flow, which is
 * exactly what the user wants when they hit the wrong browser profile,
 * abort consent, or generally need to retry.
 */
async function signInWithProvider(
  provider: "google" | "azure",
): Promise<void> {
  if (!isAuthConfigured()) {
    throw new Error("Auth not configured");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: REDIRECT_URI,
      // Don't let Supabase touch window.location — we're in a webview and
      // need the consent page to open in the user's real browser.
      skipBrowserRedirect: true,
      // Microsoft (Entra) needs the standard OIDC trio plus
      // `offline_access` to issue a refresh token; without it Supabase
      // gets the ID token but no way to refresh, and the session goes
      // stale on the first reload. Matches Supabase's documented azure
      // default. We deliberately don't request `profile` / `User.Read`
      // since Houston only needs the email + sub claims for sign-in.
      ...(provider === "azure"
        ? {
            scopes: "openid email offline_access",
            // Force the account picker so users with multiple Microsoft
            // accounts (work + personal) can choose; otherwise Microsoft
            // silently picks the last-used one which is the #1 source of
            // "wrong account" sign-in confusion.
            queryParams: { prompt: "select_account" },
          }
        : {}),
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("Supabase returned no auth URL");

  await tauriSystem.openUrl(data.url);
}

/**
 * Subscribers notified whenever the deep-link / PKCE exchange path
 * surfaces an OAuth error (provider-side error, code exchange failure,
 * malformed callback URL). Wired up so [`SignInScreen`] can display the
 * real provider message instead of a generic "Something went wrong".
 */
type AuthErrorListener = (message: string) => void;
const authErrorListeners = new Set<AuthErrorListener>();

export function onAuthError(cb: AuthErrorListener): () => void {
  authErrorListeners.add(cb);
  return () => authErrorListeners.delete(cb);
}

function emitAuthError(message: string): void {
  for (const cb of authErrorListeners) {
    try {
      cb(message);
    } catch (e) {
      logger.warn(`[auth] error listener threw: ${e}`);
    }
  }
}

export const signInWithGoogle = (): Promise<void> => signInWithProvider("google");
export const signInWithMicrosoft = (): Promise<void> => signInWithProvider("azure");

/**
 * Sign out: clear the Supabase session (our Keychain storage adapter
 * removes the tokens) and reset PostHog's distinct_id so subsequent
 * anonymous events don't accrue to the prior user.
 */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    logger.warn(`[auth] signOut failed: ${e}`);
  }
  analytics.reset();
}

let deepLinkInstalled = false;

/**
 * Listen for `auth://deep-link` events emitted by the Rust deep-link
 * handler (see `app/src-tauri/src/auth.rs`). Extracts the `code` param
 * from the callback URL and completes the PKCE exchange to populate the
 * Supabase session in Keychain.
 *
 * Idempotent — safe to call more than once per app lifetime.
 */
export function installDeepLinkListener(): () => void {
  if (deepLinkInstalled) return () => {};
  deepLinkInstalled = true;

  const unlistenPromise = listen<string>("auth://deep-link", async (event) => {
    const rawUrl = event.payload;
    logger.info(`[auth] deep-link received: ${rawUrl}`);

    try {
      const url = new URL(rawUrl);
      // OAuth errors can land in the query string (PKCE code flow) OR the
      // fragment (implicit flow / some Microsoft Entra paths). Check both.
      const fragmentParams = new URLSearchParams(
        url.hash.startsWith("#") ? url.hash.slice(1) : url.hash,
      );
      const code = url.searchParams.get("code");
      const errorParam =
        url.searchParams.get("error_description") ||
        url.searchParams.get("error") ||
        fragmentParams.get("error_description") ||
        fragmentParams.get("error");

      if (errorParam) {
        logger.error(`[auth] OAuth error: ${errorParam}`);
        emitAuthError(errorParam);
        return;
      }

      if (!code) {
        logger.warn("[auth] deep-link had no `code` param — ignoring");
        emitAuthError(
          "Sign-in callback was missing the authorization code.",
        );
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        logger.error(`[auth] exchangeCodeForSession failed: ${error.message}`);
        emitAuthError(error.message);
        return;
      }

      logger.info(`[auth] session established for ${data.user?.email}`);
    } catch (e) {
      logger.error(`[auth] failed to handle deep-link: ${e}`);
      emitAuthError(String(e));
    }
  });

  return () => {
    unlistenPromise.then((fn) => fn()).catch(() => {});
    deepLinkInstalled = false;
  };
}
