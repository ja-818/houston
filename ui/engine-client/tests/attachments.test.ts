import { deepStrictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
  MAX_ATTACHMENT_UPLOAD_CREATE_BYTES,
  MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST,
  planAttachmentUploadBatches,
} from "../src/attachments.ts";

describe("attachment upload batching", () => {
  it("splits large user selections by create-request session cap", () => {
    const files = Array.from({ length: 72 }, () => ({ size: 1 }));

    deepStrictEqual(planAttachmentUploadBatches(files), [
      { start: 0, end: MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST },
      {
        start: MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST,
        end: MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST * 2,
      },
      { start: MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST * 2, end: 72 },
    ]);
  });

  it("splits batches before the create-request byte cap", () => {
    const halfCap = MAX_ATTACHMENT_UPLOAD_CREATE_BYTES / 2;
    const files = [{ size: halfCap }, { size: halfCap }, { size: 1 }];

    deepStrictEqual(planAttachmentUploadBatches(files), [
      { start: 0, end: 2 },
      { start: 2, end: 3 },
    ]);
  });
});
