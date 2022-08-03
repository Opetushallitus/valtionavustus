import * as path from "path";
import * as yup from "yup";
import axios from "axios";
import Puppeteer from "puppeteer";
import {
  Browser,
  ElementHandle,
  Frame,
  Page,
  WaitForOptions,
  WaitForSelectorOptions,
} from "puppeteer";
import * as assert from "assert";
import moment from "moment";
import { VaCodeValues } from "../playwright/utils/types";

const { randomBytes } = require("crypto");

const HAKIJA_HOSTNAME = process.env.HAKIJA_HOSTNAME || "localhost";
const HAKIJA_PORT = 8080;

const VIRKAILIJA_HOSTNAME = process.env.VIRKAILIJA_HOSTNAME || "localhost";
const VIRKAILIJA_PORT = 8081;

export const VIRKAILIJA_URL = `http://${VIRKAILIJA_HOSTNAME}:${VIRKAILIJA_PORT}`;
export const HAKIJA_URL = `http://${HAKIJA_HOSTNAME}:${HAKIJA_PORT}`;

export const dummyPdfPath = path.join(__dirname, "dummy.pdf");
export const dummyExcelPath = path.join(__dirname, "dummy.xls");

export const TEST_Y_TUNNUS = "2050864-5";

export interface Email {
  formatted: string;
  "to-address": string[];
  bcc: string | null;
  subject?: string;
}

const emailSchema = yup
  .array()
  .of(
    yup
      .object()
      .shape<Email>({
        formatted: yup.string().required(),
        "to-address": yup.array().of(yup.string().required()).defined(),
        bcc: yup.string().defined().nullable(),
        subject: yup.string().optional(),
      })
      .required()
  )
  .defined();

export function setPageErrorConsoleLogger(page: Page) {
  if (process.env.NO_BROWSER_LOGGER) {
    return;
  }

  page.on("error", (err) => {
    log("error in page: ", err);
  });

  page.on("pageerror", (pageerr) => {
    log("pageerror: ", pageerr);
  });

  page.on("request", (request) => {
    const url = request.url();
    const isLocalApiRequest =
      (url.includes(VIRKAILIJA_HOSTNAME) || url.includes(HAKIJA_HOSTNAME)) &&
      url.includes("/api/");
    if (!url.startsWith("data:image") && isLocalApiRequest) {
      log(
        `Outgoing API request ${request.method()} ${url}, navigation: ${request.isNavigationRequest()}`
      );
    }
  });

  page.on("framenavigated", (frame) => {
    log(`Navigated to ${frame.url()}`);
  });

  page.on("requestfailed", (request) => {
    log(
      `Request failed to url: ${request.url()},
       errorText: ${request.failure()?.errorText},
       method: ${request.method()}`,
      request
    );
  });
}

export function toInnerText(node: Element) {
  return (node as HTMLElement).innerText;
}

export async function getElementInnerText(
  page: Page | Frame,
  selector: string
): Promise<string | undefined> {
  const element = await page.waitForSelector(selector);
  return await element?.evaluate(toInnerText);
}

export async function getElementAttribute(
  page: Page,
  selector: string,
  attribute: string
) {
  return await page.evaluate(
    (s: string, a: string) =>
      (
        document.querySelector(s) && (document.querySelector(s) as HTMLElement)
      )?.getAttribute(a),
    selector,
    attribute
  );
}

export async function hasElementAttribute(
  page: Page,
  selector: string,
  attribute: string
) {
  return await page.evaluate(
    (s: string, a: string) =>
      (
        document.querySelector(s) && (document.querySelector(s) as HTMLElement)
      )?.hasAttribute(a),
    selector,
    attribute
  );
}

export async function countElements(page: Page, selector: string) {
  return await page.evaluate(
    (selector: string) => document.querySelectorAll(selector).length,
    selector
  );
}

type HakemusTokenAndRegisterNumber = {
  token: string;
  "register-number": string;
};
export async function getHakemusTokenAndRegisterNumber(
  hakemusId: number
): Promise<HakemusTokenAndRegisterNumber> {
  const applicationGeneratedValuesSchema = yup
    .object()
    .required()
    .shape<HakemusTokenAndRegisterNumber>({
      token: yup.string().required(),
      "register-number": yup.string().required(),
    });

  return await axios
    .get(
      `${VIRKAILIJA_URL}/api/test/hakemus/${hakemusId}/token-and-register-number`
    )
    .then((r) => applicationGeneratedValuesSchema.validate(r.data));
}

const getEmails =
  (emailType: string) =>
  (hakemusID: number): Promise<Email[]> =>
    axios
      .get(`${VIRKAILIJA_URL}/api/test/hakemus/${hakemusID}/email/${emailType}`)
      .then((r) => {
        console.log(`getEmails(${emailType})`, r.data);
        return r;
      })
      .then((r) => emailSchema.validate(r.data));

