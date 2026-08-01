import type { PrismaClient } from "@prisma/client";

import { getBackendConfig } from "@/lib/config";
import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";

import { normalizeWhatsAppNumber, protectNumber } from "./phone";

export interface SubscriptionInput {
  number: string;
  categorySlugs: string[];
  consentAccepted: boolean;
  consentTextVersion: string;
  consentText: string;
  source: string;
}

export interface GenericSubscriptionResult {
  accepted: true;
}

function uniqueSlugs(slugs: string[]): string[] {
  return [...new Set(slugs.map((slug) => slug.trim().toLowerCase()).filter(Boolean))];
}

export async function createOrUpdateSubscription(
  prisma: PrismaClient,
  input: SubscriptionInput,
): Promise<GenericSubscriptionResult> {
  const config = getBackendConfig();
  if (!input.consentAccepted) {
    throw new DomainError(DOMAIN_ERROR_CODE.VALIDATION, "Debes aceptar el consentimiento explícito.");
  }
  if (input.consentTextVersion !== config.consentTextVersion || input.consentText !== config.consentText) {
    throw new DomainError(DOMAIN_ERROR_CODE.CONFLICT, "El texto de consentimiento está desactualizado.");
  }
  const number = normalizeWhatsAppNumber(input.number);
  const categorySlugs = uniqueSlugs(input.categorySlugs);
  if (categorySlugs.length === 0) {
    throw new DomainError(DOMAIN_ERROR_CODE.VALIDATION, "Selecciona al menos una categoría.");
  }

  const categories = await prisma.category.findMany({ where: { slug: { in: categorySlugs }, active: true } });
  if (categories.length !== categorySlugs.length) {
    throw new DomainError(DOMAIN_ERROR_CODE.VALIDATION, "Una o más categorías no están disponibles.");
  }
  const protectedNumber = protectNumber(number);
  await prisma.$transaction(async (tx) => {
    const citizen = await tx.citizen.upsert({
      where: { numberDigest: protectedNumber.numberDigest },
      create: protectedNumber,
      update: protectedNumber,
    });
    await tx.consentEvent.create({
      data: {
        citizenId: citizen.id,
        type: "OPT_IN",
        selectedCategorySlugs: categorySlugs,
        consentTextVersion: input.consentTextVersion,
        consentText: input.consentText,
        source: input.source,
      },
    });
    await Promise.all(
      categories.map((category) =>
        tx.subscription.upsert({
          where: { citizenId_categoryId: { citizenId: citizen.id, categoryId: category.id } },
          create: { citizenId: citizen.id, categoryId: category.id, active: true },
          update: { active: true },
        }),
      ),
    );
  });
  return { accepted: true };
}

export async function revokeSubscription(
  prisma: PrismaClient,
  input: { number: string; categorySlugs?: string[]; source: string },
): Promise<GenericSubscriptionResult> {
  const number = normalizeWhatsAppNumber(input.number);
  const categorySlugs = uniqueSlugs(input.categorySlugs ?? []);
  const digest = protectNumber(number).numberDigest;
  await prisma.$transaction(async (tx) => {
    const citizen = await tx.citizen.findUnique({ where: { numberDigest: digest } });
    if (!citizen) return;
    const categories = categorySlugs.length
      ? await tx.category.findMany({ where: { slug: { in: categorySlugs } } })
      : [];
    await tx.subscription.updateMany({
      where: { citizenId: citizen.id, ...(categorySlugs.length ? { categoryId: { in: categories.map((item) => item.id) } } : {}) },
      data: { active: false },
    });
    await tx.consentEvent.create({
      data: {
        citizenId: citizen.id,
        type: "REVOCATION",
        selectedCategorySlugs: categorySlugs,
        consentTextVersion: getBackendConfig().consentTextVersion,
        consentText: getBackendConfig().consentText,
        source: input.source,
      },
    });
  });
  return { accepted: true };
}

export async function ensureCategories(prisma: PrismaClient, values: Array<{ slug: string; name: string }>): Promise<void> {
  await Promise.all(values.map((value) => prisma.category.upsert({
    where: { slug: value.slug },
    create: { ...value, active: true },
    update: { name: value.name, active: true },
  })));
}
