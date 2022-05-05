import { APIRequestContext, expect } from "@playwright/test";

import moment from "moment";
import { loppuselvitysTest as test } from "../../fixtures/loppuselvitysTest";

import { VIRKAILIJA_URL } from "../../utils/constants";

import { navigate } from "../../utils/navigate";

import {
  switchUserIdentityTo,
  clickElementWithText,
  waitForElementWithText,
  waitForNewTab,
  countElements,
  clearAndType,
} from "../../utils/util";

import {
  getAllEmails,
  getHakemusTokenAndRegisterNumber,
  getLoppuselvitysSubmittedNotificationEmails,
  lastOrFail,
} from "../../utils/emails";

import { LoppuselvitysPage } from "../../pages/loppuselvitysPage";
import { HakijaSelvitysPage } from "../../pages/hakijaSelvitysPage";
import {HakemustenArviointiPage} from "../../pages/hakemustenArviointiPage";

test.setTimeout(400000);

const sendLoppuselvitysAsiatarkastamattaNotifications = (
  request: APIRequestContext
) =>
  request.post(
    `${VIRKAILIJA_URL}/api/test/send-loppuselvitys-asiatarkastamatta-notifications`
  );

test("Loppuselvitys tab in hakemuksen arviointi should have link to correct loppuselvitys form for the hakemus", async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
}) => {
  const loppuselvitysPage = LoppuselvitysPage(page);

  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  const [loppuselvitysFormPage] = await Promise.all([
    waitForNewTab(page),
    clickElementWithText(page, "a", "Linkki lomakkeelle"),
  ]);
  await loppuselvitysFormPage.waitForNavigation();

  await waitForElementWithText(loppuselvitysFormPage, "h1", "Loppuselvitys");
  await waitForElementWithText(
    loppuselvitysFormPage,
    "button",
    "Lähetä käsiteltäväksi"
  );

  await loppuselvitysFormPage.close();
});

test("loppuselvitys submitted notification is sent", async ({
  page,
  acceptedHakemus: { hakemusID },
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
}) => {
  expect(loppuselvitysFormFilled);
  const email = lastOrFail(
    await getLoppuselvitysSubmittedNotificationEmails(hakemusID)
  );
  expect(email["to-address"]).toEqual(["erkki.esimerkki@example.com"]);
  expect(email.subject).toEqual("Loppuselvityksenne on vastaanotettu");
  const { "register-number": registerNumber } =
    await getHakemusTokenAndRegisterNumber(hakemusID);
  expect(email.formatted).toContain(`Hyvä vastaanottaja,

olemme vastaanottaneet loppuselvityksenne.

Rahassa kylpijät Ky Ay Oy
${registerNumber}
`);
  expect(email.formatted).toContain(`
Hakija voi muokata jo lähetettyä loppuselvitystä oheisen linkin kautta selvityksen määräaikaan saakka. Tällöin selvitystä ei kuitenkaan enää lähetetä uudelleen käsiteltäväksi, vaan muokkausten tallentuminen varmistetaan hakulomakkeen yläreunan lokitietokentästä.

Lisätietoja saatte tarvittaessa avustuspäätöksessä mainitulta lisätietojen antajalta. Teknisissä ongelmissa auttaa: valtionavustukset@oph.fi

Kun selvitys on käsitelty, ilmoitetaan siitä sähköpostitse avustuksen saajan viralliseen sähköpostiosoitteeseen sekä yhteyshenkilölle.`);

  const previewUrl = email.formatted.match(/(https?:\/\/\S+)/gi)?.[0];
  if (!previewUrl) {
    throw new Error("No preview url found");
  }

  await page.goto(previewUrl);
  expect(page.locator("div.soresu-preview > h1")).toContainText(
    "loppuselvitys submitted notification is sent"
  );
  expect(page.locator("#textArea-0 > div")).toContainText("Yhteenveto");
  expect(page.locator("#textArea-2 > div")).toContainText("Työn jako");
});

