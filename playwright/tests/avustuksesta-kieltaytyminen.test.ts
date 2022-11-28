import { expect } from "@playwright/test";
import { muutoshakemusTest } from "../fixtures/muutoshakemusTest";
import { HakemustenArviointiPage } from "../pages/hakemustenArviointiPage";
import { RefusePage } from "../pages/hakija/refuse-page";
import {
  getLoppuselvitysEmailsForAvustus,
  getMuutoshakemusEmails,
  getRefuseUrlFromEmail,
  getValiselvitysEmailsForAvustus,
} from "../utils/emails";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";

muutoshakemusTest(
  "Avustuksesta kieltäytyminen",
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

        expect(
          await hakemustenArviointiPage.getVäliselvitysStatus(
            acceptedHakemus.hakemusID
          )
        ).toEqual("-");

        expect(
          await hakemustenArviointiPage.getLoppuselvitysStatus(
            acceptedHakemus.hakemusID
          )
        ).toEqual("-");
      }
    );

    const waitUntilEmailsShouldHaveAlreadyBeenSent = async () => {
      // Assume that all emails will be sent within 10s.
      // As we expect that _no_ emails to be sent, there is no concrete event to wait for
      return await page.waitForTimeout(10000);
    };

    await muutoshakemusTest.step("Ei lähetä väliselvityspyyntöä", async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page);
      await hakujenHallintaPage.navigateFromHeader();
      await hakujenHallintaPage.switchToValiselvitysTab();
      await hakujenHallintaPage.sendValiselvitys(0);

      await waitUntilEmailsShouldHaveAlreadyBeenSent();
      const emails = await getValiselvitysEmailsForAvustus(avustushakuID);
      expect(emails).toHaveLength(0);
    });

    await muutoshakemusTest.step("Ei lähetä loppuselvityspyyntöä", async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page);
      await hakujenHallintaPage.navigateFromHeader();
      await hakujenHallintaPage.switchToLoppuselvitysTab();
      await hakujenHallintaPage.sendLoppuselvitys(0);

      await waitUntilEmailsShouldHaveAlreadyBeenSent();
      const emails = await getLoppuselvitysEmailsForAvustus(avustushakuID);
      expect(emails).toHaveLength(0);
    });
  }
);
