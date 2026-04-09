/**
 * Internal sub-components for ChatInput.
 * Not exported from the package index — used only by chat-input.tsx.
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FileIcon, XIcon } from "lucide-react";
import { AttachmentChip } from "./attachment-chip";

// ---------------------------------------------------------------------------
// AttachmentStrip — hidden native file input + the row of attachment chips
// above the composer. Kept out of chat-input.tsx to respect the 200-line cap.
// ---------------------------------------------------------------------------

export interface AttachmentStripProps {
  files: File[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}

export function AttachmentStrip({
  files,
  fileInputRef,
  onFileChange,
  onRemove,
}: AttachmentStripProps) {
  return (
    <>
      {/* Native file input — hidden, triggered programmatically via ref */}
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
              onRemove={() => onRemove(idx)}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// FileChip — shows an attached file with a remove button
// ---------------------------------------------------------------------------

export interface FileChipProps {
  name: string;
  onRemove: () => void;
}

export function FileChip({ name, onRemove }: FileChipProps) {
  return (
    <div className="flex items-center gap-1 bg-secondary border border-black/[0.08] rounded-md px-2 py-1 text-xs text-foreground">
      <FileIcon className="size-3 shrink-0 text-muted-foreground" />
      <span className="max-w-[140px] truncate">{name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label={`Remove ${name}`}
      >
        <XIcon className="size-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AttachMenu — portal-rendered popup triggered by the + button.
// ---------------------------------------------------------------------------

export interface AttachMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface AttachMenuProps {
  items: AttachMenuItem[];
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function AttachMenu({ items, onClose, anchorRef }: AttachMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<{ left: number; bottom: number } | null>(null);

  if (!posRef.current && anchorRef.current) {
    const rect = anchorRef.current.getBoundingClientRect();
    posRef.current = { left: rect.left, bottom: window.innerHeight - rect.top + 6 };
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const pos = posRef.current;

  const menu = (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[180px] rounded-xl border border-black/[0.08] bg-white shadow-lg py-1"
        style={pos ? { left: pos.left, bottom: pos.bottom } : { left: 0, bottom: 0, visibility: "hidden" as const }}
        role="menu"
      >
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            role="menuitem"
            onClick={() => { item.onClick(); onClose(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </>
  );

  return createPortal(menu, document.body);
}
