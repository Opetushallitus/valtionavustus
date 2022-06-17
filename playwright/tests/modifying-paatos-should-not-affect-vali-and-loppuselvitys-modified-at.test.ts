import { expect } from "@playwright/test";
import { loppuselvitysTest as test } from "../fixtures/loppuselvitysTest";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";

test("Modifying päätös should not affect vali- and loppuselvitys updated at timestamps", async ({
  page,
  avustushakuID,
}) => {
  const hakujenHallinta = new HakujenHallintaPage(page);

  await hakujenHallinta.navigateToPaatos(avustushakuID);

  const originalPaatosTimestamp =
    await hakujenHallinta.paatosUpdatedAt.textContent();

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
    await hakujenHallinta.switchToPaatosTab();
    const newPaatosTimestamp =
      await hakujenHallinta.paatosUpdatedAt.textContent();
    expect(newPaatosTimestamp).not.toEqual(originalPaatosTimestamp);
  });

  await test.step("loppuselvitys modified timestamp has not changed", async () => {
    await hakujenHallinta.switchToLoppuselvitysTab();
    const newLoppuselvitysTimestamp =
      await hakujenHallinta.loppuselvitysUpdatedAt.textContent();
    expect(newLoppuselvitysTimestamp).toEqual(originalLoppuselvitysTimestamp);
  });

  await test.step("väliselvitys modified timestamp has not changed", async () => {
    await hakujenHallinta.switchToValiselvitysTab();
    const newValiselvitysTimestamp =
      await hakujenHallinta.valiselvitysUpdatedAt.textContent();
    expect(newValiselvitysTimestamp).toEqual(originalValiselvitysTimestamp);
  });
});
