import { expect } from "@playwright/test";
import { defaultValues } from "../../fixtures/defaultValues";
import { KoodienhallintaPage } from "../../pages/koodienHallintaPage";
import { muutoshakemusTest } from "../../fixtures/muutoshakemusTest";
import { expectToBeDefined } from "../../utils/util";
import { VIRKAILIJA_URL } from "../../utils/constants";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { createRandomTalousarviotiliCode } from "../../utils/random";

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
    await koodienhallintaPage.switchToTatilitTab();
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
    const code = createRandomTalousarviotiliCode();
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
      const rowInput = row.locator("input");
      await expect(rowInput.nth(0)).toHaveValue(year);
      await expect(rowInput.nth(1)).toHaveValue(code);
      await expect(rowInput.nth(2)).toHaveValue(name);
      await expect(rowInput.nth(3)).toHaveValue(amount);
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
  test("same talousarviotili code cannot be created again for the same year", async ({
    koodienhallintaPage,
    randomName,
  }) => {
    const taForm = koodienhallintaPage.taTilit.form;
    const name = `Talousarviotili ${randomName}`;
    const year = "2022";
    const code = createRandomTalousarviotiliCode();
    const amount = "69";
    const row = await koodienhallintaPage.page.locator(
      `[data-test-id="${name}"]`
    );
    await test.step("fill form", async () => {
      await taForm.year.input.fill(year);
      await taForm.code.input.fill(code);
      await taForm.name.input.fill(name);
      await taForm.amount.input.fill(amount);
    });
    await test.step("create row", async () => {
      await taForm.submitBtn.click();
      await expect(row).toBeVisible();
      await expect(taForm.submitBtn).toBeEnabled();
    });
    await test.step("fill form again", async () => {
      await taForm.year.input.fill(year);
      await taForm.code.input.fill(code);
      await taForm.name.input.fill(name);
      await taForm.amount.input.fill(amount);
    });
    await test.step("submitting should fail", async () => {
      await taForm.submitBtn.click();
      await expect(taForm.code.error).toContainText(
        `Koodi ${code} on jo olemassa vuodelle ${year}`
      );
      await expect(row).toHaveCount(1);
    });
    await test.step("submitting works with another year", async () => {
      await taForm.year.input.fill("2021");
      await taForm.submitBtn.click();
      await expect(taForm.code.error).toBeHidden();
      await expect(row).toHaveCount(2);
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
    await taForm.code.input.fill(createRandomTalousarviotiliCode());
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
    await taForm.code.input.fill(createRandomTalousarviotiliCode());
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
    await taForm.code.input.fill(createRandomTalousarviotiliCode());
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
    await taForm.code.input.fill(createRandomTalousarviotiliCode());
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
  muutoshakemusTest(
    "tili that is in use cannot be deleted",
    async ({ page, avustushakuID, talousarviotili, hakuProps }) => {
      expectToBeDefined(avustushakuID);
      const koodienhallintaPage = KoodienhallintaPage(page);
      await koodienhallintaPage.navigate();
      await koodienhallintaPage.switchToTatilitTab();
      const row = await koodienhallintaPage.page.locator(
        `[data-test-id="${talousarviotili.name}"]`
      );
      const deleteRowButton = row.locator(
        `button[title="Poista talousarviotili ${talousarviotili.code}"]`
      );
      await test.step("delete button is disabled", async () => {
        await expect(row).toBeVisible();
        await expect(deleteRowButton).toBeDisabled();
      });
      const deleteRequest = () =>
        page.request.delete(
          `${VIRKAILIJA_URL}/api/talousarviotilit/${talousarviotili.id}/`
        );
      await test.step(
        "even trying to delete without button fails",
        async () => {
          await expect(await deleteRequest()).not.toBeOK();
        }
      );
      await test.step(
        "navigate to avustushaku from where its used",
        async () => {
          await row.locator("button").locator("text=1 avustuksessa").click();
          await row
            .locator("a")
            .locator(`text="${hakuProps.avustushakuName}"`)
            .click();
        }
      );
      await test.step(
        "after removing talousarviotili its allowed to be deleted",
        async () => {
          const hakujenHallintaPage = new HakujenHallintaPage(page);
          await hakujenHallintaPage
            .hauntiedotLocators()
            .taTili.tili(0)
            .removeTiliBtn.click();
          await hakujenHallintaPage.waitForSave();
          await koodienhallintaPage.navigate();
          await koodienhallintaPage.switchToTatilitTab();
          await expect(
            koodienhallintaPage.taTilit.form.submitBtn
          ).toBeVisible();
          await expect(row).toBeVisible();
          await expect(deleteRowButton).toBeEnabled();
        }
      );
      await test.step(
        "delete through api to make sure the earlier api call actually did what it was supposed to",
        async () => {
          await expect(await deleteRequest()).toBeOK();
          await koodienhallintaPage.page.reload();
          await expect(
            koodienhallintaPage.taTilit.form.submitBtn
          ).toBeVisible();
          await expect(row).toBeHidden();
        }
      );
    }
  );
  const doubleDots = ["..1.1.1", "00..00.00.", "0.0.21.22.."] as const;
  const threeNumbersInARow = ["0.01.222.", "0.0.212.22", "012.0.21"] as const;
  const startsWithDots = [".10.22.12.32"] as const;
  const hasIllegalCharacters = ["12.10.12.4k", "20.23.4!.10"];
  const badTaTiliCodes = [
    ...doubleDots,
    ...threeNumbersInARow,
    ...startsWithDots,
    ...hasIllegalCharacters,
  ] as const;
  for (const badCode of badTaTiliCodes) {
    test(`Doesnt allow bad code ${badCode}`, async ({
      koodienhallintaPage,
    }) => {
      const taForm = koodienhallintaPage.taTilit.form;
      await expect(taForm.submitBtn).toBeEnabled();
      await taForm.year.input.fill("2022");
      await taForm.code.input.fill(badCode);
      await taForm.name.input.fill("Nimi");
      await taForm.amount.input.fill("420");
      await expect(taForm.submitBtn).toBeDisabled();
      await expect(taForm.code.error).toContainText("Tarkista koodi");
    });
  }
});
