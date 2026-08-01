import { getBackendConfig } from "@/lib/config";
import { getPrismaClient } from "@/lib/prisma";

import SubscriptionForm from "@/app/_components/subscription-form";

export const dynamic = "force-dynamic";

export default async function SubscribePage() {
  const [categories, config] = await Promise.all([getPrismaClient().category.findMany({ where: { active: true }, orderBy: { name: "asc" } }), Promise.resolve(getBackendConfig())]);
  return <><section><h1>Suscríbete a consultas ciudadanas</h1><p>Recibirás invitaciones limitadas por WhatsApp para opinar sobre proyectos seleccionados. Puedes cancelar con BAJA en cualquier momento.</p></section><SubscriptionForm categories={categories.map((category) => ({ slug: category.slug, name: category.name }))} consentText={config.consentText} consentTextVersion={config.consentTextVersion} /></>;
}
