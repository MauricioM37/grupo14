import { test, expect } from "@playwright/test";

test("public catalog renders without exposing private fields", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Proyectos abiertos a la ciudadanía" })).toBeVisible();
  await expect(page.getByText(/teléfono|whatsapp id|citizen id/i)).toHaveCount(0);
});
