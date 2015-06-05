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
      it("kielen vaihto suomeksi on disabloitu", function () {
        expect(page.changeLanguageButton('fi').isEnabled()).to.deep.equal(false)
      })
    })

    describe('Jos yritetään tallentaa syöttämättä kaikkia pakollisia tietoja', function () {
      before(
          page.saveWaitError
      )
      it("tulee yleinen virhe viesti", function () {
        expect(page.saveError()).to.equal('Ei tallennettu - tarkista syöttämäsi tiedot.')
      })
      it("pakollisesta kentästä kerrotaan", function () {
        expect(page.error("organization")).to.equal('Pakollinen tieto')
      })
    })


    describe('Pakollisten tietojen syötön jälkeen', function () {
      before(
          page.setInputValue("nimi", "testinimi"),
          page.setInputValue("uusi", "uusi"),
          page.setInputValue("tavoitteet", "testin tavoitteet"),
          page.setInputValue("kuvaus", "testin kuvaus"),
          page.setInputValue("kohderyhma", "testin kohderyhmä"),
          page.setInputValue("arviointi", "testin arviointi"),
          page.setInputValue("arviointi", "testin arviointi"),
          page.setInputValue("paikkakunnat", "testin paikkakunta"),
          page.setInputValue("alue", "alueellinen"),
          page.setInputValue("tiedotus", "testin tiedotus"),
          page.submitButton().click,
          wait.until(page.previewLink().isVisible)
      )

      it("tallennus onnistuu", function () {
      })
    })

    describe('Vaihdettaessa kieli ruotsiksi', function () {
      before(
        page.paSvenska
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

})()
