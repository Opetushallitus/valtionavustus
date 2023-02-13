import { expect } from "@playwright/test";
import { muutoshakemusTest as test } from "../fixtures/muutoshakemusTest";
import { PaatosPage } from "../pages/hakujen-hallinta/PaatosPage";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";

/*
  selvitykset are not actually updated at the same time as paatos
  and there can be a one-minute difference between the timestamps
*/
test.fixme(
  "Shows the same updated date on the Päätös tab as on the Väliselvitys and Loppuselvitys tabs",
  async ({ page, avustushakuID }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page);

    const paatosPage = PaatosPage(page);
    await paatosPage.navigateTo(avustushakuID);
    const paatosUpdatedAt = await paatosPage.locators.paatosUpdatedAt
      .locator(".date")
      .textContent();

    await hakujenHallintaPage.switchToValiselvitysTab();
    const valiselvitysUpdatedAt =
      await hakujenHallintaPage.valiselvitysUpdatedAt
        .locator(".date")
        .textContent();

    await hakujenHallintaPage.switchToLoppuselvitysTab();
    const loppuselvitysUpdatedAt =
      await hakujenHallintaPage.loppuselvitysUpdatedAt
        .locator(".date")
        .textContent();

    expect(paatosUpdatedAt).toEqual(valiselvitysUpdatedAt);
    expect(paatosUpdatedAt).toEqual(loppuselvitysUpdatedAt);
  }
);
