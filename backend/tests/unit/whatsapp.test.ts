import { describe, expect, it } from "vitest";

import { createFakeWhatsAppIntegration } from "@/integrations/whatsapp";

describe("fake WhatsApp adapter", () => {
  it("records deterministic sends without a real session", async () => {
    const adapter = createFakeWhatsAppIntegration();
    await adapter.initialize();
    await adapter.sendText({ to: "+56912345678", body: "hola", idempotencyKey: "test-1" });
    expect(adapter.status).toBe("ready");
    expect(adapter.sent).toHaveLength(1);
  });
});
