import {expect} from "@playwright/test"
import moment from "moment";

import {
  getAcceptedPäätösEmails, getLinkToHakemusFromSentEmails,
  getValmistelijaEmails,
  waitUntilMinEmails
} from "../../utils/emails";
import {clickElementWithText, expectToBeDefined} from "../../utils/util";
import {HAKIJA_URL, VIRKAILIJA_URL} from "../../utils/constants";
import {muutoshakemusTest as test} from "../../fixtures/muutoshakemusTest";
import {MuutoshakemusValues} from "../../utils/types";
import {HakemustenArviointiPage} from "../../pages/hakemustenArviointiPage";
import {HakijaMuutoshakemusPage} from "../../pages/hakijaMuutoshakemusPage";

const muutoshakemus1: MuutoshakemusValues = {
  jatkoaika: moment(new Date())
    .add(2, 'months')
    .add(1, 'days')
    .locale('fi'),
  jatkoaikaPerustelu: 'Ei kyl millään ehdi deadlineen mennessä ku mun koira söi ne tutkimustulokset'
}

test.setTimeout(180000)

test('When muutoshakemus enabled haku has been published, a hakemus has been submitted, and päätös has been sent', async ({
  page, avustushakuID, hakemus: {hakemusID}, context, hakuProps, answers
}) => {
  await test.step('hakija gets the correct email content', async () => {
    const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
    emails.forEach(email => {
      const emailContent = email.formatted
      expect(emailContent).toContain(`${HAKIJA_URL}/muutoshakemus`)
      expect(emailContent).toContain('Pääsette tekemään muutoshakemuksen sekä muuttamaan yhteyshenkilöä ja hänen yhteystietojaan koko hankekauden ajan tästä linkistä')
    })
  })
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await test.step('allows virkailija to edit the original hakemus', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.clickHakemus(hakemusID)
    await clickElementWithText(page, "button", "Muokkaa hakemusta")

    const [modificationPage] = await Promise.all([
      context.waitForEvent('page'),
      clickElementWithText(page, "button", "Siirry muokkaamaan")
    ])
    expect(await modificationPage.url()).toContain(`${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?hakemus=`)
    await modificationPage.close()
  })

  await test.step('submit muutoshakemus #1', async () => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus1)
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
  })

  await test.step('valmistelija gets an email', async () => {
    await test.step('with correct title', async () => {
      const emails = await waitUntilMinEmails(getValmistelijaEmails, 1, hakemusID)
      const title = emails[0]?.formatted.match(/Hanke:.*/)?.[0]
      expectToBeDefined(title)
      expect(title).toContain(`${hakuProps.registerNumber} - ${answers.projectName}`)
    })

    await test.step('with correct avustushaku link', async () => {
      const linkToHakemus = await getLinkToHakemusFromSentEmails(hakemusID)
      expect(linkToHakemus).toEqual(`${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
    })
  })

  await test.step('Virkailija navigates to avustushaku', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
  })

  await test.step('Muutoshakemus status is ☆ Uusi', async () => {
    const content = await hakemustenArviointiPage.muutoshakemusStatusFieldContent(hakemusID)
    expect(content).toEqual('☆ Uusi')
  })

  await test.step('click muutoshakemus status field', async () => {
    await hakemustenArviointiPage.clickMuutoshakemusStatusField(hakemusID)
  })

  await test.step('shows the number of pending muutoshakemus in red', async () => {
    const numOfMuutosHakemuksetElement = await page.waitForSelector('[data-test-id=number-of-pending-muutoshakemukset]:has-text("1")')
    const color = await page.evaluate(e => getComputedStyle(e).color, numOfMuutosHakemuksetElement)
    expect(color).toBe('rgb(255, 0, 0)') // red
  })

  await test.step('navigate to muutoshakemustab', async () => {
    await hakemustenArviointiPage.clickMuutoshakemusTab()
  })

  await test.step('Displays valid muutoshakemus values', async () => {
    await hakemustenArviointiPage.validateMuutoshakemusValues(muutoshakemus1)
  })
})
