export const MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST = 25;
export const MAX_ATTACHMENT_UPLOAD_CREATE_BYTES = 250 * 1024 * 1024;

export interface AttachmentUploadBatch {
  start: number;
  end: number;
}

export interface AttachmentUploadPlanFile {
  size: number;
}

export function planAttachmentUploadBatches(
  files: readonly AttachmentUploadPlanFile[],
): AttachmentUploadBatch[] {
  const batches: AttachmentUploadBatch[] = [];
  let start = 0;
  let bytes = 0;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!Number.isFinite(file.size) || file.size < 0) {
      throw new Error(`invalid attachment size at index ${index}`);
    }
    const count = index - start;
    const wouldExceedCount = count >= MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST;
    const wouldExceedBytes =
      count > 0 && bytes + file.size > MAX_ATTACHMENT_UPLOAD_CREATE_BYTES;

    if (wouldExceedCount || wouldExceedBytes) {
      batches.push({ start, end: index });
      start = index;
      bytes = 0;
    }
    bytes += file.size;
  }

  if (start < files.length) {
    batches.push({ start, end: files.length });
  }
  return batches;
}