export const getValmistelijaEmails = getEmails(
  "notify-valmistelija-of-new-muutoshakemus"
);
export const getMuutoshakemusPaatosEmails = getEmails("muutoshakemus-paatos");
export const getMuutoshakemusEmails = getEmails("paatos-refuse");
export const getValiselvitysEmails = getEmails("valiselvitys-notification");
export const getAcceptedPäätösEmails = getMuutoshakemusEmails;
export async function waitUntilMinEmails(
  f: (hakemusId: number) => Promise<Email[]>,
  minEmails: number,
  hakemusId: number
) {
  let emails: Email[] = await f(hakemusId);

  while (emails.length < minEmails) {
    await waitFor(1000);
    emails = await f(hakemusId);
  }
  return emails;
}

async function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getNewHakemusEmails(
  avustushakuID: number
): Promise<Email[]> {
  try {
    const emails = await axios.get<Email>(
      `${VIRKAILIJA_URL}/api/test/avustushaku/${avustushakuID}/email/new-hakemus`
    );
    return emailSchema.validate(emails.data);
  } catch (e) {
    log(`Failed to get emails for avustushaku ${avustushakuID}`, e);
    throw e;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollUntilNewHakemusEmailArrives(
  avustushakuID: number
): Promise<Email[]> {
  while (true) {
    try {
      const emails = await getNewHakemusEmails(avustushakuID);
      if (emails.length > 0) {
        log(`Received emails`, JSON.stringify(emails, null, 2));
        return emails;
      } else {
        log("No emails received");
        await sleep(1000);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log(`Failed to get hakemus emails: ${e.message}`);
      } else {
        console.log(`Unknown error: ${e}`);
      }
    }
  }
}

export function mkBrowser() {
  const headless = process.env["HEADLESS"] === "true";
  return Puppeteer.launch({
    args: headless ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
    slowMo: 0,
    headless: headless,
    timeout: 10_000,
    defaultViewport: { width: 1920, height: 1080 },
  });
}
declare global {
  namespace NodeJS {
    interface Global {
      puppeteerPage?: Page;
    }
  }
}
export const getFirstPage = async (browser: Browser) => {
  const firstPage: Page = await browser.pages().then((pages) => pages[0]);
  // @ts-ignore
  global.puppeteerPage = firstPage;
  return firstPage;
};

export async function navigateToHaunTiedot(page: Page, avustushakuId: number) {
  await page.goto(
    `${VIRKAILIJA_URL}/admin/haku-editor/?avustushaku=${avustushakuId}`,
    { waitUntil: "networkidle0" }
  );
}

export async function navigate(
  page: Page,
  path: string,
  waitForOptions?: WaitForOptions
) {
  await page.goto(
    `${VIRKAILIJA_URL}${path}`,
    waitForOptions ?? { waitUntil: "networkidle0" }
  );
}

export async function navigateHakija(page: Page, path: string) {
  await page.goto(`${HAKIJA_URL}${path}`, { waitUntil: "networkidle0" });
}

export async function navigateToHakemuksenArviointi(
  page: Page,
  avustushakuID: number,
  hakijaName: string
): Promise<{ hakemusID: number }> {
  await navigate(page, `/avustushaku/${avustushakuID}/`);
  await Promise.all([
    page.waitForNavigation(),
    clickElementWithText(page, "td", hakijaName),
  ]);

  const hakemusID = await page
    .evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)?.[1])
    .then((assumedHakemusID) => {
      expectToBeDefined(assumedHakemusID);
      return parseInt(assumedHakemusID);
    });

  return { hakemusID };
}

export async function navigateToPaatos(page: Page, hakemusID: number) {
  const emails = await waitUntilMinEmails(
    getAcceptedPäätösEmails,
    1,
    hakemusID
  );
  const linkToPaatos = emails[0]?.formatted.match(
    /https?:\/\/.*\/paatos\/.*/
  )?.[0];
  if (linkToPaatos) {
    await page.goto(linkToPaatos, { waitUntil: "networkidle0" });
  } else {
    throw new Error("did not find link to päätös");
  }
}

export interface MailWithLinks extends Email {
  title: string | undefined;
  linkToMuutoshakemusPaatos: string | undefined;
  linkToMuutoshakemus: string | undefined;
}

export async function createValidCopyOfEsimerkkihakuAndReturnTheNewId(
  page: Page,
  registerNumber: string,
  hakuName?: string,
  vaCodes?: VaCodeValues
): Promise<number> {
  return await createHakuFromEsimerkkihaku(page, {
    name: hakuName,
    registerNumber: registerNumber,
    vaCodes: vaCodes,
  });
}

interface HakuProps {
  name?: string;
  registerNumber: string;
  hakuaikaStart?: string;
  hakuaikaEnd?: string;
  hankkeenAlkamispaiva?: string;
  hankkeenPaattymispaiva?: string;
  vaCodes?: VaCodeValues;
}

export { VaCodeValues };

type Rahoitusalue = {
  koulutusaste: string;
  talousarviotili: string;
};

const defaultRahoitusalueet: Rahoitusalue[] = [
  {
    koulutusaste: "Ammatillinen koulutus",
    talousarviotili: "29.10.30.20",
  },
];

