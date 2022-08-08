import axios from "axios";
import * as fs from "fs";
import { Moment } from "moment";
import * as path from "path";
import { Page } from "puppeteer";
import { clickKoodienhallintaTab } from "../koodienhallinta-util";
import {
  acceptAvustushaku,
  Budget,
  BudgetAmount,
  clearAndSet,
  clearAndType,
  clickElement,
  clickElementWithText,
  clickFormSaveAndWait,
  createCode,
  createValidCopyOfEsimerkkihakuAndReturnTheNewId,
  dummyExcelPath,
  expectQueryParameter,
  expectToBeDefined,
  fillBudget,
  getHakemusIDFromHakemusTokenURLParameter,
  getMuutoshakemusEmails,
  navigate,
  navigateHakija,
  navigateToNewHakemusPage,
  publishAvustushaku,
  randomString,
  saveMuutoshakemus,
  selectMaakuntaFromDropdown,
  selectVakioperusteluInFinnish,
  setCalendarDate,
  TEST_Y_TUNNUS,
  uploadFile,
  VaCodeValues,
  VIRKAILIJA_URL,
  waitUntilMinEmails,
} from "../test-util";
import { PaatosStatus } from "../../soresu-form/web/va/types/muutoshakemus";

export interface Answers {
  projectName: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhoneNumber: string;
  lang?: "fi" | "sv";
}

export interface Haku {
  registerNumber: string;
  avustushakuName: string;
}

export interface MuutoshakemusValues {
  jatkoaika?: Moment;
  jatkoaikaPerustelu: string;
}

fs.readFileSync(path.join(__dirname, "prod.hakulomake.json"), "utf8");
const budjettimuutoshakemusEnabledLomakeJson = fs.readFileSync(
  path.join(__dirname, "budjettimuutos.hakulomake.json"),
  "utf8"
);
const muutoshakuDisabledMenoluokiteltuLomakeJson = fs.readFileSync(
  path.join(__dirname, "muutoshakemus-disabled-menoluokiteltu.hakulomake.json"),
  "utf8"
);

async function createHakuWithLomakeJson(
  page: Page,
  lomakeJson: string,
  registerNumber: string,
  codes: VaCodeValues,
  hakuName?: string
): Promise<{ avustushakuID: number }> {
  const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(
    page,
    registerNumber,
    codes,
    hakuName
  );
  await clickElementWithText(page, "span", "Hakulomake");
  await clearAndSet(page, ".form-json-editor textarea", lomakeJson);
  await clickFormSaveAndWait(page);
  return { avustushakuID };
}

async function createBudjettimuutoshakemusEnabledHaku(
  page: Page,
  registerNumber: string,
  codes: VaCodeValues,
  hakuName?: string
): Promise<{ avustushakuID: number }> {
  return await createHakuWithLomakeJson(
    page,
    budjettimuutoshakemusEnabledLomakeJson,
    registerNumber,
    codes,
    hakuName
  );
}

export async function createAndPublishMuutoshakemusDisabledMenoluokiteltuHaku(
  page: Page,
  haku: Haku,
  codes: VaCodeValues
): Promise<number> {
  const { avustushakuID } = await createMuutoshakemusDisabledMenoluokiteltuHaku(
    page,
    haku.registerNumber,
    codes,
    haku.avustushakuName
  );
  await publishAvustushaku(page, avustushakuID);
  await markAvustushakuAsMuutoshakukelvoton(avustushakuID);
  return avustushakuID;
}

export async function markAvustushakuAsMuutoshakukelvoton(
  avustushakuId: number
): Promise<void> {
  await axios.post(
    `${VIRKAILIJA_URL}/api/test/avustushaku/${avustushakuId}/set-muutoshakukelpoisuus`,
    { muutoshakukelpoinen: false }
  );
}

