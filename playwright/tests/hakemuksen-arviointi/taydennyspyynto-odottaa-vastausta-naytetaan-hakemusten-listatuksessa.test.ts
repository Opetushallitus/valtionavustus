import { expect } from "@playwright/test";
import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";

import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";

test("Täydennyspyyntö odottaa vastausta näytetään hakemusten listauksessa", async ({
  closedAvustushaku,
  page,
  submittedHakemus: { userKey },
  answers,
}, testInfo) => {
  expect(userKey).toBeDefined();
  const avustushakuID = closedAvustushaku.id;
  testInfo.setTimeout(testInfo.timeout + 25_000);

  const hakemustenArviointiPage = new HakemustenArviointiPage(page);

  await hakemustenArviointiPage.navigate(avustushakuID);

  await Promise.all([
    page.waitForNavigation(),
    page.click(`text=${answers.projectName}`),
  ]);
  const hakemusID = await hakemustenArviointiPage.getHakemusID();

  // Varmista että ennen täydennyspyyntöä hakemukselta ei odoteta täydennystä
  await hakemustenArviointiPage.navigate(avustushakuID);
  await expect(
    hakemustenArviointiPage.page.getByTestId(
      `taydennyspyynto-odottaa-vastausta-${hakemusID}`
    )
  ).toHaveCount(0);

  await Promise.all([
    page.waitForNavigation(),
    page.click(`text=${answers.projectName}`),
  ]);

  const täydennyspyyntöText =
    "Lisää turklesia ja turpaanvetoja; vähemmän koulutusuudistusta. Cowabungaa veli!!";
  await hakemustenArviointiPage.createChangeRequest(täydennyspyyntöText);

  // Hakemukselta odotetaan täydennystä ja se indikoidaan listauksessa
  await hakemustenArviointiPage.navigate(avustushakuID);
  await expect(
    hakemustenArviointiPage.page.getByTestId(
      `taydennyspyynto-odottaa-vastausta-${hakemusID}`
    )
  ).toHaveCount(1);
});