test("virkailija sees loppuselvitys answers", async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
}) => {
  expect(loppuselvitysFormFilled);
  const loppuselvitysPage = LoppuselvitysPage(page);
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  expect(
    await page.innerText("#preview-container-loppuselvitys #textArea-0")
  ).toEqual("Yhteenveto");
  expect(
    await page.innerText("#preview-container-loppuselvitys #textArea-2")
  ).toEqual("Työn jako");
  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-description.project-description-1.goal"]'
    )
  ).toEqual("Tavoite");
  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-description.project-description-1.activity"]'
    )
  ).toEqual("Toiminta");
  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-description.project-description-1.result"]'
    )
  ).toEqual("Tulokset");
  expect(
    await page.innerText("#preview-container-loppuselvitys #textArea-1")
  ).toEqual("Arviointi");
  expect(
    await page.innerText("#preview-container-loppuselvitys #textArea-3")
  ).toEqual("Tiedotus");

  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-outcomes.project-outcomes-1.outcome-type"]'
    )
  ).toEqual("Toimintamalli");
  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-outcomes.project-outcomes-1.description"]'
    )
  ).toEqual("Kuvaus");
  expect(
    await page.innerText(
      '#preview-container-loppuselvitys [id="project-outcomes.project-outcomes-1.address"]'
    )
  ).toEqual("Saatavuustiedot");

  expect(
    await page.innerText(
      "#preview-container-loppuselvitys #radioButton-good-practices"
    )
  ).toEqual("Ei");
  expect(
    await page.innerText("#preview-container-loppuselvitys #textArea-4")
  ).toEqual("Lisätietoja");
});

test("virkailija can not accept loppuselvitys while it is not verified", async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
}) => {
  expect(loppuselvitysFormFilled);
  const loppuselvitysPage = LoppuselvitysPage(page);
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  expect(
    await countElements(page, '[data-test-id="taloustarkastus-email"]')
  ).toEqual(0);
});

test("loppuselvitys-asiatarkastamatta notification is sent to virkailija", async ({
  avustushakuID,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  request,
}) => {
  expect(loppuselvitysFormFilled);
  const oldEmailCount = (
    await getAllEmails("loppuselvitys-asiatarkastamatta")
  ).filter((e) =>
    e["to-address"].includes("santeri.horttanainen@reaktor.com")
  ).length;
  await sendLoppuselvitysAsiatarkastamattaNotifications(request);

  const emails = (await getAllEmails("loppuselvitys-asiatarkastamatta")).filter(
    (e) => e["to-address"].includes("santeri.horttanainen@reaktor.com")
  );
  expect(emails.length).toEqual(oldEmailCount + 1);
  const loppuselvitysAsiatarkastamattaNotification = emails.pop();
  expect(loppuselvitysAsiatarkastamattaNotification?.subject).toEqual(
    "Asiatarkastamattomia loppuselvityksiä"
  );
  expect(loppuselvitysAsiatarkastamattaNotification?.formatted).toContain(
    `${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/`
  );
});

test("does not show asiatarkastus to a virkailija who is not valmistelija", async ({
  page,
  avustushakuID,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  acceptedHakemus: { hakemusID },
}) => {
  expect(loppuselvitysFormFilled);
  const loppuselvitysPage = LoppuselvitysPage(page);
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  await switchUserIdentityTo(page, "viivivirkailija");
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  expect(await countElements(page, "button[name=submit-verification]")).toEqual(
    0
  );
});

test("shows asiatarkastus to pääkäyttäjä who is not valmistelija", async ({
  page,
  avustushakuID,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  acceptedHakemus: { hakemusID },
}) => {
  expect(loppuselvitysFormFilled);
  const loppuselvitysPage = LoppuselvitysPage(page);
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  await switchUserIdentityTo(page, "paivipaakayttaja");
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  expect(await countElements(page, "button[name=submit-verification]")).toEqual(
    1
  );
});

test("hakija can not edit loppuselvitys after information has been verified", async ({
  page,
  loppuselvitysSubmitted: { loppuselvitysFormUrl },
  asiatarkastus: { asiatarkastettu },
}) => {
  expect(asiatarkastettu);
  await navigate(page, loppuselvitysFormUrl);
  expect(await page.innerText('span[id="textArea-0"]')).toEqual("Yhteenveto");
  expect(await page.isHidden('textarea[id="textArea-0"]'));

  const hakijaSelvitysPage = HakijaSelvitysPage(page);
  await hakijaSelvitysPage.loppuselvitysWarning.waitFor({ state: "attached" });
  await hakijaSelvitysPage.submitButton.waitFor({ state: "detached" });
});

