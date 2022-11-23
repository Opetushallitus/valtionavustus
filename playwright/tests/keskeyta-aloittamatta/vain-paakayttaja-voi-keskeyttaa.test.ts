import { expect } from "@playwright/test";
import { switchUserIdentityTo } from "../../utils/util";
import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";

test.setTimeout(180000);

test("Keskeyttäminen aloittamatta näkyy hakemuslistauksessa", async ({
  page,
  answers,
  avustushakuID,
  acceptedHakemus,
}) => {
  expect(acceptedHakemus).toBeDefined;
  const hakemustenArviointiPage = new HakemustenArviointiPage(page);
  await hakemustenArviointiPage.navigate(avustushakuID);
  await hakemustenArviointiPage.selectHakemusFromList(answers.projectName);

  await hakemustenArviointiPage.tabs().seuranta.click();

  await switchUserIdentityTo(page, "viivivirkailija");
  await hakemustenArviointiPage.tabs().seuranta.click();

  const keskeytaAloittamatta = await page.locator(
    "#set-keskeyta-aloittamatta-true"
  );
  expect(keskeytaAloittamatta).toBeDisabled();

  await switchUserIdentityTo(page, "paivipaakayttaja");
  await hakemustenArviointiPage.tabs().seuranta.click();

  const keskeytaAloittamatta2 = await page.locator(
    "#set-keskeyta-aloittamatta-true"
  );
  expect(keskeytaAloittamatta2).not.toBeDisabled();
});
