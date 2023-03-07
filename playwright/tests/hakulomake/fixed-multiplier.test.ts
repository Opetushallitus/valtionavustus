import { defaultValues as test } from "../../fixtures/defaultValues";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import { HakijaAvustusHakuPage } from "../../pages/hakijaAvustusHakuPage";
import { expect, Page } from "@playwright/test";
import { expectToBeDefined } from "../../utils/util";
import moment from "moment/moment";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { getBudgetSelectorsForType } from "../../utils/budget";
import { BrowserContext } from "playwright-chromium";

const form = {
  content: [
    {
      fieldClass: "wrapperElement",
      id: "financing-plan",
      fieldType: "theme",
      children: [
        {
          fieldClass: "wrapperElement",
          id: "budget",
          fieldType: "vaBudget",
          children: [
            {
              fieldClass: "wrapperElement",
              id: "project-budget",
              fieldType: "vaSummingBudgetElement",
              children: [
                {
                  fieldClass: "wrapperElement",
                  id: "personnel-costs-row",
                  fieldType: "vaBudgetItemElement",
                  children: [
                    {
                      initialValue: {
                        fi: "",
                        sv: "",
                      },
                      fieldClass: "formField",
                      helpText: {
                        fi: "",
                        sv: "",
                      },
                      id: "personnel-costs-row.multiplier",
                      params: {
                        size: "extra-extra-small",
                        maxlength: 250,
                      },
                      required: true,
                      fieldType: "fixedMultiplierField",
                    },
                    {
                      initialValue: 0,
                      fieldClass: "formField",
                      helpText: {
                        fi: "",
                        sv: "",
                      },
                      id: "personnel-costs-row.amount",
                      params: {
                        size: "extra-extra-small",
                        maxlength: 7,
                      },
                      required: true,
                      fieldType: "fixedMultiplierMoneyField",
                    },
                  ],
                  params: {
                    incrementsTotal: true,
                  },
                  label: {
                    fi: "1. Suomi toisena kielenä ja muun opetuksen tukeminen",
                    sv: "1. Svenska som andraspråk eller stödjande av annan undervisning ",
                  },
                  helpText: {
                    fi: "",
                    sv: "",
                  },
                },
                {
                  fieldClass: "wrapperElement",
                  id: "material-costs-row",
                  fieldType: "vaBudgetItemElement",
                  children: [
                    {
                      initialValue: {
                        fi: "",
                        sv: "",
                      },
                      fieldClass: "formField",
                      helpText: {
                        fi: "",
                        sv: "",
                      },
                      id: "material-costs-row.multiplier",
                      params: {
                        size: "extra-extra-small",
                        maxlength: 7,
                      },
                      required: true,
                      fieldType: "fixedMultiplierField",
                    },
                    {
                      initialValue: 0,
                      fieldClass: "formField",
                      helpText: {
                        fi: "",
                        sv: "",
                      },
                      id: "material-costs-row.amount",
                      params: {
                        size: "extra-extra-small",
                        maxlength: 16,
                      },
                      required: true,
                      fieldType: "fixedMultiplierMoneyField",
                    },
                  ],
                  params: {
                    incrementsTotal: true,
                  },
                  label: {
                    fi: "2. Maahanmuuttajien oman äidinkielen ja suomenkielisten oppilaiden tai opiskelijoiden ulkomailla hankkiman kielitaidon ylläpitäminen",
                    sv: "2. Undervisning i invandrares eget modersmål samt för undervisning som syftar till att upprätthålla språkkunskaper",
                  },
                  helpText: {
                    fi: "",
                    sv: "",
                  },
                },
                {
                  fieldClass: "wrapperElement",
                  id: "equipment-costs-row",
                  fieldType: "vaBudgetItemElement",
                  children: [
                    {
                      fieldClass: "formField",
                      helpText: {
                        fi: "",
                        sv: "",
                      },
                      id: "equipment-costs-row.multiplier",
                      params: {
                        size: "extra-extra-small",
                        maxlength: 7,
                      },
                      required: true,
                      fieldType: "fixedMultiplierField",
                    },
                    {
                      initialValue: 0,
                      fieldClass: "formField",
                      helpText: {
                        fi: "",
                        sv: "",
                      },
                      id: "equipment-costs-row.amount",
                      params: {
                        size: "extra-extra-small",
                        maxlength: 16,
                      },
                      required: true,
                      fieldType: "fixedMultiplierMoneyField",
                    },
                  ],
                  params: {
                    incrementsTotal: true,
                  },
                  label: {
                    fi: "3. Saamen- tai  romanikielen opetus",
                    sv: "3. Undervisning i samiska eller romani",
                  },
                  helpText: {
                    fi: "",
                    sv: "",
                  },
                },
              ],
              params: {
                sumRowLabel: {
                  fi: "",
                  sv: "",
                },
                columnTitles: {
                  label: {
                    fi: "",
                    sv: "",
                  },
                  amount: {
                    fi: "Euroa",
                    sv: "Euro",
                  },
                  description: {
                    fi: "Tunteja yhteensä",
                    sv: "Timmar sammanlagt",
                  },
                },
                showColumnTitles: true,
              },
              label: {
                fi: "",
                sv: "",
              },
            },
            {
              fieldClass: "wrapperElement",
              id: "budget-summary",
              fieldType: "vaBudgetSummaryElement",
              children: [],
              params: {
                showColumnTitles: false,
                totalSumRowLabel: {
                  fi: "Haettu avustus yhteensä",
                  sv: "Understöd som söks sammanlagt",
                },
                ophFinancingLabel: {
                  fi: "Opetushallitukselta haettava rahoitus",
                  sv: "Finansiering som söks av Utbildningsstyrelsen",
                },
                selfFinancingLabel: {
                  fi: "Omarahoitus",
                  sv: "Egen finansiering",
                },
              },
            },
          ],
        },
      ],
      label: {
        fi: "Haettu avustus",
        sv: "Understöd som ansöks",
      },
    },
  ],
  rules: [],
  created_at: "2023-03-03T07:44:48Z",
  updated_at: "2023-03-03T07:57:02Z",
};

