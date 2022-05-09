import { APIRequestContext, expect } from "@playwright/test";
import moment from "moment";

import {
  Email,
  getAcceptedPäätösEmails,
  getLinkToHakemusFromSentEmails,
  getMuutoshakemuksetKasittelemattaEmails,
  getValmistelijaEmails,
  lastOrFail,
  waitUntilMinEmails,
} from "../../utils/emails";
import { clickElementWithText, waitForNewTab } from "../../utils/util";
import { HAKIJA_URL, VIRKAILIJA_URL } from "../../utils/constants";
import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";
import { MuutoshakemusValues } from "../../utils/types";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { HakijaMuutoshakemusPage } from "../../pages/hakijaMuutoshakemusPage";

const sendMuutoshakemuksiaKasittelemattaNotifications = (
  request: APIRequestContext
) =>
  request.post(
    `${VIRKAILIJA_URL}/api/test/send-muutoshakemuksia-kasittelematta-notifications`
  );

const muutoshakemus1: MuutoshakemusValues = {
  jatkoaika: moment(new Date()).add(2, "months").add(1, "days").locale("fi"),
  jatkoaikaPerustelu:
    "Ei kyl millään ehdi deadlineen mennessä ku mun koira söi ne tutkimustulokset",
};

test.setTimeout(180000);

test("When muutoshakemus enabled haku has been published, a hakemus has been submitted, and päätös has been sent", async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID, userKey },
  context,
  hakuProps,
  answers,
}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page);
  let hakemusRegisterNumber: string | undefined;

  await test.step("hakija gets the correct email content", async () => {
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

  await test.step(
    "allows virkailija to edit the original hakemus",
    async () => {
      await hakemustenArviointiPage.navigate(avustushakuID);
      await hakemustenArviointiPage.clickHakemus(hakemusID);
      hakemusRegisterNumber = await page
        .locator("section.va-register-number span.value")
        .innerText();
      await clickElementWithText(page, "button", "Muokkaa hakemusta");

      const [modificationPage] = await Promise.all([
        context.waitForEvent("page"),
        clickElementWithText(page, "button", "Siirry muokkaamaan"),
      ]);
      expect(modificationPage.url()).toContain(
        `${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?hakemus=`
      );
      await modificationPage.close();
    }
  );

  await test.step("submit muutoshakemus #1", async () => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page);
    await hakijaMuutoshakemusPage.navigate(hakemusID);

    const registerNumber = await page
      .locator('[data-test-id="register-number"]')
      .innerText();
    expect(registerNumber).toEqual(hakemusRegisterNumber);

    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus1);
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true);
  });

  await test.step("valmistelija gets an email", async () => {
    await test.step("with correct title", async () => {
      const email = lastOrFail(
        await waitUntilMinEmails(getValmistelijaEmails, 1, hakemusID)
      );
      expect(email["to-address"]).toEqual(["santeri.horttanainen@reaktor.com"]);
      const title = email.formatted.match(/Hanke:.*/)?.[0];
      expect(title).toContain(
        `${hakuProps.registerNumber} - ${answers.projectName}`
      );
    });

    await test.step("with correct avustushaku link", async () => {
      const linkToHakemus = await getLinkToHakemusFromSentEmails(hakemusID);
      expect(linkToHakemus).toEqual(
        `${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`
      );
    });
  });
  const ukotettuValmistelijaEmail = "santeri.horttanainen@reaktor.com";
  await test.step("ukotettu valmistelija gets a reminder", async () => {
    const emailsBefore = await getMuutoshakemuksetKasittelemattaEmails(
      ukotettuValmistelijaEmail,
      avustushakuID
    );
    await sendMuutoshakemuksiaKasittelemattaNotifications(page.request);
    const emailsAfter = await getMuutoshakemuksetKasittelemattaEmails(
      ukotettuValmistelijaEmail,
      avustushakuID
    );
    const emailsAfterLength = emailsAfter.length;
    expect(emailsAfterLength).toBeGreaterThan(emailsBefore.length);
    const email = lastOrFail(emailsAfter);
    expect(email.subject).toEqual("Käsittelemättömiä muutoshakemuksia");
    expect(email["to-address"]).toEqual([ukotettuValmistelijaEmail]);
    const expectedArviointiLink = `${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/`;
    expect(email.formatted).toContain(
      `- Muutoshakemuksia 1 kpl: ${expectedArviointiLink}`
    );
    await page.goto(expectedArviointiLink);
  });

  await test.step("Muutoshakemus status is Uusi", async () => {
    const content =
      await hakemustenArviointiPage.muutoshakemusStatusFieldContent();
    expect(content).toEqual("Uusi");
  });

  await test.step("go to hakemus muutoshakemus tab", async () => {
    await hakemustenArviointiPage.clickHakemus(hakemusID);
    await hakemustenArviointiPage.clickMuutoshakemusTab();
  });

  await test.step(
    "shows the number of pending muutoshakemus in red",
    async () => {
      const numOfMuutosHakemuksetElement = await page.waitForSelector(
        '[data-test-id=number-of-pending-muutoshakemukset]:has-text("1")'
      );
      const color = await page.evaluate(
        (e) => getComputedStyle(e).color,
        numOfMuutosHakemuksetElement
      );
      expect(color).toBe("rgb(255, 0, 0)"); // red
    }
  );

  await test.step("navigate to muutoshakemustab", async () => {
    await hakemustenArviointiPage.clickMuutoshakemusTab();
  });

  await test.step(
    "muutoshakemustab links to the muutoshakemus form",
    async () => {
      const newPagePromise = waitForNewTab(page);
      await hakemustenArviointiPage.page.click(
        '[data-test-id="muutoshakemus-link"]'
      );
      const muutoshakemusPage = await newPagePromise;
      expect(muutoshakemusPage.url()).toContain(
        `${HAKIJA_URL}/muutoshakemus?lang=fi&user-key=${userKey}&avustushaku-id=${avustushakuID}`
      );
      await muutoshakemusPage.close();
    }
  );

  await test.step("Displays valid muutoshakemus values", async () => {
    await hakemustenArviointiPage.validateMuutoshakemusValues(muutoshakemus1);
  });

  await test.step("accept muutoshakemus", async () => {
    const isCurrentAvustushakuEmail = (e: Email) =>
      e.formatted.includes(`/avustushaku/${avustushakuID}/`);
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision("accepted");
    await hakemustenArviointiPage.selectVakioperusteluInFinnish();
    const emailsBefore = await getMuutoshakemuksetKasittelemattaEmails(
      ukotettuValmistelijaEmail,
      avustushakuID
    );
    const emailsBeforeWithCurrentAvustushaku = emailsBefore.filter(
      isCurrentAvustushakuEmail
    );
    await hakemustenArviointiPage.saveMuutoshakemus();

    await test.step("email is immediately shown as sent", async () => {
      expect(await page.innerText("data-test-id=päätös-email-status")).toMatch(
        /^Päätös lähetetty hakijalle /
      );
    });

    await test.step(
      "ukotettu valmistelija no longer gets notification for this avustushaku",
      async () => {
        await sendMuutoshakemuksiaKasittelemattaNotifications(page.request);
        const emailsAfterSending =
          await getMuutoshakemuksetKasittelemattaEmails(
            ukotettuValmistelijaEmail,
            avustushakuID
          );
        const emailsAfterWithCurrentAvustushaku = emailsAfterSending.filter(
          isCurrentAvustushakuEmail
        );
        expect(emailsBeforeWithCurrentAvustushaku).toEqual(
          emailsAfterWithCurrentAvustushaku
        );
      }
    );
  });
});
