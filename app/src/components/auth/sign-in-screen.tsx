import { useState } from "react";
import { Button } from "@houston-ai/core";
import { HoustonLogo } from "../shell/experience-card";
import { signInWithGoogle, signInWithMicrosoft } from "../../lib/auth";
import { logger } from "../../lib/logger";

type Provider = "google" | "microsoft";

/**
 * Full-screen sign-in overlay. Rendered by App.tsx when Supabase is
 * configured but no session is present. Keeps copy product-benefit-focused
 * — the audience is non-technical, so no mention of OAuth / tokens / APIs.
 *
 * Re-click semantics: the loading spinner is only on while the system
 * browser is being opened (a few ms). After that, the user is free to
 * click any provider again — useful when they land on the wrong browser
 * profile and need to retry. The PKCE flow is regenerated each click.
 */
export function SignInScreen() {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = (provider: Provider) => async () => {
    setPending(provider);
    setError(null);
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithMicrosoft();
      }
    } catch (e) {
      logger.error(`[auth] ${provider} sign-in failed: ${e}`);
      setError("Something went wrong. Please try again.");
    } finally {
      // Re-enable the buttons immediately once the browser is open. The
      // SignInScreen itself unmounts when the deep-link callback flips the
      // session, so we don't need a "waiting for callback" loading state.
      setPending(null);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground px-6">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        <HoustonLogo size={48} />
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Welcome to Houston</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to save your agents and keep everything in sync.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Button
            onClick={handleSignIn("google")}
            disabled={pending !== null}
            className="w-full rounded-full h-11 flex items-center justify-center gap-2"
          >
            <GoogleIcon />
            {pending === "google" ? "Opening browser..." : "Continue with Google"}
          </Button>

          <Button
            variant="outline"
            onClick={handleSignIn("microsoft")}
            disabled={pending !== null}
            className="w-full rounded-full h-11 flex items-center justify-center gap-2"
          >
            <MicrosoftIcon />
            {pending === "microsoft"
              ? "Opening browser..."
              : "Continue with Microsoft"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Wrong browser profile? Just click again to retry.
        </p>

        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#F25022" d="M0 0h11v11H0z" />
      <path fill="#7FBA00" d="M12 0h11v11H12z" />
      <path fill="#00A4EF" d="M0 12h11v11H0z" />
      <path fill="#FFB900" d="M12 12h11v11H12z" />
    </svg>
  );
}
