import test from "node:test";
import assert from "node:assert/strict";
import {
  filesFromClipboardData,
  filesFromClipboardItems,
} from "../src/clipboard-files.ts";

test("extracts file items from clipboard data", () => {
  const image = new File(["png"], "screenshot.png", { type: "image/png" });
  const pdf = new File(["pdf"], "brief.pdf", { type: "application/pdf" });

  assert.deepEqual(
    filesFromClipboardItems([
      { kind: "string", getAsFile: () => null },
      { kind: "file", getAsFile: () => image },
      { kind: "file", getAsFile: () => pdf },
    ]),
    [image, pdf],
  );
});

test("ignores empty and text-only clipboard data", () => {
  assert.deepEqual(filesFromClipboardItems(null), []);
  assert.deepEqual(
    filesFromClipboardItems([{ kind: "string", getAsFile: () => null }]),
    [],
  );
});

test("extracts clipboard files list when items do not include files", () => {
  const image = new File(["jpg"], "photo.jpg", { type: "image/jpeg" });

  assert.deepEqual(
    filesFromClipboardData({
      files: [image],
      items: [{ kind: "string", getAsFile: () => null }],
    }),
    [image],
  );
});

test("deduplicates files exposed through both clipboard APIs", () => {
  const image = new File(["png"], "screenshot.png", {
    type: "image/png",
    lastModified: 10,
  });

  assert.deepEqual(
    filesFromClipboardData({
      files: [image],
      items: [{ kind: "file", getAsFile: () => image }],
    }),
    [image],
  );
});

test("extracts image from mixed clipboard with both text and image", () => {
  const image = new File(["png"], "screenshot.png", { type: "image/png" });

  assert.deepEqual(
    filesFromClipboardData({
      files: [],
      items: [
        { kind: "string", type: "text/plain", getAsFile: () => null },
        { kind: "file", type: "image/png", getAsFile: () => image },
      ],
    }),
    [image],
  );
});
