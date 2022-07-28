import { defaultValues as test } from "../../fixtures/defaultValues";

import { alustaAvustushaunTaytto } from "./multiple-projects-util";

import { expectToBeDefined } from "../../utils/util";

test("Vahintaan yksi projekti pitaa valita", async ({
  page,
  hakuProps,
  userCache,
}, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 40_000);
  expectToBeDefined(userCache);

  const hakujenHallintaPage = await alustaAvustushaunTaytto(page, hakuProps);

  await page.fill("#haku-name-fi", hakuProps.avustushakuName + "-lisays");

  await Promise.all([
    page.locator("text=Tallennetaan").waitFor(),
    page.locator("text=Jossain kentässä puutteita. Tarkasta arvot.").waitFor(),
  ]);

  const firstProjectToSelect = hakuProps.vaCodes.project[1];

  await hakujenHallintaPage.selectProject(firstProjectToSelect);

  await Promise.all([
    page.locator("text=Tallennetaan").waitFor(),
    page.locator("text=Kaikki tiedot tallennettu").waitFor(),
  ]);
});
