import { Browser, Frame, Page } from "puppeteer";
import moment from "moment";

import {
  getAcceptedPäätösEmails,
  HAKIJA_URL,
  TEST_Y_TUNNUS,
  clearAndType,
  clickElement,
  clickElementWithText,
  expectToBeDefined,
  getElementAttribute,
  getElementInnerText,
  getFirstPage,
  hasElementAttribute,
  log,
  mkBrowser,
  navigate,
  randomString,
  setPageErrorConsoleLogger,
  waitUntilMinEmails,
  createHakuFromEsimerkkihaku,
  defaultBudget,
  createRandomHakuValues,
  randomAsiatunnus,
  VaCodeValues,
} from "../test-util";
import {
  getLinkToMuutoshakemusFromSentEmails,
  getUserKeyFromPaatosEmail,
  MuutoshakemusValues,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
  createRandomCodeValues,
} from "./muutospaatosprosessi-util";

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

  const answers = {
    contactPersonEmail: "erkki.esimerkki@example.com",
    contactPersonName: "Erkki Esimerkki",
    contactPersonPhoneNumber: "666",
    projectName: "Rahassa kylpijät Ky Ay Oy",
  };

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

  describe("When budjettimuutoshakemus enabled haku has been published, a hakemus has been submitted, and päätös has been sent", () => {
    let linkToMuutoshakemus: string;
    let avustushakuID: number;
    let hakemusID: number;
    let codes: VaCodeValues;
    const newName = randomString();
    const newEmail = "uusi.email@reaktor.com";
    const newPhone = "0901967632";
    const haku = createRandomHakuValues();

    beforeAll(async () => {
      codes = await createRandomCodeValues(page);
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } =
        await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(
          page,
          haku,
          answers,
          defaultBudget,
          codes
        );
      avustushakuID = avustushakuId;
      hakemusID = hakemusId;
      linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(
        hakemusID
      );
    });

    it("hakija gets an email with a link to muutoshakemus", async () => {
      const userKey = await getUserKeyFromPaatosEmail(hakemusID);
      expect(linkToMuutoshakemus).toContain(
        `${HAKIJA_URL}/muutoshakemus?lang=fi&user-key=${userKey}&avustushaku-id=${avustushakuID}`
      );
    });

    it("hakija gets the correct email content", async () => {
      const emails = await waitUntilMinEmails(
        getAcceptedPäätösEmails,
        1,
        hakemusID
      );
      emails.forEach((email) => {
        const emailContent = email.formatted;
        expect(emailContent).toContain(`${HAKIJA_URL}/muutoshakemus`);
        expect(emailContent).toContain(
          "Pääsette tekemään muutoshakemuksen sekä muuttamaan yhteyshenkilöä ja hänen yhteystietojaan koko hankekauden ajan tästä linkistä"
        );
      });
    });

    describe("And user navigates to muutoshakemus page", () => {
      beforeAll(async () => {
        expectToBeDefined(linkToMuutoshakemus);
        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" });
      });

      it("shows correct avustushaku name", async () => {
        const avustushakuNameSpan = await page.waitForSelector(
          "[data-test-id=avustushaku-name]",
          { visible: true }
        );
        const avustushakuName = await page.evaluate(
          (element) => element.textContent,
          avustushakuNameSpan
        );
        expect(avustushakuName).toEqual(haku.avustushakuName);
      });

      it("shows correct project name", async () => {
        const projectNameDiv = await page.waitForSelector(
          "[data-test-id=project-name]",
          { visible: true }
        );
        const projectName = await page.evaluate(
          (element) => element.textContent,
          projectNameDiv
        );
        expect(projectName).toEqual(answers.projectName);
      });

      it("shows correct contact person name", async () => {
        const contactPersonInput = await page.waitForSelector(
          "#muutoshakemus__contact-person",
          { visible: true }
        );
        const contactPerson = await page.evaluate(
          (element) => element.value,
          contactPersonInput
        );
        expect(contactPerson).toEqual(answers.contactPersonName);
      });

      it("shows correct contact person email", async () => {
        const contactPersonEmailInput = await page.waitForSelector(
          "#muutoshakemus__email",
          { visible: true }
        );
        const contactPersonEmail = await page.evaluate(
          (element) => element.value,
          contactPersonEmailInput
        );
        expect(contactPersonEmail).toEqual(answers.contactPersonEmail);
      });

      it("shows correct contact person number", async () => {
        const contactPersonPhoneInput = await page.waitForSelector(
          "#muutoshakemus__phone",
          { visible: true }
        );
        const contactPersonPhoneNumber = await page.evaluate(
          (element) => element.value,
          contactPersonPhoneInput
        );
        expect(contactPersonPhoneNumber).toEqual(
          answers.contactPersonPhoneNumber
        );
      });

      async function sendMuutospyyntoButtonIsDisabled() {
        return await hasElementAttribute(
          page,
          "#send-muutospyynto-button",
          "disabled"
        );
      }

      it("send button is disabled", async () => {
        await page.waitForSelector("#send-muutospyynto-button", {
          visible: true,
        });
        expect(await sendMuutospyyntoButtonIsDisabled()).toBeTruthy();
      });

      describe("When user views original hakemus", () => {
        let frameContent: Frame;

        beforeAll(async () => {
          const iframe = await page.waitForSelector(
            "iframe[data-test-id=original-hakemus]"
          );
          if (!iframe)
            throw Error("Original hakemus iframe not found on page :mad:");
          const fc = await iframe.contentFrame();
          if (!fc)
            throw Error(
              "Original hakemus frameContent not found on page :mad:"
            );
          frameContent = fc;
        });

        it("iframe content can be found", () => {
          expect(frameContent).toBeTruthy();
        });

        it("correct contact person name is displayed", async () => {
          expect(
            await getElementInnerText(
              frameContent,
              "[id='signatories-fieldset-1.name']"
            )
          ).toStrictEqual(answers.contactPersonName);
        });

        it("correct Y-tunnus is displayed", async () => {
          expect(
            await getElementInnerText(frameContent, "#business-id")
          ).toStrictEqual(TEST_Y_TUNNUS);
        });
      });

      describe("And user fills muutoshakemus with invalid email address", () => {
        beforeAll(async () => {
          await clearAndType(page, "#muutoshakemus__contact-person", newName);
          await clearAndType(page, "#muutoshakemus__email", "not-email");
          await clearAndType(page, "#muutoshakemus__phone", newPhone);
        });

        afterAll(async () => {
          await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" });
        });

        it("send button is disabled", async () => {
          const sendMuutospyyntoButtonIsDisabledAfterInvalidEmail =
            await hasElementAttribute(
              page,
              "#send-muutospyynto-button",
              "disabled"
            );
          expect(
            sendMuutospyyntoButtonIsDisabledAfterInvalidEmail
          ).toBeTruthy();
        });

        it('email field class contains "error"', async () => {
          const emailInputFieldClassWhenInvalidEmail =
            await getElementAttribute(page, "#muutoshakemus__email", "class");
          expectToBeDefined(emailInputFieldClassWhenInvalidEmail);
          expect(emailInputFieldClassWhenInvalidEmail).toContain("error");
        });

        describe("After fixing the invalid email address", () => {
          beforeAll(async () => {
            await clearAndType(page, "#muutoshakemus__email", newEmail);
          });

          it("send button is enabled", async () => {
            const sendMuutospyyntoButtonIsDisabled = await hasElementAttribute(
              page,
              "#send-muutospyynto-button",
              "disabled"
            );
            expect(sendMuutospyyntoButtonIsDisabled).toBeFalsy();
          });

          it('email field class does not contain "error"', async () => {
            const emailInputFieldClassWithValidEmail =
              await getElementAttribute(page, "#muutoshakemus__email", "class");
            expect(emailInputFieldClassWithValidEmail).not.toContain("error");
          });
        });
      });

      describe("And user fills muutoshakemus with correct values", () => {
        beforeAll(async () => {
          await clearAndType(page, "#muutoshakemus__contact-person", newName);
          await clearAndType(page, "#muutoshakemus__email", newEmail);
          await clearAndType(page, "#muutoshakemus__phone", newPhone);
        });

        it("send button is enabled", async () => {
          expect(await sendMuutospyyntoButtonIsDisabled()).toBeFalsy();
        });

        describe('And clicks "send" button', () => {
          beforeAll(async () => {
            await clickElement(page, "#send-muutospyynto-button");
          });

          describe("And virkailija navigates to avustushaku", () => {
            beforeAll(async () => {
              await navigate(page, `/avustushaku/${avustushakuID}/`);
              await Promise.all([
                page.waitForNavigation(),
                clickElementWithText(page, "td", "Akaan kaupunki"),
              ]);
            });

            it("correct old applicant name is displayed", async () => {
              await page.waitForSelector(
                ".answer-old-value #applicant-name div"
              );
              const oldContactPersonNameOnPage = await getElementInnerText(
                page,
                ".answer-old-value #applicant-name div"
              );
              expect(oldContactPersonNameOnPage).toEqual("Erkki Esimerkki");
            });

            it("correct changed applicant name is displayed", async () => {
              const contactPersonNameOnPage = await getElementInnerText(
                page,
                ".answer-new-value #applicant-name div"
              );
              expect(contactPersonNameOnPage).toEqual(newName);
            });

            it("correct old phone number is displayed", async () => {
              const oldContactPersonPhoneOnPage = await getElementInnerText(
                page,
                ".answer-old-value #textField-0 div"
              );
              expect(oldContactPersonPhoneOnPage).toEqual("666");
            });

            it("correct new phone number is displayed", async () => {
              const contactPersonPhoneOnPage = await getElementInnerText(
                page,
                ".answer-new-value #textField-0 div"
              );
              expect(contactPersonPhoneOnPage).toEqual(newPhone);
            });

            it("correct old email is displayed", async () => {
              const oldContactPersonEmailOnPage = await getElementInnerText(
                page,
                ".answer-old-value #primary-email div"
              );
              expect(oldContactPersonEmailOnPage).toEqual(
                "erkki.esimerkki@example.com"
              );
            });

            it("correct new email is displayed", async () => {
              const contactPersonEmailOnPage = await getElementInnerText(
                page,
                ".answer-new-value #primary-email div"
              );
              expect(contactPersonEmailOnPage).toEqual(newEmail);
            });

            it("virkailija sees paatos email preview with the muutoshakemus link", async () => {
              await navigate(
                page,
                `/admin/decision/?avustushaku=${avustushakuID}`
              );
              await page.waitForSelector(".decision-email-content");
              const emailContent = await getElementInnerText(
                page,
                ".decision-email-content"
              );
              expect(emailContent).toContain(
                "/muutoshakemus?lang=fi&user-key="
              );
            });

            async function navigateToAkaanKaupunkiHakemus(page: Page) {
              await navigate(page, `/avustushaku/${avustushakuID}/`);
              await Promise.all([
                page.waitForNavigation(),
                clickElementWithText(page, "td", "Akaan kaupunki"),
              ]);
              await page.waitForSelector(
                ".answer-old-value #applicant-name div"
              );
            }

            describe("And virkailija navigates to hakemus and opens printable link", () => {
              let printablePage: Page;

              beforeAll(async () => {
                await navigateToAkaanKaupunkiHakemus(page);
                await page.waitForSelector(
                  '[data-test-id="hakemus-printable-link"]'
                );
                const printableVersionTab = new Promise((x) =>
                  browser.once("targetcreated", (target) => x(target.page()))
                ) as Promise<Page>;
                await clickElement(
                  page,
                  '[data-test-id="hakemus-printable-link"]'
                );

                printablePage = await printableVersionTab;
                await printablePage.waitForSelector("#applicant-name div");
              });

              afterAll(async () => {
                printablePage.close();
              });

              it("printable version shows correct name", async () => {
                expect(
                  await getElementInnerText(
                    printablePage,
                    "#applicant-name div"
                  )
                ).toEqual(newName);
              });

              it("printable version shows correct email", async () => {
                expect(
                  await getElementInnerText(printablePage, "#primary-email div")
                ).toEqual(newEmail);
              });

              it("printable version shows correct phone number", async () => {
                expect(
                  await getElementInnerText(printablePage, "#textField-0 div")
                ).toEqual(newPhone);
              });
            });

            describe("And re-sends päätös emails", () => {
              let oldNameOnPage: string | undefined;
              let nameOnPage: string | undefined;
              let oldPhoneOnPage: string | undefined;
              let phoneOnPage: string | undefined;
              let oldEmailOnPage: string | undefined;
              let emailOnPage: string | undefined;

              beforeAll(async () => {
                await navigateToAkaanKaupunkiHakemus(page);
                oldNameOnPage = await getElementInnerText(
                  page,
                  ".answer-old-value #applicant-name div"
                );
                nameOnPage = await getElementInnerText(
                  page,
                  ".answer-new-value #applicant-name div"
                );
                oldPhoneOnPage = await getElementInnerText(
                  page,
                  ".answer-old-value #textField-0 div"
                );
                phoneOnPage = await getElementInnerText(
                  page,
                  ".answer-new-value #textField-0 div"
                );
                oldEmailOnPage = await getElementInnerText(
                  page,
                  ".answer-old-value #primary-email div"
                );
                emailOnPage = await getElementInnerText(
                  page,
                  ".answer-new-value #primary-email div"
                );

                page.on("dialog", async (dialog) => {
                  dialog.accept();
                });
                await clickElement(page, "[data-test-id=resend-paatos]");
                await page.waitForSelector("[data-test-id=paatos-resent]");

                // reload to see possibly changed values
                await navigateToAkaanKaupunkiHakemus(page);
              });

              it("applicant old name is not overwritten", async () => {
                expect(
                  await getElementInnerText(
                    page,
                    ".answer-old-value #applicant-name div"
                  )
                ).toEqual(oldNameOnPage);
              });
              it("applicant new name is not overwritten", async () => {
                expect(
                  await getElementInnerText(
                    page,
                    ".answer-new-value #applicant-name div"
                  )
                ).toEqual(nameOnPage);
              });
              it("applicant old phone number is not overwritten", async () => {
                expect(
                  await getElementInnerText(
                    page,
                    ".answer-old-value #textField-0 div"
                  )
                ).toEqual(oldPhoneOnPage);
              });
              it("applicant new phone number is not overwritten", async () => {
                expect(
                  await getElementInnerText(
                    page,
                    ".answer-new-value #textField-0 div"
                  )
                ).toEqual(phoneOnPage);
              });
              it("applicant old email is not overwritten", async () => {
                expect(
                  await getElementInnerText(
                    page,
                    ".answer-old-value #primary-email div"
                  )
                ).toEqual(oldEmailOnPage);
              });
              it("applicant new email is not overwritten", async () => {
                expect(
                  await getElementInnerText(
                    page,
                    ".answer-new-value #primary-email div"
                  )
                ).toEqual(emailOnPage);
              });
            });
          });
        });
      });
    });
  });
});
