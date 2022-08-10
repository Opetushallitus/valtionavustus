import { defaultValues } from "../../fixtures/defaultValues";
import { HakijaAvustusHakuPage } from "../../pages/hakijaAvustusHakuPage";
import { expect } from "@playwright/test";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { dummyPdfPath, TEST_Y_TUNNUS } from "../../utils/constants";

const test = defaultValues.extend<{
  hakijaAvustusHakuPage: HakijaAvustusHakuPage;
}>({
  hakijaAvustusHakuPage: async (
    { page, answers, hakuProps, userCache },
    use
  ) => {
    expect(userCache).toBeDefined();
    const hakujenHallintaPage = new HakujenHallintaPage(page);
    const avustushakuID = await hakujenHallintaPage.createHakuFromEsimerkkihaku(
      hakuProps
    );
    await hakujenHallintaPage.switchToHaunTiedotTab();
    await hakujenHallintaPage.publishAvustushaku();
    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page);
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang);

    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      answers.contactPersonEmail
    );
    await hakijaAvustusHakuPage.page.goto(hakemusUrl);
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
    await use(hakijaAvustusHakuPage);
  },
});

test("hakemus requires all attachments to be uploaded before allowing to submit", async ({
  hakijaAvustusHakuPage,
}) => {
  const finaLocator = hakijaAvustusHakuPage.page.locator(
    "[name='financial-information-form']"
  );
  await test.step(
    "enables sending after uploading last attachment",
    async () => {
      await hakijaAvustusHakuPage.sendHakemusButton.isDisabled();
      await finaLocator.waitFor({ state: "attached" });
      await finaLocator.setInputFiles(dummyPdfPath);
      await finaLocator.waitFor({ state: "detached" });
      await hakijaAvustusHakuPage.sendHakemusButton.isEnabled();
    }
  );
  await test.step("can remove attachment", async () => {
    await hakijaAvustusHakuPage.page
      .locator("#financial-information-form")
      .locator("button.soresu-remove")
      .click();
    await finaLocator.waitFor({ state: "attached" });
  });
  await test.step("removal disables sending", async () => {
    await hakijaAvustusHakuPage.sendHakemusButton.isDisabled();
  });
  await test.step("adding last attachment back allows sending", async () => {
    await finaLocator.setInputFiles(dummyPdfPath);
    await hakijaAvustusHakuPage.sendHakemusButton.isEnabled();
    await hakijaAvustusHakuPage.submitApplication();
  });
});
