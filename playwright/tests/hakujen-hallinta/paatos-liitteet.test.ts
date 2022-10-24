import { expect } from "@playwright/test";
import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { getAcceptedPäätösEmails } from "../../utils/emails";
import { expectToBeDefined } from "../../utils/util";
import { HAKIJA_URL } from "../../utils/constants";
import { getPdfFirstPageTextContent } from "../../utils/pdfUtil";

test("paatos liitteet", async ({
  page,
  closedAvustushaku: { id: avustushakuID },
  answers,
  ukotettuValmistelija,
  projektikoodi,
}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page);
  await hakemustenArviointiPage.navigate(avustushakuID);
  const hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
    avustushakuID,
    projectName: answers.projectName,
    projektikoodi,
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
  const {
    erityisavustusEhdotCheckbox,
    yleisavustusEhdotCheckbox,
    yleisOhjeCheckbox,
    yleisOhjeLiite,
    pakoteOhjeCheckbox,
  } = paatosLocators;
  const amountOfYleisohjeet = 5;
  await expect(yleisOhjeLiite).toHaveCount(amountOfYleisohjeet);
  await test.step("ehdot liitteet are disabled and unchecked", async () => {
    await expect(erityisavustusEhdotCheckbox).toBeDisabled();
    await expect(erityisavustusEhdotCheckbox).not.toBeChecked();
    await expect(yleisavustusEhdotCheckbox).toBeDisabled();
    await expect(yleisavustusEhdotCheckbox).not.toBeChecked();
  });
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
  await test.step("pakote ohje is enabled by default", async () => {
    await expect(pakoteOhjeCheckbox).toBeChecked();
  });
  await test.step("make sure link to yleisohje is in paatos", async () => {
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
    const href = "/liitteet/va_yleisohje_2022-09_fi.pdf";
    expect(await yleisohjeLink.getAttribute("href")).toBe(href);
    const res = await page.request.get(`${HAKIJA_URL}${href}`);
    const pdfBody = await res.body();
    const pdfText = await getPdfFirstPageTextContent(pdfBody);
    expect(pdfText).toContain("13.9.2022");
    expect(pdfText).toContain("YLEISOHJE");
  });

  await test.step("make sure pakoteohje is in paatos", async () => {
    const pakoteohjeLink = page
      .locator("a")
      .locator(
        "text=Venäjän hyökkäyssotaan liittyvien pakotteiden huomioon ottaminen valtionavustustoiminnassa"
      );
    await expect(pakoteohjeLink).toBeVisible();
    const href = "/liitteet/va_pakoteohje.pdf";
    expect(await pakoteohjeLink.getAttribute("href")).toBe(href);
    const res = await page.request.get(`${HAKIJA_URL}${href}`);
    const pdfBody = await res.body();
    const pdfText = await getPdfFirstPageTextContent(pdfBody);
    expect(pdfText).toContain(
      "Venäjän hyökkäyssotaan liittyvien pakotteiden huomioon ottaminen"
    );
  });
  await test.step("uncheck pakoteohje", async () => {
    await hakujenHallintaPage.navigateToPaatos(avustushakuID);
    await expect(yleisOhjeCheckbox).toBeChecked();
    await expect(pakoteOhjeCheckbox).toBeChecked();
    await pakoteOhjeCheckbox.click();
    await expect(pakoteOhjeCheckbox).not.toBeChecked();
    await hakujenHallintaPage.waitForSave();
  });
  await test.step(
    "pakoteohje gets removed after recreating and sending paatokset",
    async () => {
      await paatosLocators.recreatePaatokset();
      await paatosLocators.resendPaatokset();
      const emails = await getAcceptedPäätösEmails(hakemusID);
      await expect(emails).toHaveLength(2);
      const url = emails[1].formatted.match(
        /https?:\/\/.*\/paatos\/avustushaku\/.*/
      )?.[0];
      expectToBeDefined(url);
      await page.goto(url);
      const yleisohjeLink = page
        .locator("a")
        .locator("text=Valtionavustusten yleisohje");
      await expect(yleisohjeLink).toBeVisible();
      const pakoteohjeLink = page
        .locator("a")
        .locator(
          "text=Venäjän hyökkäyssotaan liittyvien pakotteiden huomioon ottaminen valtionavustustoiminnassa"
        );
      await expect(pakoteohjeLink).toBeHidden();
    }
  );
});
