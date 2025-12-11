import { defaultValues as test } from '../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { expect, Page, BrowserContext } from '@playwright/test'
import { expectToBeDefined } from '../../utils/util'
import moment from 'moment/moment'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { getBudgetSelectorsForType } from '../../utils/budget'
import { TEST_Y_TUNNUS } from '../../utils/constants'

const form = {
  content: [
    {
      "fieldClass": "wrapperElement",
      "id": "applicant-info",
      "fieldType": "theme",
      "children": [
        {
          "fieldClass": "wrapperElement",
          "id": "organization-fieldset",
          "fieldType": "fieldset",
          "children": [
            {
              "label": {
                "fi": "Hakijaorganisaatio",
                "sv": "Sökandeorganisation"
              },
              "fieldClass": "formField",
              "helpText": {
                "fi": "Ilmoita hakijaorganisaation nimi ja virallinen sähköpostiosoite.",
                "sv": "Meddela sökandeorganisationens namn och officiella e-postadress."
              },
              "id": "organization",
              "params": {
                "size": "large",
                "maxlength": 80
              },
              "required": true,
              "fieldType": "textField"
            },
            {
              "label": {
                "fi": "Organisaation sähköposti",
                "sv": "Organisationens e-post"
              },
              "fieldClass": "formField",
              "helpText": {
                "fi": "",
                "sv": ""
              },
              "id": "organization-email",
              "params": {
                "size": "small",
                "maxlength": 80
              },
              "required": true,
              "fieldType": "emailField"
            }
          ]
        },
        {
          "label": {
            "fi": "Y-tunnus",
            "sv": "Företags- och organisationsnummer"
          },
          "fieldClass": "formField",
          "helpText": {
            "fi": "",
            "sv": ""
          },
          "id": "business-id",
          "params": {
            "size": "small",
            "maxlength": 9
          },
          "required": true,
          "fieldType": "finnishBusinessIdField"
        },
        {
          "fieldClass": "wrapperElement",
          "id": "applicant-fieldset",
          "fieldType": "fieldset",
          "children": [
            {
              "label": {
                "fi": "Yhteyshenkilö",
                "sv": "Kontaktperson"
              },
              "fieldClass": "formField",
              "helpText": {
                "fi": "Yhteyshenkilöllä tarkoitetaan hankkeen vastuuhenkilöä hakijaorganisaatiossa.",
                "sv": "Med kontaktperson avses den projektansvariga i sökandeorganisationen."
              },
              "id": "applicant-name",
              "params": {
                "size": "large",
                "maxlength": 80
              },
              "required": true,
              "fieldType": "textField"
            },
            {
              "label": {
                "fi": "Sähköposti",
                "sv": "E-post"
              },
              "fieldClass": "formField",
              "helpText": {
                "fi": "",
                "sv": ""
              },
              "id": "primary-email",
              "params": {
                "size": "small",
                "maxlength": 80
              },
              "required": true,
              "fieldType": "emailField"
            },
            {
              "label": {
                "fi": "Puhelinumero",
                "sv": "Telefon"
              },
              "fieldClass": "formField",
              "helpText": {
                "fi": "",
                "sv": ""
              },
              "id": "textField-0",
              "params": {
                "size": "small",
                "maxlength": 15
              },
              "required": true,
              "fieldType": "textField"
            }
          ]
        },
        {
          "label": {
            "fi": "Osoite",
            "sv": "TODO: Adress"
          },
          "fieldClass": "formField",
          "helpText": {
            "fi": "",
            "sv": ""
          },
          "id": "organization-postal-address",
          "params": {
            "size": "small",
            "maxlength": 1000
          },
          "required": true,
          "fieldType": "textArea"
        }
      ],
      "label": {
        "fi": "Hakijan tiedot",
        "sv": "Uppgifter om sökanden"
      }
    },
    {
      fieldClass: 'wrapperElement',
      id: 'financing-plan',
      fieldType: 'theme',
      children: [
        {
          fieldClass: 'wrapperElement',
          id: 'budget',
          fieldType: 'vaBudget',
          children: [
            {
              fieldClass: 'wrapperElement',
              id: 'project-budget',
              fieldType: 'vaSummingBudgetElement',
              children: [
                {
                  fieldClass: 'wrapperElement',
                  id: 'personnel-costs-row',
                  fieldType: 'vaBudgetItemElement',
                  children: [
                    {
                      initialValue: {
                        fi: '',
                        sv: '',
                      },
                      fieldClass: 'formField',
                      helpText: {
                        fi: '',
                        sv: '',
                      },
                      id: 'personnel-costs-row.multiplier',
                      params: {
                        size: 'extra-extra-small',
                        maxlength: 250,
                      },
                      required: true,
                      fieldType: 'fixedMultiplierField',
                    },
                    {
                      initialValue: 0,
                      fieldClass: 'formField',
                      helpText: {
                        fi: '',
                        sv: '',
                      },
                      id: 'personnel-costs-row.amount',
                      params: {
                        size: 'extra-extra-small',
                        maxlength: 7,
                      },
                      required: true,
                      fieldType: 'fixedMultiplierMoneyField',
                    },
                  ],
                  params: {
                    incrementsTotal: true,
                  },
                  label: {
                    fi: '1. Suomi toisena kielenä ja muun opetuksen tukeminen',
                    sv: '1. Svenska som andraspråk eller stödjande av annan undervisning ',
                  },
                  helpText: {
                    fi: '',
                    sv: '',
                  },
                },
                {
                  fieldClass: 'wrapperElement',
                  id: 'material-costs-row',
                  fieldType: 'vaBudgetItemElement',
                  children: [
                    {
                      initialValue: {
                        fi: '',
                        sv: '',
                      },
                      fieldClass: 'formField',
                      helpText: {
                        fi: '',
                        sv: '',
                      },
                      id: 'material-costs-row.multiplier',
                      params: {
                        size: 'extra-extra-small',
                        maxlength: 7,
                      },
                      required: true,
                      fieldType: 'fixedMultiplierField',
                    },
                    {
                      initialValue: 0,
                      fieldClass: 'formField',
                      helpText: {
                        fi: '',
                        sv: '',
                      },
                      id: 'material-costs-row.amount',
                      params: {
                        size: 'extra-extra-small',
                        maxlength: 16,
                      },
                      required: true,
                      fieldType: 'fixedMultiplierMoneyField',
                    },
                  ],
                  params: {
                    incrementsTotal: true,
                  },
                  label: {
                    fi: '2. Maahanmuuttajien oman äidinkielen ja suomenkielisten oppilaiden tai opiskelijoiden ulkomailla hankkiman kielitaidon ylläpitäminen',
                    sv: '2. Undervisning i invandrares eget modersmål samt för undervisning som syftar till att upprätthålla språkkunskaper',
                  },
                  helpText: {
                    fi: '',
                    sv: '',
                  },
                },
                {
                  fieldClass: 'wrapperElement',
                  id: 'equipment-costs-row',
                  fieldType: 'vaBudgetItemElement',
                  children: [
                    {
                      fieldClass: 'formField',
                      helpText: {
                        fi: '',
                        sv: '',
                      },
                      id: 'equipment-costs-row.multiplier',
                      params: {
                        size: 'extra-extra-small',
                        maxlength: 7,
                      },
                      required: true,
                      fieldType: 'fixedMultiplierField',
                    },
                    {
                      initialValue: 0,
                      fieldClass: 'formField',
                      helpText: {
                        fi: '',
                        sv: '',
                      },
                      id: 'equipment-costs-row.amount',
                      params: {
                        size: 'extra-extra-small',
                        maxlength: 16,
                      },
                      required: true,
                      fieldType: 'fixedMultiplierMoneyField',
                    },
                  ],
                  params: {
                    incrementsTotal: true,
                  },
                  label: {
                    fi: '3. Saamen- tai  romanikielen opetus',
                    sv: '3. Undervisning i samiska eller romani',
                  },
                  helpText: {
                    fi: '',
                    sv: '',
                  },
                },
              ],
              params: {
                sumRowLabel: {
                  fi: '',
                  sv: '',
                },
                columnTitles: {
                  label: {
                    fi: '',
                    sv: '',
                  },
                  amount: {
                    fi: 'Euroa',
                    sv: 'Euro',
                  },
                  description: {
                    fi: 'Tunteja yhteensä',
                    sv: 'Timmar sammanlagt',
                  },
                },
                showColumnTitles: true,
              },
              label: {
                fi: '',
                sv: '',
              },
            },
            {
              fieldClass: 'wrapperElement',
              id: 'budget-summary',
              fieldType: 'vaBudgetSummaryElement',
              children: [],
              params: {
                showColumnTitles: false,
                totalSumRowLabel: {
                  fi: 'Haettu avustus yhteensä',
                  sv: 'Understöd som söks sammanlagt',
                },
                ophFinancingLabel: {
                  fi: 'Opetushallitukselta haettava rahoitus',
                  sv: 'Finansiering som söks av Utbildningsstyrelsen',
                },
                selfFinancingLabel: {
                  fi: 'Omarahoitus',
                  sv: 'Egen finansiering',
                },
              },
            },
          ],
        },
      ],
      label: {
        fi: 'Haettu avustus',
        sv: 'Understöd som ansöks',
      },
    },
  ],
  rules: [],
  created_at: '2023-03-03T07:44:48Z',
  updated_at: '2023-03-03T07:57:02Z',
}

