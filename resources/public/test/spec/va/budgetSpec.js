(function () {
  const page = ApplicationPage()

  beforeEach(function() {
    window.localStorage.clear()
  })

  afterEach(function() {
    if (this.currentTest.state == 'failed') {
      takeScreenshot()
    }
    expect(window.uiError || null).to.be.null
  })

  function enterValidValuesToPage() {
    enterValidValues(page)
  }

  describe('Oikein täytetty budjettitaulukko', function () {
    before(
      page.openStartPage('fi'),
      enterValidValuesToPage,
      page.waitAutoSave
    )

    it("Mahdollistaa hakemuksen lähettämisen", function() {
      expect(page.submitButton().isEnabled()).to.equal(true)
    })
  })
})()
