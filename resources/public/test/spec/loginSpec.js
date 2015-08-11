(function() {
  var loginPage = LoginPage()

  beforeEach(function () {
    window.localStorage.clear()
  })

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      takeScreenshot()
    }
    expect(window.uiError || null).to.be.null
  })

  describe('Sisäänkirjautuminen', function() {
    before(
      loginPage.openLoginPage()
    )

    describe('sisäänkirjautumissivulla', function() {
      it("näkyy haun nimi", function() {
        expect(loginPage.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
      })

      it("alkutilassa hakemuksen luonti on disabloitu", function() {
        expect(loginPage.submitButton().isEnabled()).to.equal(false)
      })

      it("mikäli syöttää jotain muuta kuin sähköpostiosoitteen", function() {
        loginPage.setInputValue("primary-email", "notanemailaddress")()
        expect(loginPage.classAttributeOf("primary-email")).to.include('error')
        expect(loginPage.submitButton().isEnabled()).to.equal(false)
      })

      it("mikäli syöttää oikean sähköpostiosoitteen", function() {
        loginPage.setInputValue("primary-email", "yhteyshenkilo@example.com")()
        expect(loginPage.submitButton().isEnabled()).to.equal(true)
      })
    })
  })

  describe('Ruotsinkielisellä sisäänkirjautumissivulla', function() {
    before(
      loginPage.openLoginPage('sv')
    )

    it("näkyy haun nimi ruotsiksi", function() {
      expect(loginPage.applicationName()).to.deep.equal('Stöd för genomförande av kvalitetsstrategin')
    })
  })
})()