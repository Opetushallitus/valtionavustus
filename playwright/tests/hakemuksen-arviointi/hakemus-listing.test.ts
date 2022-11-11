import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { expect } from "@playwright/test";
import { expectToBeDefined } from "../../utils/util";
import { selvitysTest } from "../../fixtures/selvitysTest";

test(`shows Muokattu pill when the application has been modified after submit`, async ({
  page,
  avustushakuID,
  submittedHakemus,
}) => {
  expectToBeDefined(submittedHakemus);
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await hakujenHallintaPage.navigate(avustushakuID);
  await hakujenHallintaPage.setEndDate("1.1.2000 16.00");

  const hakemustenArviointiPage = new HakemustenArviointiPage(page);
  await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID);
  const officerEditPage = await hakemustenArviointiPage.openHakemusEditPage();
  await expect(officerEditPage.officerEditSubmitButton).toBeEnabled();
  await hakemustenArviointiPage.navigate(avustushakuID);
  const firstRow = hakemustenArviointiPage.hakemusRows.first();
  const modifiedPill = firstRow.locator("[data-test-id$=modified-pill]");
  await expect(modifiedPill).toHaveText("Muokattu");
});

selvitysTest(
  "shows puuttuu if missing",
  async ({
    page,
    väliselvityspyyntöSent,
    loppuselvityspyyntöSent,
    avustushakuID,
  }) => {
    expectToBeDefined(väliselvityspyyntöSent);
    expectToBeDefined(loppuselvityspyyntöSent);
    const hakemustenArviointiPage = new HakemustenArviointiPage(page);
    await hakemustenArviointiPage.navigate(avustushakuID);
    const firstHakemus = hakemustenArviointiPage.hakemusRows.first();
    await expect(
      firstHakemus.locator(`[data-test-class=valiselvitys-status-cell]`)
    ).toHaveText("Puuttuu");
    await expect(
      firstHakemus.locator(`[data-test-class=loppuselvitys-status-cell]`)
    ).toHaveText("Puuttuu");
  }
);
