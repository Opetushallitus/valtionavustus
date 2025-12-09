import { Locator, expect } from '@playwright/test'
import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import SelvitysTab from '../../../pages/virkailija/hakujen-hallinta/CommonSelvitysPage'
import { getLoppuselvitysMuistutusviestiEmails, waitUntilMinEmails } from '../../../utils/emails'
import moment from 'moment'
import { HAKIJA_URL } from '../../../utils/constants'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'

test('virkailija can send muistutusviesti for loppuselvitys', async ({
  page,
  answers,
  acceptedHakemus: { hakemusID, userKey },
  hakuProps,
  avustushakuID,
}) => {
  const subject = 'Akaan kaupungin loppuselvitys muistutus'
  const content = 'Hei! Muistattehan täyttää kaikki kentät?'
  const additionalReceiver = 'karri@kojootti.dog'
  await SelvitysTab(page, 'loppu').navigateToLoppuselvitysTab(avustushakuID, hakemusID)
  const loppuselvitysPage = LoppuselvitysPage(page)
  await loppuselvitysPage.locators.muistutusviesti.open.click()
  const header = `Hyvä vastaanottaja,

tämä viesti koskee avustusta: 1/${hakuProps.registerNumber} ${answers.projectName}`
  const footer = `Loppuselvityslomakkeenne: ${HAKIJA_URL}/avustushaku/${avustushakuID}/loppuselvitys?hakemus=${userKey}

Korkolaskuri ja palautusohjeet: https://www.oph.fi/fi/yleisia-ohjeita-valtionavustusten-hakijoille-ja-kayttajille

Tarvittaessa tarkempia lisätietoja voi kysyä viestin lähettäjältä.

Ystävällisin terveisin,
_ valtionavustus
santeri.horttanainen@reaktor.com`

  await test.step('muistutusviesti on esitäytetty oikein', async () => {
    await expect(loppuselvitysPage.locators.muistutusviesti.subject).toHaveValue(
      `Viesti Opetushallituksen avustuksen palauttamattomaan loppuselvitykseen liittyen: 1/${hakuProps.registerNumber} ${answers.projectName}`
    )
    await expect(loppuselvitysPage.locators.muistutusviesti.header).toHaveText(header)
    await expect(page.getByTestId('muistutusviesti-email-content'))
      .toHaveValue(`Valtionavustusjärjestelmämme mukaan loppuselvityksenne on pyynnöstä huolimatta palauttamatta.

Valtionavustuksen saajan on annettava avustuspäätöksen ehtojen noudattamisen valvomiseksi oikeat ja riittävät tiedot loppuselvityksessä. Valtionavustus voidaan periä takaisin, jos loppuselvitystä ei ole palautettu. (Valtionavustuslaki 688/2001, § 14 ja § 22.)

Loppuselvitys tulee palauttaa Opetushallituksen sähköiseen valtionapujärjestelmään mahdollisimman pian, kuitenkin viimeistään 21 vuorokauden kuluessa. Vaihtoehtoisesti avustuksen saajan tulee palauttaa koko avustus ja sen korot omaehtoisesti 21 vuorokauden kuluessa.

`)
    await expect(loppuselvitysPage.locators.muistutusviesti.footer).toHaveText(footer)
  })
  await test.step('virkailija voi muokata viestiä', async () => {
    const form = page.getByTestId('muistutusviesti-email').locator('form')

    await loppuselvitysPage.locators.muistutusviesti.addReceiver.click()
    await loppuselvitysPage.locators.muistutusviesti.nthReceiver(2).fill(additionalReceiver)
    await loppuselvitysPage.locators.muistutusviesti.subject.fill('')
    await loppuselvitysPage.locators.muistutusviesti.content.fill(content)
    await expect.poll(() => isValid(form), 'Form should be invalid').toBeFalsy()
    await loppuselvitysPage.locators.muistutusviesti.subject.fill(subject)
    await expect
      .poll(() => isValid(form), 'Form should be valid after filling subject and content')
      .toBeTruthy()
    await loppuselvitysPage.locators.muistutusviesti.preview.click()
    await loppuselvitysPage.locators.muistutusviesti.send.click()
  })

  await test.step('muistutusviesti email is sent', async () => {
    const emails = await waitUntilMinEmails(getLoppuselvitysMuistutusviestiEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)

    const email = emails[0]
    expect(email.subject).toEqual(subject)
    expect(email.formatted).toEqual(`${header}

${content}

${footer}`)
    expect(email.bcc).toBeNull()
    expect(email.cc).toEqual([])
    expect(email['reply-to']).toBe('santeri.horttanainen@reaktor.com')
    expect(email['to-address']).toEqual([
      'hakija-1424884@oph.fi',
      answers.contactPersonEmail,
      additionalReceiver,
    ])
  })

  await test.step('sent muistutusviesti is shown in list', async () => {
    await expect(
      page.getByTestId('hakemus-details-loppuselvitys').getByText(formatDate(new Date()))
    ).toBeVisible()
    await page.getByTestId('open-email-0').click()
    await expect(
      page.getByText(
        'Vastaanottajathakija-1424884@oph.fi, erkki.esimerkki@example.com, karri@kojootti.dog'
      )
    ).toBeVisible()
    await expect(page.getByText(`Aihe${subject}`)).toBeVisible()
    await expect(page.getByText(content)).toBeVisible()
  })
})

moment.locale('fi')

const formatDate = (date: Date) => {
  return `${moment(date).format('DD.MM.YYYY')}`
}
function isValid(locator: Locator): Promise<boolean> {
  return locator.evaluate((elem: HTMLFormElement) => elem.checkValidity())
}
