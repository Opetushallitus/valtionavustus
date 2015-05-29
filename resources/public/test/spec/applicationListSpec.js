(function () {
  var page = ApplicationListPage()

  afterEach(function() {
    if (this.currentTest.state == 'failed') {
      takeScreenshot()
    }
    expect(window.uiError || null).to.be.null
  })

  describe('Laatustrategian toimeenpanon tuki', function () {
    before(
        page.openPage()
    )

    it("näkyy oikea nimi", function() {
      expect(page.applications()).to.deep.equal([
        { applicationName: 'Laatustrategian toimeenpanon tuki' }
      ])
    })
  })

})()
