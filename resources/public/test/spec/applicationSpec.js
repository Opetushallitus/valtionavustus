(function () {
  var page = ApplicationPage()

  afterEach(function() {
    if (this.currentTest.state == 'failed') {
      takeScreenshot()
    }
    expect(window.uiError || null).to.be.null
  })

  describe('Yleissivistävä koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen haku suomeksi', function () {
    before(
      page.openPage()
    )

    describe('Alkutilassa', function () {
      it("näkyy haun nimi", function () {
        expect(page.applicationName()).to.deep.equal('Yleissivistävä koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
      })
      it("kielen vaihto osoittaa ruotsiin", function () {
        expect(page.toggleLanguageButton().text()).to.deep.equal('På svenska')
      })
      it("tallennus on disabloitu", function () {
        expect(page.submitButton().isEnabled()).to.equal(false)
      })
    })

    describe('Jos ei olla syötetty kaikkia pakollisia tietoja', function () {
      before(
          page.setInputValue("organization", ""),
          page.setInputValue("primary-email", "yhteyshenkilo@example.com"),
          page.setInputValue("signature", "Matti Allekirjoitusoikeudellinen"),
          page.setInputValue("signature-email", "matti.allekirjoitusoikeudellinen@example.com"),
          page.setInputValue("other-organization-1", "Muu Testi Organisaatio"),
          page.setInputValue("other-organization-1-email", "muutestiorganisaatio@example.com"),
          page.setInputValue("project-network", "Hankeverkon tarina tähän."),
          page.setInputValue("project-goals", "Hankkeen tavoitteet tulee tähän."),
          page.setInputValue("project-explanation", "Hankkeen kuvaus tulee tähän."),
          page.setInputValue("project-target", "Kohderymämme on meidän kohderyhmä"),
          page.setInputValue("project-measure", "Mittaamme toteutumista ja vaikutusta."),
          page.setInputValue("project-announce", "Tiedoitamme hankkeesta kivasti sitten.")
      )
      it("tallennus on disabloitu", function () {
        expect(page.submitButton().isEnabled()).to.equal(false)
      })
      it("pakollisesta kentästä kerrotaan", function () {
        expect(page.error("organization")).to.equal('Pakollinen tieto')
      })

      describe('Pakollisten tietojen syötön jälkeen', function () {
        before(
            page.setInputValue("organization", "Testi Organisaatio"),
            page.submitButton().click,
            wait.until(page.previewButton().isEnabled)
        )

        it("tallennus onnistuu", function () {
          expect(page.saveError()).to.equal('')
        })
      })
    })

    describe('Vaihdettaessa kieli ruotsiksi', function () {
      before(
        page.toggleLanguage
      )
      it("näkyy haun nimi ruotsiksi", function() {
        expect(page.applicationName()).to.deep.equal('Stöd för genomförande av kvalitetsstrategin')
      })
    })
  })

  describe('Yleissivistävä koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen haku ruotsiksi', function () {
    before(
        page.openPage('sv')
    )

    it("näkyy haun nimi ruotsiksi", function() {
      expect(page.applicationName()).to.deep.equal('Stöd för genomförande av kvalitetsstrategin')
    })
  })

  describe('Hakemuksen esikatselu', function() {
    before(
        page.openPreview()
    )
    it("näyttää hakemuksen nimen oikein", function () {
        expect(page.applicationName()).to.deep.equal('Yleissivistävä koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
    })
  })
})()
