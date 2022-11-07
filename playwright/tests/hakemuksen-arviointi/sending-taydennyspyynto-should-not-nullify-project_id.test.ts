import { HakemustenArviointiPage } from "../../pages/hakemustenArviointiPage";
import { submittedHakemusTest } from "../../fixtures/muutoshakemusTest";
import { expectToBeDefined } from "../../utils/util";
import { VIRKAILIJA_URL } from "../../utils/constants";
import { expect } from "@playwright/test";

submittedHakemusTest(
  "Sending täydennyspyyntö does not nullify project_id from hakemus",
  async ({ page, avustushakuID, closedAvustushaku, projektikoodi }) => {
    expectToBeDefined(closedAvustushaku.id);

    const arviointiPage = new HakemustenArviointiPage(page);
    await arviointiPage.navigateToLatestHakemusArviointi(avustushakuID);
    const hakemusID = await arviointiPage.getHakemusID();

    await arviointiPage.fillTäydennyspyyntöField(
      "Voisitko täydentää hakemukseesi tiedot tilattavista pitsoista ja nunchakuista"
    );
    await arviointiPage.clickToSendTäydennyspyyntö(avustushakuID, hakemusID);

    const response = await page.request.get(
      `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/project`
    );
    const project: ProjectResponse = await response.json();

    expect(typeof project.id).toBe("number");
    expect(project.id).toBeGreaterThan(1);
    expect(project.code).toBe(projektikoodi);
  }
);

interface ProjectResponse {
  id: number;
  "value-type": string;
  year: number;
  code: string;
  "code-value": string;
  hidden: boolean | undefined;
}
