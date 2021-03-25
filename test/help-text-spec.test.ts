import {Browser, Page} from "puppeteer"
import {
  clickElement,
  clickElementWithText,
  createValidCopyOfEsimerkkihakuAndReturnTheNewId,
  createValidCopyOfLukioEsimerkkihakuWithValintaperusteetAndReturnTheNewId,
  fillAndSendHakemus,
  getFirstPage,
  gotoPäätösTab,
  log,
  mkBrowser,
  navigate,
  publishAvustushaku,
  setPageErrorConsoleLogger,
  verifyText,
  verifyTooltipText
} from "./test-util"

jest.setTimeout(100_000)

describe("Tooltips", () => {
  let browser: Browser
  let page: Page

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

  describe('When haku has been created', () => {
    let avustushakuID: number

    beforeAll(async () => {
      avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    })

    describe('And user navigates to admin page', () => {
      beforeAll(async () => {
        await navigate(page, "/admin/haku-editor/")
      })


      it("shows tooltip texts for päätös tab", async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="päätös-välilehti"] a`,
          /Tällä välilehdellä laaditaan ja lähetetään hakijoiden avustuspäätös-dokumentit. Päätöstä voi luonnostella jo haun suunnitteluvaiheessa, mutta kokonaisuudessaan välilehden tulee olla valmiina ja käännettynä ennen haun ratkaisua ja päätösten lähettämistä.*/
        )
      })

      it("shows tooltip text for loppuselvitys tab", async function() {
        await verifyTooltipText(
          page,
          `[data-test-id="loppuselvitys-välilehti"] a`,
          /Tällä välilehdellä laaditaan ja lähetetään avustuksen saajien loppuselvityspyynnöt. Loppuselvityslomaketta voi luonnostella jo haun suunnitteluvaiheessa, mutta kokonaisuudessaan välilehden tulee olla valmiina ja käännettynä vasta juuri ennen loppuselvityspyyntöjen lähettämistä.*/
        )
      })

    })
    describe('And user navigates to päätös tab', () => {
      beforeAll(async () => {
        await gotoPäätösTab(page, avustushakuID)
      })

      it('shows päätös help text', async() => {
        const decisionEditor = await page.waitForSelector(".decision-editor", { visible: true })
        const mainHelpText = await page.evaluate(element => element.textContent, decisionEditor)
        expect(mainHelpText).toMatch(/.*Jokaiselle valtionavustushakemukselle annetaan arviointien jälkeen avustuspäätös, joka on joko myönteinen tai kielteinen\. Haun vastuuvalmistelija vastaa avustuspäätösten laadusta, hyväksyttämisestä ja lähettämisestä\..*/)
      })

      it('Hovering over "Taustaa" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="taustaa"] label a`,
          /Kuvaa hakuaika, vastaanotettujen hakemuksien lukumäärä, vastaanotettujen hakemusten yhteenlaskettu haettu avustussumma, hyväksyttyjen hakemusten lukumäärä sekä myönnetyn avustuksen määrä kokonaisuudessaan.*/
        )
      })

      it('Hovering over "Myönteisen päätöksen lisäteksti" correct displays help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="myonteinenlisateksti"] label a`,
          /Kuvaa avustuksen saajille hankkeen toteuttamista ohjaavia lisätietoja. Näitä voivat olla esimerkiksi avustuksella tavoiteltavat tulokset ja vaikutukset, vaatimus hankesuunnitelman mukaisesta avustuksen käytöstä, vaatimus VA-yleisohjeen noudattamisesta sekä avustuksen saajan muut tehtävät ja velvollisuudet. Mikäli haulle on valittu useita koulutusasteita Haun tiedot -välilehdellä, voidaan jokaiselle koulutusasteelle kirjoittaa oma myönteisen päätöksen lisäteksti.*/
        )
      })

      it('Hovering over "Sovelletut säännökset" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="sovelletutsaannokset"] label a`,
          /Viitataan niihin lakeihin ja säädöksiin, joita valtionavustuserän osalta noudatetaan, esim. Valtionavustuslaki 688\/2001*/
        )
      })

      it('Hovering over "Tekijänoikeudet" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="kayttooikeudet"] label a`,
          /Käytetään valmista mallivastausta:.*/
        )
      })

      it('Hovering over "Avustuksen käyttötarkoitus" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="kayttotarkoitus"] label a`,
          /Kuvaa avustuksen käyttötarkoitus. Mihin tarkoituksiin avustusta voi käyttää ja mihin tarkoituksiin avustuksen käyttöä ei sallita. Käyttötarkoitusta ohjaavien päätöskirjausten tulee olla linjassa sekä hakutiedotteen kirjausten että hakulomakkeen budjetti-informaation kanssa.*/
        )
      })

      it('Hovering over "Selvitysvelvollisuus" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="selvitysvelvollisuus"] label a`,
          /Kuvataan selvitysvelvollisuus ja mahdollisen väliselvityksen sekä loppuselvityksen aikataulutus. Informoidaan avustuksen saajaan siitä, miten ja milloin selvityslomakkeet avustuksen saajille toimitetaan. Voidaan lisäksi tarkentaa selvitykseen ja kirjanpitoon liittyviä ehtoja.*/
        )
      })

      it('Hovering over "Päätöksen hyväksyminen" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="hyvaksyminen"] label a`,
          /Kuvataan avustuksen saajalle, miten hänen pitää toimia tilanteessa, jossa hän ei ota myönnettyä avustusta vastaan. Aseta avustuksesta kieltäytymiselle määräaika. Kieltäytyminen tulee tehdä sekä OPH:n kirjaamoon että avustuspäätöksessä osoitetulle OPH:n yhteyshenkilölle.*/
        )
      })


      it('Hovering over "Johtaja" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="johtaja"] label a`,
          /Päätöksen hyväksyy sen yksikön päällikkö, jonka vastuulle kyseinen valtionavustushaku kuuluu. Hyväksyjä kirjoitetaan muodossa titteli etunimi sukunimi.*/
        )
      })

      it('Hovering over "Esittelijä" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="valmistelija"] label a`,
          /Esittelijänä toimii valtionavustushaun vastuuvalmistelija. Esittelijä kirjoitetaan muodossa titteli etunimi sukunimi.*/
        )
      })

      it('Hovering over "Avustuksen maksuaika" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="maksu"] label a`,
          /Kuvataan, että maksetaanko avustus yhdessä vai useammassa erässä ja milloin avustusten maksaminen toteutetaan. Maksupäivämäärää ei tarvitse tarkasti yksilöidä vaan se voidaan kirjata esimerkiksi muodossa ”yhdessä erässä viimeistään xx.x.xxxx”.*/
        )
      })

      it('Hovering over "Väliselvitys" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="valiselvitys"] a`,
          /Kirjataan päivämäärä \(muodossa xx.x.xxxx\), jolloin väliselvitys on viimeistään toimitettava OPH:n valtionavustusjärjestelmään. Yleensä väliselvitysten viimeinen toimituspäivämäärä noin hankekauden puolivälissä. Suositellaan käyttämään valitun kuukauden viimeistä päivää. Kirjattu päivämäärä siirtyy automaattisesti Väliselvitys-välilehdelle sekä Väliselvitys-välilehdeltä lähetettävän väliselvityspyynnön sähköpostiviestiin.*/
        )
      })

      it('Hovering over "Loppuselvitys" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="loppuselvitys"] a`,
          /Kirjataan päivämäärä \(muodossa xx.x.xxxx\), jolloin loppuselvitys on viimeistään toimitettava OPH:n valtionavustusjärjestelmään. Loppuselvitysten viimeinen toimituspäivämäärä on kaksi kuukautta avustuksen käyttöajan päättymisestä. Kirjattu päivämäärä siirtyy automaattisesti Loppuselvitys-välilehdelle sekä Loppuselvitys-välilehdeltä lähetettävän loppuselvityspyynnön sähköpostiviestiin.*/
        )
      })

      it('Hovering over "Päätöksen liitteet" displays correct help text', async () => {
        await verifyTooltipText(
          page,
          `[data-test-id="paatoksenliitteet"] a`,
          /Jokaisen päätöksen oheen liitetään oikaisuvaatimusosoitus sekä valtionavustusten yleisohje. */
        )
      })

    })
    describe('And user navigates to loppuselvitys tab', () => {
      beforeAll(async () => {
        await navigate(page, "/admin/loppuselvitys/")
      })

      it('shows loppuselvitys help text', async() => {
        const selector = '[data-test-id=loppuselvitys-ohje]'
        const verifyTextRegex = /Loppuselvitysten käyttö on pakollista kaikille valtionavustuksille. Loppuselvitysten käytöstä ja aikataulusta tulee ilmoittaa avustuksen saajalle jo avustuspäätöksessä. Loppuselvityspyynnöt on hyvä toimittaa avustuksen saajille mahdollisimman pian väliselvityspyyntöjen keräämisen jälkeen tai viimeistään kuusi kuukautta ennen hankekauden päättymistä. Tällöin hankkeen yhteyshenkilö voi dokumentoida hankkeen etenemistä loppuselvityslomakkeelle jo heti väliselvityslomakkeen lähettämisestä lähtien, mutta lähettää täytetyn loppuselvityslomakkeen VA-järjestelmään vasta määräaikaan mennessä. Mikäli kyseisen valtionavustuksen kohdalla ei käytetä lainkaan väliselvityksiä, voidaan loppuselvityspyynnöt em. perustein lähettää avustuksen saajille jo hankekauden alussa. Näin vältetään esimerkiksi henkilövaihdoksista johtuva puutteellinen selvitysdokumentaatio.  Voit kopioida minkä tahansa haun loppuselvityslomakkeen sellaisenaan kopioimalla Hakulomakkeen sisältö -kentän koodin \(Loppuselvitys-välilehden lopussa\) haluamastasi haun Loppuselvitys-välilehdeltä ja liittämällä sen valmistelemasi haun vastaavaan kenttään. Loppuselvityslomaketta muokataan samalla tavalla kuin haku- ja väliselvityslomaketta. Voit lisätä, poistaa ja muokata lomakkeen kysymyksiä, ohjetekstiä ja väliotsikoita. Huomaa, että loppuselvityslomakkeeseen tekemäsi muutokset tallentuvat ainoastaan silloin kun painat Tallenna -painiketta. Seuraavat asiat on hyvä huomioida loppuselvityslomaketta muokattaessa:  Tuotokset -osiota ei suositella muokattavan Selvitys taloudesta -osio on lukittu ja sitä voidaan muokata vain pääkäyttäjän toimesta  Loppuselvityksille tehdään asia- ja taloustarkastus. Asiatarkastuksen tekee hankkeelle osoitettu yhteyshenkilö ja taloustarkastuksen OPH:n taloustarkastaja. Tarkastukset tulee tehdä mahdollisimman pian loppuselvityksen vastaanottamisen jälkeen, jotta mahdollisiin epäkohtiin voidaan puuttua välittömästi. Kun loppuselvitys on asiatarkastettu, lähettää yhteyshenkilöksi osoitettu virkailija tiedon asiatarkastuksen valmistumisesta taloustarkastajalle. Taloustarkastuksen jälkeen taloustarkastaja lähettää loppuselvityksen hyväksyntäviestin erikseen jokaiselle hankkeelle hankekohtaiselta Loppuselvitys-välilehdeltä.*/
        await verifyText(page, selector, verifyTextRegex)
      })
    })
    describe('And user navigates to väliselvitys tab', () => {
      beforeAll(async () => {
        await navigate(page, "/admin/valiselvitys/")
      })

      it('shows väliselvitys help text', async() => {
        const selector = '[data-test-id=valiselvitys-ohje]'
        const verifyTextRegex = /Väliselvitysten käyttämisestä voidaan päättää hakukohtaisesti. Mikäli väliselvityksiä käytetään, tulee väliselvityksen käytöstä ja aikataulusta ilmoittaa avustuksen saajalle jo avustuspäätöksessä. Väliselvityspyynnöt on hyvä toimittaa avustuksen saajille mahdollisimman pian hankekauden alkamisen jälkeen. Tällöin hankkeen yhteyshenkilö voi dokumentoida hankkeen etenemistä väliselvityslomakkeelle jo heti hankkeen käynnistymisestä lähtien, mutta lähettää täytetyn väliselvityslomakkeen VA-järjestelmään vasta määräaikaan mennessä.  Voit kopioida minkä tahansa haun väliselvityslomakkeen sellaisenaan kopioimalla Hakulomakkeen sisältö -kentän koodin \(Väliselvitys-välilehden lopussa\) haluamasi haun Väliselvitys-välilehdeltä ja liittämällä sen valmistelemasi haun vastaavaan kenttään. Väliselvityslomaketta muokataan samalla tavalla kuin haku- ja loppuselvityslomaketta. Voit lisätä, poistaa ja muokata lomakkeen kysymyksiä, ohjetekstiä ja väliotsikoita. Huomaa, että väliselvityslomakkeeseen tekemäsi muutokset tallentuvat ainoastaan silloin kun painat Tallenna -painiketta.  Väliselvityksille tehdään ainoastaan asiatarkastus hankkeelle osoitetun yhteyshenkilön toimesta. Asiatarkastus tulee tehdä mahdollisimman pian väliselvityksen vastaanottamisen jälkeen, jotta mahdollisiin epäkohtiin voidaan puuttua. Kun väliselvitys on asiatarkastettu, lähettää yhteyshenkilöksi osoitettu virkailija väliselvityksen hyväksyntäviestin erikseen jokaiselle hankkeelle hankekohtaiselta Väliselvitys-välilehdeltä.*/
        await verifyText(page, selector, verifyTextRegex)
      })
    })
  })

  describe('When lukio haku has been created and published', () => {
    let avustushakuID: number

    beforeAll(async () => {
      avustushakuID = await createValidCopyOfLukioEsimerkkihakuWithValintaperusteetAndReturnTheNewId(page)
      await publishAvustushaku(page)
    })

    describe('And hakemus has been sent', () => {
      beforeAll(async () => {
        await fillAndSendHakemus(page, avustushakuID)
      })

      describe('And user navigates to avustushaku', () => {
        beforeAll(async () => {
          await navigate(page, `/avustushaku/${avustushakuID}/`)
          await clickElementWithText(page,"td", "Akaan kaupunki")
        })

        it('Hovering over "Koulutusaste" displays correct help text', async () => {
          await verifyTooltipText(
            page,
            `[data-test-id="tooltip-koulutusaste"]`,
            /Valitse hankkeelle koulutusaste, johon hanke kohdistuu. Valittavissa olevat koulutusasteet on tuotu automaattisesti Haun tiedot -välilehdeltä. Valtionavustuksen vastuuvalmistelija vastaa siitä, että kaikille myönteisen avustuspäätöksen saaville hankkeille on ennen päätösten hyväksymistä valittu oikea koulutusaste.*/
          )
        })

        it('Hovering over "Talousarviotili" displays correct help text', async () => {
          await verifyTooltipText(
            page,
            `[data-test-id="tooltip-talousarviotili"]`,
            /Valitse hankkeelle talousarviotili, jolta avustus maksetaan. Valittavissa olevat talousarviotilit on tuotu automaattisesti Haun tiedot -välilehdeltä. Valtionavustuksen vastuuvalmistelija vastaa siitä, että kaikille myönteisen avustuspäätöksen saaville hankkeille on ennen päätösten hyväksymistä valittu oikea talousarviotili.*/
          )
        })

        it('Hovering over "Valitaperusteet" displays correct help text', async () => {
          await verifyTooltipText(
            page,
            `[data-test-id="tooltip-valintaperusteet"]`,
            /Valintaperusteet on tuotu automaattisesti Haun tiedot -välilehdeltä. Valtionavustuksen vastuuvalmistelijan johdolla päätetään, miten tähtiarviointeja hyödynnetään hakemusten arvioinnissa. Muiden virkailijoiden tähtiarvioinnit näkyvät vasta omien arviointien tallentamisen jälkeen. Arvioinnit näkyvät vain OPH:n virkailijoille.*/
          )
        })

        it('Hovering over "Kommentit" displays correct help text', async () => {
          await verifyTooltipText(
            page,
            `[data-test-id="tooltip-kommentit"]`,
            /Hankehakemusta arvioiva virkailija kirjoittaa avustuksen arviointiin liittyvät kommentit tähän kenttään ja tallentaa kommentin järjestelmään painamalla Lisää-painiketta. Kommentit näkyvät vain OPH:n virkailijoille.*/
          )
        })

        it('Hovering over "Hankkeen tila" displays correct help text', async () => {
          await verifyTooltipText(
            page,
            `[data-test-id="tooltip-tila"]`,
            /Hankkeen yhteyshenkilöksi osoitettu virkailija päivittää hankkeen tilaa arviointien edetessä kyseisen valtionavustuksen vastuuvalmistelijan johdolla sovittujen toimintatapojen mukaisesti. Kaikkien hakemusten tulee olla tilassa Hyväksytty tai Hylätty ennen avustuspäätösten hyväksymistä.*/
          )
        })

        it('Hovering over "Perustelut" displays correct help text', async () => {
          await verifyTooltipText(
            page,
            `[data-test-id="tooltip-perustelut"]`,
            /Kenttään kirjataan avustuspäätöksen hakemuskohtaiset huomiot. Tähän kenttään kirjoitetut perustelut siirtyvät sellaisenaan hakemuskohtaiseen avustuspäätökseen, jonka luonnosta voit tarkastella tämän sivunäkymän alaosan Päätös: Luonnos -linkistä. Hylätyn hakemuksen osalta suositellaan käyttämään järjestelmän tarjoamia vakioperusteluja.*/
          )
        })

        it('Hovering over "Täydennys" displays correct help text', async () => {
          await verifyTooltipText(
            page,
            `[data-test-id="tooltip-taydennys"]`,
            /Tämän ominaisuuden avulla voidaan pyytää avustuksen hakijalta täydennystä puutteelliseen tai virheelliseen hakemukseen. Painikkeen painamisen jälkeen virkailijalle aukeaa tekstikenttä, johon voidaan kirjata, millaisia täydennyksiä hakijalta odotetaan ja mihin mennessä täydennykset tulee kirjata järjestelmään. Täydennyspyyntö toimitetaan yhteyshenkilölle sekä haun viralliseen sähköpostiosoitteeseen. Pyyntö avaa hakemuksen hakijan muokattavaksi. Tieto täydennyspyynnöstä ja sen saatetekstistä tallentuu hakemuksen lokitietoihin ja näkyy myös Hakemusten arviointi -näkymän hakemuslistassa.*/
          )
        })

        it('Hovering over "Huomautus" displays correct help text', async () => {
          await verifyTooltipText(
            page,
            `[data-test-id="tooltip-huomautus"]`,
            /Päätöslistan avulla esitellään hyväksyjänä olevalle päällikölle hakemusten ja arviointien kokonaisuus. Mikäli avustuspäätöksiä hyväksyttäessä halutaan käydä tarkentavaa keskustelua joistakin hakemuksista, voidaan huomautukset kirjata tähän kenttään, jolloin ne siirtyvät automaattisesti päätöslistaan. Päätöslistan avaat painamalla Hakemusten arviointi -näkymän alaosan linkkiä, jossa on avustusten lukumäärä \(esim. 60\/60 hakemusta\). Huomautukset näkyvät vain OPH:n virkailijoille.*/
          )
        })

        it('Hovering over "Talousarvio" displays correct help text', async () => {
          await verifyTooltipText(
            page,
            `[data-test-id="tooltip-talousarvio"]`,
            /Hankkeen yhteyshenkilöksi osoitettu virkailija voi muokata Hyväksytty-sarakkeen kenttiin hakijan hankebudjettia menoluokittain. Tässä osiossa kirjattu budjetti siirtyy automaattisesti hankekohtaiseen avustuspäätökseen ja muodostaa hankkeelle hyväksytyn budjetin.*/
          )
        })

        it('Hovering over "Muokkaa hakemusta" displays correct help text', async () => {
          await verifyTooltipText(
            page,
            `[data-test-id="tooltip-muokkaa-hakemusta"]`,
            /Hankkeen yhteyshenkilöksi osoitettu virkailija voi muokata hakemusta hakijan pyynnöstä esimerkiksi virheellisten yhteystietojen osalta. Painikkeen painamisen jälkeen virkailijan tulee kirjoittaa hakemuksen muokkaamisen syy, joka tallentuu hakemuksen lokitietoihin. Hakemuksen sisällöllisissä muokkauksissa suositellaan käyttämään aina Täydennyspyyntö-ominaisuutta.*/
          )
        })

        it('Hovering over "Peruuta" displays correct help text', async () => {
          await verifyTooltipText(
            page,
            `[data-test-id="tooltip-peruuta-hakemus"]`,
            /Hankkeen yhteyshenkilöksi osoitettu virkailija voi peruuttaa hakemuksen tilanteessa, jossa hakija haluaa vetää hakemuksensa kokonaan pois arvioinneista saamatta hakemukselleen lainkaan päätöstä. Hakemuksen peruuttamisen myötä hakemus siirtyy arkistoon ja poistuu Hakujen arviointi -hakemuslistasta. Hakemuksen peruuttaminen tulee dokumentoida seikkaperäisesti Valmistelijan huomiot -kenttään. Hakijan pyyntö hakemuksen peruuttamiseksi tulee todentaa esimerkiksi liittämällä asiasta käyty sähköpostikeskustelu Seuranta-välilehden Liitteet-osioon.*/
          )
        })

        describe('And hakemus state is set to ratkaistu', () => {
          beforeAll(async () => {
            await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
            await clickElement(page, '[for=set-status-resolved]')
          })

          describe('And user navigates to avustushaku', () => {
            beforeAll(async () => {
              await navigate(page, `/avustushaku/${avustushakuID}/`)
              await clickElementWithText(page,"td", "Akaan kaupunki")
            })

            it('Hovering over "Lähetä sähköpostit uudestaan" displays correct help text', async () => {
              await verifyTooltipText(
                page,
                `[data-test-id="tooltip-laheta-email-uudestaan"]`,
                /Hankkeelle voidaan lähettää päätössähköposti uudestaan koska tahansa hakukohtaisten avustuspäätösten laatimisen jälkeen. Painiketta painamalla hakijalle lähetetään avustuspäätös sekä yhteyshenkilön että hakijan viralliseen sähköpostiosoitteeseen. Päätössähköpostissa olevan linkin kautta avustuksen saaja voi päivittää hankkeen yhteyshenkilöä itse, joten tätä ominaisuutta voi hyödyntää esimerkiksi henkilövaihdosten kirjaamisessa järjestelmään.*/
              )
            })

          })
        })
      })
    })
  })
})
