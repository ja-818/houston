/**
 * ChatInput — prompt input with file attachments.
 *
 * Attachments render as cards ABOVE the composer (outside overflow-clip).
 * The + button triggers a native file input programmatically via a ref
 * (label+htmlFor is flaky in Tauri's WKWebView after the first invocation).
 *
 * Drag-and-drop is handled at the ChatPanel level so the entire panel is a
 * drop target, not just the composer. ChatInput itself does not install
 * drop handlers.
 *
 * Controlled vs uncontrolled:
 * - Text and attachments can each be controlled by passing `value`+`onValueChange`
 *   or `attachments`+`onAttachmentsChange`. When omitted, the component manages
 *   its own internal state and clears it after `onSend`. In controlled mode the
 *   parent is responsible for clearing its own state.
 */

import { useCallback, useRef } from "react";
import type { PromptInputMessage } from "./ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
} from "./ai-elements/prompt-input";
import { PlusIcon } from "lucide-react";
import { ComposerTrailing } from "./attachment-chip";
import { AttachmentStrip } from "./chat-input-parts";
import { useControllable } from "./use-file-drop-zone";
import { useMentionPicker } from "./use-mention-picker";
import type { MentionConfig } from "./use-mention-picker";
import { MentionPicker } from "./mention-picker";
import { useFileAttachments } from "./use-file-attachments";

type InputStatus = "ready" | "streaming" | "submitted";

export interface ChatInputProps {
  /** Controlled text. Omit to use internal state. */
  value?: string;
  /** Required if `value` is provided. */
  onValueChange?: (value: string) => void;
  /** Controlled attachments. Omit to use internal state. */
  attachments?: File[];
  /** Required if `attachments` is provided. */
  onAttachmentsChange?: (files: File[]) => void;
  /** Called on submit. The current text + files are always passed for convenience. */
  onSend: (text: string, files: File[]) => void;
  onStop?: () => void;
  status?: InputStatus;
  placeholder?: string;
  /** Emitted when the library wants to surface a short notice to the user
   *  (e.g. a duplicate-file drop). The app decides how to display it. */
  onNotice?: (message: string) => void;
  /**
   * Optional `@` mention config. When provided, typing `@` opens a filter
   * picker. Selecting an option inserts `@label` at the caret. On submit,
   * `transformOnSend` (if set) rewrites the text before `onSend` is called.
   */
  mentions?: MentionConfig;
}

export function ChatInput({
  value,
  onValueChange,
  attachments,
  onAttachmentsChange,
  onSend,
  onStop,
  status = "ready",
  placeholder = "Type a message...",
  onNotice,
  mentions,
}: ChatInputProps) {
  const [text, setText] = useControllable(value, onValueChange, "");
  const [files, setFiles] = useControllable<File[]>(
    attachments,
    onAttachmentsChange,
    [],
  );
  const isTextControlled = value !== undefined;
  const isFilesControlled = attachments !== undefined;

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mention = useMentionPicker({
    text,
    setText,
    textareaRef,
    config: mentions,
  });
  const { fileInputRef, openFilePicker, handleFileChange, removeFile } =
    useFileAttachments({ files, setFiles, onNotice });

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Capture the live textarea element so the mention hook can restore
      // caret position after insertion. PromptInputTextarea does not forward
      // refs, so we lazily grab it from the event target.
      textareaRef.current = e.target;
      if (mentions) {
        mention.handleTextChange(e);
      } else {
        setText(e.target.value);
      }
    },
    [mentions, mention, setText],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      textareaRef.current = e.currentTarget;
      // Mention picker keys (Arrow/Enter/Tab/Esc) take priority while open.
      if (mentions) {
        mention.handleKeyDown(e);
        if (e.defaultPrevented) return;
      }
      if (e.key === "Escape" && status === "streaming" && onStop) {
        e.preventDefault();
        onStop();
      }
    },
    [mentions, mention, status, onStop],
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const trimmed = message.text?.trim();
      if (!trimmed && files.length === 0) return;
      const finalText = mentions?.transformOnSend
        ? mentions.transformOnSend(trimmed ?? "")
        : (trimmed ?? "");
      onSend(finalText, files);
      // In uncontrolled mode, clear our own state. In controlled mode the
      // parent is responsible for clearing.
      if (!isTextControlled) setText("");
      if (!isFilesControlled) setFiles([]);
    },
    [
      onSend,
      files,
      isTextControlled,
      isFilesControlled,
      setText,
      setFiles,
      mentions,
    ],
  );

  const hasContent = text.trim().length > 0 || files.length > 0;

  return (
    <div className="shrink-0 px-4 pb-6 pt-2">
      <div className="max-w-3xl mx-auto relative">
        <AttachmentStrip
          files={files}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          onRemove={removeFile}
        />

        {mention.open && (
          <MentionPicker
            options={mention.filtered}
            selectedIndex={mention.selectedIndex}
            onSelect={mention.insert}
          />
        )}

        <PromptInput onSubmit={handleSubmit}>
          {/* + button — ref-based click, reliable across invocations */}
          <div className="flex items-center [grid-area:leading]">
            <button
              type="button"
              onClick={openFilePicker}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
              aria-label="Attach files"
            >
              <PlusIcon className="size-5" />
            </button>
          </div>

          <PromptInputBody>
            <PromptInputTextarea
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              value={text}
              placeholder={placeholder}
            />
          </PromptInputBody>

          <ComposerTrailing
            status={status}
            hasContent={hasContent}
            onStop={onStop}
          />
        </PromptInput>
      </div>
    </div>
  );
}
