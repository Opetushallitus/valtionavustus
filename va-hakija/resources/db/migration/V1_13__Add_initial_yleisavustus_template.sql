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
    "displayAs": "dateRange"
  },
  {
    "type": "infoElement",
    "id": "duration-help",
    "displayAs": "p",
    "text":{
      "fi":"Hakemusta on mahdollista muokata hakuajan loppuun asti. Hakemukset käsitellään hakuajan jälkeen.",
      "sv":"Ansökan kan bearbetas ända till  ansökningstidens slut. Ansökningarna behandlas efter ansökningstiden."
    }
  },
  {
    "type": "wrapperElement",
    "id":"applicant-info",
    "displayAs":"theme",
    "label":{
      "fi":"Hakijan tiedot",
      "sv":"Uppgifter om sökanden"
    },
    "children": [
      {
        "type": "wrapperElement",
        "id":"organization-fieldset",
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
              "sv":"Sökandeorganisation"
            },
            "helpText": {
              "fi": "Ilmoita hakijaorganisaation nimi ja virallinen sähköpostiosoite.",
              "sv": "Meddela sökandeorganisationens namn och officiella e-postadress."
            }
          },
          {
            "type": "formField",
            "id":"organization-email",
            "required":true,
            "displayAs":"emailField",
            "params":{
              "size":"small",
              "maxlength":80
            },
            "label":{
              "fi":"Organisaation sähköposti",
              "sv":"Organisationens e-post"
            }
          }
        ]
      },
      {
        "type": "formField",
        "id":"business-id",
        "required":true,
        "displayAs":"finnishBusinessIdField",
        "params":{
            "size":"small",
            "maxlength":9
        },
        "label":{
            "fi":"Y-tunnus",
            "sv":"Företags- och organisationsnummer"
        }
      },
      {
        "type": "wrapperElement",
        "id":"applicant-fieldset",
        "displayAs":"fieldset",
        "children": [
          {
            "type": "formField",
            "id":"applicant-name",
            "required":true,
            "displayAs":"textField",
            "params":{
              "size":"large",
              "maxlength":80
            },
            "label":{
              "fi":"Yhteyshenkilö",
              "sv":"Kontaktperson"
            },
            "helpText":{
              "fi": "Yhteyshenkilöllä tarkoitetaan hankkeen vastuuhenkilöä hakijaorganisaatiossa.",
              "sv": "Med kontaktperson avses den projektansvariga i sökandeorganisationen."
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
              "fi":"Sähköposti",
              "sv":"E-post"
            }
          }
        ]
      },
      {
        "type": "formField",
        "id":"organization-postal-address",
        "required":true,
        "displayAs":"textArea",
        "params":{
          "maxlength":1000,
          "size": "small"
        },
        "label":{
            "fi":"Osoite",
            "sv":"TODO: Adress"
        }
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
              "fi":"Allekirjoitusoikeudellinen henkilö",
              "sv":"Person med namnteckningsrätt"
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
              "sv":"E-post"
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
            "displayAs":"iban",
            "params":{
              "size":"large",
              "maxlength":80
            },
            "label":{
              "fi":"Tilinumero IBAN-muodossa",
              "sv":"Kontonummer i IBAN-format"
            }
          },
          {
            "type": "formField",
            "id":"bank-bic",
            "required":true,
            "displayAs":"bic",
            "params":{
              "size":"small",
              "maxlength":80
            },
            "label":{
              "fi":"Pankin BIC/SWIFT-koodi",
              "sv":"Bankens BIC/SWIFT-kod"
            }
          }
        ]
      },
      {
        "type": "formField",
        "id":"type-of-organization",
        "required":true,
        "displayAs":"radioButton",
        "label":{
          "fi":"Oppilaitosmuoto",
          "sv":"TODO: Oppilaitosmuoto"
        },
        "options":[
          {
            "value":"kansanopisto",
            "label":{
              "fi":"Kansanopisto",
              "sv":"TODO: Kansanopisto"
            }
          },
          {
            "value":"kesäyliopisto",
            "label":{
              "fi":"Kesäyliopisto",
              "sv":"TODO: Sommarskola"
            }
          }
        ]
      }
    ]
  },
  {
    "type": "wrapperElement",
    "id":"financing-plan",
    "displayAs":"theme",
    "label":{
      "fi":"Rahoitussuunnitelma",
      "sv":"Finansieringsplan"
    },
    "children": [
      {
        "type": "infoElement",
        "id": "financing-plan-help",
        "displayAs": "p",
        "text": {
          "fi": "Valtionavustuksen kokonaiskustannuksiin hyväksytään hankkeen toteuttamisesta aiheutuvat välittömät kustannukset sekä organisaation muista kustannuksista ne kustannuserät, jotka voidaan suoran dokumentoida aiheuttamisperiaatteen mukaisesti kirjata hankkeen menoksi kirjanpitoon hankkeen toteuttamisaikana. Vain todellisiin ja toteutuneisiin kustannuksiin perustuvat menot ovat hyväksyttäviä. Laskennallisilla ja prosentuaalisilla kustannuserillä ei ole suoraa aiheuttamisperiaatetta, joten niitä ei hyväksytä valtionavustushankkeen kustannukseksi. ",
            "sv": "Till de totala kostnaderna för projektet godkänns de omedelbara kostnaderna för genomförandet av projektet och av de övriga kostnaderna de kostnadsposter som enligt direkt, dokumenterad upphovsprincip kan bokföras som utgifter för projektet under projekttiden. Endast utgifter som baserar sig på faktiska och förverkligade kostnader är godtagbara. Direkt upphovsprincip finns inte för kalkylerade och procentuella kostnadsposter, och sådana godkänns därför inte som kostnader för statsunderstödsprojektet."
          }
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
                  "sv":"Förklaring, kort beskrivning"
                },
                "amount": {
                  "fi":"Yhteensä",
                  "sv":"Totalt"
                }
              },
              "sumRowLabel": {
                "fi":"Kustannukset yhteensä",
                "sv":"Kostnader sammanlagt"
              }
            },
            "label":{
              "fi":"Hankkeen kustannusarvio",
              "sv":"Projektkostnaderna"
            },
            "children": [
              {
                "type": "wrapperElement",
                "id":"project-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Hankkeen kustannukset",
                  "sv":"TODO: Kostnaderna för projekt"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"project-costs-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"project-costs-row.amount",
                    "required":true,
                    "displayAs":"moneyField",
                    "initialValue": 0,
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
            "type": "wrapperElement",
            "id":"third-party-income",
            "displayAs":"vaSummingBudgetElement",
            "params":{
              "showColumnTitles":false,
              "sumRowLabel": {
                "fi":"Muu rahoitus yhteensä",
                "sv":"Övriga kostnader sammanlagt"
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
                    "required":true,
                    "displayAs":"moneyField",
                    "initialValue": 0,
                    "params":{
                      "size":"extra-extra-small",
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
                  "sv":"Annan offentlig finansiering"
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
                    "required":true,
                    "displayAs":"moneyField",
                    "initialValue": 0,
                    "params":{
                      "size":"extra-extra-small",
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
                    "sv":"Privat finansiering"
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
                    "required":true,
                    "displayAs":"moneyField",
                    "initialValue": 0,
                    "params":{
                      "size":"extra-extra-small",
                      "maxlength":16
                    }
                  }
                ]
              },
              {
                "type": "wrapperElement",
                "id":"project-other-income-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":false
                },
                "label":{
                  "fi":"Muut tulot",
                  "sv":"TODO: Andra inkomster"
                },
                "children": [
                  {
                    "type": "formField",
                    "id":"project-other-income-row.description",
                    "required":false,
                    "displayAs":"textField",
                    "params":{
                      "size":"small",
                      "maxlength":80
                    }
                  },
                  {
                    "type": "formField",
                    "id":"project-other-income-row.amount",
                    "required":true,
                    "displayAs":"moneyField",
                    "initialValue": 0,
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
            "type": "wrapperElement",
            "id":"budget-summary",
            "displayAs":"vaBudgetSummaryElement",
            "params":{
              "showColumnTitles":false,
              "totalSumRowLabel": {
                "fi":"Hankkeen rahoitus yhteensä",
                "sv":"Projektets finansiering sammanlagt"
              },
              "ophFinancingLabel": {
                "fi":"Opetushallitukselta haettava rahoitus",
                "sv":"Finansiering som söks av Utbildningsstyrelsen"
              },
              "selfFinancingLabel": {
                "fi":"Omarahoitus",
                "sv":"Egen finansiering"
              }
            },
            "children":[]
          }
        ]
      }
    ]
  },
    {
      "type": "wrapperElement",
      "id":"mandatory-attachments",
      "displayAs":"theme",
      "label":{
        "fi":"Vaaditut liitteet",
        "sv":"TODO: Vaaditut liitteet"
      },
      "children": [
        {
          "type": "wrapperElement",
          "id":"named-attachments-fieldset",
          "displayAs":"fieldset",
          "children": [
            {
              "type": "formField",
              "id":"previous-income-statement-and-balance-sheet",
              "required":true,
              "displayAs":"namedAttachment",
              "label":{
                "fi":"Edellisen tilikauden tuloslaskelma ja tase liitetietoineen",
                "sv":"TODO: Edellisen tilikauden tuloslaskelma ja tase liitetietoineen"
              }
            },
            {
              "type": "formField",
              "id":"previous-financial-year-report",
              "required":true,
              "displayAs":"namedAttachment",
              "label":{
                "fi":"Toimintakertomus edelliseltä tilikaudelta",
                "sv":"TODO: Toimintakertomus edelliseltä tilikaudelta"
              }
            },
            {
              "type": "formField",
              "id":"previous-financial-year-auditor-report",
              "required":true,
              "displayAs":"namedAttachment",
              "label":{
                "fi":"Tilintarkastuskertomus edelliseltä tilikaudelta",
                "sv":"TODO: Tilintarkastuskertomus edelliseltä tilikaudelta"
              }
            },
            {
              "type": "formField",
              "id":"current-year-plan-for-action-and-budget",
              "required":true,
              "displayAs":"namedAttachment",
              "label":{
                "fi":"Oppilaitosta koskeva toimintasuunnitelma ja talousarvio vuodelle 2015",
                "sv":"TODO: Oppilaitosta koskeva toimintasuunnitelma ja talousarvio vuodelle 2015"
              }
            },
            {
              "type": "formField",
              "id":"description-of-functional-development-during-last-five-years",
              "required":true,
              "displayAs":"namedAttachment",
              "label":{
                "fi":"Oppilaitoksen toiminnallista kehitystä kuvaava esitys viiden viime vuoden ajalta",
                "sv":"TODO: Oppilaitoksen toiminnallista kehitystä kuvaava esitys viiden viime vuoden ajalta"
              }
            },
            {
              "type": "formField",
              "id":"financial-information-form",
              "required":true,
              "displayAs":"namedAttachment",
              "label":{
                "fi":"Taloustietolomake",
                "sv":"TODO: Taloustietolomake"
              }
            }
          ]
        }
      ]
    }
  ]
');

INSERT INTO avustushaut (form, content) SELECT MAX(id), '
{
  "name": {
    "fi": "Yleisavustus - esimerkkihaku",
    "sv": "TODO: Yleisavustus - esimerkkihaku"
  },
  "selection-criteria": {
    "items": [
    ],
    "label":{
      "fi":"Valintaperusteet",
      "sv":"Urvalsgrunder"
    }
  },
  "duration": {
    "start": "2015-09-17T08:00:00.000+03",
    "end": "2015-12-31T16:15:00.000+03",
    "label": {
      "fi": "Hakuaika",
      "sv": "Ansökningstid"
    }
  },
  "self-financing-percentage": 0
}'
FROM forms;
