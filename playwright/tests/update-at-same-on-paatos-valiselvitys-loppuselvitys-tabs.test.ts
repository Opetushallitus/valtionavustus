import { expect } from "@playwright/test";
import { muutoshakemusTest as test } from "../fixtures/muutoshakemusTest";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";

test("Shows the same updated date on the Päätös tab as on the Väliselvitys and Loppuselvitys tabs", async ({
  page,
  avustushakuID,
}) => {
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await hakujenHallintaPage.navigateToPaatos(avustushakuID);

  const paatosUpdatedAt = hakujenHallintaPage.paatosUpdatedAt.textContent;

  await hakujenHallintaPage.navigateToValiselvitys(avustushakuID);

  const valiselvitysUpdatedAt =
    hakujenHallintaPage.valiselvitysUpdatedAt.textContent;

  const loppuselvitysUpdatedAt =
    hakujenHallintaPage.loppuselvitysUpdatedAt.textContent;

  return Promise.all([
    paatosUpdatedAt,
    valiselvitysUpdatedAt,
    loppuselvitysUpdatedAt,
  ]).then(([paatos, valiselvitys, loppuselvitys]) => {
    expect(paatos).toEqual(valiselvitys);
    expect(paatos).toEqual(loppuselvitys);
  });
});
