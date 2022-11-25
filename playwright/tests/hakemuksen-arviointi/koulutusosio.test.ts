import { defaultValues } from "../../fixtures/defaultValues";
import { expect } from "@playwright/test";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { HakijaAvustusHakuPage } from "../../pages/hakijaAvustusHakuPage";
import { expectToBeDefined } from "../../utils/util";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { HakijaPaatosPage } from "../../pages/HakijaPaatosPage";

type KoulutusosioFixtures = {
  avustushakuID: number;
  userKey: string;
  hakemusID: number;
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
  userKey: async ({ page, avustushakuID, answers }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 15_000);
    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page);
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang);
    await hakijaAvustusHakuPage.fillKoulutusosioHakemus(avustushakuID, answers);
    const { userKey } = await hakijaAvustusHakuPage.submitApplication();
    await use(userKey);
  },
  hakemusID: async ({ page, avustushakuID, answers, userKey }, use) => {
    expectToBeDefined(userKey);
    const hakujenHallintaPage = new HakujenHallintaPage(page);
    await hakujenHallintaPage.navigate(avustushakuID);
    await hakujenHallintaPage.closeAvustushakuByChangingEndDateToPast();
    const hakemustenArviointiPage = new HakemustenArviointiPage(page);
    await hakemustenArviointiPage.navigate(avustushakuID);
    await hakemustenArviointiPage.selectHakemusFromList(answers.projectName);
    const hakemusID = await hakemustenArviointiPage.getHakemusID();
    await use(hakemusID);
  },
});

test("avustushaku with koulutusosio happy path", async ({
  hakemusID,
  avustushakuID,
  page,
}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page);
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
  const { koulutusosio, budget } =
    hakemustenArviointiPage.arviointiTabLocators();
  await budget.fill("1000");
  await test.step("fill koulutusosio", async () => {
    const { osioName, koulutettavapaivat } = koulutusosio;
    await expect(osioName).toHaveText("Osio 1");
    await expect(koulutettavapaivat.haettuPaivat).toHaveText("99 kp");
    await expect(koulutettavapaivat.hyvaksyttyPaivatInput).toHaveValue("99");
    await koulutettavapaivat.hyvaksyttyPaivatInput.fill("10");
    await expect(koulutettavapaivat.haettuOsallistujaMaara).toHaveText("10");
    await expect(
      koulutettavapaivat.hyvaksyttyOsallistujaMaaraInput
    ).toHaveValue("10");
    await koulutettavapaivat.hyvaksyttyOsallistujaMaaraInput.fill("5");
  });
  await test.step("accept hakemus", async () => {
    await hakemustenArviointiPage.page.click(
      "#arviointi-tab label[for='set-arvio-status-accepted']"
    );
    await hakemustenArviointiPage.waitForSave();
  });
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await test.step("send paatos", async () => {
    await hakujenHallintaPage.navigate(avustushakuID);
    await hakujenHallintaPage.resolveAvustushaku();
    await hakujenHallintaPage.waitForSave();
    await hakujenHallintaPage.switchToPaatosTab();
    await hakujenHallintaPage.sendPaatos(avustushakuID);
  });
  await test.step("hakija got correct koulutusosiot", async () => {
    const hakijaPaatosPage = HakijaPaatosPage(page);
    await hakijaPaatosPage.navigate(hakemusID);
    const { koulutusosiot } = hakijaPaatosPage;
    await expect(koulutusosiot.osioName).toHaveText("Osio 1");
    await expect(koulutusosiot.koulutusosioPaivat.haettu).toHaveText("99 kp");
    await expect(koulutusosiot.koulutusosioPaivat.hyvaksytty).toHaveText(
      "10 kp"
    );
    await expect(koulutusosiot.osallistujat.haettu).toHaveText("10");
    await expect(koulutusosiot.osallistujat.hyvaksytty).toHaveText("5");
    await expect(koulutusosiot.koulutettavapaivat.haettu).toHaveText("990");
    await expect(koulutusosiot.koulutettavapaivat.hyvaksytty).toHaveText("50");
    await expect(koulutusosiot.koulutettavapaivatYhteensa.haettu).toHaveText(
      "990"
    );
    await expect(
      koulutusosiot.koulutettavapaivatYhteensa.hyvaksytty
    ).toHaveText("50");
  });
});