export async function fillAndSendMuutoshakemusDisabledMenoluokiteltuHakemus(
  page: Page,
  avustushakuID: number,
  answers: Answers
): Promise<number> {
  const lang = answers.lang || "fi";
  await navigateHakija(
    page,
    `/avustushaku/${avustushakuID}/?lang=${lang || "fi"}`
  );

  await page.waitForSelector("#haku-not-open", { hidden: true, timeout: 500 });
  await clearAndType(page, "#primary-email", answers.contactPersonEmail);
  await clickElement(page, "#submit:not([disabled])");

  await navigateToNewHakemusPage(page, avustushakuID);

  await clearAndType(page, "#finnish-business-id", TEST_Y_TUNNUS);
  await clickElement(page, "input.get-business-id");
  await clearAndType(page, "#applicant-name", answers.contactPersonName);
  await clearAndType(
    page,
    "[id='textField-5']",
    answers.contactPersonPhoneNumber
  );
  await clearAndType(page, "[id='textField-2']", "Paratiisitie 13"); // postiosoite
  await clearAndType(page, "[id='textField-3']", "00313"); // postinumero
  await clearAndType(page, "[id='textField-4']", "Ankkalinna"); // postitoimipaikka
  await clickElement(page, "[id='koodistoField-1_input']"); // maakunta
  await selectMaakuntaFromDropdown(page, "Kainuu");

  await clickElement(page, 'label[for="radioButton-0.radio.0"]'); // Kunta/kuntayhtymä, kunnan omistamat yhtiöt, kirkko
  await clearAndType(
    page,
    "[id='signatories-fieldset-1.name']",
    "Teppo Testityyppi"
  );
  await clearAndType(
    page,
    "[id='signatories-fieldset-1.email']",
    "teppo.testityyppi@example.com"
  );
  await clearAndType(page, "#bank-iban", "FI95 6682 9530 0087 65");
  await clearAndType(page, "#bank-bic", "OKOYFIHH");

  await clearAndType(page, "#project-name", answers.projectName);
  await clickElement(page, 'label[for="combined-effort.radio.1"]'); // yhteishanke = ei

  await clearAndType(page, "#textArea-2", "Ei osaamista"); // Hakijayhteisön osaaminen ja kokemus opetustoimen henkilöstökoulutuksesta
  await clearAndType(page, "#textArea-3", "Ei osaamista"); // Koulutushankkeen kouluttajat, heidän osaamisensa ja kokemuksensa opetustoimen ja varhaiskasvatuksen henkilöstökoulutuksesta
  await clickElement(page, 'label[for="radioButton-1.radio.0"]'); // Teema: Johtamisosaamisen ja yhteisöllisen kehittämisen vahvistaminen
  await clickElement(page, 'label[for="radioButton-2.radio.0"]'); // Mistä muista kohderyhmistä koulutukseen voi osallistua: Varhaiskasvatus
  await clearAndType(
    page,
    "#project-goals",
    "Ostetaan Pelle Pelottomalle uusi aikakone"
  ); // Hanke pähkinänkuoressa
  await clearAndType(
    page,
    "#textArea-7",
    "Jälki-istunto. Iltakoulu. Kannettu vesi."
  ); // kolme koulutuksen sisältöä kuvaavaa asiasanaa tai sanaparia
  await clearAndType(page, "#textArea-4", "Ei mitenkään"); // Miksi hanke tarvitaan? Miten koulutustarve on kartoitettu?
  await clearAndType(page, "#textArea-5", "Päästä matkustamaan tulevaisuuteen"); // Hankkeen tavoitteet, toteutustapa ja tulokset
  await clearAndType(
    page,
    "#textArea-6",
    "Minä ja Pelle Peloton. Minä makaan riippumatossa ja kannustan Pelleä työntekoon"
  ); // Hankkeen osapuolet ja työnjako
  await clearAndType(page, "#textArea-1", "Ankkalinna"); // Toteuttamispaikkakunnat
  await clearAndType(page, "#project-announce", "Uhkailemalla"); // Miten osallistujat rekrytoidaan koulutukseen?
  await clearAndType(
    page,
    "#project-effectiveness",
    "Vahditaan ettei työntekijät laiskottele"
  ); // Miten hankkeen tavoitteiden toteutumista seurataan?
  await clearAndType(
    page,
    "#project-spreading-plan",
    "Hanke tulee luultavasti leviämään käsiin itsestään"
  ); // Hankkeen tulosten levittämissuunnitelma

  await clearAndType(
    page,
    "[id='koulutusosiot.koulutusosio-1.nimi']",
    "Eka osa"
  ); // Koulutusosion nimi
  await clearAndType(
    page,
    "[id='koulutusosiot.koulutusosio-1.keskeiset-sisallot']",
    "Kaadetaan tietoa osallistujien päähän"
  ); // Keskeiset sisällöt ja toteuttamistapa
  await clearAndType(
    page,
    "[id='koulutusosiot.koulutusosio-1.kohderyhmat']",
    "Veljenpojat"
  ); // Kohderyhmät

  await clickElement(
    page,
    'label[for="koulutusosiot.koulutusosio-1.koulutettavapaivat.scope-type.radio.1"]'
  ); // Laajuus ilmoitettu koulutuspäivinä
  await clearAndType(
    page,
    "[id='koulutusosiot.koulutusosio-1.koulutettavapaivat.scope']",
    "10"
  ); // Laajuus
  await clearAndType(
    page,
    "[id='koulutusosiot.koulutusosio-1.koulutettavapaivat.person-count']",
    "2"
  ); // Osallistujamäärä

  await clickElement(page, 'label[for="vat-included.radio.0"]'); // Onko kustannukset ilmoitettu arvonlisäverollisina

  await uploadFile(page, "[name='namedAttachment-0']", dummyExcelPath);

  // Henkilöstökustannukset
  await clearAndType(page, "[id='personnel-costs-row.description']", "Liksat");
  await clearAndType(page, "[id='personnel-costs-row.amount']", "666");
  // Aineet, tarvikkeet ja tavarat
  await clearAndType(
    page,
    "[id='material-costs-row.description']",
    "Lakupiippuja"
  );
  await clearAndType(page, "[id='material-costs-row.amount']", "4");
  // Vuokrat
  await clearAndType(
    page,
    "[id='rent-costs-row.description']",
    "Pasikuikan Bajamaja"
  );
  await clearAndType(page, "[id='rent-costs-row.amount']", "14");
  // Palvelut
  await clearAndType(
    page,
    "[id='service-purchase-costs-row.description']",
    "Shampanjan vispaajat"
  );
  await clearAndType(page, "[id='service-purchase-costs-row.amount']", "1000");
  // Matkakustannukset
  await clearAndType(
    page,
    "[id='steamship-costs-row.description']",
    "Apostolin kyyti"
  );
  await clearAndType(page, "[id='steamship-costs-row.amount']", "0");
  // Muut kulut
  await clearAndType(page, "[id='other-costs-row.description']", "Banaani");
  await clearAndType(page, "[id='other-costs-row.amount']", "10");

  await page.waitForFunction(
    () =>
      (
        document.querySelector(
          "#topbar #form-controls button#submit"
        ) as HTMLInputElement
      ).disabled === false
  );
  await clickElement(page, "#topbar #form-controls button#submit");
  const sentText = lang === "fi" ? "Hakemus lähetetty" : "Ansökan sänd";
  await page.waitForFunction(
    (text: string) =>
      (
        document.querySelector(
          "#topbar #form-controls button#submit"
        ) as HTMLInputElement
      ).textContent === text,
    undefined,
    sentText
  );

  return await getHakemusIDFromHakemusTokenURLParameter(page);
}

