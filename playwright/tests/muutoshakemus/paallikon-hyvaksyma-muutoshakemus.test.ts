import { budjettimuutoshakemusTest } from "../../fixtures/budjettimuutoshakemusTest";
import { DefaultValueFixtures } from "../../fixtures/defaultValues";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { HakijaMuutoshakemusPage } from "../../pages/hakijaMuutoshakemusPage";
import { HakijaMuutoshakemusPaatosPage } from "../../pages/hakijaMuutoshakemusPaatosPage";
import { parseMuutoshakemusPaatosFromEmails } from "../../utils/emails";
import { expect, test } from "@playwright/test";
import { HAKIJA_URL } from "../../utils/constants";

test.setTimeout(180000);

const sisaltomuutosPerustelut = "Muutamme kaiken muuttamisen ilosta";

budjettimuutoshakemusTest.extend<
  Pick<DefaultValueFixtures, "ukotettuValmistelija">
>({
  ukotettuValmistelija: "Viivi Virkailija",
})(
  "Ukottamattoman valmistelijan (paallikon) hyvaksyessa muutoshakemuksen, hyvaksyjaksi tulee hyvaksyja, esittelijaksi ukotettu valmistelija ja lisatietoja osioon tulee ukotettu valmistelija",
  async ({
    page,
    avustushakuID,
    ukotettuValmistelija,
    acceptedHakemus: { hakemusID },
  }) => {
    const user = "Viivi";
    const hakemustenArviointiPage = new HakemustenArviointiPage(page);
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page);
    const hakijaMuutoshakemusPaatosPage = new HakijaMuutoshakemusPaatosPage(
      page
    );

    await test.step("send muutoshakemus", async () => {
      await hakijaMuutoshakemusPage.navigate(hakemusID);
      await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta();
      await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(
        sisaltomuutosPerustelut
      );
      await hakijaMuutoshakemusPage.sendMuutoshakemus(true);
    });
    await test.step("shows correct values in preview", async () => {
      await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
        avustushakuID,
        hakemusID
      );
      const preview = hakemustenArviointiPage.paatosPreview();
      await preview.open();
      await expect(preview.hyvaksyja).toHaveText("_ valtionavustus");
      expect(await preview.esittelija.textContent()).toContain(
        ukotettuValmistelija
      );
      expect(await preview.lisatietoja.textContent()).toContain(
        ukotettuValmistelija
      );
      await preview.close();
    });
    await test.step("shows correct values in paatos for hakija", async () => {
      await hakemustenArviointiPage.selectVakioperusteluInFinnish();
      await hakemustenArviointiPage.saveMuutoshakemus();

      const links = await parseMuutoshakemusPaatosFromEmails(hakemusID);
      if (!links.linkToMuutoshakemusPaatos) {
        throw Error("No linkToMuutoshakemusPaatos found");
      }
      await hakijaMuutoshakemusPaatosPage.navigate(
        links.linkToMuutoshakemusPaatos
      );

      const hakemusHyvaksyja =
        await hakijaMuutoshakemusPaatosPage.paatoksenHyvaksyja();
      expect(hakemusHyvaksyja).toEqual("_ valtionavustus");
      const hakemusEsittelija =
        await hakijaMuutoshakemusPaatosPage.paatoksenEsittelija();
      expect(hakemusEsittelija).toContain(user);
      const hakemusLisatietoja =
        await hakijaMuutoshakemusPaatosPage.lisatietoja();
      expect(hakemusLisatietoja).toContain(user);
    });
    await test.step(
      "clicking link in asia section navigates to muutoshakemus",
      async () => {
        await hakijaMuutoshakemusPaatosPage.clickLinkToMuutoshakemus();
        const urlRegex = new RegExp(
          `${HAKIJA_URL}/muutoshakemus\\?user-key=.*&avustushaku-id=${avustushakuID}&lang=fi`
        );
        expect(page.url()).toMatch(urlRegex);
      }
    );
  }
);
