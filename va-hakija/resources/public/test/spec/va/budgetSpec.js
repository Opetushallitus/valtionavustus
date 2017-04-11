(function() {
  const applicationPage = ApplicationPage()
  const loginPage = LoginPage()

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
    enterValidValues(applicationPage)
  }

  describe('Budjettitaulukko', function() {
    before(
      loginPage.setSystemTime("2015-09-30T16:14:59.999+03"),
      loginPage.openLoginPage('fi'),
      loginPage.login,
      enterValidValuesToPage,
      applicationPage.waitAutoSave
    )

    after(
      loginPage.resetSystemTime()
    )

    describe('oikein täytettynä', function() {
      it('mahdollistaa hakemuksen lähettämisen', function() {
        expect(applicationPage.validationErrorsSummary()).to.equal('')
        expect(applicationPage.submitButton().isEnabled()).to.equal(true)
      })

      it('näyttää rahoituksen tarpeen', function() {
        expect(applicationPage.elementTextBySelector('#budget-summary .total-financing-amount .money.sum')).to.equal('10')
      })

      it('näyttää omarahoituksen', function() {
        expect(applicationPage.elementTextBySelector('#budget-summary .self-financing-amount .money')).to.equal('3')
        expect(applicationPage.elementTextBySelector('#budget-summary .self-financing-percentage .percentage')).to.equal('30')
      })

      it('näyttää OPH:n rahoituksen', function() {
        expect(applicationPage.elementTextBySelector('#budget-summary .oph-financing-amount .money')).to.equal('7')
        expect(applicationPage.elementTextBySelector('#budget-summary .oph-financing-percentage .percentage')).to.equal('70')
      })
    })

    describe('ilman kuvausta kentältä, jonka arvo on yli nollan', function() {
      before(
        applicationPage.setInputValue('service-purchase-costs-row.description', ''),
        applicationPage.setInputValue('service-purchase-costs-row.amount', '1000'),
        applicationPage.waitAutoSave
      )

      describe('ennen kuvauksen syöttämistä', function() {
        it('ilmoittaa kuvauksen pakollisuudesta', function() {
          expect(applicationPage.validationErrorsSummary()).to.equal('1 vastauksessa puutteita')
          expect(applicationPage.submitButton().isEnabled()).to.equal(false)
          expect(applicationPage.detailedValidationErrors()).to.include('Palvelujen ostot: Pakollinen tieto')
          expect(applicationPage.detailedValidationErrors()).to.have.length(1)
        })
      })

      describe('kuvauksen syöttämisen jälkeen', function() {
        before(
          applicationPage.setInputValue('service-purchase-costs-row.description', 'Nopean oppimisen konsultointia'),
          applicationPage.waitAutoSave
        )

        it('sallii tallentamisen', function() {
          expect(applicationPage.validationErrorsSummary()).to.equal('')
          expect(applicationPage.submitButton().isEnabled()).to.equal(true)
        })
      })
    })

    describe('negatiivisella budjetilla', function() {
      before(
        applicationPage.setInputValue('eu-programs-income-row.description', 'EU-laatutuki 2015'),
        applicationPage.setInputValue('eu-programs-income-row.amount', '10000'),
        applicationPage.waitAutoSave
      )

      it('ilmoittaa että hankkeella on jo liikaa rahoitusta', function() {
        expect(applicationPage.elementTextBySelector('#project-budget .money.sum')).to.equal('1010')
        expect(applicationPage.elementTextBySelector('#third-party-income .money.sum')).to.equal('-10000')
        expect(applicationPage.elementTextBySelector('#budget-summary .total-financing-amount .money.sum')).to.equal('-8990')

        expect(applicationPage.validationErrorsSummary()).to.equal('1 vastauksessa puutteita')
        expect(applicationPage.submitButton().isEnabled()).to.equal(false)
        expect(applicationPage.detailedValidationErrors()).to.include('Rahoitussuunnitelma: Haettavan rahoituksen tulee olla positiivinen')
        expect(applicationPage.detailedValidationErrors()).to.have.length(1)
      })

      it('näyttää virheen omarahoituksessa', function() {
        expect(applicationPage.elementTextBySelector('#budget-summary .self-financing-amount .error')).to.equal('Tarkista luvut')
        expect(applicationPage.elementTextBySelector('#budget-summary .self-financing-percentage .error')).to.equal('Tarkista luvut')
      })

      it('näyttää virheen OPH:n rahoituksessa', function() {
        expect(applicationPage.elementTextBySelector('#budget-summary .oph-financing-amount .error')).to.equal('Tarkista luvut')
        expect(applicationPage.elementTextBySelector('#budget-summary .oph-financing-percentage .error')).to.equal('Tarkista luvut')
      })
    })

    describe('muilla kuin täysien eurojen syötteillä', function() {
      before(
        applicationPage.setInputValue('service-purchase-costs-row.description', 'Opetusasiantuntijoiden workshop'),
        applicationPage.setInputValue('service-purchase-costs-row.amount', '999,90'),
        applicationPage.setInputValue('material-costs-row.description', '50 kiloa muovailuvahaa'),
        applicationPage.setInputValue('material-costs-row.amount', 'Tarkista hinta!'),
        applicationPage.setInputValue('eu-programs-income-row.description', 'EU-laatutuki 2015'),
        applicationPage.setInputValue('eu-programs-income-row.amount', '1000.10'),
        applicationPage.waitAutoSave
      )

      it('ilmoittaa että määrät on syötettävä täysinä euroina', function() {
        expect(applicationPage.submitButton().isEnabled()).to.equal(false)
        expect(applicationPage.detailedValidationErrors()).to.include('Palvelujen ostot: Syötä arvo kokonaisina euroina')
        expect(applicationPage.detailedValidationErrors()).to.include('Tarvike- ja materiaalikustannukset: Syötä arvo kokonaisina euroina')
        expect(applicationPage.detailedValidationErrors()).to.include('EU-ohjelmat: Syötä arvo kokonaisina euroina')
        expect(applicationPage.detailedValidationErrors()).to.have.length(3)
        expect(applicationPage.validationErrorsSummary()).to.equal('3 vastauksessa puutteita')
      })

      it('näyttää numeerisista luvuista lasketun kokonaissumman', function() {
        expect(applicationPage.elementTextBySelector('#budget-summary .total-financing-amount .money.sum')).to.equal('10')
      })

      it('näyttää virheen omarahoituksessa', function() {
        expect(applicationPage.elementTextBySelector('#budget-summary .self-financing-amount .error')).to.equal('Tarkista luvut')
        expect(applicationPage.elementTextBySelector('#budget-summary .self-financing-percentage .error')).to.equal('Tarkista luvut')
      })

      it('näyttää virheen OPH:n rahoituksessa', function() {
        expect(applicationPage.elementTextBySelector('#budget-summary .oph-financing-amount .error')).to.equal('Tarkista luvut')
        expect(applicationPage.elementTextBySelector('#budget-summary .oph-financing-percentage .error')).to.equal('Tarkista luvut')
      })
    })
  })
})()
