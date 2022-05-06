import { expect } from "@playwright/test";
import { muutoshakemusTest as test } from "../fixtures/muutoshakemusTest";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";

test("Shows the same updated date on the Päätös tab as on the Väliselvitys and Loppuselvitys tabs", async ({
  page,
  avustushakuID,
}) => {
  const hakujenHallintaPage = new HakujenHallintaPage(page);

  await hakujenHallintaPage.navigateToPaatos(avustushakuID);
  const paatosUpdatedAt =
    await hakujenHallintaPage.paatosUpdatedAt.textContent();

  await hakujenHallintaPage.switchToValiselvitysTab();
  const valiselvitysUpdatedAt =
    await hakujenHallintaPage.valiselvitysUpdatedAt.textContent();

  await hakujenHallintaPage.switchToLoppuselvitysTab();
  const loppuselvitysUpdatedAt =
    await hakujenHallintaPage.loppuselvitysUpdatedAt.textContent();

  expect(paatosUpdatedAt).toEqual(valiselvitysUpdatedAt);
  expect(paatosUpdatedAt).toEqual(loppuselvitysUpdatedAt);
});
