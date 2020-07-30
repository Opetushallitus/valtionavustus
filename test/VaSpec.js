const assert = require("assert")
const path = require("path")
const {randomBytes} = require("crypto")
const axios = require("axios")

const xlsx = require("xlsx")

const {
  describeBrowser,
  navigate,
  navigateHakija,
  HAKIJA_URL,
  VIRKAILIJA_URL
} = require("./TestUtil.js")

const dummyPdfPath = path.join(__dirname, 'dummy.pdf')

describeBrowser("VaSpec", function() {
  it("should allow removing attachment from hakemus", async function() {
    const {page} = this
    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    await publishAvustushaku(page, avustushakuID)
    await fillAndSendHakemus(page, avustushakuID, async function() {
      await deleteAttachment(page, "financial-information-form")
      await uploadFile(page, "input[name='financial-information-form']", dummyPdfPath)
    })
  })

  it("should allow basic avustushaku flow and check each hakemus has valmistelija", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    await publishAvustushaku(page, avustushakuID)
    await fillAndSendHakemus(page, avustushakuID)

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)

    // Accept the hakemus
    await navigate(page, `/avustushaku/${avustushakuID}/`)
    await Promise.all([
      page.waitForNavigation(),
      clickElementWithText(page, "td", "Akaan kaupunki"),
    ])

    const hakemusID = await page.evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)[1])
    console.log("Hakemus ID:", hakemusID)

    await clickElement(page, "#arviointi-tab label[for='set-arvio-status-plausible']")
    await clearAndType(page, "#budget-edit-project-budget .amount-column input", "100000")
    await clickElement(page, "#arviointi-tab label[for='set-arvio-status-accepted']")
    await waitForArvioSave(page, avustushakuID, hakemusID)

    await resolveAvustushaku(page, avustushakuID)

    // Sending päätös should give error because the hakemus is missing valmistelija
    await sendPäätös(page, avustushakuID)
    assert.strictEqual(
      await textContent(page, "#päätös-send-error"),
      `Hakemukselle numero ${hakemusID} ei ole valittu valmistelijaa. Päätöksiä ei lähetetty.`
    )

    await selectValmistelijaForHakemus(page, avustushakuID, hakemusID, "_ valtionavustus")

    await sendPäätös(page, avustushakuID)
    const tapahtumaloki = await page.waitForSelector(".tapahtumaloki")
    const logEntryCount = await tapahtumaloki.evaluate(e => e.querySelectorAll(".entry").length)
    assert.strictEqual(logEntryCount, 1)
  })

  it("shows tooltip text for loppuselvitys tab in the tab bar", async function() {
    const {page} = this
    await navigate(page, "/admin/haku-editor/")
    await verifyTooltipText(
      page,
      `[data-test-id="loppuselvitys-välilehti"] a`,
      /Tällä välilehdellä laaditaan ja lähetetään avustuksen saajien loppuselvityspyynnöt. Loppuselvityslomaketta voi luonnostella jo haun suunnitteluvaiheessa, mutta kokonaisuudessaan välilehden tulee olla valmiina ja käännettynä vasta juuri ennen loppuselvityspyyntöjen lähettämistä.*/
    )
  })

  it.only("shows tooltip texts for arviointi tab", async function(){ // TODO: tähän testit tooltipistä
    const {page} = this

    const avustushakuID = await createValidCopyOfLukioEsimerkkihakuWithValintaperusteetAndReturnTheNewId(page)
    await publishAvustushaku(page, avustushakuID)
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

  })

  it("shows tooltip texts for päätös tab", async function() {
    const {page} = this

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
    assert.ok(/.*Jokaiselle valtionavustushakemukselle annetaan arviointien jälkeen avustuspäätös, joka on joko myönteinen tai kielteinen\. Haun vastuuvalmistelija vastaa avustuspäätösten laadusta, hyväksyttämisestä ja lähettämisestä\..*/.test(mainHelpText))

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
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    await clickElementWithText(page, "span", "Päätös")
    const paatosUpdatedAt = textContent(page, "#paatosUpdatedAt")

    await clickElementWithText(page, "span", "Väliselvitys")
    const valiselvitysUpdatedAt = textContent(page, "#valiselvitysUpdatedAt")

    await clickElementWithText(page, "span", "Loppuselvitys")
    const loppuselvitysUpdatedAt = textContent(page, "#loppuselvitysUpdatedAt")

    return Promise.all([paatosUpdatedAt, valiselvitysUpdatedAt, loppuselvitysUpdatedAt])
      .then(([paatos, valiselvitys, loppuselvitys]) => {
        assert.equal(paatos, valiselvitys)
        assert.equal(paatos, loppuselvitys)
      })
  })

  it("updates only the update date on Päätös tab when päätös is modified", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    await clickElementWithText(page, "span", "Päätös")

    await page.waitFor(70000)
    await clearAndType(page, "#decision\\.taustaa\\.fi", "Burger Time")
    await waitForSave(page, avustushakuID)

    const paatosUpdatedAt = textContent(page, "#paatosUpdatedAt")

    await clickElementWithText(page, "span", "Väliselvitys")
    const valiselvitysUpdatedAt = textContent(page, "#valiselvitysUpdatedAt")

    await clickElementWithText(page, "span", "Loppuselvitys")
    const loppuselvitysUpdatedAt = textContent(page, "#loppuselvitysUpdatedAt")

    return Promise.all([paatosUpdatedAt, valiselvitysUpdatedAt, loppuselvitysUpdatedAt])
      .then(([paatos, valiselvitys, loppuselvitys]) => {
        assert.equal(valiselvitys, loppuselvitys)
        assert.notEqual(paatos, valiselvitys)
      })
  })

  it("supports fields that accept only decimals", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId, fieldLabel } = await addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel(page, avustushakuID, "decimalField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page, avustushakuID)

    await fillAndSendHakemus(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectValidationError(page, fieldId, 'Not an decimal', fieldLabel, 'fi: Syötä yksi numeroarvo')
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, '4.2')
    })
  })

  it("supports fields that accept only whole numbers", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId, fieldLabel } = await addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel(page, avustushakuID, "integerField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page, avustushakuID)

    await fillAndSendHakemus(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectValidationError(page, fieldId, 'Not an integer', fieldLabel, 'fi: Syötä arvo kokonaislukuina')
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, '420')
    })
  })

  it("supports editing and saving the values of the fields", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    await clickElementWithText(page, "span", "Hakulomake")
    await page.waitForFunction(() => document.querySelector("button#saveForm").disabled === true)
    await clearAndType(page, "textarea[name='duration-help-text-fi']", "Gimblegamble")
    await page.waitForFunction(() => document.querySelector("button#saveForm").disabled === false)
  })


  it("produces väliselvitys sheet in excel export", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    await publishAvustushaku(page, avustushakuID)
    await fillAndSendHakemus(page, avustushakuID)

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)

    // Accept the hakemus
    await navigate(page, `/avustushaku/${avustushakuID}/`)
    await Promise.all([
      page.waitForNavigation(),
      clickElementWithText(page, "td", "Akaan kaupunki"),
    ])

    const hakemusID = await page.evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)[1])
    console.log("Hakemus ID:", hakemusID)

    await clickElement(page, "#arviointi-tab label[for='set-arvio-status-plausible']")
    await clearAndType(page, "#budget-edit-project-budget .amount-column input", "100000")
    await clickElement(page, "#arviointi-tab label[for='set-arvio-status-accepted']")
    await waitForArvioSave(page, avustushakuID, hakemusID)

    await resolveAvustushaku(page, avustushakuID)

    await selectValmistelijaForHakemus(page, avustushakuID, hakemusID, "_ valtionavustus")

    await sendPäätös(page, avustushakuID)
    const tapahtumaloki = await page.waitForSelector(".tapahtumaloki")
    const logEntryCount = await tapahtumaloki.evaluate(e => e.querySelectorAll(".entry").length)
    assert.strictEqual(logEntryCount, 1)

    await verifyTooltipText(
      page,
      `[data-test-id="väliselvitys-välilehti"] a`,
      /Tällä välilehdellä laaditaan ja lähetetään avustuksen saajien väliselvityspyynnöt.*/
    )

    await gotoVäliselvitysTab(page, avustushakuID)
    await clickElementWithText(page, "button", "Lähetä väliselvityspyynnöt")
    const responseP = page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/send-notification`)
    await waitForElementWithText(page, "span", "Lähetetty 1 viestiä")
    const response = await (responseP.then(_ => _.json()))
    const väliselvitysKey = response.hakemukset[0].user_key
    console.log(`Väliselvitys user_key: ${väliselvitysKey}`)

    await fillAndSendVäliselvityspyyntö(page, avustushakuID, väliselvitysKey)

    const workbook = await downloadExcelExport(page, avustushakuID)

    assert.deepStrictEqual(workbook.SheetNames, [ "Hakemukset", "Hakemuksien vastaukset", "Väliselvityksien vastaukset", "Loppuselvityksien vastaukset", "Tiliöinti" ])
    const sheet = workbook.Sheets["Väliselvityksien vastaukset"]

    assert.strictEqual(sheet.B1.v, "Hakijaorganisaatio")
    assert.strictEqual(sheet.B2.v, "Akaan kaupungin kissojenkasvatuslaitos")

    assert.strictEqual(sheet.C1.v, "Hankkeen nimi")
    assert.strictEqual(sheet.C2.v, "Kissojen koulutuksen tehostaminen")
  })

  it("should allow user to add koodistokenttä to form and save it", async function() {
    const {page} = this

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
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId, fieldLabel } = await addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, "project-nutshell", "textField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page, avustushakuID)

    const randomValueForProjectNutshell = randomString()
    const hakemusID = await fillAndSendHakemusAndReturnHakemusId(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, randomValueForProjectNutshell)
    })

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
    await acceptHakemus(page, avustushakuID, hakemusID, async () => {
      await clickElementWithTestId(page, 'tab-seuranta')
      await clickElementWithTestId(page, 'set-allow-visibility-in-external-system-true')
      await waitForSave(page, avustushakuID)
    })

    const expectedResponse = await expectedResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID, hakemusID, randomValueForProjectNutshell)
    const actualResponse = await actualResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID)
    assert.deepEqual(actualResponse, expectedResponse)
  })

  it("shows the contents of the project-goals -field of a hakemus in external api as 'nutshell'", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId, fieldLabel } = await addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, "project-goals", "textField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page, avustushakuID)

    const randomValueForProjectNutshell = randomString()
    const hakemusID = await fillAndSendHakemusAndReturnHakemusId(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, randomValueForProjectNutshell)
    })

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)
    await acceptHakemus(page, avustushakuID, hakemusID, async () => {
      await clickElementWithTestId(page, 'tab-seuranta')
      await clickElementWithTestId(page, 'set-allow-visibility-in-external-system-true')
      await waitForSave(page, avustushakuID)
    })

    const expectedResponse = await expectedResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID, hakemusID, randomValueForProjectNutshell)
    const actualResponse = await actualResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID)
    assert.deepEqual(actualResponse, expectedResponse)
  })

  it("creates a new koodi", async function() {
    const { page } = this

    await navigate(page, '/admin-ui/va-code-values/')
    const code = await createUniqueCode(page)

    await navigate(page, '/admin-ui/va-code-values/')
    await page.waitForSelector(`tr[data-test-id="${code}"]`)
  })

  it("sets a koodi hidden and visible", async function() {
    const { page } = this

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
    const { page } = this

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
})

async function createUniqueCode(page) {
  const uniqueCode = (new Date()).getTime()
  await clearAndType(page, '[data-test-id=code-form__year', '2020')
  await clearAndType(page, '[data-test-id=code-form__code', `${uniqueCode}`)
  await clearAndType(page, '[data-test-id=code-form__name', `Test code ${uniqueCode}`)
  await clickElementWithTestId(page, 'code-form__add-button')
  await page.waitForSelector(`tr[data-test-id="${uniqueCode}"]`)
  return uniqueCode
}

async function clickCodeVisibilityButton(page, code, visibility) {
  const buttonId = visibility ? 'code-row__show-button' : 'code-row__hide-button'
  const selector = `tr[data-test-id='${code}'] [data-test-id=${buttonId}]`
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await element.click()
}

async function assertCodeIsVisible(page, code, visibility) {
  const buttonId = visibility ? 'code-row__hide-button' : 'code-row__show-button'
  const selector = `tr[data-test-id='${code}'] [data-test-id=${buttonId}]`
  await page.waitForSelector(selector)
}

async function acceptHakemus(page, avustushakuID, hakemusID, beforeSubmitFn) {
  await navigate(page, `/avustushaku/${avustushakuID}/`)
  await Promise.all([
    page.waitForNavigation(),
    clickElementWithText(page, "td", "Akaan kaupunki"),
  ])

  await clickElement(page, "#arviointi-tab label[for='set-arvio-status-plausible']")
  await clearAndType(page, "#budget-edit-project-budget .amount-column input", "100000")
  await clickElement(page, "#arviointi-tab label[for='set-arvio-status-accepted']")
  await waitForArvioSave(page, avustushakuID, hakemusID)
  await beforeSubmitFn()
  await resolveAvustushaku(page, avustushakuID)
}

async function expectedResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID, hakemusID, valueForNutshellField) {
  return [{
    'project-name': "",
    'project-begin': null,
    'organization-name': "Akaan kaupunki",
    'grant-id': avustushakuID,
    partners: null,
    'costs-granted' : 100000,
    'user-last-name': null,
    'language': "fi",
    id: hakemusID,
    nutshell: valueForNutshellField,
    'user-first-name': null,
    'budget-granted': 100000,
    'project-end': null
  }]
}

async function verifyTooltipText(page, tooltipAnchorSelector, tooltipTextRegex) {
  const tooltipContentSelector = `${tooltipAnchorSelector} span`
  await page.evaluate((tooltipAnchorSelector) => {
    document.querySelector(tooltipAnchorSelector).scrollIntoView({ block: 'center' });
  }, tooltipAnchorSelector)

  await page.hover(tooltipAnchorSelector)
  const tooltipElement = await page.waitForSelector(tooltipContentSelector, { visible: true })
  const tooltipText = await page.evaluate(element => element.textContent, tooltipElement)
  assert.ok(tooltipTextRegex.test(tooltipText), `Tooltip ${tooltipTextRegex.source} found from: ${tooltipText}`)
}

async function actualResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID) {
  const url = `${VIRKAILIJA_URL}/api/v2/external/avustushaku/${avustushakuID}/hakemukset`
  return await axios.get(url).then(r => r.data)
}

async function resolveAvustushaku(page, avustushakuID) {
  await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
  await clickElement(page, "label[for='set-status-resolved']")
  await waitForSave(page, avustushakuID)
}

async function closeAvustushakuByChangingEndDateToPast(page, avustushakuID) {
  await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
  const previousYear = (new Date()).getFullYear() - 1
  await clearAndType(page, "#hakuaika-end", `1.1.${previousYear} 0.00`)
  await waitForSave(page, avustushakuID)
}

async function fillAndSendVäliselvityspyyntö(page, avustushakuID, väliselvitysKey) {
  await navigateHakija(page, `/avustushaku/${avustushakuID}/valiselvitys?hakemus=${väliselvitysKey}&lang=fi`)
  await clearAndType(page, "#organization", "Akaan kaupungin kissojenkasvatuslaitos")
  await clearAndType(page, "#project-name", "Kissojen koulutuksen tehostaminen")
  await clearAndType(page, "[name='project-description.project-description-1.goal']", "Kouluttaa kissoja entistä tehokkaamminen")
  await clearAndType(page, "[name='project-description.project-description-1.activity']", "Kissoille on tarjottu enemmän kissanminttua")
  await clearAndType(page, "[name='project-description.project-description-1.result']", "Ei tiedossa")

  await clearAndType(page, "[name='textArea-1']", "Miten hankeen toimintaa, tuloksia ja vaikutuksia on arvioitu?")
  await clearAndType(page, "[name='textArea-3']", "Miten hankkeesta/toiminnasta on tiedotettu?")

  await clickElementWithText(page, "label", "Toimintamalli")

  await clearAndType(page, "[name='project-outcomes.project-outcomes-1.description']", "Kuvaus")
  await clearAndType(page, "[name='project-outcomes.project-outcomes-1.address']", "Saatavuustiedot, www-osoite tms.")

  await clickElement(page, "label[for='radioButton-good-practices.radio.1']")
  await clearAndType(page, "[name='textArea-4']", "Lisätietoja")

  await uploadFile(page, "[name='namedAttachment-0']", dummyPdfPath)

  await submitVäliselvitys(page)
}

async function typeValueInFieldAndExpectValidationError(page, fieldId, value, fieldLabel, errorMessage) {
  const selector = '#' + fieldId
  const errorSummarySelector = 'a.validation-errors-summary'
  await clearAndType(page, selector, value)
  await page.waitForSelector(errorSummarySelector, { visible: true })
  assert.equal(await textContent(page, errorSummarySelector), '1 vastauksessa puutteita')
  await clickElement(page, errorSummarySelector)
  assert.equal(await textContent(page, '.validation-errors'), fieldLabel + errorMessage)
  await page.waitForSelector('#submit:disabled')
}

async function typeValueInFieldAndExpectNoValidationError(page, fieldId, value) {
  const selector = '#' + fieldId
  const errorSummarySelector = 'a.validation-errors-summary'
  await clearAndType(page, selector, value)
  await page.waitForFunction(s => document.querySelector(s) == null, {}, errorSummarySelector)
  await page.waitForSelector('#submit:enabled')
}

async function addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel(page, avustushakuID, fieldType) {
  const fieldId = "fieldId" + randomString()
  return addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, fieldId, fieldType)
}

async function addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, fieldId, fieldType) {
  const fields = [{fieldId: fieldId, fieldType: fieldType}]
  const augmentedFields = await addFieldsToFormAndReturnElementIdsAndLabels(page, avustushakuID, fields)
  return augmentedFields[0]
}

async function addFieldsToFormAndReturnElementIdsAndLabels(page, avustushakuID, fields) {
  await clickElementWithText(page, "span", "Hakulomake")
  const jsonString = await textContent(page, ".form-json-editor textarea")
  const json = JSON.parse(jsonString)
  const content = json.content

  const fieldsWithIdAndLabel = fields.map(({ fieldId, fieldType }) => ({
    fieldType: fieldType,
    fieldId: fieldId,
    fieldLabel: "fieldLabel" + randomString(),
  }))

  const fieldsJson = fieldsWithIdAndLabel.map(({ fieldType, fieldId, fieldLabel }) => fieldJson(fieldType, fieldId, fieldLabel))
  const newJson = JSON.stringify(Object.assign({}, json, { content: content.concat(fieldsJson) }))
  await clearAndSet(page, ".form-json-editor textarea", newJson)

  await clickFormSaveAndWait(page, avustushakuID)

  return fieldsWithIdAndLabel
}

async function clickFormSaveAndWait(page, avustushakuID) {
  await Promise.all([
    page.waitForResponse(response => response.url() === `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/form` && response.status() === 200),
    clickElementWithText(page, "button", "Tallenna")
  ])
}

function fieldJson(type, id, label) {
  return {
    "fieldClass": "wrapperElement",
    "id": id + 'wrapper',
    "fieldType": "theme",
    "children": [
      {
        "label": {
          "fi": label + "fi",
          "sv": label + "sv"
        },
        "fieldClass": "formField",
        "helpText": {
          "fi": "helpText fi",
          "sv": "helpText sv"
        },
        "id": id,
        "params": {
          "size": "small",
          "maxlength": 1000
        },
        "required": true,
        "fieldType": type
      }
    ]}
}

async function publishAvustushaku(page, avustushakuID) {
  await clickElement(page, "label[for='set-status-published']")
  await waitForSave(page, avustushakuID)
}

async function fillAndSendHakemus(page, avustushakuID, beforeSubmitFn) {
  await navigateHakija(page, `/avustushaku/${avustushakuID}/`)

  await clearAndType(page, "#primary-email", "erkki.esimerkki@example.com")
  await clickElement(page, "#submit")

  await clearAndType(page, "#finnish-business-id", "2050864-5")
  await clickElement(page, "input.get-business-id")

  await clearAndType(page, "#applicant-name", "Erkki Esimerkki")
  await clearAndType(page, "#signature", "Erkki Esimerkki")
  await clearAndType(page, "#signature-email", "erkki.esimerkki@example.com")
  await clearAndType(page, "#bank-iban", "FI95 6682 9530 0087 65")
  await clearAndType(page, "#bank-bic", "OKOYFIHH")
  await clickElementWithText(page, "label", "Kansanopisto")

  await clearAndType(page, "[name='project-costs-row.amount']", "100000")
  await uploadFile(page, "[name='previous-income-statement-and-balance-sheet']", dummyPdfPath)
  await uploadFile(page, "[name='previous-financial-year-report']", dummyPdfPath)
  await uploadFile(page, "[name='previous-financial-year-auditor-report']", dummyPdfPath)
  await uploadFile(page, "[name='current-year-plan-for-action-and-budget']", dummyPdfPath)
  await uploadFile(page, "[name='description-of-functional-development-during-last-five-years']", dummyPdfPath)
  await uploadFile(page, "[name='financial-information-form']", dummyPdfPath)

  if (beforeSubmitFn) {
    await beforeSubmitFn()
  }

  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").disabled === false)
  await clickElement(page, "#topbar #form-controls button#submit")
  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").textContent === "Hakemus lähetetty")
}

async function fillAndSendHakemusAndReturnHakemusId(page, avustushakuID, beforeSubmitFn) {
  let hakemusID

  async function fn() {
    const token = await page.evaluate(() => (new URLSearchParams(window.location.search)).get("hakemus"))
    const url = `${VIRKAILIJA_URL}/api/v2/external/hakemus/id/${token}`
    hakemusID = await axios.get(url).then(r => r.data.id)

    if (beforeSubmitFn)
      await beforeSubmitFn()
  }

  await fillAndSendHakemus(page, avustushakuID, fn)
  return parseInt(hakemusID)
}

async function downloadExcelExport(page, avustushakuID) {
  await navigate(page, `/avustushaku/${avustushakuID}/`)

  // Hack around Puppeteer not being able to tell Puppeteer where to download files
  const url = `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/export.xslx`
  const buffer = await downloadFile(page, url)
  return xlsx.read(buffer, {type: "buffer"})
}

// https://github.com/puppeteer/puppeteer/issues/299#issuecomment-569221074
async function downloadFile(page, resource, init) {
  const data = await page.evaluate(async (resource, init) => {
    const resp = await window.fetch(resource, init)
    if (!resp.ok)
      throw new Error(`Server responded with ${resp.status} ${resp.statusText}`)
    const data = await resp.blob()
    const reader = new FileReader()
    return new Promise(resolve => {
      reader.addEventListener("loadend", () => resolve({
        url: reader.result,
        mime: resp.headers.get('Content-Type'),
      }))
      reader.readAsDataURL(data)
    })
  }, resource, init)
  return Buffer.from(data.url.split(",")[1], "base64")
}

async function submitHakemus(page) {
  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").disabled === false)
  await clickElement(page, "#topbar #form-controls button#submit")
  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").textContent === "Hakemus lähetetty")
}

async function createValidCopyOfLukioEsimerkkihakuWithValintaperusteetAndReturnTheNewId(page) {
  const avustushakuName = mkAvustushakuName()
  console.log(`Avustushaku name for test: ${avustushakuName}`)

  await copyEsimerkkihaku(page)

  const avustushakuID = await page.evaluate(() => (new URLSearchParams(window.location.search)).get("avustushaku"))
  console.log(`Avustushaku ID: ${avustushakuID}`)

  await clearAndType(page, "#register-number", "230/2015")
  await clearAndType(page, "#haku-name-fi", avustushakuName)
  await clearAndType(page, "#hakuaika-start", "1.1.1970 0.00")

  const lukioKoulutusasteSelector = '[name=education-levels][data-title="Lukiokoulutus"]'
  await clearAndType(page, lukioKoulutusasteSelector, "29.10.30")

  await clickElementWithText(page, "button", "Lisää uusi valintaperuste")
  await clearAndType(page, "#selection-criteria-0-fi", "Hanke edistää opetustuntikohtaisen valtionosuuden piiriin kuuluvan taiteen perusopetuksen pedagogista kehittämistä.")
  await clearAndType(page, "#selection-criteria-0-sv", "Och samma på svenska.")

  const nextYear = (new Date()).getFullYear() + 1
  await clearAndType(page, "#hakuaika-end", `31.12.${nextYear} 23.59`)
  await waitForSave(page, avustushakuID)

  return parseInt(avustushakuID)
}

async function createValidCopyOfEsimerkkihakuAndReturnTheNewId(page) {
  const avustushakuName = mkAvustushakuName()
  console.log(`Avustushaku name for test: ${avustushakuName}`)

  await copyEsimerkkihaku(page)

  const avustushakuID = await page.evaluate(() => (new URLSearchParams(window.location.search)).get("avustushaku"))
  console.log(`Avustushaku ID: ${avustushakuID}`)

  await clearAndType(page, "#register-number", "230/2015")
  await clearAndType(page, "#haku-name-fi", avustushakuName)
  await clearAndType(page, "#hakuaika-start", "1.1.1970 0.00")

  const nextYear = (new Date()).getFullYear() + 1
  await clearAndType(page, "#hakuaika-end", `31.12.${nextYear} 23.59`)
  await waitForSave(page, avustushakuID)

  return parseInt(avustushakuID)
}

async function submitVäliselvitys(page) {
  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").disabled === false)
  await clickElement(page, "#topbar #form-controls button#submit")
  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").textContent === "Väliselvitys lähetetty")
}

async function selectValmistelijaForHakemus(page, avustushakuID, hakemusID, valmistelijaName) {
  await navigate(page, `/avustushaku/${avustushakuID}/`)
  await clickElement(page, `#hakemus-${hakemusID} .btn-role`)

  const xpath = `//table[contains(@class, 'hakemus-list')]/tbody//tr[contains(@class, 'selected')]//button[contains(., '${valmistelijaName}')]`
  const valmistelijaButton = await page.waitForXPath(xpath, {visible: true})

  await Promise.all([
    page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio`),
    valmistelijaButton.click(),
  ])
}

async function gotoVäliselvitysTab(page, avustushakuID) {
  await navigate(page, `/admin/valiselvitys/?avustushaku=${avustushakuID}`)
}

async function gotoPäätösTab(page, avustushakuID) {
  await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
}

async function sendPäätös(page, avustushakuID) {
  await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
  await clickElementWithText(page, "button", "Lähetä 1 päätöstä")
  await Promise.all([
    page.waitForResponse(`${VIRKAILIJA_URL}/api/paatos/sendall/${avustushakuID}`),
    clickElementWithText(page, "button", "Vahvista lähetys"),
  ])
}

async function uploadFile(page, selector, filePath) {
  const element = await page.$(selector)
  await element.uploadFile(filePath)
}

async function deleteAttachment(page, attachmentFieldId) {
  await clickElement(page, `#${attachmentFieldId} button.soresu-remove`)
  await page.waitForSelector(`[name='${attachmentFieldId}']`)
}

async function waitForArvioSave(page, avustushakuID, hakemusID) {
  await page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio`)
}

async function waitForSave(page, avustushakuID) {
  await page.waitForFunction(() => document.querySelector("#form-controls .status .info").textContent === "Kaikki tiedot tallennettu")
}

async function clearAndType(page, selector, text) {
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await element.click()
  await page.evaluate(e => e.value = "", element)
  await page.keyboard.type(text)
  await page.evaluate(e => e.blur(), element)
}

async function clearAndSet(page, selector, text) {
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await page.evaluate((e, t) => e.value = t, element, text)
  await page.focus(selector);
  await page.keyboard.type(' ')
  await page.keyboard.press('Backspace')
}

async function clickElementWithTestId(page, testId) {
  const element = await page.waitForSelector(`[data-test-id='${testId}']`, {visible: true, timeout: 5 * 1000})
  await element.click()
}

async function clickElementWithText(page, elementType, text) {
  const element = await waitForElementWithText(page, elementType, text)
  assert.ok(element, `Could not find ${elementType} element with text '${text}'`)
  await element.click()
}

async function waitForElementWithText(page, elementType, text) {
  return await page.waitForXPath(`//${elementType}[contains(., '${text}')]`, {visible: true})
}

async function clickElement(page, selector) {
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await element.click()
}

async function textContent(page, selector) {
  const element = await page.waitForSelector(selector, {visible: true})
  return await page.evaluate(_ => _.textContent, element)
}

function mkAvustushakuName() {
  return "Testiavustushaku " + randomString()
}

async function copyEsimerkkihaku(page) {
  // Copy esimerkkihaku
  await navigate(page, "/admin/haku-editor/")
  await clickElement(page, ".haku-filter-remove")
  await clickElementWithText(page, "td", "Yleisavustus - esimerkkihaku")
  await clickElementWithText(page, "a", "Kopioi uuden pohjaksi")
  await page.waitFor(2000) // :|
}

function randomString() {
  return randomBytes(8).toString("hex")
}
