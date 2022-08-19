import { expect } from "@playwright/test";
import { defaultValues } from "../../fixtures/defaultValues";
import { KoodienhallintaPage } from "../../pages/koodienHallintaPage";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { randomString } from "../../utils/random";

const tatili1 = {
  code: randomString(),
  name: `Tili 1 ${randomString()}`,
  year: "2022",
  amount: "10000",
};
const tatili2 = {
  code: randomString(),
  name: `Tili 2 ${randomString()}`,
  year: "2022",
  amount: "10000",
};
type CreateTaTili = typeof tatili1;

const taTiliSelectValue = ({ code, name, year }: typeof tatili1) =>
  `${code} ${name} (${year})`;

const koulutus = "Ammatillinen koulutus";
const lukio = "Lukiokoulutus";
const kansalaisopisto = "Kansalaisopisto";

const test = defaultValues.extend<{
  tatili1: CreateTaTili;
  tatili2: CreateTaTili;
  hakujenHallintaPage: HakujenHallintaPage;
}>({
  tatili1,
  tatili2,
  hakujenHallintaPage: async ({ page, avustushakuName }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 30_000);
    await test.step("create test tatilit", async () => {
      const koodienhallintaPage = KoodienhallintaPage(page);
      await koodienhallintaPage.navigate();
      await koodienhallintaPage.switchToTatilitTab();
      const taForm = koodienhallintaPage.taTilit.form;
      const createTaTili = async ({
        code,
        name,
        year,
        amount,
      }: typeof tatili1) => {
        await taForm.code.input.fill(code);
        await taForm.name.input.fill(name);
        await taForm.year.input.fill(year);
        await taForm.amount.input.fill(amount);
        await taForm.submitBtn.click();
        await expect(taForm.submitBtn).toBeEnabled();
      };
      await createTaTili(tatili1);
      await createTaTili(tatili2);
    });
    const hakujenHallinta = new HakujenHallintaPage(page);
    await hakujenHallinta.copyEsimerkkihaku();
    await hakujenHallinta
      .hauntiedotLocators()
      .hakuName.fi.fill(avustushakuName);
    await expect(
      hakujenHallinta.page.locator(
        "text=Jossain kentässä puutteita. Tarkasta arvot."
      )
    ).toBeVisible();
    await use(hakujenHallinta);
  },
});

