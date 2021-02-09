import { Browser, Page } from "puppeteer"
import * as moment from 'moment'
import * as querystring from "querystring"

import {
  VIRKAILIJA_URL,
  HAKIJA_URL,
  createValidCopyOfEsimerkkihakuAndReturnTheNewId,
  getAcceptedPäätösEmails,
  getLinkToHakemusFromSentEmails,
  mkBrowser,
  getMuutoshakemusPaatosEmails,
  clearAndSet,
  hakulomakeWithoutOhjetekstiJson,
  navigateHakija,
  navigateToNewHakemusPage,
  linkToMuutoshakemusRegex,
  getFirstPage,
  getUserKey,
  ratkaiseAvustushaku,
  getElementInnerText,
  ratkaiseMuutoshakemusEnabledAvustushaku,
  publishAvustushaku,
  hasElementAttribute,
  getElementAttribute,
  fillAndSendHakemus,
  acceptHakemus,
  clickCodeVisibilityButton,
  clickElementWithTestId,
  assertCodeIsVisible,
  expectedResponseFromExternalAPIhakemuksetForAvustushaku,
  getLinkToMuutoshakemusFromSentEmails,
  actualResponseFromExternalAPIhakemuksetForAvustushaku,
  createUniqueCode,
  closeAvustushakuByChangingEndDateToPast,
  navigate,
  clickElementWithText,
  clickElement,
  clearAndType,
  waitForArvioSave,
  fillAndSendHakemusAndReturnHakemusId,
  getMuutoshakemusEmails,
  getValmistelijaEmails,
  randomString,
  expectToBeDefined,
  resolveAvustushaku,
  sendPäätös,
  textContent,
  selectValmistelijaForHakemus,
  deleteAttachment,
  dummyPdfPath,
  uploadFile,
  verifyText,
  verifyTooltipText,
  createValidCopyOfLukioEsimerkkihakuWithValintaperusteetAndReturnTheNewId,
  gotoPäätösTab,
  waitForSave,
  addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel,
  typeValueInFieldAndExpectValidationError,
  typeValueInFieldAndExpectNoValidationError,
  gotoVäliselvitysTab,
  waitForElementWithText,
  waitForElementWIthTestId,
  fillAndSendVäliselvityspyyntö,
  downloadExcelExport,
  clickFormSaveAndWait,
  addFieldToFormAndReturnElementIdAndLabel,
  navigateToHakemus,
  MuutoshakemusValues,
  TEST_Y_TUNNUS,
  fillAndSendMuutoshakemus,
  validateMuutoshakemusValues,
  makePaatosForMuutoshakemusIfNotExists,
  publishAndFillMuutoshakemusEnabledAvustushaku,
  navigateToHakemuksenArviointi,
  getTäydennyspyyntöEmails,
  validateMuutoshakemusPaatosCommonValues,
  countElements,
  selectVakioperustelu,
  setCalendarDate,
  navigateToHakijaMuutoshakemusPage
} from "./test-util"
import axios from 'axios'

jest.setTimeout(200_000)

export function log(...args: any[]) {
  console.log(moment().format('YYYY-MM-DD HH:mm:ss.SSSS'), ...args)
}

