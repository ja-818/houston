export const LEARNING_PREVIEW_LIMIT = 180;

export function learningNeedsExpansion(text: string): boolean {
  return [...normalizePreviewText(text)].length > LEARNING_PREVIEW_LIMIT;
}

export function learningPreviewText(text: string): string {
  const normalized = normalizePreviewText(text);
  if ([...normalized].length <= LEARNING_PREVIEW_LIMIT) return normalized;

  const slice = takeChars(normalized, LEARNING_PREVIEW_LIMIT);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > 80 ? slice.slice(0, lastSpace) : slice;
  return `${base.trimEnd()}...`;
}

function normalizePreviewText(text: string): string {
  return text.trim().split(/\s+/).filter(Boolean).join(" ");
}

function takeChars(text: string, count: number): string {
  return [...text].slice(0, count).join("");
}
