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

  describe('Budjettitaulukko', function () {
    before(
      page.openStartPage('fi'),
      enterValidValuesToPage,
      page.waitAutoSave
    )

    it('Mahdollistaa hakemuksen lähettämisen oikein täytettynä', function() {
      expect(page.validationErrors()).to.equal('')
      expect(page.submitButton().isEnabled()).to.equal(true)
    })

    describe('Ilman kuvausta kentältä, jonka arvo on yli nollan', function() {
      before(
        page.setInputValue('service-purchase-costs-row.description', ''),
        page.setInputValue('service-purchase-costs-row.amount', '1000')
      )

      it('ilmoittaa kuvauksen pakollisuudesta', function() {
        expect(page.validationErrors()).to.equal('1 vastauksessa puutteita')
        expect(page.submitButton().isEnabled()).to.equal(false)
        expect(page.detailedValidationErrors()).to.include('Palvelujen ostot: Pakollinen tieto')
        expect(page.detailedValidationErrors()).to.have.length(1)
      })

      describe('Kuvauksen syöttämisen jälkeen', function() {
        before(
          page.setInputValue('service-purchase-costs-row.description', 'Nopean oppimisen konsultointia'),
          page.waitAutoSave
        )

        it('sallii tallentamisen', function() {
          expect(page.validationErrors()).to.equal('')
          expect(page.submitButton().isEnabled()).to.equal(true)
        })
      })
    })
  })
})()