describe("Puppeteer tests", () => {
  let browser: Browser
  let page: Page

  function setPageErrorConsoleLogger(page: Page) {
    page.on('error', err => {
      log('error in page: ', err)
    })

    page.on('pageerror', pageerr => {
      log('pageerror: ', pageerr)
    })

    page.on('request', async (request) => {
      if (!request.url().startsWith('data:image')) {
        log(`Outgoing request to ${request.url()}, navigation: ${request.isNavigationRequest()}`)
      }
    })

    page.on('requestfailed', request => {
      log(`Request failed to url: ${request.url()},
       errorText: ${request.failure()?.errorText},
       method: ${request.method()}`, request)
    })
  }

  beforeEach(() => {
    log(`Starting test: ${expect.getState().currentTestName}`)
  })

  beforeAll(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
    setPageErrorConsoleLogger(page)
  })

  afterEach(() => {
    log(`Finished test: ${expect.getState().currentTestName}`)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  it("should allow removing attachment from hakemus", async function() {
    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    await publishAvustushaku(page)
    await fillAndSendHakemus(page, avustushakuID, async function() {
      await deleteAttachment(page, "financial-information-form")
      await uploadFile(page, "input[name='financial-information-form']", dummyPdfPath)
    })
  })

  const allowBasicAvustushakuFlowAndCheckEachHakemusHasValmistelija = (getPage: () => Page, multiplePaymentBatches: boolean) => async () => {
    const page = getPage()
    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    if (multiplePaymentBatches) {
      await clickElement(page, "label[for='set-maksuera-true']")
    } else {
      await clickElement(page, "label[for='set-maksuera-false']")
    }
    await waitForSave(page)

    await publishAvustushaku(page)
    await fillAndSendHakemus(page, avustushakuID)

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)

    // Accept the hakemus
    const { hakemusID } = await navigateToHakemuksenArviointi(page, avustushakuID, "Akaan kaupunki")

    log("Hakemus ID:", hakemusID)

    await clickElement(page, "#arviointi-tab label[for='set-arvio-status-plausible']")
    await clearAndType(page, "#budget-edit-project-budget .amount-column input", "100000")
    await Promise.all([
      clickElement(page, "#arviointi-tab label[for='set-arvio-status-accepted']"),
      waitForArvioSave(page, avustushakuID, hakemusID),
    ])

    await resolveAvustushaku(page, avustushakuID)

    // Sending päätös should give error because the hakemus is missing valmistelija
    await sendPäätös(page, avustushakuID)
    expect(await textContent(page, "#päätös-send-error")).toEqual(`Hakemukselle numero ${hakemusID} ei ole valittu valmistelijaa. Päätöksiä ei lähetetty.`)

    await selectValmistelijaForHakemus(page, avustushakuID, hakemusID, "_ valtionavustus")

    await sendPäätös(page, avustushakuID)
    const tapahtumaloki = await page.waitForSelector(".tapahtumaloki")
    const logEntryCount = await tapahtumaloki.evaluate(e => e.querySelectorAll(".entry").length)
    expect(logEntryCount).toEqual(1)
  }

  describe("should allow basic avustushaku flow and check each hakemus has valmistelija", () => {
    it("when the avustushaku has a single payment batch", allowBasicAvustushakuFlowAndCheckEachHakemusHasValmistelija(() => page, false))
    it("when the avustushaku has multiple payment batches", allowBasicAvustushakuFlowAndCheckEachHakemusHasValmistelija(() => page, true))
  })

  describe("Help texts", function() {

    it("Shown for loppuselvitys", async function() {
      await navigate(page, "/admin/loppuselvitys/")

      const selector = '[data-test-id=loppuselvitys-ohje]'
      const verifyTextRegex = /Loppuselvitysten käyttö on pakollista kaikille valtionavustuksille. Loppuselvitysten käytöstä ja aikataulusta tulee ilmoittaa avustuksen saajalle jo avustuspäätöksessä. Loppuselvityspyynnöt on hyvä toimittaa avustuksen saajille mahdollisimman pian väliselvityspyyntöjen keräämisen jälkeen tai viimeistään kuusi kuukautta ennen hankekauden päättymistä. Tällöin hankkeen yhteyshenkilö voi dokumentoida hankkeen etenemistä loppuselvityslomakkeelle jo heti väliselvityslomakkeen lähettämisestä lähtien, mutta lähettää täytetyn loppuselvityslomakkeen VA-järjestelmään vasta määräaikaan mennessä. Mikäli kyseisen valtionavustuksen kohdalla ei käytetä lainkaan väliselvityksiä, voidaan loppuselvityspyynnöt em. perustein lähettää avustuksen saajille jo hankekauden alussa. Näin vältetään esimerkiksi henkilövaihdoksista johtuva puutteellinen selvitysdokumentaatio.  Voit kopioida minkä tahansa haun loppuselvityslomakkeen sellaisenaan kopioimalla Hakulomakkeen sisältö -kentän koodin \(Loppuselvitys-välilehden lopussa\) haluamastasi haun Loppuselvitys-välilehdeltä ja liittämällä sen valmistelemasi haun vastaavaan kenttään. Loppuselvityslomaketta muokataan samalla tavalla kuin haku- ja väliselvityslomaketta. Voit lisätä, poistaa ja muokata lomakkeen kysymyksiä, ohjetekstiä ja väliotsikoita. Huomaa, että loppuselvityslomakkeeseen tekemäsi muutokset tallentuvat ainoastaan silloin kun painat Tallenna -painiketta. Seuraavat asiat on hyvä huomioida loppuselvityslomaketta muokattaessa:  Tuotokset -osiota ei suositella muokattavan Selvitys taloudesta -osio on lukittu ja sitä voidaan muokata vain pääkäyttäjän toimesta  Loppuselvityksille tehdään asia- ja taloustarkastus. Asiatarkastuksen tekee hankkeelle osoitettu yhteyshenkilö ja taloustarkastuksen OPH:n taloustarkastaja. Tarkastukset tulee tehdä mahdollisimman pian loppuselvityksen vastaanottamisen jälkeen, jotta mahdollisiin epäkohtiin voidaan puuttua välittömästi. Kun loppuselvitys on asiatarkastettu, lähettää yhteyshenkilöksi osoitettu virkailija tiedon asiatarkastuksen valmistumisesta taloustarkastajalle. Taloustarkastuksen jälkeen taloustarkastaja lähettää loppuselvityksen hyväksyntäviestin erikseen jokaiselle hankkeelle hankekohtaiselta Loppuselvitys-välilehdeltä.*/
      await verifyText(page, selector, verifyTextRegex)
    })

    it("Shown for väliselvitys", async function() {
      await navigate(page, "/admin/valiselvitys/")

      const selector = '[data-test-id=valiselvitys-ohje]'
      const verifyTextRegex = /Väliselvitysten käyttämisestä voidaan päättää hakukohtaisesti. Mikäli väliselvityksiä käytetään, tulee väliselvityksen käytöstä ja aikataulusta ilmoittaa avustuksen saajalle jo avustuspäätöksessä. Väliselvityspyynnöt on hyvä toimittaa avustuksen saajille mahdollisimman pian hankekauden alkamisen jälkeen. Tällöin hankkeen yhteyshenkilö voi dokumentoida hankkeen etenemistä väliselvityslomakkeelle jo heti hankkeen käynnistymisestä lähtien, mutta lähettää täytetyn väliselvityslomakkeen VA-järjestelmään vasta määräaikaan mennessä.  Voit kopioida minkä tahansa haun väliselvityslomakkeen sellaisenaan kopioimalla Hakulomakkeen sisältö -kentän koodin \(Väliselvitys-välilehden lopussa\) haluamasi haun Väliselvitys-välilehdeltä ja liittämällä sen valmistelemasi haun vastaavaan kenttään. Väliselvityslomaketta muokataan samalla tavalla kuin haku- ja loppuselvityslomaketta. Voit lisätä, poistaa ja muokata lomakkeen kysymyksiä, ohjetekstiä ja väliotsikoita. Huomaa, että väliselvityslomakkeeseen tekemäsi muutokset tallentuvat ainoastaan silloin kun painat Tallenna -painiketta.  Väliselvityksille tehdään ainoastaan asiatarkastus hankkeelle osoitetun yhteyshenkilön toimesta. Asiatarkastus tulee tehdä mahdollisimman pian väliselvityksen vastaanottamisen jälkeen, jotta mahdollisiin epäkohtiin voidaan puuttua. Kun väliselvitys on asiatarkastettu, lähettää yhteyshenkilöksi osoitettu virkailija väliselvityksen hyväksyntäviestin erikseen jokaiselle hankkeelle hankekohtaiselta Väliselvitys-välilehdeltä.*/
      await verifyText(page, selector, verifyTextRegex)
    })

    it("Shown for päätös", async function() {
      await navigate(page, "/admin/decision/")

      const selector = '[data-test-id=paatos-ohje]'
      const verifyTextRegex = /Jokaiselle valtionavustushakemukselle annetaan arviointien jälkeen avustuspäätös, joka on joko myönteinen tai kielteinen. Haun vastuuvalmistelija vastaa avustuspäätösten laadusta, hyväksyttämisestä ja lähettämisestä.  Päätösten laatimisessa tulee noudattaa erityistä huolellisuutta, sillä avustus tulee käyttää päätösdokumentin kirjausten mukaisesti. Päätöksen kirjaukset velvoittavat sekä avustuksen saajaa että OPH:n virkailijaa eikä avustuspäätöksen linjauksista voida poiketa ilman uutta päätöstä \(Huom! Avustuksen käyttöajan pidentäminen tai budjetin muuttaminen voidaan tehdä hyvin dokumentoidulla sähköpostikäsittelyllä, jolloin muutokset hyväksyvä sähköposti on uusi päätös\).  Avustuspäätösten laatiminen, hyväksyminen ja lähettäminen toteutetaan seuraavasti:  Laaditaan huolellisesti päätösdokumenttien tekstit VA-järjestelmässä ja täytetään kaikki muut Päätös-välilehden tiedot Viedään ASHA-järjestelmään päätöslista, myönteisen avustuspäätöksen malli, kielteisen avustuspäätöksen malli sekä ratkaisuyhteenveto Haetaan dokumenteille ASHA-järjestelmässä puolto SV-yksikön päälliköltä ja hyväksyntä valtionavustuksesta vastaavalta päälliköllä Painetaan ”Lähetä x päätöstä”-painiketta VA-järjestelmän Päätös-välilehdeltä, jolloin jokaiselle hakijalle toimitetaan avustuspäätös yhteyshenkilön ja hakijan viralliseen sähköpostiosoitteeseen.*/
      await verifyText(page, selector, verifyTextRegex)
    })
  })


  it("shows tooltip text for loppuselvitys tab in the tab bar", async function() {
    await navigate(page, "/admin/haku-editor/")
    await verifyTooltipText(
      page,
      `[data-test-id="loppuselvitys-välilehti"] a`,
      /Tällä välilehdellä laaditaan ja lähetetään avustuksen saajien loppuselvityspyynnöt. Loppuselvityslomaketta voi luonnostella jo haun suunnitteluvaiheessa, mutta kokonaisuudessaan välilehden tulee olla valmiina ja käännettynä vasta juuri ennen loppuselvityspyyntöjen lähettämistä.*/
    )
  })

  it("shows tooltip texts for arviointi tab", async function(){

    const avustushakuID = await createValidCopyOfLukioEsimerkkihakuWithValintaperusteetAndReturnTheNewId(page)
    await publishAvustushaku(page)
    await fillAndSendHakemus(page, avustushakuID)
    await navigate(page, `/avustushaku/${avustushakuID}/`)
    await clickElementWithText(page,"td", "Akaan kaupunki")

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-koulutusaste"]`,
      /Valitse hankkeelle koulutusaste, johon hanke kohdistuu. Valittavissa olevat koulutusasteet on tuotu automaattisesti Haun tiedot -välilehdeltä. Valtionavustuksen vastuuvalmistelija vastaa siitä, että kaikille myönteisen avustuspäätöksen saaville hankkeille on ennen päätösten hyväksymistä valittu oikea koulutusaste.*/
    )

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-talousarviotili"]`,
      /Valitse hankkeelle talousarviotili, jolta avustus maksetaan. Valittavissa olevat talousarviotilit on tuotu automaattisesti Haun tiedot -välilehdeltä. Valtionavustuksen vastuuvalmistelija vastaa siitä, että kaikille myönteisen avustuspäätöksen saaville hankkeille on ennen päätösten hyväksymistä valittu oikea talousarviotili.*/
    )

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-valintaperusteet"]`,
      /Valintaperusteet on tuotu automaattisesti Haun tiedot -välilehdeltä. Valtionavustuksen vastuuvalmistelijan johdolla päätetään, miten tähtiarviointeja hyödynnetään hakemusten arvioinnissa. Muiden virkailijoiden tähtiarvioinnit näkyvät vasta omien arviointien tallentamisen jälkeen. Arvioinnit näkyvät vain OPH:n virkailijoille.*/
    )

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-kommentit"]`,
      /Hankehakemusta arvioiva virkailija kirjoittaa avustuksen arviointiin liittyvät kommentit tähän kenttään ja tallentaa kommentin järjestelmään painamalla Lisää-painiketta. Mahdolliset muiden virkailijoiden kommentit tulevat näkyviin vasta oman kommentin lisäämisen jälkeen. Kommentit näkyvät vain OPH:n virkailijoille.*/
    )

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-tila"]`,
      /Hankkeen yhteyshenkilöksi osoitettu virkailija päivittää hankkeen tilaa arviointien edetessä kyseisen valtionavustuksen vastuuvalmistelijan johdolla sovittujen toimintatapojen mukaisesti. Kaikkien hakemusten tulee olla tilassa Hyväksytty tai Hylätty ennen avustuspäätösten hyväksymistä.*/
    )

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-perustelut"]`,
      /Kenttään kirjataan avustuspäätöksen hakemuskohtaiset huomiot. Tähän kenttään kirjoitetut perustelut siirtyvät sellaisenaan hakemuskohtaiseen avustuspäätökseen, jonka luonnosta voit tarkastella tämän sivunäkymän alaosan Päätös: Luonnos -linkistä. Hylätyn hakemuksen osalta suositellaan käyttämään järjestelmän tarjoamia vakioperusteluja.*/
    )

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-taydennys"]`,
      /Tämän ominaisuuden avulla voidaan pyytää avustuksen hakijalta täydennystä puutteelliseen tai virheelliseen hakemukseen. Painikkeen painamisen jälkeen virkailijalle aukeaa tekstikenttä, johon voidaan kirjata, millaisia täydennyksiä hakijalta odotetaan ja mihin mennessä täydennykset tulee kirjata järjestelmään. Täydennyspyyntö toimitetaan yhteyshenkilölle sekä haun viralliseen sähköpostiosoitteeseen. Pyyntö avaa hakemuksen hakijan muokattavaksi. Tieto täydennyspyynnöstä ja sen saatetekstistä tallentuu hakemuksen lokitietoihin ja näkyy myös Hakemusten arviointi -näkymän hakemuslistassa.*/
    )

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-huomautus"]`,
      /Päätöslistan avulla esitellään hyväksyjänä olevalle päällikölle hakemusten ja arviointien kokonaisuus. Mikäli avustuspäätöksiä hyväksyttäessä halutaan käydä tarkentavaa keskustelua joistakin hakemuksista, voidaan huomautukset kirjata tähän kenttään, jolloin ne siirtyvät automaattisesti päätöslistaan. Päätöslistan avaat painamalla Hakemusten arviointi -näkymän alaosan linkkiä, jossa on avustusten lukumäärä \(esim. 60\/60 hakemusta\). Huomautukset näkyvät vain OPH:n virkailijoille.*/
    )

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-talousarvio"]`,
      /Hankkeen yhteyshenkilöksi osoitettu virkailija voi muokata Hyväksytty-sarakkeen kenttiin hakijan hankebudjettia menoluokittain. Tässä osiossa kirjattu budjetti siirtyy automaattisesti hankekohtaiseen avustuspäätökseen ja muodostaa hankkeelle hyväksytyn budjetin.*/
    )

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-muokkaa-hakemusta"]`,
      /Hankkeen yhteyshenkilöksi osoitettu virkailija voi muokata hakemusta hakijan pyynnöstä esimerkiksi virheellisten yhteystietojen osalta. Painikkeen painamisen jälkeen virkailijan tulee kirjoittaa hakemuksen muokkaamisen syy, joka tallentuu hakemuksen lokitietoihin. Hakemuksen sisällöllisissä muokkauksissa suositellaan käyttämään aina Täydennyspyyntö-ominaisuutta.*/
    )

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-peruuta-hakemus"]`,
      /Hankkeen yhteyshenkilöksi osoitettu virkailija voi peruuttaa hakemuksen tilanteessa, jossa hakija haluaa vetää hakemuksensa kokonaan pois arvioinneista saamatta hakemukselleen lainkaan päätöstä. Hakemuksen peruuttamisen myötä hakemus siirtyy arkistoon ja poistuu Hakujen arviointi -hakemuslistasta. Hakemuksen peruuttaminen tulee dokumentoida seikkaperäisesti Valmistelijan huomiot -kenttään. Hakijan pyyntö hakemuksen peruuttamiseksi tulee todentaa esimerkiksi liittämällä asiasta käyty sähköpostikeskustelu Seuranta-välilehden Liitteet-osioon.*/
    )

    const setHakemusStateToRatkaistu = async (page: Page, avustushakuID: number) => {
      await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
      await clickElement(page, '[for=set-status-resolved]')
    }

    await setHakemusStateToRatkaistu(page, avustushakuID)

    await navigate(page, `/avustushaku/${avustushakuID}/`)
    await clickElementWithText(page,"td", "Akaan kaupunki")

    await verifyTooltipText(
      page,
      `[data-test-id="tooltip-laheta-email-uudestaan"]`,
      /Hankkeelle voidaan lähettää päätössähköposti uudestaan koska tahansa hakukohtaisten avustuspäätösten laatimisen jälkeen. Painiketta painamalla hakijalle lähetetään avustuspäätös sekä yhteyshenkilön että hakijan viralliseen sähköpostiosoitteeseen. Päätössähköpostissa olevan linkin kautta avustuksen saaja voi päivittää hankkeen yhteyshenkilöä itse, joten tätä ominaisuutta voi hyödyntää esimerkiksi henkilövaihdosten kirjaamisessa järjestelmään.*/
    )

  })

  it("shows tooltip texts for päätös tab", async function() {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    await navigate(page, "/admin/haku-editor/")
    await verifyTooltipText(
      page,
      `[data-test-id="päätös-välilehti"] a`,
      /Tällä välilehdellä laaditaan ja lähetetään hakijoiden avustuspäätös-dokumentit. Päätöstä voi luonnostella jo haun suunnitteluvaiheessa, mutta kokonaisuudessaan välilehden tulee olla valmiina ja käännettynä ennen haun ratkaisua ja päätösten lähettämistä.*/
    )

    await gotoPäätösTab(page, avustushakuID);

    const decisionEditor = await page.waitForSelector(".decision-editor", { visible: true })
    const mainHelpText = await page.evaluate(element => element.textContent, decisionEditor)
    expect(mainHelpText).toMatch(/.*Jokaiselle valtionavustushakemukselle annetaan arviointien jälkeen avustuspäätös, joka on joko myönteinen tai kielteinen\. Haun vastuuvalmistelija vastaa avustuspäätösten laadusta, hyväksyttämisestä ja lähettämisestä\..*/)

    await verifyTooltipText(
      page,
      `[data-test-id="taustaa"] label a`,
      /Kuvaa hakuaika, vastaanotettujen hakemuksien lukumäärä, vastaanotettujen hakemusten yhteenlaskettu haettu avustussumma, hyväksyttyjen hakemusten lukumäärä sekä myönnetyn avustuksen määrä kokonaisuudessaan.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="myonteinenlisateksti"] label a`,
      /Kuvaa avustuksen saajille hankkeen toteuttamista ohjaavia lisätietoja. Näitä voivat olla esimerkiksi avustuksella tavoiteltavat tulokset ja vaikutukset, vaatimus hankesuunnitelman mukaisesta avustuksen käytöstä, vaatimus VA-yleisohjeen noudattamisesta sekä avustuksen saajan muut tehtävät ja velvollisuudet. Mikäli haulle on valittu useita koulutusasteita Haun tiedot -välilehdellä, voidaan jokaiselle koulutusasteelle kirjoittaa oma myönteisen päätöksen lisäteksti.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="sovelletutsaannokset"] label a`,
      /Viitataan niihin lakeihin ja säädöksiin, joita valtionavustuserän osalta noudatetaan, esim. Valtionavustuslaki 688\/2001*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="kayttooikeudet"] label a`,
      /Käytetään valmista mallivastausta:.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="kayttotarkoitus"] label a`,
      /Kuvaa avustuksen käyttötarkoitus. Mihin tarkoituksiin avustusta voi käyttää ja mihin tarkoituksiin avustuksen käyttöä ei sallita. Käyttötarkoitusta ohjaavien päätöskirjausten tulee olla linjassa sekä hakutiedotteen kirjausten että hakulomakkeen budjetti-informaation kanssa.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="kayttoaika"] label a`,
      /Kuvataan milloin avustuksen käyttöaika alkaa ja päättyy. Useimmiten käyttöaika alkaa avustuspäätöstä seuraavasta päivästä, vaikka avustusta ei olisikaan vielä maksettu avustuksen saajan tilille. Avustuksen käyttöaika asetetaan päättyväksi siten kuin on hakutiedotteessa ilmoitettu.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="selvitysvelvollisuus"] label a`,
      /Kuvataan selvitysvelvollisuus ja mahdollisen väliselvityksen sekä loppuselvityksen aikataulutus. Informoidaan avustuksen saajaan siitä, miten ja milloin selvityslomakkeet avustuksen saajille toimitetaan. Voidaan lisäksi tarkentaa selvitykseen ja kirjanpitoon liittyviä ehtoja.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="hyvaksyminen"] label a`,
      /Kuvataan avustuksen saajalle, miten hänen pitää toimia tilanteessa, jossa hän ei ota myönnettyä avustusta vastaan. Aseta avustuksesta kieltäytymiselle määräaika. Kieltäytyminen tulee tehdä sekä OPH:n kirjaamoon että avustuspäätöksessä osoitetulle OPH:n yhteyshenkilölle.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="johtaja"] label a`,
      /Päätöksen hyväksyy sen yksikön päällikkö, jonka vastuulle kyseinen valtionavustushaku kuuluu. Hyväksyjä kirjoitetaan muodossa titteli etunimi sukunimi.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="valmistelija"] label a`,
      /Esittelijänä toimii valtionavustushaun vastuuvalmistelija. Esittelijä kirjoitetaan muodossa titteli etunimi sukunimi.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="maksu"] label a`,
      /Kuvataan, että maksetaanko avustus yhdessä vai useammassa erässä ja milloin avustusten maksaminen toteutetaan. Maksupäivämäärää ei tarvitse tarkasti yksilöidä vaan se voidaan kirjata esimerkiksi muodossa ”yhdessä erässä viimeistään xx.x.xxxx”.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="valiselvitys"] a`,
      /Kirjataan päivämäärä \(muodossa xx.x.xxxx\), jolloin väliselvitys on viimeistään toimitettava OPH:n valtionavustusjärjestelmään. Yleensä väliselvitysten viimeinen toimituspäivämäärä noin hankekauden puolivälissä. Suositellaan käyttämään valitun kuukauden viimeistä päivää. Kirjattu päivämäärä siirtyy automaattisesti Väliselvitys-välilehdelle sekä Väliselvitys-välilehdeltä lähetettävän väliselvityspyynnön sähköpostiviestiin.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="loppuselvitys"] a`,
      /Kirjataan päivämäärä \(muodossa xx.x.xxxx\), jolloin loppuselvitys on viimeistään toimitettava OPH:n valtionavustusjärjestelmään. Loppuselvitysten viimeinen toimituspäivämäärä on kaksi kuukautta avustuksen käyttöajan päättymisestä. Kirjattu päivämäärä siirtyy automaattisesti Loppuselvitys-välilehdelle sekä Loppuselvitys-välilehdeltä lähetettävän loppuselvityspyynnön sähköpostiviestiin.*/
    )
    await verifyTooltipText(
      page,
      `[data-test-id="paatoksenliitteet"] a`,
      /Jokaisen päätöksen oheen liitetään oikaisuvaatimusosoitus sekä valtionavustusten yleisohje. */
    )
  })

  it("shows the same updated date on the Päätös tab as on the Väliselvitys and Loppuselvitys tabs", async function() {

    await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    await clickElementWithText(page, "span", "Päätös")
    const paatosUpdatedAt = textContent(page, "#paatosUpdatedAt")

    await clickElementWithText(page, "span", "Väliselvitys")
    const valiselvitysUpdatedAt = textContent(page, "#valiselvitysUpdatedAt")

    await clickElementWithText(page, "span", "Loppuselvitys")
    const loppuselvitysUpdatedAt = textContent(page, "#loppuselvitysUpdatedAt")

    return Promise.all([paatosUpdatedAt, valiselvitysUpdatedAt, loppuselvitysUpdatedAt])
      .then(([paatos, valiselvitys, loppuselvitys]) => {
        expect(paatos).toEqual(valiselvitys)
        expect(paatos).toEqual(loppuselvitys)
      })
  })

  it("updates only the update date on Päätös tab when päätös is modified", async function() {

    await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    await clickElementWithText(page, "span", "Päätös")

    await page.waitFor(70000)
    await clearAndType(page, "#decision\\.taustaa\\.fi", "Burger Time")
    await waitForSave(page)

    const paatosUpdatedAt = textContent(page, "#paatosUpdatedAt")

    await clickElementWithText(page, "span", "Väliselvitys")
    const valiselvitysUpdatedAt = textContent(page, "#valiselvitysUpdatedAt")

    await clickElementWithText(page, "span", "Loppuselvitys")
    const loppuselvitysUpdatedAt = textContent(page, "#loppuselvitysUpdatedAt")

    return Promise.all([paatosUpdatedAt, valiselvitysUpdatedAt, loppuselvitysUpdatedAt])
      .then(([paatos, valiselvitys, loppuselvitys]) => {
        expect(valiselvitys).toEqual(loppuselvitys)
        expect(paatos).not.toEqual(valiselvitys)
      })
  })

  it("supports fields that accept only decimals", async function() {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId, fieldLabel } = await addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel(page, avustushakuID, "decimalField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page)

    await fillAndSendHakemus(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectValidationError(page, fieldId, 'Not an decimal', fieldLabel, 'fi: Syötä yksi numeroarvo')
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, '4.2')
    })
  })

  it("supports fields that accept only whole numbers", async function() {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId, fieldLabel } = await addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel(page, avustushakuID, "integerField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page)

    await fillAndSendHakemus(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectValidationError(page, fieldId, 'Not an integer', fieldLabel, 'fi: Syötä arvo kokonaislukuina')
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, '420')
    })
  })

  it("supports editing and saving the values of the fields", async function() {

    await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    await clickElementWithText(page, "span", "Hakulomake")
    await page.waitForFunction(() => (document.querySelector("button#saveForm") as HTMLInputElement).disabled === true)
    await clearAndType(page, "textarea[name='duration-help-text-fi']", "Gimblegamble")
    await page.waitForFunction(() => (document.querySelector("button#saveForm") as HTMLInputElement).disabled === false)
  })


  it("produces väliselvitys sheet in excel export", async function() {
    const { avustushakuID } = await ratkaiseAvustushaku(page)

    await verifyTooltipText(
      page,
      `[data-test-id="väliselvitys-välilehti"] a`,
      /Tällä välilehdellä laaditaan ja lähetetään avustuksen saajien väliselvityspyynnöt.*/
    )

    await gotoVäliselvitysTab(page, avustushakuID)
    await clickElementWithText(page, "button", "Lähetä väliselvityspyynnöt")
    const responseP = page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/send-notification`)
    await waitForElementWithText(page, "span", "Lähetetty 1 viestiä")
    const response: any = await (responseP.then(_ => _.json()))
    const väliselvitysKey = response.hakemukset[0].user_key
    log(`Väliselvitys user_key: ${väliselvitysKey}`)

    await fillAndSendVäliselvityspyyntö(page, avustushakuID, väliselvitysKey)

    const workbook = await downloadExcelExport(page, avustushakuID)

    expect(workbook.SheetNames).toMatchObject([ "Hakemukset", "Hakemuksien vastaukset", "Väliselvityksien vastaukset", "Loppuselvityksien vastaukset", "Tiliöinti" ])
    const sheet = workbook.Sheets["Väliselvityksien vastaukset"]

    expect(sheet.B1.v).toEqual("Hakijaorganisaatio")
    expect(sheet.B2.v).toEqual("Akaan kaupungin kissojenkasvatuslaitos")

    expect(sheet.C1.v).toEqual("Hankkeen nimi")
    expect(sheet.C2.v).toEqual("Kissojen koulutuksen tehostaminen")
  })

  it("should allow user to add koodistokenttä to form and save it", async function() {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    await navigate(page, `/admin/form-editor/?avustushaku=${avustushakuID}`)
    // Add new Koodistokenttä
    await page.hover(".soresu-field-add-header")
    await clickElementWithText(page, "a", "Koodistokenttä")
    // Select koodisto for the field
    const input = await page.waitFor(".koodisto-dropdown input")
    await input.type("automaatio")
    await clickElementWithText(page, "li", "automaatioyliasentajan eat järjestys")
    // Select input type for the field
    await clickElementWithText(page, "label", "Pudotusvalikko")

    await clickFormSaveAndWait(page, avustushakuID)
  })

  it("shows the contents of the project-nutshell -field of a hakemus in external api as 'nutshell'", async function() {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId } = await addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, "project-nutshell", "textField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page)

    const randomValueForProjectNutshell = randomString()
    const hakemusID = await fillAndSendHakemusAndReturnHakemusId(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, randomValueForProjectNutshell)
    })

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
    await acceptHakemus(page, avustushakuID, hakemusID, async () => {
      await clickElementWithTestId(page, 'tab-seuranta')
      await clickElementWithTestId(page, 'set-allow-visibility-in-external-system-true')
      await waitForSave(page)
    })

    const expectedResponse = await expectedResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID, hakemusID, randomValueForProjectNutshell)
    const actualResponse = await actualResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID)
    expect(actualResponse).toMatchObject(expectedResponse)
  })

  it("allows previewing täydennyspyyntö to hakija", async () => {
    const randomId = randomString()
    const { avustushakuID } = await publishAndFillMuutoshakemusEnabledAvustushaku(page, {
      registerNumber: "1621/2020",
      avustushakuName: `Täydennyspyyntöavustushaku ${randomId}`,
    }, {
      contactPersonEmail: "lotta.lomake@example.com",
      contactPersonName: "Lotta Lomake",
      contactPersonPhoneNumber: "666",
      projectName: "Lomakkeentäyttörajoitteiset Ry",
    })
    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
    await navigateToHakemuksenArviointi(page, avustushakuID, "Akaan kaupunki")

    const täydennyspyyntöText = "Jaahas miltäköhän tämä täydennyspyyntö mahtaa näyttää sähköpostissa?"
    await fillTäydennyspyyntöField(page, täydennyspyyntöText)
    await clickElementWithText(page, "a", "Esikatsele")

    expect(await textContent(page, "[data-test-id='change-request-preview-subject']"))
      .toStrictEqual(`Otsikko: Täydennyspyyntö avustushakemukseesi`)
    expect(await textContent(page, "[data-test-id='change-request-preview-sender']"))
      .toStrictEqual(`Lähettäjä: no-reply@csc.fi`)
    expect(await textContent(page, "[data-test-id='change-request-preview-content']"))
      .toStrictEqual(`Avustushakemus: Täydennyspyyntöavustushaku ${randomId}

Täydennyspyyntö:
"${täydennyspyyntöText}"

Pääset täydentämään avustushakemusta tästä linkistä: [linkki hakemukseen]
Muokkaa vain pyydettyjä kohtia.

Lisätietoja voitte kysyä sähköpostitse osoitteesta valtionavustukset@oph.fi

Hausta vastaava valmistelija on mainittu hakutiedotteessa.

Opetushallitus
Hakaniemenranta 6
PL 380, 00531 Helsinki

puhelin 029 533 1000
faksi 029 533 1035
etunimi.sukunimi@oph.fi
`)
  })

  it("allows sending täydennyspyyntö to hakija", async () => {
    const randomId = randomString()
    const { avustushakuID, userKey } = await publishAndFillMuutoshakemusEnabledAvustushaku(page, {
      registerNumber: "1620/2020",
      avustushakuName: `Täydennyspyyntöavustushaku ${randomId}`,
    }, {
      contactPersonEmail: "lotta.lomake@example.com",
      contactPersonName: "Lotta Lomake",
      contactPersonPhoneNumber: "666",
      projectName: "Lomakkeentäyttörajoitteiset Ry",
    })
    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
    const { hakemusID } = await navigateToHakemuksenArviointi(page, avustushakuID, "Akaan kaupunki")

    expect(await getTäydennyspyyntöEmails(avustushakuID, hakemusID)).toHaveLength(0)

    const täydennyspyyntöText = "Joo ei tosta hakemuksesta ota mitään tolkkua. Voisitko tarkentaa?"
    await fillTäydennyspyyntöField(page, täydennyspyyntöText)
    await clickToSendTäydennyspyyntö(page, avustushakuID, hakemusID)

    expect(await textContent(page, "#arviointi-tab .change-request-title"))
      .toMatch(/\* Täydennyspyyntö lähetetty \d{1,2}\.\d{1,2}\.\d{4} \d{1,2}\.\d{1,2}/)
    // The quotes around täydennyspyyntö message are done with CSS :before
    // and :after pseudo elements and not shown in Node.textContent
    expect(await textContent(page, "#arviointi-tab .change-request-text"))
      .toStrictEqual(täydennyspyyntöText)

    const emails = await getTäydennyspyyntöEmails(avustushakuID, hakemusID)
    expect(emails).toHaveLength(1)
    expect(emails[0]['to-address']).toHaveLength(1)
    expect(emails[0]['to-address']).toContain("lotta.lomake@example.com")
    expect(emails[0]['bcc']).toStrictEqual("santeri.horttanainen@reaktor.com")
    expect(emails[0].formatted).toStrictEqual(`Avustushakemus: Täydennyspyyntöavustushaku ${randomId}

Täydennyspyyntö:
"Joo ei tosta hakemuksesta ota mitään tolkkua. Voisitko tarkentaa?"

Pääset täydentämään avustushakemusta tästä linkistä: ${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?hakemus=${userKey}&lang=fi
Muokkaa vain pyydettyjä kohtia.

Lisätietoja voitte kysyä sähköpostitse osoitteesta valtionavustukset@oph.fi

Hausta vastaava valmistelija on mainittu hakutiedotteessa.

Opetushallitus
Hakaniemenranta 6
PL 380, 00531 Helsinki

puhelin 029 533 1000
faksi 029 533 1035
etunimi.sukunimi@oph.fi
`)
  })

  async function fillTäydennyspyyntöField(page: Page, täydennyspyyntöText: string): Promise<void> {
    await clickElementWithText(page, "button", "Pyydä täydennystä")
    await page.type("[data-test-id='täydennyspyyntö__textarea']", täydennyspyyntöText)
  }

  async function clickToSendTäydennyspyyntö(page: Page, avustushakuID: number, hakemusID: number) {
    await Promise.all([
      page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/change-requests`),
      page.click("[data-test-id='täydennyspyyntö__lähetä']"),
    ])
  }

  it("allows resending päätös emails from päätös tab", async () => {
    const { avustushakuID, hakemusID } = await ratkaiseMuutoshakemusEnabledAvustushaku(page, {
      registerNumber: "420/2021",
      avustushakuName: `Testiavustushaku ${randomString()} - ${moment(new Date()).format('YYYY-MM-DD hh:mm:ss:SSSS')}`
    }, {
      contactPersonEmail: "yrjo.yhteyshenkilo@example.com",
      contactPersonName: "Yrjö Yhteyshenkilö",
      contactPersonPhoneNumber: "0501234567",
      projectName: "Hanke päätöksen uudelleenlähetyksen testaamiseksi",
    })
    const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(avustushakuID, hakemusID)

    let emails = await getAcceptedPäätösEmails(avustushakuID, hakemusID)
    expect(emails).toHaveLength(1)
    let email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "yrjo.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])

    await resendPäätökset(avustushakuID)
    emails = await getAcceptedPäätösEmails(avustushakuID, hakemusID)
    expect(emails).toHaveLength(2)
    email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "yrjo.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])

    await changeContactPersonEmail(page, linkToMuutoshakemus, "uusi.yhteyshenkilo@example.com")
    await resendPäätökset(avustushakuID)

    emails = await getAcceptedPäätösEmails(avustushakuID, hakemusID)
    expect(emails).toHaveLength(3)
    email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "uusi.yhteyshenkilo@example.com",
      "akaan.kaupunki@akaa.fi"
    ])
  })

  async function resendPäätökset(avustushakuID: number): Promise<void> {
    await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
    await clickElementWithText(page, "button", "Lähetä 1 päätöstä uudelleen")
    await clickElementWithText(page, "button", "Vahvista päätösten uudellenlähetys")
    await waitForElementWIthTestId(page, "resend-completed-message")
  }

  async function changeContactPersonEmail(page: Page, linkToMuutoshakemus: string, email: string): Promise<void> {
    await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
    await clearAndType(page, '#muutoshakemus__email', email)
    await clickElement(page, "#send-muutospyynto-button")
  }

  it("Allows modification of applications after they've been resolved", async function () {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId } = await addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, "project-nutshell", "textField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page)

    const randomValueForProjectNutshell = randomString()
    const hakemusID = await fillAndSendHakemusAndReturnHakemusId(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, randomValueForProjectNutshell)
    })

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
    await acceptHakemus(page, avustushakuID, hakemusID, async () => {
      await clickElementWithTestId(page, 'tab-seuranta')
      await clickElementWithTestId(page, 'set-allow-visibility-in-external-system-true')
      await waitForSave(page)
    })

    const expectedResponse = await expectedResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID, hakemusID, randomValueForProjectNutshell)
    const actualResponse = await actualResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID)
    expect(actualResponse).toMatchObject(expectedResponse)

    const enabledSubmitButtonSelector = '#virkailija-edit-submit:not([disabled])'
    const kesayliopistoButtonSelector = `[for="type-of-organization.radio.1"]`

    await navigateToHakemus(page, avustushakuID, hakemusID)
    await clickElementWithText(page, "button", "Muokkaa hakemusta")
    const newPagePromise = new Promise<Page>(x => browser.once('targetcreated', target => x(target.page())))
    await clickElementWithText(page, "button", "Siirry muokkaamaan")
    const modificationPage = await newPagePromise
    await modificationPage.bringToFront()
    await clickElement(modificationPage, kesayliopistoButtonSelector)
    await clickElement(modificationPage, enabledSubmitButtonSelector)

    const organizationType = await textContent(modificationPage, '[id=type-of-organization] span')
    expect(organizationType).toBe('Kesäyliopisto')
  })

  it("shows the contents of the project-goals -field of a hakemus in external api as 'nutshell'", async function() {

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId } = await addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, "project-goals", "textField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page)

    const randomValueForProjectNutshell = randomString()
    const hakemusID = await fillAndSendHakemusAndReturnHakemusId(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, randomValueForProjectNutshell)
    })

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
    await acceptHakemus(page, avustushakuID, hakemusID, async () => {
      await clickElementWithTestId(page, 'tab-seuranta')
      await clickElementWithTestId(page, 'set-allow-visibility-in-external-system-true')
      await waitForSave(page)
    })

    const expectedResponse = await expectedResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID, hakemusID, randomValueForProjectNutshell)
    const actualResponse = await actualResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID)
    expect(actualResponse).toMatchObject(expectedResponse)
  })

  it("creates a new koodi", async function() {

    await navigate(page, '/admin-ui/va-code-values/')
    const code = await createUniqueCode(page)

    await navigate(page, '/admin-ui/va-code-values/')
    await page.waitForSelector(`tr[data-test-id="${code}"]`)
  })

  it("sets a koodi hidden and visible", async function() {

    await navigate(page, '/admin-ui/va-code-values/')
    const code = await createUniqueCode(page)
    await assertCodeIsVisible(page, code, true)
    await navigate(page, '/admin-ui/va-code-values/')

    await clickCodeVisibilityButton(page, code, false)
    await assertCodeIsVisible(page, code, false)
    await navigate(page, '/admin-ui/va-code-values/')
    await assertCodeIsVisible(page, code, false)

    await clickCodeVisibilityButton(page, code, true)
    await assertCodeIsVisible(page, code, true)
    await navigate(page, '/admin-ui/va-code-values/')
    await assertCodeIsVisible(page, code, true)
  })

  it('hides a koodi from the dropdowns in haku editor', async function() {

    // create code
    await navigate(page, '/admin-ui/va-code-values/')
    const code = await createUniqueCode(page)
    await assertCodeIsVisible(page, code, true)

    // check code is visible in dropdown
    await navigate(page, '/admin/haku-editor/')
    await clearAndType(page, '[data-test-id=code-value-dropdown__operational-unit] > div', `${code}`)
    await page.waitForSelector(`[data-test-id="${code}"]`)

    // hide code
    await navigate(page, '/admin-ui/va-code-values/')
    await clickCodeVisibilityButton(page, code, false)
    await assertCodeIsVisible(page, code, false)
    await page.waitForSelector(`[data-test-id="${code}"]`)

    // check no results are found
    await navigate(page, '/admin/haku-editor/')
    await clearAndType(page, '[data-test-id=code-value-dropdown__operational-unit] > div', `${code}`)
    await page.waitForSelector('[data-test-id=code-value-dropdown__operational-unit] [data-test-id=code-value-dropdown__no-options]')
  })

  describe("Muutospäätösprosessi", () => {
    function createRandomHakuValues() {
      return {
        registerNumber: "230/2015",
        avustushakuName: `Testiavustushaku (Muutospäätösprosessi) ${randomString()} - ${moment(new Date()).format('YYYY-MM-DD hh:mm:ss:SSSS')}`
      }
    }

    const answers = {
      contactPersonEmail: "erkki.esimerkki@example.com",
      contactPersonName: "Erkki Esimerkki",
      contactPersonPhoneNumber: "666",
      projectName: "Rahassa kylpijät Ky Ay Oy",
    }

    const muutoshakemus1: MuutoshakemusValues = {
      jatkoaika: moment(new Date())
        .add(2, 'months')
        .add(1, 'days')
        .locale('fi'),
      jatkoaikaPerustelu: 'Ei kyl millään ehdi deadlineen mennessä ku mun koira söi ne tutkimustulokset'
    }

    const muutoshakemus2: MuutoshakemusValues = {
      jatkoaika: moment(new Date())
        .add(1, 'months')
        .add(3, 'days')
        .locale('fi'),
      jatkoaikaPerustelu: 'Kerkeehän sittenkin'
    }

    const muutoshakemus3: MuutoshakemusValues = {
      jatkoaika: moment(new Date())
        .add(4, 'months')
        .add(6, 'days')
        .locale('fi'),
      jatkoaikaPerustelu: 'Jaa ei kyllä kerkeekkään'
    }

    const muutoshakemus4: MuutoshakemusValues = {
      jatkoaika: moment(new Date())
        .add(3, 'months')
        .add(8, 'days')
        .locale('fi'),
      jatkoaikaPerustelu: 'Final muutoshakemus koira 2'
    }

    it("Avustushaun ratkaisu should send an email with link to muutoshakemus", async () => {
      const { avustushakuID, hakemusID } = await ratkaiseMuutoshakemusEnabledAvustushaku(page, createRandomHakuValues(), answers)

      const userKey = await getUserKey(avustushakuID, hakemusID)

      const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(avustushakuID, hakemusID)
      expect(linkToMuutoshakemus).toContain(`${HAKIJA_URL}/muutoshakemus?lang=fi&user-key=${userKey}&avustushaku-id=${avustushakuID}`)
    })

    it("Avustushaun ratkaisu should send an email without link to muutoshakemus if storing normalized hakemus fields is not possible", async () => {
      const { avustushakuID, hakemusID } = await ratkaiseAvustushaku(page)
      const emails = await getMuutoshakemusEmails(avustushakuID, hakemusID)
      emails.forEach(email => {
        expect(email.formatted).not.toContain(`${HAKIJA_URL}/muutoshakemus`)
      })
    })

    describe('Virkailija', () => {
      const haku = createRandomHakuValues()
      let avustushakuID: number
      let hakemusID: number

      beforeAll(async () => {
        const hakemusIdAvustushakuId = await ratkaiseMuutoshakemusEnabledAvustushaku(page, haku, answers)
        avustushakuID = hakemusIdAvustushakuId.avustushakuID
        hakemusID = hakemusIdAvustushakuId.hakemusID
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus1)
      })

      it('can see values of a new muutoshakemus', async () => {
        await navigate(page, `/avustushaku/${avustushakuID}/`)
        const muutoshakemusStatusField = `[data-test-id=muutoshakemus-status-${hakemusID}]`
        await page.waitForSelector(muutoshakemusStatusField)
        const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField, el => el.textContent)
        expect(muutoshakemusStatus).toEqual('☆ Uusi')
        await page.click(muutoshakemusStatusField)

        await page.waitForFunction(() => (document.querySelector('[data-test-id=number-of-pending-muutoshakemukset]') as HTMLInputElement).innerText === '1')
        const numOfMuutosHakemuksetElement = await page.waitForSelector('[data-test-id=number-of-pending-muutoshakemukset]', { visible: true })
        const color = await page.evaluate(e => getComputedStyle(e).color, numOfMuutosHakemuksetElement)
        expect(color).toBe('rgb(255, 0, 0)') // red

        await clickElement(page, 'span.muutoshakemus-tab')
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus1)
      }, 150 * 1000)

      it('can preview paatos of a new muutoshakemus', async () => {
        await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
        await clickElement(page, 'span.muutoshakemus-tab')
        await selectVakioperustelu(page)

        // accepted preview
        await clickElement(page, 'a.muutoshakemus__paatos-preview-link')
        await validateMuutoshakemusPaatosCommonValues(page)
        const acceptedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
        expect(acceptedPaatos).toEqual('Opetushallitus hyväksyy muutokset hakemuksen mukaisesti.')
        await assertAcceptedPäätösHasVakioperustelu(page)
        await clickElement(page, 'button.hakemus-details-modal__close-button')

        // rejected preview
        await clickElement(page, 'label[for="rejected"]')
        await selectVakioperustelu(page)
        await clickElement(page, 'a.muutoshakemus__paatos-preview-link')
        await validateMuutoshakemusPaatosCommonValues(page)
        const rejectedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
        expect(rejectedPaatos).toEqual('Opetushallitus hylkää muutoshakemuksen.')
        await assertRejectedPäätösHasVakioperustelu(page)
      })

      async function assertAcceptedPäätösHasVakioperustelu(page: Page): Promise<void> {
        await assertPäätösHasPerustelu(page, 'Opetushallitus katsoo, että päätöksessä hyväksytyt muutokset tukevat hankkeen tavoitteiden saavuttamista.')
      }

      async function assertRejectedPäätösHasVakioperustelu(page: Page): Promise<void> {
        await assertPäätösHasPerustelu(page, 'Opetushallitus on arvioinut hakemuksen. Asiantuntija-arvioinnin perusteella on Opetushallitus asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.')
      }

      async function assertPäätösHasPerustelu(page: Page, perustelu: string): Promise<void> {
        const acceptedReason = await page.$eval('[data-test-id="paatos-reason"]', el => el.textContent)
        expect(acceptedReason).toEqual(perustelu)
      }

      it('gets an email with link to hakemus', async () => {
          const emails = await getValmistelijaEmails(avustushakuID, hakemusID)

          const title = emails[0]?.formatted.match(/Hanke:.*/)?.[0]
          expectToBeDefined(title)
          expect(title).toContain(`${haku.registerNumber} - ${answers.projectName}`)

          const linkToHakemus = await getLinkToHakemusFromSentEmails(avustushakuID, hakemusID)
          expect(linkToHakemus).toEqual(`${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
      })

      it('can reject a muutoshakemus', async () => {
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus1, { status: 'rejected'})

        await navigate(page, `/avustushaku/${avustushakuID}/`)
        const muutoshakemusStatusField = `[data-test-id=muutoshakemus-status-${hakemusID}]`
        await page.waitForSelector(muutoshakemusStatusField)
        const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField, el => el.textContent)
        expect(muutoshakemusStatus).toEqual('Hylätty')

        await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
        await clickElement(page, 'span.muutoshakemus-tab')
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus1, { status: 'rejected'})

        const paatosUrl = await page.$eval('a.muutoshakemus__paatos-link', el => el.textContent) || ''
        await page.goto(paatosUrl, { waitUntil: "networkidle0" })
        await validateMuutoshakemusPaatosCommonValues(page)
        const rejectedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
        expect(rejectedPaatos).toEqual('Opetushallitus hylkää muutoshakemuksen.')
        await assertRejectedPäätösHasVakioperustelu(page)
      })

      it('can accept a muutoshakemus', async () => {
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)

        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus4)
        await makePaatosForMuutoshakemusIfNotExists(page, 'accepted', avustushakuID, hakemusID)
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus4, { status: 'accepted'})

        const oldProjectEnd = await getElementInnerText(page, ".answer-old-value #project-end div")
        expect(oldProjectEnd).toEqual("13.03.2032")
        const newProjectEnd = await getElementInnerText(page, ".answer-new-value #project-end div")
        expect(newProjectEnd).toEqual(muutoshakemus4.jatkoaika?.format('DD.MM.YYYY'))

        await navigate(page, `/avustushaku/${avustushakuID}/`)
        const muutoshakemusStatusField = `[data-test-id=muutoshakemus-status-${hakemusID}]`
        await page.waitForSelector(muutoshakemusStatusField)
        const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField, el => el.textContent)
        expect(muutoshakemusStatus).toEqual('Hyväksytty')

        await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
        await clickElement(page, 'span.muutoshakemus-tab')
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus4, { status: 'accepted'})

        const paatosUrl = await page.$eval('a.muutoshakemus__paatos-link', el => el.textContent) || ''
        await page.goto(paatosUrl, { waitUntil: "networkidle0" })
        await validateMuutoshakemusPaatosCommonValues(page)
        const acceptedPaatos = await page.$eval('[data-test-id="paatos-paatos"]', el => el.textContent)
        expect(acceptedPaatos).toEqual('Opetushallitus hyväksyy muutokset hakemuksen mukaisesti.')
        await assertAcceptedPäätösHasVakioperustelu(page)
      })

      it('can see values of multiple muutoshakemus', async () => {
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)

        // create two new muutoshakemus
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus2)
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus3)

        // assert newest muutoshakemus is new
        await navigate(page, `/avustushaku/${avustushakuID}/`)
        const muutoshakemusStatusField = `[data-test-id=muutoshakemus-status-${hakemusID}]`
        await page.waitForSelector(muutoshakemusStatusField)
        const muutoshakemusStatus = await page.$eval(muutoshakemusStatusField, el => el.textContent)
        expect(muutoshakemusStatus).toEqual('☆ Uusi')

        // assert tabs work and data can be seen
        await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
        await page.waitForFunction(() => (document.querySelector('[data-test-id=number-of-pending-muutoshakemukset]') as HTMLInputElement).innerText === '4')
        await clickElement(page, 'span.muutoshakemus-tab')
        await page.waitForSelector('[data-test-id=muutoshakemus-jatkoaika]')
        await validateMuutoshakemusValues(page, muutoshakemus3)
        await clickElement(page, 'button.muutoshakemus-tabs__tab:nth-child(2)')
        await validateMuutoshakemusValues(page, muutoshakemus2, { status: 'rejected' })
        await clickElement(page, 'button.muutoshakemus-tabs__tab:nth-child(3)')
        await validateMuutoshakemusValues(page, muutoshakemus4, { status: 'accepted' })
        await clickElement(page, 'button.muutoshakemus-tabs__tab:nth-child(4)')
        await validateMuutoshakemusValues(page, muutoshakemus1, { status: 'rejected' })
      })

      it('hakija gets an email with link to paatos and link to new muutoshakemus', async () => {
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
        const emails = await getMuutoshakemusPaatosEmails(avustushakuID, hakemusID)

        const title = emails[0]?.formatted.match(/Hanke:.*/)?.[0]
        expectToBeDefined(title)
        expect(title).toContain(`${haku.registerNumber} - ${answers.projectName}`)

        const linkToMuutoshakemusPaatosRegex = /https?:\/\/.*\/muutoshakemus\/paatos.*/
        const linkToMuutoshakemusPaatos = emails[0]?.formatted.match(linkToMuutoshakemusPaatosRegex)?.[0]
        expectToBeDefined(linkToMuutoshakemusPaatos)
        expect(linkToMuutoshakemusPaatos).toMatch(/https?:\/\/[^\/]+\/muutoshakemus\/paatos\?user-key=[a-f0-9]{64}/)

        const linkToMuutoshakemus = emails[0]?.formatted.match(linkToMuutoshakemusRegex)?.[0]
        expectToBeDefined(linkToMuutoshakemus)
        expect(linkToMuutoshakemus).toMatch(/https?:\/\/[^\/]+\/muutoshakemus\?.*/)
      })

      describe('When approving muutoshakemus with changed päättymispäivä', () => {

        beforeAll(async () => {
          await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
          const muutoshakemus = { ...muutoshakemus4, ...{ jatkoaikaPerustelu: 'Voit laittaa lisäaikaa ihan omantunnon mukaan.' }}
          await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus)

          await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/`)
          await clickElement(page, 'span.muutoshakemus-tab')
          await page.click(`label[for="accepted_with_changes"]`)
          await setCalendarDate(page, '20.04.2400')
          await selectVakioperustelu(page)
        })

        it('Correct päättymispäivä is displayed in päätös preview', async () => {
          await clickElement(page, 'a.muutoshakemus__paatos-preview-link')
          const acceptedDate = await page.$eval('[data-test-id="paattymispaiva-value"]', el => el.textContent)
          expect(acceptedDate).toBe('20.4.2400')
          await clickElement(page, 'button.hakemus-details-modal__close-button')
        })

        describe('After sending päätös', () => {
          beforeAll( async () => {
            await page.click('[data-test-id="muutoshakemus-submit"]:not([disabled])')
            await page.waitForSelector('[data-test-id="muutoshakemus-paatos"]')
          })

          it('Correct päättymispäivä is displayed to virkailija', async () => {
            const acceptedDate = await page.$eval('[data-test-id="muutoshakemus-jatkoaika"]', el => el.textContent)
            expect(acceptedDate).toBe('20.04.2400')
          })

          it('"Hyväksytty muutettuna" is displayed to virkailija', async () => {
            const paatosStatusText = await page.$eval('[data-test-id="paatos-status-text"]', el => el.textContent)
            expect(paatosStatusText).toBe('Hyväksytty muutettuna')
          })

          it('Changes are visible in päätösdokumentti', async () => {
            const newPagePromise = new Promise<Page>(x => browser.once('targetcreated', target => x(target.page())))
            await clickElement(page, 'a.muutoshakemus__paatos-link')
            const paatosPage = await newPagePromise
            await paatosPage.bringToFront()
            const acceptedDate = await textContent(paatosPage, '[data-test-id="paattymispaiva-value"]')
            const paatos = await textContent(paatosPage, '[data-test-id="paatos-paatos"]')

            expect(acceptedDate).toBe('20.4.2400')
            expect(paatos).toBe('Opetushallitus hyväksyy hakemuksen alla olevin muutoksin.')
            await page.bringToFront()
          })

          it('Correct päättymispäivä is displayed when creating a new muutoshakemus', async () => {
            await navigateToHakijaMuutoshakemusPage(page, avustushakuID, hakemusID)
            const acceptedDate = await textContent(page, '[data-test-id="muutoshakemus-jatkoaika"]')
            expect(acceptedDate).toBe('20.04.2400')
          })

        })
      })
    })

    describe("Changing contact person details", () => {
      let linkToMuutoshakemus: string
      let avustushakuID: number
      let hakemusID: number
      const newName = randomString()
      const newEmail = "uusi.email@reaktor.com"
      const newPhone = "0901967632"
      const haku = createRandomHakuValues()

      beforeAll(async () => {
        const { avustushakuID: avustushakuId, hakemusID: hakemusId } = await ratkaiseMuutoshakemusEnabledAvustushaku(page, haku, answers)
        avustushakuID = avustushakuId
        hakemusID = hakemusId
        linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(avustushakuID, hakemusID)
      })

      it("should show avustushaku name, project name, and registration number as well as name, email and phone number for contact person", async () => {

        expectToBeDefined(linkToMuutoshakemus)
        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
        const avustushakuNameSpan = await page.waitForSelector("[data-test-id=avustushaku-name]", { visible: true })
        const avustushakuName = await page.evaluate(element => element.textContent, avustushakuNameSpan)

        const projectNameDiv = await page.waitForSelector("[data-test-id=project-name]", { visible: true })
        const projectName = await page.evaluate(element => element.textContent, projectNameDiv)

        const registerNumberSpan = await page.waitForSelector("[data-test-id=register-number]", { visible: true })
        const registerNumber = await page.evaluate(element => element.textContent, registerNumberSpan)

        const contactPersonInput = await page.waitForSelector("#muutoshakemus__contact-person", { visible: true })
        const contactPerson = await page.evaluate(element => element.value, contactPersonInput)

        const contactPersonEmailInput = await page.waitForSelector("#muutoshakemus__email", { visible: true })
        const contactPersonEmail = await page.evaluate(element => element.value, contactPersonEmailInput)

        const contactPersonPhoneInput = await page.waitForSelector("#muutoshakemus__phone", { visible: true })
        const contactPersonPhoneNumber = await page.evaluate(element => element.value, contactPersonPhoneInput)

        expect(avustushakuName).toEqual(haku.avustushakuName)
        expect(projectName).toEqual(answers.projectName)
        expect(registerNumber).toEqual(haku.registerNumber)
        expect(contactPerson).toEqual(answers.contactPersonName)
        expect(contactPersonEmail).toEqual(answers.contactPersonEmail)
        expect(contactPersonPhoneNumber).toEqual(answers.contactPersonPhoneNumber)
      })

      it("should show original hakemus", async() => {
        expectToBeDefined(linkToMuutoshakemus)
        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
        const iframe = await page.waitForSelector("iframe[data-test-id=original-hakemus]")
        if (!iframe) throw Error("Original hakemus iframe not found on page :mad:")
        const frameContent = await iframe.contentFrame()
        if (!frameContent) throw Error("Original hakemus frameContent not found on page :mad:")

        expect(await getElementInnerText(frameContent, "[id='signatories-fieldset-1.name']"))
          .toStrictEqual(answers.contactPersonName)
        expect(await getElementInnerText(frameContent, "#business-id"))
          .toStrictEqual(TEST_Y_TUNNUS)
      })

      it("Save button deactivates when contact person email does not validate", async () => {
        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })

        await page.waitForSelector("#send-muutospyynto-button", { visible: true })

        const sendMuutospyyntoButtonIsDisabled = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
        expect(sendMuutospyyntoButtonIsDisabled).toBeTruthy()

        await clearAndType(page, '#muutoshakemus__contact-person', newName)
        await clearAndType(page, '#muutoshakemus__email', "not-email")
        await clearAndType(page, '#muutoshakemus__phone', newPhone)

        const sendMuutospyyntoButtonIsDisabledAfterInvalidEmail = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
        expect(sendMuutospyyntoButtonIsDisabledAfterInvalidEmail).toBeTruthy()

        const emailInputFieldClassWhenInvalidEmail = await getElementAttribute(page, "#muutoshakemus__email", "class")
        expectToBeDefined(emailInputFieldClassWhenInvalidEmail)
        expect(emailInputFieldClassWhenInvalidEmail).toContain("error")

        await clearAndType(page, '#muutoshakemus__email', newEmail)

        const sendMuutospyyntoButtonIsDisabledAfterChange = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
        expect(sendMuutospyyntoButtonIsDisabledAfterChange).toBeFalsy()

        const emailInputFieldClassWithValidEmail = await getElementAttribute(page, "#muutoshakemus__email", "class")
        expect(emailInputFieldClassWithValidEmail).toBeFalsy()
      })


      it("Save button activates when contact person details are changed", async () => {
        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })

        await page.waitForSelector("#send-muutospyynto-button", { visible: true })

        const sendMuutospyyntoButtonIsDisabled = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
        expect(sendMuutospyyntoButtonIsDisabled).toBeTruthy()

        await clearAndType(page, '#muutoshakemus__contact-person', newName)
        await clearAndType(page, '#muutoshakemus__email', newEmail)
        await clearAndType(page, '#muutoshakemus__phone', newPhone)

        const sendMuutospyyntoButtonIsDisabledAfterChange = await hasElementAttribute(page, "#send-muutospyynto-button", "disabled")
        expect(sendMuutospyyntoButtonIsDisabledAfterChange).toBeFalsy()

        await clickElement(page, "#send-muutospyynto-button")
      })

      it("Changed contact person details are shown for virkailija", async () => {
        await navigate(page, `/avustushaku/${avustushakuID}/`)
        await Promise.all([
          page.waitForNavigation(),
          clickElementWithText(page, "td", "Akaan kaupunki"),
        ])
        const oldContactPersonNameOnPage = await getElementInnerText(page, ".answer-old-value #applicant-name div")
        expect(oldContactPersonNameOnPage).toEqual("Erkki Esimerkki")
        const contactPersonNameOnPage = await getElementInnerText(page, ".answer-new-value #applicant-name div")
        expect(contactPersonNameOnPage).toEqual(newName)
        const oldContactPersonPhoneOnPage = await getElementInnerText(page, ".answer-old-value #textField-0 div")
        expect(oldContactPersonPhoneOnPage).toEqual("666")
        const contactPersonPhoneOnPage = await getElementInnerText(page, ".answer-new-value #textField-0 div")
        expect(contactPersonPhoneOnPage).toEqual(newPhone)
        const oldContactPersonEmailOnPage = await getElementInnerText(page, ".answer-old-value #primary-email div")
        expect(oldContactPersonEmailOnPage).toEqual("erkki.esimerkki@example.com")
        const contactPersonEmailOnPage = await getElementInnerText(page, ".answer-new-value #primary-email div")
        expect(contactPersonEmailOnPage).toEqual(newEmail)
      })

      it('shows existing muutoshakemuses', async () => {
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus1)
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus2)
        await makePaatosForMuutoshakemusIfNotExists(page, 'rejected', avustushakuID, hakemusID)
        await fillAndSendMuutoshakemus(page, avustushakuID, hakemusID, muutoshakemus3)

        await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" })
        const muutoshakemuses = await page.$$('[data-test-class="existing-muutoshakemus"]')
        expect(muutoshakemuses.length).toEqual(3)

        const firstTitle = await muutoshakemuses[0].$eval('.muutoshakemus__title', el => el.textContent)
        expect(firstTitle).toContain('- Odottaa käsittelyä')
        expect(await countElements(page, `span.muutoshakemus__paatos-icon--rejected`)).toEqual(2)
      })
    })
  })

  describe("Standardized fields", () => {
    const helpTextFi = "Voit täyttää tämän lomakkeen halutessasi rahaa."
    const helpTextSv = "Du kan sjöppäs i hoppas hurlumhej pengar"
    let avustushakuID: number

    test("Virkailija can fill help-text", async () => {
      avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, "standardoitu haku", "69/2021")

      await clickElementWithText(page, "span", "Hakulomake")
      await clearAndSet(page, ".form-json-editor textarea", hakulomakeWithoutOhjetekstiJson)

      await clearAndType(page, '[data-test-id=standardized-ohjeteksti-help-fi]', helpTextFi)
      await clearAndType(page, '[data-test-id=standardized-ohjeteksti-help-sv]', helpTextSv)

      await clickFormSaveAndWait(page, avustushakuID)
      await clickElementWithText(page, "button", "Takaisin ylös")

      await clickElementWithText(page, "span", "Haun tiedot")
      await publishAvustushaku(page)
    })

    test("Hakija can see help-text", async () => {
      await navigateHakija(page, `/avustushaku/${avustushakuID}/`)

      await page.waitForSelector('#haku-not-open', { hidden: true, timeout: 500 })
      await clearAndType(page, "#primary-email", "email@schmemail.sch")
      await clickElement(page, "#submit:not([disabled])")

      await navigateToNewHakemusPage(page, avustushakuID)

      await clearAndType(page, "#finnish-business-id", TEST_Y_TUNNUS)
      await clickElement(page, "input.get-business-id")

      const helpTextFiSeenByHakija = await getElementInnerText(page,  '[data-test-id=standardized-ohjeteksti-help-fi]')

      const userKey = querystring.parse(page.url().split('?')[1])['hakemus']

      await navigateHakija(page, `/avustushaku/${avustushakuID}/nayta?lang=sv&hakemus=${userKey}`)

      await clearAndType(page, "#finnish-business-id", TEST_Y_TUNNUS)
      await clickElement(page, "input.get-business-id")

      const helpTextSvSeenByHakija = await getElementInnerText(page,  '[data-test-id=standardized-ohjeteksti-help-sv]')

      expect(helpTextFiSeenByHakija).toEqual(helpTextFi)
      expect(helpTextSvSeenByHakija).toEqual(helpTextSv)
    })
  })

  describe("Details schmetails", () => {
    it("The /environment endpoint returns true for refuse-enabled in case someone has old version of the web page still open", async () => {
      const response = await axios.get(`${VIRKAILIJA_URL}/environment`).then(r => r.data)
      expect(response["application-change"]["refuse-enabled?"]).toStrictEqual(true)
    })
  })
})


function lastOrFail<T>(xs: ReadonlyArray<T>): T {
  if (xs.length === 0) throw Error("Can't get last element of empty list")
  return xs[xs.length - 1]
}
