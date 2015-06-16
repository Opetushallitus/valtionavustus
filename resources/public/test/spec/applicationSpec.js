(function () {
  var page = ApplicationPage()

  afterEach(function() {
    if (this.currentTest.state == 'failed') {
      takeScreenshot()
    }
    expect(window.uiError || null).to.be.null
  })

  var hakemusId

  function getHakemusId() {
    return hakemusId
  }

  function storeHakemusIdFromHtml() {
    hakemusId = readHakemusIdFromHtml()
  }

  function readHakemusIdFromHtml() {
    return page.hakemusId()
  }

  function hakemusIdIsPresent() {
    return readHakemusIdFromHtml().length > 0
  }

  function enterValidValues() {
    page.setInputValue("organization", "Testi Organisaatio")()
    page.setInputValue("primary-email", "yhteyshenkilo@example.com")()
    page.setInputValue("signature", "Matti Allekirjoitusoikeudellinen")()
    page.setInputValue("signature-email", "matti.allekirjoitusoikeudellinen@example.com")()
    page.setInputValue("other-organization-1", "Muu Testi Organisaatio")()
    page.setInputValue("other-organization-1-email", "muutestiorganisaatio@example.com")()
    page.setInputValue("project-goals", "Hankkeen tavoitteet tulee tähän.")()
    page.setInputValue("project-explanation", "Hankkeen kuvaus tulee tähän.")()
    page.setInputValue("project-target", "Kohderymämme on meidän kohderyhmä")()
    page.setInputValue("project-effectiveness", "Mittaamme vaikutusta.")()
    page.setInputValue("project-spreading-plan", "Jakelusuunnitelma.")()
    page.setInputValue("project-measure", "Mittaamme toteutumista ja vaikutusta.")()
    page.setInputValue("project-announce", "Tiedoitamme hankkeesta kivasti sitten.")()
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
    })

    describe('täytettäessä lomaketta', function () {
      before(enterValidValues)

      describe('jos ei ole annettu kaikkia pakollisia arvoja', function () {
        before(page.setInputValue("organization", ""))

        describe('ennen tallentamista', function () {
          it("lähetys on disabloitu", function () {
            expect(page.submitButton().isEnabled()).to.equal(false)
          })
          it("pakollisesta kentästä kerrotaan", function () {
            expect(page.error("organization")).to.equal('Pakollinen tieto')
          })
          it("kerrotaan automaattitallennuksesta", function () {
            expect(page.saveInfo()).to.equal("Tallennetaan...")
          })
        })

        describe('tallentamisen jälkeen', function () {
          var hakemusId
          function getHakemusId() {
            return hakemusId
          }
          before(
              page.waitAutoSave,
              wait.until(function() {return page.hakemusId().length > 0}),
              function() {hakemusId = page.hakemusId()}
          )

          describe('alkuperäisessä näkymässä', function() {
            it("ei tule virhettä", function () {
              expect(page.saveError()).to.equal('')
            })
          })

          describe('hakemuksen esikatselussa', function() {
            before(
                page.openPreview(getHakemusId)
            )
            it("näkyy haun nimen oikein", function () {
              expect(page.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
            })
            it("on organisaatio yhä tyhjä", function () {
              expect(page.elementText("organization")).to.equal('')
            })
            it("näkyy hankkeen kuvaus oikein", function () {
              expect(page.elementText("project-explanation")).to.equal('Hankkeen kuvaus tulee tähän.')
            })
          })

          describe('hakemuksen muokkausnäkymässä', function() {
            before(
                page.openEditPage(getHakemusId)
            )
            describe('avattaessa', function () {
              it("näkyy haun nimi oikein", function () {
                expect(page.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
              })
              it("näkyy validointi virheet", function () {
                expect(page.error("organization")).to.equal('Pakollinen tieto')
              })
              it("näkyy hankkeen kuvaus oikein", function () {
                expect(page.getInput("project-explanation").value()).to.equal('Hankkeen kuvaus tulee tähän.')
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
                  expect(page.saveError()).to.equal('')
                })
              })
            })

            describe('muokatessa vastauksia', function() {
              before(
                  page.setInputValue("project-explanation", "Uusi kuvaus"),
                  page.waitAutoSave
              )

              describe('tallentamisen jälkeen', function () {
                it("ei tule virhettä", function () {
                  expect(page.saveError()).to.equal('')
                })
              })

              describe('muokkauksen jälkeen esikatselussa', function() {
                before(
                    page.openPreview(getHakemusId)
                )
                it("näkyy uusi tieto oikein", function () {
                  expect(page.elementText("project-explanation")).to.equal('Uusi kuvaus')
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
        page.setInputValue("primary-email", "NOT VALID EMAIL")
      )

      describe('ennen tallentamista', function () {
        it("lähetys on disabloitu", function () {
          expect(page.submitButton().isEnabled()).to.equal(false)
        })
        it("Virheellisestä kentästä kerrotaan", function () {
          expect(page.error("primary-email")).to.equal('Tarkista sähköpostiosoite')
        })
      })

      describe('tallentamisen jälkeen', function () {
        before(
            page.waitAutoSave,
            wait.until(hakemusIdIsPresent),
            storeHakemusIdFromHtml
        )

        describe('alkuperäisessä näkymässä', function() {
          it("ei tule virhettä", function () {
            expect(page.saveError()).to.equal('')
          })
        })

        describe('hakemuksen muokkausnäkymässä', function() {
          before(
              page.openEditPage(getHakemusId)
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
