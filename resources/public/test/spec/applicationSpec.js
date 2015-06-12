(function () {
  var page = ApplicationPage()

  afterEach(function() {
    if (this.currentTest.state == 'failed') {
      takeScreenshot()
    }
    expect(window.uiError || null).to.be.null
  })

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
      it("tallennus on disabloitu", function () {
        expect(page.submitButton().isEnabled()).to.equal(false)
      })
    })

    describe('täytettäessä lomaketta', function () {
      before(
          page.setInputValue("organization", ""),
          page.setInputValue("primary-email", "yhteyshenkilo@example.com"),
          page.setInputValue("signature", "Matti Allekirjoitusoikeudellinen"),
          page.setInputValue("signature-email", "matti.allekirjoitusoikeudellinen@example.com"),
          page.setInputValue("other-organization-1", "Muu Testi Organisaatio"),
          page.setInputValue("other-organization-1-email", "muutestiorganisaatio@example.com"),
          page.setInputValue("project-network", "Hankeverkon tarina tähän."),
          page.setInputValue("project-goals", "Hankkeen tavoitteet tulee tähän."),
          page.setInputValue("project-explanation", "Hankkeen kuvaus tulee tähän."),
          page.setInputValue("project-target", "Kohderymämme on meidän kohderyhmä"),
          page.setInputValue("project-measure", "Mittaamme toteutumista ja vaikutusta."),
          page.setInputValue("project-announce", "Tiedoitamme hankkeesta kivasti sitten.")
      )

      describe('jos ei ole annettu kaikkia pakollisia arvoja', function () {
        it("tallennus on disabloitu", function () {
          expect(page.submitButton().isEnabled()).to.equal(false)
        })
        it("pakollisesta kentästä kerrotaan", function () {
          expect(page.error("organization")).to.equal('Pakollinen tieto')
        })
      })

      describe('syötettäessä pakolliset tiedot', function () {
        before(
          page.setInputValue("organization", "Testi Organisaatio"),
          wait.until(page.submitButton().isEnabled)
        )

        describe('syötön jälkeen', function () {
          it("tallennus nappi enabloituu", function () {
          })
        })

        describe('painettaessa tallennus nappia', function () {
          before(
              page.submitButton().click,
              wait.until(function() {return page.hakemusId().length > 0})
          )

          describe('tallentamisen jälkeen', function () {
            it("ei tule virhettä", function () {
              expect(page.saveError()).to.equal('')
            })
          })

          describe('tallennuksen jälkeen', function () {
            var hakemusId
            function getHakemusId() {
              return hakemusId
            }
            before(
                function() {hakemusId = page.hakemusId()}
            )

            describe('hakemuksen esikatselussa', function() {
              before(
                page.openPreview(getHakemusId)
              )
              it("näkyy haun nimen oikein", function () {
                expect(page.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
              })
              it("näkyy syötetyn organisaation nimen oikein", function () {
                expect(page.elementText("organization")).to.equal('Testi Organisaatio')
              })
            })

            describe('hakemuksen muokkausnäkymässä', function() {
              before(
                page.openEditPage(getHakemusId)
              )
              it("näkyy haun nimen oikein", function () {
                expect(page.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
              })
              it("näkyy syötetyn organisaation nimen oikein", function () {
                expect(page.getInput("organization").value()).to.equal('Testi Organisaatio')
              })

              describe('muokatessa vastauksia', function() {
                before(
                  page.setInputValue("organization", "Testi Organisaatio uusi"),
                  wait.until(page.submitButton().isEnabled),
                  page.submitButton().click
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
                  it("näkyy uusi organisaation nimi oikein", function () {
                    expect(page.elementText("organization")).to.equal('Testi Organisaatio uusi')
                  })
                })
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
