import { expect } from "@playwright/test";
import { defaultValues } from "../../fixtures/defaultValues";
import { KoodienhallintaPage } from "../../pages/koodienHallintaPage";
import { randomString } from "../../utils/random";

const expectNoErrors = async (
  koodienhallintaPage: ReturnType<typeof KoodienhallintaPage>
) => {
  const taForm = koodienhallintaPage.taTilit.form;
  await expect(taForm.submitBtn).toBeEnabled();
  await expect(taForm.year.error).toBeHidden();
  await expect(taForm.code.error).toBeHidden();
  await expect(taForm.name.error).toBeHidden();
  await expect(taForm.amount.error).toBeHidden();
};

const test = defaultValues.extend<{
  koodienhallintaPage: ReturnType<typeof KoodienhallintaPage>;
}>({
  koodienhallintaPage: async ({ page }, use) => {
    const koodienhallintaPage = KoodienhallintaPage(page);
    await koodienhallintaPage.navigate();
    const tiliTab = koodienhallintaPage.page.locator("text='TA-tilit'");
    await expect(tiliTab).not.toHaveClass(/oph-tab-item-is-active/);
    await tiliTab.click();
    await expect(tiliTab).toHaveClass(/oph-tab-item-is-active/);
    await expectNoErrors(koodienhallintaPage);
    await use(koodienhallintaPage);
  },
});

