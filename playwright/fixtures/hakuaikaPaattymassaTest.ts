import {hakemusTest} from "./hakemusTest";
import {HakijaAvustusHakuPage} from "../pages/hakijaAvustusHakuPage";
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage";
import {randomString} from "../../test/test-util";
import {MuutoshakemusFixtures} from "./muutoshakemusTest";

export interface HakuaikaPaattymassaFixtures extends MuutoshakemusFixtures{
  hakemusDetails: {
    email: string
  }
}

export const hakuaikaPaattymassaTest = hakemusTest.extend<HakuaikaPaattymassaFixtures>({
  avustushakuID: async ({codes, page, haku}, use) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(haku.registerNumber, haku.avustushakuName, codes)
    await hakujenHallintaPage.setAvustushakuEndDateToTomorrow()
    await use(avustushakuID)
  },
  hakemusDetails: async ({avustushakuID, page, answers}, use) => {
    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const randomEmail = `${randomString()}@example.com`
    const {contactPersonEmail, ...answersWithoutEmail} = answers
    const answersWithRandomEmail = {contactPersonEmail: randomEmail, ...answersWithoutEmail}
    await hakijaAvustusHakuPage.fillMuutoshakemusEnabledHakemus(avustushakuID, answersWithRandomEmail)
    await use({email: randomEmail})
  }
})
