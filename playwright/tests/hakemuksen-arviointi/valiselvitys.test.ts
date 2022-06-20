import { expect, test } from "@playwright/test";
import { VirkailijaValiselvitysPage } from "../../pages/virkailijaValiselvitysPage";
import { expectToBeDefined } from "../../utils/util";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { väliselvitysTest } from "../../fixtures/väliselvitysTest";
import { getValiselvitysEmails } from "../../../test/test-util";
import {
  getHakemusTokenAndRegisterNumber,
  getValiselvitysSubmittedNotificationEmails,
  lastOrFail,
} from "../../utils/emails";
import { HAKIJA_URL } from "../../utils/constants";
import { HakijaSelvitysPage } from "../../pages/hakijaSelvitysPage";

test.describe("Väliselvitys", () => {
  väliselvitysTest(
    "väliselvitys submitted notification is sent",
    async ({ page, acceptedHakemus: { hakemusID }, väliselvitysSubmitted }) => {
      expectToBeDefined(väliselvitysSubmitted);
      const email = lastOrFail(
        await getValiselvitysSubmittedNotificationEmails(hakemusID)
      );
      expect(email["to-address"]).toHaveLength(1);
      expect(email["to-address"]).toEqual(["erkki.esimerkki@example.com"]);
      expect(email.subject).toEqual("Väliselvityksenne on vastaanotettu");
      const { "register-number": registerNumber } =
        await getHakemusTokenAndRegisterNumber(hakemusID);
      expect(email.formatted).toContain(`Hyvä vastaanottaja,

olemme vastaanottaneet väliselvityksenne.

Rahassa kylpijät Ky Ay Oy
${registerNumber}
`);
      expect(email.formatted).toContain(`
Hakija voi muokata jo lähetettyä väliselvitystä oheisen linkin kautta selvityksen määräaikaan saakka. Tällöin selvitystä ei kuitenkaan enää lähetetä uudelleen käsiteltäväksi, vaan muokkausten tallentuminen varmistetaan hakulomakkeen yläreunan lokitietokentästä.

Lisätietoja saatte tarvittaessa avustuspäätöksessä mainitulta lisätietojen antajalta. Teknisissä ongelmissa auttaa: valtionavustukset@oph.fi

Kun selvitys on käsitelty, ilmoitetaan siitä sähköpostitse avustuksen saajan viralliseen sähköpostiosoitteeseen sekä yhteyshenkilölle.`);

      const previewUrl = email.formatted.match(/(https?:\/\/\S+)/gi)?.[0];
      if (!previewUrl) {
        throw new Error("No preview url found");
      }

      await page.goto(previewUrl);
      await expect(page.locator("div.soresu-preview > h1")).toContainText(
        "väliselvitys submitted notification is sent"
      );
      await expect(page.locator("#organization > div")).toContainText(
        "Avustuksen saajan nimi"
      );
    }
  );

  väliselvitysTest(
    "väliselvitys can be accepted",
    async ({
      context,
      page,
      avustushakuID,
      acceptedHakemus,
      väliselvitysSubmitted: { userKey },
    }) => {
      const arviointi = new HakemustenArviointiPage(page);

      await test.step("väliselvitys is tarkastamatta", async () => {
        await arviointi.navigate(avustushakuID);
        expect(
          await arviointi.getVäliselvitysStatus(acceptedHakemus.hakemusID)
        ).toEqual("Tarkastamatta");
      });

      const valiselvitysPage = VirkailijaValiselvitysPage(page);
      await valiselvitysPage.navigateToValiselvitysTab(
        avustushakuID,
        acceptedHakemus.hakemusID
      );
      await test.step("hakija could still edit väliselvitys", async () => {
        const [newPage] = await Promise.all([
          context.waitForEvent("page"),
          valiselvitysPage.linkToHakemus.click(),
        ]);
        const hakijaSelvitysPage = HakijaSelvitysPage(newPage);
        await hakijaSelvitysPage.valiselvitysWarning.waitFor({
          state: "detached",
        });
        await hakijaSelvitysPage.submitButton.isEnabled();
        await hakijaSelvitysPage.page.close();
      });

      await test.step("tarkasta väliselvitys", async () => {
        await page.waitForSelector('[data-test-id="selvitys-email"]');
        await valiselvitysPage.acceptVäliselvitys();
      });

      await test.step(
        "väliselvitys accepted email is sent to primary and organization emails",
        async () => {
          const emails = await getValiselvitysEmails(acceptedHakemus.hakemusID);
          const expected = [
            "erkki.esimerkki@example.com",
            "akaan.kaupunki@akaa.fi",
          ];
          expect(
            emails[0]["to-address"].every((addr) => expected.includes(addr))
          ).toBeTruthy();
        }
      );

      await test.step("väliselvitys no longer editable", async () => {
        const [newPage] = await Promise.all([
          context.waitForEvent("page"),
          valiselvitysPage.linkToHakemus.click(),
        ]);
        const hakijaSelvitysPage = HakijaSelvitysPage(newPage);
        await hakijaSelvitysPage.valiselvitysWarning.waitFor({
          state: "attached",
        });
        await hakijaSelvitysPage.submitButton.waitFor({ state: "detached" });
        await hakijaSelvitysPage.page.close();
      });

      await test.step("väliselvitys is hyväksytty", async () => {
        await arviointi.navigate(avustushakuID);
        expect(
          await arviointi.getVäliselvitysStatus(acceptedHakemus.hakemusID)
        ).toEqual("Hyväksytty");
      });

      await test.step(
        `väliselvitys can't be updated using the API`,
        async () => {
          const getSelvitys = await page.request.get(
            `${HAKIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/${userKey}`
          );
          const selvitys = await getSelvitys.json();
          const postSelvitysContent = await page.request.post(
            `${HAKIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/${userKey}/${selvitys.version}`,
            {
              data: { value: [] },
            }
          );
          expect(postSelvitysContent.status()).toEqual(403);
        }
      );
    }
  );
  väliselvitysTest(
    "väliselvitys cannot be edited after it has been accepted",
    async ({
      context,
      page,
      avustushakuID,
      acceptedHakemus,
      väliselvitysSubmitted,
    }) => {
      expectToBeDefined(väliselvitysSubmitted);
      const valiselvitysPage = new VirkailijaValiselvitysPage(page);
      await valiselvitysPage.navigateToValiselvitysTab(
        avustushakuID,
        acceptedHakemus.hakemusID
      );
      await valiselvitysPage.acceptVäliselvitys();
      const valiselvitysFormUrl = await page.getAttribute(
        '[data-test-id="selvitys-link"]',
        "href"
      );
      if (!valiselvitysFormUrl) throw Error("väliselvitys form url not found");
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        valiselvitysPage.linkToHakemus.click(),
      ]);
      const hakijaSelvitysPage = HakijaSelvitysPage(newPage);
      await hakijaSelvitysPage.valiselvitysWarning.waitFor({
        state: "attached",
      });
      await newPage.waitForSelector('[data-test-id="form-preview"]');
    }
  );
});