async function createMuutoshakemusDisabledMenoluokiteltuHaku(
  page: Page,
  registerNumber: string,
  codes: VaCodeValues,
  hakuName?: string
): Promise<{ avustushakuID: number }> {
  return await createHakuWithLomakeJson(
    page,
    muutoshakuDisabledMenoluokiteltuLomakeJson,
    registerNumber,
    codes,
    hakuName
  );
}

export async function createRandomCodeValues(
  page: Page
): Promise<VaCodeValues> {
  const uniqueCode = () => randomString().substring(0, 13);
  const codeValues = {
    operationalUnit: uniqueCode(),
    project: [uniqueCode(), uniqueCode()],
    operation: uniqueCode(),
  };
  return createCodeValues(page, codeValues);
}

export async function createCodeValues(
  page: Page,
  codeValues: VaCodeValues
): Promise<VaCodeValues> {
  await navigate(page, "/admin-ui/va-code-values/");
  await createCode(page, "Toimintayksikkö", codeValues.operationalUnit);
  await clickKoodienhallintaTab(page, "project");

  for (const project of codeValues.project) {
    await createCode(page, "Projekti", project);
  }

  await clickKoodienhallintaTab(page, "operation");
  await createCode(page, "Toiminto", codeValues.operation);
  return codeValues;
}

