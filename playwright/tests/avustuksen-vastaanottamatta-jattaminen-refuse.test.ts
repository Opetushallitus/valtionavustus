import { expect } from "@playwright/test";
import { muutoshakemusTest } from "../fixtures/muutoshakemusTest";
import { HakemustenArviointiPage } from "../pages/hakemustenArviointiPage";
import { RefusePage } from "../pages/hakija/refuse-page";
import { getMuutoshakemusEmails, getRefuseUrlFromEmail } from "../utils/emails";

muutoshakemusTest(
  "Avustuksesta vastaanottamatta jättäminen",
  async ({ page, avustushakuID, acceptedHakemus }) => {
    const paatosEmail = await getMuutoshakemusEmails(acceptedHakemus.hakemusID);
    const refuseUrl = getRefuseUrlFromEmail(paatosEmail[0]);
    await page.goto(refuseUrl);
    const refusePage = RefusePage(page);

    await refusePage.refuseGrant();

    await muutoshakemusTest.step(
      "Hakemus list shows refused application",
      async () => {
        const hakemustenArviointiPage = new HakemustenArviointiPage(page);
        await hakemustenArviointiPage.navigate(avustushakuID);

        const status = hakemustenArviointiPage.hakemusRows.locator(
          ".hakemus-status-cell"
        );
        expect(await status.textContent()).toEqual("Ei tarvetta");

        const muutoshakemusStatus = hakemustenArviointiPage.hakemusRows.locator(
          "[data-test-class=muutoshakemus-status-cell]"
        );
        expect(await muutoshakemusStatus.textContent()).toEqual("-");

        const valiselvitysStatus = hakemustenArviointiPage.hakemusRows.locator(
          "[data-test-class=valiselvitys-status-cell]"
        );
        expect(await valiselvitysStatus.textContent()).toEqual("-");

        const loppuselvitysStatus = hakemustenArviointiPage.hakemusRows.locator(
          "[data-test-class=loppuselvitys-status-cell]"
        );
        expect(await loppuselvitysStatus.textContent()).toEqual("-");
      }
    );
  }
);
