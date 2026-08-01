import { describe, expect, it } from "vitest";

import { normalizeWhatsAppNumber } from "@/domain/consent/phone";

describe("WhatsApp number normalization", () => {
  it("normalizes valid international input", () => expect(normalizeWhatsAppNumber("00 56 9 1234 5678")).toBe("+56912345678"));
  it("rejects local or malformed input", () => expect(() => normalizeWhatsAppNumber("123")).toThrow(/internacional/));
});
