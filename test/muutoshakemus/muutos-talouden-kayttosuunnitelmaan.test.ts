import { Browser, Page } from "puppeteer";
import moment from "moment";

import {
  Email,
  mkBrowser,
  HAKIJA_URL,
  waitUntilMinEmails,
  getAcceptedPäätösEmails,
  getFirstPage,
  setPageErrorConsoleLogger,
  clickElement,
  getElementInnerText,
  clearAndType,
  countElements,
  Budget,
  BudgetAmount,
  defaultBudget,
  createRandomHakuValues,
  setupTestLogging,
  typePerustelu,
  VaCodeValues,
} from "../test-util";
import {
  createRandomCodeValues,
  fillOsiotAndSendMuutoshakemusDecision,
  navigateToLatestMuutoshakemus,
  navigateToNthMuutoshakemus,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuWithLumpSumBudget,
} from "./muutospaatosprosessi-util";
import {
  navigateToHakijaMuutoshakemusPage,
  navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges,
} from "./muutoshakemus-util";

const twoMinutes = 120000;
jest.setTimeout(30000);

type TalousarvioFormInputs = Array<{ name: string; amount: number }>;

export const answers = {
  contactPersonEmail: "erkki.esimerkki@example.com",
  contactPersonName: "Erkki Esimerkki",
  contactPersonPhoneNumber: "666",
  projectName: "Rahassa kylpijät Ky Ay Oy",
};

export const budget: Budget = {
  amount: {
    personnel: "300",
    material: "420",
    equipment: "1337",
    "service-purchase": "5318008",
    rent: "69",
    steamship: "0",
    other: "9000",
  },
  description: {
    personnel: "One euro for each of our Spartan workers",
    material: "Generic materials for innovation",
    equipment: "We need elite level equipment",
    "service-purchase": "We need some afterwork fun",
    rent: "More afterwork fun",
    steamship: "No need for steamship, we have our own yacht",
    other: "For power ups",
  },
  selfFinancing: "1",
};

