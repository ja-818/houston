import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";

import { Button, cn } from "@houston-ai/core";

import { useLegalAcceptance } from "../../hooks/use-legal-acceptance";
import { PLACEHOLDER_DISCLAIMER_TEXT } from "../../lib/legal";

/**
 * Full-screen security-disclaimer gate. Renders `children` as-is once
 * the user has accepted the current disclaimer version; otherwise
 * blocks the app with a modal overlay that cannot be dismissed except
 * by clicking Accept (enabled only after the user has scrolled to the
 * end of the text) or Decline (closes the window).
 *
 * Must mount INSIDE a `QueryClientProvider` and AFTER the engine
 * handshake — see `DISCLAIMER-WIRING.md`.
 */
export function DisclaimerGate({ children }: { children: ReactNode }) {
  const { isAccepted, isLoading, accept, decline } = useLegalAcceptance();

  if (isLoading) {
    // Neutral silent placeholder — deliberately not the gate. Flashing the
    // gate and then hiding it would look like a bug. Matches the plain
    // background used by EngineGate in main.tsx.
    return (
      <div
        aria-hidden
        className="flex h-screen w-screen items-center justify-center bg-[#0d0d0d]"
      />
    );
  }

  if (isAccepted) return <>{children}</>;

  return <DisclaimerOverlay onAccept={accept} onDecline={decline} />;
}

function DisclaimerOverlay({
  onAccept,
  onDecline,
}: {
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paragraphs = PLACEHOLDER_DISCLAIMER_TEXT.split(/\n{2,}/).map((p) =>
    p.trim(),
  );

  // If the content is short enough that there's nothing to scroll
  // through, unlock the Accept button immediately. Otherwise the user
  // would be stranded with a disabled primary action.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    if (node.scrollHeight <= node.clientHeight + 1) {
      setHasScrolledToEnd(true);
    }
  }, []);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    // 8px tolerance for sub-pixel rounding at the bottom edge.
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - 8) {
      setHasScrolledToEnd(true);
    }
  }, []);

  const handleAccept = useCallback(async () => {
    if (!hasScrolledToEnd || busy) return;
    setBusy("accept");
    setError(null);
    try {
      await onAccept();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(null);
    }
  }, [busy, hasScrolledToEnd, onAccept]);

  const handleDecline = useCallback(async () => {
    if (busy) return;
    setBusy("decline");
    setError(null);
    try {
      await onDecline();
    } catch (err) {
      // If window.close() fails (e.g. in a non-Tauri dev context) we
      // surface it instead of silently swallowing so the user isn't
      // left wondering why nothing happened.
      setError(err instanceof Error ? err.message : String(err));
      setBusy(null);
    }
  }, [busy, onDecline]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-gate-title"
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#0d0d0d] p-6 font-sans text-gray-100"
    >
      <div className="flex max-h-[min(720px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
        <header className="flex flex-col gap-1 border-b border-white/5 px-8 py-6">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Before you continue
          </p>
          <h1
            id="disclaimer-gate-title"
            className="text-2xl font-semibold text-white"
          >
            Security disclaimer
          </h1>
        </header>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 py-6 text-[15px] leading-relaxed text-gray-300"
          data-testid="disclaimer-scroll"
        >
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className={cn(
                "whitespace-pre-wrap",
                i === 0
                  ? "mb-5 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200"
                  : "mb-4 last:mb-0",
              )}
            >
              {para}
            </p>
          ))}
        </div>

        <footer className="flex flex-col gap-3 border-t border-white/5 px-8 py-5">
          <p
            className={cn(
              "text-xs",
              hasScrolledToEnd ? "text-gray-500" : "text-amber-300/80",
            )}
            aria-live="polite"
          >
            {hasScrolledToEnd
              ? "You've reached the end. Accept to continue or Decline to close Houston."
              : "Scroll to the end to enable the Accept button."}
          </p>
          {error ? (
            <p className="text-xs text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleDecline}
              disabled={busy !== null}
              className="border-black/15 bg-transparent text-gray-200 hover:bg-white/5"
            >
              {busy === "decline" ? "Closing…" : "Decline"}
            </Button>
            <Button
              type="button"
              onClick={handleAccept}
              disabled={!hasScrolledToEnd || busy !== null}
              className="bg-gray-950 text-white hover:bg-black"
            >
              {busy === "accept" ? "Saving…" : "Accept"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
