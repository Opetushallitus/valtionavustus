import { Page } from "@playwright/test";
import { HakuProps} from "../../pages/hakujenHallintaPage";
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage";

export async function alustaAvustushaunTaytto(page: Page, hakuProps: HakuProps) {

  const hakujenHallintaPage = new HakujenHallintaPage(page);

  const { avustushakuName, registerNumber } = hakuProps;
  console.log(`Avustushaku name for test: ${avustushakuName}`);

  const avustushakuID = await hakujenHallintaPage.copyEsimerkkihaku();

  await page.waitForLoadState("networkidle");
  console.log(`Avustushaku ID: ${avustushakuID}`);

  await page.fill("#register-number", registerNumber);
  await page.fill("#haku-name-fi", avustushakuName);
  await page.fill("#haku-name-sv", avustushakuName + " på svenska");

  if (hakuProps.vaCodes) {
    await hakujenHallintaPage.selectCode(
      "operational-unit",
      hakuProps.vaCodes.operationalUnit
    );
    await hakujenHallintaPage.selectCode(
      "operation",
      hakuProps.vaCodes.operation
    );
  }
  return hakujenHallintaPage;
}

