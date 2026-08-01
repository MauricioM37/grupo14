import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";
import { digestValue, encryptValue } from "@/lib/security/crypto";

export function normalizeWhatsAppNumber(input: string): string {
  const trimmed = input.trim();
  const compact = trimmed.replace(/[\s().-]/g, "");
  const canonical = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  if (!/^\+[1-9]\d{7,14}$/.test(canonical)) {
    throw new DomainError(
      DOMAIN_ERROR_CODE.VALIDATION,
      "Ingresa un número internacional válido, por ejemplo +56912345678.",
    );
  }
  return canonical;
}

export function protectNumber(number: string): {
  numberCiphertext: string;
  numberIv: string;
  numberAuthTag: string;
  numberDigest: string;
} {
  const encrypted = encryptValue(number);
  return {
    numberCiphertext: encrypted.ciphertext,
    numberIv: encrypted.iv,
    numberAuthTag: encrypted.authTag,
    numberDigest: digestValue(number),
  };
}
