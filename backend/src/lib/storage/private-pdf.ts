import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { getBackendConfig } from "@/lib/config";
import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";

function safeStoragePath(storageKey: string): string {
  const root = resolve(getBackendConfig().pdfStoragePath);
  const target = resolve(root, storageKey);
  if (target !== root && !target.startsWith(root + "\\") && !target.startsWith(root + "/")) {
    throw new DomainError(DOMAIN_ERROR_CODE.VALIDATION, "Ruta de almacenamiento inválida.", 500);
  }
  return target;
}

export async function savePrivatePdf(storageKey: string, bytes: Buffer): Promise<void> {
  const target = safeStoragePath(storageKey);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes, { mode: 0o600 });
}

export async function readPrivatePdf(storageKey: string): Promise<Buffer> {
  return readFile(safeStoragePath(storageKey));
}
