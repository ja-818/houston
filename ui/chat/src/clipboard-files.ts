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
  return uniqueFiles([
    ...filesFromClipboardList(data.files),
    ...filesFromClipboardItems(data.items),
  ]).map(ensureFileName);
}

const EXT_FROM_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
};

export function ensureFileName(file: File): File {
  if (file.name && file.name.trim().length > 0) return file;
  const ext = EXT_FROM_MIME[file.type] ?? (file.type.split("/")[1] || "bin");
  const name = `pasted-${Date.now()}.${ext}`;
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
    const key = `${file.name}::${file.size}::${file.lastModified}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(file);
  }
  return unique;
}
