BEGIN;

insert into forms (content) VALUES ('
[
  {
    "type": "infoElement",
    "id": "name",
    "displayAs": "h1"
  },
  {
    "type": "infoElement",
    "id": "duration",
    "displayAs": "endOfDateRange",
    "label": {
      "fi": "Hakuaika päättyy",
      "sv": "Sista ansöknings"
    }
  },
  {
    "type": "wrapperElement",
    "id":"applicant-info",
    "displayAs":"theme",
    "label":{
      "fi":"Hakijan tiedot",
      "sv":"Ansökaren"
    },
    "children": [
      {
        "type": "wrapperElement",
        "id":"applicant-fieldset",
        "displayAs":"fieldset",
        "children": [
          {
            "type": "formField",
            "id":"organization",
            "required":true,
            "displayAs":"textField",
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
            "type": "formField",
            "id":"primary-email",
            "required":true,
            "displayAs":"emailField",
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
        "type": "wrapperElement",
        "id":"signature-fieldset",
        "displayAs":"fieldset",
        "children": [
          {
            "type": "formField",
            "id":"signature",
            "required":true,
            "displayAs":"textField",
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
            "type": "formField",
            "id":"signature-email",
            "required":true,
            "displayAs":"emailField",
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
        "type": "wrapperElement",
        "id":"bank-fieldset",
        "displayAs":"fieldset",
        "children": [
          {
            "type": "formField",
            "id":"bank-iban",
            "required":true,
            "displayAs":"textField",
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
            "type": "formField",
            "id":"bank-bic",
            "required":true,
            "displayAs":"textField",
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
    "type": "wrapperElement",
    "id":"project-info",
    "displayAs":"theme",
    "label":{
      "fi":"Hanketiedot",
      "sv":"Projektinformation"
    },
    "children": [
      {
        "type": "formField",
        "id":"language",
        "required":true,
        "displayAs":"radioButton",
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
        "type": "formField",
        "id":"combined-effort",
        "required":true,
        "displayAs":"radioButton",
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
        "type": "wrapperElement",
        "id":"other-organizations",
        "displayAs":"growingFieldset",
        "params":{
          "showOnlyFirstLabels":true
        },
        "children": [
          {
            "type": "wrapperElement",
            "id":"other-organizations-1",
            "displayAs":"growingFieldsetChild",
            "children": [
              {
                "type": "formField",
                "id":"other-organizations.other-organizations-1.name",
                "required":true,
                "displayAs":"textField",
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
                "type": "formField",
                "id":"other-organizations.other-organizations-1.email",
                "required":true,
                "displayAs":"emailField",
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
        "type": "formField",
        "id":"other-partners",
        "required":false,
        "displayAs":"textArea",
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
    "type": "wrapperElement",
    "id":"project-plan",
    "displayAs":"theme",
    "label":{
      "fi":"Hankesuunnitelma",
      "sv":"Projektplanen"
    },
    "children": [
      {
        "type": "infoElement",
        "id":"selection-criteria",
        "displayAs":"bulletList",
        "params":{
          "initiallyOpen":true
        }
      },
      {
        "type": "formField",
        "id":"project-goals",
        "required":true,
        "displayAs":"textArea",
        "params":{
          "maxlength":1000
        },
        "label":{
          "fi":"Hanke pähkinänkuoressa",
          "sv":"Projektets mål"
        }
      },
      {
        "type": "formField",
        "id":"continuation-project",
        "required":false,
        "displayAs":"radioButton",
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
        "type": "formField",
        "id":"project-measure",
        "required":true,
        "displayAs":"textArea",
        "params":{
          "maxlength":2000
        },
        "label":{
          "fi":"Miten hanke tukee hankkeessa mukana olevien koulutuksen järjestäjien strategisten tavoitteiden saavuttamista?",
          "sv":"TODO"
        }
      },
      {
        "type": "wrapperElement",
        "id":"project-description",
        "displayAs":"growingFieldset",
        "params":{
          "showOnlyFirstLabels":false
        },
        "label":{
          "fi":"Hankkeen tavoitteet, toiminta ja tulokset",
          "sv":"Hur genomförs projektet i praktiken?"
        },
        "children": [
          {
            "type": "wrapperElement",
            "id":"project-description-1",
            "displayAs":"vaProjectDescription",
            "children": [
              {
                "type": "formField",
                "id":"project-description.project-description-1.goal",
                "required":true,
                "displayAs":"textField",
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
                "type": "formField",
                "id":"project-description.project-description-1.activity",
                "required":true,
                "displayAs":"textField",
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
                "type": "formField",
                "id":"project-description.project-description-1.result",
                "required":true,
                "displayAs":"textField",
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
        "type": "formField",
        "id":"project-target",
        "required":true,
        "displayAs":"textField",
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
        "type": "formField",
        "id":"project-announce",
        "required":true,
        "displayAs":"textArea",
        "params":{
          "maxlength":2000
        },
        "label":{
          "fi":"Miten hankkeen tavoitteiden toteutumista arvioidaan?",
          "sv":"TODO Hur kommer man att informera om projektet och hur kommer resultaten att spridas?"
        }
      },
      {
        "type": "formField",
        "id":"project-effectiveness",
        "required":true,
        "displayAs":"textArea",
        "params":{
          "maxlength":2000
        },
        "label":{
          "fi":"Hankkeen vaikutukset/vaikuttavuus. Mikä muuttuu hankkeen myötä?",
          "sv":"TODO"
        }
      },
      {
        "type": "formField",
        "id":"project-spreading-plan",
        "required":true,
        "displayAs":"textArea",
        "params":{
          "maxlength":2000
        },
        "label":{
          "fi":"Hankkeen levittämissuunnitelma",
          "sv":"TODO"
        }
      },
      {
        "type": "formField",
        "id":"project-www",
        "required":false,
        "displayAs":"textField",
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
        "type": "formField",
        "id":"project-begin",
        "required":false,
        "displayAs":"textField",
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
        "type": "formField",
        "id":"project-end",
        "required":false,
        "displayAs":"textField",
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
        "type": "formField",
        "id":"other-funding",
        "required":false,
        "displayAs":"textArea",
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
    "type": "wrapperElement",
    "id":"financing-plan",
    "displayAs":"theme",
    "label":{
      "fi":"RahoitussuunnitelmA",
      "sv":"Finansieringsplan"
    },
    "children": [
      {
        "type": "formField",
        "id":"vat-included",
        "required":false,
        "displayAs":"radioButton",
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
        "type": "wrapperElement",
        "id":"budget",
        "displayAs":"vaBudget",
        "children": [
          {
            "type": "wrapperElement",
            "id":"project-budget",
            "displayAs":"vaSummingBudgetElement",
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
                "type": "wrapperElement",
                "id":"coordination-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Yhteishankkeen koordinaatiokustannukset",
                  "sv":"Samordningkostnaderna om gemensamt projekt"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"coordination-costs-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"coordination-costs-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              },
              {
                "type": "wrapperElement",
                "id":"personnel-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Henkilöstökustannukset",
                  "sv":"TODO"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"personnel-costs-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"personnel-costs-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              },
              {
                "type": "wrapperElement",
                "id":"service-purchase-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Palvelujen ostot",
                  "sv":"TODO"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"service-purchase-costs-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"service-purchase-costs-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              },
              {
                "type": "wrapperElement",
                "id":"material-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Tarvike- ja materiaalikustannukset",
                  "sv":"TODO"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"material-costs-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"material-costs-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              },
              {
                "type": "wrapperElement",
                "id":"rent-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Vuokrat",
                  "sv":"TODO"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"rent-costs-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"rent-costs-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              },
              {
                "type": "wrapperElement",
                "id":"equipment-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Laite- ym. hankinnat",
                  "sv":"TODO"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"equipment-costs-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"equipment-costs-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              },
              {
                "type": "wrapperElement",
                "id":"steamship-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Matkakustannukset",
                  "sv":"TODO"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"steamship-costs-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"steamship-costs-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              },
              {
                "type": "wrapperElement",
                "id":"other-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Muut kustannukset",
                  "sv":"TODO"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"other-costs-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"other-costs-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              },
              {
                "type": "wrapperElement",
                "id":"project-incomes-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":false
                },
                "label":{
                  "fi":"Hankkeen tulot",
                  "sv":"TODO"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"project-incomes-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"project-incomes-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              }
            ]
          },
          {
            "type": "wrapperElement",
            "id":"third-party-income",
            "displayAs":"vaSummingBudgetElement",
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
                "type": "wrapperElement",
                "id":"eu-programs-income-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":false
                },
                "label":{
                  "fi":"EU-ohjelmat",
                  "sv":"EU-program"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"eu-programs-income-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"eu-programs-income-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              },
              {
                "type": "wrapperElement",
                "id":"other-public-financing-income-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":false
                },
                "label":{
                  "fi":"Muu julkinen rahoitus",
                  "sv":"TODO"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"other-public-financing-income-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"other-public-financing-income-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              },
              {
                "type": "wrapperElement",
                "id":"private-financing-income-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":false
                },
                "label":{
                  "fi":"Yksityinen rahoitus",
                  "sv":"TODO"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"private-financing-income-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"private-financing-income-row.amount",
                    "required":false,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-small",
                      "maxlength":16
                    }
                  }
                ]
              }
            ]
          },
          {
            "type": "wrapperElement",
            "id":"budget-summary",
            "displayAs":"vaBudgetSummaryElement",
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
');

INSERT INTO avustushaut (form, content) VALUES (1, '
{
  "name": {
    "fi": "Ammatillinen koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen",
    "sv": "Stöd för genomförande av kvalitetsstrategin"
  },
  "selection-criteria": {
    "items": [
      {
        "fi": "Vaikuttavuuden edistäminen (ml. yhdensuuntaisuus koulutuksen järjestäjien strategisten tavoitteiden kanssa)",
        "sv": "TODO"
      },
      {
        "fi": "Hankesuunnitelman toteuttamiskelpoisuus ja kokonaistaloudellisuus suhteessa esitettyyn toimintaan",
        "sv": "TODO"
      },
      {
        "fi": "Henkilöstön ja sidosryhmien osallistumis- ja vaikutusmahdollisuudet verkoston toimintapainopisteiden mukaisten tavoitteiden saavuttamiseksi",
        "sv": "TODO"
      },
      {
        "fi": "Kehittämisverkoston laatu (sis. aiemmin rahoitetuissa laatuverkostoissa saavutetut tulokset) ja kattavuus",
        "sv": "TODO"
      },
      {
        "fi": "Aiempien hankkeiden ja verkostojen välinen hyvien käytäntöjen tunnistaminen ja käyttö",
        "sv": "TODO"
      }
    ],
    "label":{
      "fi":"Valintaperusteet",
      "sv":"TODO"
    }
  },
  "duration": {
    "start": "2015-08-12T00:00:00.000Z",
    "end": "2015-09-12T17:00:00.000Z",
    "label": {
      "fi": "Hakuaika",
      "sv": "Åtkomsttid"
    }
  },
  "self-financing-percentage": 25
}'
);

COMMIT;
