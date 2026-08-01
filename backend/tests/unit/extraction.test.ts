import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { extractPdfText, utf8Length } from "@/domain/projects/extraction";

describe("PDF extraction", () => {
  it("extracts selectable text and fingerprints the source", async () => {
    const result = extractPdfText(await readFile(new URL("../fixtures/text.pdf", import.meta.url)));
    expect(result.text).toContain("Proyecto de transporte público");
    expect(result.fingerprint).toHaveLength(64);
  });
  it("rejects non-PDF bytes", () => expect(() => extractPdfText(Buffer.from("not a pdf"))).toThrow(/PDF válido/));
  it("measures context using UTF-8 bytes", () => expect(utf8Length("á"), "UTF-8 length").toBe(2));
});
