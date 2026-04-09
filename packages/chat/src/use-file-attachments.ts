/**
 * useFileAttachments — keeps the composer file-attachment wiring out of
 * `chat-input.tsx`. Owns the hidden native input ref, the add/remove/open
 * handlers, and dedupe logic.
 */

import { useCallback, useRef } from "react";
import { mergeUniqueFiles } from "./use-file-drop-zone";

export interface UseFileAttachmentsArgs {
  files: File[];
  setFiles: (files: File[]) => void;
  onNotice?: (message: string) => void;
}

export interface UseFileAttachmentsResult {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  openFilePicker: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
}

export function useFileAttachments({
  files,
  setFiles,
  onNotice,
}: UseFileAttachmentsArgs): UseFileAttachmentsResult {
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

  return { fileInputRef, openFilePicker, handleFileChange, removeFile };
}
