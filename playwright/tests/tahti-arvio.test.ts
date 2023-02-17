import { expect } from "@playwright/test";
import { muutoshakemusTest } from "../fixtures/muutoshakemusTest";
import { HakemustenArviointiPage } from "../pages/hakemustenArviointiPage";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";
import { answers } from "../utils/constants";

muutoshakemusTest.use({
  hakuProps: ({ hakuProps }, use) =>
    use({
      ...hakuProps,
      selectionCriteria: ["Onko hyvin tehty?", "Onko mittää järkee?"],
    }),
});

muutoshakemusTest(
  "Stars are shown on listing page",
  async ({ page, avustushakuID, submittedHakemus }) => {
    expect(submittedHakemus).toBeDefined();
    const hakujenHallintaPage = new HakujenHallintaPage(page);
    await hakujenHallintaPage.navigate(avustushakuID);
    await hakujenHallintaPage.closeAvustushakuByChangingEndDateToPast();
    const hakemustenArviointiPage = new HakemustenArviointiPage(page);
    const hakemusId =
      await hakemustenArviointiPage.navigateToLatestHakemusArviointi(
        avustushakuID
      );
    await hakemustenArviointiPage.page.locator("#close-hakemus-button").click();
    await hakemustenArviointiPage.selectValmistelijaForHakemus(
      hakemusId,
      "_ valtionavustus"
    );
    await hakemustenArviointiPage.selectArvioijaForHakemus(
      hakemusId,
      "_ valtionavustus"
    );
    await hakemustenArviointiPage.selectHakemusFromList(answers.projectName);
    await hakemustenArviointiPage.setSelectionCriteriaStars(1, 4);
    await hakemustenArviointiPage.setSelectionCriteriaStars(2, 1);
    const hakemusScore = await hakemustenArviointiPage.getHakemusScore(
      hakemusId
    );
    await hakemustenArviointiPage.navigate(avustushakuID);
    expect(hakemusScore).toEqual("2.5");
  }
);