export async function createHakuFromEsimerkkihaku(
  page: Page,
  props: HakuProps
): Promise<number> {
  const {
    name,
    registerNumber,
    hakuaikaStart,
    hakuaikaEnd,
    hankkeenAlkamispaiva,
    hankkeenPaattymispaiva,
  } = props;
  const avustushakuName = name || mkAvustushakuName();
  console.log(`Avustushaku name for test: ${avustushakuName}`);

  await copyEsimerkkihaku(page);

  const avustushakuID = parseInt(
    await expectQueryParameter(page, "avustushaku")
  );
  console.log(`Avustushaku ID: ${avustushakuID}`);

  await clearAndType(
    page,
    "#register-number",
    registerNumber || randomAsiatunnus()
  );
  await clearAndType(page, "#haku-name-fi", avustushakuName);
  await clearAndType(page, "#haku-name-sv", avustushakuName + " på svenska");

  if (props.vaCodes) {
    await selectCode(page, "operational-unit", props.vaCodes.operationalUnit);
    await selectProject(page, props.vaCodes.project);
    await selectCode(page, "operation", props.vaCodes.operation);
  }

  for (const rahoitusalue of defaultRahoitusalueet) {
    await inputTalousarviotili(page, rahoitusalue);
  }

  await selectTositelaji(page, "XE");
  await clearAndType(page, "#hakuaika-start", hakuaikaStart || "1.1.1970 0.00");
  const nextYear = new Date().getFullYear() + 1;
  await clearAndType(
    page,
    "#hakuaika-end",
    hakuaikaEnd || `31.12.${nextYear} 23.59`
  );

  await clickElement(page, '[data-test-id="päätös-välilehti"]');
  await setCalendarDateForSelector(
    page,
    hankkeenAlkamispaiva || "20.04.1969",
    '[data-test-id="hankkeen-alkamispaiva"] div.datepicker input'
  );
  await setCalendarDateForSelector(
    page,
    hankkeenPaattymispaiva || "20.04.4200",
    '[data-test-id="hankkeen-paattymispaiva"] div.datepicker input'
  );

  await waitForSaveStatusOk(page);

  return avustushakuID;
}

async function inputTalousarviotili(
  page: Page,
  { koulutusaste, talousarviotili }: Rahoitusalue
): Promise<void> {
  await clearAndType(
    page,
    `input[name="education-levels"][data-title="${koulutusaste}"]`,
    talousarviotili
  );
}

async function selectTositelaji(page: Page, value: "XE" | "XB"): Promise<void> {
  await page.waitForSelector("select#document-type", { visible: true });
  await page.select("select#document-type", value);
}

export async function publishAvustushaku(page: Page, avustushakuId: number) {
  await navigateToHaunTiedot(page, avustushakuId);
  await clickElement(page, "label[for='set-status-published']");
  await waitForSaveStatusOk(page);
}

export async function fillAndSendHakemus(
  page: Page,
  avustushakuID: number,
  beforeSubmitFn?: () => void
) {
  await navigateHakija(page, `/avustushaku/${avustushakuID}/`);

  await page.waitForSelector("#haku-not-open", { hidden: true, timeout: 500 });
  await clearAndType(page, "#primary-email", "erkki.esimerkki@example.com");
  await clickElement(page, "#submit:not([disabled])");

  await navigateToNewHakemusPage(page, avustushakuID);

  await clearAndType(page, "#finnish-business-id", TEST_Y_TUNNUS);
  await clickElement(page, "input.get-business-id");

  await clearAndType(page, "#applicant-name", "Erkki Esimerkki");
  await clearAndType(page, "#signature", "Erkki Esimerkki");
  await clearAndType(page, "#signature-email", "erkki.esimerkki@example.com");
  await clearAndType(page, "#bank-iban", "FI95 6682 9530 0087 65");
  await clearAndType(page, "#bank-bic", "OKOYFIHH");
  await clickElementWithText(page, "label", "Kansanopisto");

  await clearAndType(page, "[name='project-costs-row.amount']", "100000");
  await uploadFile(
    page,
    "[name='previous-income-statement-and-balance-sheet']",
    dummyPdfPath
  );
  await uploadFile(
    page,
    "[name='previous-financial-year-report']",
    dummyPdfPath
  );
  await uploadFile(
    page,
    "[name='previous-financial-year-auditor-report']",
    dummyPdfPath
  );
  await uploadFile(
    page,
    "[name='current-year-plan-for-action-and-budget']",
    dummyPdfPath
  );
  await uploadFile(
    page,
    "[name='description-of-functional-development-during-last-five-years']",
    dummyPdfPath
  );
  await uploadFile(page, "[name='financial-information-form']", dummyPdfPath);

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
  await page.waitForFunction(
    () =>
      (
        document.querySelector(
          "#topbar #form-controls button#submit"
        ) as HTMLInputElement
      ).textContent === "Hakemus lähetetty"
  );
}

function getHakemusUrlFromEmail(email: Email) {
  return (
    email.formatted.match(/https?:\/\/.*\/avustushaku.*/)?.[0] ||
    email.formatted.match(/https?:\/\/.*\/statsunderstod.*/)?.[0]
  );
}

