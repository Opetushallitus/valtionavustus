import { expect } from "@playwright/test";
import { muutoshakemusTest } from "../fixtures/muutoshakemusTest";
import { HakemustenArviointiPage } from "../pages/hakemustenArviointiPage";
import { RefusePage } from "../pages/hakija/refuse-page";
import {
  getLoppuselvitysEmailsForAvustus,
  getValiselvitysEmailsForAvustus,
} from "../utils/emails";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";
import { HakijaAvustusHakuPage } from "../pages/hakijaAvustusHakuPage";
import { Answers } from "../utils/types";
import { expectToBeDefined } from "../utils/util";

interface Fixtures {
  secondAnswers: Answers;
  acceptedHakemukset: {
    hakemusID: number;
    secondHakemusID: number;
  };
}

const test = muutoshakemusTest.extend<Fixtures>({
  secondAnswers: async ({ answers }, use) => {
    await use({
      ...answers,
      projectName: "Projekti 2",
      contactPersonEmail: "erkki2.esimerkki@example.com",
    });
  },
  submittedHakemus: async (
    { avustushakuID, answers, secondAnswers, page },
    use
  ) => {
    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page);
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang);
    const userKey =
      await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(
        avustushakuID,
        answers
      );
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang);
    await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(
      avustushakuID,
      secondAnswers
    );
    await use(userKey);
  },
  acceptedHakemukset: async (
    {
      closedAvustushaku,
      page,
      answers,
      secondAnswers,
      avustushakuID,
      projektikoodi,
      codes,
      ukotettuValmistelija,
    },
    use
  ) => {
    expectToBeDefined(closedAvustushaku);
    const hakemustenArviointiPage = new HakemustenArviointiPage(page);
    await hakemustenArviointiPage.navigate(avustushakuID);
    let hakemusID = 0;
    let secondHakemusID = 0;
    await test.step("accept first", async () => {
      hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
        avustushakuID,
        projectName: answers.projectName,
        projektikoodi,
        codes,
      });
      await hakemustenArviointiPage.closeHakemusDetails();
      await hakemustenArviointiPage.selectValmistelijaForHakemus(
        hakemusID,
        ukotettuValmistelija
      );
      await hakemustenArviointiPage.closeHakemusDetails();
    });
    await test.step("accept second", async () => {
      secondHakemusID = await hakemustenArviointiPage.acceptAvustushaku({
        avustushakuID,
        projectName: secondAnswers.projectName,
        projektikoodi,
        codes,
      });
      await hakemustenArviointiPage.closeHakemusDetails();
      await hakemustenArviointiPage.selectValmistelijaForHakemus(
        secondHakemusID,
        ukotettuValmistelija
      );
    });
    await use({
      hakemusID,
      secondHakemusID,
    });
  },
});

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
