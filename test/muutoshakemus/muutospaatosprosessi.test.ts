import { Browser, ElementHandle, Frame, Page } from "puppeteer";
import moment from "moment";

import {
  getValmistelijaEmails,
  getAcceptedPäätösEmails,
  HAKIJA_URL,
  TEST_Y_TUNNUS,
  clearAndType,
  clickElement,
  clickElementWithText,
  countElements,
  expectToBeDefined,
  getElementAttribute,
  getElementInnerText,
  getFirstPage,
  hasElementAttribute,
  log,
  mkBrowser,
  navigate,
  randomString,
  selectVakioperusteluInFinnish,
  setPageErrorConsoleLogger,
  textContent,
  waitUntilMinEmails,
  createHakuFromEsimerkkihaku,
  defaultBudget,
  getHakemusTokenAndRegisterNumber,
  createRandomHakuValues,
  randomAsiatunnus,
  MailWithLinks,
  saveMuutoshakemus,
} from "../test-util";
import {
  ratkaiseMuutoshakemusEnabledAvustushaku,
  getLinkToMuutoshakemusFromSentEmails,
  getUserKeyFromPaatosEmail,
  validateMuutoshakemusValues,
  MuutoshakemusValues,
  ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat,
  parseMuutoshakemusPaatosFromEmails,
  navigateToLatestMuutoshakemus,
  expectMuutoshakemusPaatosReason,
  setMuutoshakemusJatkoaikaDecision,
} from "./muutospaatosprosessi-util";
import {
  navigateToHakijaMuutoshakemusPage,
  fillAndSendMuutoshakemus,
  clickSendMuutoshakemusButton,
  expectMuutoshakemusToBeSubmittedSuccessfully,
} from "./muutoshakemus-util";

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

  const muutoshakemus1: MuutoshakemusValues = {
    jatkoaika: moment(new Date()).add(2, "months").add(1, "days").locale("fi"),
    jatkoaikaPerustelu:
      "Ei kyl millään ehdi deadlineen mennessä ku mun koira söi ne tutkimustulokset",
  };

  const muutoshakemus2: MuutoshakemusValues = {
    jatkoaika: moment(new Date()).add(3, "months").add(8, "days").locale("fi"),
    jatkoaikaPerustelu: "Final muutoshakemus koira 2",
  };

  const muutoshakemus3: MuutoshakemusValues = {
    jatkoaika: moment(new Date()).add(1, "months").add(3, "days").locale("fi"),
    jatkoaikaPerustelu: "Kerkeehän sittenkin",
  };

  const muutoshakemus4: MuutoshakemusValues = {
    jatkoaika: moment(new Date()).add(4, "months").add(6, "days").locale("fi"),
    jatkoaikaPerustelu: "Jaa ei kyllä kerkeekkään",
  };

  describe("When muutoshakemus enabled haku has been published, a hakemus has been submitted, and päätös has been sent", () => {
    const haku = createRandomHakuValues();
    let avustushakuID: number;
    let hakemusID: number;

    beforeAll(async () => {
      const hakemusIdAvustushakuId =
        await ratkaiseMuutoshakemusEnabledAvustushaku(page, haku, answers);
      avustushakuID = hakemusIdAvustushakuId.avustushakuID;
      hakemusID = hakemusIdAvustushakuId.hakemusID;
    });

    describe("And hakija changes only contact details", () => {
      afterAll(async () => {
        await navigateToHakijaMuutoshakemusPage(page, hakemusID);
        await clearAndType(
          page,
          "#muutoshakemus__email",
          answers.contactPersonEmail
        );
        await clickSendMuutoshakemusButton(page);
        await expectMuutoshakemusToBeSubmittedSuccessfully(page, false);
      });

      it("valmistelija does not get an email", async () => {
        await navigateToHakijaMuutoshakemusPage(page, hakemusID);
        await clearAndType(page, "#muutoshakemus__email", "a@b.c");
        await clickSendMuutoshakemusButton(page);
        await expectMuutoshakemusToBeSubmittedSuccessfully(page, false);
        expect((await getValmistelijaEmails(hakemusID)).length).toBe(0);
      });
    });

    describe("And muutoshakemus #1 has been submitted", () => {
      beforeAll(async () => {
        await fillAndSendMuutoshakemus(page, hakemusID, muutoshakemus1);
      });

      describe("When virkailija rejects muutoshakemus", () => {
        beforeAll(async () => {
          await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID);
          await setMuutoshakemusJatkoaikaDecision(page, "rejected");
          await selectVakioperusteluInFinnish(page);
          await saveMuutoshakemus(page);
        });

        it("muutoshakemus has correct values", async () => {
          await page.waitForSelector("[data-test-id=muutoshakemus-jatkoaika]");
          await validateMuutoshakemusValues(page, muutoshakemus1, {
            status: "rejected",
          });
        });

        describe("And hakija gets an email", () => {
          let parsedMail: {
            title: string | undefined;
            linkToMuutoshakemusPaatos?: string | undefined;
            linkToMuutoshakemus?: string | undefined;
          };

          beforeAll(async () => {
            parsedMail = await parseMuutoshakemusPaatosFromEmails(hakemusID);
          });

          it("email has correct title", () => {
            expectToBeDefined(parsedMail.title);
            expect(parsedMail.title).toContain(
              `${haku.registerNumber} - ${answers.projectName}`
            );
          });

          it("email has link to päätös", async () => {
            expectToBeDefined(parsedMail.linkToMuutoshakemusPaatos);
            expect(parsedMail.linkToMuutoshakemusPaatos).toMatch(
              /https?:\/\/[^\/]+\/muutoshakemus\/paatos\?user-key=[a-f0-9]{64}/
            );
          });

          it("email has link to muutoshakemus", () => {
            expectToBeDefined(parsedMail.linkToMuutoshakemus);
            expect(parsedMail.linkToMuutoshakemus).toMatch(
              /https?:\/\/[^\/]+\/muutoshakemus\?.*/
            );
          });
        });

        describe("And virkailija navigates to avustushaku", () => {
          beforeAll(async () => {
            await navigate(page, `/avustushaku/${avustushakuID}/`);
          });

          it('muutoshakemus status is shown as "Hylätty"', async () => {
            const muutoshakemusStatusField = `[data-test-id="hakemus-${hakemusID}"] [data-test-class=muutoshakemus-status-cell]`;
            await page.waitForSelector(muutoshakemusStatusField);
            const muutoshakemusStatus = await page.$eval(
              muutoshakemusStatusField,
              (el) => el.textContent
            );
            expect(muutoshakemusStatus).toEqual("Hylätty");
          });
        });

        describe("And virkailija navigates to hakemus and clicks muutoshakemus tab", () => {
          beforeAll(async () => {
            await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID);
            await page.waitForSelector(
              "[data-test-id=muutoshakemus-jatkoaika]"
            );
          });

          it('muutoshakemus status is "rejected"', async () => {
            await validateMuutoshakemusValues(page, muutoshakemus1, {
              status: "rejected",
            });
          });
        });
      });

      describe("And muutoshakemus #2 has been submitted", () => {
        beforeAll(async () => {
          await fillAndSendMuutoshakemus(page, hakemusID, muutoshakemus2);
        });

        describe("And virkailija accepts the muutoshakemus", () => {
          beforeAll(async () => {
            await navigateToLatestMuutoshakemus(page, avustushakuID, hakemusID);
            await setMuutoshakemusJatkoaikaDecision(page, "accepted");
            await selectVakioperusteluInFinnish(page);
            await saveMuutoshakemus(page);
            await page.waitForSelector(
              "[data-test-id=muutoshakemus-jatkoaika]"
            );
          });

          it("muutoshakemus has correct values", async () => {
            await validateMuutoshakemusValues(page, muutoshakemus2, {
              status: "accepted",
            });
          });

          it("displays correct old project end date", async () => {
            const oldProjectEnd = await getElementInnerText(
              page,
              ".answer-old-value #project-end div"
            );
            expect(oldProjectEnd).toEqual("20.04.4200");
          });

          it("displays correct new project end date", async () => {
            const newProjectEnd = await getElementInnerText(
              page,
              ".answer-new-value #project-end div"
            );
            expect(newProjectEnd).toEqual(
              muutoshakemus2.jatkoaika?.format("DD.MM.YYYY")
            );
          });

          describe("And hakija receives muutoshakemus päätös email", () => {
            let email: MailWithLinks;

            beforeAll(async () => {
              email = await parseMuutoshakemusPaatosFromEmails(hakemusID);
            });

            it("email has correct subject", async () => {
              expect(email.subject).toBe(
                "Automaattinen viesti: organisaationne muutoshakemus on käsitelty - Linkki päätösasiakirjaan"
              );
            });

            it("email has correct recipient", async () => {
              expect(email["to-address"]).toContain(answers.contactPersonEmail);
            });

            it("email has correct body", async () => {
              const { "register-number": registerNumber } =
                await getHakemusTokenAndRegisterNumber(hakemusID);
              expect(email.formatted).toBe(`Hyvä vastaanottaja,

muutoshakemuksenne on käsitelty.

Hanke: ${registerNumber} - ${answers.projectName}

Päätös muutoshakemukseenne: ${email.linkToMuutoshakemusPaatos}

Selaa aiempia muutoshakemuksia ja tee tarvittaessa uusi muutoshakemus: ${email.linkToMuutoshakemus}

Liitteet: Oikaisuvaatimusosoitus

Tarvittaessa lisätietoja antaa päätöksessä nimetty lisätietojen antaja.

Terveisin,
_ valtionavustus

Opetushallitus
Hakaniemenranta 6
PL 380, 00531 Helsinki

puhelin 029 533 1000
etunimi.sukunimi@oph.fi
`);
            });
          });

          describe("Navigating to avustushaku", () => {
            beforeAll(async () => {
              await navigate(page, `/avustushaku/${avustushakuID}/`);
            });

            it('muutoshakemus status is "hyväksytty"', async () => {
              const muutoshakemusStatusField = `[data-test-id="hakemus-${hakemusID}"] [data-test-class=muutoshakemus-status-cell]`;
              await page.waitForSelector(muutoshakemusStatusField);
              const muutoshakemusStatus = await page.$eval(
                muutoshakemusStatusField,
                (el) => el.textContent
              );
              expect(muutoshakemusStatus).toEqual("Hyväksytty");
            });
          });

          describe('Navigating to hakemus and clicking "jatkoaika" tab', () => {
            beforeAll(async () => {
              await navigateToLatestMuutoshakemus(
                page,
                avustushakuID,
                hakemusID
              );
              await page.waitForSelector(
                "[data-test-id=muutoshakemus-jatkoaika]"
              );
            });

            it("muutoshakemus has correct values", async () => {
              await validateMuutoshakemusValues(page, muutoshakemus2, {
                status: "accepted",
              });
            });
          });

          describe("And muutoshakemus #3 has been submitted and rejected and #4 has been submitted", () => {
            beforeAll(async () => {
              // create two new muutoshakemus
              await fillAndSendMuutoshakemus(page, hakemusID, muutoshakemus3);
              await navigateToLatestMuutoshakemus(
                page,
                avustushakuID,
                hakemusID
              );
              await setMuutoshakemusJatkoaikaDecision(page, "rejected");
              await selectVakioperusteluInFinnish(page);
              await saveMuutoshakemus(page);
              await fillAndSendMuutoshakemus(page, hakemusID, muutoshakemus4);
            });

            describe("And hakija navigates to muutoshakemus", () => {
              let muutoshakemuses: ElementHandle[];

              beforeAll(async () => {
                await navigateToHakijaMuutoshakemusPage(page, hakemusID);
                muutoshakemuses = await page.$$(
                  '[data-test-class="existing-muutoshakemus"]'
                );
              });

              it("shows correct amount of muutoshakemuses", async () => {
                expect(muutoshakemuses.length).toEqual(4);
              });

              it('muutoshakemus title contains "Odottaa käsittelyä"', async () => {
                const firstTitle = await muutoshakemuses[0].$eval(
                  '[data-test-id="existing-muutoshakemus-title"]',
                  (el) => el.textContent
                );
                expect(firstTitle).toContain("- Odottaa käsittelyä");
              });

              it("shows correct amount of rejected muutoshakemuses", async () => {
                expect(
                  await countElements(page, '[data-test-id="icon-rejected"]')
                ).toEqual(2);
              });
            });

            describe("And virkailija navigates to avustushaku", () => {
              beforeAll(async () => {
                await navigate(page, `/avustushaku/${avustushakuID}/`);
              });

              it('Muutoshakemus status is displayed as "Uusi', async () => {
                const muutoshakemusStatusField = `[data-test-id="hakemus-${hakemusID}"] [data-test-class=muutoshakemus-status-cell]`;
                await page.waitForSelector(muutoshakemusStatusField);
                const muutoshakemusStatus = await page.$eval(
                  muutoshakemusStatusField,
                  (el) => el.textContent
                );
                expect(muutoshakemusStatus).toEqual("Uusi");
              });

              describe("And navigates to hakemus and clicks muutoshakemus tab", () => {
                beforeAll(async () => {
                  await navigate(
                    page,
                    `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`
                  );
                  await page.waitForFunction(
                    () =>
                      (
                        document.querySelector(
                          "[data-test-id=number-of-pending-muutoshakemukset]"
                        ) as HTMLInputElement
                      ).innerText === "4"
                  );
                });

                describe("And clicks the most recent muutoshakemus", () => {
                  beforeAll(async () => {
                    await clickElement(page, "span.muutoshakemus-tab");
                    await page.waitForSelector(
                      "[data-test-id=muutoshakemus-jatkoaika]"
                    );
                  });

                  it("muutoshakemus #4 has correct values", async () => {
                    await validateMuutoshakemusValues(page, muutoshakemus4);
                  });

                  it("project end date is the same which was approved at muutoshakemus #2", async () => {
                    expect(
                      await getElementInnerText(
                        page,
                        '[data-test-id="project-end-date"]'
                      )
                    ).toBe(muutoshakemus2.jatkoaika?.format("DD.MM.YYYY"));
                  });
                });

                describe("And clicks the 2nd most recent muutoshakemus", () => {
                  beforeAll(async () => {
                    await clickElement(
                      page,
                      "button.muutoshakemus-tabs__tab:nth-child(2)"
                    );
                  });

                  it("muutoshakemus #3 has correct values", async () => {
                    await validateMuutoshakemusValues(page, muutoshakemus3, {
                      status: "rejected",
                    });
                  });

                  it("project end date is the same which was approved at muutoshakemus #2", async () => {
                    expect(
                      await getElementInnerText(
                        page,
                        '[data-test-id="project-end-date"]'
                      )
                    ).toBe(muutoshakemus2.jatkoaika?.format("DD.MM.YYYY"));
                  });

                  it("shows rejected reasoning", async () => {
                    const reason =
                      "Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.";
                    await expectMuutoshakemusPaatosReason(page, reason);
                  });
                });

                describe("And clicks the 3rd most recent muutoshakemus", () => {
                  beforeAll(async () => {
                    await clickElement(
                      page,
                      "button.muutoshakemus-tabs__tab:nth-child(3)"
                    );
                  });

                  it("muutoshakemus #2 has correct values", async () => {
                    await validateMuutoshakemusValues(page, muutoshakemus2, {
                      status: "accepted",
                    });
                  });

                  it("muutoshakemus #2 shows the correct project end date", async () => {
                    expect(
                      await getElementInnerText(
                        page,
                        '[data-test-id="project-end-date"]'
                      )
                    ).toBe("20.04.4200");
                  });

                  it("shows accepted reasoning", async () => {
                    const reason =
                      "Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset hakemuksen mukaisesti.";
                    await expectMuutoshakemusPaatosReason(page, reason);
                  });
                });

                describe("And clicks the 4th most recent muutoshakemus", () => {
                  beforeAll(async () => {
                    await clickElement(
                      page,
                      "button.muutoshakemus-tabs__tab:nth-child(4)"
                    );
                  });

                  it("muutoshakemus #1 has correct values", async () => {
                    await validateMuutoshakemusValues(page, muutoshakemus1, {
                      status: "rejected",
                    });
                  });

                  it("muutoshakemus #1 has correct project end date", async () => {
                    expect(
                      await getElementInnerText(
                        page,
                        '[data-test-id="project-end-date"]'
                      )
                    ).toBe("20.04.4200");
                  });

                  it("approved jatkoaika from muutoshakemus #2 is shown", async () => {
                    expect(
                      await getElementInnerText(
                        page,
                        ".answer-new-value #project-end"
                      )
                    ).toBe(muutoshakemus2.jatkoaika?.format("DD.MM.YYYY"));
                  });

                  it("shows correct reasoning", async () => {
                    const reason =
                      "Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.";
                    await expectMuutoshakemusPaatosReason(page, reason);
                  });
                });
              });
            });

            describe("And muutoshakemus #5 has been submitted", () => {
              const muutoshakemus = {
                ...muutoshakemus2,
                ...{
                  jatkoaikaPerustelu:
                    "Voit laittaa lisäaikaa ihan omantunnon mukaan.",
                },
              };
              const newAcceptedJatkoaika = "20.04.2400" as const;
              beforeAll(async () => {
                await navigateToLatestMuutoshakemus(
                  page,
                  avustushakuID,
                  hakemusID
                );
                await setMuutoshakemusJatkoaikaDecision(page, "rejected");
                await selectVakioperusteluInFinnish(page);
                await saveMuutoshakemus(page);
                await fillAndSendMuutoshakemus(page, hakemusID, muutoshakemus);
              });

              describe("And virkailija accepts muutoshakemus", () => {
                beforeAll(async () => {
                  await navigateToLatestMuutoshakemus(
                    page,
                    avustushakuID,
                    hakemusID
                  );
                  await setMuutoshakemusJatkoaikaDecision(
                    page,
                    "accepted_with_changes",
                    newAcceptedJatkoaika
                  );
                  await selectVakioperusteluInFinnish(page);
                });

                it("Correct current project end date is displayed", async () => {
                  const currentProjectEndDate = await getElementInnerText(
                    page,
                    '[data-test-id="current-project-end-date"]'
                  );
                  expect(currentProjectEndDate).toBe(
                    muutoshakemus2.jatkoaika?.format("DD.MM.YYYY")
                  );
                });

                it("Correct applied change date is displayed", async () => {
                  const appliedProjectEndDate = await getElementInnerText(
                    page,
                    '[data-test-id="approve-with-changes-muutoshakemus-jatkoaika"]'
                  );
                  expect(appliedProjectEndDate).toBe(
                    muutoshakemus2.jatkoaika?.format("DD.MM.YYYY")
                  );
                });

                describe("After sending päätös", () => {
                  beforeAll(async () => {
                    await saveMuutoshakemus(page);
                  });

                  it("Correct päättymispäivä is displayed to virkailija", async () => {
                    const acceptedDate = await page.$eval(
                      '[data-test-id="muutoshakemus-jatkoaika"]',
                      (el) => el.textContent
                    );
                    expect(acceptedDate).toBe(newAcceptedJatkoaika);
                  });

                  it("New project end date title is displayed to virkailija in finnish", async () => {
                    const title = await page.$eval(
                      '[data-test-id="muutoshakemus-new-end-date-title"]',
                      (el) => el.textContent
                    );
                    expect(title).toBe("Hyväksytty uusi viimeinen käyttöpäivä");
                  });

                  it("Old project end date title is displayed to virkailija in finnish", async () => {
                    const title = await page.$eval(
                      '[data-test-id="muutoshakemus-current-end-date-title"]',
                      (el) => el.textContent
                    );
                    expect(title).toBe("Vanha viimeinen käyttöpäivä");
                  });

                  it("Reasoning title is displayed to virkailija in finnish", async () => {
                    const title = await page.$eval(
                      '[data-test-id="muutoshakemus-reasoning-title"]',
                      (el) => el.textContent
                    );
                    expect(title).toBe("Hakijan perustelut");
                  });

                  it('"Hyväksytty muutettuna" is displayed to virkailija', async () => {
                    const paatosStatusText = await page.$eval(
                      '[data-test-id="paatos-jatkoaika"]',
                      (el) => el.textContent
                    );
                    expect(paatosStatusText).toBe(
                      "Hyväksytään haetut muutokset käyttöaikaan muutettuna"
                    );
                  });

                  it("Correct päättymispäivä is displayed when creating a new muutoshakemus", async () => {
                    await navigateToHakijaMuutoshakemusPage(page, hakemusID);
                    const acceptedDate = await textContent(
                      page,
                      '[data-test-id="muutoshakemus-jatkoaika"]'
                    );
                    expect(acceptedDate).toBe(newAcceptedJatkoaika);
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  describe("When virkailija creates avustushaku #1", () => {
    const name = `Hakuna matata - haku ${randomString()}`;
    const hankkeenAlkamispaiva = "20.04.1969";
    const hankkeenPaattymispaiva = "29.12.1969";

    beforeAll(async () => {
      await createHakuFromEsimerkkihaku(page, {
        name,
        hankkeenAlkamispaiva,
        hankkeenPaattymispaiva,
        registerNumber: randomAsiatunnus(),
      });
    });

    describe("And creates avustushaku #2", () => {
      beforeAll(async () => {
        await createHakuFromEsimerkkihaku(page, {
          name: `Makuulla hatata - haku ${randomString()}`,
          registerNumber: randomAsiatunnus(),
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
    const newName = randomString();
    const newEmail = "uusi.email@reaktor.com";
    const newPhone = "0901967632";
    const haku = createRandomHakuValues();

    beforeAll(async () => {
      const { avustushakuID: avustushakuId, hakemusID: hakemusId } =
        await ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(
          page,
          haku,
          answers,
          defaultBudget
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