export async function navigateToNewHakemusPage(
  page: Page,
  avustushakuID: number
) {
  const receivedEmail = await pollUntilNewHakemusEmailArrives(avustushakuID);
  const hakemusUrl = getHakemusUrlFromEmail(receivedEmail[0]);
  expectToBeDefined(hakemusUrl);

  await page.goto(hakemusUrl, { waitUntil: "networkidle0" });
}

export function createRandomHakuValues(name: string = "Muutospäätösprosessi") {
  return {
    registerNumber: randomAsiatunnus(),
    avustushakuName: `Testiavustushaku (${name}) ${randomString()} - ${moment(
      new Date()
    ).format("YYYY-MM-DD hh:mm:ss:SSSS")}`,
  };
}

export const defaultBudget = {
  amount: {
    personnel: "200000",
    material: "3000",
    equipment: "10000",
    "service-purchase": "100",
    rent: "161616",
    steamship: "100",
    other: "100000",
  },
  description: {
    personnel: "Tarvitsemme ihmisiä aaltoihin.",
    material: "Jari Sarasvuon aalto-VHS-kasetteja.",
    equipment: "Hankimme aaltokoneen toimistolle.",
    "service-purchase": "Ostamme alihankkijoita jatkamaan aaltojamme.",
    rent: "Vuokraamme Aalto-yliopistolta seminaaritiloja.",
    steamship: "Taksikyydit Otaniemeen.",
    other: "Vähän ylimääräistä pahan päivän varalle.",
  },
  selfFinancing: "1",
};

export type BudgetAmount = typeof defaultBudget.amount;
export type Budget = {
  amount: BudgetAmount;
  description: { [k in keyof BudgetAmount]: string };
  selfFinancing: string;
};

export async function fillBudget(
  page: Page,
  budget: Budget = defaultBudget,
  type: "hakija" | "virkailija"
) {
  const prefix = type === "virkailija" ? "budget-edit-" : "";

  await clearAndType(
    page,
    `[id='${prefix}personnel-costs-row.description']`,
    budget.description.personnel
  );
  await clearAndType(
    page,
    `[id='${prefix}personnel-costs-row.amount']`,
    budget.amount.personnel
  );
  await clearAndType(
    page,
    `[id='${prefix}material-costs-row.description']`,
    budget.description.material
  );
  await clearAndType(
    page,
    `[id='${prefix}material-costs-row.amount']`,
    budget.amount.material
  );
  await clearAndType(
    page,
    `[id='${prefix}equipment-costs-row.description']`,
    budget.description.equipment
  );
  await clearAndType(
    page,
    `[id='${prefix}equipment-costs-row.amount']`,
    budget.amount.equipment
  );
  await clearAndType(
    page,
    `[id='${prefix}service-purchase-costs-row.description']`,
    budget.description["service-purchase"]
  );
  await clearAndType(
    page,
    `[id='${prefix}service-purchase-costs-row.amount']`,
    budget.amount["service-purchase"]
  );
  await clearAndType(
    page,
    `[id='${prefix}rent-costs-row.description']`,
    budget.description.rent
  );
  await clearAndType(
    page,
    `[id='${prefix}rent-costs-row.amount']`,
    budget.amount.rent
  );
  await clearAndType(
    page,
    `[id='${prefix}steamship-costs-row.description']`,
    budget.description.steamship
  );
  await clearAndType(
    page,
    `[id='${prefix}steamship-costs-row.amount']`,
    budget.amount.steamship
  );
  await clearAndType(
    page,
    `[id='${prefix}other-costs-row.description']`,
    budget.description.other
  );
  await clearAndType(
    page,
    `[id='${prefix}other-costs-row.amount']`,
    budget.amount.other
  );

  if (type === "hakija") {
    await clearAndType(
      page,
      `[id='${prefix}self-financing-amount']`,
      budget.selfFinancing
    );
  }
}

export async function expectQueryParameter(
  page: Page,
  paramName: string
): Promise<string> {
  const value = await page.evaluate(
    (param) => new URLSearchParams(window.location.search).get(param),
    paramName
  );
  if (!value)
    throw Error(
      `Expected page url '${page.url()}' to have query parameter '${paramName}'`
    );
  return value;
}

export async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
) {
  const element = await page.$(selector);
  await element?.uploadFile(filePath);
}

