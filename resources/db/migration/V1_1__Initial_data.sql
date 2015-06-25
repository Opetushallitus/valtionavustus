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
              "size":50,
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
              "size":30,
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
              "size":50,
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
              "size":30,
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
              "size":50,
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
              "size":30,
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
        "children": [
          {
            "type": "wrapperElement",
            "id":"other-organizations-1",
            "displayAs":"fieldset",
            "children": [
              {
                "type": "formField",
                "id":"other-organizations-1-name-1",
                "required":true,
                "displayAs":"textField",
                "params":{
                  "size":50,
                  "maxlength":80
                },
                "label":{
                  "fi":"Hankkeen muut organisaatiot",
                  "sv":"Andra organisation"
                }
              },
              {
                "type": "formField",
                "id":"other-organizations-1-email-1",
                "required":true,
                "displayAs":"emailField",
                "params":{
                  "size":30,
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
        "id":"project-explanation",
        "required":true,
        "displayAs":"textArea",
        "params":{
          "maxlength":2000
        },
        "label":{
          "fi":"Hankkeen tavoitteet, toiminta ja tulokset",
          "sv":"Hur genomförs projektet i praktiken?"
        }
      },
      {
        "type": "formField",
        "id":"project-target",
        "required":true,
        "displayAs":"textField",
        "params":{
          "size":50,
          "maxlength":80
        },
        "label":{
          "fi":"Hankkeen kohderyhmät",
          "sv":"Projektets målgrupp"
        }
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
          "size":50,
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
          "size":10,
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
          "size":10,
          "maxlength":10
        },
        "label":{
          "fi":"Hankkeen päättymisaika",
          "sv":"När slutar projektet"
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
        "fi": "Painopisteet: Laatustrategian toiminnan tuki",
        "sv": "TODO"
      },
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
      "fi":"Painopisteet ja valintaperusteet",
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
  }
}'
);

COMMIT;
