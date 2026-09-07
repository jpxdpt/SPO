import { expect, test } from "@playwright/test";

/**
 * E2E Fase 2 (requer `pnpm dev` + DATABASE_URL do Neon dev):
 * diretor submete → SPO tria → cria caso → agenda/conclui → encerra →
 * diretor vê só estado seguro.
 * Sem servidor/BD, estes testes são ignorados (smoke de páginas públicas).
 */

test("login exige credenciais", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "SPO Gestão" })).toBeVisible();
  await expect(page.getByLabel("Email institucional")).toBeVisible();
});

test("rotas protegidas redirecionam para login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
