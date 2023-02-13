import { expect } from "@playwright/test";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";
import { selvitysTest as test } from "../fixtures/selvitysTest";

test("Modifying päätös should not affect vali- and loppuselvitys updated at timestamps", async ({
  page,
  avustushakuID,
}) => {
  const hakujenHallinta = new HakujenHallintaPage(page);
  await hakujenHallinta.navigate(avustushakuID);

  const paatosPage = await hakujenHallinta.switchToPaatosTab();
  const originalPaatosTimestamp =
    await paatosPage.locators.paatosUpdatedAt.textContent();

  await hakujenHallinta.switchToValiselvitysTab();
  const originalValiselvitysTimestamp =
    await hakujenHallinta.valiselvitysUpdatedAt.textContent();

  await hakujenHallinta.switchToLoppuselvitysTab();
  const originalLoppuselvitysTimestamp =
    await hakujenHallinta.loppuselvitysUpdatedAt.textContent();

  await test.step("modify paatos", async () => {
    await hakujenHallinta.switchToPaatosTab();
    await page.fill('[id="decision.taustaa.fi"]', "Burger Time");
    await hakujenHallinta.waitForSave();
  });

  await test.step("päätös modified timestamp has changed", async () => {
    const paatosPage = await hakujenHallinta.switchToPaatosTab();
    const newPaatosTimestamp =
      await paatosPage.locators.paatosUpdatedAt.textContent();
    expect(newPaatosTimestamp).not.toEqual(originalPaatosTimestamp);
  });

  await test.step(
    "loppuselvitys modified timestamp has not changed",
    async () => {
      await hakujenHallinta.switchToLoppuselvitysTab();
      const newLoppuselvitysTimestamp =
        await hakujenHallinta.loppuselvitysUpdatedAt.textContent();
      expect(newLoppuselvitysTimestamp).toEqual(originalLoppuselvitysTimestamp);
    }
  );

  await test.step(
    "väliselvitys modified timestamp has not changed",
    async () => {
      await hakujenHallinta.switchToValiselvitysTab();
      const newValiselvitysTimestamp =
        await hakujenHallinta.valiselvitysUpdatedAt.textContent();
      expect(newValiselvitysTimestamp).toEqual(originalValiselvitysTimestamp);
    }
  );
});
