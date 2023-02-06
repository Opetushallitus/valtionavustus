import { muutoshakemusTest } from "./muutoshakemusTest";
import {
  clearAndType,
  expectToBeDefined,
  waitForElementWithText,
} from "../utils/util";
import { dummyPdfPath, VIRKAILIJA_URL } from "../utils/constants";
import { VirkailijaValiselvitysPage } from "../pages/virkailijaValiselvitysPage";
import { navigate } from "../utils/navigate";
import { HakijaSelvitysPage } from "../pages/hakijaSelvitysPage";
import { expect, test } from "@playwright/test";
import { LoppuselvitysPage } from "../pages/loppuselvitysPage";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";

interface SelvitysFixtures {
  väliselvityspyyntöSent: {};
  väliselvitysSubmitted: {
    userKey: string;
  };
  loppuselvityspyyntöSent: {};
  loppuselvitysSubmitted: {
    loppuselvitysFormFilled: boolean;
    loppuselvitysFormUrl: string;
  };
  asiatarkastus: {
    asiatarkastettu: boolean;
  };
  taloustarkastus: {
    taloustarkastettu: boolean;
  };
  valiAndLoppuselvitysSubmitted: {};
}

export const selvitysTest = muutoshakemusTest.extend<SelvitysFixtures>({
  väliselvityspyyntöSent: async (
    { page, avustushakuID, acceptedHakemus, ukotettuValmistelija },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 5_000);
    await muutoshakemusTest.step("Send väliselvityspyynnöt", async () => {
      expectToBeDefined(acceptedHakemus);
      const hakujenHallinta = new HakujenHallintaPage(page);
      await hakujenHallinta.navigateToValiselvitys(avustushakuID);
      await Promise.all([
        page.waitForResponse(
          `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/send-notification`
        ),
        hakujenHallinta.sendValiselvitys(),
      ]);
    });
    const tapahtumaloki = page.locator("div.tapahtumaloki");
    await test.step("updates tapahtumaloki", async () => {
      await expect(tapahtumaloki.getByTestId("sender-0")).toHaveText(
        ukotettuValmistelija
      );
      await expect(tapahtumaloki.getByTestId("sent-0")).toHaveText("1");
    });
    await use({});
  },
  väliselvitysSubmitted: async (
    { page, avustushakuID, acceptedHakemus, väliselvityspyyntöSent },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 30_000);
    let userKey: string | null = null;
    await muutoshakemusTest.step(
      "Fill in and submit väliselvitys",
      async () => {
        expectToBeDefined(väliselvityspyyntöSent);
        const valiselvitysPage = VirkailijaValiselvitysPage(page);
        await valiselvitysPage.navigateToValiselvitysTab(
          avustushakuID,
          acceptedHakemus.hakemusID
        );
        const väliselvitysFormUrl = await valiselvitysPage.linkToHakemus.getAttribute("href");
        if (!väliselvitysFormUrl)
          throw Error("valiselvitys form url not found");
        await navigate(page, väliselvitysFormUrl);
        const hakijaSelvitysPage = HakijaSelvitysPage(page);
        await hakijaSelvitysPage.organization.fill("Avustuksen saajan nimi");
        await hakijaSelvitysPage.projectName.fill("Hankkeen nimi");

        await hakijaSelvitysPage.projectGoal.fill("Hankkeen/toiminnan tavoite");
        await hakijaSelvitysPage.projectActivity.fill(
          "Toiminta, jolla tavoitteeseen on pyritty"
        );
        await hakijaSelvitysPage.projectResult.fill(
          "Konkreettiset tulokset, jotka tavoitteen osalta saavutettiin"
        );

        await hakijaSelvitysPage
          .textArea(1)
          .fill(
            "Miten hankkeen toimintaa, tuloksia ja vaikutuksia on arvioitu?"
          );
        await hakijaSelvitysPage
          .textArea(3)
          .fill("Miten hankkeesta/toiminnasta on tiedotettu?");

        await hakijaSelvitysPage.outcomeTypeRadioButtons.report.click();
        await hakijaSelvitysPage.outcomeDescription.fill("Kuvaus");
        await hakijaSelvitysPage.outcomeAddress.fill(
          "Saatavuustiedot, www-osoite tms."
        );
        await hakijaSelvitysPage.goodPracticesRadioButtons.no.click();
        await hakijaSelvitysPage.textArea(4).fill("Lisätietoja");
        await hakijaSelvitysPage.firstAttachment.setInputFiles(dummyPdfPath);

        await expect(hakijaSelvitysPage.valiselvitysWarning).toBeHidden();
        await expect(hakijaSelvitysPage.submitButton).toHaveText(
          "Lähetä käsiteltäväksi"
        );
        await hakijaSelvitysPage.submitButton.click();
        await expect(hakijaSelvitysPage.submitButton).toHaveText(
          "Väliselvitys lähetetty"
        );
        await expect(hakijaSelvitysPage.submitButton).toBeDisabled();
        await expect(hakijaSelvitysPage.valiselvitysWarning).toBeHidden();

        userKey = new URL(page.url()).searchParams.get("valiselvitys");
      }
    );
    expectToBeDefined(userKey);
    await use({ userKey });
  },
  loppuselvityspyyntöSent: async (
    { page, avustushakuID, acceptedHakemus, ukotettuValmistelija },
    use
  ) => {
    expectToBeDefined(acceptedHakemus);
    const hakujenHallintaPage = new HakujenHallintaPage(page);
    await hakujenHallintaPage.navigateToLoppuselvitys(avustushakuID);
    await Promise.all([
      page.waitForResponse(
        `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/loppuselvitys/send-notification`
      ),
      page.getByTestId("send-loppuselvitys").click(),
    ]);
    const tapahtumaloki = page.locator("div.tapahtumaloki");
    await test.step("updates tapahtumaloki", async () => {
      await expect(tapahtumaloki.getByTestId("sender-0")).toHaveText(
        ukotettuValmistelija
      );
      await expect(tapahtumaloki.getByTestId("sent-0")).toHaveText("1");
    });
    await use({});
  },
  loppuselvitysSubmitted: async (
    {
      page,
      loppuselvityspyyntöSent,
      avustushakuID,
      acceptedHakemus: { hakemusID },
    },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 30_000);
    expectToBeDefined(loppuselvityspyyntöSent);
    const loppuselvitysPage = LoppuselvitysPage(page);
    await loppuselvitysPage.navigateToLoppuselvitysTab(
      avustushakuID,
      hakemusID
    );
    const loppuselvitysFormUrl = await loppuselvitysPage.linkToForm.getAttribute("href");
    if (!loppuselvitysFormUrl) {
      throw new Error("could not find loppuselvitys form url");
    }

    await navigate(page, loppuselvitysFormUrl);
    const hakijaSelvitysPage = HakijaSelvitysPage(page);

    await hakijaSelvitysPage.textArea(0).fill("Yhteenveto");
    await hakijaSelvitysPage.textArea(2).fill("Työn jako");
    await hakijaSelvitysPage.projectGoal.fill("Tavoite");
    await hakijaSelvitysPage.projectActivity.fill("Toiminta");
    await hakijaSelvitysPage.projectResult.fill("Tulokset");
    await hakijaSelvitysPage.textArea(1).fill("Arviointi");
    await hakijaSelvitysPage.textArea(3).fill("Tiedotus");

    await hakijaSelvitysPage.outcomeTypeRadioButtons.operatingModel.click();
    await hakijaSelvitysPage.outcomeDescription.fill("Kuvaus");
    await hakijaSelvitysPage.outcomeAddress.fill("Saatavuustiedot");

    await hakijaSelvitysPage.goodPracticesRadioButtons.no.click();
    await hakijaSelvitysPage.textArea(4).fill("Lisätietoja");

    await hakijaSelvitysPage.firstAttachment.setInputFiles(dummyPdfPath);

    await expect(hakijaSelvitysPage.submitButton).toHaveText(
      "Lähetä käsiteltäväksi"
    );
    await hakijaSelvitysPage.submitButton.click();
    await expect(hakijaSelvitysPage.submitButton).toHaveText(
      "Loppuselvitys lähetetty"
    );
    await hakijaSelvitysPage.submitButton.isDisabled();

    await use({
      loppuselvitysFormUrl,
      loppuselvitysFormFilled: true,
    });
  },
  asiatarkastus: async (
    {
      page,
      avustushakuID,
      acceptedHakemus: { hakemusID },
      loppuselvitysSubmitted: { loppuselvitysFormFilled },
    },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 10_000);
    expect(loppuselvitysFormFilled);
    const loppuselvitysPage = LoppuselvitysPage(page);
    await loppuselvitysPage.navigateToLoppuselvitysTab(
      avustushakuID,
      hakemusID
    );

    const textareaSelector = 'textarea[name="information-verification"]';
    await clearAndType(page, textareaSelector, "Hyvältä näyttääpi");
    await page.click('button[name="submit-verification"]');

    await page.getByTestId("taloustarkastus-email").waitFor();
    await use({
      asiatarkastettu: true,
    });
  },
  taloustarkastus: async (
    {
      page,
      avustushakuID,
      acceptedHakemus: { hakemusID },
      loppuselvitysSubmitted: { loppuselvitysFormFilled },
      asiatarkastus: { asiatarkastettu },
    },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 10_000);
    expectToBeDefined(avustushakuID);
    expectToBeDefined(hakemusID);
    expect(asiatarkastettu);
    expect(loppuselvitysFormFilled);
    await clearAndType(
      page,
      '[data-test-id="taloustarkastus-email-subject"]',
      "Taloustarkastus OK"
    );
    await clearAndType(
      page,
      '[data-test-id="taloustarkastus-email-content"]',
      "Taloustarkastus OK sähköposti content"
    );
    await page.click('[data-test-id="taloustarkastus-submit"]');

    await waitForElementWithText(
      page,
      "h3",
      "Taloustarkastettu ja lähetetty hakijalle"
    );
    await use({
      taloustarkastettu: true,
    });
  },
  valiAndLoppuselvitysSubmitted: async (
    { väliselvitysSubmitted, loppuselvitysSubmitted },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 60_000);
    expectToBeDefined(väliselvitysSubmitted);
    expectToBeDefined(loppuselvitysSubmitted);
    await use({});
  },
});
