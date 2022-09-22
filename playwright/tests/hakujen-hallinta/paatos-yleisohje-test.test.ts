import { expect } from "@playwright/test";
import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { getAcceptedPäätösEmails } from "../../utils/emails";
import { expectToBeDefined } from "../../utils/util";

test("yleisohje", async ({
  page,
  closedAvustushaku: { id: avustushakuID },
  answers,
  ukotettuValmistelija,
}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page);
  await hakemustenArviointiPage.navigate(avustushakuID);
  const hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
    avustushakuID,
    projectName: answers.projectName,
  });
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await hakujenHallintaPage.navigateFromHeader();
  await hakujenHallintaPage.resolveAvustushaku();
  await hakemustenArviointiPage.navigate(avustushakuID);
  await hakemustenArviointiPage.selectValmistelijaForHakemus(
    hakemusID,
    ukotettuValmistelija
  );
  const paatosLocators = await hakujenHallintaPage.navigateToPaatos(
    avustushakuID
  );
  const { yleisOhjeCheckbox, yleisOhjeLiite } = paatosLocators;
  const amountOfYleisohjeet = 5;
  expect(await yleisOhjeLiite.count()).toBe(amountOfYleisohjeet);
  await test.step(
    "newest ohje is preselected and all are disabled",
    async () => {
      for (let i = 0; i <= 4; i++) {
        const nthYleisohje = yleisOhjeLiite.nth(i);
        await expect(nthYleisohje).toBeDisabled();
        if (i === 4) {
          await expect(nthYleisohje).toBeChecked();
        } else {
          await expect(nthYleisohje).not.toBeChecked();
        }
      }
    }
  );
  await test.step("add yleisohje to paatos", async () => {
    await expect(yleisOhjeCheckbox).not.toBeChecked();
    await yleisOhjeCheckbox.click();
    await expect(yleisOhjeCheckbox).toBeChecked();
    await hakemustenArviointiPage.waitForSave();
  });
  await test.step(
    "after selecting to add yleisohje only the newest ohje is enabled and checked",
    async () => {
      for (let i = 0; i <= 4; i++) {
        const nthYleisohje = yleisOhjeLiite.nth(i);
        if (i === 4) {
          await expect(nthYleisohje).toBeEnabled();
          await expect(nthYleisohje).toBeChecked();
          await nthYleisohje.click();
        } else {
          await expect(nthYleisohje).toBeDisabled();
          await expect(nthYleisohje).not.toBeChecked();
        }
      }
    }
  );
  await test.step(
    "make sure link to yleisohje is in hakija paatos",
    async () => {
      await hakujenHallintaPage.sendPaatos(avustushakuID);
      const emails = await getAcceptedPäätösEmails(hakemusID);
      await expect(emails).toHaveLength(1);
      const url = emails[0].formatted.match(
        /https?:\/\/.*\/paatos\/avustushaku\/.*/
      )?.[0];
      expectToBeDefined(url);
      await page.goto(url);
      const yleisohjeLink = page
        .locator("a")
        .locator("text=Valtionavustusten yleisohje");
      await expect(yleisohjeLink).toBeVisible();
      expect(await yleisohjeLink.getAttribute("href")).toBe(
        "/liitteet/va_yleisohje_2022-09_fi.pdf"
      );
    }
  );
});
