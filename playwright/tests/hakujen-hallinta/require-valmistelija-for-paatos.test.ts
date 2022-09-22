import { expect, PlaywrightTestArgs } from "@playwright/test";
import {
  MuutoshakemusFixtures,
  muutoshakemusTest,
} from "../../fixtures/muutoshakemusTest";
import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import {
  HakujenHallintaPage,
  Installment,
} from "../../pages/hakujenHallintaPage";
import { DefaultValueFixtures } from "../../fixtures/defaultValues";
import { lastElementFromArray } from "../../utils/util";

type TestArgs = PlaywrightTestArgs &
  DefaultValueFixtures &
  MuutoshakemusFixtures;

const testSendingPaatos = async ({
  page,
  closedAvustushaku: { id: avustushakuID },
  answers,
  ukotettuValmistelija,
  codes,
}: TestArgs) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page);
  await hakemustenArviointiPage.navigate(avustushakuID);
  const hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
    avustushakuID,
    projectName: answers.projectName,
    projektikoodi: lastElementFromArray(codes.project),
  });
  const hakujenHallintaPage = new HakujenHallintaPage(page);
  await hakujenHallintaPage.navigateFromHeader();
  await hakujenHallintaPage.resolveAvustushaku();
  await hakemustenArviointiPage.navigate(avustushakuID);
  const paatosLocators = await hakujenHallintaPage.navigateToPaatos(
    avustushakuID
  );
  await expect(paatosLocators.paatosSendError).toBeHidden();
  await paatosLocators.sendPaatokset().click();
  await paatosLocators.confirmSending.click();
  await expect(paatosLocators.paatosSendError).toHaveText(
    `Hakemukselle numero ${hakemusID} ei ole valittu valmistelijaa. Päätöksiä ei lähetetty.`
  );
  await hakemustenArviointiPage.navigate(avustushakuID);
  await hakemustenArviointiPage.selectValmistelijaForHakemus(
    hakemusID,
    ukotettuValmistelija
  );
  await hakujenHallintaPage.navigateToPaatos(avustushakuID);
  await hakujenHallintaPage.sendPaatos(avustushakuID);
};

const singleTest = muutoshakemusTest.extend({
  hakuProps: async ({ hakuProps }, use) => {
    await use({ ...hakuProps, installment: Installment.OneInstallment });
  },
});

singleTest("require valmistelija when single maksuerä", testSendingPaatos);

const multipleTest = muutoshakemusTest.extend({
  hakuProps: async ({ hakuProps }, use) => {
    await use({ ...hakuProps, installment: Installment.MultipleInstallments });
  },
});

multipleTest("require valmistelija when multiple maksuerä", testSendingPaatos);
