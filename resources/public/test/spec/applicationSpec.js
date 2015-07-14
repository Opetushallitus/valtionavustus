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

  function enterValidValues() {
    page.setInputValue("organization", "Testi Organisaatio")()
    page.setInputValue("primary-email", "yhteyshenkilo@example.com")()
    page.setInputValue("signature", "Matti Allekirjoitusoikeudellinen")()
    page.setInputValue("signature-email", "matti.allekirjoitusoikeudellinen@example.com")()
    page.setInputValue("other-organizations.other-organizations-1.name", "Muu Testi Organisaatio")()
    page.setInputValue("other-organizations.other-organizations-1.email", "muutestiorganisaatio@example.com")()
    page.setInputValue("project-goals", "Hankkeen tavoitteet tulee tähän.")()
    page.setInputValue("project-description.project-description-1.goal", "Hankkeen ensimmäinen tavoite.")()
    page.setInputValue("project-description.project-description-1.activity", "Hankkeen ensimmäinen toiminta.")()
    page.setInputValue("project-description.project-description-1.result", "Hankkeen ensimmäinen tulos.")()
    page.setInputValue("project-target", "Kohderymämme on meidän kohderyhmä")()
    page.setInputValue("project-effectiveness", "Mittaamme vaikutusta.")()
    page.setInputValue("project-spreading-plan", "Jakelusuunnitelma.")()
    page.setInputValue("project-measure", "Mittaamme toteutumista ja vaikutusta.")()
    page.setInputValue("project-announce", "Tiedoitamme hankkeesta kivasti sitten.")()
    page.setInputValue("continuation-project", "no")()
    page.setInputValue("bank-iban", "FI 32 5000 4699350600")()
    page.setInputValue("bank-bic", "5000")()
    page.setInputValue("coordination-costs-row.amount", "10")()
    page.setInputValue("personnel-costs-row.amount", "10")()
    page.setInputValue("service-purchase-costs-row.amount", "10")()
    page.setInputValue("material-costs-row.amount", "10")()
    page.setInputValue("rent-costs-row.amount", "10")()
    page.setInputValue("equipment-costs-row.amount", "10")()
    page.setInputValue("steamship-costs-row.amount", "10")()
    page.setInputValue("other-costs-row.amount", "10")()
    page.setInputValue("project-incomes-row.amount", "10")()
    page.setInputValue("eu-programs-income-row.amount", "10")()
    page.setInputValue("other-public-financing-income-row.amount", "10")()
    page.setInputValue("private-financing-income-row.amount", "10")()
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
      it("kerrotaan pakollisista kentästä", function () {
        const validationErrorsSummaryMessage = page.validationErrors()
        const errorCount = parseInt(validationErrorsSummaryMessage.split(' ')[0])
        expect(errorCount).to.be.at.least(10)
        expect(validationErrorsSummaryMessage).to.equal(errorCount + ' vastauksessa puutteita')
      })
    })

    describe('täytettäessä lomaketta', function () {
      before(enterValidValues)

      describe('jos ei ole annettu kaikkia pakollisia arvoja', function () {
        before(
          page.setInputValue("organization", ""),
          page.waitAutoSave
        )

        describe('automaattitallentamisen jälkeen', function () {
          before(
              wait.until(page.hakemusIdIsPresent),
              page.storeHakemusIdFromHtml
          )

          describe('alkuperäisessä muokkausnäkymässä', function() {
            it("lähetys on disabloitu", function () {
              expect(page.submitButton().isEnabled()).to.equal(false)
            })
            it("pakollisesta kentästä kerrotaan", function () {
              expect(page.classAttributeOf("organization")).to.include('error')
            })
            it("kerrotaan automaattitallennuksesta", function () {
              expect(page.saveInfo()).to.equal("Kaikki muutokset tallennettu")
            })
            it("kerrotaan puuttuvasta kentästä", function () {
              expect(page.getInput("organization").value()).to.equal('')
              expect(page.validationErrors()).to.equal('1 vastauksessa puutteita')
            })
          })

          describe('hakemuksen esikatselussa', function() {
            before(
              page.openPreview(page.getHakemusId)
            )
            it("näkyy haun nimen oikein", function () {
              expect(page.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
            })
            it("on organisaatio yhä tyhjä", function () {
              expect(page.elementText("organization")).to.equal('')
            })
            it("näkyy, että ei liity aiempaan hankkeeseen", function () {
              expect(page.elementText("continuation-project")).to.equal('Ei')
            })
            it("näkyy hankkeen kohderyhmä oikein", function () {
              expect(page.elementText("project-target")).to.equal('Kohderymämme on meidän kohderyhmä')
            })
          })

          describe('uudessa hakemuksen muokkausnäkymässä', function() {
            before(
              page.openEditPage(page.getHakemusId)
            )
            describe('avattaessa', function () {
              it("näkyy haun nimi oikein", function () {
                expect(page.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
              })
              it("näkyy validointi virheet", function () {
                expect(page.classAttributeOf("organization")).to.include('error')
              })
              it("kerrotaan puuttuvasta kentästä", function () {
                expect(page.validationErrors()).to.equal('1 vastauksessa puutteita')
              })
              it("näkyy hankkeen kuvaus oikein", function () {
                expect(page.getInput("project-description.project-description-1.goal").value()).to.equal('Hankkeen ensimmäinen tavoite.')
                expect(page.getInput("project-description.project-description-1.activity").value()).to.equal('Hankkeen ensimmäinen toiminta.')
                expect(page.getInput("project-description.project-description-1.result").value()).to.equal('Hankkeen ensimmäinen tulos.')
              })
              it("lähetys on disabloitu", function () {
                expect(page.submitButton().isEnabled()).to.equal(false)
              })
            })

            describe('syötettäessä pakolliset tiedot', function () {
              before(
                page.setInputValue("organization", "Testi Organisaatio"),
                page.waitAutoSave
              )

              describe('automaattitallennuksen jälkeen', function () {
                it("lähetä nappi enabloituu", function () {
                  expect(page.submitButton().isEnabled()).to.equal(true)
                })
              })
              describe('painettaessa lähetä nappia', function () {
                before(
                  page.submitButton().click
                )

                it('ei tule virhettä', function () {
                  expect(page.validationErrors()).to.equal('')
                })
              })
            })

            describe('muokatessa vastauksia', function() {
              before(
                page.setInputValue("project-target", "Uusi kohderymämme on meidän uusi kohderyhmä"),
                page.setInputValue("project-description.project-description-1.goal", "Uusi ensimmäinen tavoite."),
                page.setInputValue("project-description.project-description-1.activity", "Uusi ensimmäinen toiminta."),
                page.setInputValue("project-description.project-description-1.result", "Uusi ensimmäinen tulos."),
                page.waitAutoSave
              )

              describe('tallentamisen jälkeen', function () {
                it("ei tule virhettä", function () {
                  expect(page.validationErrors()).to.equal('')
                  expect(page.getInput("project-description.project-description-1.goal").value()).to.equal('Uusi ensimmäinen tavoite.')
                  expect(page.getInput("project-description.project-description-1.activity").value()).to.equal('Uusi ensimmäinen toiminta.')
                  expect(page.getInput("project-description.project-description-1.result").value()).to.equal('Uusi ensimmäinen tulos.')
                })
              })

              describe('muokkauksen jälkeen esikatselussa', function() {
                before(
                  page.openPreview(page.getHakemusId)
                )
                it("näkyy uusi tieto oikein", function () {
                  expect(page.elementText("project-target")).to.equal('Uusi kohderymämme on meidän uusi kohderyhmä')
                })
              })
            })
          })
        })
      })
    })

    describe('jos on annettu väärän muotoinen sähköpostiosoite', function () {
      before(
        page.openStartPage(),
        enterValidValues,
        page.waitAutoSave,
        page.setInputValue("primary-email", "NOT VALID EMAIL")
      )

      describe('ennen tallentamista', function () {
        it("lähetys on disabloitu", function () {
          expect(page.submitButton().isEnabled()).to.equal(false)
        })
        it("Virheellisestä kentästä kerrotaan", function () {
          expect(page.classAttributeOf("primary-email")).to.include('error')
        })
      })

      describe('tallentamisen jälkeen', function () {
        before(
          page.waitAutoSave,
          wait.until(page.hakemusIdIsPresent),
          page.storeHakemusIdFromHtml
        )

        describe('alkuperäisessä näkymässä', function() {
          it("kerrotaan virheellisestä kentästä", function () {
            expect(page.validationErrors()).to.equal('1 vastauksessa puutteita')
          })
        })

        describe('hakemuksen muokkausnäkymässä', function() {
          before(
            page.openEditPage(page.getHakemusId)
          )
          it("lähetys on disabloitu", function () {
            expect(page.submitButton().isEnabled()).to.equal(false)
          })

          describe('syötettäessä oikean muotoinen sähköpostisoite', function () {
            before(
              page.setInputValue("primary-email", "yhteyshenkilo@example.com"),
              page.waitAutoSave
            )

            describe('syötön jälkeen', function () {
              it("lähetä-nappi enabloituu", function () {
                expect(page.submitButton().isEnabled()).to.equal(true)
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
