import { expect } from 'chai'

import VaTraineeDayUtil from '../va/VaTraineeDayUtil'

describe('VA trainee day utilities', function() {
  it('finds subfield by id', function() {
    const subfield = {
      key: "koulutusosiot.koulutusosio-2.koulutettavapaivat.scope-type",
      value: "kp",
      fieldType: "radioButton"
    }

    const field = {
      key: "koulutusosiot.koulutusosio-2.koulutettavapaivat",
      value: [
        {
          key: "koulutusosiot.koulutusosio-2.koulutettavapaivat.person-count",
          value: "20",
          fieldType: "textField"
        },
        {
          key: "koulutusosiot.koulutusosio-2.koulutettavapaivat.scope",
          value: "5",
          fieldType: "textField"
        },
        subfield,
        {
          key: "koulutusosiot.koulutusosio-2.koulutettavapaivat.total",
          value: "100,0",
          fieldType: "textField"
        }
      ],
      fieldType: "vaTraineeDayCalculator"
    }

    const found = VaTraineeDayUtil.findSubfieldById(field.value, "koulutusosiot.koulutusosio-2.koulutettavapaivat", "scope-type")

    expect(found).to.equal(subfield)
  })

  describe('collecting calculator specifications', function() {
    const makeFormSpec = calcSpecs => calcSpecs.map(({
      growingFieldsetId,
      growingFieldsetChildId,
      calcFieldId,
      fiLabel
    }) => {
      return {
        id: growingFieldsetId,
        children: [
          {
            id: growingFieldsetChildId,
            children: [
              {
                id: calcFieldId,
                label: {
                  fi: fiLabel
                },
                fieldType: "vaTraineeDayCalculator",
                fieldClass: "formField"
              }
            ],
            fieldType: "growingFieldsetChild",
            fieldClass: "wrapperElement"
          }
        ],
        fieldType: "growingFieldset",
        fieldClass: "wrapperElement"
      }
    })

    const makeAnswers = keyIds => {
      return {
        value: keyIds.map(keyId => {
          return {
            key: keyId,
            value: [
              {
                key: keyId + ".person-count",
                value: "20",
                fieldType: "textField"
              },
              {
                key: keyId + ".scope",
                value: "5",
                fieldType: "textField"
              },
              {
                key: keyId + ".scope-type",
                value: "kp",
                fieldType: "radioButton"
              },
              {
                key: keyId + ".total",
                value: "100,0",
                fieldType: "textField"
              }
            ],
            fieldType: "vaTraineeDayCalculator"
          }
        })
      }
    }

    it('copies calculator specification from first growing fieldset for each answer key', function() {
      const formSpec = makeFormSpec([{
        growingFieldsetId: "koulutusosiot",
        growingFieldsetChildId: "koulutusosio-1",
        calcFieldId: "koulutusosiot.koulutusosio-1.koulutettavapaivat",
        fiLabel: "Koulutusosio"
      }])

      const answers = makeAnswers(["koulutusosiot.koulutusosio-1.koulutettavapaivat", "koulutusosiot.koulutusosio-2.koulutettavapaivat"])

      const specs = VaTraineeDayUtil.collectCalculatorSpecifications(formSpec, answers)

      expect(specs).to.deep.equal([
        {
          id: "koulutusosiot.koulutusosio-1.koulutettavapaivat",
          label: {
            fi: "Koulutusosio"
          },
          fieldType: "vaTraineeDayCalculator",
          fieldClass: "formField"
        },
        {
          id: "koulutusosiot.koulutusosio-2.koulutettavapaivat",
          label: {
            fi: "Koulutusosio"
          },
          fieldType: "vaTraineeDayCalculator",
          fieldClass: "formField"
        }
      ])
    })
  })
})
