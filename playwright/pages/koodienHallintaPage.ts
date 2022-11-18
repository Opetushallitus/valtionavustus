import { Page, expect } from "@playwright/test";
import { navigate } from "../utils/navigate";
import { randomString } from "../utils/random";
import { NoProjectCodeProvided, VaCodeValues } from "../utils/types";
import { HakujenHallintaPage } from "./hakujenHallintaPage";

type KoodienhallintaTab = "operational-unit" | "project" | "operation";

export const KoodienhallintaPage = (page: Page) => {
  const locators = {
    saveIndicator: page.locator(".code-input-saving"),
    submitButton: page.locator("[data-test-id=code-form__add-button]"),
    yearInput: page.locator("[data-test-id=code-form__year]"),
    nameInput: page.locator("[data-test-id=code-form__name]"),
    codeInput: page.locator("[data-test-id=code-form__code]"),
    codeInputError: page.locator(".code-input-error"),
    newTiliForm: page.getByTestId("new-talousarviotili-form"),
  };
  const submit = async () => {
    await expect(locators.saveIndicator).toBeHidden();
    await locators.submitButton
      .click()
      .then(() => expect(locators.saveIndicator).toBeVisible());
    await expect(locators.saveIndicator).toBeHidden();
  };

  const navigateToKoodienhallinta = async () => {
    await navigate(page, "/admin-ui/va-code-values/");
  };
  const clickKoodienhallintaTab = async (tabName: KoodienhallintaTab) => {
    const tab = page.getByTestId(`code-value-tab-${tabName}`);
    await expect(tab).not.toHaveClass(/oph-tab-item-is-active/);
    await tab.click();
    await expect(tab).toHaveClass(/oph-tab-item-is-active/);
  };
  const codeRowLocator = (year: string, name: string, code: string) =>
    page.getByTestId(`code-cell-${year}-${code}-${name}`);
  const firstCell = (year: string, name: string, code: string) =>
    codeRowLocator(year, name, code).locator("td").first();
  const createCode = async (
    name: string = "Test code",
    code: string
  ): Promise<string> => {
    const year = "2020";
    await locators.yearInput.fill(year);
    await locators.codeInput.fill(code);
    await locators.nameInput.fill(`${name} ${code}`);
    await submit();
    await expect(codeRowLocator(year, `${name} ${code}`, code)).toBeVisible();
    return code;
  };
  const createCodeValues = async (
    codeValues: VaCodeValues
  ): Promise<VaCodeValues> => {
    await navigateToKoodienhallinta();
    await createCode("Toimintayksikkö", codeValues.operationalUnit);
    await clickKoodienhallintaTab("project");
    const year = "2020";
    await locators.yearInput.fill(year);
    await locators.codeInput.fill(NoProjectCodeProvided.code);
    await locators.nameInput.fill(NoProjectCodeProvided.name);
    await submit();

    for (const code of codeValues.project) {
      if (code !== NoProjectCodeProvided.code) {
        await createCode("Projekti", code);
      }
    }

    await clickKoodienhallintaTab("operation");
    await createCode("Toiminto", codeValues.operation);
    return codeValues;
  };
  return {
    ...locators,
    page,
    submit,
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
      await codeRowLocator(year, name, code).getByTestId(buttonId).click();
      await page.waitForLoadState("networkidle");
    },
    createCode,
    assertCodeIsVisible: async (year: string, name: string, code: string) => {
      await expect(firstCell(year, name, code)).not.toHaveClass(
        "code-cell__hidden"
      );
    },
    assertCodeIsHidden: async (year: string, name: string, code: string) => {
      await expect(firstCell(year, name, code)).toHaveClass(
        "code-cell__hidden"
      );
    },
    createCodeValues,
    createRandomCodeValues: async (): Promise<VaCodeValues> => {
      const uniqueCode = () => randomString().substring(0, 13);
      const codeValues = {
        operationalUnit: uniqueCode(),
        project: [uniqueCode()],
        operation: uniqueCode(),
      };
      return createCodeValues(codeValues);
    },
    codeInputFormHasError: async (errorText: string) => {
      await expect(locators.codeInputError).toHaveText(errorText);
    },
    noCodeInputFormErrors: async () => {
      await expect(locators.codeInputError).toBeHidden();
    },
    taTilit: {
      form: {
        year: {
          input: locators.newTiliForm.getByPlaceholder("Vuosiluku"),
          error: locators.newTiliForm.getByTestId("error-year"),
        },
        code: {
          input: locators.newTiliForm.getByPlaceholder("Syötä TA-tilin koodi"),
          error: locators.newTiliForm.getByTestId("error-code"),
        },
        name: {
          input: locators.newTiliForm.getByPlaceholder("Syötä tilin nimi"),
          error: locators.newTiliForm.getByTestId("error-name"),
        },
        amount: {
          input: locators.newTiliForm.getByPlaceholder("Syötä euromäärä"),
          error: locators.newTiliForm.getByTestId("error-amount"),
        },
        submitBtn: locators.newTiliForm.getByTitle(
          "Tallenna uusi talousarviotili"
        ),
      },
    },
  };
};