describe("Talousarvion muuttaminen", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await mkBrowser();
    page = await getFirstPage(browser);
    setPageErrorConsoleLogger(page);
  });

  setupTestLogging();

  afterAll(async () => {
    await page.close();
    await browser.close();
  });

  const sortedInputFields = (budgetList: TalousarvioFormInputs) => {
    return [...budgetList].sort((a, b) => (a.name < b.name ? 1 : -1));
  };

  async function validateBudgetInputFields(
    expectedBudget: TalousarvioFormInputs
  ) {
    const budgetRows = await page.$$eval(
      "[data-test-id=talousarvio-form] [data-test-id=meno-input]",
      (elements) => {
        return elements.map((elem) => ({
          name: elem.querySelector("input")?.getAttribute("name") || "",
          amount: parseInt(
            elem.querySelector("input")?.getAttribute("value") || ""
          ),
        }));
      }
    );
    expect(sortedInputFields(budgetRows)).toEqual(
      sortedInputFields(expectedBudget)
    );
  }

  describe("When virkailija accepts hakemus without menoluokat", () => {
    let avustushakuID: number;
    let hakemusID: number;
    let emails: Email[];
    const haku = createRandomHakuValues("Budjettimuutos");
    let codes: VaCodeValues;

    beforeAll(async () => {
      codes = await createRandomCodeValues(page);
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } =
        await ratkaiseBudjettimuutoshakemusEnabledAvustushakuWithLumpSumBudget(
          page,
          haku,
          answers,
          budget,
          codes
        );
      avustushakuID = avustushakuId;
      hakemusID = hakemusId;
      emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID);
    }, twoMinutes);

    it("päätös email contains a link to muutoshakemus", async () => {
      emails.forEach((email) => {
        expect(email.formatted).toContain(`${HAKIJA_URL}/muutoshakemus`);
      });
    });

    it("muutoshakemus page does not allow hakija to change menoluokat", async () => {
      await navigateToHakijaMuutoshakemusPage(page, hakemusID);
      await page.waitForSelector("#checkbox-haenKayttoajanPidennysta", {
        visible: true,
      });
      await page.waitForSelector(
        "#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan",
        {
          hidden: true,
        }
      );
    });

    it("seuranta tab shows the accepted lump sum", async () => {
      await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID);
      await clickElement(page, "[data-test-id=tab-seuranta]");
      const grantedTotal = await getElementInnerText(
        page,
        "[data-test-id=granted-total]"
      );
      expect(grantedTotal).toEqual("100000");
      const amountTotal = await getElementInnerText(
        page,
        "[data-test-id=amount-total]"
      );
      expect(amountTotal).toEqual("100000");
    });
  });

  describe("When avustushaku has been created and hakemus has been submitted", () => {
    let avustushakuID: number;
    let hakemusID: number;
    const haku = createRandomHakuValues("Budjettimuutos");
    let codes: VaCodeValues;
    const budget: Budget = {
      amount: {
        personnel: "300",
        material: "420",
        equipment: "1337",
        "service-purchase": "5318008",
        rent: "69",
        steamship: "0",
        other: "9000",
      },
      description: {
        personnel: "One euro for each of our Spartan workers",
        material: "Generic materials for innovation",
        equipment: "We need elite level equipment",
        "service-purchase": "We need some afterwork fun",
        rent: "More afterwork fun",
        steamship: "No need for steamship, we have our own yacht",
        other: "For power ups",
      },
      selfFinancing: "1",
    };

    beforeAll(async () => {
      codes = await createRandomCodeValues(page);
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } =
        await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(
          page,
          haku,
          answers,
          budget,
          codes
        );
      avustushakuID = avustushakuId;
      hakemusID = hakemusId;
    }, twoMinutes);

    describe("And muutoshakemus #1 has been submitted with jatkoaika and budget changes", () => {
      const muutoshakemus1Budget: BudgetAmount = {
        personnel: "301",
        material: "421",
        equipment: "1338",
        "service-purchase": "5318007",
        rent: "68",
        steamship: "0",
        other: "8999",
      };

      const muutoshakemus1Perustelut =
        "Pitäis päästä poistaa jotain akuuttii.... koodaile jotai jos mitää ois poistaa palaillaa sit mo";

      const jatkoaika = {
        jatkoaika: moment(new Date()).add(1, "days").locale("fi"),
        jatkoaikaPerustelu: "Duubiduubi-laa",
      };

      beforeAll(async () => {
        await navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges(
          page,
          hakemusID,
          jatkoaika,
          muutoshakemus1Budget,
          muutoshakemus1Perustelut
        );
      }, twoMinutes);

      async function getNewHakemusExistingBudget() {
        return getNewHakemusBudget("current");
      }
      async function getNewHakemusMuutoshakemusBudget() {
        return getNewHakemusBudget("muutoshakemus");
      }

      type BudgetRow = {
        name: string;
        amount: string;
      };

      function budgetRowsToBudgetAmount(rows: BudgetRow[]): BudgetAmount {
        return rows.reduce(
          (p, c) => ({ ...p, ...{ [c.name]: c.amount } }),
          {}
        ) as BudgetAmount;
      }

      async function getNewHakemusBudget(
        type: "current" | "muutoshakemus"
      ): Promise<BudgetAmount> {
        const numberFieldSelector =
          type === "current"
            ? '[data-test-id="current-value"]'
            : '[data-test-id="muutoshakemus-value"]';
        const budgetRows = (await page.$$eval(
          '[data-test-state="new"] [data-test-id="meno-input-row"]',
          (elements, inputSelector) => {
            return elements.map((elem) => ({
              name:
                elem
                  .getAttribute("data-test-type")
                  ?.replace("-costs-row", "") || "",
              amount:
                (
                  elem.querySelector(inputSelector as string) as HTMLElement
                )?.innerText.replace(" €", "") || "",
            }));
          },
          numberFieldSelector
        )) as BudgetRow[];

        return budgetRowsToBudgetAmount(budgetRows);
      }

      it("budget from hakemus is displayed to hakija as current budget", async () => {
        expect(await getNewHakemusExistingBudget()).toMatchObject(
          budget.amount
        );
      });

      it("haetut muutokset budget is displayed to hakija", async () => {
        expect(await getNewHakemusMuutoshakemusBudget()).toMatchObject(
          muutoshakemus1Budget
        );
      });

      it("perustelut title is displayed to hakija", async () => {
        const perustelut = await getElementInnerText(
          page,
          '[data-test-id="reasoning-title"'
        );
        expect(perustelut).toBe("Hakijan perustelut");
      });

      it("Current budged title is displayed to hakija", async () => {
        const perustelut = await getElementInnerText(
          page,
          '[data-test-id="budget-old-title"]'
        );
        expect(perustelut).toBe("Voimassaoleva budjetti");
      });

      it("Current budged title is displayed to hakija", async () => {
        const currentBudgetHeader = await getElementInnerText(
          page,
          '[data-test-id="budget-change-title"]'
        );
        expect(currentBudgetHeader).toEqual("Haettu uusi budjetti");
      });

      it("perustelut is displayed to hakija", async () => {
        const perustelut = await getElementInnerText(
          page,
          '[data-test-id="muutoshakemus-talousarvio-perustelu"]'
        );
        expect(perustelut).toBe(muutoshakemus1Perustelut);
      });

      it("jatkoaika is displayed to hakija", async () => {
        const date = await page.$eval(
          '[data-test-id="muutoshakemus-jatkoaika"]',
          (e) => e.textContent
        );
        expect(date).toBe(jatkoaika.jatkoaika.format("DD.MM.YYYY"));
      });

      it("virkailija seuranta tab shows the granted budget as accepted by OPH", async () => {
        await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID);
        await clickElement(page, "[data-test-id=tab-seuranta]");
        await Promise.all(
          Object.keys(budget.description).map(async (k: string) => {
            const budgetAmount = budget.amount[k as keyof BudgetAmount];
            const granted = await getElementInnerText(
              page,
              `[data-test-id=${k}-costs-row] td.granted-amount-column`
            );
            expect(granted).toEqual(budgetAmount);
            const amount = await getElementInnerText(
              page,
              `[data-test-id=${k}-costs-row] td.amount-column`
            );
            expect(amount).toEqual(budgetAmount);
          })
        );
        const grantedTotal = await getElementInnerText(
          page,
          "[data-test-id=granted-total]"
        );
        expect(grantedTotal).toEqual("5329134");
        const amountTotal = await getElementInnerText(
          page,
          "[data-test-id=amount-total]"
        );
        expect(amountTotal).toEqual("5329134");
      });

      describe("And muutoshakemus #1 has been accepted with changes", () => {
        const acceptedBudget: BudgetAmount = {
          personnel: "1301",
          material: "1421",
          equipment: "2338",
          "service-purchase": "5312007",
          rent: "1068",
          steamship: "1000",
          other: "9999",
        };

        beforeAll(async () => {
          await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID);
          await page.waitForSelector('[data-test-id="muutoshakemus-sisalto"]', {
            visible: true,
            timeout: 5000,
          });
          await fillOsiotAndSendMuutoshakemusDecision(page, {
            jatkoaika: { status: "accepted_with_changes", value: "01.01.2099" },
            budget: { status: "accepted_with_changes", value: acceptedBudget },
          });
        }, twoMinutes);

        it("newest approved budget is prefilled on the new muutoshakemus form", async () => {
          await navigateToHakijaMuutoshakemusPage(page, hakemusID);
          await clickElement(
            page,
            "#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan"
          );
          const expectedBudgetInputs = [
            { name: "talousarvio.personnel-costs-row", amount: 1301 },
            { name: "talousarvio.material-costs-row", amount: 1421 },
            { name: "talousarvio.equipment-costs-row", amount: 2338 },
            { name: "talousarvio.service-purchase-costs-row", amount: 5312007 },
            { name: "talousarvio.rent-costs-row", amount: 1068 },
            { name: "talousarvio.steamship-costs-row", amount: 1000 },
            { name: "talousarvio.other-costs-row", amount: 9999 },
          ];
          await validateBudgetInputFields(expectedBudgetInputs);
        });

        it("virkailija seuranta tab shows the accepted muutoshakemus budget as accepted by OPH", async () => {
          await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID);
          await clickElement(page, "[data-test-id=tab-seuranta]");
          await Promise.all(
            Object.keys(budget.description).map(async (k: string) => {
              const grantedSelector = `[data-test-id=${k}-costs-row] td.granted-amount-column`;
              const granted = await getElementInnerText(page, grantedSelector);
              expect(granted).toEqual(budget.amount[k as keyof BudgetAmount]);
              const amount = await getElementInnerText(
                page,
                `[data-test-id=${k}-costs-row] td.amount-column`
              );
              expect(amount).toEqual(acceptedBudget[k as keyof BudgetAmount]);
            })
          );
          const grantedTotal = await getElementInnerText(
            page,
            "[data-test-id=granted-total]"
          );
          expect(grantedTotal).toEqual("5329134");
          const amountTotal = await getElementInnerText(
            page,
            "[data-test-id=amount-total]"
          );
          expect(amountTotal).toEqual("5329134");
        });

        describe("And hakija navigates to muutoshakemus page", () => {
          beforeAll(async () => {
            await navigateToHakijaMuutoshakemusPage(page, hakemusID);
          });

          it("budget is shown as a decision instead of a muutoshakemus", async () => {
            const currentBudgetHeader = await getElementInnerText(
              page,
              '[data-test-id="budget-old-title"]'
            );
            expect(currentBudgetHeader).toEqual("Vanha budjetti");
          });

          it("budget is shown as approved", async () => {
            const currentBudgetHeader = await getElementInnerText(
              page,
              '[data-test-id="budget-change-title"]'
            );
            expect(currentBudgetHeader).toEqual("Hyväksytty uusi budjetti");
          });
        });

        describe("And muutoshakemus #2 has been submitted with budget changes", () => {
          const muutoshakemus2Budget = {
            ...muutoshakemus1Budget,
            ...{ personnel: "302", other: "8998" },
          };
          const muutoshakemus2Perustelut =
            "Fattan fossiilit taas sniiduili ja oon akuutis likviditettivajees, pydeeks vippaa vähän hilui";

          beforeAll(async () => {
            await navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges(
              page,
              hakemusID,
              jatkoaika,
              muutoshakemus2Budget,
              muutoshakemus2Perustelut
            );
          }, twoMinutes);

          it("accepted budget changes from muutoshakemus #1 are displayed as current budget", async () => {
            expect(await getNewHakemusExistingBudget()).toMatchObject(
              acceptedBudget
            );
          });

          it("haetut muutokset budget is displayed to hakija", async () => {
            expect(await getNewHakemusMuutoshakemusBudget()).toMatchObject(
              muutoshakemus2Budget
            );
          });

          it("perustelut is displayed to hakija", async () => {
            const perustelut = await getElementInnerText(
              page,
              '[data-test-class="existing-muutoshakemus"][data-test-state="new"] [data-test-id="muutoshakemus-talousarvio-perustelu"]'
            );
            expect(perustelut).toBe(muutoshakemus2Perustelut);
          });

          it("two muutoshakemuses are visible to hakija", async () => {
            expect(await countElements(page, ".talousarvio")).toBe(2);
          });

          it("muutoshakemus #2 is in read-only state", async () => {
            const budgetInput = await page.$$(
              '[data-test-type="personnel-costs-row"] input'
            );
            expect(budgetInput).toEqual([]);
          });

          describe("When virkailija views muutoshakemus #1", () => {
            beforeAll(async () => {
              await navigateToNthMuutoshakemus(
                page,
                avustushakuID,
                hakemusID,
                1
              );
            });

            it("budget is shown as a decision instead of a muutoshakemus", async () => {
              const currentBudgetHeader = await getElementInnerText(
                page,
                '[data-test-id="budget-old-title"]'
              );
              expect(currentBudgetHeader).toEqual("Vanha budjetti");
            });

            it("budget is shown as approved", async () => {
              const currentBudgetHeader = await getElementInnerText(
                page,
                '[data-test-id="budget-change-title"]'
              );
              expect(currentBudgetHeader).toEqual("Hyväksytty uusi budjetti");
            });
          });

          describe("When virkailija views unapproved muutoshakemus #2", () => {
            beforeAll(async () => {
              await navigateToNthMuutoshakemus(
                page,
                avustushakuID,
                hakemusID,
                2
              );
            });

            it("Current budget is shown as muutoshakemus", async () => {
              const currentBudgetHeader = await getElementInnerText(
                page,
                '[data-test-id="budget-old-title"]'
              );
              expect(currentBudgetHeader).toEqual("Voimassaoleva budjetti");
            });

            it("Applied budget is shown as muutoshakemus", async () => {
              const currentBudgetHeader = await getElementInnerText(
                page,
                '[data-test-id="budget-change-title"]'
              );
              expect(currentBudgetHeader).toEqual("Haettu uusi budjetti");
            });
          });

          describe("And muutoshakemus #2 budget has been rejected", () => {
            beforeAll(async () => {
              await navigateToNthMuutoshakemus(
                page,
                avustushakuID,
                hakemusID,
                2
              );
              await typePerustelu(page, "Budjettimuutosta ei hyväksytä");
              await fillOsiotAndSendMuutoshakemusDecision(page, {
                budget: { status: "rejected" },
                selectVakioperustelu: false,
              });
            }, twoMinutes);

            it("budget is shown as a muutoshakemus instead of a decision", async () => {
              const currentBudgetHeader = await getElementInnerText(
                page,
                '[data-test-id="budget-old-title"]'
              );
              expect(currentBudgetHeader).toEqual("Voimassaoleva budjetti");
            });

            it("prefilled budget for next muutoshakemus is still the one accepted for muutoshakemus #1", async () => {
              await navigateToHakijaMuutoshakemusPage(page, hakemusID);
              await clickElement(
                page,
                "#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan"
              );
              const expectedBudgetInputs = [
                { name: "talousarvio.personnel-costs-row", amount: 1301 },
                { name: "talousarvio.material-costs-row", amount: 1421 },
                { name: "talousarvio.equipment-costs-row", amount: 2338 },
                {
                  name: "talousarvio.service-purchase-costs-row",
                  amount: 5312007,
                },
                { name: "talousarvio.rent-costs-row", amount: 1068 },
                { name: "talousarvio.steamship-costs-row", amount: 1000 },
                { name: "talousarvio.other-costs-row", amount: 9999 },
              ];
              await validateBudgetInputFields(expectedBudgetInputs);
            });
          });
        });
      });
    });
  });

  describe("Hakija haluaa tehdä muutoshakemuksen talouden käyttösuunnitelmaan", () => {
    let hakemusID: number;
    const haku = createRandomHakuValues("Budjettimuutos");
    let codes: VaCodeValues;

    beforeAll(async () => {
      codes = await createRandomCodeValues(page);
      const { hakemusID: hakemusId } =
        await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(
          page,
          haku,
          answers,
          defaultBudget,
          codes
        );
      hakemusID = hakemusId;
      await navigateToHakijaMuutoshakemusPage(page, hakemusID);
      await clickElement(
        page,
        "#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan"
      );
    }, twoMinutes);

    it("ja oppia mahdollisuudesta tehdä muutoksia talouden käyttösuunnitelmaa hakemuksen päätöksen s.postista", async () => {
      const emails = await waitUntilMinEmails(
        getAcceptedPäätösEmails,
        1,
        hakemusID
      );
      emails.forEach((email) => {
        const emailContent = email.formatted;
        expect(emailContent).toContain(
          "Pääsette tekemään muutoshakemuksen sekä muuttamaan yhteyshenkilöä ja hänen yhteystietojaan koko hankekauden ajan tästä linkistä"
        );
      });
    });

    it("ja nähdä esitäytetyt menoluokat", async () => {
      const expectedBudgetInputs = [
        { name: "talousarvio.personnel-costs-row", amount: 200000 },
        { name: "talousarvio.material-costs-row", amount: 3000 },
        { name: "talousarvio.equipment-costs-row", amount: 10000 },
        { name: "talousarvio.service-purchase-costs-row", amount: 100 },
        { name: "talousarvio.rent-costs-row", amount: 161616 },
        { name: "talousarvio.steamship-costs-row", amount: 100 },
        { name: "talousarvio.other-costs-row", amount: 100000 },
      ];
      await validateBudgetInputFields(expectedBudgetInputs);
    });

    it("ja nähdä talousarvion yhteissumman muuttuvan", async () => {
      const originalSum = await getElementInnerText(
        page,
        "[data-test-id=original-sum]"
      );
      expect(originalSum).toEqual("474816 €");
      const currentSum = await getElementInnerText(
        page,
        "[data-test-id=current-sum]"
      );
      expect(currentSum).toEqual("474816");

      await clearAndType(
        page,
        'input[name="talousarvio.personnel-costs-row"]',
        "200001"
      );
      const originalSum2 = await getElementInnerText(
        page,
        "[data-test-id=original-sum]"
      );
      expect(originalSum2).toEqual("474816 €");
      const currentSum2 = await getElementInnerText(
        page,
        "[data-test-id=current-sum]"
      );
      expect(currentSum2).toEqual("474817");

      await clearAndType(
        page,
        'input[name="talousarvio.personnel-costs-row"]',
        "200000"
      );
      const currentSum3 = await getElementInnerText(
        page,
        "[data-test-id=current-sum]"
      );
      expect(currentSum3).toEqual("474816");
    });

    async function waitForSendButtonEnabled() {
      await page.waitForSelector("#send-muutospyynto-button:not([disabled])");
    }

    async function waitForSendButtonDisabled() {
      await page.waitForSelector("#send-muutospyynto-button[disabled]");
    }

    it("requires perustelut", async () => {
      await clearAndType(
        page,
        "#perustelut-taloudenKayttosuunnitelmanPerustelut",
        ""
      );
      await waitForSendButtonDisabled();
      const errorMessage = await getElementInnerText(
        page,
        "#perustelut-taloudenKayttosuunnitelmanPerustelut + .muutoshakemus__error-message"
      );
      expect(errorMessage).toEqual("Pakollinen kenttä");

      await clearAndType(
        page,
        "#perustelut-taloudenKayttosuunnitelmanPerustelut",
        "perustelu"
      );

      await waitForSendButtonEnabled();
      const noErrorMessage = await getElementInnerText(
        page,
        "#perustelut-taloudenKayttosuunnitelmanPerustelut + .muutoshakemus__error-message"
      );
      expect(noErrorMessage).toEqual("");
    });

    it("requires current sum to match the original sum", async () => {
      await clearAndType(
        page,
        "#perustelut-taloudenKayttosuunnitelmanPerustelut",
        "perustelu"
      );
      await waitForSendButtonEnabled();

      await clearAndType(
        page,
        'input[name="talousarvio.equipment-costs-row"]',
        "9999"
      );

      await waitForSendButtonDisabled();
      const sumErrorMessage = await getElementInnerText(
        page,
        "[data-test-id=current-sum-error]"
      );
      expect(sumErrorMessage).toEqual("Loppusumman on oltava 474816");

      await clearAndType(
        page,
        'input[name="talousarvio.material-costs-row"]',
        "3001"
      );

      await waitForSendButtonEnabled();
      const noSumErrorMessage = await getElementInnerText(
        page,
        "[data-test-id=current-sum-error]"
      );
      expect(noSumErrorMessage).toEqual("");
    });
  });
});