export async function ratkaiseBudjettimuutoshakemusEnabledAvustushakuWithLumpSumBudget(
  page: Page,
  haku: Haku,
  answers: Answers,
  budget: Budget,
  codes: VaCodeValues
) {
  const { avustushakuID } = await createBudjettimuutoshakemusEnabledHaku(
    page,
    haku.registerNumber,
    codes,
    haku.avustushakuName
  );
  await publishAvustushaku(page, avustushakuID);
  await fillAndSendBudjettimuutoshakemusEnabledHakemus(
    page,
    avustushakuID,
    answers,
    budget
  );
  return await acceptAvustushaku(page, avustushakuID);
}

export async function ratkaiseBudjettimuutoshakemusEnabledAvustushakuButOverwriteMenoluokat(
  page: Page,
  haku: Haku,
  answers: Answers,
  budget: Budget,
  codes: VaCodeValues
) {
  const { avustushakuID } = await createBudjettimuutoshakemusEnabledHaku(
    page,
    haku.registerNumber,
    codes,
    haku.avustushakuName
  );
  await publishAvustushaku(page, avustushakuID);
  const { userKey } = await fillAndSendBudjettimuutoshakemusEnabledHakemus(
    page,
    avustushakuID,
    answers,
    budget
  );
  const { hakemusID } = await acceptAvustushaku(page, avustushakuID, budget);
  return { avustushakuID, hakemusID, userKey };
}

export async function navigateToLatestMuutoshakemus(
  page: Page,
  avustushakuID: number,
  hakemusID: number
) {
  await navigate(
    page,
    `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/muutoshakemukset/`
  );
  await page.waitForSelector("#tab-content");
}

export const linkToMuutoshakemusRegex = /https?:\/\/.*\/muutoshakemus\?.*/;
export async function getLinkToMuutoshakemusFromSentEmails(hakemusID: number) {
  const emails = await waitUntilMinEmails(getMuutoshakemusEmails, 1, hakemusID);

  const linkToMuutoshakemus = emails[0]?.formatted.match(
    linkToMuutoshakemusRegex
  )?.[0];
  expectToBeDefined(linkToMuutoshakemus);
  return linkToMuutoshakemus;
}

export async function fillMuutoshakemusBudgetAmount(
  page: Page,
  budget: BudgetAmount
) {
  await clearAndType(
    page,
    "input[name='talousarvio.personnel-costs-row'][type='number']",
    budget.personnel
  );
  await clearAndType(
    page,
    "input[name='talousarvio.material-costs-row'][type='number']",
    budget.material
  );
  await clearAndType(
    page,
    "input[name='talousarvio.equipment-costs-row'][type='number']",
    budget.equipment
  );
  await clearAndType(
    page,
    "input[name='talousarvio.service-purchase-costs-row'][type='number']",
    budget["service-purchase"]
  );
  await clearAndType(
    page,
    "input[name='talousarvio.rent-costs-row'][type='number']",
    budget.rent
  );
  await clearAndType(
    page,
    "input[name='talousarvio.steamship-costs-row'][type='number']",
    budget.steamship
  );
  await clearAndType(
    page,
    "input[name='talousarvio.other-costs-row'][type='number']",
    budget.other
  );
}

