import { Browser, Page } from "puppeteer";

import {
  clickElement,
  clickElementWithText,
  getElementAttribute,
  getElementInnerText,
  getFirstPage,
  log,
  mkBrowser,
  randomString,
  setPageErrorConsoleLogger,
  createHakuFromEsimerkkihaku,
  randomAsiatunnus,
} from "../test-util";
import { createRandomCodeValues } from "./muutospaatosprosessi-util";

jest.setTimeout(120000);

describe("Muutospäätösprosessi", () => {
  let browser: Browser;
  let page: Page;

  beforeEach(() => {
    log(`Starting test: ${expect.getState().currentTestName}`);
  });

  beforeAll(async () => {
    browser = await mkBrowser();
    page = await getFirstPage(browser);
    setPageErrorConsoleLogger(page);
  });

  afterEach(() => {
    log(`Finished test: ${expect.getState().currentTestName}`);
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
  });

  describe("When virkailija creates avustushaku #1", () => {
    const name = `Hakuna matata - haku ${randomString()}`;
    const hankkeenAlkamispaiva = "20.04.1969";
    const hankkeenPaattymispaiva = "29.12.1969";

    beforeAll(async () => {
      const codes = await createRandomCodeValues(page);
      await createHakuFromEsimerkkihaku(page, {
        name,
        hankkeenAlkamispaiva,
        hankkeenPaattymispaiva,
        registerNumber: randomAsiatunnus(),
        vaCodes: codes,
      });
    });

    describe("And creates avustushaku #2", () => {
      beforeAll(async () => {
        const codes = await createRandomCodeValues(page);
        await createHakuFromEsimerkkihaku(page, {
          name: `Makuulla hatata - haku ${randomString()}`,
          registerNumber: randomAsiatunnus(),
          vaCodes: codes,
        });
      });

      describe("And navigates from avustushaku #2 to avustushaku #1 päätös tab", () => {
        beforeAll(async () => {
          await clickElementWithText(page, "td", name);
          await clickElement(page, '[data-test-id="päätös-välilehti"]');
          await page.waitForSelector(
            '[data-test-id="hankkeen-alkamispaiva"] div.datepicker input',
            { visible: true, timeout: 5 * 1000 }
          );
        });

        it("Correct avustushaku start date is displayed", async () => {
          const val = await getElementAttribute(
            page,
            '[data-test-id="hankkeen-alkamispaiva"] div.datepicker input',
            "value"
          );
          expect(val).toBe(hankkeenAlkamispaiva);
        });

        it("Correct avustushaku end date is displayed", async () => {
          const val = await getElementAttribute(
            page,
            '[data-test-id="hankkeen-paattymispaiva"] div.datepicker input',
            "value"
          );
          expect(val).toBe(hankkeenPaattymispaiva);
        });

        it("Correct start date label is displayed", async () => {
          const label = await getElementInnerText(
            page,
            '[data-test-id="hankkeen-alkamispaiva"] [data-test-id="label"]'
          );
          expect(label).toBe("Avustuksen ensimmäinen käyttöpäivä");
        });

        it("Correct end date label is displayed", async () => {
          const label = await getElementInnerText(
            page,
            '[data-test-id="hankkeen-paattymispaiva"] [data-test-id="label"]'
          );
          expect(label).toBe("Avustuksen viimeinen käyttöpäivä");
        });
      });
    });
  });
});
