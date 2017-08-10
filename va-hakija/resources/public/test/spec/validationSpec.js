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

  describe('Laatukehityksen haun validointi', function() {
    before(
      loginPage.setSystemTime("2015-09-30T16:14:59.999+03"),
      loginPage.openLoginPage(),
      loginPage.login
    )

    after(
      loginPage.resetSystemTime()
    )

    describe('Jos lomakkeelle ei ole annettu kaikkia pakollisia arvoja', function() {
      before(
        enterValidValuesToPage,
        applicationPage.setInputValue("organization", ""),
        applicationPage.waitAutoSave
      )

      describe('automaattitallentamisen jälkeen', function() {
        describe('alkuperäisessä muokkausnäkymässä', function() {
          it("lähetys on disabloitu", function() {
            expect(applicationPage.submitButton().isEnabled()).to.equal(false)
          })
          it("pakollisesta kentästä kerrotaan", function() {
            expect(applicationPage.classAttributeOf("organization")).to.include('error')
          })
          it("kerrotaan lomakkeen tallennuksesta", function() {
            expect(applicationPage.formSaveMessage().text()).to.match(/tallennettu/i)
          })
          it("kerrotaan puuttuvasta kentästä", function() {
            expect(applicationPage.getInput("organization").value()).to.equal('')
            expect(applicationPage.validationErrorsSummary()).to.equal('1 vastauksessa puutteita')
          })
        })

        describe('hakemuksen esikatselussa', function() {
          before(
            applicationPage.openPreview(loginPage.getHakemusId)
          )
          it("näkyy haun nimen oikein", function() {
            expect(applicationPage.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
          })
          it("kerrotaan lomakkeen tallennuksesta", function() {
            expect(applicationPage.formSaveMessage().text()).to.match(/tallennettu/i)
          })
          it("on organisaatio yhä tyhjä", function() {
            expect(applicationPage.elementText("organization")).to.equal('')
          })
          it("näkyy, että ei liity aiempaan hankkeeseen", function() {
            expect(applicationPage.elementText("continuation-project")).to.equal('Ei')
          })
          it("näkyy hankkeen kohderyhmä oikein", function() {
            expect(applicationPage.elementText("project-target")).to.equal('Kohderymämme on meidän kohderyhmä')
          })
        })

        describe('uudessa hakemuksen muokkausnäkymässä', function() {
          before(
            applicationPage.openEditPage(loginPage.getHakemusId)
          )
          describe('avattaessa', function() {
            it("näkyy haun nimi oikein", function() {
              expect(applicationPage.applicationName()).to.deep.equal('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen')
            })
            it("näkyy validointivirheet", function() {
              expect(applicationPage.classAttributeOf("organization")).to.include('error')
            })
            it("kerrotaan puuttuvasta kentästä", function() {
              expect(applicationPage.validationErrorsSummary()).to.equal('1 vastauksessa puutteita')
            })
            it("näkyy hankkeen kuvaus oikein", function() {
              expect(applicationPage.getInput("project-description.project-description-1.goal").value()).to.equal('Hankkeen ensimmäinen tavoite.')
              expect(applicationPage.getInput("project-description.project-description-1.activity").value()).to.equal('Hankkeen ensimmäinen toiminta.')
              expect(applicationPage.getInput("project-description.project-description-1.result").value()).to.equal('Hankkeen ensimmäinen tulos.')
            })
            it("näkyy ilmoitus että lomaketta ei ole lähetetty", function() {
              expect(applicationPage.formNotSentMessage().text()).to.equal("Hakemusta ei ole lähetetty")
            })
            it("lähetys on disabloitu", function() {
              expect(applicationPage.submitButton().isEnabled()).to.equal(false)
            })
          })

          describe('syötettäessä pakolliset tiedot', function() {
            before(
              applicationPage.setInputValue("organization", "Testi Organisaatio"),
              applicationPage.waitAutoSave
            )

            describe('automaattitallennuksen jälkeen', function() {
              it("lähetä nappi enabloituu", function() {
                expect(applicationPage.submitButton().isEnabled()).to.equal(true)
              })
            })

            describe('lähetettäessä käsiteltäväksi', function() {
              before(
                applicationPage.submitAndWaitOk
              )
              it('ei tule virhettä', function() {
                expect(applicationPage.validationErrorsSummary()).to.equal('')
              })
              it("lähetä nappi disabloituu", function() {
                expect(applicationPage.submitButton().isEnabled()).to.equal(false)
              })
              it("ei näy ilmoitusta että lomaketta ei ole lähetetty", function() {
                expect(applicationPage.formNotSentMessage().length).to.equal(0)
              })
              it("kerrotaan, että hakemus on lähetetty", function() {
                expect(applicationPage.submitButton().text()).to.equal("Hakemus lähetetty")
              })
            })
          })

          describe('muokatessa vastauksia', function() {
            before(
              applicationPage.setInputValue("project-target", "Uusi kohderymämme on meidän uusi kohderyhmä"),
              applicationPage.setInputValue("project-description.project-description-1.goal", "Uusi ensimmäinen tavoite."),
              applicationPage.setInputValue("project-description.project-description-1.activity", "Uusi ensimmäinen toiminta."),
              applicationPage.setInputValue("project-description.project-description-1.result", "Uusi ensimmäinen tulos."),
              applicationPage.waitAutoSave
            )

            describe('tallentamisen jälkeen', function() {
              it("ei tule virhettä", function() {
                expect(applicationPage.validationErrorsSummary()).to.equal('')
                expect(applicationPage.getInput("project-description.project-description-1.goal").value()).to.equal('Uusi ensimmäinen tavoite.')
                expect(applicationPage.getInput("project-description.project-description-1.activity").value()).to.equal('Uusi ensimmäinen toiminta.')
                expect(applicationPage.getInput("project-description.project-description-1.result").value()).to.equal('Uusi ensimmäinen tulos.')
              })
            })

            describe('muokkauksen jälkeen esikatselussa', function() {
              before(
                applicationPage.openPreview(loginPage.getHakemusId)
              )
              it("näkyy uusi tieto oikein", function() {
                expect(applicationPage.elementText("project-target")).to.equal('Uusi kohderymämme on meidän uusi kohderyhmä')
              })
            })
          })
        })
      })
    })

    describe('Jos annettu pelkästään yhteyshenkilön sähköposti', function() {
      before(
        loginPage.openLoginPage(),
        loginPage.login
      )

      describe('automaatti tallennuksen jälkeen', function() {
        describe('alkuperäisessä näkymässä', function() {
          it("ei herjata pakollisista tiedoista", function() {
            expect(applicationPage.validationErrorsSummary()).to.equal('')
          })
        })

        describe('toisessa hakemuksen muokkausnäkymässä ilman muutoksia', function() {
          before(
              applicationPage.openEditPage(loginPage.getHakemusId)
          )
          describe('avaamisen jälkeen', function() {
            it("ei herjata pakollisista tiedoista", function() {
              expect(applicationPage.validationErrorsSummary()).to.equal('')
            })
          })
        })
        describe('toisessa hakemuksen muokkausnäkymässä jonkun muutoksen jälkeen', function() {
          var errorCount
          before(
              applicationPage.setInputValue("organization", ""),
              applicationPage.waitAutoSave,
              applicationPage.openEditPage(loginPage.getHakemusId),
              function(){ errorCount = parseInt(applicationPage.validationErrorsSummary().split(' ')[0])}
          )
          describe('avaamisen jälkeen', function() {
            it("lähetys on disabloitu", function() {
              expect(applicationPage.submitButton().isEnabled()).to.equal(false)
            })
            it('kerrotaan kaikista pakollisista kentistä', function() {
              expect(errorCount).to.be.at.least(10)
              expect(applicationPage.validationErrorsSummary()).to.equal(errorCount + ' vastauksessa puutteita')
            })
            it('virhekuvaukset eivät ole näkyvissä', function() {
              expect(applicationPage.validationErrors().is(":hidden")).to.be.true
            })
          })
          describe('virheenyhteenvedossa', function() {
            describe('klikattaessa virheyhteenvetoa', function() {
              var elementId = 'project-description.project-description-1.goal'
              var errorElement
              before(
                applicationPage.validationErrorsButton().click,
                function() {
                  errorElement = applicationPage.validationErrors().find('[data-field-id="' + elementId +'"]')
                }
              )
              it("näkyy yhtä monta kuvausta kuin virhettä", function() {
                expect(applicationPage.validationErrors().find('.error').length).to.equal(errorCount)
              })
              it("näkyy pakollinen tieto: Tavoite", function() {
                expect(errorElement.text()).to.equal('Tavoite: Pakollinen tieto')
              })
              it("tavoite virhettä edellinen virhe on edellinen pakollinen kohta lomakkeelta", function() {
                expect(errorElement.prev().text()).to.equal('Miten hanke tukee hankkeessa mukana olevien koulutuksen järjestäjien strategisten tavoitteiden saavuttamista?: Pakollinen tieto')
              })
              describe('klikattaessa tavoitekentän virhettä', function() {
                before(
                  function() {
                    triggerEvent(errorElement.find("a").first(), "click")
                  },
                  wait.forMilliseconds(1000)
                )
                it("kenttä skrollautuu näkyviin", function() {
                  expect(applicationPage.elementIsInViewport(applicationPage.elementById(elementId))).to.be.true
                })
              })
              describe('syötettäessä ensimmäinen projektin tavoite', function() {
                before(
                  applicationPage.setInputValue("project-description.project-description-1.goal", "Tavoite 1"),
                  applicationPage.setInputValue("project-description.project-description-1.activity", "Toiminta 1"),
                  applicationPage.setInputValue("project-description.project-description-1.result", "Tulos 1"),
                  applicationPage.waitAutoSave
                )
                it("näkyy vähemmän virheitä", function() {
                  expect(applicationPage.validationErrors().find('.error').length).to.equal(errorCount - 3)
                })
                describe('syötettäessä toinen projektin tavoite osittain', function() {
                  var goalElementId = "project-description.project-description-2.goal"
                  var resultElementId = "project-description.project-description-2.result"
                  var errorElement
                  before(
                    applicationPage.setInputValue(goalElementId, "Tavoite 2"),
                    applicationPage.waitAutoSave,
                    function() {
                      errorElement = applicationPage.validationErrors().find('[data-field-id="' + resultElementId +'"]')
                    }
                  )
                  it("näkyy uusia virheitä", function() {
                    expect(applicationPage.validationErrors().find('.error').length).to.equal(errorCount - 3 + 2)
                  })
                  it("vaaditaan syöttämään toiselle tavoitteelle tulos", function() {
                    expect(errorElement.text()).to.equal('Tulos: Pakollinen tieto')
                  })
                  it("tulos virhettä seuraava virhe on seuraava pakollinen kohta lomakkeelta", function() {
                    expect(errorElement.next().text()).to.equal('Hankkeen kohderyhmät: Pakollinen tieto')
                  })
                })
              })
              describe('klikattaessa virheyhteenvetoa uudestaan', function() {
                before(
                  applicationPage.validationErrorsButton().click
                )
                it('virhekuvaukset eivät ole enää näkyvissä', function() {
                  expect(applicationPage.validationErrors().is(":hidden")).to.be.true
                })
              })
            })
          })
        })
      })
    })

    describe('Jos lomakkeelle on syötetty väärän muotoinen sähköpostiosoite', function() {
      before(
        loginPage.openLoginPage(),
        loginPage.login,
        enterValidValuesToPage,
        applicationPage.waitAutoSave,
        applicationPage.setInputValue("primary-email", "NOT VALID EMAIL")
      )

      describe('ennen tallentamista', function() {
        it("lähetys on disabloitu", function() {
          expect(applicationPage.submitButton().isEnabled()).to.equal(false)
        })
        it("virheellisestä kentästä kerrotaan", function() {
          expect(applicationPage.classAttributeOf("primary-email")).to.include('error')
        })
      })

      describe('tallentamisen jälkeen', function() {
        before(
          applicationPage.waitAutoSave
        )

        describe('alkuperäisessä näkymässä', function() {
          it("kerrotaan virheellisestä kentästä", function() {
            expect(applicationPage.validationErrorsSummary()).to.equal('1 vastauksessa puutteita')
          })
        })

        describe('hakemuksen muokkausnäkymässä', function() {
          before(
            applicationPage.openEditPage(loginPage.getHakemusId)
          )
          it("lähetys on disabloitu", function() {
            expect(applicationPage.submitButton().isEnabled()).to.equal(false)
          })

          describe('syötettäessä oikean muotoinen sähköpostisoite', function() {
            before(
              applicationPage.setInputValue("primary-email", "yhteyshenkilo@example.com"),
              applicationPage.waitAutoSave
            )

            describe('syötön jälkeen', function() {
              it("lähetä-nappi enabloituu", function() {
                expect(applicationPage.submitButton().isEnabled()).to.equal(true)
              })
            })
          })
        })
      })
    })

    describe('Jos lomakkeelle on syötetty väärän muotoinen y-tunnus', function() {
      before(
        loginPage.openLoginPage(),
        loginPage.login,
        enterValidValuesToPage,
        applicationPage.waitAutoSave,
        applicationPage.setInputValue("business-id", "abcdefg-13")
      )
      describe('ennen tallentamista', function() {
        it("lähetys on disabloitu", function() {
          expect(applicationPage.submitButton().isEnabled()).to.equal(false)
        })
        it("virheellisestä kentästä kerrotaan", function() {
          expect(applicationPage.classAttributeOf("business-id")).to.include('error')
        })
      })
      describe('tarkistussumma varmistetaan oikein', function() {
        before(
          applicationPage.setInputValue("business-id", "5278603-1"),
          applicationPage.waitAutoSave
        )
        it("y-tunnus, joka on muuten validi, mutta päättyy tarkistusmerkkiin 1 hylätään", function() {
          expect(applicationPage.classAttributeOf("business-id")).to.include('error')
        })
      })
    })

    describe('Jos lomakkeelle on syötetty väärän muotoinen iban tai bic', function() {
      before(
        loginPage.openLoginPage(),
        loginPage.login,
        enterValidValuesToPage,
        applicationPage.waitAutoSave,
        applicationPage.setInputValue("bank-iban", "112233445566778899"),
        applicationPage.setInputValue("bank-bic", "1122")

      )
      describe('ennen tallentamista', function() {
        it("lähetys on disabloitu", function() {
          expect(applicationPage.submitButton().isEnabled()).to.equal(false)
        })
        it("virheellisestä kentästä kerrotaan", function() {
          expect(applicationPage.classAttributeOf("bank-iban")).to.include('error')
          expect(applicationPage.classAttributeOf("bank-bic")).to.include('error')
        })
      })
    })
  })
})()
