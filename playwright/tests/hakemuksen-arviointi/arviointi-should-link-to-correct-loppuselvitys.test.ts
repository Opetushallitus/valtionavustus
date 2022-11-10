import { waitForNewTab } from "../../utils/util";

import { LoppuselvitysPage } from "../../pages/loppuselvitysPage";
import { selvitysTest as test } from "../../fixtures/selvitysTest";
import { expect } from "@playwright/test";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";

test("Loppuselvitys tab in hakemuksen arviointi should have link to correct loppuselvitys form for the hakemus", async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
}) => {
  const loppuselvitysPage = LoppuselvitysPage(page);
  await test.step(
    "link is hidden before sending loppuselvitykset",
    async () => {
      await loppuselvitysPage.navigateToLoppuselvitysTab(
        avustushakuID,
        hakemusID
      );
      await expect(loppuselvitysPage.linkToForm).toBeHidden();
    }
  );
  await test.step("send loppuselvitykset", async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page);
    await hakujenHallintaPage.navigateToLoppuselvitys(avustushakuID);
    await hakujenHallintaPage.sendLoppuselvitys();
  });
  await test.step("link and lomake work", async () => {
    await loppuselvitysPage.navigateToLoppuselvitysTab(
      avustushakuID,
      hakemusID
    );
    const [loppuselvitysFormPage] = await Promise.all([
      waitForNewTab(page),
      loppuselvitysPage.linkToForm.click(),
    ]);
    await loppuselvitysFormPage.waitForNavigation();
    await expect(
      loppuselvitysFormPage.locator("h1").locator('text="Loppuselvitys"')
    ).toBeVisible();
    await expect(
      loppuselvitysFormPage.locator("button", {
        hasText: "Lähetä käsiteltäväksi",
      })
    ).toBeVisible();
  });
});
