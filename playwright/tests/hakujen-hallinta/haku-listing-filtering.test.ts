import { expect } from "@playwright/test";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";

const getIndexInHakuList = async (
  hakujenHallintaPage: HakujenHallintaPage,
  avustushakuName: string
) => {
  const { hakuList, columns } = hakujenHallintaPage.hakuListingTableSelectors();
  await hakuList.waitFor();
  const rows = await columns.avustushaku.cellValues();
  const defaultAvustushakuName = "Yleisavustus - esimerkkihaku";
  return {
    defaultAvustushakuIndex: rows.indexOf(defaultAvustushakuName),
    testAvustushakuIndex: rows.indexOf(avustushakuName),
    avustusHakuAmount: rows.length,
  };
};

test("filtering haku table", async ({ avustushakuID, page, hakuProps }) => {
  const { avustushakuName } = hakuProps;
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await hakujenHallintaPage.navigate(avustushakuID, { newHakuListing: true });
  const { columns } = hakujenHallintaPage.hakuListingTableSelectors();
  const { avustushaku, tila, vaihe, hakuaika } = columns;
  await test.step("filtering with avustushaku name works", async () => {
    const beforeFiltering = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(beforeFiltering.avustusHakuAmount).toBeGreaterThanOrEqual(2);
    expect(beforeFiltering.defaultAvustushakuIndex).toBeGreaterThanOrEqual(0);
    expect(beforeFiltering.testAvustushakuIndex).toBeGreaterThanOrEqual(0);
    await avustushaku.input.fill(avustushakuName);
    const afterFiltering = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterFiltering.defaultAvustushakuIndex).toEqual(-1);
    expect(afterFiltering.testAvustushakuIndex).toEqual(0);
    expect(afterFiltering.avustusHakuAmount).toEqual(1);
    await avustushaku.input.fill("");
    const afterClearingFilter = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterClearingFilter).toEqual(beforeFiltering);
  });
  await test.step("filters with tila", async () => {
    const { toggle, uusiCheckbox } = tila;
    await toggle.click();
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
    const { toggle, kiinniCheckbox } = vaihe;
    await toggle.click();
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
    const { toggle, hakuaikaStart, hakuaikaEnd, clear } = hakuaika;
    await clear.waitFor({ state: "hidden" });
    await toggle.click();
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
    await clear.waitFor();
    await hakuaikaEnd.fill("31.12.2015");
    await page.keyboard.press("Tab");
    const afterBothFilters = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterBothFilters.avustusHakuAmount).toEqual(1);
    expect(afterBothFilters.defaultAvustushakuIndex).toEqual(0);
    await clear.click();
    const afterClearing = await getIndexInHakuList(
      hakujenHallintaPage,
      avustushakuName
    );
    expect(afterClearing.avustusHakuAmount).toEqual(
      beforeFiltering.avustusHakuAmount
    );
  });
});
