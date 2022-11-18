import { expect } from "@playwright/test";
import { muutoshakemusTest as test } from "../fixtures/muutoshakemusTest";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";

/*
  selvitykset are not actually updated at the same time as paatos
  and there can be a one-minute difference between the timestamps
*/
test.fixme(
  "Shows the same updated date on the Päätös tab as on the Väliselvitys and Loppuselvitys tabs",
  async ({ page, avustushakuID }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page);

    await hakujenHallintaPage.navigateToPaatos(avustushakuID);
    const paatosUpdatedAt = await hakujenHallintaPage.paatosUpdatedAt
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
