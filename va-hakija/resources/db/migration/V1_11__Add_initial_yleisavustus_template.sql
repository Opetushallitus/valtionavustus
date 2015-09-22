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
          }
        ]
      },
      {
        "type": "wrapperElement",
        "id":"arbitrary-attachments",
        "displayAs":"growingFieldset",
        "params":{
          "showOnlyFirstLabels":false
        },
        "label":{
          "fi":"Muut liitteet",
          "sv":"TODO: Muut liitteet"
        },
        "children": [
          {
            "type": "wrapperElement",
            "id":"arbitrary-attachment-1",
            "displayAs":"fieldset",
            "children": [
              {
                "type": "formField",
                "id":"arbitrary-attachments.arbitrary-attachment-1.attachment",
                "required":false,
                "displayAs":"textField",
                "params":{
                  "size":"extra-large",
                  "maxlength":300
                },
                "label":{
                  "fi":"Liitteen nimi",
                  "sv":"TODO: Liitteen nimi"
                }
              }
            ]
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
                  "fi": "Ilmoita kokonaisarvio koordinaatiotyön kustannuksista. Kuvaa selitteessä pääpiirteittäin mistä toiminnasta kustannukset koostuvat.",
                  "sv": "Ge en totaluppskattning av kostnaderna för koordineringsarbetet. Beskriv i förklaringen i allmänna drag den verksamhet av vilken kostnaderna består."
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
                "id":"personnel-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Henkilöstökustannukset",
                  "sv":"Personalkostnader"
                },
                "helpText":{
                  "fi": "Hyväksyttäviä kustannuksia ovat kohtuulliset palkkakustannukset, jotka aiheutuvat suoraan hankkeesta sekä palkan maksusta aiheutuvat erilaiset lakisääteiset henkilöstösivukulut. Hankkeelle osa-aikaisesti työskentelevien henkilöiden työajan käytöstä on tehtävä kokonaistyöajanseuranta ja päiväkohtainen kokonaistyöajanseuranta. Selite kohdassa kerrotaan, kuinka monta henkilöä hankkeessa työskentelee koko- ja osa- aikaisesti.",
                  "sv": "Godtagbara kostnader är skäliga lönekostnader som direkt ansluter sig till genomförandet av projektet och lagstadgade personbikostnader för utbetalning av lönen. Över de personer som arbetar för projektet på deltid ska föras total arbetstidsuppföljning och daglig total arbetstidsuppföljning. I förklaringspunkten ska anges hur många personer som arbetar inom projektet på heltid och på deltid."
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
                "id":"service-purchase-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Palvelujen ostot",
                  "sv":"Köp av tjänster"
                },
                "helpText":{
                  "fi": "Ulkopuolisista palveluntuottajilta ostettavat palvelut.  Hankkeen toteuttamiseen liittyvien asiantuntija- ja koulutuspalvelujen hankintamenot sekä muut maksut välittömästi hankkeen toteuttamiseen liittyvistä ostetuista palveluista ( esim. mainos- ja markkinointikulut). Palvelujen ostoissa on noudatettava lakia julkisista hankinnoista. Selite kohtaan selvitetään, mitä palveluja hankitaan.",
                  "sv": "Tjänster som köps av externa serviceproducenter. Anskaffningsutgifter för sakkunnig- och utbildningstjänster i anslutning till projektets genomförande och övriga avgifter för köpta tjänster som omedelbart ansluter till projektets genomförande (till exempel kostnader för reklam och marknadsföring). Vid köp av tjänster ska lagen om offentlig upphandling följas. I förklaringspunkten utreds vilka tjänster som anskaffas."
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
                "id":"material-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Tarvike- ja materiaalikustannukset",
                  "sv":"Materialkostnader"
                },
                "helpText":{
                  "fi": "Hankkeeseen sisältyvien toimenpiteiden toteuttamiskustannukset. Hankkeen kohderyhmälle järjestettyyn toimintaan liittyvät opetus- ja koulutusmateriaalit. Hankkeen toteutuksen seurantaan liittyvät materiaalikustannukset. Postin ja sähköisen viestinnän hankkeelle kohdistuvat maksut ja puhelinkulut käytetyn työajan suhteessa.",
                  "sv": "Kostnaderna för genomförandet av de åtgärder som ingår i projektet. Undervisnings- och utbildningsmaterial i anslutning till den verksamhet som ordnas för projektets målgrupp. Materialkostnader i anslutning till uppföljningen av projektets genomförande. Avgifter för post och digital kommunikation och telefon som hänför sig till projektet, i förhållande till använd arbetstid."
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
                "id":"rent-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Vuokrat",
                  "sv":"Hyror"
                },
                "helpText":{
                  "fi": "Hankkeen vuokrakuluihin voidaan kirjata koulutuksen toteuttamisessa tarvittavien tilojen todelliset vuokrakulut sekä muut tilavuokrakulut aiheuttamisperiaatteen mukaisesti; esimerkiksi koulutussuunnittelijan työtilan vuokra hankkeessa käytetyn työajan suhteessa. Selitekohdassa kerrotaan, mistä vuokrakuluista on kyse.",
                  "sv": "I projektets hyreskostnader kan antecknas de faktiska hyreskostnaderna för de lokaler som behövs vid genomförandet av utbildningen och övriga hyreskostnader för lokaler enligt upphovsprincipen: till exempel hyran för utbildningsplanerarens arbetsrum i förhållande till den arbetstid som använts för projektet. I förklaringspunkten anges vad för hyreskostnader det handlar om."
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
                "id":"equipment-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Laite- ym. hankinnat",
                  "sv":"Anskaffning av data- och annan utrustning"
                },
                "helpText":{
                  "fi": "Hankkeelle hankittavien laitte ym. hankinnat sekä hankittavien laitteiden asennuksesta aiheutuvat kustannukset. Selite-kohdassa kerrotaan, mitä hankitaan ja mitkä on asennuksesta aiheutuvat kustannukset. Laite ym. hankinnoissa on noudatettava lakia julkisista hankinnoista. (Huom. Kaikissa valtionavustuksissa ei ole sallittua tehdä hankintoja)",
                  "sv": "Anskaffning av data- och annan utrustning för projektet och kostnaderna för montering av utrustningen. I förklaringspunkten berättas vad som anskaffas och vilka monteringskostnaderna är. I anskaffningarna ska lagen om offentlig upphandling följas. (OBS Anskaffningar är inte tillåtna i alla statsunderstöd)"
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
                "id":"steamship-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Matkakustannukset",
                  "sv":"Resekostnader"
                },
                "helpText":{
                  "fi": "Hankkeen henkilöstön kohtuulliset matka-ja majoituskustannukset sekä päivärahat valtion yleisen virka- ja työehtosopimuksen matkustusliitteen mukaisesti.Tehtyjen matkojen on liityttävä oleellisesti hankkeen toteutukseen. Selitekohdassa kerrotaan, mistä matkakustannukset syntyvät. (esim KV-hankkeiden ulkomaan matkat, kokousmatkat tai koulutusmatkat.)",
                  "sv": "Rese- och inkvarteringskostnader för projektpersonalen och dagtraktamenten enligt resebilagan till statens allmänna tjänste- och arbetskollektivavtal. De resor som görs måste på ett väsentligt sätt ansluta sig till projektets genomförande. I förklaringspunkten berättas på vilket sätt resekostnaderna uppstår (till exempel utlandsresor, mötesresor eller utbildningsresor i samband med internationella projekt)."
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
                "id":"other-costs-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":true
                },
                "label":{
                  "fi":"Muut kustannukset",
                  "sv":"Övriga kostnader"
                },
                "helpText":{
                  "fi": "Muut kustannukset-kohtaan kirjataan ne kustannukset, joita ei kirjata muille tililuokille. Kohtaan voi kirjata esim. puhelimesta tai tilavuokrista aiheutuneet menot, jos niitä ei ole esitetty välittöminä menoina.  Muita kuluja, jota tähän kohtaan voi kirjata ovat tarjoilusta tai tilojen vuokrauksesta aiheutuneet kustannukset tai ohjelmistojen käyttömaksut.",
                  "sv": "I punkten Övriga kostnader antecknas sådana kostnader som inte antecknas i de övriga kontoklasserna. I punkten kan antecknas t.ex. utgifter för telefon och lokalhyror, om dessa inte har antecknats som omedelbara utgifter. Andra kostnader som kan meddelas i denna punkt är till exempel kostnader för traktering eller lokalhyrning eller avgifter för användning av program."
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
                "id":"project-incomes-row",
                "displayAs":"vaBudgetItemElement",
                "params":{
                  "incrementsTotal":false
                },
                "label":{
                  "fi":"Hankkeen tulot",
                  "sv":"Inkomster"
                },
                "helpText":{
                  "fi": "Hankkeen toiminnasta aiheutuvat tulot (esim. tuotteiden myyntitulot, pääsyliput yms.) sekä ennakoidut että ennakoimattomat.",
                  "sv": "Inkomster för projektets verksamhet (till exempel försäljningsinkomster för produkter, inträdesavgifter osv), både förutsedda och oförutsedda."
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
