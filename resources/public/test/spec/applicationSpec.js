(function() {
  var applicationPage = ApplicationPage()
  var loginPage = LoginPage()

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

  describe('Laatukehityksen hakulomake', function() {
    before(
    )

    describe('sähköpostitarkistuksen jälkeen lomakkeella', function() {
      before(
        loginPage.openLoginPage(),
        loginPage.login
      )

      describe('alkutilassa', function() {
        it("näkyy haun nimi", function() {
          expect(applicationPage.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
        })
        it("kielen vaihto osoittaa ruotsiin", function() {
          expect(applicationPage.toggleLanguageButton().text()).to.deep.equal('På svenska')
        })
        it("tallennus info on tyhjä", function() {
          expect(applicationPage.saveInfo()).to.equal("")
        })
        it.skip("ei valiteta vielä pakollisista kentästä", function() {
          expect(applicationPage.validationErrorsSummary()).to.equal("")
        })
      })

      describe('täytettäessä lomaketta kaikilla tiedoilla', function() {
        before(
          enterValidValuesToPage,
          applicationPage.waitAutoSave
        )

        function removeButtonForOrg(nr) {
          return applicationPage.createClickable(function() { return S('#other-organizations-' + nr + ' .soresu-remove') })
        }

        describe('automaattitallennuksen jälkeen', function() {
          it('ei virheitä tallennuksesta', function() {
            expect(applicationPage.saveError()).to.equal('')
          })
        })

        describe('toistuvassa kentässä', function() {
          it('toista riviä ei voi poistaa', function() {
            expect(removeButtonForOrg(2).isEnabled()).to.equal(false)
          })

          it('on uusi rivi auki', function() {
            expect(applicationPage.getInput('other-organizations.other-organizations-2.name').isEnabled()).to.equal(true)
            expect(applicationPage.getInput('other-organizations.other-organizations-2.email').isEnabled()).to.equal(true)
          })

          it('on kolmas rivi kiinni', function() {
            expect(applicationPage.getInput('other-organizations.other-organizations-3.name').isEnabled()).to.equal(false)
            expect(applicationPage.getInput('other-organizations.other-organizations-3.email').isEnabled()).to.equal(false)
          })

          describe('jos lisää keskeneräisen rivin', function() {
            before(
              applicationPage.setInputValue("other-organizations.other-organizations-2.name", "Muu testiorganisaatio 2"),
              applicationPage.waitAutoSave
            )

            describe('lisäämisen jälkeen', function() {
              it("valitetaan puuttuvista tiedoista", function() {
                expect(applicationPage.validationErrorsSummary()).to.equal("1 vastauksessa puutteita")
              })
              it('on kolmas rivi yhä kiinni', function() {
                expect(applicationPage.getInput('other-organizations.other-organizations-3.name').isEnabled()).to.equal(false)
                expect(applicationPage.getInput('other-organizations.other-organizations-3.email').isEnabled()).to.equal(false)
              })
            })

            describe('jos täydentää rivin lopuun', function() {
              before(
                applicationPage.setInputValue("other-organizations.other-organizations-2.email", "muutest2@example.com"),
                applicationPage.waitAutoSave
              )

              describe('täydentämisen jälkeen', function() {
                it('sen alle tulee uusi rivi', function() {
                  expect(applicationPage.getInput('other-organizations.other-organizations-3.name').isEnabled()).to.equal(true)
                  expect(applicationPage.getInput('other-organizations.other-organizations-3.email').isEnabled()).to.equal(true)
                })

                it('toisen rivin voi poistaa', function() {
                  expect(removeButtonForOrg(2).isEnabled()).to.equal(true)
                })
              })

              describe('jos poistaa toisen organisaation', function() {
                before(
                  removeButtonForOrg(2).click,
                  applicationPage.waitAutoSave
                )

                it('kolmatta ei voi poistaa', function() {
                  expect(removeButtonForOrg(3).isEnabled()).to.equal(false)
                })
              })
            })
          })
        })

        describe('server virhetilanteissa lomaketta käsiteltäväksi lähetettäessä', function() {
          before(
              mockAjax.init
          )
          describe("serveripään validointivirheissä", function() {
            before(
                function() { mockAjax.respondOnce("POST", "/api/avustushaku/1/hakemus/", 400, {organization:[{error:"required"}]}) },
                applicationPage.submitAndWaitErrorChange
            )
            describe("epäonnistumisen jälkeen", function() {
              it("yleinen virhe näytetään", function() {
                expect(applicationPage.saveError()).to.equal('Ei tallennettu - tarkista syöttämäsi tiedot.1 vastauksessa puutteita')
              })
              it("kentän virhe näytetään", function() {
                expect(applicationPage.detailedValidationErrors()).to.deep.equal(['Hakijaorganisaatio: Pakollinen tieto'])
              })
              it("lähetys nappi on yhä enabloitu", function() {
                expect(applicationPage.submitButton().isEnabled()).to.equal(true)
              })
            })
            describe("muokatessa kenttää", function() {
              before(
                  applicationPage.setInputValue("organization", "Testi Organisaatio korjattu"),
                  applicationPage.waitAutoSave
              )
              it("virheet häviää", function() {
                expect(applicationPage.saveError()).to.equal('')
              })
            })
          })

          describe("lähetettäessä, kun serveriltä tulee odottamaton virhe", function() {
            before(
                function() { mockAjax.respondOnce("POST", "/api/avustushaku/1/hakemus/", 500, "ERROR!") },
                applicationPage.submitAndWaitErrorChange
            )
            describe("epäonnistumisen jälkeen", function() {
              it("yleinen virhe näytetään", function() {
                expect(applicationPage.saveError()).to.equal('Lähettäminen epäonnistui. Yritä myöhemmin uudelleen.')
              })
              it("lähetys nappi on yhä enabloitu", function() {
                expect(applicationPage.submitButton().isEnabled()).to.equal(true)
              })
            })
            describe("uudelleen lähetettäessä", function() {
              before(
                  applicationPage.submitAndWaitErrorChange
              )
              it("virhe häviää", function() {
                expect(applicationPage.saveError()).to.equal('')
              })
            })
          })
        })
      })

      describe('vaihdettaessa kieli ruotsiksi', function() {
        before(
          applicationPage.toggleLanguage
        )
        it("näkyy haun nimi ruotsiksi", function() {
          expect(applicationPage.applicationName()).to.deep.equal('Stöd för genomförande av kvalitetsstrategin')
        })
      })
    })
  })

  describe('Tultaessa laatukehityksen lomakeelle ilman sähköpostitarkastusta', function() {
    before(
      applicationPage.openEditPage(function(){return ""})
    )
    it("näkyy haun nimi", function() {
      expect(applicationPage.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
    })
    it("lähetys on disabloitu", function() {
      expect(applicationPage.submitButton().isEnabled()).to.equal(false)
    })
    it("syöttökentät on disabloitu", function() {
      expect(applicationPage.getInput('organization').isEnabled()).to.equal(false)
    })
  })

  describe('Laatukehityksen haku ruotsiksi', function() {
    before(
      loginPage.openLoginPage('sv')
    )

    describe('sisäänkirjautumissivulla', function() {
      it("näkyy haun nimi ruotsiksi", function() {
        expect(loginPage.applicationName()).to.deep.equal('Stöd för genomförande av kvalitetsstrategin')
      })
    })

    describe('sähköpostitarkistuksen jälkeen lomakkeella', function() {
      before(
        loginPage.login
      )

      it("näkyy haun nimi ruotsiksi", function() {
        expect(applicationPage.applicationName()).to.deep.equal('Stöd för genomförande av kvalitetsstrategin')
      })
    })
  })
})()
