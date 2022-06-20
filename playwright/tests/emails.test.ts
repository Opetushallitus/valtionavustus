import { muutoshakemusTest } from "../fixtures/muutoshakemusTest";
import {
  getAcceptedPäätösEmails,
  getLoppuselvitysEmails,
  getTäydennyspyyntöEmails,
  getValiselvitysEmails,
  getLinkToMuutoshakemusFromSentEmails,
  lastOrFail,
  waitUntilMinEmails,
} from "../utils/emails";
import { HAKIJA_URL } from "../utils/constants";
import { expect } from "@playwright/test";
import { HakujenHallintaPage } from "../pages/hakujenHallintaPage";
import { HakijaMuutoshakemusPage } from "../pages/hakijaMuutoshakemusPage";
import { HakemustenArviointiPage } from "../pages/hakemustenArviointiPage";

const contactPersonEmail = "yrjo.yhteyshenkilo@example.com";
const newContactPersonEmail = "uusi.yhteyshenkilo@example.com";

const test = muutoshakemusTest.extend({
  answers: async ({}, use) => {
    await use({
      contactPersonEmail,
      contactPersonName: "Yrjö Yhteyshenkilö",
      contactPersonPhoneNumber: "0501234567",
      projectName: "Hanke päätöksen uudelleenlähetyksen testaamiseksi",
    });
  },
});

test("Täydennyspyyntö email", async ({
  closedAvustushaku,
  page,
  submittedHakemus: { userKey },
  answers,
}, testInfo) => {
  const avustushakuID = closedAvustushaku.id;
  testInfo.setTimeout(testInfo.timeout + 25_000);

  const hakemustenArviointiPage = new HakemustenArviointiPage(page);

  await hakemustenArviointiPage.navigate(avustushakuID);

  await Promise.all([
    page.waitForNavigation(),
    page.click(`text=${answers.projectName}`),
  ]);

  const hakemusID = await hakemustenArviointiPage.getHakemusID();

  expect(await getTäydennyspyyntöEmails(hakemusID)).toHaveLength(0);

  const täydennyspyyntöText =
    "Joo ei tosta hakemuksesta ota mitään tolkkua. Voisitko tarkentaa?";
  await hakemustenArviointiPage.fillTäydennyspyyntöField(täydennyspyyntöText);

  await hakemustenArviointiPage.clickToSendTäydennyspyyntö(
    avustushakuID,
    hakemusID
  );

  expect(
    await page.textContent("#arviointi-tab .change-request-title")
  ).toMatch(
    /\* Täydennyspyyntö lähetetty \d{1,2}\.\d{1,2}\.\d{4} \d{1,2}\.\d{1,2}/
  );
  // The quotes around täydennyspyyntö message are done with CSS :before
  // and :after pseudo elements and not shown in Node.textContent
  expect(
    await page.textContent("#arviointi-tab .change-request-text")
  ).toStrictEqual(täydennyspyyntöText);

  const emails = await waitUntilMinEmails(
    getTäydennyspyyntöEmails,
    1,
    hakemusID
  );
  expect(emails).toHaveLength(1);
  expect(emails[0]["to-address"]).toHaveLength(1);
  expect(emails[0]["to-address"]).toContain(answers.contactPersonEmail);
  expect(emails[0]["bcc"]).toStrictEqual("santeri.horttanainen@reaktor.com");
  expect(emails[0].formatted)
    .toContain(`Pääset täydentämään avustushakemusta tästä linkistä: ${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?hakemus=${userKey}&lang=fi
Muokkaa vain pyydettyjä kohtia.`);
});

test("sends emails to correct contact and hakemus emails", async ({
  page,
  acceptedHakemus: { hakemusID },
  avustushakuID,
}) => {
  const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(
    hakemusID
  );
  await test.step("sends päätös email", async () => {
    const emails = await waitUntilMinEmails(
      getAcceptedPäätösEmails,
      1,
      hakemusID
    );
    expect(emails).toHaveLength(1);
    const email = lastOrFail(emails);
    expect(email["to-address"]).toEqual([
      contactPersonEmail,
      "akaan.kaupunki@akaa.fi",
    ]);
    expect(email["reply-to"]).toEqual(null);
  });
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await hakujenHallintaPage.navigateToPaatos(avustushakuID);
  await test.step("resends päätös", async () => {
    await hakujenHallintaPage.resendPaatokset(1);
    const emails = await waitUntilMinEmails(
      getAcceptedPäätösEmails,
      2,
      hakemusID
    );
    expect(emails).toHaveLength(2);
    const email = lastOrFail(emails);
    expect(email["to-address"]).toEqual([
      contactPersonEmail,
      "akaan.kaupunki@akaa.fi",
    ]);
    expect(email["reply-to"]).toEqual(null);
  });
  const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page);
  await test.step(
    "resends to correct address after changing contact person email",
    async () => {
      await hakijaMuutoshakemusPage.navigateWithLink(linkToMuutoshakemus);
      await hakijaMuutoshakemusPage.changeContactPersonEmailTo(
        newContactPersonEmail
      );
      await hakijaMuutoshakemusPage.clickSaveContacts();
      await hakujenHallintaPage.navigateToPaatos(avustushakuID);
      await hakujenHallintaPage.resendPaatokset();

      const emails = await waitUntilMinEmails(
        getAcceptedPäätösEmails,
        3,
        hakemusID
      );
      expect(emails).toHaveLength(3);
      const email = lastOrFail(emails);
      expect(email["to-address"]).toEqual([
        newContactPersonEmail,
        "akaan.kaupunki@akaa.fi",
      ]);
    }
  );
  await test.step("sends väliselvitys email", async () => {
    await hakujenHallintaPage.switchToValiselvitysTab();
    await hakujenHallintaPage.sendValiselvitys();
    const emails = await waitUntilMinEmails(
      getValiselvitysEmails,
      1,
      hakemusID
    );
    expect(emails).toHaveLength(1);
    const email = lastOrFail(emails);
    expect(email["to-address"]).toEqual([
      newContactPersonEmail,
      "akaan.kaupunki@akaa.fi",
    ]);
    expect(email.bcc).toBeNull();
  });
  await test.step("sends loppuselvitys email", async () => {
    await hakujenHallintaPage.switchToLoppuselvitysTab();
    await hakujenHallintaPage.sendLoppuselvitys();
    const emails = await waitUntilMinEmails(
      getLoppuselvitysEmails,
      1,
      hakemusID
    );
    expect(emails).toHaveLength(1);
    const email = lastOrFail(emails);
    expect(email["to-address"]).toEqual([
      newContactPersonEmail,
      "akaan.kaupunki@akaa.fi",
    ]);
    expect(email.bcc).toBeNull();
  });
});