export async function closeAvustushakuByChangingEndDateToPast(
  page: Page,
  avustushakuID: number
) {
  await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`);
  const previousYear = new Date().getFullYear() - 1;
  await clearAndType(page, "#hakuaika-end", `1.1.${previousYear} 0.00`);
  await waitForSaveStatusOk(page);
}

export function mkAvustushakuName() {
  return "Testiavustushaku " + randomString();
}

export function randomAsiatunnus(): string {
  return `${randomInt(1, 99999)}/${randomInt(10, 999999)}`;
}

function randomInt(min: number, max: number): number {
  return min + Math.ceil(Math.random() * (max - min));
}

export function randomString(): string {
  return randomBytes(8).toString("hex");
}

export function log(...args: any[]) {
  console.log(moment().format("YYYY-MM-DD HH:mm:ss.SSSS"), ...args);
}

export function expectToBeDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    expect(val).toBeDefined();
  }
}

export async function waitForSaveStatusOk(page: Page) {
  return page.waitForFunction(
    () =>
      document.querySelector('[data-test-id="save-status"]')?.textContent ===
      "Kaikki tiedot tallennettu"
  );
}

async function waitForSaveStatusOkOrSaving(page: Page) {
  return page.waitForFunction(
    () =>
      document.querySelector('[data-test-id="save-status"]')?.textContent ===
        "Kaikki tiedot tallennettu" ||
      document.querySelector('[data-test-id="save-status"]')?.textContent ===
        "Tallennetaan"
  );
}

export async function copyEsimerkkihaku(page: Page) {
  await navigate(page, "/admin/haku-editor/");
  const element = (await clickElementWithText(
    page,
    "td",
    "Yleisavustus - esimerkkihaku"
  )) as ElementHandle;
  const currentHakuTitle = (await (
    await element.getProperty("textContent")
  )?.jsonValue()) as string;
  await clickElementWithText(page, "a", "Kopioi uuden pohjaksi");

  await page.waitForFunction(
    (name: string) =>
      document.querySelector("#haku-name-fi")?.textContent !== name,
    {},
    currentHakuTitle
  );
  await page.waitForTimeout(2000);
}

const CLICK_RETRIES = 5;
export async function clickElement(page: Page, selector: string) {
  await page.waitForSelector(selector, { visible: true, timeout: 5000 });

  for (let i = 0; i <= CLICK_RETRIES; i++) {
    try {
      await page.click(selector);
      break;
    } catch (e) {
      // Sometimes nodes get removed, especially in the Reagent app
      if (
        (e instanceof Error &&
          e.message !== "Node is detached from document") ||
        i === CLICK_RETRIES
      ) {
        throw e;
      }
    }
  }
}

export async function clickElementWithText(
  page: Page,
  elementType: string,
  text: string,
  scrollVisibleBeforeClick = false
) {
  const element = await waitForElementWithText(page, elementType, text, {
    visible: true,
  });
  assert.ok(
    element,
    `Could not find ${elementType} element with text '${text}'`
  );
  if (scrollVisibleBeforeClick) {
    await element?.evaluate((e) => e.scrollIntoView({ block: "end" }));
  }
  await element?.click();
  return element;
}

export async function selectMaakuntaFromDropdown(page: Page, text: string) {
  const maakuntaInputSelector =
    "#koodistoField-1_input .rw-dropdown-list-input";
  await clickElement(page, maakuntaInputSelector);
  await page.type(maakuntaInputSelector, text);
  await clickDropdownElementWithText(page, text);
}

export async function clickDropdownElementWithText(page: Page, text: string) {
  const element = await waitForDropdownElementWithText(page, text);
  assert.ok(element, `Could not find dropdown element with text '${text}'`);
  await element?.click();
  return element;
}

export async function waitForElementWithText(
  page: Page,
  elementType: string,
  text: string,
  waitForSelectorOptions: WaitForSelectorOptions = { visible: true }
) {
  return await page.waitForXPath(
    `//${elementType}[contains(., '${text}')]`,
    waitForSelectorOptions
  );
}

export async function waitForDropdownElementWithText(page: Page, text: string) {
  return waitForElementWithAttribute(page, "role", "option", text);
}

async function waitForElementWithAttribute(
  page: Page,
  attribute: string,
  attributeValue: string,
  text: string,
  waitForSelectorOptions: WaitForSelectorOptions = { visible: true }
) {
  return await page.waitForXPath(
    `//*[@${attribute}='${attributeValue}'][contains(., '${text}')]`,
    waitForSelectorOptions
  );
}

export async function isElementActive(
  page: Page,
  elem: ElementHandle<Element>
): Promise<boolean> {
  return page.evaluate(
    (expectedElement) => expectedElement === document.activeElement,
    elem
  );
}

export async function clearAndType(
  page: Page,
  selector: string,
  text: string,
  opts?: { scrollIntoView?: boolean; checkElementIsActive?: boolean }
) {
  const element = await page.waitForSelector(selector, {
    visible: true,
    timeout: 5 * 1000,
  });
  if (!element)
    throw new Error(
      "The world is broken because visible: true should never return null"
    );
  const { scrollIntoView = true, checkElementIsActive = false } = opts ?? {};
  if (scrollIntoView) {
    await element.evaluate((e) => e.scrollIntoView({ block: "end" }));
  }
  await element.click();
  if (checkElementIsActive && !(await isElementActive(page, element))) {
    throw new Error(
      `clearAndType: element ${selector} is not the active element after clicking. Is something covering the element?`
    );
  }
  await page.$eval(selector, (el) => {
    // @ts-ignore
    el.value = "";
  });
  await element.type(text);
  await page.evaluate((e) => e.blur(), element);
}

