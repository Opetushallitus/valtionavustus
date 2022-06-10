import { expect } from "@playwright/test";
import { defaultValues } from "../../fixtures/defaultValues";
import { HakijaAvustusHakuPage } from "../../pages/hakijaAvustusHakuPage";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { dummyPdfPath, HAKIJA_URL, TEST_Y_TUNNUS } from "../../utils/constants";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import {
  Email,
  getAcceptedPäätösEmails,
  waitUntilMinEmails,
} from "../../utils/emails";
import moment from "moment";
import { expectToBeDefined } from "../../utils/util";

const test = defaultValues.extend<{
  emails: Email[];
}>({
  emails: async (
    { page, answers, hakuProps, userCache, ukotettuValmistelija },
    use
  ) => {
    expect(userCache).toBeDefined();
    const hakujenHallintaPage = new HakujenHallintaPage(page);
    const avustushakuID = await hakujenHallintaPage.createHakuFromEsimerkkihaku(
      hakuProps
    );
    await hakujenHallintaPage.publishAvustushaku(avustushakuID);
    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page);
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang);

    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      answers.contactPersonEmail
    );
    await hakijaAvustusHakuPage.page.goto(hakemusUrl);
    await test.step("fill application", async () => {
      await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS);
      await hakijaAvustusHakuPage.page.fill(
        "#applicant-name",
        answers.contactPersonName
      );
      await hakijaAvustusHakuPage.page.fill(
        "#signature",
        answers.contactPersonName
      );
      await hakijaAvustusHakuPage.page.fill(
        "#signature-email",
        answers.contactPersonEmail
      );
      await hakijaAvustusHakuPage.page.fill(
        "#bank-iban",
        "FI95 6682 9530 0087 65"
      );
      await hakijaAvustusHakuPage.page.fill("#bank-bic", "OKOYFIHH");
      await hakujenHallintaPage.page.click('text="Kansanopisto"');
      await hakujenHallintaPage.page.fill(
        "[name='project-costs-row.amount']",
        "100000"
      );
      await hakijaAvustusHakuPage.page
        .locator("[name='previous-income-statement-and-balance-sheet']")
        .setInputFiles(dummyPdfPath);
      await hakijaAvustusHakuPage.page
        .locator("[name='previous-financial-year-report']")
        .setInputFiles(dummyPdfPath);
      await hakijaAvustusHakuPage.page
        .locator("[name='previous-financial-year-auditor-report']")
        .setInputFiles(dummyPdfPath);
      await hakijaAvustusHakuPage.page
        .locator("[name='current-year-plan-for-action-and-budget']")
        .setInputFiles(dummyPdfPath);
      await hakijaAvustusHakuPage.page
        .locator(
          "[name='description-of-functional-development-during-last-five-years']"
        )
        .setInputFiles(dummyPdfPath);
      await hakijaAvustusHakuPage.page
        .locator("[name='financial-information-form']")
        .setInputFiles(dummyPdfPath);
    });
    await hakijaAvustusHakuPage.submitApplication();
    await hakujenHallintaPage.navigate(avustushakuID);
    await hakujenHallintaPage.setEndDate(
      moment().subtract(1, "year").format("D.M.YYYY H.mm")
    );
    const hakemustenArviointiPage = new HakemustenArviointiPage(page);
    let hakemusID: number | undefined;
    await test.step("accept hakemus", async () => {
      await hakemustenArviointiPage.navigate(avustushakuID);
      await Promise.all([
        page.waitForNavigation(),
        hakemustenArviointiPage.page.click(`text=${hakuProps.registerNumber}`),
      ]);
      hakemusID = await hakemustenArviointiPage.getHakemusID();
      await hakemustenArviointiPage.page.click(
        `label:has-text("Ammatillinen koulutus")`
      );
      await hakemustenArviointiPage.acceptHakemus();
      expectToBeDefined(hakemusID);
      await hakemustenArviointiPage.waitForArvioSave(avustushakuID, hakemusID);
    });
    await test.step("Resolve avustushaku", async () => {
      await hakujenHallintaPage.navigate(avustushakuID);
      await hakujenHallintaPage.resolveAvustushaku();
    });

    await test.step("Add valmistelija for hakemus", async () => {
      await hakemustenArviointiPage.navigate(avustushakuID);
      await hakemustenArviointiPage.selectValmistelijaForHakemus(
        hakemusID!,
        ukotettuValmistelija
      );
    });
    await test.step("send päätökset", async () => {
      await hakujenHallintaPage.navigateToPaatos(avustushakuID);
      await hakujenHallintaPage.sendPaatos(avustushakuID);
    });
    const emails = await waitUntilMinEmails(
      getAcceptedPäätösEmails,
      1,
      hakemusID!
    );
    await use(emails);
  },
});

test("hakija does not get an email with link to muutoshakemu when avustushaku fields could not be normalized", async ({
  emails,
}) => {
  emails.forEach((email) => {
    expect(email.formatted).not.toContain(`${HAKIJA_URL}/muutoshakemus`);
  });
});