test.describe.parallel("new talousarvio select", () => {
  test("tili and koulutusaste basic flow", async ({
    page,
    hakujenHallintaPage,
  }) => {
    const locators = hakujenHallintaPage.hauntiedotLocators();
    const taTili = locators.taTili;
    const firstTili = taTili.tili(0);
    const firstTiliFirstKoulutusaste = firstTili.koulutusaste(0);
    await test.step("correct starting states", async () => {
      await expect(firstTili.placeholder).toHaveText("Valitse talousarviotili");
      await expect(firstTiliFirstKoulutusaste.placeholder).toHaveText(
        "Valitse ensin talousarviotili"
      );
      await expect(firstTiliFirstKoulutusaste.input).toBeDisabled();
    });
    await test.step("can select tili", async () => {
      await expect(firstTili.value).toBeHidden();
      await firstTili.input.fill(tatili1.name);
      await expect(firstTili.option.first()).toBeEnabled();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await hakujenHallintaPage.waitForSave();
      await expect(firstTili.placeholder).toBeHidden();
      await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili1));
    });
    await test.step(
      "tili is disabled in options after its selected",
      async () => {
        await firstTili.input.click();
        await firstTili.input.fill(tatili1.name);
        await expect(firstTili.option.first()).toBeVisible();
        await expect(firstTili.option.first()).toHaveAttribute(
          "aria-disabled",
          "true"
        );
      }
    );
    await test.step(
      "koulutusaste select gets enabled after selecting tili",
      async () => {
        await expect(firstTiliFirstKoulutusaste.input).toBeEnabled();
        await expect(firstTiliFirstKoulutusaste.placeholder).toHaveText(
          "Valitse talousarviotilin koulutusaste"
        );
      }
    );
    await test.step("can add koulutusaste", async () => {
      await expect(firstTiliFirstKoulutusaste.addKoulutusasteBtn).toBeHidden();
      await expect(firstTiliFirstKoulutusaste.value).toBeHidden();
      await firstTiliFirstKoulutusaste.input.fill(koulutus);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await expect(firstTiliFirstKoulutusaste.placeholder).toBeHidden();
      await expect(firstTiliFirstKoulutusaste.value).toHaveText(koulutus);
      await hakujenHallintaPage.waitForSave();
      await expect(firstTiliFirstKoulutusaste.addKoulutusasteBtn).toBeVisible();
    });
    await test.step("values where saved", async () => {
      await page.reload();
      await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili1));
      await expect(firstTiliFirstKoulutusaste.value).toHaveText(koulutus);
    });
  });
  test("empty selects dont get saved", async ({
    tatili1,
    hakujenHallintaPage,
    page,
  }) => {
    const locators = hakujenHallintaPage.hauntiedotLocators();
    const taTili = locators.taTili;
    const firstTili = taTili.tili(0);
    const secondTili = taTili.tili(1);
    const thirdTili = taTili.tili(2);
    await test.step("add 2 more tilis", async () => {
      await firstTili.addTiliBtn.click();
      await expect(secondTili.input).toBeVisible();
      await firstTili.addTiliBtn.click();
      await expect(thirdTili.input).toBeVisible();
      await hakujenHallintaPage.waitForSave();
    });
    await test.step("add value to 3rd tili", async () => {
      await thirdTili.input.fill(tatili1.name);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await hakujenHallintaPage.waitForSave();
      await expect(thirdTili.value).toHaveText(taTiliSelectValue(tatili1));
    });
    await test.step("add koulutusaste to 3rd tili", async () => {
      await thirdTili.koulutusaste(0).input.fill(lukio);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await hakujenHallintaPage.waitForSave();
    });
    await test.step("add 3 more koulutusaste to third tili", async () => {
      await thirdTili.koulutusaste(0).addKoulutusasteBtn.click();
      await expect(thirdTili.koulutusaste(1).input).toBeVisible();
      await thirdTili.koulutusaste(0).addKoulutusasteBtn.first().click();
      await expect(thirdTili.koulutusaste(2).input).toBeVisible();
      await thirdTili.koulutusaste(0).addKoulutusasteBtn.first().click();
      await expect(thirdTili.koulutusaste(3).input).toBeVisible();
      await hakujenHallintaPage.waitForSave();
    });
    await test.step(
      "add koulutusaste to 4th koulutusaste on 3rd tili",
      async () => {
        await thirdTili.koulutusaste(3).input.fill(kansalaisopisto);
        await page.keyboard.press("Tab");
        await page.keyboard.press("Enter");
        await hakujenHallintaPage.waitForSave();
      }
    );
    await test.step(
      "after page reload empty selects disappear (as they are not saved)",
      async () => {
        await page.reload();
        await expect(firstTili.input).toBeVisible();
        await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili1));
        await expect(secondTili.input).toBeHidden();
        await expect(firstTili.koulutusaste(0).input).toBeVisible();
        await expect(firstTili.koulutusaste(0).value).toHaveText(lukio);
        await expect(firstTili.koulutusaste(1).input).toBeVisible();
        await expect(firstTili.koulutusaste(1).value).toHaveText(
          kansalaisopisto
        );
        await expect(firstTili.koulutusaste(2).input).toBeHidden();
      }
    );
  });
  test("can delete tilis and koulutusaste", async ({
    tatili1,
    hakujenHallintaPage,
    page,
  }) => {
    const locators = hakujenHallintaPage.hauntiedotLocators();
    const taTili = locators.taTili;
    const firstTili = taTili.tili(0);
    const secondTili = taTili.tili(1);
    const thirdTili = taTili.tili(2);
    const secondTiliFirstKoulutusaste = secondTili.koulutusaste(0);
    const thirdTiliFirstKoulutusaste = thirdTili.koulutusaste(0);
    const thirdTiliSecondKoulutusaste = thirdTili.koulutusaste(1);
    const thirdTiliThirdKoulutusaste = thirdTili.koulutusaste(2);
    await test.step("add 2 more tilis", async () => {
      await firstTili.addTiliBtn.click();
      await expect(secondTili.input).toBeVisible();
      await firstTili.addTiliBtn.click();
      await expect(thirdTili.input).toBeVisible();
      await hakujenHallintaPage.waitForSave();
    });
    await test.step("add value to 2nd tili with koulutusaste", async () => {
      await secondTili.input.fill(tatili1.name);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await hakujenHallintaPage.waitForSave();
      await expect(secondTili.value).toHaveText(taTiliSelectValue(tatili1));
      await secondTiliFirstKoulutusaste.input.fill(lukio);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
    });
    await test.step("add value to 3rd tili", async () => {
      await thirdTili.input.fill(tatili2.name);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await hakujenHallintaPage.waitForSave();
      await expect(thirdTili.value).toHaveText(taTiliSelectValue(tatili2));
    });
    await test.step("add 3 koulutusaste to 3rd tili", async () => {
      await thirdTiliFirstKoulutusaste.input.fill(koulutus);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await thirdTiliFirstKoulutusaste.addKoulutusasteBtn.click();
      await thirdTiliSecondKoulutusaste.input.fill(lukio);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await thirdTiliSecondKoulutusaste.addKoulutusasteBtn.last().click();
      await thirdTiliThirdKoulutusaste.input.fill(kansalaisopisto);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await hakujenHallintaPage.waitForSave();
    });
    await test.step("remove 2nd koulutusaste from 3rd tili", async () => {
      await thirdTili.koulutusaste(1).removeKoulutusasteBtn(lukio).click();
      await hakujenHallintaPage.waitForSave();
      await expect(thirdTiliFirstKoulutusaste.value).toHaveText(koulutus);
      await expect(thirdTiliSecondKoulutusaste.value).toHaveText(
        kansalaisopisto
      );
      await expect(thirdTiliThirdKoulutusaste.value).toBeHidden();
    });
    await test.step("remove 1st and 2nd tili", async () => {
      await firstTili.removeTiliBtn.click();
      await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili1));
      await expect(secondTili.value).toHaveText(taTiliSelectValue(tatili2));
      await expect(thirdTili.input).toBeHidden();
      await firstTili.removeTiliBtn.click();
      await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili2));
      await expect(secondTili.input).toBeHidden();
      await hakujenHallintaPage.waitForSave();
    });
    await test.step("reload to see they saved correctly", async () => {
      await page.reload();
      await expect(firstTili.value).toHaveText(taTiliSelectValue(tatili2));
      await expect(firstTili.koulutusaste(0).value).toHaveText(koulutus);
      await expect(firstTili.koulutusaste(1).value).toHaveText(kansalaisopisto);
      await expect(firstTili.koulutusaste(2).value).toBeHidden();
      await expect(secondTili.input).toBeHidden();
    });
  });
});