test.describe.parallel("talousarviotilien hallinta", () => {
  test("can create and remove talousarviotili", async ({
    koodienhallintaPage,
    randomName,
  }) => {
    const taForm = koodienhallintaPage.taTilit.form;
    const name = `Talousarviotili ${randomName}`;
    const year = "2022";
    const code = randomString();
    const amount = "420";
    const row = await koodienhallintaPage.page.locator(
      `[data-test-id="${name}"]`
    );
    await expect(row).toBeHidden();
    await test.step("fill form", async () => {
      await taForm.year.input.fill(year);
      await taForm.code.input.fill(code);
      await taForm.name.input.fill(name);
      await taForm.amount.input.fill(amount);
    });
    await test.step("create row", async () => {
      await taForm.submitBtn.click();
      await expect(row).toBeVisible();
    });
    await test.step("correct values in row", async () => {
      await expect(row.locator(`input:has-text("${name}")`));
      await expect(row.locator(`input:has-text("${year}")`));
      await expect(row.locator(`input:has-text("${code}")`));
      await expect(row.locator(`input:has-text("${amount}")`));
    });
    await test.step("form is reset after creation", async () => {
      await expect(taForm.year.input).toContainText("");
      await expect(taForm.code.input).toContainText("");
      await expect(taForm.name.input).toContainText("");
      await expect(taForm.amount.input).toContainText("");
      await expectNoErrors(koodienhallintaPage);
    });
    await test.step("delete newly created form", async () => {
      koodienhallintaPage.page.on("dialog", (dialog) =>
        dialog.accept(
          `Oletko aivan varma, että haluat poistaa talousarviotilin ${code} ${name}?`
        )
      );
      await row
        .locator(`button[title="Poista talousarviotili ${code}"]`)
        .click();
      await expect(row).toBeHidden();
    });
  });
  test("requires all fields", async ({ koodienhallintaPage }) => {
    const taForm = koodienhallintaPage.taTilit.form;
    await taForm.submitBtn.click();
    await expect(taForm.submitBtn).toBeDisabled();
    await expect(taForm.year.error).toContainText("Vuosi on pakollinen");
    await expect(taForm.code.error).toContainText("Koodi on pakollinen");
    await expect(taForm.name.error).toContainText("Nimi on pakollinen");
    await expect(taForm.amount.error).toContainText("Euromäärä on pakollinen");
    await taForm.year.input.fill("2022");
    await expect(taForm.submitBtn).toBeDisabled();
    await expect(taForm.year.error).toBeHidden();
    await expect(taForm.code.error).toContainText("Koodi on pakollinen");
    await expect(taForm.name.error).toContainText("Nimi on pakollinen");
    await expect(taForm.amount.error).toContainText("Euromäärä on pakollinen");
    await taForm.code.input.fill("Koodi");
    await expect(taForm.submitBtn).toBeDisabled();
    await expect(taForm.year.error).toBeHidden();
    await expect(taForm.code.error).toBeHidden();
    await expect(taForm.name.error).toContainText("Nimi on pakollinen");
    await expect(taForm.amount.error).toContainText("Euromäärä on pakollinen");
    await taForm.name.input.fill("Nimi");
    await expect(taForm.submitBtn).toBeDisabled();
    await expect(taForm.year.error).toBeHidden();
    await expect(taForm.code.error).toBeHidden();
    await expect(taForm.name.error).toBeHidden();
    await expect(taForm.amount.error).toContainText("Euromäärä on pakollinen");
    await taForm.amount.input.fill("10000");
    await expectNoErrors(koodienhallintaPage);
  });
  test("amount must be a number", async ({ koodienhallintaPage }) => {
    const taForm = koodienhallintaPage.taTilit.form;
    await taForm.year.input.fill("2022");
    await taForm.code.input.fill("Koodi");
    await taForm.name.input.fill("Nimi");
    await taForm.amount.input.fill("Should fail");
    await taForm.amount.input.evaluate((e) => e.blur());
    await expect(taForm.submitBtn).toBeDisabled();
    await expect(taForm.year.error).toBeHidden();
    await expect(taForm.code.error).toBeHidden();
    await expect(taForm.name.error).toBeHidden();
    await expect(taForm.amount.error).toContainText(
      "Euromäärän pitää olla numero"
    );
    await taForm.amount.input.fill("69");
    await expectNoErrors(koodienhallintaPage);
  });
  test("amount can't be negative value", async ({ koodienhallintaPage }) => {
    const taForm = koodienhallintaPage.taTilit.form;
    await expect(taForm.submitBtn).toBeEnabled();
    await taForm.year.input.fill("2022");
    await taForm.code.input.fill("Koodi");
    await taForm.name.input.fill("Nimi");
    await taForm.amount.input.fill("-420");
    await taForm.amount.input.evaluate((e) => e.blur());
    await expect(taForm.submitBtn).toBeDisabled();
    await expect(taForm.year.error).toBeHidden();
    await expect(taForm.code.error).toBeHidden();
    await expect(taForm.name.error).toBeHidden();
    await expect(taForm.amount.error).toContainText(
      "Euromäärä ei voi olla negatiivinen"
    );
    await taForm.amount.input.fill("420");
    await taForm.amount.input.evaluate((e) => e.blur());
    await expectNoErrors(koodienhallintaPage);
  });
  test("year must be between 1970 and 2100", async ({
    koodienhallintaPage,
  }) => {
    const taForm = koodienhallintaPage.taTilit.form;
    await expect(taForm.submitBtn).toBeEnabled();
    await taForm.year.input.fill("1930");
    await taForm.code.input.fill("Koodi");
    await taForm.name.input.fill("Nimi");
    await taForm.amount.input.fill("420");
    await expect(taForm.submitBtn).toBeDisabled();
    await expect(taForm.year.error).toContainText(
      "Vuosi voi olla minimissään 1970"
    );
    await expect(taForm.code.error).toBeHidden();
    await expect(taForm.name.error).toBeHidden();
    await expect(taForm.amount.error).toBeHidden();
    await taForm.year.input.fill("2101");
    await expect(taForm.submitBtn).toBeDisabled();
    await expect(taForm.year.error).toContainText(
      "Vuosi voi olla maksimissaan 2100"
    );
    await expect(taForm.code.error).toBeHidden();
    await expect(taForm.name.error).toBeHidden();
    await expect(taForm.amount.error).toBeHidden();
    await taForm.year.input.fill("2022");
    await taForm.year.input.evaluate((e) => e.blur());
    await expectNoErrors(koodienhallintaPage);
  });
});
