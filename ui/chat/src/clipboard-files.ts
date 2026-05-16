/**
 * Stable identity for a user-attached File: name + size + lastModified.
 * Single source of truth so dedupe stays consistent across every entry
 * point (drop, picker, clipboard) and the multiple browser APIs that can
 * surface the same file twice.
 */
export function fileIdentityKey(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

// `kind`/`type` are loose `string` (not unions) on purpose: a real DOM
// `DataTransfer` must be structurally assignable here, and lib.dom types
// `DataTransferItem.kind` as `string`. Narrowing would break the call site.
interface ClipboardFileItem {
  kind: string;
  type?: string;
  getAsFile: () => File | null;
}

interface ClipboardFileData {
  files?: FileList | File[] | null;
  items?: Iterable<ClipboardFileItem> | ArrayLike<ClipboardFileItem> | null;
}

export function filesFromClipboardData(
  data: ClipboardFileData | null | undefined,
): File[] {
  if (!data) return [];
  // Dedupe before naming: the same pasted file is commonly exposed via BOTH
  // `files` and `items`; naming first would mask that overlap. The index is
  // the post-dedupe position, so multiple unnamed files in one paste get
  // distinct generated names instead of colliding.
  return uniqueFiles([
    ...filesFromClipboardList(data.files),
    ...filesFromClipboardItems(data.items),
  ]).map((file, index) => ensureFileName(file, index));
}

const EXT_FROM_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
};

export function ensureFileName(file: File, index = 0): File {
  if (file.name && file.name.trim().length > 0) return file;
  const ext = EXT_FROM_MIME[file.type] ?? (file.type.split("/")[1] || "bin");
  const name = `pasted-${Date.now()}-${index}.${ext}`;
  return new File([file], name, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

export function filesFromClipboardItems(
  items: Iterable<ClipboardFileItem> | ArrayLike<ClipboardFileItem> | null | undefined,
): File[] {
  if (!items) return [];

  const files: File[] = [];
  for (const item of Array.from(items)) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }
  return files;
}

function filesFromClipboardList(files: FileList | File[] | null | undefined): File[] {
  return files ? Array.from(files) : [];
}

function uniqueFiles(files: File[]): File[] {
  const seen = new Set<string>();
  const unique: File[] = [];
  for (const file of files) {
    const key = fileIdentityKey(file);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(file);
  }
  return unique;
}
