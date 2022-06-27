import { expect } from "@playwright/test";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";

const getIndexInHakuList = async (
  hakujenHallintaPage: HakujenHallintaPage,
  avustushakuName: string
) => {
  const { hakuList, hakuRows } = hakujenHallintaPage.hakuListingSelectors();
  await hakuList.waitFor();
  const rows = await hakuRows.allInnerTexts();
  const defaultAvustushakuName = "Yleisavustus - esimerkkihaku";
  return {
    defaultAvustushakuIndex: rows.findIndex((text) =>
      text.includes(defaultAvustushakuName)
    ),
    testAvustushakuIndex: rows.findIndex((text) =>
      text.includes(avustushakuName)
    ),
    avustusHakuAmount: rows.length,
  };
};

test("filtering haku table", async ({ avustushakuID, page, hakuProps }) => {
  const { avustushakuName } = hakuProps;
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await hakujenHallintaPage.navigate(avustushakuID, { newHakuListing: true });
  const { avustushakuFilterInput, tilaPopup, vaihePopup, hakuaikaPopup } =
    hakujenHallintaPage.hakuListingSelectors();
  await test.step("filtering with avustushaku name works", async () => {
    const beforeFiltering = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(beforeFiltering.avustusHakuAmount).toBeGreaterThanOrEqual(2);
    expect(beforeFiltering.defaultAvustushakuIndex).toBeGreaterThanOrEqual(0);
    expect(beforeFiltering.testAvustushakuIndex).toBeGreaterThanOrEqual(0);
    await avustushakuFilterInput.fill(avustushakuName);
    const afterFiltering = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterFiltering.defaultAvustushakuIndex).toEqual(-1);
    expect(afterFiltering.testAvustushakuIndex).toEqual(0);
    expect(afterFiltering.avustusHakuAmount).toEqual(1);
    await avustushakuFilterInput.fill("");
    const afterClearingFilter = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterClearingFilter).toEqual(beforeFiltering);
  });
  await test.step("filters with tila", async () => {
    const { labelBtn, uusiCheckbox } = tilaPopup;
    await labelBtn.click();
    await uusiCheckbox.uncheck();
    const afterFiltering = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterFiltering.defaultAvustushakuIndex).toEqual(-1);
    expect(afterFiltering.testAvustushakuIndex).toBeGreaterThanOrEqual(0);
    await uusiCheckbox.check();
    const afterClearing = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterClearing.defaultAvustushakuIndex).toBeGreaterThanOrEqual(0);
    expect(afterClearing.testAvustushakuIndex).toBeGreaterThanOrEqual(0);
  });
  await test.step("filters with vaihe", async () => {
    const { labelBtn, kiinniCheckbox } = vaihePopup;
    await labelBtn.click();
    await kiinniCheckbox.uncheck();
    const afterFiltering = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterFiltering.defaultAvustushakuIndex).toEqual(-1);
    expect(afterFiltering.testAvustushakuIndex).toBeGreaterThanOrEqual(0);
    await kiinniCheckbox.check();
    const afterClearing = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterClearing.defaultAvustushakuIndex).toBeGreaterThanOrEqual(0);
    expect(afterClearing.testAvustushakuIndex).toBeGreaterThanOrEqual(0);
  });
  await test.step("filters with hakuaika", async () => {
    const { labelBtn, hakuaikaStart, hakuaikaEnd, clearBtn } = hakuaikaPopup;
    await clearBtn.waitFor({ state: "hidden" });
    await labelBtn.click();
    const beforeFiltering = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    await hakuaikaStart.fill("17.9.2015");
    await page.keyboard.press("Tab");
    const afterStartFilter = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterStartFilter.avustusHakuAmount).toBeLessThan(
      beforeFiltering.avustusHakuAmount
    );
    await clearBtn.waitFor();
    await hakuaikaEnd.fill("31.12.2015");
    await page.keyboard.press("Tab");
    const afterBothFilters = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterBothFilters.avustusHakuAmount).toEqual(1);
    expect(afterBothFilters.defaultAvustushakuIndex).toEqual(0);
    await clearBtn.click();
    const afterClearing = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterClearing.avustusHakuAmount).toEqual(
      beforeFiltering.avustusHakuAmount
    );
  });
});
