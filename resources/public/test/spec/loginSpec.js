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

  describe('Sisäänkirjautuminen', function () {
    before(
      loginPage.openLoginPage()
    )

    describe('sisäänkirjautumissivulla', function () {
      it("näkyy haun nimi", function () {
        expect(loginPage.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
      })

      it("lähetys on disabloitu", function () {
        expect(loginPage.submitButton().isEnabled()).to.equal(false)
      })
    })
  })

  describe('Ruotsinkielisellä sisäänkirjautumissivulla', function() {
    before(
      loginPage.openLoginPage('sv')
    )

    it("näkyy haun nimi ruotsiksi", function () {
      expect(loginPage.applicationName()).to.deep.equal('Stöd för genomförande av kvalitetsstrategin')
    })
  })
})()