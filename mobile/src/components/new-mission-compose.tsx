import { useEffect, useRef } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import type { AgentNameEntry } from "@/lib/types";
import { HoustonAvatar } from "./houston-avatar";

interface Props {
  agent: AgentNameEntry;
  text: string;
  setText: (t: string) => void;
  sending: boolean;
  error: string | null;
  connected: boolean;
  onBack: () => void;
  onSend: () => void;
}

/** Step 2 of the new-mission sheet: compose the first message. */
export function NewMissionCompose({
  agent,
  text,
  setText,
  sending,
  error,
  connected,
  onBack,
  onSend,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus once the compose step opens.
  useEffect(() => {
    const id = window.setTimeout(() => textareaRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  const canSend = !sending && connected && text.trim().length > 0;

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          disabled={sending}
          className="touchable flex size-9 items-center justify-center rounded-full text-muted-foreground disabled:opacity-50"
        >
          <ArrowLeft className="size-5" />
        </button>
        <HoustonAvatar ringSize={36} glyphSize={18} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{agent.name}</p>
          <p className="truncate text-xs text-muted-foreground">New mission</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={sending}
          placeholder={`What should ${agent.name} do?`}
          className="min-h-[140px] w-full flex-1 resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/30 disabled:opacity-60"
        />

        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        {!connected && !error && (
          <p className="text-xs text-muted-foreground">
            Reconnecting to desktop…
          </p>
        )}

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="touchable flex h-12 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background disabled:opacity-50"
        >
          {sending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Starting mission…
            </>
          ) : (
            <>
              <Send className="size-4" />
              Start mission
            </>
          )}
        </button>
      </div>
    </>
  );
}
