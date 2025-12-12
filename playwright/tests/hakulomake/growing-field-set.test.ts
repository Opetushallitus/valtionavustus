import { defaultValues } from '../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { expectToBeDefined } from '../../utils/util'
import { Page, expect } from '@playwright/test'
import { TEST_Y_TUNNUS } from '../../utils/constants'

const form = {
  content: [
    {
      fieldClass: 'wrapperElement',
      id: 'applicant-fieldset',
      fieldType: 'fieldset',
      children: [
        {
          fieldClass: 'wrapperElement',
          id: 'organization-fieldset',
          fieldType: 'fieldset',
          children: [
            {
              label: {
                fi: 'Hakijaorganisaatio',
                sv: 'Sökandeorganisation',
              },
              fieldClass: 'formField',
              helpText: {
                fi: 'Ilmoita hakijaorganisaation nimi ja virallinen sähköpostiosoite.',
                sv: 'Meddela sökandeorganisationens namn och officiella e-postadress.',
              },
              id: 'organization',
              params: {
                size: 'large',
                maxlength: 80,
              },
              required: true,
              fieldType: 'textField',
            },
            {
              label: {
                fi: 'Organisaation sähköposti',
                sv: 'Organisationens e-post',
              },
              fieldClass: 'formField',
              helpText: {
                fi: '',
                sv: '',
              },
              id: 'organization-email',
              params: {
                size: 'small',
                maxlength: 80,
              },
              required: true,
              fieldType: 'emailField',
            },
          ],
        },
        {
          label: {
            fi: 'Y-tunnus',
            sv: 'Företags- och organisationsnummer',
          },
          fieldClass: 'formField',
          helpText: {
            fi: '',
            sv: '',
          },
          id: 'business-id',
          params: {
            size: 'small',
            maxlength: 9,
          },
          required: true,
          fieldType: 'finnishBusinessIdField',
        },
        {
          label: {
            fi: 'Yhteyshenkilö',
            sv: 'Kontaktperson',
          },
          fieldClass: 'formField',
          helpText: {
            fi: 'Yhteyshenkilöllä tarkoitetaan hankkeen vastuuhenkilöä.',
            sv: 'Med kontaktperson avses den projektansvariga i sökandeorganisationen.',
          },
          id: 'applicant-name',
          params: {
            size: 'large',
            maxlength: 80,
          },
          required: true,
          fieldType: 'textField',
        },
        {
          label: {
            fi: 'Sähköposti',
            sv: 'E-post',
          },
          fieldClass: 'formField',
          helpText: {
            fi: '',
            sv: '',
          },
          id: 'primary-email',
          params: {
            size: 'small',
            maxlength: 80,
          },
          required: true,
          fieldType: 'vaEmailNotification',
        },
        {
          label: {
            fi: 'Puhelinumero',
            sv: 'Telefon',
          },
          fieldClass: 'formField',
          helpText: {
            fi: '',
            sv: '',
          },
          id: 'textField-0',
          params: {
            size: 'small',
            maxlength: 15,
          },
          required: true,
          fieldType: 'textField',
        },
      ],
    },
    {
      fieldClass: 'infoElement',
      id: 'name',
      fieldType: 'h1',
    },
    {
      fieldClass: 'wrapperElement',
      id: 'project-description',
      fieldType: 'growingFieldset',
      children: [
        {
          fieldClass: 'wrapperElement',
          id: 'project-description-1',
          fieldType: 'growingFieldsetChild',
          children: [
            {
              label: {
                fi: 'Tavoite',
                sv: 'Mål',
              },
              fieldClass: 'formField',
              helpText: {
                fi: 'Kuvaa hankkeen tavoite ja siihen liittyvä toiminta sekä budjetti avustuskohteittain. Kirjoita molemmista avustuskohteista omat kuvaukset.',
                sv: 'Beskriv projektets mål och tillhörande verksamhet samt budgeten för ansökningsområdena. Ge separata beskrivningar för bägge ansökningsområdena.',
              },
              id: 'project-description.project-description-1.goal',
              params: {
                size: 'small',
                maxlength: 800,
              },
              required: true,
              fieldType: 'textArea',
            },
            {
              label: {
                fi: 'Toiminta',
                sv: 'Verksamhet',
              },
              fieldClass: 'formField',
              helpText: {
                fi: '',
                sv: '',
              },
              id: 'project-description.project-description-1.activity',
              params: {
                size: 'small',
                maxlength: 800,
              },
              required: true,
              fieldType: 'textArea',
            },
            {
              label: {
                fi: 'Budjetti',
                sv: 'Budget',
              },
              fieldClass: 'formField',
              helpText: {
                fi: 'Erittely siitä, mistä kustannukset muodostuvat (laskentaperusteena tuntimäärä/kurssimäärä x tunnin/kurssin hinta). Vie opetuksen lisäämistä koskeva summa talousarvion kohtaan Henkilöstömenot 1 ja ohjauksen ja tukitoimien lisäämistä koskeva summa kohtaan Henkilöstömenot 2.',
                sv: 'Specificera hur kostnaderna bildas (som beräkningsgrund används antal undervisningstimmar/antal kurser x priset per timme/kurs). För in summan som berör extra undervisning i budgeten under Personalkostnader 1 och summan som berör extra handledning och stödåtgärder under Personalkostnader 2.',
              },
              id: 'project-description.project-description-1.result',
              params: {
                size: 'small',
                maxlength: 800,
              },
              required: true,
              fieldType: 'textArea',
            },
          ],
        },
      ],
      params: {
        showOnlyFirstLabels: false,
      },
      label: {
        fi: 'Hankkeen tavoitteet, toiminta ja budjetti',
        sv: 'Projektets mål, verksamhet och budget',
      },
    },
  ],
  rules: [],
  created_at: '2023-01-23T06:57:30Z',
  updated_at: '2023-01-23T08:40:36Z',
}

