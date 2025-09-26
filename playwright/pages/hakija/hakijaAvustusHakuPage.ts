import { expect, Page } from '@playwright/test'

import { navigateHakija } from '../../utils/navigate'
import { dummyExcelPath, TEST_Y_TUNNUS } from '../../utils/constants'
import { expectQueryParameter, expectToBeDefined } from '../../utils/util'
import { getHakemusUrlFromEmail, pollUntilNewHakemusEmailArrives } from '../../utils/emails'
import { Budget, fillBudget } from '../../utils/budget'
import { Answers, Signatory } from '../../utils/types'
import { getNormalizedHakemus } from '../../utils/hakemus'
import { HakijaHakemusMuokkausPage } from './hakijaHakemusMuokkausPage'

export function HakijaAvustusHakuPage(page: Page) {
  const locators = {
    sendHakemusButton: page.locator('#topbar #form-controls button#submit'),
    officerEditSubmitButton: page.locator('#virkailija-edit-submit'),
    previewContainer: page.locator('div.soresu-preview'),
    validationErrors: {
      haveErrorsButton: (amountOfErrors: number) =>
        page.getByRole('button', { name: `${amountOfErrors} vastauksessa puutteita` }),
      trustedContact: {
        name: page.getByTestId('trusted-contact-name'),
        email: page.getByTestId('trusted-contact-email'),
        phone: page.getByTestId('trusted-contact-phone'),
      },
    },
    form: {
      muutoshakuEnabledFields: {
        projectName: page.locator('#project-name'),
        applicantName: page.locator('#applicant-name'),
        primaryEmail: page.locator('#primary-email'),
        contactPhoneNumber: page.locator('#textField-0'),
      },
      trustedContact: {
        name: page.locator('#trusted-contact-name'),
        email: page.locator('#trusted-contact-email'),
        phone: page.locator('#trusted-contact-phone'),
      },
      bank: {
        iban: page.locator('#bank-iban'),
        bic: page.locator('#bank-bic'),
      },
    },
  }

  async function navigate(avustushakuID: number, lang: 'fi' | 'sv' | undefined) {
    await navigateHakija(page, `/avustushaku/${avustushakuID}/?lang=${lang ?? 'fi'}`)
  }

  async function navigateToExistingHakemusPage(avustushakuID: number, userKey: string) {
    await navigateHakija(page, `/avustushaku/${avustushakuID}/nayta?hakemus=${userKey}`)
  }

  async function getHakemusID(avustushakuID: number, userKey: string): Promise<number> {
    const normalizedHakemus = await getNormalizedHakemus(page, avustushakuID, userKey)
    return normalizedHakemus['hakemus-id']
  }

  async function navigateToYhteyshenkilöChangePage(
    avustushakuId: number,
    userKey: string,
    token: string,
    lang: 'fi' | 'sv' = 'fi'
  ) {
    await navigateHakija(
      page,
      `/avustushaku/${avustushakuId}/nayta?avustushaku=${avustushakuId}&hakemus=${userKey}&lang=${lang}&preview=false&token=${token}&refuse-grant=false&modify-application=true`
    )
    return HakijaHakemusMuokkausPage(page, lang)
  }

  async function selectFromDropdown(index: number, text: string) {
    await page.locator(`#koodistoField-${index}_input`).getByRole('textbox').fill(text)
    await page.press('body', 'ArrowDown')
    await page.press('body', 'Enter')
  }

  async function selectMaakuntaFromDropdown(text: string) {
    await selectFromDropdown(1, text)
  }

  async function selectKotikuntaFromDropdown(text: string) {
    await selectFromDropdown(0, text)
  }

  async function waitForEditSaved() {
    return page.waitForFunction(() =>
      document.querySelector('div.save-message')?.textContent?.includes('Tallennettu')
    )
  }

  async function waitForPreview() {
    return locators.previewContainer.waitFor()
  }

  async function submitOfficerEdit() {
    await locators.officerEditSubmitButton.click()
    await waitForPreview()
  }

  async function submitChangeRequestResponse() {
    await page.click('#change-request-response')
    await waitForPreview()
  }

  async function submitApplication() {
    await locators.sendHakemusButton.click()
    const button = page
      .getByRole('button', { name: 'Hakemus lähetetty' })
      .or(page.getByRole('button', { name: 'Ansökan sänd' }))
    await expect(button).toBeVisible()
    return { userKey: await getUserKey() }
  }

  async function startApplication(avustushakuID: number, contactPersonEmail: string) {
    await expect(page.locator('#haku-not-open')).toBeHidden()
    await locators.form.muutoshakuEnabledFields.primaryEmail.fill(contactPersonEmail)
    await page.click('#submit')

    const receivedEmail = await pollUntilNewHakemusEmailArrives(avustushakuID, contactPersonEmail)
    const hakemusUrl = getHakemusUrlFromEmail(receivedEmail[0])
    expectToBeDefined(hakemusUrl)
    return hakemusUrl
  }

  async function fillInBusinessId(businessId: string) {
    await page.fill('#finnish-business-id', businessId)
    await page.click('input.get-business-id')
  }

  const fillSignatories = async (signatories: Signatory[]) => {
    for (const [index, signatory] of signatories.entries()) {
      const nameSelector = `[id='signatories-fieldset-${index + 1}.name']`
      const emailSelector = `[id='signatories-fieldset-${index + 1}.email']`

      await page.fill(nameSelector, signatory.name)
      await page.fill(emailSelector, signatory.email)
    }
  }

  async function fillMuutoshakemusEnabledHakemus(answers: Answers, beforeSubmitFn?: () => void) {
    const lang = answers.lang || 'fi'

    const getSignatoriesOrDefault = () => {
      if (!answers.signatories || answers.signatories.length < 1) {
        return [
          {
            name: 'Erkki Esimerkki',
            email: answers.contactPersonEmail,
          },
        ]
      }

      return answers.signatories
    }

    await fillSignatories(getSignatoriesOrDefault())

    await page
      .getByText(
        lang === 'fi'
          ? 'Kunta/kuntayhtymä, kunnan omistamat yhtiöt, kirkko'
          : 'Kommun/samkommun, kommunalt ägda bolag, kyrkan'
      )
      .click()

    await page.click("[id='koodistoField-1_input']")
    await selectMaakuntaFromDropdown(lang === 'fi' ? 'Kainuu' : 'Åland')
    await selectKotikuntaFromDropdown(lang === 'fi' ? 'Sotkamo' : 'Mariehamn')
    await locators.form.bank.iban.fill('FI95 6682 9530 0087 65')
    await locators.form.bank.bic.fill('OKOYFIHH')
    await page.fill('#textField-2', '2')
    await page.fill('#textField-1', '20')
    await page.fill('#project-nutshell', 'Projekti pähkinänkuoressa')
    await page.fill('#project-name', answers.projectName)
    await page.click(`[for='language.radio.${lang === 'sv' ? 1 : 0}']`)
    await page.click("[for='checkboxButton-0.checkbox.0']")
    await page
      .getByText(lang === 'fi' ? 'Opetuksen lisääminen' : 'Ordnande av extra undervisning')
      .click()
    await page.fill(
      "[id='project-description.project-description-1.goal']",
      'Tarvitsemme kuutio tonneittain rahaa jotta voimme kylpeä siinä.'
    )
    await page.fill(
      "[id='project-description.project-description-1.activity']",
      'Kylvemme rahassa ja rahoitamme rahapuita.'
    )
    await page.fill(
      "[id='project-description.project-description-1.result']",
      'Koko budjetti käytetään ja lisää aiotaan hakea.'
    )
    await page.fill(
      "[id='project-effectiveness']",
      'Hanke vaikuttaa ylempään ja keskikorkeaan johtoportaaseen.'
    )
    await page.fill("[id='project-begin']", '13.03.1992')
    await page.fill("[id='project-end']", '13.03.2032')
    await page.click("[for='vat-included.radio.0']")
    await page.fill("[id='personnel-costs-row.description']", 'Pieninä seteleinä kiitos.')
    await page.fill("[id='personnel-costs-row.amount']", '6942066')
    await page.fill("[id='self-financing-amount']", '1')

    if (answers.hakemusFields?.length) {
      await Promise.all(
        answers.hakemusFields.map(async ({ fieldId, answer, isFileAttachment }) => {
          if (isFileAttachment) {
            await page.setInputFiles(`#${fieldId} [type="file"]`, answer)
          } else {
            await page.fill(`#${fieldId}`, answer)
          }
        })
      )
    }

    if (beforeSubmitFn) {
      await beforeSubmitFn()
    }

    const submit = page.locator('#submit')
    await expect(submit).toBeVisible()
    await expect(submit).toBeEnabled()
  }

  async function fillApplication(answers: Answers, businessId: string | null) {
    if (businessId) {
      await fillInBusinessId(businessId)
    }

    const { applicantName, contactPhoneNumber, projectName } = locators.form.muutoshakuEnabledFields
    await projectName.fill(answers.projectName)
    await applicantName.fill(answers.contactPersonName)
    await contactPhoneNumber.fill(answers.contactPersonPhoneNumber)
  }

  async function startAndFillApplication(answers: Answers, avustushakuID: number) {
    const hakemusUrl = await startApplication(avustushakuID, answers.contactPersonEmail)
    await page.goto(hakemusUrl)
    await fillApplication(answers, TEST_Y_TUNNUS)
  }

  async function fillAndSendHakemus(avustushakuID: number, answers: Answers) {
    await startAndFillApplication(answers, avustushakuID)

    const { projectName } = locators.form.muutoshakuEnabledFields
    await projectName.fill(answers.projectName)
  }

  /** @deprecated Use fillAndSendHakemus with corresponding answers */
  async function fillAndSendMuutoshakemusEnabledHakemus(
    avustushakuID: number,
    answers: Answers,
    beforeSubmitFn?: () => void
  ) {
    await startAndFillApplication(answers, avustushakuID)
    await fillMuutoshakemusEnabledHakemus(answers, beforeSubmitFn)
    const { userKey } = await submitApplication()
    return { userKey }
  }

  async function getUserKey(): Promise<string> {
    return await expectQueryParameter(page, 'hakemus')
  }

  /** @deprecated Use fillAndSendHakemus with corresponding answers */
  async function fillKoulutusosioHakemus(
    avustushakuID: number,
    answers: Answers,
    osioType: 'koulutuspäivä' | 'opintopiste'
  ) {
    await startAndFillApplication(answers, avustushakuID)

    await page.fill('#textField-2', 'Hakaniemenranta 6')
    await page.fill('#textField-3', '00531')
    await page.fill('#textField-4', 'Helsinki')
    await page
      .locator(`label:has-text("Kunta/kuntayhtymä, kunnan omistamat yhtiöt, kirkko")`)
      .click()
    await page.click("[id='koodistoField-1_input']")
    await selectMaakuntaFromDropdown('Kainuu')
    await page.fill("[id='signatories-fieldset-1.name']", 'Erkki Esimerkki')
    await page.fill("[id='signatories-fieldset-1.email']", 'erkki.esimerkki@example.com')
    await locators.form.bank.iban.fill('FI95 6682 9530 0087 65')
    await locators.form.bank.bic.fill('OKOYFIHH')
    await page.fill('#textField-5', 'Kirkko')
    await page.fill('#project-name', answers.projectName)
    await page.click(`[for='language.radio.0']`)
    await page.click(`[for='combined-effort.radio.0']`)
    await page.locator(`label:has-text("Yhteistyökumppanin nimi")`).first().fill('Esmo Esimerkki')
    await page.locator(`label:has-text("Yhteyshenkilön nimi")`).first().fill('Esmo Esimerkki')
    await page
      .locator(`label:has-text("Yhteyshenkilön sähköposti")`)
      .first()
      .fill('esmo.esimerkki@example.com')
    await page
      .locator(
        `label:has-text("Oppilaan ja opiskelijan arviointiin liittyvän osaamisen vahvistaminen")`
      )
      .click()
    await page
      .locator(
        `label:has-text("Hakijayhteisön osaaminen ja kokemus opetustoimen henkilöstökoulutuksesta (kuvaile lyhyesti)")`
      )
      .fill('Kuvailu')
    await page
      .locator(
        `label:has-text("Koulutushankkeen kouluttajat, heidän osaamisensa ja kokemuksensa opetustoimen henkilöstökoulutuksesta")`
      )
      .fill('Ei kokemusta')
    await page.locator(`[for="checkboxButton-1.checkbox.7"]`).click()
    await page.locator(`[for="radioButton-2.radio.6"]`).click()
    await page.getByLabel('Hanke pähkinänkuoressa').fill('{Hanke}')
    await page
      .getByLabel(
        'Kirjoita seuraavaan kenttään kolme koulutuksen sisältöä kuvaavaa asiasanaa tai sanaparia.'
      )
      .fill('testi1 testi2 testi3')
    await page
      .getByLabel('Miksi hanke tarvitaan? Miten koulutustarve on kartoitettu?')
      .fill('testaamaan koulutusosio toiminnallisuutta')
    await page
      .getByLabel('Hankkeen tavoitteet, toteutustapa ja tulokset')
      .fill('koulutusosiot toimii')
    await page
      .getByLabel('Hankkeen osapuolet ja työnjako')
      .fill('testikirjasto tekee kaiken paitsi testin kirjoittamisen')
    await page.getByLabel('Toteuttamispaikkakunnat').fill('muu')
    await page.getByLabel('Miten osallistujat rekrytoidaan koulutukseen?').fill('inspiroidaan')
    await page.getByLabel('Miten hankkeen tavoitteiden toteutumista seurataan?').fill('testaamalla')
    await page
      .getByLabel('Hankkeessa syntyvät tuotokset ja materiaalit sekä niiden levittämissuunnitelma')
      .fill('en tiedä vielä')
    await page.getByLabel('Koulutusosion nimi').first().fill('Osio 1')
    await page.fill('[id="koulutusosiot.koulutusosio-1.keskeiset-sisallot"]', 'Keskeinen sisältö')
    await page.getByLabel('Kohderyhmät').first().fill('Kaikki')
    if (osioType === 'koulutuspäivä') {
      await page
        .locator(`[for="koulutusosiot.koulutusosio-1.koulutettavapaivat.scope-type.radio.1"]`)
        .click()
    }
    await page.locator(`[id="koulutusosiot.koulutusosio-1.koulutettavapaivat.scope"]`).fill('99')
    await page
      .locator(`[id="koulutusosiot.koulutusosio-1.koulutettavapaivat.person-count"]`)
      .fill('10')
    const koulutusTd = page.locator(`table[id="koulutusosiot.koulutusosio-1.saametable"] td input`)
    await koulutusTd.nth(0).fill('33')
    await koulutusTd.nth(1).fill('33')
    await koulutusTd.nth(2).fill('33')
    await page.locator("[name='namedAttachment-0']").setInputFiles(dummyExcelPath)
    await page.locator(`[for="vat-included.radio.1"]`).click()
    await page.locator(`[id="personnel-costs-row.amount"]`).fill('1000')
    await page.locator(`[id="own-income-row.description"]`).fill('Oma osuus')
    await page.locator(`[id="own-income-row.amount"]`).fill('500')
  }

  /** @deprecated Use fillAndSendHakemus with corresponding answers */
  async function fillBudjettimuutoshakemusEnabledHakemus(
    avustushakuID: number,
    answers: Answers,
    budget: Budget
  ) {
    const lang = answers.lang || 'fi'
    await startAndFillApplication(answers, avustushakuID)
    await page.fill("[id='signatories-fieldset-1.name']", 'Erkki Esimerkki')
    await page.fill("[id='signatories-fieldset-1.email']", 'erkki.esimerkki@example.com')
    await page
      .getByText(
        lang === 'fi'
          ? 'Kunta/kuntayhtymä, kunnan omistamat yhtiöt, kirkko'
          : 'Kommun/samkommun, kommunalt ägda bolag, kyrkan'
      )
      .click()
    await page.click("[id='koodistoField-1_input']")
    await selectMaakuntaFromDropdown(lang === 'fi' ? 'Kainuu' : 'Åland')
    await locators.form.bank.iban.fill('FI95 6682 9530 0087 65')
    await locators.form.bank.bic.fill('OKOYFIHH')
    await page.fill('#textField-2', '2')
    await page.fill('#textField-1', '20')
    await page.fill('#project-name', answers.projectName)
    await page.click(`[for='language.radio.${lang === 'sv' ? 1 : 0}']`)
    await page.click("[for='checkboxButton-0.checkbox.0']")
    await page
      .getByText(lang === 'fi' ? 'Opetuksen lisääminen' : 'Ordnande av extra undervisning')
      .click()
    await page.fill(
      "[id='project-description.project-description-1.goal']",
      'Jonain päivänä teemme maailman suurimman aallon.'
    )
    await page.fill(
      "[id='project-description.project-description-1.activity']",
      'Teemme aaltoja joka dailyssa aina kun joku on saanut tehtyä edes jotain.'
    )
    await page.fill(
      "[id='project-description.project-description-1.result']",
      'Hankkeeseen osallistuneiden hartiat vetreytyvät suunnattomasti.'
    )
    await page.fill(
      "[id='project-effectiveness']",
      'Käsienheiluttelu kasvaa suhteessa muuhun tekemiseen huomattavasti'
    )
    await page.fill("[id='project-begin']", '13.03.1992')
    await page.fill("[id='project-end']", '13.03.2032')
    await page.click('[for="vat-included.radio.0"]')

    if (answers.organization) {
      await page.fill('#organization', answers.organization)
    }

    await fillBudget(page, budget, 'hakija')
  }

  return {
    page,
    ...locators,
    fillApplication,
    fillAndSendHakemus,
    fillAndSendMuutoshakemusEnabledHakemus,
    fillBudjettimuutoshakemusEnabledHakemus,
    fillInBusinessId,
    fillKoulutusosioHakemus,
    fillMuutoshakemusEnabledHakemus,
    fillSignatories,
    getUserKey,
    getHakemusID,
    navigate,
    navigateToExistingHakemusPage,
    navigateToYhteyshenkilöChangePage,
    selectMaakuntaFromDropdown,
    startAndFillApplication,
    startApplication,
    submitApplication,
    submitChangeRequestResponse,
    submitOfficerEdit,
    waitForEditSaved,
    waitForPreview,
  }
}
