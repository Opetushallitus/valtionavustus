import { expect } from "@playwright/test";
import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { expectToBeDefined } from "../../utils/util";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import moment from "moment";
import { MaksatuksetPage } from "../../pages/maksatuksetPage";

const formattedMoment = () => moment(new Date()).format("DD.MM.YYYY");

test(`hakemusten arviointi additional info`, async ({
  page,
  avustushakuID,
  closedAvustushaku,
  answers,
  codes,
}) => {
  expectToBeDefined(closedAvustushaku);
  const hakemustenArviointiPage = new HakemustenArviointiPage(page);
  await hakemustenArviointiPage.navigate(avustushakuID, { newListingUi: true });
  await hakemustenArviointiPage.acceptAvustushaku(
    avustushakuID,
    answers.projectName
  );
  await hakemustenArviointiPage.page.locator('button:text("×")').click();
  const { locators } = hakemustenArviointiPage.additionalInfo();
  const valiselvitysDeadline = "01.01.2023";
  const loppuselvitysDeadline = "20.04.2023";
  await locators.showAdditionalInfo.click();
  await expect(locators.vastuuvalmistelija).toHaveText("_ valtionavustus");
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await test.step("shows correct toimintayksikkö", async () => {
    await expect(locators.toimintayksikko).toHaveText(
      `Toimintayksikkö ${codes.operationalUnit}`
    );
  });
  await test.step("updates paatos to show when it was sent", async () => {
    await expect(locators.paatokset).toHaveText("Ei lähetetty");
    await hakemustenArviointiPage.page
      .locator('[aria-label="Lisää valmistelija hakemukselle"]')
      .click();
    await hakemustenArviointiPage.page
      .locator('[aria-label="Lisää _ valtionavustus valmistelijaksi"]')
      .click();
    await hakemustenArviointiPage.closeUkotusModal();
    await hakujenHallintaPage.navigate(avustushakuID);
    await hakujenHallintaPage.resolveAvustushaku();
    await hakujenHallintaPage.switchToPaatosTab();
    await hakujenHallintaPage.sendPaatos(avustushakuID);
    await hakemustenArviointiPage.navigate(avustushakuID, {
      newListingUi: true,
      showAdditionalInfo: true,
    });
    await expect(locators.paatokset).toHaveText(formattedMoment());
  });
  await test.step("updates maksatukset to show when it was sent", async () => {
    await expect(locators.maksatukset).toHaveText("Ei lähetetty");
    const maksatuksetPage = MaksatuksetPage(page);
    await maksatuksetPage.goto(avustushakuID);
    await maksatuksetPage.fillInMaksueranTiedot(
      "asha pasha",
      "essi.esittelija@example.com",
      "hygge.hyvaksyja@example.com"
    );
    const dueDate = await page.getAttribute('[id="Eräpäivä"]', "value");
    if (!dueDate) throw new Error("Cannot find due date from form");
    await maksatuksetPage.sendMaksatukset();
    await hakemustenArviointiPage.navigate(avustushakuID, {
      newListingUi: true,
      showAdditionalInfo: true,
    });
    await expect(locators.maksatukset).toHaveText(formattedMoment());
  });
  await test.step(
    "updates vali and loppuselvitys to show when it has a deadline",
    async () => {
      await expect(locators.valiselvitykset).toHaveText("-");
      await expect(locators.loppuselvitykset).toHaveText("-");
      await hakujenHallintaPage.navigateToPaatos(avustushakuID);
      await hakujenHallintaPage.setValiselvitysDate(valiselvitysDeadline);
      await hakujenHallintaPage.setLoppuselvitysDate(loppuselvitysDeadline);
      await hakujenHallintaPage.waitForSave();
      await hakemustenArviointiPage.navigate(avustushakuID, {
        newListingUi: true,
        showAdditionalInfo: true,
      });
      await expect(locators.valiselvitykset).toHaveText(
        `Ei lähetetty (DL ${valiselvitysDeadline})`
      );
      await expect(locators.loppuselvitykset).toHaveText(
        `Ei lähetetty (DL ${loppuselvitysDeadline})`
      );
    }
  );
  await test.step(
    "update vali and loppuselvitys to show when they were sent",
    async () => {
      await hakujenHallintaPage.navigateToValiselvitys(avustushakuID);
      await hakujenHallintaPage.page.click('text="Lähetä väliselvityspyynnöt"');
      await hakujenHallintaPage.page.locator('text="Lähetetty 1 viestiä"');
      await hakujenHallintaPage.switchToLoppuselvitysTab();
      await hakujenHallintaPage.page.click(
        'text="Lähetä loppuselvityspyynnöt"'
      );
      await hakujenHallintaPage.page.locator('text="Lähetetty 1 viestiä"');
      await hakemustenArviointiPage.navigate(avustushakuID, {
        newListingUi: true,
        showAdditionalInfo: true,
      });
      await expect(locators.valiselvitykset).toHaveText(formattedMoment());
      await expect(locators.loppuselvitykset).toHaveText(formattedMoment());
    }
  );
  await test.step("shows is muutoshakukelpoinen", async () => {
    await expect(locators.muutoshakukelpoinen).toHaveText("Kyllä");
  });
  await test.step("can close additional info", async () => {
    await locators.muutoshakukelpoinen.waitFor();
    await locators.showAdditionalInfo.waitFor({ state: "detached" });
    await locators.hideAdditionalInfo.click();
    await locators.muutoshakukelpoinen.waitFor({ state: "detached" });
    await locators.hideAdditionalInfo.waitFor({ state: "detached" });
    await locators.showAdditionalInfo.waitFor();
  });
});
