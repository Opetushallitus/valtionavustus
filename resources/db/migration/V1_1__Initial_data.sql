BEGIN;

insert into forms (content) VALUES ('
[
  {
    "type": "infoElement",
    "id": "name",
    "displayAs": "h1"
  },
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
    "type": "formField",
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
    "type": "formField",
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
    "type": "formField",
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
    "type": "formField",
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
    "type": "formField",
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
    "type": "infoElement",
    "id":"selection-criteria",
    "displayAs":"bulletList",
    "params":{
      "initiallyOpen":true
    },
    "label":{
      "fi":"Valintaperusteet",
      "sv":"Urvalskriterier"
    }
  },
  {
    "type": "formField",
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
    "type": "formField",
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
    "type": "formField",
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
    "type": "formField",
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
    "type": "formField",
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
');

INSERT INTO avustushaut (form, content) VALUES (1, '
{
  "name": {
    "fi": "Yleissivistävä koulutus - Ammatillisen peruskoulutuksen laadun kehittäminen",
    "sv": "Stöd för genomförande av kvalitetsstrategin"
  },
  "startDate": "2015-08-12T00:00:00.000Z",
  "endDate": "2015-09-12T17:00:00.000Z",
  "selection-criteria": [
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
      "fi": "Aiempien hankkeiden ja verkostojen välinen hyvien käytäntöken tunnistaminen ja käyttö",
      "sv": "TODO"
    }
  ]
}'
);

COMMIT;
