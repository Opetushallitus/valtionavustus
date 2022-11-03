import { budjettimuutoshakemusTest } from "../../fixtures/budjettimuutoshakemusTest";
import { expect } from "@playwright/test";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import fs from "fs/promises";
import path from "path";

budjettimuutoshakemusTest(
  "warns missing financing-plan",
  async ({ hakuProps, userCache, page }, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000);
    expect(userCache).toBeDefined();
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(
      path.join(__dirname, "../../fixtures/budjettimuutos.hakulomake.json"),
      "utf8"
    );
    const hakujenHallintaPage = new HakujenHallintaPage(page);
    const missingField = page.locator(
      "text=Lomakkeesta puuttuu muutoshakemukselle tarpeellinen kenttä. Muutoshaku ei ole mahdollista."
    );
    const { avustushakuID } =
      await hakujenHallintaPage.createHakuWithLomakeJson(
        muutoshakemusEnabledHakuLomakeJson,
        hakuProps
      );
    const formEditor = await hakujenHallintaPage.navigateToFormEditor(
      avustushakuID
    );
    await expect(missingField).toBeHidden();
    const badBuduLomake = await fs.readFile(
      path.join(
        __dirname,
        "../../fixtures/budjettimuutos-bad-budget.hakulomake.json"
      ),
      "utf8"
    );
    await formEditor.changeLomakeJson(badBuduLomake);
    await formEditor.saveForm();
    await expect(missingField).toBeVisible();
    await page.locator("text=Näytä lisätietoja").click();
    await expect(
      page
        .locator("div.muutoshakukelpoisuus-warning")
        .locator("text=financing-plan")
    ).toBeVisible();
  }
);