export async function waitForArvioSave(
  page: Page,
  avustushakuID: number,
  hakemusID: number
) {
  await page.waitForResponse(
    `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio`
  );
}

export async function resolveAvustushaku(page: Page, avustushakuID: number) {
  await navigateToHaunTiedot(page, avustushakuID);
  const isResolved = await page.$('[id="set-status-resolved"][checked]');
  if (!isResolved) {
    await clickElement(page, "label[for='set-status-resolved']");
    await waitForSaveStatusOk(page);
  }
}

export async function sendPäätös(page: Page, avustushakuID: number) {
  await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`);
  await clickElementWithText(page, "button", "Lähetä 1 päätöstä");

  await Promise.all([
    page.waitForResponse(
      `${VIRKAILIJA_URL}/api/paatos/sendall/${avustushakuID}`
    ),
    clickElementWithText(page, "button", "Vahvista lähetys"),
  ]);
}

export async function textContent(page: Page, selector: string) {
  const element = await page.waitForSelector(selector, { visible: true });
  return await page.evaluate((_) => _.textContent, element);
}

async function prepareSelectingValmistelijaForHakemus(
  page: Page,
  avustushakuID: number,
  hakemusID: number,
  valmistelijaName: string
) {
  await navigate(page, `/avustushaku/${avustushakuID}/`);
  await clickElement(
    page,
    `[data-test-id="hakemus-${hakemusID}"] [aria-label="Lisää valmistelija hakemukselle"]`
  );

  const xpath = `//tr[contains(@class, 'selected')]//button[@aria-label="Lisää ${valmistelijaName} valmistelijaksi"]`;
  const valmistelijaButton = await page.waitForXPath(xpath, { visible: true });
  if (!valmistelijaButton) {
    throw new Error(`Valmistelija button not found with XPath: ${xpath}`);
  }
  return valmistelijaButton;
}

export async function selectValmistelijaForHakemus(
  page: Page,
  avustushakuID: number,
  hakemusID: number,
  valmistelijaName: string
) {
  const valmistelijaButton = await prepareSelectingValmistelijaForHakemus(
    page,
    avustushakuID,
    hakemusID,
    valmistelijaName
  );

  const valmistelijaButtonClass = (await (
    await valmistelijaButton.getProperty("className")
  )?.jsonValue()) as string;

  if (!valmistelijaButtonClass.includes("selected")) {
    await Promise.all([
      page.waitForResponse(
        `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio`
      ),
      valmistelijaButton.click(),
    ]);
  }
}

export async function addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel(
  page: Page,
  fieldType: string
) {
  const fieldId = "fieldId" + randomString();
  return addFieldToFormAndReturnElementIdAndLabel(page, fieldId, fieldType);
}

export async function addFieldToFormAndReturnElementIdAndLabel(
  page: Page,
  fieldId: string,
  fieldType: string
) {
  const fields = [{ fieldId: fieldId, fieldType: fieldType }];
  const augmentedFields = await addFieldsToFormAndReturnElementIdsAndLabels(
    page,
    fields
  );
  return augmentedFields[0];
}

interface Field {
  fieldId: string;
  fieldType: string;
}

async function addFieldsToFormAndReturnElementIdsAndLabels(
  page: Page,
  fields: Field[]
) {
  await clickElementWithText(page, "span", "Hakulomake");
  const jsonString = await textContent(page, ".form-json-editor textarea");
  const json = JSON.parse(jsonString);
  const content = json.content;

  const fieldsWithIdAndLabel = fields.map(({ fieldId, fieldType }) => ({
    fieldType: fieldType,
    fieldId: fieldId,
    fieldLabel: "fieldLabel" + randomString(),
  }));

  const fieldsJson = fieldsWithIdAndLabel.map(
    ({ fieldType, fieldId, fieldLabel }) =>
      fieldJson(fieldType, fieldId, fieldLabel)
  );
  const newJson = JSON.stringify(
    Object.assign({}, json, { content: content.concat(fieldsJson) })
  );
  await clearAndSet(page, ".form-json-editor textarea", newJson);

  await clickFormSaveAndWait(page);

  return fieldsWithIdAndLabel;
}

function fieldJson(type: string, id: string, label: string) {
  return {
    fieldClass: "wrapperElement",
    id: id + "wrapper",
    fieldType: "theme",
    children: [
      {
        label: {
          fi: label + "fi",
          sv: label + "sv",
        },
        fieldClass: "formField",
        helpText: {
          fi: "helpText fi",
          sv: "helpText sv",
        },
        id: id,
        params: {
          size: "small",
          maxlength: 1000,
        },
        required: true,
        fieldType: type,
      },
    ],
  };
}

export async function clearAndSet(page: Page, selector: string, text: string) {
  const element = await page.waitForSelector(selector, {
    visible: true,
    timeout: 5 * 1000,
  });
  await page.evaluate((e, t) => (e.value = t), element, text);
  await page.focus(selector);
  await page.keyboard.type(" ");
  await page.keyboard.press("Backspace");
}