const formJsonString = JSON.stringify(form)

const growingFieldSet = (page: Page, index: number) => {
  const indexStartsFromOne = index + 1
  const baseLocator = page.locator(`[id="project-description-${indexStartsFromOne}"]`)
  return {
    tavoite: baseLocator.locator(
      `[id="project-description.project-description-${indexStartsFromOne}.goal"]`
    ),
    toiminta: baseLocator.locator(
      `[id="project-description.project-description-${indexStartsFromOne}.activity"]`
    ),
    tulos: baseLocator.locator(
      `[id="project-description.project-description-${indexStartsFromOne}.result"]`
    ),
    remove: baseLocator.getByTitle('poista'),
  }
}

type Fixtures = {
  growingSets: {
    first: ReturnType<typeof growingFieldSet>
    second: ReturnType<typeof growingFieldSet>
    third: ReturnType<typeof growingFieldSet>
  }
}

const test = defaultValues.extend<Fixtures>({
  growingSets: async ({ page, userCache, answers, hakuProps }, use) => {
    expectToBeDefined(userCache)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigate(1)
    const avustushakuID = await hakujenHallintaPage.copyCurrentHaku()
    await test.step('create avustushaku', async () => {
      await hakujenHallintaPage.fillAvustushaku(hakuProps)
      const formEditorPage = await hakujenHallintaPage.navigateToFormEditor(avustushakuID)
      await formEditorPage.changeLomakeJson(formJsonString)
      await formEditorPage.saveForm()
      const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
      await haunTiedotPage.publishAvustushaku()
    })
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const growingSets = {
      first: growingFieldSet(hakijaAvustusHakuPage.page, 0),
      second: growingFieldSet(hakijaAvustusHakuPage.page, 1),
      third: growingFieldSet(hakijaAvustusHakuPage.page, 2),
    }
    await test.step('fill normal stuff', async () => {
      await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
      const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
        avustushakuID,
        answers.contactPersonEmail
      )
      await hakijaAvustusHakuPage.page.goto(hakemusUrl)
      await hakijaAvustusHakuPage.fillApplication(answers, TEST_Y_TUNNUS)

      const { first, second, third } = growingSets
      await test.step('growing set shows label', async () => {
        const fieldSetLabel = hakijaAvustusHakuPage.page.locator('#project-description legend')
        await expect(fieldSetLabel).toHaveText('Hankkeen tavoitteet, toiminta ja budjetti')
      })
      await test.step('growing mode intial state is correct', async () => {
        await expect(first.tavoite).toBeEnabled()
        await expect(first.toiminta).toBeEnabled()
        await expect(first.tulos).toBeEnabled()
        await expect(first.remove).toBeDisabled()
        await expect(second.tavoite).toBeDisabled()
        await expect(second.toiminta).toBeDisabled()
        await expect(second.tulos).toBeDisabled()
        await expect(second.remove).toBeDisabled()
        await expect(third.tavoite).toBeHidden()
        await expect(third.toiminta).toBeHidden()
        await expect(third.tulos).toBeHidden()
        await expect(third.remove).toBeHidden()
      })
      await expect(hakijaAvustusHakuPage.sendHakemusButton).toBeDisabled()
    })
    await use(growingSets)
  },
})

test.describe.parallel('growing field set', () => {
  test('can delete first growing field set child after page reload', async ({
    page,
    growingSets: { first, second, third },
  }) => {
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const firstTavoite = 'a'
    const secondTavoite = 'd'
    const secondToiminta = 'e'
    const secondTulos = 'f'
    await test.step('after filling first field', async () => {
      await first.tavoite.fill(firstTavoite)
      await expect(second.tavoite).toBeEnabled()
      await expect(second.toiminta).toBeEnabled()
      await expect(second.tulos).toBeEnabled()
      await expect(second.remove).toBeDisabled()
      await expect(third.tavoite).toBeDisabled()
      await expect(third.toiminta).toBeDisabled()
      await expect(third.tulos).toBeDisabled()
      await expect(third.remove).toBeDisabled()
    })
    await test.step('fill first and second', async () => {
      await first.toiminta.fill('b')
      await first.tulos.fill('c')
      await expect(second.remove).toBeDisabled()
      await second.tavoite.fill(secondTavoite)
      await second.toiminta.fill(secondToiminta)
      await second.tulos.fill(secondTulos)
      await expect(second.remove).toBeEnabled()
      await hakijaAvustusHakuPage.waitForEditSaved()
    })
    await test.step('after reload can delete first field', async () => {
      await hakijaAvustusHakuPage.page.reload()
      await expect(first.tavoite).toHaveValue(firstTavoite)
      await first.remove.click()
      await expect(first.tavoite).toHaveValue(secondTavoite)
      await expect(first.toiminta).toHaveValue(secondToiminta)
      await expect(first.tulos).toHaveValue(secondTulos)
    })
    await test.step('form submits successfully', async () => {
      await hakijaAvustusHakuPage.submitApplication()
    })
  })

  test('first growing field set field is editable after reload', async ({
    page,
    growingSets: { first },
  }) => {
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await test.step('fill and remove first field', async () => {
      await first.tavoite.fill('a')
      await first.remove.click()
      await expect(first.tavoite).toHaveValue('')
    })
    await test.step('after reload can still fill field', async () => {
      await page.reload()
      await first.tavoite.fill('a')
      await expect(first.tavoite).toHaveValue('a')
      await first.toiminta.fill('b')
      await first.tulos.fill('c')
    })
    await test.step('form submits successfully', async () => {
      await hakijaAvustusHakuPage.submitApplication()
    })
  })
})
