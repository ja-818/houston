import type {
  AttachmentInvocation,
  AttachmentReference,
} from "@houston-ai/chat";

const MARKER_PREFIX = "<!--houston:attachments ";
const MARKER_SUFFIX = "-->";

export function withAttachmentPaths(text: string, paths: string[]): string {
  if (paths.length === 0) return text;
  const list = paths.map((p) => `- ${p}`).join("\n");
  const block = `[User attached these files. Read them with the Read tool if needed:\n${list}]`;
  return text.length > 0 ? `${text}\n\n${block}` : block;
}

export function buildAttachmentPrompt(
  text: string,
  files: readonly File[],
  paths: readonly string[],
): string {
  const prompt = withAttachmentPaths(text, [...paths]);
  const attachments = attachmentReferences(files, paths);
  if (attachments.length === 0) return prompt;
  return encodeAttachmentMessage(text, attachments, prompt);
}

export function attachmentReferences(
  files: readonly File[],
  paths: readonly string[],
): AttachmentReference[] {
  return paths.map((path, index) => ({
    path,
    name: files[index]?.name ?? fileNameFromPath(path),
  }));
}

function encodeAttachmentMessage(
  userText: string,
  files: readonly AttachmentReference[],
  claudePrompt: string,
): string {
  const payload: AttachmentInvocation = {
    message: userText.trim(),
    files: [...files],
  };
  const json = JSON.stringify(payload);
  return `${MARKER_PREFIX}${json}${MARKER_SUFFIX}\n\n${claudePrompt}`;
}

function fileNameFromPath(path: string): string {
  const parts = path.split(/[\\/]+/).filter(Boolean);
  return parts.at(-1) ?? path;
}