test('fixed multiplier field works', async ({
  page,
  hakuProps,
  userCache,
  answers,
  context,
}, testInfo) => {
  // This test creates avustushaku as a part of the test, which easily pushes the
  // duration past the default timeout of 60 seconds
  testInfo.setTimeout(120_000)

  expectToBeDefined(userCache)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  await hakujenHallintaPage.navigate(1)
  const avustushakuID = await hakujenHallintaPage.copyCurrentHaku()
  await test.step('create avustushaku', async () => {
    await hakujenHallintaPage.fillAvustushaku(hakuProps)
    const formEditorPage = await hakujenHallintaPage.navigateToFormEditor(avustushakuID)
    await formEditorPage.changeLomakeJson(JSON.stringify(form))
    await formEditorPage.saveForm()
    const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedotPage.publishAvustushaku()
  })
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
  await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
  const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
    avustushakuID,
    answers.contactPersonEmail
  )
  await hakijaAvustusHakuPage.page.goto(hakemusUrl)
  await hakijaAvustusHakuPage.fillApplication(answers, TEST_Y_TUNNUS)

  answers.projectName = undefined

  const firstRow = getMoneyLocators(hakijaAvustusHakuPage.page, 'personnel-costs-row')
  const secondRow = getMoneyLocators(hakijaAvustusHakuPage.page, 'material-costs-row')
  const thirdRow = getMoneyLocators(hakijaAvustusHakuPage.page, 'equipment-costs-row')
  const financingAmount = hakijaAvustusHakuPage.page.locator('tfoot .amount-column')
  const amountToFinance = hakijaAvustusHakuPage.page.locator('.total-financing-amount')
  await test.step('default state is correct', async () => {
    await expect(firstRow.hours).toHaveValue('')
    await expect(firstRow.euros).toHaveText('0')
    await expect(secondRow.hours).toHaveValue('')
    await expect(secondRow.euros).toHaveText('0')
    await expect(thirdRow.hours).toHaveValue('')
    await expect(thirdRow.euros).toHaveText('0')
    await expect(financingAmount).toHaveText('0')
    await expect(amountToFinance).toHaveText('Rahoitettavaa jää yhteensä 0')
  })
  await test.step('calculates financing correctly', async () => {
    await firstRow.hours.fill('100')
    await expect(firstRow.euros).toHaveText('2150')
    await expect(financingAmount).toHaveText('2150')
    await expect(amountToFinance).toHaveText('Rahoitettavaa jää yhteensä 2150')
    await secondRow.hours.fill('50')
    await expect(secondRow.euros).toHaveText('1075')
    await expect(financingAmount).toHaveText('3225')
    await expect(amountToFinance).toHaveText('Rahoitettavaa jää yhteensä 3225')
    await thirdRow.hours.fill('30')
    await expect(thirdRow.euros).toHaveText('645')
    await expect(financingAmount).toHaveText('3870')
    await expect(amountToFinance).toHaveText('Rahoitettavaa jää yhteensä 3870')
  })
  await hakijaAvustusHakuPage.submitApplication()
  const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
  await haunTiedotPage.setEndDate(moment().subtract(1, 'year').format('D.M.YYYY H.mm'))
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectHakemusFromList('Käsittelemättä')
  const kokonaiskustannusInput = hakemustenArviointiPage.page.locator('tfoot .amount-column input')
  const editingAmountToFinance = hakemustenArviointiPage.page.locator(
    '#budget-edit-budget-summary h4'
  )
  await test.step('kokonaiskustannukset budget works', async () => {
    await expect(editingAmountToFinance).toHaveText('Rahoitettavaa jää yhteensä 0')
    await kokonaiskustannusInput.fill('100')
    await expect(editingAmountToFinance).toHaveText('Rahoitettavaa jää yhteensä 100')
    await hakemustenArviointiPage.waitForSave()
    const { paatosPage, locators } = await getBudgetTableFooterTh(context, page)
    await expect(locators.nth(1)).toContainText('3 870 €')
    await expect(locators.nth(2)).toContainText('100 €')
    await paatosPage.close()
  })
  await test.step('menokohtainen budget works', async () => {
    await hakemustenArviointiPage.page.click('label[for="useDetailedCosts-true"]')
    const { personnel, material, equipment } = getBudgetSelectorsForType(
      page,
      'virkailija',
      'amount'
    )
    await expect(personnel).toHaveValue('2150')
    await expect(material).toHaveValue('1075')
    await expect(equipment).toHaveValue('645')
    await expect(editingAmountToFinance).toHaveText('Rahoitettavaa jää yhteensä 3870')
    await personnel.fill('1280')
    await expect(editingAmountToFinance).toHaveText('Rahoitettavaa jää yhteensä 3000')
    await hakemustenArviointiPage.waitForSave()
    const { paatosPage, locators } = await getBudgetTableFooterTh(context, page)
    await expect(locators.nth(1)).toHaveText('3 870 €')
    await expect(locators.nth(2)).toContainText('3 000 €')
    await paatosPage.close()
  })

  await test.step('menokohtainen budget ignores invalid inputs', async () => {
    await hakemustenArviointiPage.page.click('label[for="useDetailedCosts-true"]')
    const { personnel, material, equipment } = getBudgetSelectorsForType(
      page,
      'virkailija',
      'amount'
    )

    await test.step('when we have invalid input before or after the number and the user copy-pastes the value', async () => {
      await expect(personnel).toHaveValue('1280')
      await personnel.fill('yolo-$1269€')
      await expect(personnel).toHaveValue('1280')
    })
    await test.step('when we have invalid input before or after the number and the user writes the value', async () => {
      await expect(personnel).toHaveValue('1280')
      await personnel.clear()
      await personnel.pressSequentially('yolo-$1269€')
      await expect(personnel).toHaveValue('1269')
    })
    await test.step('when we have invalid input within the number', async () => {
      await expect(material).toHaveValue('1075')
      await material.fill('1.0.7.6')
      await expect(material).toHaveValue('1075')
    })

    await test.step('when all input characters are invalid', async () => {
      await expect(equipment).toHaveValue('645')
      const preModificationEquipmentValue = await equipment.inputValue()
      await equipment.fill('zero')
      await expect(equipment).toHaveValue(preModificationEquipmentValue)

      await equipment.fill(' ')
      await expect(equipment).toHaveValue(preModificationEquipmentValue)

      await equipment.fill('tekstiä_joka_ei_sisällä_numeroita_ollenkaan')
      await expect(equipment).toHaveValue(preModificationEquipmentValue)
    })

    await test.step('and sets budget to 0 for empty input', async () => {
      await equipment.fill('')
      await expect(equipment).toHaveValue('0')
    })
  })
})

const getBudgetTableFooterTh = async (context: BrowserContext, page: Page) => {
  const [paatosPage] = await Promise.all([
    context.waitForEvent('page'),
    page.click('a:text-is("Luonnos")'),
  ])
  return {
    locators: paatosPage.locator('table').first().locator('tfoot th'),
    paatosPage,
  }
}

const getMoneyLocators = (page: Page, prefix: string) => ({
  hours: page.locator(`#${prefix}\\.multiplier`),
  euros: page.locator(`#${prefix}\\.amount`),
})
