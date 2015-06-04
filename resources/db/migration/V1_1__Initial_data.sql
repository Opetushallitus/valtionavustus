BEGIN;
insert into forms (content) VALUES ('{
  "name":{
    "fi":"Yleissivistävä koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen",
    "sv":"Stöd för genomförande av kvalitetsstrategin"
  },
  "fields":[
    {
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
      "id":"primary-email",
      "required":true,
      "displayAs":"textField",
      "params":{
        "size":50,
        "maxlength":80
      },
      "label":{
        "fi":"Yhteyshenkilön sähköposti",
        "sv":"Kontaktpersonens e-postadress"
      }
    },
    {
      "id":"signature",
      "required":true,
      "displayAs":"textField",
      "params":{
        "size":50,
        "maxlength":80
      },
      "label":{
        "fi":"Allekirjoitusoikeudellisen henkilön nimi ja tehtävä",
        "sv":"Underskriftgiltiga personens namn och uppgift"
      }
    },
    {
      "id":"signature-email",
      "required":true,
      "displayAs":"textField",
      "params":{
        "size":50,
        "maxlength":80
      },
      "label":{
        "fi":"Sähköposti",
        "sv":"e-postadress"
      }
    },
    {
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
      "id":"combinedEffort",
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
      "id":"other-organization-1",
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
      "id":"other-organization-1-email",
      "required":true,
      "displayAs":"textField",
      "params":{
        "size":50,
        "maxlength":80
      },
      "label":{
        "fi":"Yhteyshenkilön sähköposti",
        "sv":"Kontaktpersonens e-postadress"
      }
    },
    {
      "id":"project-network",
      "required":true,
      "displayAs":"textArea",
      "params":{
        "maxlength":2000
      },
      "label":{
        "fi":"Kerro hankeverkostanne",
        "sv":"Förklara om nätet"
      }
    },
    {
      "id":"project-goals",
      "required":true,
      "displayAs":"textArea",
      "params":{
        "maxlength":2000
      },
      "label":{
        "fi":"Hankkeen tavoitteet",
        "sv":"Projektets mål"
      }
    },
    {
      "id":"project-explanation",
      "required":true,
      "displayAs":"textArea",
      "params":{
        "maxlength":2000
      },
      "label":{
        "fi":"Hankkeen kuvaus",
        "sv":"Hur genomförs projektet i praktiken?"
      }
    },
    {
      "id":"project-target",
      "required":true,
      "displayAs":"textField",
      "params":{
        "size":50,
        "maxlength":80
      },
      "label":{
        "fi":"Hankkeen kohderyhmä",
        "sv":"Projektets målgrupp"
      }
    },
    {
      "id":"project-measure",
      "required":true,
      "displayAs":"textArea",
      "params":{
        "maxlength":2000
      },
      "label":{
        "fi":"Miten hankkeen toteutumista ja vaikuttavuutta arvioidaan?",
        "sv":"Vilka konkreta resultat eftersträvas och hur har man för avsikt att utnyttja dem?"
      }
    },
    {
      "id":"project-announce",
      "required":true,
      "displayAs":"textArea",
      "params":{
        "maxlength":2000
      },
      "label":{
        "fi":"Miten hankkeesta tiedotetaan ja miten tulokset levitetään?",
        "sv":"Hur kommer man att informera om projektet och hur kommer resultaten att spridas?"
      }
    },
    {
      "id":"project-www",
      "required":true,
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
      "id":"project-end",
      "required":true,
      "displayAs":"textField",
      "params":{
        "size":50,
        "maxlength":80
      },
      "label":{
        "fi":"Hankkeen päättymisaika",
        "sv":"När slutar projektet"
      }
    },
    {
      "id":"combined-effort",
      "required":true,
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
}');
COMMIT;
