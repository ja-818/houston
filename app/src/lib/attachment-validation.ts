export const MAX_COMPOSER_ATTACHMENT_BYTES = 100 * 1024 * 1024;

export interface ComposerAttachmentFile {
  name: string;
  size: number;
  type?: string;
}

export type ComposerAttachmentRejectReason =
  | { kind: "blockedType"; extension?: string }
  | { kind: "tooLarge"; maxBytes: number };

export interface ComposerAttachmentRejection<T extends ComposerAttachmentFile> {
  file: T;
  reason: ComposerAttachmentRejectReason;
}

const BLOCKED_EXTENSIONS = new Set([
  "7z",
  "apk",
  "app",
  "bin",
  "bz2",
  "deb",
  "dmg",
  "dll",
  "dylib",
  "exe",
  "gz",
  "iso",
  "jar",
  "msi",
  "pkg",
  "rar",
  "rpm",
  "so",
  "tar",
  "tgz",
  "xz",
  "zip",
  "zst",
]);

const BLOCKED_MIME_TYPES = new Set([
  "application/gzip",
  "application/vnd.apple.installer+xml",
  "application/vnd.microsoft.portable-executable",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/x-bzip2",
  "application/x-msdownload",
  "application/x-msi",
  "application/x-rar-compressed",
  "application/x-rpm",
  "application/x-tar",
  "application/zip",
]);

export function splitComposerAttachments<T extends ComposerAttachmentFile>(
  incoming: readonly T[],
): {
  accepted: T[];
  rejected: ComposerAttachmentRejection<T>[];
} {
  const accepted: T[] = [];
  const rejected: ComposerAttachmentRejection<T>[] = [];
  for (const file of incoming) {
    const reason = validateComposerAttachment(file);
    if (reason) rejected.push({ file, reason });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

export function validateComposerAttachment(
  file: ComposerAttachmentFile,
): ComposerAttachmentRejectReason | null {
  const extension = extensionOf(file.name);
  if (extension && BLOCKED_EXTENSIONS.has(extension)) {
    return { kind: "blockedType", extension };
  }
  const mime = (file.type ?? "").toLowerCase();
  if (
    BLOCKED_MIME_TYPES.has(mime) ||
    mime.startsWith("audio/") ||
    mime.startsWith("video/")
  ) {
    return { kind: "blockedType", extension };
  }
  if (file.size > MAX_COMPOSER_ATTACHMENT_BYTES) {
    return { kind: "tooLarge", maxBytes: MAX_COMPOSER_ATTACHMENT_BYTES };
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${Math.round(mb)} MB`;
  return `${Math.round(mb / 1024)} GB`;
}

function extensionOf(name: string): string | undefined {
  const base = name.split(/[\\/]/).pop() ?? name;
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return undefined;
  return base.slice(dot + 1).toLowerCase();
}