export async function navigateToNthMuutoshakemus(
  page: Page,
  avustushakuID: number,
  hakemusID: number,
  n: number
) {
  await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`);
  await clickElement(page, '[class="muutoshakemus-tab"]');
  await clickElement(page, `.muutoshakemus-tabs button:nth-last-child(${n})`);
  await page.waitForSelector('[data-test-id="muutoshakemus-sisalto"]');
}

export async function setMuutoshakemusJatkoaikaDecision(
  page: Page,
  status: PaatosStatus,
  value?: string
) {
  if (status) {
    await clickElement(
      page,
      `label[for="haen-kayttoajan-pidennysta-${status}"]`
    );
  }
  if (value) {
    await setCalendarDate(page, value);
  }
}

interface FillOpts {
  jatkoaika?: { status: PaatosStatus; value?: string };
  budget?: { status: PaatosStatus; value?: BudgetAmount };
  selectVakioperustelu?: boolean;
}

export async function fillOsiotAndSendMuutoshakemusDecision(
  page: Page,
  opts: FillOpts
) {
  const { jatkoaika, budget, selectVakioperustelu = true } = opts ?? {};
  if (budget?.status) {
    await clickElement(page, `label[for="talousarvio-${budget.status}"]`);
  }
  if (budget?.value) {
    await fillMuutoshakemusBudgetAmount(page, budget.value);
  }
  if (jatkoaika) {
    await setMuutoshakemusJatkoaikaDecision(
      page,
      jatkoaika.status,
      jatkoaika.value
    );
  }
  if (selectVakioperustelu) {
    await selectVakioperusteluInFinnish(page);
  }
  await saveMuutoshakemus(page);
}

export async function fillAndSendBudjettimuutoshakemusEnabledHakemus(
  page: Page,
  avustushakuID: number,
  answers: Answers,
  budget?: Budget,
  beforeSubmitFn?: () => void
): Promise<{ userKey: string }> {
  const lang = answers.lang || "fi";
  await navigateHakija(
    page,
    `/avustushaku/${avustushakuID}/?lang=${lang || "fi"}`
  );

  await page.waitForSelector("#haku-not-open", { hidden: true, timeout: 500 });
  await clearAndType(page, "#primary-email", answers.contactPersonEmail);
  await clickElement(page, "#submit:not([disabled])");

  await navigateToNewHakemusPage(page, avustushakuID);

  async function clickCorrectLanguageSelector() {
    const index = lang && lang === "sv" ? 1 : 0;
    await clickElement(page, `[for='language.radio.${index}']`);
  }

  await clearAndType(page, "#finnish-business-id", TEST_Y_TUNNUS);
  await clickElement(page, "input.get-business-id");
  await clearAndType(page, "#applicant-name", answers.contactPersonName);
  await clearAndType(
    page,
    "[id='textField-0']",
    answers.contactPersonPhoneNumber
  );
  await clearAndType(
    page,
    "[id='signatories-fieldset-1.name']",
    "Erkki Esimerkki"
  );
  await clearAndType(
    page,
    "[id='signatories-fieldset-1.email']",
    "erkki.esimerkki@example.com"
  );
  await clickElementWithText(
    page,
    "label",
    lang === "fi"
      ? "Kunta/kuntayhtymä, kunnan omistamat yhtiöt, kirkko"
      : "Kommun/samkommun, kommunalt ägda bolag, kyrkan"
  );
  await clickElement(page, "[id='koodistoField-1_input']");
  await selectMaakuntaFromDropdown(page, lang === "fi" ? "Kainuu" : "Åland");
  await clearAndType(page, "#bank-iban", "FI95 6682 9530 0087 65");
  await clearAndType(page, "#bank-bic", "OKOYFIHH");
  await clearAndType(page, "#textField-2", "2");
  await clearAndType(page, "#textField-1", "20");
  await clearAndType(page, "#project-name", answers.projectName);
  await clickCorrectLanguageSelector();
  await clickElement(page, "[for='checkboxButton-0.checkbox.0']");
  await clickElementWithText(
    page,
    "label",
    lang === "fi" ? "Opetuksen lisääminen" : "Ordnande av extra undervisning"
  );
  await clearAndType(
    page,
    "[id='project-description.project-description-1.goal']",
    "Jonain päivänä teemme maailman suurimman aallon."
  );
  await clearAndType(
    page,
    "[id='project-description.project-description-1.activity']",
    "Teemme aaltoja joka dailyssa aina kun joku on saanut tehtyä edes jotain."
  );
  await clearAndType(
    page,
    "[id='project-description.project-description-1.result']",
    "Hankkeeseen osallistuneiden hartiat vetreytyvät suunnattomasti."
  );
  await clearAndType(
    page,
    "[id='project-effectiveness']",
    "Käsienheiluttelu kasvaa suhteessa muuhun tekemiseen huomattavasti"
  );
  await clearAndType(page, "[id='project-begin']", "13.03.1992");
  await clearAndType(page, "[id='project-end']", "13.03.2032");
  await clickElement(page, '[for="vat-included.radio.0"]');

  await fillBudget(page, budget, "hakija");

  if (beforeSubmitFn) {
    await beforeSubmitFn();
  }

  await page.waitForFunction(
    () =>
      (
        document.querySelector(
          "#topbar #form-controls button#submit"
        ) as HTMLInputElement
      ).disabled === false
  );
  await clickElement(page, "#topbar #form-controls button#submit");
  const sentText = lang === "fi" ? "Hakemus lähetetty" : "Ansökan sänd";
  await page.waitForFunction(
    (text: string) =>
      (
        document.querySelector(
          "#topbar #form-controls button#submit"
        ) as HTMLInputElement
      ).textContent === text,
    undefined,
    sentText
  );
  const userKey = await expectQueryParameter(page, "hakemus");
  return { userKey };
}
