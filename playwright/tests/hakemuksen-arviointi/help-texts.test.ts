import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { Page, expect } from '@playwright/test'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { expectToBeDefined } from '../../utils/util'

const verifyTooltipText = async (
  page: Page,
  tooltipAnchorSelector: string,
  tooltipText: string
) => {
  const tooltipLocator = page.locator(tooltipAnchorSelector)
  const tooltipContent = tooltipLocator.locator('span')
  await tooltipLocator.hover()
  await expect.soft(tooltipContent).toBeVisible()
  await expect.soft(tooltipContent).toContainText(tooltipText)
}

const test = muutoshakemusTest.extend({
  hakuProps: async ({ hakuProps }, use) => {
    await use({
      ...hakuProps,
      selectionCriteria: ['Onko ok?'],
    })
  },
})

test('help texts', async ({ page, avustushakuID, submittedHakemus, answers }) => {
  expectToBeDefined(submittedHakemus)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  await hakujenHallintaPage.navigate(avustushakuID)

  await test.step('shows tooltip texts for päätös tab', async () => {
    await verifyTooltipText(
      page,
      '[data-test-id="päätös-välilehti"] div',
      'Tällä välilehdellä laaditaan ja lähetetään hakijoiden avustuspäätös-dokumentit. Päätöstä voi luonnostella jo haun suunnitteluvaiheessa, mutta kokonaisuudessaan välilehden tulee olla valmiina ja käännettynä ennen haun ratkaisua ja päätösten lähettämistä.'
    )
  })

  const paatosPage = await hakujenHallintaPage.commonHakujenHallinta.switchToPaatosTab()

  await test.step('päätös tab', async () => {
    await test.step('shows päätös help text', async () => {
      await expect
        .soft(paatosPage.locators.decisionEditor)
        .toContainText(
          'Jokaiselle valtionavustushakemukselle annetaan arviointien jälkeen avustuspäätös, joka on joko myönteinen tai kielteinen. Haun vastuuvalmistelija vastaa avustuspäätösten laadusta, hyväksyttämisestä ja lähettämisestä'
        )
    })
    for (const [name, selector, hoverText] of [
      [
        'Taustaa',
        '[data-test-id="taustaa"] label div',
        'Kuvaa hakuaika, vastaanotettujen hakemuksien lukumäärä, vastaanotettujen hakemusten yhteenlaskettu haettu avustussumma, hyväksyttyjen hakemusten lukumäärä sekä myönnetyn avustuksen määrä kokonaisuudessaan',
      ],
      [
        'Myönteisen päätöksen lisäteksti',
        '[data-test-id="myonteinenlisateksti"] label div',
        'Kuvaa avustuksen saajille hankkeen toteuttamista ohjaavia lisätietoja. Näitä voivat olla esimerkiksi avustuksella tavoiteltavat tulokset ja vaikutukset, vaatimus hankesuunnitelman mukaisesta avustuksen käytöstä, vaatimus VA-yleisohjeen noudattamisesta sekä avustuksen saajan muut tehtävät ja velvollisuudet. Mikäli haulle on valittu useita koulutusasteita Haun tiedot -välilehdellä, voidaan jokaiselle koulutusasteelle kirjoittaa oma myönteisen päätöksen lisäteksti',
      ],
      [
        'Sovelletut säännökset',
        '[data-test-id="sovelletutsaannokset"] label div',
        'Viitataan niihin lakeihin ja säädöksiin, joita valtionavustuserän osalta noudatetaan, esim. Valtionavustuslaki 688/2001',
      ],
      [
        'Tekijänoikeudet',
        '[data-test-id="kayttooikeudet"] label div',
        'Käytetään valmista mallivastausta:',
      ],
      [
        'Avustuksen käyttötarkoitus',
        '[data-test-id="kayttotarkoitus"] label div',
        'Kuvaa avustuksen käyttötarkoitus. Mihin tarkoituksiin avustusta voi käyttää ja mihin tarkoituksiin avustuksen käyttöä ei sallita. Käyttötarkoitusta ohjaavien päätöskirjausten tulee olla linjassa sekä hakutiedotteen kirjausten että hakulomakkeen budjetti-informaation kanssa',
      ],
      [
        'Selvitysvelvollisuus',
        '[data-test-id="selvitysvelvollisuus"] label div',
        'Tässä kentässä kuvataan vapaamuotoisesti selvitysvelvollisuuteen liittyviä ehtoja, kuten velvollisuus pitää yhteyshenkilön tiedot ajan tasalla, velvollisuus hakea lupa hankesuunnitelman muutoksille tai velvollisuus kuvata hankkeessa syntyneitä tuloksia Opetushallituksen osoittamalla tavalla. Muodollisten selvitysten määräajat valitaan alla olevissa "Väli-/loppuselvitys toimitettava viimeistään" -kentissä, eikä määräaikoja näin ollen kirjoiteta tähän tekstikenttään.',
      ],
      [
        'Päätöksen hyväksyminen',
        '[data-test-id="hyvaksyminen"] label div',
        'Kuvataan avustuksen saajalle, miten hänen pitää toimia tilanteessa, jossa hän ei ota myönnettyä avustusta vastaan. Aseta avustuksesta kieltäytymiselle määräaika. Kieltäytyminen tulee tehdä sekä OPH:n kirjaamoon että avustuspäätöksessä osoitetulle OPH:n yhteyshenkilölle',
      ],
      [
        'Johtaja',
        '[data-test-id="johtaja"] label div',
        'Päätöksen hyväksyy sen yksikön päällikkö, jonka vastuulle kyseinen valtionavustushaku kuuluu. Hyväksyjä kirjoitetaan muodossa titteli etunimi sukunimi',
      ],
      [
        'Esittelijä',
        '[data-test-id="valmistelija"] label div',
        'Esittelijänä toimii valtionavustushaun vastuuvalmistelija. Esittelijä kirjoitetaan muodossa titteli etunimi sukunimi',
      ],
      [
        'Avustuksen maksuaika',
        '[data-test-id="maksu"] label div',
        'Kuvataan, että maksetaanko avustus yhdessä vai useammassa erässä ja milloin avustusten maksaminen toteutetaan. Maksupäivämäärää ei tarvitse tarkasti yksilöidä vaan se voidaan kirjata esimerkiksi muodossa ”yhdessä erässä viimeistään xx.x.xxxx”',
      ],
      [
        'Väliselvitys',
        '[data-test-id="valiselvitys"] div',
        'Kirjataan päivämäärä (muodossa xx.x.xxxx), jolloin väliselvitys on viimeistään toimitettava OPH:n valtionavustusjärjestelmään. Yleensä väliselvitysten viimeinen toimituspäivämäärä noin hankekauden puolivälissä. Suositellaan käyttämään valitun kuukauden viimeistä päivää. Kirjattu päivämäärä siirtyy automaattisesti hakijalle lähtevän päätöksen selvitysvelvollisuus-kappaleen alkuun (kts. Päätös: Luonnos Arviointi-välilehdeltä), Väliselvitys-välilehdelle ja Väliselvitys-välilehdeltä lähetettävän väliselvityspyynnön sähköpostiviestiin.',
      ],
      [
        'Loppuselvitys',
        '[data-test-id="loppuselvitys"] div',
        'Kirjataan päivämäärä (muodossa xx.x.xxxx), jolloin loppuselvitys on viimeistään toimitettava OPH:n valtionavustusjärjestelmään. Loppuselvitysten viimeinen toimituspäivämäärä on kaksi kuukautta avustuksen käyttöajan päättymisestä. Kirjattu päivämäärä siirtyy automaattisesti hakijalle lähtevän päätöksen selvitysvelvollisuus-kappaleen alkuun (kts. Päätös: Luonnos Arviointi-välilehdeltä), Loppuselvitys-välilehdelle ja Loppuselvitys-välilehdeltä lähetettävän loppuselvityspyynnön sähköpostiviestiin.',
      ],
      [
        'Päätöksen liitteet',
        '[data-test-id="paatoksenliitteet"] div',
        'Jokaisen päätöksen oheen liitetään oikaisuvaatimusosoitus sekä valtionavustusten yleisohje',
      ],
    ]) {
      await test.step(`Hovering over ${name} displays correct help text`, async () => {
        await verifyTooltipText(page, selector, hoverText)
      })
    }
  })

  await test.step('loppuselvitys tab', async () => {
    await test.step('shows correct tooltip on tab', async () => {
      await verifyTooltipText(
        page,
        '[data-test-id="loppuselvitys-välilehti"] div',
        'Tällä välilehdellä laaditaan ja lähetetään avustuksen saajien loppuselvityspyynnöt. Loppuselvityslomaketta voi luonnostella jo haun suunnitteluvaiheessa, mutta kokonaisuudessaan välilehden tulee olla valmiina ja käännettynä vasta juuri ennen loppuselvityspyyntöjen lähettämistä.'
      )
    })

    await test.step('shows help text', async () => {
      await hakujenHallintaPage.switchToLoppuselvitysTab()
      await expect
        .soft(hakujenHallintaPage.page.getByTestId('loppuselvitys-ohje'))
        .toContainText(
          'Loppuselvitysten käyttö on pakollista kaikille valtionavustuksille. Loppuselvitysten käytöstä ja aikataulusta tulee ilmoittaa avustuksen saajalle jo avustuspäätöksessä. Loppuselvityspyynnöt on hyvä toimittaa avustuksen saajille mahdollisimman pian väliselvityspyyntöjen keräämisen jälkeen tai viimeistään kuusi kuukautta ennen hankekauden päättymistä. Tällöin hankkeen yhteyshenkilö voi dokumentoida hankkeen etenemistä loppuselvityslomakkeelle jo heti väliselvityslomakkeen lähettämisestä lähtien, mutta lähettää täytetyn loppuselvityslomakkeen VA-järjestelmään vasta määräaikaan mennessä. Mikäli kyseisen valtionavustuksen kohdalla ei käytetä lainkaan väliselvityksiä, voidaan loppuselvityspyynnöt em. perustein lähettää avustuksen saajille jo hankekauden alussa. Näin vältetään esimerkiksi henkilövaihdoksista johtuva puutteellinen selvitysdokumentaatio.  Voit kopioida minkä tahansa haun loppuselvityslomakkeen sellaisenaan kopioimalla Hakulomakkeen sisältö -kentän koodin (Loppuselvitys-välilehden lopussa) haluamastasi haun Loppuselvitys-välilehdeltä ja liittämällä sen valmistelemasi haun vastaavaan kenttään. Loppuselvityslomaketta muokataan samalla tavalla kuin haku- ja väliselvityslomaketta. Voit lisätä, poistaa ja muokata lomakkeen kysymyksiä, ohjetekstiä ja väliotsikoita. Huomaa, että loppuselvityslomakkeeseen tekemäsi muutokset tallentuvat ainoastaan silloin kun painat Tallenna -painiketta. Seuraavat asiat on hyvä huomioida loppuselvityslomaketta muokattaessa:  Tuotokset -osiota ei suositella muokattavan Selvitys taloudesta -osio on lukittu ja sitä voidaan muokata vain pääkäyttäjän toimesta  Loppuselvityksille tehdään asia- ja taloustarkastus. Asiatarkastuksen tekee hankkeelle osoitettu yhteyshenkilö ja taloustarkastuksen OPH:n taloustarkastaja. Tarkastukset tulee tehdä mahdollisimman pian loppuselvityksen vastaanottamisen jälkeen, jotta mahdollisiin epäkohtiin voidaan puuttua välittömästi. Kun loppuselvitys on asiatarkastettu, lähettää yhteyshenkilöksi osoitettu virkailija tiedon asiatarkastuksen valmistumisesta taloustarkastajalle. Taloustarkastuksen jälkeen taloustarkastaja lähettää loppuselvityksen hyväksyntäviestin erikseen jokaiselle hankkeelle hankekohtaiselta Loppuselvitys-välilehdeltä'
        )
    })

    await test.step('väliselvitys tab', async () => {
      const valiselvitysPage = await hakujenHallintaPage.switchToValiselvitysTab()
      await test.step('shows väliselvitys help text', async () => {
        await expect
          .soft(valiselvitysPage.locators.ohje)
          .toContainText(
            'Väliselvitysten käyttämisestä voidaan päättää hakukohtaisesti. Mikäli väliselvityksiä käytetään, tulee väliselvityksen käytöstä ja aikataulusta ilmoittaa avustuksen saajalle jo avustuspäätöksessä. Väliselvityspyynnöt on hyvä toimittaa avustuksen saajille mahdollisimman pian hankekauden alkamisen jälkeen. Tällöin hankkeen yhteyshenkilö voi dokumentoida hankkeen etenemistä väliselvityslomakkeelle jo heti hankkeen käynnistymisestä lähtien, mutta lähettää täytetyn väliselvityslomakkeen VA-järjestelmään vasta määräaikaan mennessä.  Voit kopioida minkä tahansa haun väliselvityslomakkeen sellaisenaan kopioimalla Hakulomakkeen sisältö -kentän koodin (Väliselvitys-välilehden lopussa) haluamasi haun Väliselvitys-välilehdeltä ja liittämällä sen valmistelemasi haun vastaavaan kenttään. Väliselvityslomaketta muokataan samalla tavalla kuin haku- ja loppuselvityslomaketta. Voit lisätä, poistaa ja muokata lomakkeen kysymyksiä, ohjetekstiä ja väliotsikoita. Huomaa, että väliselvityslomakkeeseen tekemäsi muutokset tallentuvat ainoastaan silloin kun painat Tallenna -painiketta.  Väliselvityksille tehdään ainoastaan asiatarkastus hankkeelle osoitetun yhteyshenkilön toimesta. Asiatarkastus tulee tehdä mahdollisimman pian väliselvityksen vastaanottamisen jälkeen, jotta mahdollisiin epäkohtiin voidaan puuttua. Kun väliselvitys on asiatarkastettu, lähettää yhteyshenkilöksi osoitettu virkailija väliselvityksen hyväksyntäviestin erikseen jokaiselle hankkeelle hankekohtaiselta Väliselvitys-välilehdeltä'
          )
      })
    })
  })

  const projectName = answers.projectName
  if (!projectName) {
    throw new Error('projectName must be set in order to navigate to hakemus')
  }
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await test.step('hakemuksen arviointi', async () => {
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.closeAvustushakuByChangingEndDateToPast()
    await hakemustenArviointiPage.navigateToHakemus(avustushakuID, projectName)
    const hakemusId = await hakemustenArviointiPage.getHakemusID()
    expectToBeDefined(hakemusId)
    await hakemustenArviointiPage.toggleHakemusList.click()
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusId, '_ valtionavustus')

    for (const [name, selector, hoverText] of [
      [
        'Talousarviotili',
        '[data-test-id="tooltip-talousarviotili"]',
        'Valitse hankkeelle talousarviotili, jolta avustus maksetaan. Valittavissa olevat talousarviotilit on tuotu automaattisesti Haun tiedot -välilehdeltä. Valtionavustuksen vastuuvalmistelija vastaa siitä, että kaikille myönteisen avustuspäätöksen saaville hankkeille on ennen päätösten hyväksymistä valittu oikea talousarviotili',
      ],
      [
        'Valintaperusteet',
        '[data-test-id="tooltip-valintaperusteet"]',
        'Valintaperusteet on tuotu automaattisesti Haun tiedot -välilehdeltä. Valtionavustuksen vastuuvalmistelijan johdolla päätetään, miten tähtiarviointeja hyödynnetään hakemusten arvioinnissa. Muiden virkailijoiden tähtiarvioinnit näkyvät vasta omien arviointien tallentamisen jälkeen. Arvioinnit näkyvät vain OPH:n virkailijoille',
      ],
      [
        'Kommentit',
        '[data-test-id="tooltip-kommentit"]',
        'Hankehakemusta arvioiva virkailija kirjoittaa avustuksen arviointiin liittyvät kommentit tähän kenttään ja tallentaa kommentin järjestelmään painamalla Lisää-painiketta. Kommentit näkyvät vain OPH:n virkailijoille',
      ],
      [
        'Hankkeen tila',
        '[data-test-id="tooltip-tila"]',
        'Hankkeen yhteyshenkilöksi osoitettu virkailija päivittää hankkeen tilaa arviointien edetessä kyseisen valtionavustuksen vastuuvalmistelijan johdolla sovittujen toimintatapojen mukaisesti. Kaikkien hakemusten tulee olla tilassa Hyväksytty tai Hylätty ennen avustuspäätösten hyväksymistä',
      ],
      [
        'Perustelut',
        '[data-test-id="tooltip-perustelut"]',
        'Kenttään kirjataan avustuspäätöksen hakemuskohtaiset huomiot. Tähän kenttään kirjoitetut perustelut siirtyvät sellaisenaan hakemuskohtaiseen avustuspäätökseen, jonka luonnosta voit tarkastella tämän sivunäkymän alaosan Päätös: Luonnos -linkistä. Hylätyn hakemuksen osalta suositellaan käyttämään järjestelmän tarjoamia vakioperusteluja',
      ],
      [
        'Täydennys',
        '[data-test-id="tooltip-taydennys"]',
        'Tämän ominaisuuden avulla voidaan pyytää avustuksen hakijalta täydennystä puutteelliseen tai virheelliseen hakemukseen. Painikkeen painamisen jälkeen virkailijalle aukeaa tekstikenttä, johon voidaan kirjata, millaisia täydennyksiä hakijalta odotetaan ja mihin mennessä täydennykset tulee kirjata järjestelmään. Täydennyspyyntö toimitetaan yhteyshenkilölle sekä haun viralliseen sähköpostiosoitteeseen. Pyyntö avaa hakemuksen hakijan muokattavaksi. Tieto täydennyspyynnöstä ja sen saatetekstistä tallentuu hakemuksen lokitietoihin ja näkyy myös Hakemusten arviointi -näkymän hakemuslistassa',
      ],
      [
        'Huomautus',
        '[data-test-id="tooltip-huomautus"]',
        'Päätöslistan avulla esitellään hyväksyjänä olevalle päällikölle hakemusten ja arviointien kokonaisuus. Mikäli avustuspäätöksiä hyväksyttäessä halutaan käydä tarkentavaa keskustelua joistakin hakemuksista, voidaan huomautukset kirjata tähän kenttään, jolloin ne siirtyvät automaattisesti päätöslistaan. Päätöslistan avaat painamalla Hakemusten arviointi -näkymän alaosan linkkiä, jossa on avustusten lukumäärä (esim. 60/60 hakemusta). Huomautukset näkyvät vain OPH:n virkailijoille',
      ],
      [
        'Talousarvio',
        '[data-test-id="tooltip-talousarvio"]',
        'Hankkeen yhteyshenkilöksi osoitettu virkailija voi muokata Hyväksytty-sarakkeen kenttiin hakijan hankebudjettia menoluokittain. Tässä osiossa kirjattu budjetti siirtyy automaattisesti hankekohtaiseen avustuspäätökseen ja muodostaa hankkeelle hyväksytyn budjetin',
      ],
      [
        'Muokkaa hakemusta',
        '[data-test-id="tooltip-muokkaa-hakemusta"]',
        'Hankkeen yhteyshenkilöksi osoitettu virkailija voi muokata hakemusta hakijan pyynnöstä esimerkiksi virheellisten yhteystietojen osalta. Painikkeen painamisen jälkeen virkailijan tulee kirjoittaa hakemuksen muokkaamisen syy, joka tallentuu hakemuksen lokitietoihin. Hakemuksen sisällöllisissä muokkauksissa suositellaan käyttämään aina Täydennyspyyntö-ominaisuutta',
      ],
      [
        'Peruuta',
        '[data-test-id="tooltip-peruuta-hakemus"]',
        'Hankkeen yhteyshenkilöksi osoitettu virkailija voi peruuttaa hakemuksen tilanteessa, jossa hakija haluaa vetää hakemuksensa kokonaan pois arvioinneista saamatta hakemukselleen lainkaan päätöstä. Hakemuksen peruuttamisen myötä hakemus siirtyy arkistoon ja poistuu Hakujen arviointi -hakemuslistasta. Hakemuksen peruuttaminen tulee dokumentoida seikkaperäisesti Valmistelijan huomiot -kenttään. Hakijan pyyntö hakemuksen peruuttamiseksi tulee todentaa esimerkiksi liittämällä asiasta käyty sähköpostikeskustelu Seuranta-välilehden Liitteet-osioon',
      ],
    ]) {
      await test.step(`Hovering over ${name} displays correct help text`, async () => {
        await verifyTooltipText(page, selector, hoverText)
      })
    }
    await test.step('after hakemus is set to ratkaistu', async () => {
      const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
      await haunTiedotPage.resolveAvustushaku()
    })
    await test.step(`Hovering over Lähetä sähköpostit uudestaan displays correct help text`, async () => {
      await hakemustenArviointiPage.navigateToHakemus(avustushakuID, projectName)
      await verifyTooltipText(
        page,
        '[data-test-id="tooltip-laheta-email-uudestaan"]',
        'Hankkeelle voidaan lähettää päätössähköposti uudestaan koska tahansa hakukohtaisten avustuspäätösten laatimisen jälkeen. Painiketta painamalla hakijalle lähetetään avustuspäätös sekä yhteyshenkilön että hakijan viralliseen sähköpostiosoitteeseen. Päätössähköpostissa olevan linkin kautta avustuksen saaja voi päivittää hankkeen yhteyshenkilöä itse, joten tätä ominaisuutta voi hyödyntää esimerkiksi henkilövaihdosten kirjaamisessa järjestelmään'
      )
    })
  })
})
