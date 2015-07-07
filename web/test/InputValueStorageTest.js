const _ = require('lodash')
const verboseAssert = require('assert')
import { assert } from 'chai'
const JsUtil = require('../form/JsUtil.js')
const InputValueStorage = require('../form/InputValueStorage.js')

var answersObject = {}

describe('Form input that is', function() {
  beforeEach(() => {
    answersObject = {}
  })

  describe('flat values', function() {
    it('can be read and written', function() {
      InputValueStorage.writeValue(formContent, answersObject, "organization", "Rovaniemen koulutuskuntayhtymä")
      const v = InputValueStorage.readValue(formContent, answersObject, "organization")
      assert.equal(v, 'Rovaniemen koulutuskuntayhtymä')
    })

    it('can be updated', function() {
      InputValueStorage.writeValue(formContent, answersObject, "organization", "Rovaniemen koulutuskuntayhtymä")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "organization"), 'Rovaniemen koulutuskuntayhtymä')
      InputValueStorage.writeValue(formContent, answersObject, "organization", "Rovaniemen koulutuskuntayhtymä (REDU)")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "organization"), 'Rovaniemen koulutuskuntayhtymä (REDU)')
    })
  })

  describe('growing fieldset values', function() {
    it('can be read and written', function() {
      InputValueStorage.writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki, Itä-Lapin ammattiopisto")
      const v = InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name")
      assert.equal(v, "Kemijärven kaupunki, Itä-Lapin ammattiopisto")
    })

    it('can be updated', function() {
      InputValueStorage.writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name"), "Kemijärven kaupunki")

      InputValueStorage.writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki, Itä-Lapin ammattiopisto")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name"), "Kemijärven kaupunki, Itä-Lapin ammattiopisto")
    })

    it('work with several fields in same group', function() {
      InputValueStorage.writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      InputValueStorage.writeValue(formContent, answersObject, "other-organizations.other-organizations-1.email", "kemijarven.kaupunki@example.com")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name"), "Kemijärven kaupunki")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.email"), "kemijarven.kaupunki@example.com")
    })

    it('can delete a row', function() {
      InputValueStorage.writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      InputValueStorage.writeValue(formContent, answersObject, "other-organizations.other-organizations-2.name", "Jokilaaksojen koulutuskuntayhtymä")

      const otherOrganizationsValue = answersObject.value[0].value
      assert.isArray(otherOrganizationsValue)
      assert.lengthOf(otherOrganizationsValue, 2, JSON.stringify(otherOrganizationsValue))

      const growingParentFields = JsUtil.flatFilter(formContent, n => { return n.id === "other-organizations"})
      InputValueStorage.deleteValue(growingParentFields[0], answersObject, "other-organizations-2" )
      assert.lengthOf(otherOrganizationsValue, 1, JSON.stringify(otherOrganizationsValue))
    })

    it("do not produce extra content in answers", function() {
      assert.deepEqual(answersObject, {})
      InputValueStorage.writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      assert.deepEqual(_.keys(answersObject), ["value"])

      const storedRootValue = answersObject.value
      assert.isArray(storedRootValue)
      assert.lengthOf(storedRootValue, 1, JSON.stringify(storedRootValue))
      const otherOrganizationsItem = storedRootValue[0]
      assert.deepEqual(_.keys(otherOrganizationsItem), ["key", "value"])
      assert.deepEqual(otherOrganizationsItem.key, "other-organizations")
      var otherOrganizationsValue = otherOrganizationsItem.value
      assert.isArray(otherOrganizationsValue)
      assert.lengthOf(otherOrganizationsValue, 1, JSON.stringify(otherOrganizationsValue))

      const firstOtherOrganizationValue = otherOrganizationsValue[0]
      verboseAssert.deepEqual(firstOtherOrganizationValue.key, "other-organizations-1")
      assert.isArray(firstOtherOrganizationValue.value)
      assert.lengthOf(firstOtherOrganizationValue.value, 1, JSON.stringify(otherOrganizationsValue))
      verboseAssert.deepEqual(firstOtherOrganizationValue, {"key":"other-organizations-1","value":[
        {"key":"other-organizations.other-organizations-1.name","value":"Kemijärven kaupunki"}
      ]})

      InputValueStorage.writeValue(formContent, answersObject, "other-organizations.other-organizations-1.email", "kemi.jarven@kaupun.ki")
      assert.lengthOf(otherOrganizationsValue, 1, JSON.stringify(otherOrganizationsValue))
      assert.lengthOf(firstOtherOrganizationValue.value, 2, JSON.stringify(otherOrganizationsValue))

      verboseAssert.deepEqual(firstOtherOrganizationValue.value[0].key, "other-organizations.other-organizations-1.name")
      verboseAssert.deepEqual(firstOtherOrganizationValue.value[0].value, "Kemijärven kaupunki")
      verboseAssert.deepEqual(firstOtherOrganizationValue.value[1].key, "other-organizations.other-organizations-1.email")
      verboseAssert.deepEqual(firstOtherOrganizationValue.value[1].value, "kemi.jarven@kaupun.ki")
    })
  })
})

const formContent = [
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
                "id":"other-organizations.other-organizations-1.email",
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
            "id":"other-organizations-2",
            "displayAs":"growingFieldsetChild",
            "children": [
              {
                "type": "formField",
                "id":"other-organizations.other-organizations-2.name",
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
                "id":"other-organizations.other-organizations-2.email",
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
  }
]