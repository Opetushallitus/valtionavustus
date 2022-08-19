import { Page, expect } from "@playwright/test";
import { navigate } from "../utils/navigate";
import { randomString } from "../utils/random";
import { NoProjectCodeProvided, VaCodeValues } from "../utils/types";
import { HakujenHallintaPage } from "./hakujenHallintaPage";

type KoodienhallintaTab = "operational-unit" | "project" | "operation";

export const KoodienhallintaPage = (page: Page) => {
  const submitButton = page.locator("[data-test-id=code-form__add-button]");
  const codeInputError = page.locator(".code-input-error");
  const navigateToKoodienhallinta = async () => {
    await navigate(page, "/admin-ui/va-code-values/");
  };
  const clickKoodienhallintaTab = async (tabName: KoodienhallintaTab) => {
    const tabSelector = `[data-test-id=code-value-tab-${tabName}]`;
    await page.click(tabSelector);
    await page.waitForSelector(`.oph-tab-item-is-active${tabSelector}`);
  };
  const codeRowLocator = (year: string, name: string, code: string) =>
    page.locator(`tr[data-test-id="code-cell-${year}-${code}-${name}"]`);
  const firstCellLocator = (year: string, name: string, code: string) =>
    codeRowLocator(year, name, code).locator("td:first-of-type");
  const createCode = async (
    name: string = "Test code",
    code: string
  ): Promise<string> => {
    const year = "2020";
    await page.fill("[data-test-id=code-form__year]", year);
    await page.fill("[data-test-id=code-form__code]", `${code}`);
    await page.fill("[data-test-id=code-form__name]", `${name} ${code}`);
    await submitButton.click();
    await codeRowLocator(year, `${name} ${code}`, code).waitFor();
    return code;
  };
  const createCodeValues = async (
    codeValues: VaCodeValues
  ): Promise<VaCodeValues> => {
    await navigateToKoodienhallinta();
    await createCode("Toimintayksikkö", codeValues.operationalUnit);

    await clickKoodienhallintaTab("project");
    const year = "2020";
    await page.fill("[data-test-id=code-form__year]", year);
    await page.fill(
      "[data-test-id=code-form__code]",
      NoProjectCodeProvided.code
    );
    await page.fill(
      "[data-test-id=code-form__name]",
      NoProjectCodeProvided.name
    );
    await submitButton.click();

    for (const code of codeValues.project) {
      if (code !== NoProjectCodeProvided.code) {
        await clickKoodienhallintaTab("project");
        await createCode("Projekti", code);
      }
    }

    await clickKoodienhallintaTab("operation");
    await createCode("Toiminto", codeValues.operation);
    return codeValues;
  };
  return {
    page,
    yearInput: page.locator("[data-test-id=code-form__year]"),
    nameInput: page.locator("[data-test-id=code-form__name]"),
    codeInput: page.locator("[data-test-id=code-form__code]"),
    submitButton,
    codeInputError,
    codeList: page.locator("table tbody"),
    navigate: navigateToKoodienhallinta,
    navigateToHakujenHallintaPage: async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page);
      await hakujenHallintaPage.navigateToDefaultAvustushaku();
      return hakujenHallintaPage;
    },
    codeRowLocator,
    clickKoodienhallintaTab,
    switchToTatilitTab: async () => {
      const tiliTab = page.locator("text='TA-tilit'");
      await expect(tiliTab).not.toHaveClass(/oph-tab-item-is-active/);
      await tiliTab.click();
      await expect(tiliTab).toHaveClass(/oph-tab-item-is-active/);
    },
    clickCodeVisibilityButton: async (
      year: string,
      name: string,
      code: string,
      visibility: boolean
    ) => {
      const buttonId = visibility ? "show-code" : "hide-code";
      await codeRowLocator(year, name, code)
        .locator(`[data-test-id=${buttonId}]`)
        .click();
      await page.waitForLoadState("networkidle");
    },
    createCode,
    assertCodeIsVisible: async (year: string, name: string, code: string) => {
      await expect(firstCellLocator(year, name, code)).not.toHaveClass(
        "code-cell__hidden"
      );
    },
    assertCodeIsHidden: async (year: string, name: string, code: string) => {
      await expect(firstCellLocator(year, name, code)).toHaveClass(
        "code-cell__hidden"
      );
    },
    createCodeValues,
    createRandomCodeValues: async (): Promise<VaCodeValues> => {
      const uniqueCode = () => randomString().substring(0, 13);
      const codeValues = {
        operationalUnit: uniqueCode(),
        project: [uniqueCode(), uniqueCode(), uniqueCode()],
        operation: uniqueCode(),
      };
      return createCodeValues(codeValues);
    },
    codeInputFormHasError: async (errorText: string) => {
      await codeInputError.locator(`text="${errorText}"`);
    },
    noCodeInputFormErrors: async () => {
      await codeInputError.waitFor({ state: "detached" });
    },
    taTilit: {
      form: {
        year: {
          input: page.locator('[placeholder="Vuosiluku"]'),
          error: page.locator("[data-test-id=error-year]"),
        },
        code: {
          input: page.locator('[placeholder="Syötä TA-tilin koodi"]'),
          error: page.locator("[data-test-id=error-code]"),
        },
        name: {
          input: page.locator('[placeholder="Syötä tilin nimi"]'),
          error: page.locator("[data-test-id=error-name]"),
        },
        amount: {
          input: page.locator('[placeholder="Syötä euromäärä"]'),
          error: page.locator("[data-test-id=error-amount]"),
        },
        submitBtn: page.locator('[title="Tallenna uusi talousarviotili"]'),
      },
    },
  };
};
