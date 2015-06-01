(function () {
  var page = ApplicationListPage()

  afterEach(function() {
    if (this.currentTest.state == 'failed') {
      takeScreenshot()
    }
    expect(window.uiError || null).to.be.null
  })

  describe('Laatustrategian toimeenpanon tuki haku suomeksi', function () {
    before(
        page.openPage()
    )

    describe('Alkutilassa', function () {
      it("näkyy haun nimi", function () {
        expect(page.applicationName()).to.deep.equal('Laatustrategian toimeenpanon tuki')
      })
      it("kielen vaihto suomeksi on disabloitu", function () {
        expect(page.changeLanguageButton('fi').isEnabled()).to.deep.equal(false)
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

  describe('Laatustrategian toimeenpanon tuki haku ruotsiksi', function () {
    before(
        page.openPage('sv')
    )

    it("näkyy haun nimi ruotsiksi", function() {
      expect(page.applicationName()).to.deep.equal('Stöd för genomförande av kvalitetsstrategin')
    })
  })

})()
