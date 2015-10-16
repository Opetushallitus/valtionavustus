export default class TestUtil {
  static testFormJson() {
    return [
      {
        "fieldClass": "infoElement",
        "id": "name",
        "fieldType": "h1"
      },
      {
        "fieldClass": "infoElement",
        "id": "duration",
        "fieldType": "endOfDateRange",
        "label": {
          "fi": "Hakuaika päättyy",
          "sv": "Sista ansöknings"
        }
      },
      {
        "fieldClass": "wrapperElement",
        "id":"applicant-info",
        "fieldType":"theme",
        "label":{
          "fi":"Hakijan tiedot",
          "sv":"Ansökaren"
        },
        "children": [
          {
            "fieldClass": "wrapperElement",
            "id":"applicant-fieldset",
            "fieldType":"fieldset",
            "children": [
              {
                "fieldClass": "formField",
                "id":"organization",
                "required":true,
                "fieldType":"textField",
                "params":{
                  "size":"large",
                  "maxlength":80
                },
                "label":{
                  "fi":"Hakijaorganisaatio",
                  "sv":"Organisation"
                }
              },
              {
                "fieldClass": "formField",
                "id":"primary-email",
                "required":true,
                "fieldType":"emailField",
                "params":{
                  "size":"small",
                  "maxlength":80
                },
                "label":{
                  "fi":"Yhteyshenkilön sähköposti",
                  "sv":"Kontaktpersonens e-postadress"
                }
              }
            ]
          },
          {
            "fieldClass": "wrapperElement",
            "id":"signature-fieldset",
            "fieldType":"fieldset",
            "children": [
              {
                "fieldClass": "formField",
                "id":"signature",
                "required":true,
                "fieldType":"textField",
                "params":{
                  "size":"large",
                  "maxlength":80
                },
                "label":{
                  "fi":"Allekirjoitusoikeudellisen henkilön nimi",
                  "sv":"Underskriftgiltiga personens namn och uppgift"
                }
              },
              {
                "fieldClass": "formField",
                "id":"signature-email",
                "required":true,
                "fieldType":"emailField",
                "params":{
                  "size":"small",
                  "maxlength":80
                },
                "label":{
                  "fi":"Sähköposti",
                  "sv":"e-postadress"
                }
              }
            ]
          },
          {
            "fieldClass": "wrapperElement",
            "id":"bank-fieldset",
            "fieldType":"fieldset",
            "children": [
              {
                "fieldClass": "formField",
                "id":"bank-iban",
                "required":true,
                "fieldType":"textField",
                "params":{
                  "size":"large",
                  "maxlength":80
                },
                "label":{
                  "fi":"Tilinumero IBAN-muodossa",
                  "sv":"TODO"
                }
              },
              {
                "fieldClass": "formField",
                "id":"bank-bic",
                "required":true,
                "fieldType":"textField",
                "params":{
                  "size":"small",
                  "maxlength":80
                },
                "label":{
                  "fi":"Pankin BIC/SWIFT-koodi",
                  "sv":"TODO"
                }
              }
            ]
          }
        ]
      },
      {
        "fieldClass": "wrapperElement",
        "id":"project-info",
        "fieldType":"theme",
        "label":{
          "fi":"Hanketiedot",
          "sv":"Projektinformation"
        },
        "children": [
          {
            "fieldClass": "formField",
            "id":"language",
            "required":true,
            "fieldType":"radioButton",
            "label":{
              "fi":"Hankkeen asiointikieli",
              "sv":"Projektets språk"
            },
            "options":[
              {
                "value":"fi",
                "label":{
                  "fi":"Suomi",
                  "sv":"Finska"
                }
              },
              {
                "value":"sv",
                "label":{
                  "fi":"Ruotsi",
                  "sv":"Svenska"
                }
              }
            ]
          },
          {
            "fieldClass": "formField",
            "id":"combined-effort",
            "required":true,
            "fieldType":"radioButton",
            "label":{
              "fi":"Onko kyseessä yhteishanke",
              "sv":"Är det gemensamt projekt"
            },
            "options":[
              {
                "value":"yes",
                "label":{
                  "fi":"Kyllä",
                  "sv":"Ja"
                }
              },
              {
                "value":"no",
                "label":{
                  "fi":"Ei",
                  "sv":"Nej"
                }
              }
            ]
          },
          {
            "fieldClass": "wrapperElement",
            "id":"other-organizations",
            "fieldType":"growingFieldset",
            "params":{
              "showOnlyFirstLabels":true
            },
            "children": [
              {
                "fieldClass": "wrapperElement",
                "id":"other-organizations-1",
                "fieldType":"growingFieldsetChild",
                "children": [
                  {
                    "fieldClass": "formField",
                    "id":"other-organizations.other-organizations-1.name",
                    "required":true,
                    "fieldType":"textField",
                    "params":{
                      "size":"large",
                      "maxlength":80
                    },
                    "label":{
                      "fi":"Hankkeen muut organisaatiot",
                      "sv":"Andra organisation"
                    }
                  },
                  {
                    "fieldClass": "formField",
                    "id":"other-organizations.other-organizations-1.email",
                    "required":true,
                    "fieldType":"emailField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    },
                    "label":{
                      "fi":"Yhteyshenkilön sähköposti",
                      "sv":"Kontaktpersonens e-postadress"
                    }
                  }
                ]
              },
              {
                "fieldClass": "wrapperElement",
                "id":"other-organizations-2",
                "fieldType":"growingFieldsetChild",
                "children": [
                  {
                    "fieldClass": "formField",
                    "id":"other-organizations.other-organizations-2.name",
                    "required":true,
                    "fieldType":"textField",
                    "params":{
                      "size":"large",
                      "maxlength":80
                    },
                    "label":{
                      "fi":"Hankkeen muut organisaatiot",
                      "sv":"Andra organisation"
                    }
                  },
                  {
                    "fieldClass": "formField",
                    "id":"other-organizations.other-organizations-2.email",
                    "required":true,
                    "fieldType":"emailField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    },
                    "label":{
                      "fi":"Yhteyshenkilön sähköposti",
                      "sv":"Kontaktpersonens e-postadress"
                    }
                  }
                ]
              }
            ]
          },
          {
            "fieldClass": "formField",
            "id":"other-partners",
            "required":false,
            "fieldType":"textArea",
            "params":{
              "maxlength":1000
            },
            "label":{
              "fi":"Muut yhteistyökumppanit",
              "sv":"TODO"
            }
          }
        ]
      },
      {
        "fieldClass": "wrapperElement",
        "id":"project-plan",
        "fieldType":"theme",
        "label":{
          "fi":"Hankesuunnitelma",
          "sv":"Projektplanen"
        },
        "children": [
          {
            "fieldClass": "infoElement",
            "id":"selection-criteria",
            "fieldType":"bulletList",
            "params":{
              "initiallyOpen":true
            }
          },
          {
            "fieldClass": "formField",
            "id":"project-goals",
            "required":true,
            "fieldType":"textArea",
            "params":{
              "maxlength":1000
            },
            "label":{
              "fi":"Hanke pähkinänkuoressa",
              "sv":"Projektets mål"
            }
          },
          {
            "fieldClass": "formField",
            "id":"continuation-project",
            "required":false,
            "fieldType":"radioButton",
            "label":{
              "fi":"Liittyykö hanke aiempaan hankkeeseen",
              "sv":"Är det uppföljning för en tidigare projekt?"
            },
            "options":[
              {
                "value":"yes",
                "label":{
                  "fi":"Kyllä",
                  "sv":"Ja"
                }
              },
              {
                "value":"no",
                "label":{
                  "fi":"Ei",
                  "sv":"Nej"
                }
              }
            ]
          },
          {
            "fieldClass": "formField",
            "id":"project-measure",
            "required":true,
            "fieldType":"textArea",
            "params":{
              "maxlength":2000,
              "size": "large"
            },
            "label":{
              "fi":"Miten hanke tukee hankkeessa mukana olevien koulutuksen järjestäjien strategisten tavoitteiden saavuttamista?",
              "sv":"TODO"
            }
          },
          {
            "fieldClass": "wrapperElement",
            "id":"project-description",
            "fieldType":"growingFieldset",
            "params":{
              "showOnlyFirstLabels":false
            },
            "label":{
              "fi":"Hankkeen tavoitteet, toiminta ja tulokset",
              "sv":"Hur genomförs projektet i praktiken?"
            },
            "children": [
              {
                "fieldClass": "wrapperElement",
                "id":"project-description-1",
                "fieldType":"vaProjectDescription",
                "children": [
                  {
                    "fieldClass": "formField",
                    "id":"project-description.project-description-1.goal",
                    "required":true,
                    "fieldType":"textField",
                    "params":{
                      "size":"extra-large",
                      "maxlength":200
                    },
                    "label":{
                      "fi":"Tavoite",
                      "sv":"Målet"
                    }
                  },
                  {
                    "fieldClass": "formField",
                    "id":"project-description.project-description-1.activity",
                    "required":true,
                    "fieldType":"textField",
                    "params":{
                      "size":"extra-large",
                      "maxlength":200
                    },
                    "label":{
                      "fi":"Toiminta",
                      "sv":"Aktivitet"
                    }
                  },
                  {
                    "fieldClass": "formField",
                    "id":"project-description.project-description-1.result",
                    "required":true,
                    "fieldType":"textField",
                    "params":{
                      "size":"extra-large",
                      "maxlength":200
                    },
                    "label":{
                      "fi":"Tulos",
                      "sv":"Resultat"
                    }
                  }
                ]
              }
            ]
          },
          {
            "fieldClass": "formField",
            "id":"project-target",
            "required":true,
            "fieldType":"textField",
            "params":{
              "size":"large",
              "maxlength":80
            },
            "label":{
              "fi":"Hankkeen kohderyhmät",
              "sv":"Projektets målgrupp"
            }
          },
          {
            "fieldClass": "formField",
            "id":"project-announce",
            "required":true,
            "fieldType":"textArea",
            "params":{
              "maxlength":2000,
              "size": "large"
            },
            "label":{
              "fi":"Miten hankkeen tavoitteiden toteutumista arvioidaan?",
              "sv":"TODO Hur kommer man att informera om projektet och hur kommer resultaten att spridas?"
            }
          },
          {
            "fieldClass": "formField",
            "id":"project-effectiveness",
            "required":true,
            "fieldType":"textArea",
            "params":{
              "maxlength":2000,
              "size": "large"
            },
            "label":{
              "fi":"Hankkeen vaikutukset/vaikuttavuus. Mikä muuttuu hankkeen myötä?",
              "sv":"TODO"
            }
          },
          {
            "fieldClass": "formField",
            "id":"project-spreading-plan",
            "required":true,
            "fieldType":"textArea",
            "params":{
              "maxlength":2000,
              "size": "large"
            },
            "label":{
              "fi":"Hankkeen levittämissuunnitelma",
              "sv":"TODO"
            }
          },
          {
            "fieldClass": "formField",
            "id":"project-www",
            "required":false,
            "fieldType":"textField",
            "params":{
              "size":"large",
              "maxlength":80
            },
            "label":{
              "fi":"Hankkeen www-osoite",
              "sv":"Projektets webbadress"
            }
          },
          {
            "fieldClass": "formField",
            "id":"project-begin",
            "required":false,
            "fieldType":"textField",
            "params":{
              "size":"extra-small",
              "maxlength":10
            },
            "label":{
              "fi":"Hankkeen alkamisaika",
              "sv":"När startar projektet"
            }
          },
          {
            "fieldClass": "formField",
            "id":"project-end",
            "required":false,
            "fieldType":"textField",
            "params":{
              "size":"extra-small",
              "maxlength":10
            },
            "label":{
              "fi":"Hankkeen päättymisaika",
              "sv":"När slutar projektet"
            }
          },
          {
            "fieldClass": "formField",
            "id":"other-funding",
            "required":false,
            "fieldType":"textArea",
            "params":{
              "maxlength":1000
            },
            "label":{
              "fi":"Saako hanke muuta rahoitusta tai onko hankkeella tuloja?",
              "sv":"TODO"
            }
          }
        ]
      },
      {
        "fieldClass": "wrapperElement",
        "id":"financing-plan",
        "fieldType":"theme",
        "label":{
          "fi":"Rahoitussuunnitelma",
          "sv":"Finansieringsplan"
        },
        "children": [
          {
            "fieldClass": "formField",
            "id":"vat-included",
            "required":false,
            "fieldType":"radioButton",
            "label":{
              "fi":"Onko kustannukset ilmoitettu arvonlisäverollisina?",
              "sv":"Har kostnaderna förklaras momspliktig?"
            },
            "options":[
              {
                "value":"yes",
                "label":{
                  "fi":"Kyllä",
                  "sv":"Ja"
                }
              },
              {
                "value":"no",
                "label":{
                  "fi":"Ei",
                  "sv":"Nej"
                }
              }
            ]
          },
          {
            "fieldClass": "wrapperElement",
            "id":"budget",
            "fieldType":"vaBudget",
            "children": [
              {
                "fieldClass": "wrapperElement",
                "id":"project-budget",
                "fieldType":"vaSummingBudgetElement",
                "params":{
                  "showColumnTitles":true,
                  "columnTitles": {
                    "label": {
                      "fi":"Menot",
                      "sv":"Kostnader"
                    },
                    "description": {
                      "fi":"Selite, lyhyt kuvaus",
                      "sv":"Förklaringen, kort deskription"
                    },
                    "amount": {
                      "fi":"Yhteensä",
                      "sv":"totalt"
                    }
                  },
                  "sumRowLabel": {
                    "fi":"Kustannukset yhteensä",
                    "sv":"Totala kostnader"
                  }
                },
                "label":{
                  "fi":"Hankkeen kustannusarvio",
                  "sv":"Projektkostnaderna"
                },
                "children": [
                  {
                    "fieldClass": "wrapperElement",
                    "id":"coordination-costs-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":true
                    },
                    "label":{
                      "fi":"Yhteishankkeen koordinaatiokustannukset",
                      "sv":"Samordningkostnaderna om gemensamt projekt"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"coordination-costs-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"coordination-costs-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  },
                  {
                    "fieldClass": "wrapperElement",
                    "id":"personnel-costs-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":true
                    },
                    "label":{
                      "fi":"Henkilöstökustannukset",
                      "sv":"TODO"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"personnel-costs-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"personnel-costs-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  },
                  {
                    "fieldClass": "wrapperElement",
                    "id":"service-purchase-costs-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":true
                    },
                    "label":{
                      "fi":"Palvelujen ostot",
                      "sv":"TODO"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"service-purchase-costs-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"service-purchase-costs-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  },
                  {
                    "fieldClass": "wrapperElement",
                    "id":"material-costs-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":true
                    },
                    "label":{
                      "fi":"Tarvike- ja materiaalikustannukset",
                      "sv":"TODO"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"material-costs-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"material-costs-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  },
                  {
                    "fieldClass": "wrapperElement",
                    "id":"rent-costs-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":true
                    },
                    "label":{
                      "fi":"Vuokrat",
                      "sv":"TODO"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"rent-costs-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"rent-costs-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  },
                  {
                    "fieldClass": "wrapperElement",
                    "id":"equipment-costs-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":true
                    },
                    "label":{
                      "fi":"Laite- ym. hankinnat",
                      "sv":"TODO"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"equipment-costs-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"equipment-costs-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  },
                  {
                    "fieldClass": "wrapperElement",
                    "id":"steamship-costs-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":true
                    },
                    "label":{
                      "fi":"Matkakustannukset",
                      "sv":"TODO"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"steamship-costs-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"steamship-costs-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  },
                  {
                    "fieldClass": "wrapperElement",
                    "id":"other-costs-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":true
                    },
                    "label":{
                      "fi":"Muut kustannukset",
                      "sv":"TODO"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"other-costs-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"other-costs-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  },
                  {
                    "fieldClass": "wrapperElement",
                    "id":"project-incomes-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":false
                    },
                    "label":{
                      "fi":"Hankkeen tulot",
                      "sv":"TODO"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"project-incomes-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"project-incomes-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  }
                ]
              },
              {
                "fieldClass": "wrapperElement",
                "id":"third-party-income",
                "fieldType":"vaSummingBudgetElement",
                "params":{
                  "showColumnTitles":false,
                  "sumRowLabel": {
                    "fi":"Muu rahoitus yhteensä",
                    "sv":"Annan finansiering totalt"
                  }
                },
                "label":{
                  "fi":"Hankkeen rahoitus",
                  "sv":"Finansieringen av projektet"
                },
                "children": [
                  {
                    "fieldClass": "wrapperElement",
                    "id":"eu-programs-income-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":false
                    },
                    "label":{
                      "fi":"EU-ohjelmat",
                      "sv":"EU-program"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"eu-programs-income-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"eu-programs-income-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  },
                  {
                    "fieldClass": "wrapperElement",
                    "id":"other-public-financing-income-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":false
                    },
                    "label":{
                      "fi":"Muu julkinen rahoitus",
                      "sv":"TODO"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"other-public-financing-income-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"other-public-financing-income-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  },
                  {
                    "fieldClass": "wrapperElement",
                    "id":"private-financing-income-row",
                    "fieldType":"vaBudgetItemElement",
                    "params":{
                      "incrementsTotal":false
                    },
                    "label":{
                      "fi":"Yksityinen rahoitus",
                      "sv":"TODO"
                    },
                    "children": [
                      {
                        "fieldClass": "formField",
                        "id":"private-financing-income-row.description",
                        "required":false,
                        "fieldType":"textField",
                        "params":{
                          "size":"small",
                          "maxlength":80
                        }
                      },
                      {
                        "fieldClass": "formField",
                        "id":"private-financing-income-row.amount",
                        "required":true,
                        "fieldType":"moneyField",
                        "params":{
                          "size":"extra-extra-small",
                          "maxlength":16
                        }
                      }
                    ]
                  }
                ]
              },
              {
                "fieldClass": "wrapperElement",
                "id":"budget-summary",
                "fieldType":"vaBudgetSummaryElement",
                "params":{
                  "showColumnTitles":false,
                  "totalSumRowLabel": {
                    "fi":"Hankkeen rahoitus yhteensä",
                    "sv":"Finansiering av den totala projekt"
                  },
                  "ophFinancingLabel": {
                    "fi":"Opetushallitukselta haettava rahoitus",
                    "sv":"TODO"
                  },
                  "selfFinancingLabel": {
                    "fi":"Omarahoitus",
                    "sv":"TODO"
                  }
                },
                "children":[]
              }
            ]
          }
        ]
      }
    ]
  }
}
