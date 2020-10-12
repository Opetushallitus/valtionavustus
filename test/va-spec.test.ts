import { Page, Browser } from "puppeteer"
import {
  VIRKAILIJA_URL,
  createValidCopyOfEsimerkkihakuAndReturnTheNewId,
  mkBrowser,
  getFirstPage,
  ratkaiseAvustushaku,
  publishAvustushaku,
  fillAndSendHakemus,
  acceptHakemus,
  clickCodeVisibilityButton,
  clickElementWithTestId,
  assertCodeIsVisible,
  expectedResponseFromExternalAPIhakemuksetForAvustushaku,
  actualResponseFromExternalAPIhakemuksetForAvustushaku,
  createUniqueCode,
  closeAvustushakuByChangingEndDateToPast,
  navigate,
  clickElementWithText,
  clickElement,
  clearAndType,
  waitForArvioSave,
  fillAndSendHakemusAndReturnHakemusId,
  getEmails,
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
  fillAndSendVäliselvityspyyntö,
  downloadExcelExport,
  clickFormSaveAndWait,
  addFieldToFormAndReturnElementIdAndLabel
} from "./test-util"

jest.setTimeout(100_000)
describe("Puppeteer tests", () => {
  let browser: Browser
  let page: Page

  beforeEach(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
  })

  afterEach(async () => {
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

  it("should allow basic avustushaku flow and check each hakemus has valmistelija", async () => {
    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    await publishAvustushaku(page)
    await fillAndSendHakemus(page, avustushakuID)

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)

    // Accept the hakemus
    await navigate(page, `/avustushaku/${avustushakuID}/`)
    await Promise.all([
      page.waitForNavigation(),
      clickElementWithText(page, "td", "Akaan kaupunki"),
    ])

    const hakemusID = await page.evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)?.[1])

    expectToBeDefined(hakemusID)
    console.log("Hakemus ID:", hakemusID)

    await clickElement(page, "#arviointi-tab label[for='set-arvio-status-plausible']")
    await clearAndType(page, "#budget-edit-project-budget .amount-column input", "100000")
    await Promise.all([
      clickElement(page, "#arviointi-tab label[for='set-arvio-status-accepted']"),
      waitForArvioSave(page, avustushakuID, parseInt(hakemusID)),
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
    const avustushakuID = await ratkaiseAvustushaku(page)

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
    console.log(`Väliselvitys user_key: ${väliselvitysKey}`)

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
    const input = await page.waitFor(".koodisto-dropdown .rw-popup input.rw-input")
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
    await page.waitForSelector('div.Select-noresults')
  })

  describe("Muutospäätösprosessi", () => {
    it("Avustushaun ratkaisu should send an email with link to muutoshaku", async () => {
      const avustushakuID = await ratkaiseAvustushaku(page)

      const emails = await getEmails(avustushakuID)
      emails.forEach(email => {
        expect(email["avustushaku-id"]).toEqual(avustushakuID)
        expect(email.formatted).toMatch(new RegExp(`[\\s\\S]*
Allaolevasta linkistä voitte tehdä seuraavat muutokset:
- Päivittää yhteyshenkilön tiedot
- Hakea pidennystä avustuksen käyttöaikaan
- Hakea muutosta hankkeen talouden käyttösuunnitelmaan, sisältöön tai toteutustapaan
https?://.*/muutoshaku.*
[\\s\\S]*`))
      }) 
    })

    describe("Changing contact person details", () => {

      it("Muutoshaku page should show the name of the avustushaku", async () => {
        const avustushakuName = "Testiavustushaku Testi"
        const avustushakuID = await ratkaiseAvustushaku(page, avustushakuName)

        const emails = await getEmails(avustushakuID)

        const linkToMuutoshaku = emails[0].formatted.match(/https?:\/\/.*\/muutoshaku.*/)?.[0]

        expectToBeDefined(linkToMuutoshaku)

        await page.goto(linkToMuutoshaku, { waitUntil: "networkidle0" })
        const avustushakuNameSpan = await page.waitForSelector("[data-test-id=avustushaku-name]", { visible: true })
        const avustushakuNameOnPage = await page.evaluate(element => element.textContent, avustushakuNameSpan)

        expect(avustushakuNameOnPage).toEqual(avustushakuName)
      })
    })
  })
})
