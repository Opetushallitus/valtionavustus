import { muutoshakemusTest } from "../../fixtures/muutoshakemusTest";
import { MaksatuksetPage } from "../../pages/maksatuksetPage";
import { expect } from "@playwright/test";
import {
  getAllMaksatuksetFromMaksatuspalvelu,
  putMaksupalauteToMaksatuspalveluAndProcessIt,
  removeStoredPitkäviiteFromAllAvustushakuPayments,
} from "./maksatukset.test";
import { getHakemusTokenAndRegisterNumber } from "../../utils/emails";

const test = muutoshakemusTest.extend({
  hakuProps: async ({ hakuProps }, use) => {
    await use({
      ...hakuProps,
      legacyRahoitusalueet: [
        {
          koulutusaste: "Ammatillinen koulutus",
          talousarviotili: "29.10.30.20",
        },
      ],
    });
  },
});
test("legacy rahoitusaste works", async ({
  page,
  avustushakuID,
  avustushakuName,
  acceptedHakemus: { hakemusID },
  codes: { project, operation, operationalUnit },
}) => {
  const maksatuksetPage = MaksatuksetPage(page);
  await maksatuksetPage.goto(avustushakuName);
  const dueDate = await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset();

  await removeStoredPitkäviiteFromAllAvustushakuPayments(avustushakuID);
  await maksatuksetPage.reloadPaymentPage();
  const sentPayments = await maksatuksetPage.clickLahetetytMaksatuksetTab();
  const { "register-number": registerNumber } =
    await getHakemusTokenAndRegisterNumber(hakemusID);
  const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`;
  const tatili = "29103020";
  await expect(sentPayments(1).getTAKP()).toHaveText(tatili);
  await putMaksupalauteToMaksatuspalveluAndProcessIt(`
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `);
  await maksatuksetPage.reloadPaymentPage();
  const sentPaymentsAfterMaksupalaute =
    await maksatuksetPage.clickLahetetytMaksatuksetTab();
  const statuses = sentPaymentsAfterMaksupalaute(1);
  expect(await statuses.getPaymentStatus()).toEqual("Maksettu");
  const maksatukset = await getAllMaksatuksetFromMaksatuspalvelu();
  expect(maksatukset).toContainEqual(
    maksatuksetPage.getExpectedPaymentXML({
      projekti: project[1],
      toiminto: operation,
      toimintayksikko: operationalUnit,
      pitkaviite,
      invoiceNumber: `${registerNumber}_1`,
      dueDate,
      talousarviotili: tatili,
    })
  );
});
