import { expect, test } from "@playwright/test";

const ADMIN_TOKEN = "playwright-admin-token";
const TEST_NUMBER = "+56987654321";

test.describe("Participación ciudadana vertical journey", () => {
  test("publishes a seeded project, subscribes, consults through fake WhatsApp, and refreshes aggregate results", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Proyectos abiertos a la ciudadanía" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Proyecto de transporte público" })).toBeVisible();
    await expect(page.getByText(/teléfono|whatsapp id|citizen id/i)).toHaveCount(0);

    await page.getByRole("link", { name: "Proyecto de transporte público" }).click();
    await expect(page.getByRole("heading", { name: "Proyecto de transporte público" })).toBeVisible();
    await expect(page.getByText(/opiniones ciudadanas voluntarias/i)).toBeVisible();

    await page.getByRole("link", { name: "Suscribirse" }).click();
    await page.getByLabel("Número internacional de WhatsApp").fill(TEST_NUMBER);
    await page.getByRole("checkbox", { name: "Movilidad" }).check();
    await page.getByRole("checkbox", { name: /Acepto explícitamente/ }).check();
    const subscriptionResponse = page.waitForResponse((response) => response.url().endsWith("/api/subscriptions"));
    await page.getByRole("button", { name: "Suscribirme" }).click();
    await subscriptionResponse;
    await expect(page.getByRole("status")).toContainText("Suscripción aceptada");

    const adminHeaders = { Authorization: `Bearer ${ADMIN_TOKEN}`, "Content-Type": "application/json" };
    const openedConsultation = await page.request.post("/api/admin/consultations/demo-consultation-v1/status", { headers: adminHeaders, data: { status: "OPEN" } });
    expect(openedConsultation.ok()).toBeTruthy();

    const dispatch = await page.request.post("/api/admin/consultations/demo-consultation-v1/dispatch", { headers: adminHeaders, data: {} });
    expect(dispatch.ok()).toBeTruthy();
    expect((await dispatch.json()).sent).toBeGreaterThanOrEqual(0);

    const question = await page.request.post("/api/admin/whatsapp/inbound", {
      headers: adminHeaders,
      data: { from: TEST_NUMBER, message: "¿Qué propone el proyecto?", eventKey: "e2e-question-v1" },
    });
    expect(question.ok()).toBeTruthy();
    expect((await question.json()).body).toMatch(/transporte|Resumen|proveedor/i);

    const opinion = await page.request.post("/api/admin/whatsapp/inbound", {
      headers: adminHeaders,
      data: { from: TEST_NUMBER, message: "1", eventKey: "e2e-opinion-v1" },
    });
    expect(opinion.ok()).toBeTruthy();
    expect((await opinion.json()).body).toMatch(/opinión ciudadana/i);
    const closedConsultation = await page.request.post("/api/admin/consultations/demo-consultation-v1/status", { headers: adminHeaders, data: { status: "CLOSED" } });
    expect(closedConsultation.ok()).toBeTruthy();

    await page.goto("/projects/demo-project-v1");
    await expect(page.getByText("Participantes: 1")).toBeVisible();
    await expect(page.getByText("support: Sí, apoyo la propuesta", { exact: false })).toBeVisible();
  }, 120_000);
});