export async function clickFormSaveAndWait(page: Page) {
  await Promise.all([
    waitForSaveStatusOkOrSaving(page),
    clickElement(page, "#saveForm:not(disabled)"),
  ]);
  await waitForSaveStatusOk(page);
}

export async function typeValueInFieldAndExpectValidationError(
  page: Page,
  fieldId: string,
  value: string,
  fieldLabel: string,
  errorMessage: string
) {
  const selector = "#" + fieldId;
  const errorSummarySelector = "a.validation-errors-summary";
  await clearAndType(page, selector, value);
  await page.waitForSelector(errorSummarySelector, { visible: true });
  assert.equal(
    await textContent(page, errorSummarySelector),
    "1 vastauksessa puutteita"
  );
  await clickElement(page, errorSummarySelector);
  assert.equal(
    await textContent(page, ".validation-errors"),
    fieldLabel + errorMessage
  );
  await page.waitForSelector("#submit:disabled");
}

export async function typeValueInFieldAndExpectNoValidationError(
  page: Page,
  fieldId: string,
  value: string
) {
  const selector = "#" + fieldId;
  const errorSummarySelector = "a.validation-errors-summary";
  await clearAndType(page, selector, value);
  await page.waitForFunction(
    (s: string) => document.querySelector(s) == null,
    {},
    errorSummarySelector
  );
  await page.waitForSelector("#submit:enabled");
}

export async function getHakemusIDFromHakemusTokenURLParameter(
  page: Page
): Promise<number> {
  const token = await expectQueryParameter(page, "hakemus");
  const url = `${VIRKAILIJA_URL}/api/v2/external/hakemus/id/${token}`;
  return await axios.get(url).then((r) => r.data.id);
}

export async function fillAndSendHakemusAndReturnHakemusId(
  page: Page,
  avustushakuID: number,
  beforeSubmitFn?: () => void
) {
  let hakemusID;

  async function fn() {
    hakemusID = await getHakemusIDFromHakemusTokenURLParameter(page);

    if (beforeSubmitFn) await beforeSubmitFn();
  }

  await fillAndSendHakemus(page, avustushakuID, fn);

  expectToBeDefined(hakemusID);
  return parseInt(hakemusID);
}

export async function navigateToHakemus(
  page: Page,
  avustushakuID: number,
  hakemusID: number
) {
  await navigate(page, `/avustushaku/${avustushakuID}/`);
  await Promise.all([
    page.waitForNavigation(),
    clickElement(page, `[data-test-id="hakemus-${hakemusID}"]`),
  ]);
}

export async function acceptHakemus(
  page: Page,
  avustushakuID: number,
  hakemusID: number,
  beforeSubmitFn: () => {}
) {
  await navigate(page, `/avustushaku/${avustushakuID}/`);
  await Promise.all([
    page.waitForNavigation(),
    clickElementWithText(page, "td", "Akaan kaupunki"),
  ]);

  await clickElement(
    page,
    "#arviointi-tab label[for='set-arvio-status-plausible']"
  );
  await clearAndType(
    page,
    "#budget-edit-project-budget .amount-column input",
    "100000"
  );
  await clickElement(
    page,
    "#arviointi-tab label[for='set-arvio-status-accepted']"
  );
  await waitForArvioSave(page, avustushakuID, hakemusID);
  await beforeSubmitFn();
  await resolveAvustushaku(page, avustushakuID);
}

export async function clickElementWithTestId(page: Page, testId: string) {
  await clickElement(page, `[data-test-id='${testId}']`);
}

export async function waitForElementWIthTestId(
  page: Page,
  testId: string
): Promise<ElementHandle | null> {
  return await page.waitForSelector(`[data-test-id='${testId}']`, {
    visible: true,
    timeout: 5 * 1000,
  });
}

export async function expectedResponseFromExternalAPIhakemuksetForAvustushaku(
  avustushakuID: number,
  hakemusID: number,
  valueForNutshellField: string
) {
  return [
    {
      "project-name": "",
      "project-begin": null,
      "organization-name": "Akaan kaupunki",
      "grant-id": avustushakuID,
      partners: null,
      "costs-granted": 100000,
      "user-last-name": null,
      language: "fi",
      id: hakemusID,
      nutshell: valueForNutshellField,
      "user-first-name": null,
      "budget-granted": 100000,
      "project-end": null,
    },
  ];
}

export async function actualResponseFromExternalAPIhakemuksetForAvustushaku(
  avustushakuID: number
) {
  const url = `${VIRKAILIJA_URL}/api/v2/external/avustushaku/${avustushakuID}/hakemukset`;
  return await axios.get(url).then((r) => r.data);
}

export async function createCode(
  page: Page,
  name: string = "Test code",
  code: string
) {
  await clearAndType(page, "[data-test-id=code-form__year]", "2020");
  await clearAndType(page, "[data-test-id=code-form__code]", `${code}`);
  await clearAndType(page, "[data-test-id=code-form__name]", `${name} ${code}`);
  await clickElementWithTestId(page, "code-form__add-button");
  await page.waitForNetworkIdle();
  await page.waitForSelector(
    `tr[data-test-id="code-cell-2020-${code}-${name} ${code}"]`
  );
  return { code, name, year: "2020" };
}

