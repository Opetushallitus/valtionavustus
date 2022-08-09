import { expect } from "@playwright/test";
import { svBudjettimuutoshakemusTest } from "../../fixtures/swedishHakemusTest";
import { HakijaMuutoshakemusPage } from "../../pages/hakijaMuutoshakemusPage";
import moment from "moment/moment";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import {
  getHakemusTokenAndRegisterNumber,
  parseMuutoshakemusPaatosFromEmails,
} from "../../utils/emails";
import { HAKIJA_URL } from "../../utils/constants";
import { BudgetAmount } from "../../utils/budget";

const test = svBudjettimuutoshakemusTest.extend({
  hakuProps: ({ hakuProps }, use) =>
    use({
      ...hakuProps,
      hankkeenPaattymispaiva: "10.04.2021",
    }),
});

test("swedish muutoshakemus translations", async ({
  page,
  acceptedHakemus: { hakemusID },
  avustushakuID,
  budget,
  answers,
  submittedHakemus: { userKey },
}) => {
  const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page);
  await hakijaMuutoshakemusPage.navigate(hakemusID);
  const locators = hakijaMuutoshakemusPage.locators();
  await test.step("base fields", async () => {
    await expect(locators.registerNumber).toHaveText("Ärendenummer");
    await expect(locators.contactPersonLabel).toHaveText("Kontaktperson");
    await expect(locators.contactPersonEmailLabel).toHaveText(
      "Kontaktpersonens e-postadress"
    );
    await expect(locators.contactPersonPhoneNumberLabel).toHaveText(
      "Kontaktpersonens telefonnummer"
    );
    await expect(locators.haenKayttoajanPidennystaLabel).toHaveText(
      "Jag ansöker om förlängd användningstid för statsunderstödet"
    );
    await expect(
      locators.haenMuutostaTaloudenKayttosuunnitelmaanLabel
    ).toHaveText("Jag ansöker om ändringar i projektets budget");
  });
  await test.step("kayttoajan pidennys fields", async () => {
    await hakijaMuutoshakemusPage.clickHaenKayttoajanPidennysta();
    await expect(locators.existingJatkoaikaTitle).toHaveText(
      "Nuvarande sista användningdag"
    );
    await expect(locators.newJatkoaikaTitle).toHaveText(
      "Ny sista användningsdag"
    );
    await expect(locators.kayttoajanPidennysPerusteluLabel).toHaveText(
      "Motivering"
    );
    await expect(locators.perustelutError).toHaveText("Obligatorisk uppgift");
  });
  await test.step("calendar", async () => {
    await locators.calendar.input.fill("13.05.2021");
    await locators.calendar.button.click();
    await expect(locators.calendar.monthLabel).toHaveText("maj 2021");
  });
  await test.step("budget", async () => {
    await hakijaMuutoshakemusPage.clickHaenMuutostaTaloudenKayttosuunnitelmaan();
    await expect(locators.budget.expensesTotalTitle).toHaveText("Sammanlagt");
    await expect(
      locators.budget.taloudenKayttosuunnitelmanPerustelutLabel
    ).toHaveText("Motivering");
    const swedishBudgetRowNames = [
      "Personalkostnader",
      "Material, utrustning och varor",
      "Anskaffning av utrustning",
      "Tjänster",
      "Hyror",
      "Resekostnader",
      "Övriga kostnader",
    ];
    const rows = await locators.budget.budgetRows.allTextContents();
    expect(rows.sort()).toEqual(swedishBudgetRowNames.sort());
  });
  await test.step("submit muutoshakemus #1", async () => {
    await hakijaMuutoshakemusPage.fillTalousarvioValues(
      {
        ...budget.amount,
        personnel: "299",
        material: "421",
      },
      "Ny budgeten"
    );
    await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta();
    await hakijaMuutoshakemusPage.clickHaenKayttoajanPidennysta();
    await hakijaMuutoshakemusPage.fillJatkoaikaValues({
      jatkoaika: moment(new Date()).add(2, "days").locale("fi"),
      jatkoaikaPerustelu: "Dubbel dubbel-laa",
    });
    await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(
      "Ska få ta bort något akut .... koda något om något ois ta bort bit sit mo"
    );
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true, true);
    await expect(locators.budget.oldTitle).toHaveText("Nuvarande budget");
    await expect(locators.budget.changeTitle).toHaveText(
      "Den ansökta nya budgeten"
    );
  });
  const hakemustenArviointiPage = new HakemustenArviointiPage(page);
  await test.step("check virkailija has finnish text", async () => {
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    );
    await expect(locators.budget.oldTitle).toHaveText("Voimassaoleva budjetti");
    await expect(locators.budget.changeTitle).toHaveText(
      "Haettu uusi budjetti"
    );
    const muutosTabLocators =
      hakemustenArviointiPage.muutoshakemusTabLocators();
    await expect(muutosTabLocators.hakijaPerustelut).toHaveText(
      "Hakijan perustelut"
    );
  });
  await test.step("accept muutoshakemus #1 with changes", async () => {
    const acceptedBudget: BudgetAmount = {
      personnel: "1301",
      material: "1421",
      equipment: "2338",
      "service-purchase": "5312007",
      rent: "1068",
      steamship: "1000",
      other: "9999",
    };
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision(
      "accepted_with_changes",
      "01.01.2099"
    );
    await hakemustenArviointiPage.setMuutoshakemusBudgetDecision(
      "accepted_with_changes",
      acceptedBudget
    );
    await hakemustenArviointiPage.selectVakioperusteluInFinnish();
    await hakemustenArviointiPage.saveMuutoshakemus();
  });
  await test.step("hakija gets email", async () => {
    const email = await parseMuutoshakemusPaatosFromEmails(hakemusID);
    expect(email.subject).toBe(
      "Automatiskt meddelande: Er ändringsansökan har behandlats - Länk till beslutet"
    );
    expect(email["to-address"]).toContain(answers.contactPersonEmail);
    const { "register-number": registerNumber } =
      await getHakemusTokenAndRegisterNumber(hakemusID);
    expect(email.formatted).toBe(`Bästa mottagare,

er ändringsansökan har behandlats.

Projekt: ${registerNumber} - ${answers.projectName}

Beslut om ändringsansökan: ${email.linkToMuutoshakemusPaatos}

Se tidigare ändringsansökningar och gör vid behov en ny ändringsansökan: ${HAKIJA_URL}/muutoshakemus?lang=sv&user-key=${userKey}&avustushaku-id=${avustushakuID}

Bilaga: Rättelseyrkande

Mera information ges vid behov av kontaktpersonen som anges i beslutet.

Hälsningar,
_ valtionavustus

Utbildningsstyrelsen
Hagnäskajen 6
PB 380, 00531 Helsingfors

telefon 029 533 1000
fornamn.efternamn@oph.fi

`);
  });
  await test.step("hakija goes to muutoshakemus page", async () => {
    await hakijaMuutoshakemusPage.navigate(hakemusID);
    await expect(locators.budget.oldTitle).toHaveText("Den tidigare budgeten");
    await expect(locators.budget.changeTitle).toHaveText("Godkänd ny budget");
  });
});
