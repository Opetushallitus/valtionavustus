(function () {
  var page = ApplicationListPage()

  afterEach(function() {
    expect(window.uiError || null).to.be.null
  })

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      takeScreenshot()
    }
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