async function selectProject(page: Page, code: string) {
  await page.click(`.projekti-valitsin input`);
  await page.click(`[data-test-id='${code}']`);
}

async function selectCode(
  page: Page,
  codeType: "operational-unit" | "project" | "operation",
  code: string
): Promise<void> {
  await clearAndType(
    page,
    `[data-test-id=code-value-dropdown__${codeType}] > div`,
    code
  );
  await clickElementWithTestId(page, code);
}

export interface CodeInfo {
  name: string;
  code: string;
  year: string;
}

export async function assertCodeIsVisible(
  page: Page,
  codeInfo: CodeInfo,
  visibility: boolean
) {
  const hideClass = visibility ? "" : ".code-cell__hidden";
  await page.waitForSelector(
    `tr[data-test-id="code-cell-${codeInfo.year}-${codeInfo.code}-${codeInfo.name} ${codeInfo.code}"] ${hideClass}`
  );
}

export interface PaatosValues {
  status: "accepted" | "rejected" | "accepted_with_changes";
}

export async function setCalendarDate(page: Page, jatkoaika: string) {
  return await setCalendarDateForSelector(
    page,
    jatkoaika,
    "div.datepicker input"
  );
}

export async function setCalendarDateForSelector(
  page: Page,
  date: string,
  selector: string
) {
  await clearAndType(page, selector, date, { checkElementIsActive: true });
}

export async function navigateToSeurantaTab(
  page: Page,
  avustushakuID: number,
  hakemusID: number
) {
  await navigate(
    page,
    `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/seuranta/`
  );
  await page.waitForSelector("#set-allow-visibility-in-external-system", {
    visible: true,
  });
}

export async function saveMuutoshakemus(page: Page) {
  await clickElement(
    page,
    '[data-test-id="muutoshakemus-submit"]:not([disabled])'
  );
  await page.waitForSelector('[data-test-id="muutoshakemus-paatos"]');
}

export async function selectVakioperusteluInFinnish(page: Page): Promise<void> {
  await clickElementWithText(page, "a", "Lisää vakioperustelu suomeksi", true);
}

export async function typePerustelu(page: Page, perustelu: string) {
  await clearAndType(page, "#reason", perustelu);
}

type AcceptedBudget = string | Budget;

async function acceptBudget(page: Page, budget: AcceptedBudget) {
  if (typeof budget === "string") {
    await clearAndType(
      page,
      "#budget-edit-project-budget .amount-column input",
      budget
    );
  } else {
    await clickElement(page, 'label[for="useDetailedCosts-true"]');
    await fillBudget(page, budget, "virkailija");
  }
}

export async function acceptAvustushaku(
  page: Page,
  avustushakuID: number,
  budget: AcceptedBudget = "100000",
  rahoitusalue?: string
): Promise<{ avustushakuID: number; hakemusID: number }> {
  await closeAvustushakuByChangingEndDateToPast(page, avustushakuID);

  // Accept the hakemus
  await navigate(page, `/avustushaku/${avustushakuID}/`);
  await Promise.all([
    page.waitForNavigation(),
    clickElementWithText(page, "td", "Akaan kaupunki"),
  ]);

  const hakemusID = await page
    .evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)?.[1])
    .then((possibleHakemusID) => {
      expectToBeDefined(possibleHakemusID);
      return parseInt(possibleHakemusID);
    });

  expectToBeDefined(hakemusID);
  console.log("Hakemus ID:", hakemusID);

  if (rahoitusalue) {
    await waitForElementWithText(page, "label", rahoitusalue);
    const [button] = await page.$x(`//label[contains(., '${rahoitusalue}')]`);
    await button.click();
  }

  await clickElement(
    page,
    "#arviointi-tab label[for='set-arvio-status-plausible']"
  );
  await acceptBudget(page, budget);
  await clickElement(
    page,
    "#arviointi-tab label[for='set-arvio-status-accepted']"
  );
  await waitForArvioSave(page, avustushakuID, hakemusID);

  await resolveAvustushaku(page, avustushakuID);

  await selectValmistelijaForHakemus(
    page,
    avustushakuID,
    hakemusID,
    "_ valtionavustus"
  );

  await sendPäätös(page, avustushakuID);
  const tapahtumaloki = await page.waitForSelector(".tapahtumaloki");
  const logEntryCount = await tapahtumaloki?.evaluate(
    (e) => e.querySelectorAll(".entry").length
  );
  expect(logEntryCount).toEqual(1);
  return { avustushakuID, hakemusID };
}

export function lastOrFail<T>(xs: ReadonlyArray<T>): T {
  if (xs.length === 0) throw Error("Can't get last element of empty list");
  return xs[xs.length - 1];
}

export function setupTestLogging() {
  beforeEach(() => {
    log(`Starting test: ${expect.getState().currentTestName}`);
  });
}
