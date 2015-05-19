(function () {
  var page = ApplicationListPage()

  afterEach(function() {
    if (this.currentTest.state == 'failed') {
      takeScreenshot()
    }
    expect(window.uiError || null).to.be.null
  })

  describe('Dummy hakemuslistaus', function () {
    before(
        page.openPage()
    )

    it("näkyy hello world", function() {
      expect(page.applications()).to.deep.equal([
        { applicationName: 'Hello, world!' }
      ])
    })
  })

})()
