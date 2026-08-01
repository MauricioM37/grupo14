import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getBackendConfig } from "@/lib/config";
import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";

function keyFromSecret(secret: string, label: string): Buffer {
  return createHash("sha256").update(`${label}:${secret}`).digest();
}

function requiredSecret(value: string | undefined, name: string): string {
  if (!value) throw new DomainError(DOMAIN_ERROR_CODE.VALIDATION, `${name} no está configurado.`, 500);
  return value;
}

export interface EncryptedValue {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function encryptValue(value: string): EncryptedValue {
  const config = getBackendConfig();
  const key = keyFromSecret(requiredSecret(config.dataEncryptionKey, "DATA_ENCRYPTION_KEY"), "data");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64url"),
    iv: iv.toString("base64url"),
    authTag: cipher.getAuthTag().toString("base64url"),
  };
}

export function decryptValue(value: EncryptedValue): string {
  const config = getBackendConfig();
  const key = keyFromSecret(requiredSecret(config.dataEncryptionKey, "DATA_ENCRYPTION_KEY"), "data");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(value.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(value.authTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function digestValue(value: string): string {
  const config = getBackendConfig();
  return createHmac("sha256", requiredSecret(config.numberHmacKey, "NUMBER_HMAC_KEY"))
    .update(value)
    .digest("hex");
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
