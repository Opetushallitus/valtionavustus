(function() {
  const page = ApplicationPage()

  beforeEach(function () {
    window.localStorage.clear()
  })

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      takeScreenshot()
    }
    expect(window.uiError || null).to.be.null
  })

  function enterValidValuesToPage() {
    enterValidValues(page)
  }

  describe('Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen haku validointi', function () {
    before(
      page.openStartPage()
    )

    describe('Jos lomakkeelle ei ole annettu kaikkia pakollisia arvoja', function () {
      before(
        page.openStartPage(),
        enterValidValuesToPage,
        page.setInputValue("organization", ""),
        page.waitAutoSave
      )

      describe('automaattitallentamisen jälkeen', function () {
        before(
          wait.until(page.hakemusIdIsPresent),
          page.storeHakemusIdFromHtml
        )

        describe('alkuperäisessä muokkausnäkymässä', function () {
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
            expect(page.validationErrorsSummary()).to.equal('1 vastauksessa puutteita')
          })
        })

        describe('hakemuksen esikatselussa', function () {
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

        describe('uudessa hakemuksen muokkausnäkymässä', function () {
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
              expect(page.validationErrorsSummary()).to.equal('1 vastauksessa puutteita')
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
                expect(page.validationErrorsSummary()).to.equal('')
              })
            })
          })

          describe('muokatessa vastauksia', function () {
            before(
              page.setInputValue("project-target", "Uusi kohderymämme on meidän uusi kohderyhmä"),
              page.setInputValue("project-description.project-description-1.goal", "Uusi ensimmäinen tavoite."),
              page.setInputValue("project-description.project-description-1.activity", "Uusi ensimmäinen toiminta."),
              page.setInputValue("project-description.project-description-1.result", "Uusi ensimmäinen tulos."),
              page.waitAutoSave
            )

            describe('tallentamisen jälkeen', function () {
              it("ei tule virhettä", function () {
                expect(page.validationErrorsSummary()).to.equal('')
                expect(page.getInput("project-description.project-description-1.goal").value()).to.equal('Uusi ensimmäinen tavoite.')
                expect(page.getInput("project-description.project-description-1.activity").value()).to.equal('Uusi ensimmäinen toiminta.')
                expect(page.getInput("project-description.project-description-1.result").value()).to.equal('Uusi ensimmäinen tulos.')
              })
            })

            describe('muokkauksen jälkeen esikatselussa', function () {
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

    describe('Jos annettu pelkästään yhteyshenkilön sähköposti', function () {
      before(
          page.openStartPage(),
          page.setInputValue("primary-email", "yhteyshenkilo@example.com"),
          page.waitAutoSave,
          wait.until(page.hakemusIdIsPresent),
          page.storeHakemusIdFromHtml
      )


      describe('automaatti tallennuksen jälkeen', function () {
        describe('alkuperäisessä näkymässä', function () {
          it("ei herjata pakollisista tiedoista", function () {
            expect(page.validationErrorsSummary()).to.equal('')
          })
        })

        describe('hakemuksen muokkausnäkymässä', function () {
          var errorCount
          before(
              page.openEditPage(page.getHakemusId),
              function(){ errorCount = parseInt(page.validationErrorsSummary().split(' ')[0])}
          )
          describe('avaamisen jälkeen', function () {
            it("lähetys on disabloitu", function () {
              expect(page.submitButton().isEnabled()).to.equal(false)
            })
            it('kerrotaan kaikista pakollisista kentistä', function () {
              expect(errorCount).to.be.at.least(10)
              expect(page.validationErrorsSummary()).to.equal(errorCount + ' vastauksessa puutteita')
            })
            it('virhekuvakset eivät ole näkyvissä', function () {
              expect(page.validationErrors().length).to.equal(0)
            })
            describe('klikattaessa virheyhteenvetoa', function () {
              var tavoiteVirhe
              before(
                page.validationErrorsButton().click,
                function() {
                  tavoiteVirhe = page.validationErrors().find(".error[data-reactid*='project-description-1=1goal-validation-error']")
                }
              )
              it("näkyy yhtä monta kuvausta kuin virhettä", function () {
                expect(page.validationErrors().find('.error').length).to.equal(errorCount)
              })
              it("näkyy pakollinen tieto: Tavoite", function () {
                expect(tavoiteVirhe.text()).to.equal('Tavoite: Pakollinen tieto')
              })
              it("tavoite virhettä edellinen virhe on edellinen pakollinen kohta lomakkeelta", function () {
                expect(tavoiteVirhe.prev().text()).to.equal('Miten hanke tukee hankkeessa mukana olevien koulutuksen järjestäjien strategisten tavoitteiden saavuttamista?: Pakollinen tieto')
              })
              describe('klikattaessa tavoite kentän virhettä', function () {
                before(
                  function() {
                    triggerEvent(tavoiteVirhe.find("a").first(), "click")
                  }
                )
                it("focus siirtyy kenttään", function () {
                  // tarkasta käsin ajamalla testiä
                })
              })
              describe('syötettäessä ensimmäinen projektin tavoite', function () {
                before(
                  page.setInputValue("project-description.project-description-1.goal", "Tavoite 1"),
                  page.setInputValue("project-description.project-description-1.activity", "Toiminta 1"),
                  page.setInputValue("project-description.project-description-1.result", "Tulos 1"),
                  page.waitAutoSave
                )
                it("näkyy vähemmän virheitä", function () {
                  expect(page.validationErrors().find('.error').length).to.equal(errorCount - 3)
                })
                describe('syötettäessä toinen projektin tavoite osittain', function () {
                  var tulosVirhe
                  before(
                      page.setInputValue("project-description.project-description-2.goal", "Tavoite 2"),
                      page.waitAutoSave,
                      function() {tulosVirhe = page.validationErrors().find(".error[data-reactid*='project-description-2=1result-validation-error']")}
                  )
                  it("näkyy uusia virheitä", function () {
                    expect(page.validationErrors().find('.error').length).to.equal(errorCount - 3 + 2)
                  })
                  it("vaaditaan syöttämään toiselle tavoitteelle tulos", function () {
                    expect(tulosVirhe.text()).to.equal('Tulos: Pakollinen tieto')
                  })
                  it("tulos virhettä seuraava virhe on seuraava pakollinen kohta lomakkeelta", function () {
                    expect(tulosVirhe.next().text()).to.equal('Hankkeen kohderyhmät: Pakollinen tieto')
                  })
                })
              })
              describe('painettaessa x nappia virhe popupissa', function () {
                before(
                    page.validationErrorsCloseButton().click
                )
                it('virhekuvakset eivät ole enää näkyvissä', function () {
                  expect(page.validationErrors().length).to.equal(0)
                })
              })
            })
          })
        })
      })
    })

    describe('Jos lomakkeelle on syötetty väärän muotoinen sähköpostiosoite', function () {
      before(
        page.openStartPage(),
        enterValidValuesToPage,
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

        describe('alkuperäisessä näkymässä', function () {
          it("kerrotaan virheellisestä kentästä", function () {
            expect(page.validationErrorsSummary()).to.equal('1 vastauksessa puutteita')
          })
        })

        describe('hakemuksen muokkausnäkymässä', function () {
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
  })
})()