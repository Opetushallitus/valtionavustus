import _ from 'lodash'
import JsUtil from '../../../soresu-form/web/JsUtil'
import InputValueStorage from '../../../soresu-form/web/form/InputValueStorage'
import TestUtil from './TestUtil'
import { test, expect } from '@playwright/test'
const formContent = TestUtil.testFormJson()

function writeValue(
  form: any,
  answers: any,
  fieldId: string,
  value: string | string[] | string[][]
) {
  InputValueStorage.writeValue(form, answers, {
    id: fieldId,
    field: _.head(
      JsUtil.flatFilter(formContent, (n: any) => {
        return n.id === fieldId
      })
    ),
    value: value,
  })
}

test.describe.serial('Input value storage', function () {
  let answersObject: any = {}

  test.beforeEach(function () {
    answersObject = {}
  })

  test('reading returns empty string for value not found', function () {
    expect(InputValueStorage.readValue(null, answersObject, 'nosuchid')).toEqual('')
  })

  test.describe('flat value', function () {
    test('writes and reads', function () {
      writeValue(formContent, answersObject, 'organization', 'Rovaniemen koulutuskuntayhtymä')
      const v = InputValueStorage.readValue(formContent, answersObject, 'organization')
      expect(v).toEqual('Rovaniemen koulutuskuntayhtymä')
    })

    test('can be updated', function () {
      writeValue(formContent, answersObject, 'organization', 'Rovaniemen koulutuskuntayhtymä')
      expect(InputValueStorage.readValue(formContent, answersObject, 'organization')).toEqual(
        'Rovaniemen koulutuskuntayhtymä'
      )
      writeValue(
        formContent,
        answersObject,
        'organization',
        'Rovaniemen koulutuskuntayhtymä (REDU)'
      )
      expect(InputValueStorage.readValue(formContent, answersObject, 'organization')).toEqual(
        'Rovaniemen koulutuskuntayhtymä (REDU)'
      )
    })
  })

  test.describe('checkbox with multiple values', function () {
    test('writes and reads', function () {
      writeValue(formContent, answersObject, 'checkboxButton-0', ['sininen', 'punainen'])
      expect(answersObject).toEqual({
        value: [
          {
            key: 'checkboxButton-0',
            value: ['sininen', 'punainen'],
            fieldType: 'checkboxButton',
          },
        ],
      })
      expect(InputValueStorage.readValue(formContent, answersObject, 'checkboxButton-0')).toEqual([
        'punainen',
        'sininen',
      ])
    })

    test('does not mutate answers object when reading and sorting', function () {
      writeValue(formContent, answersObject, 'checkboxButton-0', ['sininen', 'punainen'])
      const expectedAnswersObject = {
        value: [
          {
            key: 'checkboxButton-0',
            value: ['sininen', 'punainen'],
            fieldType: 'checkboxButton',
          },
        ],
      }
      expect(answersObject).toEqual(expectedAnswersObject)
      InputValueStorage.readValue(formContent, answersObject, 'checkboxButton-0')
      expect(answersObject).toEqual(expectedAnswersObject)
    })
  })

  test.describe('growing fieldset values', function () {
    test('writes and reads', function () {
      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.name',
        'Kemijärven kaupunki'
      )
      expect(answersObject).toEqual({
        value: [
          {
            key: 'other-organizations',
            value: [
              {
                key: 'other-organizations-1',
                value: [
                  {
                    key: 'other-organizations.other-organizations-1.name',
                    value: 'Kemijärven kaupunki',
                    fieldType: 'textField',
                  },
                ],
                fieldType: 'growingFieldsetChild',
              },
            ],
            fieldType: 'growingFieldset',
          },
        ],
      })

      expect(
        InputValueStorage.readValue(formContent, answersObject, 'other-organizations')
      ).toEqual([
        {
          key: 'other-organizations-1',
          value: [
            {
              key: 'other-organizations.other-organizations-1.name',
              value: 'Kemijärven kaupunki',
              fieldType: 'textField',
            },
          ],
          fieldType: 'growingFieldsetChild',
        },
      ])

      expect(
        InputValueStorage.readValue(formContent, answersObject, 'other-organizations-1')
      ).toEqual([
        {
          key: 'other-organizations.other-organizations-1.name',
          value: 'Kemijärven kaupunki',
          fieldType: 'textField',
        },
      ])

      expect(
        InputValueStorage.readValue(
          formContent,
          answersObject,
          'other-organizations.other-organizations-1.name'
        )
      ).toEqual('Kemijärven kaupunki')
    })

    test('updates', function () {
      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.name',
        'Kemijärven kaupunki'
      )
      expect(
        InputValueStorage.readValue(
          formContent,
          answersObject,
          'other-organizations.other-organizations-1.name'
        )
      ).toEqual('Kemijärven kaupunki')

      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.name',
        'Kemijärven kaupunki, Itä-Lapin ammattiopisto'
      )
      expect(
        InputValueStorage.readValue(
          formContent,
          answersObject,
          'other-organizations.other-organizations-1.name'
        )
      ).toEqual('Kemijärven kaupunki, Itä-Lapin ammattiopisto')
    })

    test('work with several fields in the same group', function () {
      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.name',
        'Kemijärven kaupunki'
      )
      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.email',
        'kemijarven.kaupunki@example.com'
      )
      expect(
        InputValueStorage.readValue(
          formContent,
          answersObject,
          'other-organizations.other-organizations-1.name'
        )
      ).toEqual('Kemijärven kaupunki')
      expect(
        InputValueStorage.readValue(
          formContent,
          answersObject,
          'other-organizations.other-organizations-1.email'
        )
      ).toEqual('kemijarven.kaupunki@example.com')
    })

    test('sorts subfields in the same group when reading', function () {
      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.name',
        'Kemijärven kaupunki'
      )
      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.email',
        'kemijarven.kaupunki@example.com'
      )
      expect(answersObject).toEqual({
        value: [
          {
            key: 'other-organizations',
            value: [
              {
                key: 'other-organizations-1',
                value: [
                  {
                    key: 'other-organizations.other-organizations-1.name',
                    value: 'Kemijärven kaupunki',
                    fieldType: 'textField',
                  },
                  {
                    key: 'other-organizations.other-organizations-1.email',
                    value: 'kemijarven.kaupunki@example.com',
                    fieldType: 'emailField',
                  },
                ],
                fieldType: 'growingFieldsetChild',
              },
            ],
            fieldType: 'growingFieldset',
          },
        ],
      })
      expect(InputValueStorage.readValue(null, answersObject, 'other-organizations-1')).toEqual([
        {
          key: 'other-organizations.other-organizations-1.email',
          value: 'kemijarven.kaupunki@example.com',
          fieldType: 'emailField',
        },
        {
          key: 'other-organizations.other-organizations-1.name',
          value: 'Kemijärven kaupunki',
          fieldType: 'textField',
        },
      ])
    })

    test('does not mutate answers object when reading and sorting subfields in the same group', function () {
      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.name',
        'Kemijärven kaupunki'
      )
      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.email',
        'kemijarven.kaupunki@example.com'
      )
      const expectedAnswersObject = {
        value: [
          {
            key: 'other-organizations',
            value: [
              {
                key: 'other-organizations-1',
                value: [
                  {
                    key: 'other-organizations.other-organizations-1.name',
                    value: 'Kemijärven kaupunki',
                    fieldType: 'textField',
                  },
                  {
                    key: 'other-organizations.other-organizations-1.email',
                    value: 'kemijarven.kaupunki@example.com',
                    fieldType: 'emailField',
                  },
                ],
                fieldType: 'growingFieldsetChild',
              },
            ],
            fieldType: 'growingFieldset',
          },
        ],
      }
      expect(answersObject).toEqual(expectedAnswersObject)
      InputValueStorage.readValue(null, answersObject, 'other-organizations-1')
      expect(answersObject).toEqual(expectedAnswersObject)
    })

    test('deletes', function () {
      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.name',
        'Kemijärven kaupunki'
      )
      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-2.name',
        'Jokilaaksojen koulutuskuntayhtymä'
      )

      const otherOrganizationsValue = answersObject.value[0].value

      expect(otherOrganizationsValue).toHaveLength(2)

      const growingParentFields = JsUtil.flatFilter(formContent, (n: any) => {
        return n.id === 'other-organizations'
      })
      InputValueStorage.deleteValue(growingParentFields[0], answersObject, 'other-organizations-2')
      expect(otherOrganizationsValue).toHaveLength(1)
    })

    test('does not produce extra content in answers', function () {
      expect(answersObject).toEqual({})
      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.name',
        'Kemijärven kaupunki'
      )
      expect(_.keys(answersObject)).toEqual(['value'])

      const storedRootValue = answersObject.value
      expect(storedRootValue).toHaveLength(1)
      const otherOrganizationsItem = storedRootValue[0]
      expect(_.keys(otherOrganizationsItem)).toEqual(['key', 'value', 'fieldType'])
      expect(otherOrganizationsItem.key).toEqual('other-organizations')
      const otherOrganizationsValue = otherOrganizationsItem.value
      expect(otherOrganizationsValue).toHaveLength(1)

      const firstOtherOrganizationValue = otherOrganizationsValue[0]
      expect(firstOtherOrganizationValue.key).toEqual('other-organizations-1')
      expect(firstOtherOrganizationValue.value).toHaveLength(1)

      expect(firstOtherOrganizationValue).toEqual({
        key: 'other-organizations-1',
        value: [
          {
            key: 'other-organizations.other' + '-organizations-1.name',
            value: 'Kemijärven kaupunki',
            fieldType: 'textField',
          },
        ],
        fieldType: 'growingFieldsetChild',
      })

      writeValue(
        formContent,
        answersObject,
        'other-organizations.other-organizations-1.email',
        'kemi.jarven@kaupun.ki'
      )
      expect(otherOrganizationsValue).toHaveLength(1)

      expect(firstOtherOrganizationValue.value).toHaveLength(2)

      expect(firstOtherOrganizationValue.value[0].key).toEqual(
        'other-organizations.other-organizations-1.name'
      )
      expect(firstOtherOrganizationValue.value[0].value).toEqual('Kemijärven kaupunki')
      expect(firstOtherOrganizationValue.value[0].fieldType).toEqual('textField')
      expect(firstOtherOrganizationValue.value[1].key).toEqual(
        'other-organizations.other-organizations-1.email'
      )
      expect(firstOtherOrganizationValue.value[1].value).toEqual('kemi.jarven@kaupun.ki')
      expect(firstOtherOrganizationValue.value[1].fieldType).toEqual('emailField')
    })
  })

  test.describe('table field value', function () {
    const tableValue = [
      ['b', '20', '200'],
      ['a', '10', '100'],
      ['c', '30', '300'],
    ]

    test('writes and reads', function () {
      writeValue(formContent, answersObject, 'art-courses-plan', tableValue)

      const expectedAnswer = {
        key: 'art-courses-plan',
        value: [
          ['b', '20', '200'],
          ['a', '10', '100'],
          ['c', '30', '300'],
        ],
        fieldType: 'tableField',
      }

      expect(answersObject).toEqual({ value: [expectedAnswer] })
      expect(InputValueStorage.readValue(null, answersObject, 'art-courses-plan')).toEqual(
        expectedAnswer.value
      )
    })
  })
})
