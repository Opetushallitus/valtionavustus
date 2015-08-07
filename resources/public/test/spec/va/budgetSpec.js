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
      page.openLoginPage('fi'),
      page.login,
      enterValidValuesToPage,
      page.waitAutoSave
    )

    describe('oikein täytettynä', function () {
      it('mahdollistaa hakemuksen lähettämisen', function() {
        expect(page.validationErrorsSummary()).to.equal('')
        expect(page.submitButton().isEnabled()).to.equal(true)
      })

      it('näyttää summia', function() {
        expect(page.elementTextBySelector('#project-budget span.sum')).to.equal('10')
        expect(page.elementTextBySelector('.grand-total span.sum')).to.equal('10')
      })
    })

    describe('ilman kuvausta kentältä, jonka arvo on yli nollan', function() {
      before(
        page.setInputValue('service-purchase-costs-row.description', ''),
        page.setInputValue('service-purchase-costs-row.amount', '1000'),
        page.waitAutoSave
      )

      describe('ennen kuvauksen syöttämistä', function() {
        it('ilmoittaa kuvauksen pakollisuudesta', function() {
          expect(page.validationErrorsSummary()).to.equal('1 vastauksessa puutteita')
          expect(page.submitButton().isEnabled()).to.equal(false)
          expect(page.detailedValidationErrors()).to.include('Palvelujen ostot: Pakollinen tieto')
          expect(page.detailedValidationErrors()).to.have.length(1)
        })
      })

      describe('kuvauksen syöttämisen jälkeen', function() {
        before(
          page.setInputValue('service-purchase-costs-row.description', 'Nopean oppimisen konsultointia'),
          page.waitAutoSave
        )

        it('sallii tallentamisen', function() {
          expect(page.validationErrorsSummary()).to.equal('')
          expect(page.submitButton().isEnabled()).to.equal(true)
        })
      })
    })

    describe('negatiivisella budjetilla', function() {
      before(
        page.setInputValue('eu-programs-income-row.description', 'EU-laatutuki 2015'),
        page.setInputValue('eu-programs-income-row.amount', '10000'),
        page.waitAutoSave
      )

      it('ilmoittaa että hankkeella on jo liikaa rahoitusta', function() {
        expect(page.elementTextBySelector('#project-budget span.sum')).to.equal('1010')
        expect(page.elementTextBySelector('#third-party-income span.sum')).to.equal('-10000')
        expect(page.elementTextBySelector('.grand-total span.sum')).to.equal('-8990')

        expect(page.validationErrorsSummary()).to.equal('1 vastauksessa puutteita')
        expect(page.submitButton().isEnabled()).to.equal(false)
        expect(page.detailedValidationErrors()).to.include('Rahoitussuunnitelma: Haettavan rahoituksen tulee olla positiivinen')
        expect(page.detailedValidationErrors()).to.have.length(1)
      })
    })

    describe('muilla kuin täysien eurojen syötteillä', function() {
      before(
        page.setInputValue('service-purchase-costs-row.description', 'Opetusasiantuntijoiden workshop'),
        page.setInputValue('service-purchase-costs-row.amount', '999,90'),
        page.setInputValue('material-costs-row.description', '50 kiloa muovailuvahaa'),
        page.setInputValue('material-costs-row.amount', 'Tarkista hinta!'),
        page.setInputValue('eu-programs-income-row.description', 'EU-laatutuki 2015'),
        page.setInputValue('eu-programs-income-row.amount', '1000.10'),
        page.waitAutoSave
      )

      it('ilmoittaa että määrät on syötettävä täysinä euroina', function() {
        expect(page.submitButton().isEnabled()).to.equal(false)
        expect(page.detailedValidationErrors()).to.include('Palvelujen ostot: Syötä arvo kokonaisina euroina')
        expect(page.detailedValidationErrors()).to.include('Tarvike- ja materiaalikustannukset: Syötä arvo kokonaisina euroina')
        expect(page.detailedValidationErrors()).to.include('EU-ohjelmat: Syötä arvo kokonaisina euroina')
        expect(page.detailedValidationErrors()).to.have.length(3)
        expect(page.validationErrorsSummary()).to.equal('3 vastauksessa puutteita')
      })

      it('näyttää numeerisista luvuista lasketun kokonaissumman', function() {
        expect(page.elementTextBySelector('.grand-total span.sum')).to.equal('10')
      })
    })
  })
})()
