import type { ChangeEvent, RefObject } from "react";
import { PlusIcon } from "lucide-react";
import { AttachmentChip } from "./attachment-chip";

interface ChatInputAttachmentsProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  files: File[];
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

export function ChatInputAttachments({
  fileInputRef,
  files,
  onFileChange,
  onRemoveFile,
}: ChatInputAttachmentsProps) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={onFileChange}
        tabIndex={-1}
      />

      {files.length > 0 && (
        <div
          className="flex gap-2 pb-1 mb-2 overflow-x-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {files.map((file, idx) => (
            <AttachmentChip
              key={`${file.name}-${idx}`}
              name={file.name}
              onRemove={() => onRemoveFile(idx)}
            />
          ))}
        </div>
      )}

    </>
  );
}

export function ChatInputAttachButton({
  onOpenFilePicker,
}: {
  onOpenFilePicker: () => void;
}) {
  return (
    <div className="flex items-center [grid-area:leading]">
      <button
        type="button"
        onClick={onOpenFilePicker}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
        aria-label="Attach files"
      >
        <PlusIcon className="size-5" />
      </button>
    </div>
  );
}
