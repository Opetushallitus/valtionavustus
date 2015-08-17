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
    "displayAs": "dateRange"
  },
  {
    "type": "infoElement",
    "id": "duration-help",
    "displayAs": "p",
    "text":{
      "fi":"Hakemusta on mahdollista muokata hakuajan loppuun asti. Hakemukset käsitellään hakuajan jälkeen.",
      "sv":"TODO SV.. testi 2"
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
              "fi":"Sähköposti",
              "sv":"E-post"
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
          "sv":"Är projektet ett samprojekt"
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
                  "sv":"Övriga samarbetspartner"
                },
                "helpText": {
                  "fi": "Lisää hankkeen toteuttamiseen osallistuvat organisaatiot, jotka ovat hakukelpoisia ja vastaanottavat suoraan valtionavustusta.",
                  "sv": "Lägg till de organisationer som deltar i projektet, som är behöriga att söka och som mottar statsunderstöd."
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
          "sv":"Övriga samarbetspartner"
        },
        "helpText": {
          "fi": "Mainitse hankkeeseen osallistuvat tahot, jotka ovat mukana hankkeen toteutuksessa, mutta eivät vastaanota valtionavustusta – esimerkiksi yritykset tai yhteisöt, joilta ostetaan palveluita.",
          "sv": "Nämn de aktörer som deltar i genomförandet av projektet, men som inte mottar statsunderstöd – till exempel företag eller sammanslutningar, av vilka projektet köper tjänster."
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
      "sv":"Projektplan"
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
          "sv":"Projektet i ett nötskal"
        },
        "helpText": {
          "fi": "Kuvaa lyhyesti mistä hankkeessa on kyse: mitä tavoitellaan, mitä tehdään, miten tehdään ja ketkä ovat hyödynsaajat.",
          "sv": "Beskriv i korthet vad projektet handlar om: vad som eftersträvas, vad som görs, hur man gör och vilka nyttotagarna är."
        }
      },
      {
        "type": "formField",
        "id":"continuation-project",
        "required":false,
        "displayAs":"radioButton",
        "label":{
          "fi":"Liittyykö hanke aiempaan hankkeeseen",
          "sv":"Är projektet uppföljning för en tidigare projekt?"
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
          "maxlength":2000,
          "size": "large"
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
                  "maxlength":300
                },
                "label":{
                  "fi":"Tavoite",
                  "sv":"Mål"
                },
                "helpText": {
                  "fi": "Hankkeen tavoitteet kuvataan kokonaisuuksina, joissa kunkin tavoitteen kuvaukseen liitetään kuvaus siihen liittyvästä toiminnasta hankkeessa sekä tämän seurauksena tavoiteltu tulos. Tavoitteita voidaan lisätä tarpeen mukaan.",
                  "sv": "Projektets mål beskriv som helheter, i vilka till beskrivningen av varje mål fogas en beskrivning av verksamheten i anslutning detta mål inom projektet och det resultat som eftersträvas till följd av verksamheten. Mål kan läggas till efter behov."
                }
              },
              {
                "type": "formField",
                "id":"project-description.project-description-1.activity",
                "required":true,
                "displayAs":"textField",
                "params":{
                  "size":"extra-large",
                  "maxlength":300
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
                  "maxlength":300
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
          "maxlength":2000,
          "size": "large"
        },
        "label":{
          "fi":"Miten hankkeen tavoitteiden toteutumista arvioidaan?",
          "sv":"TODO Hur kommer man att informera om projektet och hur kommer resultaten att spridas?"
        },
        "helpText": {
          "fi": "Kuvaa hankkeen konkreettinen arviointisuunnitelma.",
          "sv": "TODO"
        }
      },
      {
        "type": "formField",
        "id":"project-effectiveness",
        "required":true,
        "displayAs":"textArea",
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
        "type": "formField",
        "id":"project-spreading-plan",
        "required":true,
        "displayAs":"textArea",
        "params":{
          "maxlength":2000,
          "size": "large"
        },
        "label":{
          "fi":"Hankkeen levittämissuunnitelma",
          "sv":"Projektets spridningsplan"
        },
        "helpText": {
          "fi": "Kuvaa hankkeen levittämissuunnitelma etenkin kohderyhmien, menetelmien ja tulosten osalta.",
          "sv": "TODO"
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
          "sv":"inledandet av projektet"
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
          "sv":"Avslutandet av projektet"
        }
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
        "type": "formField",
        "id":"vat-included",
        "required":false,
        "displayAs":"radioButton",
        "label":{
          "fi":"Onko kustannukset ilmoitettu arvonlisäverollisina?",
          "sv":"Har kostnaderna anmälts inkl. mervärdesskatt?"
        },
        "helpText": {
          "fi": "Arvonlisävero on hyväksyttävä kustannus, jos se jää hakijan lopulliseksi kustannukseksi. Yhteishankkeissa, mikäli yhdelläkin osatoteuttajalla arvonlisävero jää osatoteuttajan maksettavaksi, on päähakijan valittavat vaihtoehto \"kyllä\"",
          "sv": "Mervärdesskatt är en godtagbar kostnad, om den blir en slutlig kostnad för sökanden. Om en enda delgenomförare i ett samprojekt betalar mervärdesskatten, ska huvudsökanden välja alternativet ”ja”."
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
                "id":"coordination-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Yhteishankkeen koordinaatiokustannukset",
                  "sv":"Koordineringskostnaderna för ett samprojekt"
                },
                "helpText":{
                  "fi": "Helptest",
                  "sv": "Helptest"
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
                    "required":true,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-extra-small",
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
                  "sv":"Personalkostnader"
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
                    "required":true,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-extra-small",
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
                  "sv":"Köp av tjänster"
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
                    "required":true,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-extra-small",
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
                  "sv":"Materialkostnader"
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
                    "required":true,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-extra-small",
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
                  "sv":"Hyror"
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
                    "required":true,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-extra-small",
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
                  "sv":"Anskaffning av data- och annan utrustning"
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
                    "required":true,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-extra-small",
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
                  "sv":"Resekostnader"
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
                    "required":true,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-extra-small",
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
                  "sv":"Övriga kostnader"
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
                    "required":true,
                    "displayAs":"moneyField",
                    "params":{
                      "size":"extra-extra-small",
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
                  "sv":"Inkomster"
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
                    "required":true,
                    "displayAs":"moneyField",
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
        "fi": "Verkoston toiminta painopisteiden mukaisten tavoitteiden saavuttamiseksi",
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
    "start": "2015-08-19T08:00:00.000+03",
    "end": "2015-09-30T16:15:00.000+03",
    "label": {
      "fi": "Hakuaika",
      "sv": "Ansökningstid"
    }
  },
  "self-financing-percentage": 25
}'
);

COMMIT;
