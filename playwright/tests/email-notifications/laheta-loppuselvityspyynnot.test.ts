import { Page, test, expect } from "@playwright/test";
import { VIRKAILIJA_URL } from "../../utils/constants";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";
import moment from "moment";
import {
  Email,
  getLahetaLoppuselvityspyynnotEmails,
  lastOrFail,
} from "../../utils/emails";
import { expectToBeDefined } from "../../utils/util";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { selvitysTest } from "../../fixtures/selvitysTest";

const sendLahetaLoppuselvityspyynnotNotifications = (page: Page) =>
  page.request.post(
    `${VIRKAILIJA_URL}/api/test/send-laheta-loppuselvityspyynnot-notifications`,
    { failOnStatusCode: true }
  );

interface LoppuselvitysExtraFixtures {
  loppuselvitysDate: string;
  loppuselvitysDateSet: true;
}

const notifyTest = selvitysTest.extend<LoppuselvitysExtraFixtures>({
  loppuselvitysDate: moment().format("DD.MM.YYYY"),
  loppuselvitysDateSet: async (
    { loppuselvitysDate, page, avustushakuID, acceptedHakemus },
    use
  ) => {
    expectToBeDefined(acceptedHakemus);
    const hakujenHallinta = new HakujenHallintaPage(page);
    await hakujenHallinta.navigateToPaatos(avustushakuID);
    await hakujenHallinta.setLoppuselvitysDate(loppuselvitysDate);
    await hakujenHallinta.waitForSave();
    await use(true);
  },
});

async function expectNotificationsSentAfterLahetaLoppuselvityspyynnot(
  page: Page,
  avustushakuID: number
): Promise<Email[]> {
  const emailsBefore = await getLahetaLoppuselvityspyynnotEmails(avustushakuID);
  await sendLahetaLoppuselvityspyynnotNotifications(page);
  const emailsAfter = await getLahetaLoppuselvityspyynnotEmails(avustushakuID);
  expect(emailsAfter.length).toBeGreaterThan(emailsBefore.length);
  return emailsAfter;
}

async function expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(
  page: Page,
  avustushakuID: number
): Promise<void> {
  const emailsBefore = await getLahetaLoppuselvityspyynnotEmails(avustushakuID);
  await sendLahetaLoppuselvityspyynnotNotifications(page);
  const emailsAfter = await getLahetaLoppuselvityspyynnotEmails(avustushakuID);
  expect(emailsAfter.length).toEqual(emailsBefore.length);
}

async function sendLoppuselvitysEmails(page: Page, avustushakuID: number) {
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await hakujenHallintaPage.navigateToPaatos(avustushakuID);
  await hakujenHallintaPage.switchToLoppuselvitysTab();
  await hakujenHallintaPage.sendLoppuselvitys();
}

