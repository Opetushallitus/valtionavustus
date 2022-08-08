import { Browser, Page } from "puppeteer";
import {
  mkBrowser,
  waitUntilMinEmails,
  getAcceptedPäätösEmails,
  getFirstPage,
  setPageErrorConsoleLogger,
  clickElement,
  getElementInnerText,
  clearAndType,
  Budget,
  defaultBudget,
  createRandomHakuValues,
  setupTestLogging,
  VaCodeValues,
} from "../test-util";
import {
  createRandomCodeValues,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
} from "./muutospaatosprosessi-util";
import { navigateToHakijaMuutoshakemusPage } from "./muutoshakemus-util";

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
