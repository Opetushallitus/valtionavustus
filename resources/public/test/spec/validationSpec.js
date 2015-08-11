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
      loginPage.openLoginPage(),
      loginPage.login
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
          it("kerrotaan automaattitallennuksesta", function() {
            expect(applicationPage.saveInfo()).to.equal("Kaikki muutokset tallennettu")
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
            it("näkyy validointi virheet", function() {
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
                applicationPage.submitButton().click
              )
              it('ei tule virhettä', function() {
                expect(applicationPage.validationErrorsSummary()).to.equal('')
              })
              it("lähetä nappi disabloituu", function() {
                expect(applicationPage.submitButton().isEnabled()).to.equal(false)
              })
              it.skip("lähetä napin teksti muuttuu", function() {
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

        describe('hakemuksen muokkausnäkymässä', function() {
          var errorCount
          before(
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
            it('virhekuvakset eivät ole näkyvissä', function() {
              expect(applicationPage.validationErrors().length).to.equal(0)
            })
            describe('klikattaessa virheyhteenvetoa', function() {
              var tavoiteVirhe
              before(
                applicationPage.validationErrorsButton().click,
                function() {
                  tavoiteVirhe = applicationPage.validationErrors().find(".error[data-reactid*='project-description-1=1goal-validation-error']")
                }
              )
              it("näkyy yhtä monta kuvausta kuin virhettä", function() {
                expect(applicationPage.validationErrors().find('.error').length).to.equal(errorCount)
              })
              it("näkyy pakollinen tieto: Tavoite", function() {
                expect(tavoiteVirhe.text()).to.equal('Tavoite: Pakollinen tieto')
              })
              it("tavoite virhettä edellinen virhe on edellinen pakollinen kohta lomakkeelta", function() {
                expect(tavoiteVirhe.prev().text()).to.equal('Miten hanke tukee hankkeessa mukana olevien koulutuksen järjestäjien strategisten tavoitteiden saavuttamista?: Pakollinen tieto')
              })
              describe('klikattaessa tavoite kentän virhettä', function() {
                before(
                  function() {
                    triggerEvent(tavoiteVirhe.find("a").first(), "click")
                  }
                )
                it("focus siirtyy kenttään", function() {
                  // tarkasta käsin ajamalla testiä
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
                  var tulosVirhe
                  before(
                    applicationPage.setInputValue("project-description.project-description-2.goal", "Tavoite 2"),
                    applicationPage.waitAutoSave,
                    function() {tulosVirhe = applicationPage.validationErrors().find(".error[data-reactid*='project-description-2=1result-validation-error']")}
                  )
                  it("näkyy uusia virheitä", function() {
                    expect(applicationPage.validationErrors().find('.error').length).to.equal(errorCount - 3 + 2)
                  })
                  it("vaaditaan syöttämään toiselle tavoitteelle tulos", function() {
                    expect(tulosVirhe.text()).to.equal('Tulos: Pakollinen tieto')
                  })
                  it("tulos virhettä seuraava virhe on seuraava pakollinen kohta lomakkeelta", function() {
                    expect(tulosVirhe.next().text()).to.equal('Hankkeen kohderyhmät: Pakollinen tieto')
                  })
                })
              })
              describe('klikattaessa virheyhteenvetoa uudestaan', function() {
                before(
                  applicationPage.validationErrorsButton().click
                )
                it('virhekuvakset eivät ole enää näkyvissä', function() {
                  expect(applicationPage.validationErrors().length).to.equal(0)
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
  })
})()