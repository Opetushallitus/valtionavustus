import { Page } from "@playwright/test";

import { getLinkToPaatosFromEmails } from "../utils/emails";

export const HakijaPaatosPage = (page: Page) => {
  async function navigate(hakemusID: number) {
    const link = await getLinkToPaatosFromEmails(hakemusID);
    await page.goto(link);
  }
  const koulutusosioSection = page
    .locator("section", {
      hasText:
        "Valtionavustusta / määrärahaa voidaan käyttää seuraaviin koulutusosioihin:",
    })
    .locator("table");

  const koulutusOsio = koulutusosioSection
    .locator("tbody")
    .locator("tr")
    .locator("td");
  const koulutusOsioYhteensa = koulutusosioSection
    .locator("tfoot")
    .locator("tr")
    .locator("th");
  return {
    navigate,
    paatosHeaderTitle: page.locator('[data-test-id="paatos-header-title"]'),
    paatosTitle: page.locator('[data-test-id="paatos-title"]'),
    acceptedTitle: page.locator('[data-test-id="paatos-accepted-title"]'),
    lisatietojaTitle: page.locator('[data-test-id="lisatietoja-title"]'),
    avustuslajiTitle: page.locator('[data-test-id="avustuslaji"] h2'),
    avustuslaji: page.locator('[data-test-id="avustuslaji"] p'),
    koulutusosiot: {
      osioName: koulutusOsio.nth(0),
      koulutusosioPaivat: {
        haettu: koulutusOsio.nth(1),
        hyvaksytty: koulutusOsio.nth(2),
      },
      osallistujat: {
        haettu: koulutusOsio.nth(3),
        hyvaksytty: koulutusOsio.nth(4),
      },
      osio: {
        haettu: koulutusOsio.nth(5),
        hyvaksytty: koulutusOsio.nth(6),
      },
      koulutettavapaivatYhteensa: {
        haettu: koulutusOsioYhteensa.nth(1),
        hyvaksytty: koulutusOsioYhteensa.nth(2),
      },
    },
  };
};
