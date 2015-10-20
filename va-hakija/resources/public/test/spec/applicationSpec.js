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

  describe('Laatukehityksen hakulomake, kun haku on auki', function() {
    before(
      loginPage.setSystemTime("2015-09-30T16:14:59.999+03")
    )

    after(
      loginPage.resetSystemTime()
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
        it("ei valiteta vielä pakollisista kentästä", function() {
          expect(applicationPage.validationErrorsSummary()).to.equal("")
        })
        it('lomake ei ole lähetettävissä', function() {
          expect(applicationPage.submitButton().isEnabled()).to.equal(false)
        })
        it("budjettitaulukossa on nollasummat", function() {
          expect(applicationPage.getInput("coordination-costs-row.amount").value()).to.equal("0")
          expect(applicationPage.getInput("personnel-costs-row.amount").value()).to.equal("0")
          expect(applicationPage.getInput("service-purchase-costs-row.amount").value()).to.equal("0")
          expect(applicationPage.getInput("material-costs-row.amount").value()).to.equal("0")
          expect(applicationPage.getInput("rent-costs-row.amount").value()).to.equal("0")
          expect(applicationPage.getInput("equipment-costs-row.amount").value()).to.equal("0")
          expect(applicationPage.getInput("steamship-costs-row.amount").value()).to.equal("0")
          expect(applicationPage.getInput("other-costs-row.amount").value()).to.equal("0")
          expect(applicationPage.getInput("project-incomes-row.amount").value()).to.equal("0")
          expect(applicationPage.getInput("eu-programs-income-row.amount").value()).to.equal("0")
          expect(applicationPage.getInput("other-public-financing-income-row.amount").value()).to.equal("0")
          expect(applicationPage.getInput("private-financing-income-row.amount").value()).to.equal("0")
        })
      })

      describe('yhden pakollisen kentän täytön jälkeen', function() {
        before(
          applicationPage.setInputValue("project-name", "Semiautomaattitestihanke"),
          applicationPage.waitAutoSave
        )
        it("ei valiteta vielä muista pakollisista kentästä", function() {
          expect(applicationPage.validationErrorsSummary()).to.equal("")
        })
        it('lomake ei ole lähetettävissä', function() {
          expect(applicationPage.submitButton().isEnabled()).to.equal(false)
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
              it("valitetaan toisen rivin puuttuvista tiedoista", function() {
                expect(applicationPage.validationErrorsSummary()).to.equal("1 vastauksessa puutteita")
              })
              it('on kolmas rivi auki', function() {
                expect(applicationPage.getInput('other-organizations.other-organizations-3.name').isEnabled()).to.equal(true)
                expect(applicationPage.getInput('other-organizations.other-organizations-3.email').isEnabled()).to.equal(true)
              })
              it('on neljäs rivi kiinni', function() {
                expect(applicationPage.getInput('other-organizations.other-organizations-4.name').isEnabled()).to.equal(false)
                expect(applicationPage.getInput('other-organizations.other-organizations-4.email').isEnabled()).to.equal(false)
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

                describe('poiston jälkeen', function() {
                  it('ensimmäisen voi yhä poistaa', function() {
                    expect(removeButtonForOrg(1).isEnabled()).to.equal(true)
                  })

                  it('kolmatta ei voi poistaa', function() {
                    expect(removeButtonForOrg(3).isEnabled()).to.equal(false)
                  })

                  it('neljättä ei voi poistaa', function() {
                    expect(removeButtonForOrg(4).isEnabled()).to.equal(false)
                  })
                })

                describe('jos poistaa ensimmäisen organisaation', function() {
                  before(
                      removeButtonForOrg(1).click,
                      applicationPage.waitAutoSave,
                      wait.until(function(){return removeButtonForOrg(3).isVisible() === false})
                  )

                  describe('poiston jälkeen', function() {
                    it("valitetaan uuden ensimmäisen rivin puuttuvista tiedoista", function() {
                      expect(applicationPage.validationErrorsSummary()).to.equal("2 vastauksessa puutteita")
                    })

                    it('uutta ensimmäistä ei voi poistaa', function() {
                      expect(removeButtonForOrg(1).isEnabled()).to.equal(false)
                    })

                    it('kolmatta riviä ei enää ole', function() {
                      expect(removeButtonForOrg(3).isVisible()).to.equal(false)
                    })

                    it('neljättä ei voi poistaa', function() {
                      expect(removeButtonForOrg(4).isEnabled()).to.equal(false)
                    })
                  })

                  describe('täytettäessä uusi ensimmäinen rivi', function() {
                    before(
                      applicationPage.setInputValue("other-organizations.other-organizations-1.name", "Muu testiorganisaatio 3"),
                      applicationPage.setInputValue("other-organizations.other-organizations-1.email", "muutest3@example.com"),
                      applicationPage.waitAutoSave
                    )
                    it("virheet häviää", function() {
                      expect(applicationPage.validationErrorsSummary()).to.equal("")
                    })

                    it('on neljäs rivi auki', function() {
                      expect(applicationPage.getInput('other-organizations.other-organizations-4.name').isEnabled()).to.equal(true)
                      expect(applicationPage.getInput('other-organizations.other-organizations-4.email').isEnabled()).to.equal(true)
                    })
                    it('on viides rivi kiinni', function() {
                      expect(applicationPage.getInput('other-organizations.other-organizations-5.name').isEnabled()).to.equal(false)
                      expect(applicationPage.getInput('other-organizations.other-organizations-5.email').isEnabled()).to.equal(false)
                    })
                    it('lomake on lähetettävissä', function() {
                      expect(applicationPage.submitButton().isEnabled()).to.equal(true)
                    })
                  })
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
                expect(applicationPage.saveError()).to.equal('Ei tallennettu - tarkista syöttämäsi tiedot.')
              })
              it("kentän virhe näytetään", function() {
                expect(applicationPage.detailedValidationErrors()).to.deep.equal(['Hakijaorganisaatio: Pakollinen tieto'])
              })
              it("lähetys nappi ei ole enabloitu", function() {
                expect(applicationPage.submitButton().isEnabled()).to.equal(false)
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
              it("lähetys nappi enabloituu", function() {
                expect(applicationPage.submitButton().isEnabled()).to.equal(true)
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

        describe("hakuajan loppumisen jälkeen lomaketta muokattaessa", function() {
          before(
              loginPage.setSystemTime("2015-09-30T16:15:00.000+03"),
              applicationPage.setInputValue("project-name", "Uusin automaattitestihanke")
          )

          after(
              loginPage.setSystemTime("2015-09-30T16:14:59.999+03")
          )
          it.skip("yleinen virhe näytetään", function() {
            expect(applicationPage.saveError()).to.equal('Lähettäminen epäonnistui. Yritä myöhemmin uudelleen.')
          })
        })

        describe('riippuvassa kentässä', function() {
          var originalValue = ""
          before(
              loginPage.openLoginPage(),
              loginPage.login,
              enterValidValuesToPage,
              applicationPage.setInputValue("other-organizations.other-organizations-1.email", "invalid@email"),
              applicationPage.waitAutoSave,
              function() {
                originalValue = applicationPage.getInput("other-organizations.other-organizations-1.name").value()
              }
          )

          describe('alkutilassa', function() {
            it('riippuva kenttä näkyy', function() {
              expect(removeButtonForOrg(1).isVisible()).to.equal(true)
            })
            it('riippuvassa kentässä on arvo', function() {
              expect(originalValue.length > 0).to.equal(true)
            })
            it('herjataan virheellisestä riippuvan kentän arvosta', function() {
              expect(applicationPage.detailedValidationErrors()).to.deep.equal(['Yhteyshenkilön sähköposti: Tarkista sähköpostiosoite'])
            })
          })

          describe('vaihdettesssa yhteishanke vastaukseksi "Ei"', function() {
            before(
              applicationPage.setInputValue("combined-effort", "no"),
              applicationPage.waitAutoSave,
              wait.until(function(){return removeButtonForOrg(1).isVisible() === false})
            )

            describe('vaihdon jälkeen', function() {
              it('riippuva kenttä häviää näkyvistä', function() {
                expect(removeButtonForOrg(1).isVisible()).to.equal(false)
              })
              it('riippuvan kentän validaatiovirhe häviää', function() {
                expect(applicationPage.detailedValidationErrors()).to.deep.equal([])
              })
              it('lomake on lähetettävissä', function() {
                expect(applicationPage.submitButton().isEnabled()).to.equal(true)
              })
            })

            describe('ladattaessa sivu uudestaan', function() {
              before(
                  applicationPage.openEditPage(loginPage.getHakemusId)
              )
              describe('latauksen jälkeen', function() {
                it("on yhä piilotettu riiippuva kenttä piilotettu", function() {
                  expect(removeButtonForOrg(1).isVisible()).to.equal(false)
                })
                it('ei ole validaatiovirheitä', function() {
                  expect(applicationPage.detailedValidationErrors()).to.deep.equal([])
                })
              })
              describe('vaihdettesssa yhteishanke vastaukseksi takaisin "Kyllä"', function() {
                before(
                    applicationPage.setInputValue("combined-effort", "yes"),
                    applicationPage.waitAutoSave
                )
                it('riippuva kenttä näkyy', function() {
                  expect(removeButtonForOrg(1).isVisible()).to.equal(true)
                })
                it('riippuvassa kentässä on tallessa vanha arvo', function() {
                  expect(applicationPage.getInput("other-organizations.other-organizations-1.name").value()).to.equal(originalValue)
                })
                it('herjataan virheellisestä riippuvan kentän arvosta', function() {
                  expect(applicationPage.detailedValidationErrors()).to.deep.equal(['Yhteyshenkilön sähköposti: Tarkista sähköpostiosoite'])
                })
              })
            })
          })
        })

        describe('kun joku muu muokkaa hakemusta yhtä aikaa', function() {
          before(
              function(){
                $.ajax({
                  method: "POST",
                  async: false,
                  contentType: "application/json; charset=utf-8",
                  url: "/api/avustushaku/1/hakemus/" + loginPage.getHakemusId() + "/" + applicationPage.readHakemusVersionFromHtml(),
                  data: JSON.stringify({value: [{key: "other-organizations.other-organizations-1.name", value: "Oikea Organisaatio", fieldType: "textField"}]})
                })
              },
              applicationPage.setInputValue("other-organizations.other-organizations-1.name", "Oma Testi Organisaatio"),
              applicationPage.waitAutoSave
          )
          describe('muokattaessa jotain kenttää', function() {
            it("yleinen virhe näytetään", function() {
              expect(applicationPage.saveError()).to.equal('Hakemus on muuttunut. Lataa sivu uudestaan.')
            })
          })
          describe('sivun uudelleen latauksen jälkeen', function() {
            before(
                applicationPage.openEditPage(loginPage.getHakemusId)
            )
            it("näkyy toisen muokkaus", function() {
              expect(applicationPage.getInput("other-organizations.other-organizations-1.name").value()).to.equal('Oikea Organisaatio')
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
          loginPage.openLoginPage('sv'),
          loginPage.login
      )

      describe('sähköpostitarkistuksen jälkeen lomakkeella', function() {
        it("näkyy haun nimi ruotsiksi", function() {
          expect(applicationPage.applicationName()).to.deep.equal('Stöd för genomförande av kvalitetsstrategin')
        })
      })
    })
  })
})()
