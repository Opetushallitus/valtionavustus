import { test, expect } from "@playwright/test";

import { defaultValues } from "../fixtures/defaultValues";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";

defaultValues("Vastuuvalmistelija role", async ({ page, userCache }) => {
  expect(userCache).toBeDefined();

  const hakujenHallinta = new HakujenHallintaPage(page);
  await hakujenHallinta.copyEsimerkkihaku();

  await test.step("is set to current user when copying a haku", async () => {
    await expect(
      hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-name"]')
    ).toHaveValue("_ valtionavustus");
    await expect(
      hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-email"]')
    ).toHaveValue("santeri.horttanainen@reaktor.com");
  });

  await test.step("can not be removed", async () => {
    await expect(
      hakujenHallinta.page.locator(
        '[data-test-id="role-_-valtionavustus"] button'
      )
    ).toBeDisabled();
  });

  await test.step("can not change role", async () => {
    await expect(
      hakujenHallinta.page.locator(
        '[data-test-id="role-_-valtionavustus"] select[name=role]'
      )
    ).toBeDisabled();
  });

  await test.step("can be set for a new user", async () => {
    await hakujenHallinta.addVastuuvalmistelija("Viivi Virkailija");
    await hakujenHallinta.page.reload();
    await expect(
      hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-name"]')
    ).toHaveValue("Viivi Virkailija");
    await expect(
      hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-email"]')
    ).toHaveValue("viivi.virkailja@exmaple.com");
  });

  await test.step(
    "the previous vastuuvalmistelija is automatically set as regular valmistelija to avoid losing edit rights to haku",
    async () => {
      await expect(
        hakujenHallinta.page.locator(
          '[data-test-id="role-_-valtionavustus"] select[name=role]'
        )
      ).toHaveValue("presenting_officer");
      await expect(
        hakujenHallinta.page.locator(
          '[data-test-id="role-_-valtionavustus"] input[name=name]'
        )
      ).toHaveValue("_ valtionavustus");
      await expect(
        hakujenHallinta.page.locator(
          '[data-test-id="role-_-valtionavustus"] input[name=email]'
        )
      ).toHaveValue("santeri.horttanainen@reaktor.com");
    }
  );

  await test.step("name and email can be changed", async () => {
    await hakujenHallinta.fillVastuuvalmistelijaName("vastuu");
    await hakujenHallinta.fillVastuuvalmistelijaEmail("vastuu@valmistelija.fi");
    await hakujenHallinta.page.reload();
    await expect(
      hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-name"]')
    ).toHaveValue("vastuu");
    await expect(
      hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-email"]')
    ).toHaveValue("vastuu@valmistelija.fi");
  });

  await test.step("can not be set as a valmistelija", async () => {
    await hakujenHallinta.searchUsersForRoles("Viivi");
    await expect(
      hakujenHallinta.page.locator(
        '#roles-list li[data-test-id="1.2.246.562.24.99000000002"]'
      )
    ).toHaveAttribute("class", "disabled");
    await hakujenHallinta.clearUserSearchForRoles();
  });
});
