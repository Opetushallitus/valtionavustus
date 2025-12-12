import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { expectToBeDefined } from '../../utils/util'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { expect, Page } from '@playwright/test'

const form = {
  content: [
    {
      fieldClass: 'wrapperElement',
      id: 'applicant-fieldset',
      fieldType: 'fieldset',
      children: [
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
      fieldClass: 'wrapperElement',
      id: 'outcomes-theme',
      fieldType: 'theme',
      children: [
        {
          fieldClass: 'infoElement',
          id: 'h3-label-tuotokset',
          fieldType: 'h3',
          params: {},
          text: {
            fi: 'Tähän mennessä aikaansaadut keskeiset ja valmiit tuotokset.',
            sv: 'Hittills uppnådda centrala och färdiga resultat.',
          },
        },
        {
          fieldClass: 'wrapperElement',
          id: 'project-outcomes',
          fieldType: 'growingFieldset',
          children: [
            {
              fieldClass: 'wrapperElement',
              id: 'project-outcomes-1',
              fieldType: 'growingFieldsetChild',
              children: [
                {
                  label: {
                    fi: 'Kuvaa muut konkreettiset tuotokset. Voit myös tarvittaessa lisätä liitteen / tuotos. ',
                    sv: 'Skildra andra konkreta alster. Vid behov kan du även bifoga en fil / alster.',
                  },
                  fieldClass: 'formField',
                  helpText: {
                    fi: '',
                    sv: '',
                  },
                  id: 'project-outcomes.project-outcomes-1.outcome-type',
                  params: {},
                  options: [
                    {
                      value: 'toimintamalli',
                      label: {
                        fi: 'Toimintamallin/käytännön kuvaus/mallinnus',
                        sv: 'Beskrivning/avbildning av verksamhetsmodell/praxis',
                      },
                    },
                    {
                      value: 'julkaisu',
                      label: {
                        fi: 'Blogi, verkkosivusto, FB-ryhmä, vlogi tms.',
                        sv: 'Blogg, webbsida, FB-grupp, videoblogg e.d.',
                      },
                    },
                    {
                      value: 'tapahtuma',
                      label: {
                        fi: 'Tapahtuma/tilaisuus',
                        sv: 'Evenemang/tillställning',
                      },
                    },
                    {
                      value: 'tutkimus',
                      label: {
                        fi: 'Tutkimus, selvitys, kartoitus tai vast.',
                        sv: 'Undersökning, utredning, kartläggning eller motsvarande',
                      },
                    },
                    {
                      value: 'markkinointimateriaali-esim-pdf-esite',
                      label: {
                        fi: 'Markkinointimateriaali, esim. pdf-esite',
                        sv: 'Marknadsföringsmaterial, t. ex. pdf-broschyr',
                      },
                    },
                    {
                      value: 'linkki-koulutuksen-sivuille',
                      label: {
                        fi: 'Linkki koulutuksen sivuille',
                        sv: 'Länk till utbildningens webbsida',
                      },
                    },
                    {
                      value: 'linkki-koulutuksen-opintopolku-sivuille',
                      label: {
                        fi: 'Linkki koulutuksen Opintopolku-sivuille',
                        sv: 'Länk till utbildningens Studieinfo-sida',
                      },
                    },
                    {
                      value: 'muu-tuotos',
                      label: {
                        fi: 'Muu tuotos',
                        sv: 'Annat alster',
                      },
                    },
                  ],
                  required: false,
                  fieldType: 'radioButton',
                },
                {
                  label: {
                    fi: 'Saatavuustiedot, esim. www-sivu',
                    sv: 'Tillgänglighetsinformation, t. ex. www-sida',
                  },
                  fieldClass: 'formField',
                  helpText: {
                    fi: '',
                    sv: '',
                  },
                  id: 'project-outcomes-1.textArea_0',
                  params: {
                    size: 'small',
                    maxlength: 1000,
                  },
                  required: true,
                  fieldType: 'textArea',
                },
                {
                  fieldClass: 'infoElement',
                  id: 'project-outcomes.project-outcomes-1.empty-space-between',
                  fieldType: 'h3',
                  params: {},
                  text: {
                    fi: '   ',
                    sv: '   ',
                  },
                },
                {
                  label: {
                    fi: 'Kuvaus',
                    sv: 'Beskrivning',
                  },
                  fieldClass: 'formField',
                  helpText: {
                    fi: '',
                    sv: '',
                  },
                  id: 'project-outcomes.project-outcomes-1.description',
                  params: {
                    size: 'extra-small',
                    maxlength: 1000,
                  },
                  required: true,
                  fieldType: 'textArea',
                },
                {
                  label: {
                    fi: 'Liite',
                    sv: 'Bilaga till utredningen',
                  },
                  fieldClass: 'formField',
                  helpText: {
                    fi: 'Liitä halutessasi mahdollinen tuotos tai materiaali, joka avustuksella on tuotettu',
                    sv: 'Bifoga vid behov ett eventuellt alster eller material som har producerats med understödet',
                  },
                  id: 'project-outcomes.project-outcomes-1.attachment',
                  params: {},
                  required: false,
                  fieldType: 'namedAttachment',
                },
              ],
            },
          ],
          params: {
            showOnlyFirstLabels: false,
          },
          label: {
            fi: '',
            sv: '',
          },
        },
      ],
      label: {
        fi: 'Tulokset ja tuotokset',
        sv: 'Resultat och alster',
      },
    },
  ],
  rules: [],
  created_at: '2022-11-03T13:15:20Z',
  updated_at: '2024-02-19T09:13:48Z',
}

const formJsonString = JSON.stringify(form)

type Fixtures = {
  hakijaPage: ReturnType<typeof HakijaAvustusHakuPage>
}

const test = defaultValues.extend<Fixtures>({
  hakijaPage: async ({ page, userCache, answers, hakuProps }, use) => {
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
    await test.step('fill normal stuff', async () => {
      await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
      const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
        avustushakuID,
        answers.contactPersonEmail
      )
      await hakijaAvustusHakuPage.page.goto(hakemusUrl)
    })
    await use(hakijaAvustusHakuPage)
  },
})

const growingFieldSetLocators = (page: Page) => {
  const createLocators = (index: number) => {
    const container = page.locator(`#project-outcomes-${index}`)
    return {
      container,
      otherOption: container.getByText('Muu tuotos'),
      remove: container.getByRole('button', { name: 'poista' }),
    }
  }
  return {
    amount: page.getByRole('listitem'),
    first: createLocators(1),
    second: createLocators(2),
    third: createLocators(3),
  }
}

test.setTimeout(50_000)

test('can add and remove growing field sets with attachment fields', async ({ hakijaPage }) => {
  const page = hakijaPage.page
  page.addListener('dialog', (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`)
    test.fail(true, `Dialog opened: ${dialog.message()}`)
  })
  const growingFields = growingFieldSetLocators(page)
  await expect(growingFields.amount).toHaveCount(2)
  await growingFields.first.otherOption.click()
  await expect(growingFields.amount).toHaveCount(3)
  await hakijaPage.waitForEditSaved()
  await growingFields.second.otherOption.click()
  await expect(growingFields.amount).toHaveCount(4)
  await growingFields.second.remove.click()
  await hakijaPage.waitForEditSaved()
  await expect(growingFields.amount).toHaveCount(3)
  await hakijaPage.waitForEditSaved()
  await growingFields.first.remove.click()
  await expect(growingFields.amount).toHaveCount(2)
  await hakijaPage.waitForEditSaved()
})
