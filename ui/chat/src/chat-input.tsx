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
import type { ReactNode } from "react";
import type { PromptInputMessage } from "./ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputBody,
  PromptInputHeader,
  PromptInputTextarea,
} from "./ai-elements/prompt-input";
import { PlusIcon } from "lucide-react";
import { AttachmentChip, ComposerTrailing } from "./attachment-chip";
import { useControllable, mergeUniqueFiles } from "./use-file-drop-zone";

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
  /** Optional content rendered in the composer footer (e.g. model selector). */
  footer?: ReactNode;
  /** Optional content rendered inside the composer above the textarea. */
  header?: ReactNode;
  /** Enables submit even when text/files are empty. */
  canSendEmpty?: boolean;
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
  footer,
  header,
  canSendEmpty = false,
}: ChatInputProps) {
  const [text, setText] = useControllable(value, onValueChange, "");
  const [files, setFiles] = useControllable<File[]>(
    attachments,
    onAttachmentsChange,
    [],
  );
  const isTextControlled = value !== undefined;
  const isFilesControlled = attachments !== undefined;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFiles = useCallback(
    (incoming: File[]) => {
      const merged = mergeUniqueFiles(files, incoming);
      if (merged.length < files.length + incoming.length) {
        onNotice?.("File already in chat");
      }
      setFiles(merged);
    },
    [files, setFiles, onNotice],
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value),
    [setText],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape" && status === "streaming" && onStop) {
        e.preventDefault();
        onStop();
      }
    },
    [status, onStop],
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const trimmed = message.text?.trim();
      if (!trimmed && files.length === 0 && !canSendEmpty) return;
      onSend(trimmed ?? "", files);
      // In uncontrolled mode, clear our own state. In controlled mode the
      // parent is responsible for clearing.
      if (!isTextControlled) setText("");
      if (!isFilesControlled) setFiles([]);
    },
    [onSend, files, canSendEmpty, isTextControlled, isFilesControlled, setText, setFiles],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    },
    [addFiles],
  );

  const openFilePicker = useCallback(() => {
    const input = fileInputRef.current;
    if (!input) return;
    // Reset BEFORE click so the same file can be re-picked and so WKWebView
    // doesn't hold onto stale state between invocations.
    input.value = "";
    input.click();
  }, []);

  const removeFile = useCallback(
    (index: number) => setFiles(files.filter((_, i) => i !== index)),
    [files, setFiles],
  );

  const hasContent = canSendEmpty || text.trim().length > 0 || files.length > 0;

  return (
    <div className="shrink-0 px-4 pb-6 pt-2">
      <div className="max-w-3xl mx-auto relative">
        {/* Native file input — hidden, triggered programmatically via ref */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={handleFileChange}
          tabIndex={-1}
        />

        {/* Attachment cards — ABOVE the composer, always-visible scrollbar */}
        {files.length > 0 && (
          <div
            className="flex gap-2 pb-1 mb-2 overflow-x-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            {files.map((file, idx) => (
              <AttachmentChip
                key={`${file.name}-${idx}`}
                name={file.name}
                onRemove={() => removeFile(idx)}
              />
            ))}
          </div>
        )}

        <PromptInput onSubmit={handleSubmit}>
          {header && (
            <PromptInputHeader className="pb-1">
              {header}
            </PromptInputHeader>
          )}

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

        {footer && (
          <div className="flex items-center px-1 pt-1">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