test("information verification is shown", async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  asiatarkastus: { asiatarkastettu },
}) => {
  const textareaSelector = 'textarea[name="information-verification"]';
  expect(asiatarkastettu);
  const loppuselvitysPage = LoppuselvitysPage(page);
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID);
  expect(await page.textContent(textareaSelector)).toEqual("Hyvältä näyttääpi");
  expect(await page.isDisabled(textareaSelector)).toEqual(true);
  expect(await page.innerText("[data-test-id=verifier]")).toEqual(
    "_ valtionavustus"
  );
  expect(
    moment(
      await page.innerText("[data-test-id=verified-at]"),
      "D.M.YYYY [klo] H.mm"
    ).isSameOrBefore()
  ).toBeTruthy();
});

test("loppuselvitys-asiatarkastamatta notification is not sent to virkailija anymore", async ({
  avustushakuID,
  asiatarkastus: { asiatarkastettu },
  request,
}) => {
  expect(asiatarkastettu);
  const oldEmails = await getAllEmails("loppuselvitys-asiatarkastamatta");
  const oldEmailCount = oldEmails.filter((e) =>
    e["to-address"].includes("santeri.horttanainen@reaktor.com")
  ).length;
  await sendLoppuselvitysAsiatarkastamattaNotifications(request);

  const allEmails = await getAllEmails("loppuselvitys-asiatarkastamatta");
  const emails = allEmails.filter((e) =>
    e["to-address"].includes("santeri.horttanainen@reaktor.com")
  );
  if (emails.length === oldEmailCount + 1) {
    // if user _ valtionavustus has other submitted loppuselvitys
    const loppuselvitysAsiatarkastamattaNotification = emails.pop();
    expect(loppuselvitysAsiatarkastamattaNotification?.subject).toEqual(
      "Asiatarkastamattomia loppuselvityksiä"
    );
    expect(loppuselvitysAsiatarkastamattaNotification?.formatted).not.toContain(
      `- Loppuselvityksiä 1 kpl: ${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/`
    );
  } else {
    expect(emails.length).toEqual(oldEmailCount);
  }
});

test("virkailija can accept loppuselvitys", async ({
  page,
  avustushakuID,
  asiatarkastus: { asiatarkastettu },
  acceptedHakemus,
}) => {
  expect(asiatarkastettu);
  const subject = "Hieno homma";
  const content = "Hyvä juttu";
  const additionalReceiver = "buddy-boy@buddy.boy";

  await test.step("virkailija accepts loppuselvitys", async () => {
    await page.click('[data-test-id="taloustarkastus-add-receiver"]');
    await clearAndType(
      page,
      '[data-test-id="taloustarkastus-receiver-2"]',
      additionalReceiver
    );

    await clearAndType(
      page,
      '[data-test-id="taloustarkastus-email-subject"]',
      subject
    );
    await clearAndType(
      page,
      '[data-test-id="taloustarkastus-email-content"]',
      content
    );
    await page.click('[data-test-id="taloustarkastus-submit"]');

    await waitForElementWithText(
      page,
      "h3",
      "Taloustarkastettu ja lähetetty hakijalle"
    );
  });

  await test.step(
    "and sees which email was sent to hakija afterward",
    async () => {
      const displayedSubject = await page.getAttribute(
        '[data-test-id="taloustarkastus-email-subject"]',
        "value"
      );
      const displayedContent = await page.textContent(
        '[data-test-id="taloustarkastus-email-content"]'
      );
      const displayedThirdReceiver = await page.getAttribute(
        '[data-test-id="taloustarkastus-receiver-2"]',
        "value"
      );

      expect(displayedSubject).toEqual(subject);
      expect(displayedContent).toEqual(content);
      expect(displayedThirdReceiver).toEqual(additionalReceiver);
    }
  );

  await test.step("and sees that taloustarkastus has been made", async () => {
    const title = await page.textContent('[data-test-id="taloustarkastus"] h3');
    const date = await page.textContent(
      '[data-test-id="taloustarkastus"] .date'
    );
    const verifier = await page.textContent(
      '[data-test-id="taloustarkastus"] [data-test-id="verifier"]'
    );

    expect(title).toEqual("Taloustarkastettu ja lähetetty hakijalle");
    expect(date).toEqual(moment().format("D.M.YYYY [klo] H.mm"));
    expect(verifier).toEqual("_ valtionavustus");
  });

  await test.step(
    "loppuselvitys is shown as hyväksytty in hakemus listing",
    async () => {
      const arviointi = new HakemustenArviointiPage(page);
      await arviointi.navigate(avustushakuID);

      await navigate(page, `/avustushaku/${avustushakuID}/`);
      expect(await arviointi.getLoppuselvitysStatus(acceptedHakemus.hakemusID)).toEqual("Hyväksytty");
    }
  );
});
