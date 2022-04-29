import { expect } from "@playwright/test";

import { muutoshakemusTest } from "./muutoshakemusTest";
import { LoppuselvitysPage } from "../pages/loppuselvitysPage";
import { clearAndType, expectToBeDefined } from "../utils/util";
import { navigate } from "../utils/navigate";
import { dummyPdfPath, VIRKAILIJA_URL } from "../utils/constants";
import { HakijaSelvitysPage } from "../pages/hakijaSelvitysPage";

export interface LoppuselvitysFixtures {
  loppuselvityspyyntöSent: {};
  loppuselvitysSubmitted: {
    loppuselvitysFormFilled: boolean;
    loppuselvitysFormUrl: string;
  };
  asiatarkastus: {
    asiatarkastettu: boolean;
  };
}

export const loppuselvitysTest =
  muutoshakemusTest.extend<LoppuselvitysFixtures>({
    loppuselvityspyyntöSent: async (
      { page, avustushakuID, acceptedHakemus },
      use
    ) => {
      expectToBeDefined(acceptedHakemus);
      await page.goto(
        `${VIRKAILIJA_URL}/admin/loppuselvitys/?avustushaku=${avustushakuID}`
      );
      await Promise.all([
        page.waitForResponse(
          `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/loppuselvitys/send-notification`
        ),
        page.click('[data-test-id="send-loppuselvitys"]'),
      ]);
      await use({});
    },
    loppuselvitysSubmitted: async (
      {
        page,
        loppuselvityspyyntöSent,
        avustushakuID,
        acceptedHakemus: { hakemusID },
      },
      use
    ) => {
      expectToBeDefined(loppuselvityspyyntöSent);
      const loppuselvitysPage = LoppuselvitysPage(page);
      await loppuselvitysPage.navigateToLoppuselvitysTab(
        avustushakuID,
        hakemusID
      );
      const loppuselvitysFormUrl = await page.getAttribute(
        '[data-test-id="selvitys-link"]',
        "href"
      );
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
      use
    ) => {
      expect(loppuselvitysFormFilled);
      const loppuselvitysPage = LoppuselvitysPage(page);
      await loppuselvitysPage.navigateToLoppuselvitysTab(
        avustushakuID,
        hakemusID
      );

      const textareaSelector = 'textarea[name="information-verification"]';
      await clearAndType(page, textareaSelector, "Hyvältä näyttääpi");
      await page.click('button[name="submit-verification"]');

      await page.waitForSelector('[data-test-id="taloustarkastus-email"]');
      await use({
        asiatarkastettu: true,
      });
    },
  });