test.describe("loppuselvitys", () => {
  test.describe(
    "notifications are sent repeatedly until loppuselvityspyynnöt have been sent",
    () => {
      const loppuselvitysDeadline = moment()
        .add(8, "months")
        .format("DD.MM.YYYY");
      notifyTest.use({ loppuselvitysDate: loppuselvitysDeadline });
      notifyTest(
        "loppuselvitys notification is sent repeatedly",
        async ({ page, loppuselvitysDateSet, avustushakuID }) => {
          expect(loppuselvitysDateSet);
          await expectNotificationsSentAfterLahetaLoppuselvityspyynnot(
            page,
            avustushakuID
          );
          await sendLoppuselvitysEmails(page, avustushakuID);
          await expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(
            page,
            avustushakuID
          );
        }
      );
    }
  );

  test.describe("when loppuselvitys deadline is in the past", () => {
    notifyTest.use({
      loppuselvitysDate: moment().subtract(1, "day").format("DD.MM.YYYY"),
    });
    notifyTest(
      "notification is not send",
      async ({ page, loppuselvitysDateSet, avustushakuID }) => {
        expect(loppuselvitysDateSet);
        await expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(
          page,
          avustushakuID
        );
      }
    );
  });

  test.describe("when over 8 months till loppuselvitys deadline", () => {
    notifyTest.use({
      loppuselvitysDate: moment().add(12, "months").format("DD.MM.YYYY"),
    });
    notifyTest(
      "notification is not send",
      async ({ page, loppuselvitysDateSet, avustushakuID }) => {
        expect(loppuselvitysDateSet);
        await expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(
          page,
          avustushakuID
        );
      }
    );
  });

  test.describe("8 months till loppuselvitys deadline", () => {
    const loppuselvitysDeadline = moment()
      .add(8, "months")
      .format("DD.MM.YYYY");
    notifyTest.use({ loppuselvitysDate: loppuselvitysDeadline });
    notifyTest(
      "notification is sent",
      async ({ page, loppuselvitysDateSet, avustushakuID, hakuProps }) => {
        expect(loppuselvitysDateSet);
        const emailsAfter =
          await expectNotificationsSentAfterLahetaLoppuselvityspyynnot(
            page,
            avustushakuID
          );
        await test.step("email content is correct", async () => {
          const email = lastOrFail(emailsAfter);
          expect(email["to-address"]).toHaveLength(2);
          expect(email["to-address"]).toContain(
            "santeri.horttanainen@reaktor.com"
          );
          expect(email["to-address"]).toContain("viivi.virkailja@exmaple.com");
          expect(email.subject).toEqual(
            "Muistutus loppuselvityspyyntöjen lähettämisestä"
          );
          expect(email.formatted).toEqual(`Hyvä vastaanottaja,

valtionavustuksen ${hakuProps.avustushakuName} loppuselvitysten palautuksen määräaika on ${loppuselvitysDeadline}.

Laatikaa vastuuvalmistelijan johdolla loppuselvityslomake ja lähettäkää loppuselvityspyynnöt avustuksen saajille mahdollisimman pian.

Ohjeet loppuselvityslomakkeen laatimiseksi ja selvityspyyntöjen lähettämiseksi löytyvät: https://intra.oph.fi/pages/viewpage.action?spaceKey=VALA&title=Loppuselvitykset

Huomatkaa, että valtionavustusjärjestelmä lähettää automaattisesti muistutusviestin loppuselvityksen palauttamisesta kaikille niille avustuksen saajille, jotka eivät ole lähettäneet loppuselvitystä käsiteltäväksi viimeistään kaksi viikkoa ennen palautuksen määräpäivää.

Ongelmatilanteissa saat apua osoitteesta: valtionavustukset@oph.fi
`);
        });
        await test.step(
          "notification is not sent again if loppupäätös is sent",
          async () => {
            await sendLoppuselvitysEmails(page, avustushakuID);
            await sendLahetaLoppuselvityspyynnotNotifications(page);
            const emailsAfterSendingLoppuselvitys =
              await getLahetaLoppuselvityspyynnotEmails(avustushakuID);
            expect(emailsAfter.length).toEqual(
              emailsAfterSendingLoppuselvitys.length
            );
          }
        );
      }
    );
  });

  test.describe("when sending päätös", async () => {
    selvitysTest(
      "send the notification only after sending päätös",
      async ({
        closedAvustushaku,
        page,
        avustushakuID,
        answers,
        ukotettuValmistelija,
      }) => {
        expectToBeDefined(closedAvustushaku);
        await test.step("set loppuselvitys date", async () => {
          const hakujenHallinta = new HakujenHallintaPage(page);
          await hakujenHallinta.navigateToPaatos(avustushakuID);
          await hakujenHallinta.setLoppuselvitysDate(
            moment().add(3, "months").format("DD.MM.YYYY")
          );
          await hakujenHallinta.waitForSave();
        });

        await test.step(
          "make sure notifications are not send before päätös",
          async () => {
            await expectNotificationsNotSentAfterLahetaLoppuselvityspyynnot(
              page,
              avustushakuID
            );
          }
        );

        await test.step("send päätös", async () => {
          const hakemustenArviointiPage = new HakemustenArviointiPage(page);
          await hakemustenArviointiPage.navigate(avustushakuID);
          const hakemusID = await hakemustenArviointiPage.acceptAvustushaku(
            avustushakuID,
            answers.projectName
          );

          const hakujenHallintaPage = new HakujenHallintaPage(page);
          await hakujenHallintaPage.navigateFromHeader();
          await hakujenHallintaPage.resolveAvustushaku();

          await hakemustenArviointiPage.navigate(avustushakuID);
          await hakemustenArviointiPage.selectValmistelijaForHakemus(
            hakemusID,
            ukotettuValmistelija
          );

          await hakujenHallintaPage.navigateToPaatos(avustushakuID);

          await hakujenHallintaPage.sendPaatos(avustushakuID);
        });

        await expectNotificationsSentAfterLahetaLoppuselvityspyynnot(
          page,
          avustushakuID
        );
      }
    );
  });
});
