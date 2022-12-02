import { expect } from "@playwright/test";
import { HakemustenArviointiPage } from "../pages/hakemustenArviointiPage";
import { RefusePage } from "../pages/hakija/refuse-page";
import {
  getLoppuselvitysEmailsForAvustus,
  getValiselvitysEmailsForAvustus,
} from "../utils/emails";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";
import { twoAcceptedHakemusTest as test } from "../fixtures/twoHakemusTest";

test("Avustuksesta kieltäytyminen", async ({
  page,
  avustushakuID,
  acceptedHakemukset: { hakemusID, secondHakemusID },
}) => {
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await test.step("send päätökset", async () => {
    await hakujenHallintaPage.navigate(avustushakuID);
    await hakujenHallintaPage.resolveAvustushaku();
    await hakujenHallintaPage.switchToPaatosTab();
    await hakujenHallintaPage.sendPaatos(avustushakuID, 2);
  });

  await test.step("refuse first hakemus", async () => {
    const refusePage = RefusePage(page);
    await refusePage.navigate(hakemusID);
    await refusePage.refuseGrant();
  });

  await test.step(
    "Hakemus list shows both refused and accepted application",
    async () => {
      const hakemustenArviointiPage = new HakemustenArviointiPage(page);
      await hakemustenArviointiPage.navigate(avustushakuID);

      const refusedHakemus = hakemustenArviointiPage.page
        .locator("tbody")
        .getByTestId(`hakemus-${hakemusID}`);
      const secondHakemus = hakemustenArviointiPage.page
        .locator("tbody")
        .getByTestId(`hakemus-${secondHakemusID}`);

      const hakemusStatusSelector = ".hakemus-status-cell";
      await expect(refusedHakemus.locator(hakemusStatusSelector)).toHaveText(
        "Ei tarvetta"
      );
      await expect(secondHakemus.locator(hakemusStatusSelector)).toHaveText(
        "Hyväksytty"
      );

      const muutoshakemusSelector =
        "[data-test-class=muutoshakemus-status-cell]";
      await expect(refusedHakemus.locator(muutoshakemusSelector)).toHaveText(
        "-"
      );
      await expect(secondHakemus.locator(muutoshakemusSelector)).toHaveText(
        "-"
      );

      await expect(
        hakemustenArviointiPage.getVäliselvitysStatus(hakemusID)
      ).toHaveText("-");
      await expect(
        hakemustenArviointiPage.getVäliselvitysStatus(secondHakemusID)
      ).toHaveText("Puuttuu");

      await expect(
        hakemustenArviointiPage.getLoppuselvitysStatus(hakemusID)
      ).toHaveText("-");
      await expect(
        hakemustenArviointiPage.getLoppuselvitysStatus(secondHakemusID)
      ).toHaveText("Puuttuu");
    }
  );

  await test.step("sends only one väliselvityspyyntö", async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page);
    await hakujenHallintaPage.navigateFromHeader();
    await hakujenHallintaPage.switchToValiselvitysTab();
    expect(await getValiselvitysEmailsForAvustus(avustushakuID)).toHaveLength(
      0
    );
    await hakujenHallintaPage.sendValiselvitys(1);
    expect(await getValiselvitysEmailsForAvustus(avustushakuID)).toHaveLength(
      1
    );
  });

  await test.step("sends only one loppuselvityspyyntö", async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page);
    await hakujenHallintaPage.navigateFromHeader();
    await hakujenHallintaPage.switchToLoppuselvitysTab();
    expect(await getLoppuselvitysEmailsForAvustus(avustushakuID)).toHaveLength(
      0
    );
    await hakujenHallintaPage.sendLoppuselvitys(1);
    expect(await getLoppuselvitysEmailsForAvustus(avustushakuID)).toHaveLength(
      1
    );
  });
});
