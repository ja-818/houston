import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
  MAX_COMPOSER_ATTACHMENT_BYTES,
  splitComposerAttachments,
  validateComposerAttachment,
} from "../src/lib/attachment-validation.ts";

describe("composer attachment validation", () => {
  it("rejects disk images before they enter the composer draft", () => {
    const reason = validateComposerAttachment({
      name: "bank-export.dmg",
      size: 10,
      type: "application/x-apple-diskimage",
    });

    deepStrictEqual(reason, { kind: "blockedType", extension: "dmg" });
  });

  it("keeps valid files when one selected file is unsupported", () => {
    const result = splitComposerAttachments([
      { name: "statement-1.pdf", size: 1024, type: "application/pdf" },
      { name: "installer.dmg", size: 1024, type: "" },
      { name: "receipt.png", size: 1024, type: "image/png" },
    ]);

    deepStrictEqual(
      result.accepted.map((file) => file.name),
      ["statement-1.pdf", "receipt.png"],
    );
    strictEqual(result.rejected.length, 1);
  });

  it("rejects files above the engine per-file limit", () => {
    const reason = validateComposerAttachment({
      name: "huge.pdf",
      size: MAX_COMPOSER_ATTACHMENT_BYTES + 1,
      type: "application/pdf",
    });

    deepStrictEqual(reason, {
      kind: "tooLarge",
      maxBytes: MAX_COMPOSER_ATTACHMENT_BYTES,
    });
  });
});
