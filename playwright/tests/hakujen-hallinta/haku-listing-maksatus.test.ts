import { expect } from "@playwright/test";
import { muutoshakemusTest } from "../../fixtures/muutoshakemusTest";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { MaksatuksetPage } from "../../pages/maksatuksetPage";
import { expectToBeDefined } from "../../utils/util";

muutoshakemusTest(
  "Hakujen hallinta listing Maksatus column",
  async ({ page, avustushakuID, acceptedHakemus, avustushakuName }) => {
    expectToBeDefined(acceptedHakemus);

    await muutoshakemusTest.step(
      "should be empty when maksatukset not sent yet",
      async () => {
        const hakujenHallintaPage = new HakujenHallintaPage(page);
        await hakujenHallintaPage.navigate(avustushakuID);
        const maksatuksetCell = hakujenHallintaPage
          .hakuListingTableSelectors()
          .maksatukset.cellValue(avustushakuName);

        await expect(maksatuksetCell).toHaveText("-");
      }
    );

    await muutoshakemusTest.step("sending maksatukset", async () => {
      const maksatuksetPage = MaksatuksetPage(page);
      await maksatuksetPage.goto(avustushakuName);
      await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset();
    });

    await muutoshakemusTest.step(
      "should have today's date after maksatukset sent",
      async () => {
        const hakujenHallintaPage = new HakujenHallintaPage(page);
        await hakujenHallintaPage.navigate(avustushakuID);
        const maksatuksetCell = hakujenHallintaPage
          .hakuListingTableSelectors()
          .maksatukset.cellValue(avustushakuName);

        const today = new Date();
        const day = today.getDate().toString().padStart(2, "0");
        const month = (today.getMonth() + 1).toString().padStart(2, "0");
        const year = today.getFullYear().toString().slice(2);
        const todayString = `${day}.${month}.${year}`;

        await expect(maksatuksetCell).toHaveText(todayString);
      }
    );
  }
);
