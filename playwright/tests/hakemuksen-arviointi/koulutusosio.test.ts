import { defaultValues } from "../../fixtures/defaultValues";
import { expect } from "@playwright/test";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { HakijaAvustusHakuPage } from "../../pages/hakijaAvustusHakuPage";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { HakijaPaatosPage } from "../../pages/HakijaPaatosPage";

type KoulutusosioFixtures = {
  avustushakuID: number;
};

const test = defaultValues.extend<KoulutusosioFixtures>({
  avustushakuID: async ({ page, hakuProps, userCache }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000);
    expect(userCache).toBeDefined();

    const hakujenHallintaPage = new HakujenHallintaPage(page);
    const avustushakuID = await hakujenHallintaPage.createKoulutusasteHaku(
      hakuProps
    );
    await use(avustushakuID);
  },
});

const koulutusosioCases = [
  {
    type: "koulutuspäivä",
    haettu: "99 kp",
    hyvaksytty: "10 kp",
    expectedHaettu: "990",
    expectedHyvaksytty: "50",
  },
  {
    type: "opintopiste",
    haettu: "99 op",
    hyvaksytty: "10 op",
    expectedHaettu: "4 455",
    expectedHyvaksytty: "225",
  },
] as const;

test.describe.parallel("avustushaku with koulutusosio happy path", () => {
  for (const {
    type,
    haettu,
    hyvaksytty,
    expectedHaettu,
    expectedHyvaksytty,
  } of koulutusosioCases) {
    test(type, async ({ avustushakuID, page, answers }) => {
      await test.step("send hakemus", async () => {
        const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page);
        await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang);
        await hakijaAvustusHakuPage.fillKoulutusosioHakemus(
          avustushakuID,
          answers,
          type
        );
        await hakijaAvustusHakuPage.submitApplication();
      });
      let hakemusID = 0;
      const hakujenHallintaPage = new HakujenHallintaPage(page);
      const hakemustenArviointiPage = new HakemustenArviointiPage(page);
      await test.step("get ready", async () => {
        await hakujenHallintaPage.navigate(avustushakuID);
        await hakujenHallintaPage.closeAvustushakuByChangingEndDateToPast();
        await hakemustenArviointiPage.navigate(avustushakuID);
        await hakemustenArviointiPage.selectHakemusFromList(
          answers.projectName
        );
        hakemusID = await hakemustenArviointiPage.getHakemusID();
      });
      await test.step("ukota", async () => {
        await hakemustenArviointiPage.closeHakemusDetails();
        await hakemustenArviointiPage.selectValmistelijaForHakemus(
          hakemusID,
          "_ valtionavustus"
        );
        await hakemustenArviointiPage.selectArvioijaForHakemus(
          hakemusID,
          "_ valtionavustus"
        );
      });
      await hakemustenArviointiPage.selectHakemusFromList(answers.projectName);
      const { koulutusosio, budget } =
        hakemustenArviointiPage.arviointiTabLocators();
      await budget.fill("1000");
      await test.step("fill koulutusosio", async () => {
        const { osioName, osio } = koulutusosio;
        await expect(osioName).toHaveText("Osio 1");
        await expect(osio.haettu).toHaveText(haettu);
        await expect(osio.hyvaksyttyInput).toHaveValue("99");
        await osio.hyvaksyttyInput.fill("10");
        await expect(osio.haettuOsallistujaMaara).toHaveText("10");
        await expect(osio.hyvaksyttyOsallistujaMaaraInput).toHaveValue("10");
        await osio.hyvaksyttyOsallistujaMaaraInput.fill("5");
      });
      await test.step("accept hakemus", async () => {
        await hakemustenArviointiPage.page.click(
          "#arviointi-tab label[for='set-arvio-status-accepted']"
        );
        await hakemustenArviointiPage.waitForSave();
      });
      await test.step("send paatos", async () => {
        await hakujenHallintaPage.navigate(avustushakuID);
        await hakujenHallintaPage.resolveAvustushaku();
        await hakujenHallintaPage.waitForSave();
        const paatosPage = await hakujenHallintaPage.switchToPaatosTab();
        await paatosPage.sendPaatos();
      });
      await test.step("hakija got correct koulutusosiot", async () => {
        const hakijaPaatosPage = HakijaPaatosPage(page);
        await hakijaPaatosPage.navigate(hakemusID);
        const { koulutusosiot } = hakijaPaatosPage;
        await expect(koulutusosiot.osioName).toHaveText("Osio 1");
        await expect(koulutusosiot.koulutusosioPaivat.haettu).toHaveText(
          haettu
        );
        await expect(koulutusosiot.koulutusosioPaivat.hyvaksytty).toHaveText(
          hyvaksytty
        );
        await expect(koulutusosiot.osallistujat.haettu).toHaveText("10");
        await expect(koulutusosiot.osallistujat.hyvaksytty).toHaveText("5");
        await expect(koulutusosiot.osio.haettu).toHaveText(expectedHaettu);
        await expect(koulutusosiot.osio.hyvaksytty).toHaveText(
          expectedHyvaksytty
        );
        await expect(
          koulutusosiot.koulutettavapaivatYhteensa.haettu
        ).toHaveText(expectedHaettu);
        await expect(
          koulutusosiot.koulutettavapaivatYhteensa.hyvaksytty
        ).toHaveText(expectedHyvaksytty);
      });
    });
  }
});
