import {expect} from "@playwright/test"

import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";
import {KoodienhallintaPage} from "../../pages/koodienHallintaPage";
import {
  getElementAttribute,
} from '../../utils/util'
import {
  getHakemusTokenAndRegisterNumber
} from '../../utils/emails'
import {
  navigate
} from '../../utils/navigate'
import {
  MaksatuksetPage
} from '../../pages/maksatuksetPage'

import {
  putMaksupalauteToMaksatuspalveluAndProcessIt,
  getAllMaksatuksetFromMaksatuspalvelu,
  removeStoredPitkäviiteFromAllAvustushakuPayments
} from '../../utils/maksatukset'


const correctOVTTest = test.extend({
  codes: async ({page}, use) => {
    const codes = { operationalUnit: '6600105300', operation: '3425324634', project: '523452346' }
    const koodienHallintaPage = new KoodienhallintaPage(page)
    await koodienHallintaPage.createCodeValues(codes)
    await use(codes)
  },
})

test.setTimeout(400000)
correctOVTTest.setTimeout(400000)

correctOVTTest('Maksatukset uses correct OVT when the operational unit is Palvelukeskus', async ({page, hakemus: {hakemusID}, codes: codeValues}) => {
    const maksatuksetPage = MaksatuksetPage(page)

    await navigate(page, "/admin-ui/payments/")
    await maksatuksetPage.fillInMaksueranTiedot("asha pasha", "essi.esittelija@example.com", "hygge.hyvaksyja@example.com")
    const dueDate = await getElementAttribute(page, '[id="Eräpäivä"]', 'value')
    if (!dueDate) throw new Error('Cannot find due date from form')

    await maksatuksetPage.sendMaksatukset()
    await maksatuksetPage.reloadPaymentPage()

    await maksatuksetPage.gotoLähetetytMaksatuksetTab()
    const { "register-number": registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`

    expect(await maksatuksetPage.getBatchPitkäViite(1)).toEqual(pitkaviite)
    expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Lähetetty")
    expect(await maksatuksetPage.getBatchToimittajanNimi(1)).toEqual("Akaan kaupunki")
    expect(await maksatuksetPage.getBatchHanke(1)).toEqual("Rahassa kylpijät Ky Ay Oy")
    expect(await maksatuksetPage.getBatchMaksuun(1)).toEqual("99,999 €")
    expect(await maksatuksetPage.getBatchIBAN(1)).toEqual("FI95 6682 9530 0087 65")
    expect(await maksatuksetPage.getBatchLKPTili(1)).toEqual("82010000")
    expect(await maksatuksetPage.getBatchTaKpTili(1)).toEqual("29103020")
    expect(await maksatuksetPage.getTiliönti(1)).toEqual("99,999 €")


    await putMaksupalauteToMaksatuspalveluAndProcessIt(`
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `)

    await maksatuksetPage.reloadPaymentPage()
    await maksatuksetPage.gotoLähetetytMaksatuksetTab()
    expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Maksettu")

    const maksatukset = await getAllMaksatuksetFromMaksatuspalvelu()
    expect(maksatukset).toContainEqual(maksatuksetPage.getExpectedPaymentXML(codeValues.project, codeValues.operation, codeValues.operationalUnit, pitkaviite, `${registerNumber}_1`, dueDate, '00372769790122'))
  })

test('work with pitkaviite without contact person name', async ({page, avustushakuID, hakemus: {hakemusID}}) => {
    const maksatuksetPage = MaksatuksetPage(page)
    await navigate(page, "/admin-ui/payments/")

    await maksatuksetPage.fillInMaksueranTiedot("asha pasha", "essi.esittelija@example.com", "hygge.hyvaksyja@example.com")

    await maksatuksetPage.sendMaksatukset()

    await removeStoredPitkäviiteFromAllAvustushakuPayments(avustushakuID)
    await maksatuksetPage.reloadPaymentPage()

    await maksatuksetPage.gotoLähetetytMaksatuksetTab()
    const { "register-number": registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const pitkaviite = registerNumber

    expect(await maksatuksetPage.getBatchPitkäViite(1)).toEqual(pitkaviite)
    expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Lähetetty")
    expect(await maksatuksetPage.getBatchToimittajanNimi(1)).toEqual("Akaan kaupunki")
    expect(await maksatuksetPage.getBatchHanke(1)).toEqual("Rahassa kylpijät Ky Ay Oy")
    expect(await maksatuksetPage.getBatchMaksuun(1)).toEqual("99,999 €")
    expect(await maksatuksetPage.getBatchIBAN(1)).toEqual("FI95 6682 9530 0087 65")
    expect(await maksatuksetPage.getBatchLKPTili(1)).toEqual("82010000")
    expect(await maksatuksetPage.getBatchTaKpTili(1)).toEqual("29103020")
    expect(await maksatuksetPage.getTiliönti(1)).toEqual("99,999 €")

    await putMaksupalauteToMaksatuspalveluAndProcessIt(`
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `)

    await maksatuksetPage.reloadPaymentPage()
    await maksatuksetPage.gotoLähetetytMaksatuksetTab()
    expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Maksettu")
  })

test('work with pitkaviite with contact person name', async ({page, hakemus: {hakemusID}, codes: { project, operation, operationalUnit}}) => {
    const maksatuksetPage = MaksatuksetPage(page)
    await navigate(page, "/admin-ui/payments/")

    await maksatuksetPage.fillInMaksueranTiedot("asha pasha", "essi.esittelija@example.com", "hygge.hyvaksyja@example.com")
    const dueDate = await getElementAttribute(page, '[id="Eräpäivä"]', 'value')
    if (!dueDate) throw new Error('Cannot find due date from form')

    await maksatuksetPage.sendMaksatukset()
    await maksatuksetPage.reloadPaymentPage()

    await maksatuksetPage.gotoLähetetytMaksatuksetTab()
    const { "register-number": registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`

    expect(await maksatuksetPage.getBatchPitkäViite(1)).toEqual(pitkaviite)
    expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Lähetetty")
    expect(await maksatuksetPage.getBatchToimittajanNimi(1)).toEqual("Akaan kaupunki")
    expect(await maksatuksetPage.getBatchHanke(1)).toEqual("Rahassa kylpijät Ky Ay Oy")
    expect(await maksatuksetPage.getBatchMaksuun(1)).toEqual("99,999 €")
    expect(await maksatuksetPage.getBatchIBAN(1)).toEqual("FI95 6682 9530 0087 65")
    expect(await maksatuksetPage.getBatchLKPTili(1)).toEqual("82010000")
    expect(await maksatuksetPage.getBatchTaKpTili(1)).toEqual("29103020")
    expect(await maksatuksetPage.getTiliönti(1)).toEqual("99,999 €")


    await putMaksupalauteToMaksatuspalveluAndProcessIt(`
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `)

    await maksatuksetPage.reloadPaymentPage()
    await maksatuksetPage.gotoLähetetytMaksatuksetTab()
    expect(await maksatuksetPage.getBatchStatus(1)).toEqual("Maksettu")

    const maksatukset = await getAllMaksatuksetFromMaksatuspalvelu()
    expect(maksatukset).toContainEqual(maksatuksetPage.getExpectedPaymentXML(project, operation, operationalUnit, pitkaviite, `${registerNumber}_1`, dueDate))
  })

