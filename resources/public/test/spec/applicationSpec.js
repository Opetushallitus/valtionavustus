(function () {
  var page = ApplicationPage()

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

  describe('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen haku suomeksi', function () {
    before(
      page.openStartPage()
    )

    describe('alkutilassa', function () {
      it("näkyy haun nimi", function () {
        expect(page.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
      })
      it("kielen vaihto osoittaa ruotsiin", function () {
        expect(page.toggleLanguageButton().text()).to.deep.equal('På svenska')
      })
      it("tallennus info on tyhjä", function () {
        expect(page.saveInfo()).to.equal("")
      })
      it("lähetys on disabloitu", function () {
        expect(page.submitButton().isEnabled()).to.equal(false)
      })
      it("ei valiteta vielä pakollisista kentästä", function () {
        expect(page.validationErrorsSummary()).to.equal("")
      })
    })

    describe('täytettäessä lomaketta', function() {
      before(
        enterValidValuesToPage,
        page.waitAutoSave
      )

      function removeButtonForOrg(nr) {
        return page.createClickable('#other-organizations-' + nr + ' .soresu-remove')
      }

      describe('toistuvassa kentässä', function() {
        it('toista riviä ei voi poistaa', function() {
          expect(removeButtonForOrg(2).isEnabled()).to.equal(false)
        })

        it('on uusi rivi auki', function() {
          expect(page.getInput('other-organizations.other-organizations-2.name').isEnabled()).to.equal(true)
          expect(page.getInput('other-organizations.other-organizations-2.email').isEnabled()).to.equal(true)
        })

        it('on kolmas rivi kiinni', function() {
          expect(page.getInput('other-organizations.other-organizations-3.name').isEnabled()).to.equal(false)
          expect(page.getInput('other-organizations.other-organizations-3.email').isEnabled()).to.equal(false)
        })

        describe('jos lisää keskeneräisen rivin', function() {
          before(
            page.setInputValue("other-organizations.other-organizations-2.name", "Muu testiorganisaatio 2"),
            page.waitAutoSave
          )

          describe('lisäämisen jälkeen', function() {
            it("valitetaan puuttuvista tiedoista", function () {
              expect(page.validationErrorsSummary()).to.equal("1 vastauksessa puutteita")
            })
            it('on kolmas rivi yhä kiinni', function() {
              expect(page.getInput('other-organizations.other-organizations-3.name').isEnabled()).to.equal(false)
              expect(page.getInput('other-organizations.other-organizations-3.email').isEnabled()).to.equal(false)
            })
          })

          describe('jos täydentää rivin lopuun', function() {
            before(
              page.setInputValue("other-organizations.other-organizations-2.email", "muutest2@example.com"),
              page.waitAutoSave
            )

            describe('täydentämisen jälkeen', function() {
              it('sen alle tulee uusi rivi', function() {
                expect(page.getInput('other-organizations.other-organizations-3.name').isEnabled()).to.equal(true)
                expect(page.getInput('other-organizations.other-organizations-3.email').isEnabled()).to.equal(true)
              })

              it('toisen rivin voi poistaa', function() {
                expect(removeButtonForOrg(2).isEnabled()).to.equal(true)
              })
            })

            describe('jos poistaa toisen organisaation', function() {
              before(
                removeButtonForOrg(2).click,
                page.waitAutoSave
              )

              it('kolmatta ei voi poistaa', function() {
                expect(removeButtonForOrg(3).isEnabled()).to.equal(false)
              })
            })
          })
        })
      })
    })

    describe('Vaihdettaessa kieli ruotsiksi', function () {
      before(
        page.toggleLanguage
      )
      it("näkyy haun nimi ruotsiksi", function() {
        expect(page.applicationName()).to.deep.equal('Stöd för genomförande av kvalitetsstrategin')
      })
    })
  })

  describe('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen haku ruotsiksi', function () {
    before(
      page.openStartPage('sv')
    )

    it("näkyy haun nimi ruotsiksi", function() {
      expect(page.applicationName()).to.deep.equal('Stöd för genomförande av kvalitetsstrategin')
    })
  })
})()
