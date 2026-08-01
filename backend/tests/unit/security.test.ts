import { beforeEach, describe, expect, it } from "vitest";

import { decryptValue, digestValue, encryptValue } from "@/lib/security/crypto";

describe("number protection", () => {
  beforeEach(() => {
    process.env.DATA_ENCRYPTION_KEY = "unit-test-data-key";
    process.env.NUMBER_HMAC_KEY = "unit-test-hmac-key";
  });

  it("encrypts and decrypts numbers while keeping a stable keyed lookup digest", () => {
    const encrypted = encryptValue("+56912345678");
    expect(decryptValue(encrypted)).toBe("+56912345678");
    expect(digestValue("+56912345678")).toBe(digestValue("+56912345678"));
    expect(digestValue("+56912345678")).not.toBe(digestValue("+56912345679"));
  });
});