test("fixed multiplier field works", async ({
  page,
  hakuProps,
  userCache,
  answers,
  context,
}) => {
  expectToBeDefined(userCache);
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await hakujenHallintaPage.navigate(1);
  const avustushakuID = await hakujenHallintaPage.copyCurrentHaku();
  await test.step("create avustushaku", async () => {
    await hakujenHallintaPage.fillAvustushaku(hakuProps);
    const formEditorPage = await hakujenHallintaPage.navigateToFormEditor(
      avustushakuID
    );
    await formEditorPage.changeLomakeJson(JSON.stringify(form));
    await formEditorPage.saveForm();
    await hakujenHallintaPage.switchToHaunTiedotTab();
    await hakujenHallintaPage.publishAvustushaku();
  });
  const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page);
  await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang);
  const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
    avustushakuID,
    answers.contactPersonEmail
  );
  await hakijaAvustusHakuPage.page.goto(hakemusUrl);
  const firstRow = getMoneyLocators(
    hakijaAvustusHakuPage.page,
    "personnel-costs-row"
  );
  const secondRow = getMoneyLocators(
    hakijaAvustusHakuPage.page,
    "material-costs-row"
  );
  const thirdRow = getMoneyLocators(
    hakijaAvustusHakuPage.page,
    "equipment-costs-row"
  );
  const financingAmount = hakijaAvustusHakuPage.page.locator(
    "tfoot .amount-column"
  );
  const amountToFinance = hakijaAvustusHakuPage.page.locator(
    ".total-financing-amount"
  );
  await test.step("default state is correct", async () => {
    await expect(firstRow.hours).toHaveValue("");
    await expect(firstRow.euros).toHaveText("0");
    await expect(secondRow.hours).toHaveValue("");
    await expect(secondRow.euros).toHaveText("0");
    await expect(thirdRow.hours).toHaveValue("");
    await expect(thirdRow.euros).toHaveText("0");
    await expect(financingAmount).toHaveText("0");
    await expect(amountToFinance).toHaveText("Rahoitettavaa jää yhteensä 0");
  });
  await test.step("calculates financing correctly", async () => {
    await firstRow.hours.fill("100");
    await expect(firstRow.euros).toHaveText("2150");
    await expect(financingAmount).toHaveText("2150");
    await expect(amountToFinance).toHaveText("Rahoitettavaa jää yhteensä 2150");
    await secondRow.hours.fill("50");
    await expect(secondRow.euros).toHaveText("1075");
    await expect(financingAmount).toHaveText("3225");
    await expect(amountToFinance).toHaveText("Rahoitettavaa jää yhteensä 3225");
    await thirdRow.hours.fill("30");
    await expect(thirdRow.euros).toHaveText("645");
    await expect(financingAmount).toHaveText("3870");
    await expect(amountToFinance).toHaveText("Rahoitettavaa jää yhteensä 3870");
  });
  await hakijaAvustusHakuPage.submitApplication();
  await hakujenHallintaPage.navigate(avustushakuID);
  await hakujenHallintaPage.setEndDate(
    moment().subtract(1, "year").format("D.M.YYYY H.mm")
  );
  await hakujenHallintaPage.waitForSave();
  const hakemustenArviointiPage = new HakemustenArviointiPage(page);
  await hakemustenArviointiPage.navigate(avustushakuID);
  await hakemustenArviointiPage.selectHakemusFromList("Käsittelemättä");
  const kokonaiskustannusInput = hakemustenArviointiPage.page.locator(
    "tfoot .amount-column input"
  );
  const editingAmountToFinance = hakemustenArviointiPage.page.locator(
    "#budget-edit-budget-summary h4"
  );
  await test.step("kokonaiskustannukset budget works", async () => {
    await expect(editingAmountToFinance).toHaveText(
      "Rahoitettavaa jää yhteensä 0"
    );
    await kokonaiskustannusInput.fill("100");
    await expect(editingAmountToFinance).toHaveText(
      "Rahoitettavaa jää yhteensä 100"
    );
    await hakemustenArviointiPage.waitForSave();
    const { paatosPage, locators } = await getBudgetTableFooterTh(
      context,
      page
    );
    await expect(locators.nth(1)).toContainText("3 870 €");
    await expect(locators.nth(2)).toContainText("100 €");
    await paatosPage.close();
  });
  await test.step("menokohtainen budget works", async () => {
    await hakemustenArviointiPage.page.click(
      'label[for="useDetailedCosts-true"]'
    );
    const { personnel, material, equipment } = getBudgetSelectorsForType(
      page,
      "virkailija",
      "amount"
    );
    await expect(personnel).toHaveValue("2150");
    await expect(material).toHaveValue("1075");
    await expect(equipment).toHaveValue("645");
    await expect(editingAmountToFinance).toHaveText(
      "Rahoitettavaa jää yhteensä 3870"
    );
    await personnel.fill("1280");
    await expect(editingAmountToFinance).toHaveText(
      "Rahoitettavaa jää yhteensä 3000"
    );
    await hakemustenArviointiPage.waitForSave();
    const { paatosPage, locators } = await getBudgetTableFooterTh(
      context,
      page
    );
    await expect(locators.nth(1)).toHaveText("3 870 €");
    await expect(locators.nth(2)).toContainText("3 000 €");
    await paatosPage.close();
  });
});

const getBudgetTableFooterTh = async (context: BrowserContext, page: Page) => {
  const [paatosPage] = await Promise.all([
    context.waitForEvent("page"),
    page.click('a:text-is("Luonnos")'),
  ]);
  return {
    locators: paatosPage.locator("table").first().locator("tfoot th"),
    paatosPage,
  };
};

const getMoneyLocators = (page: Page, prefix: string) => ({
  hours: page.locator(`#${prefix}\\.multiplier`),
  euros: page.locator(`#${prefix}\\.amount`),
});
