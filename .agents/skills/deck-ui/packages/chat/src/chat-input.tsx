/**
 * ChatInput -- THE single prompt input used everywhere in the app.
 * Extracted from ChatPanel. Do not duplicate -- import this component.
 * 8 hours of manual tuning went into this. Touch with care.
 */

import { useCallback, useState } from "react";
import type { PromptInputMessage } from "./ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
} from "./ai-elements/prompt-input";
import { AudioLinesIcon, MicIcon, PlusIcon } from "lucide-react";

type InputStatus = "ready" | "streaming" | "submitted";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop?: () => void;
  status?: InputStatus;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStop,
  status = "ready",
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [text, setText] = useState("");

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value),
    [],
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const trimmed = message.text?.trim();
      if (!trimmed) return;
      onSend(trimmed);
      setText("");
    },
    [onSend],
  );

  return (
    <div className="shrink-0 px-4 pb-6 pt-10">
      <div className="max-w-3xl mx-auto">
        <PromptInput onSubmit={handleSubmit}>
          <div className="flex items-center [grid-area:leading]">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
              aria-label="Add files"
            >
              <PlusIcon className="size-5" />
            </button>
          </div>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={handleTextChange}
              value={text}
              placeholder={placeholder}
            />
          </PromptInputBody>
          <div className="flex items-center gap-1.5 [grid-area:trailing]">
            {status === "ready" && (
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
                aria-label="Dictate"
              >
                <MicIcon className="size-5" />
              </button>
            )}
            {!text.trim() && status === "ready" ? (
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors"
                aria-label="Voice mode"
              >
                <AudioLinesIcon className="size-5" />
              </button>
            ) : (
              <PromptInputSubmit status={status} onStop={onStop} />
            )}
          </div>
        </PromptInput>
      </div>
    </div>
  );
}
