import { expect, test } from '@playwright/test'
import _ from 'lodash'
import FormUtil from '../../../soresu-form/web/form/FormUtil'

test.describe.parallel('Form util', function () {
  test('returns first field matching id', function () {
    const objFoo1 = { id: 'foo-1', content: 'cont' }
    const objFoo = { id: 'foo', children: [objFoo1] }
    const objMan = { id: 'man' }
    const tree: any = { children: [{ id: 'bar' }, objFoo, objMan] }
    expect(FormUtil.findField(tree, 'foo')).toEqual(objFoo)
    expect(FormUtil.findField(tree, 'foo-1')).toEqual(objFoo1)
    expect(FormUtil.findField(tree, 'man')).toEqual(objMan)
    expect(FormUtil.findField(tree, 'nosuch')).toBeNull()
  })

  test('returns index of first field matching id', function () {
    const tree: any = {
      children: [
        { id: 'bar' },
        { id: 'foo', children: [{ id: 'foo-1', content: 'cont' }] },
        { id: 'man' },
      ],
    }
    expect(FormUtil.findIndexOfField(tree, 'foo')).toEqual(3)
    expect(FormUtil.findIndexOfField(tree, 'man')).toEqual(6)
    expect(FormUtil.findIndexOfField(tree, 'foo-1')).toEqual(5)
    expect(FormUtil.findIndexOfField(tree, 'foo-2')).toEqual(-1)
    expect(FormUtil.findIndexOfField(tree, 'nosuch')).toEqual(-1)
  })

  test('returns first field matching type', function () {
    const tree: any = {
      children: [
        {
          id: 'foo1',
          children: [{ id: 'foo2', fieldType: 'vaBudget' }],
        },
        { id: 'foo3' },
      ],
    }
    expect(FormUtil.findFieldByFieldType(tree, 'vaBudget')).toEqual({
      id: 'foo2',
      fieldType: 'vaBudget',
    })
  })

  test.describe('Finding first matching field, ignoring identifier index suffix', function () {
    test('returns found object when ids match exactly, when id does not have index suffix', function () {
      const obj1 = { id: 'foo2', content: 'cont' }
      const obj2 = { id: 'bar' }
      const tree: any = {
        children: [{ id: 'foo', children: [obj1] }, obj2],
      }
      expect(FormUtil.findFieldIgnoringIndex(tree, 'foo2')).toEqual(obj1)
      expect(FormUtil.findFieldIgnoringIndex(tree, 'bar')).toEqual(obj2)
    })

    test('returns found root object when id with suffix matches to root id without index suffix', function () {
      const obj = { id: 'foo', children: [{ id: 'foo-1', content: 'cont' }] }
      const tree: any = {
        children: [obj, { id: 'bar' }],
      }
      expect(FormUtil.findFieldIgnoringIndex(tree, 'foo-1')).toEqual(obj)
      expect(FormUtil.findFieldIgnoringIndex(tree, 'foo-2')).toEqual(obj)
    })

    test('returns first found root object', function () {
      const obj = {
        id: 'foo-1',
        children: [{ id: 'foo-1-1', content: 'cont' }],
      }
      const tree: any = {
        children: [obj, { id: 'foo-1' }],
      }
      expect(FormUtil.findFieldIgnoringIndex(tree, 'foo-1')).toEqual(obj)
      expect(FormUtil.findFieldIgnoringIndex(tree, 'foo')).toEqual(obj)
    })

    test('returns null when no ids match', function () {
      const tree: any = {
        children: [{ id: 'bar' }],
      }
      expect(FormUtil.findFieldIgnoringIndex(tree, 'foo')).toBeNull()
    })
  })

  test('returns first field having child with matching id', function () {
    const tree: any = {
      children: [
        {
          id: 'foo1',
          children: [
            { id: 'foo21', content: 'cont' },
            { id: 'foo22', content: 'cont' },
          ],
        },
      ],
    }
    expect(FormUtil.findFieldWithDirectChild(tree, 'foo22')).toEqual({
      id: 'foo1',
      children: [
        { id: 'foo21', content: 'cont' },
        { id: 'foo22', content: 'cont' },
      ],
    })
  })

  test.describe('finding index of child field according to field specification', function () {
    const parentFieldChildrenSpec: any = [
      {
        label: {
          fi: 'Hankkeen nimi',
          sv: 'Projektets namn',
        },
        fieldClass: 'formField',
        helpText: {
          fi: '',
          sv: '',
        },
        id: 'project-name',
        params: {
          size: 'large',
          maxlength: 200,
        },
        required: true,
        fieldType: 'textField',
      },
      {
        label: {
          fi: 'Asiointikieli',
          sv: 'Projektets språk',
        },
        fieldClass: 'formField',
        helpText: {
          fi: '',
          sv: '',
        },
        id: 'language',
        options: [
          {
            value: 'fi',
            label: {
              fi: 'Suomi',
              sv: 'Finska',
            },
          },
          {
            value: 'sv',
            label: {
              fi: 'Ruotsi',
              sv: 'Svenska',
            },
          },
        ],
        required: true,
        fieldType: 'radioButton',
      },
      {
        label: {
          fi: 'Onko kyseessä yhteishanke',
          sv: 'Är projektet ett samprojekt',
        },
        fieldClass: 'formField',
        helpText: {
          fi: '',
          sv: '',
        },
        id: 'combined-effort',
        options: [
          {
            value: 'yes',
            label: {
              fi: 'Kyllä',
              sv: 'Ja',
            },
          },
          {
            value: 'no',
            label: {
              fi: 'Ei',
              sv: 'Nej',
            },
          },
        ],
        required: true,
        fieldType: 'radioButton',
      },
      {
        fieldClass: 'wrapperElement',
        id: 'other-organizations',
        fieldType: 'growingFieldset',
        children: [
          {
            fieldClass: 'wrapperElement',
            id: 'other-organizations-1',
            fieldType: 'growingFieldsetChild',
            children: [
              {
                label: {
                  fi: 'Hankkeen muut organisaatiot',
                  sv: 'Övriga samarbetspartner',
                },
                fieldClass: 'formField',
                helpText: {
                  fi: '',
                  sv: '',
                },
                id: 'other-organizations.other-organizations-1.name',
                params: {
                  size: 'large',
                  maxlength: 80,
                },
                required: true,
                fieldType: 'textField',
              },
              {
                label: {
                  fi: 'Yhteyshenkilön sähköposti',
                  sv: 'Kontaktpersonens e-postadress',
                },
                fieldClass: 'formField',
                helpText: {
                  fi: '',
                  sv: '',
                },
                id: 'other-organizations.other-organizations-1.email',
                params: {
                  size: 'small',
                  maxlength: 80,
                },
                required: true,
                fieldType: 'emailField',
              },
            ],
          },
        ],
        params: {
          showOnlyFirstLabels: true,
        },
      },
      {
        label: {
          fi: 'Muut yhteistyökumppanit',
          sv: 'Övriga samarbetspartner',
        },
        fieldClass: 'formField',
        helpText: {
          fi: '',
          sv: '',
        },
        id: 'other-partners',
        params: {
          maxlength: 1000,
        },
        required: false,
        fieldType: 'textArea',
      },
    ]

    const parentFieldChildren: any = [
      {
        label: {
          fi: 'Hankkeen nimi',
          sv: 'Projektets namn',
        },
        fieldClass: 'formField',
        helpText: {
          fi: '',
          sv: '',
        },
        id: 'project-name',
        params: {
          size: 'large',
          maxlength: 200,
        },
        required: true,
        fieldType: 'textField',
      },
      {
        label: {
          fi: 'Asiointikieli',
          sv: 'Projektets språk',
        },
        fieldClass: 'formField',
        helpText: {
          fi: '',
          sv: '',
        },
        id: 'language',
        options: [
          {
            value: 'fi',
            label: {
              fi: 'Suomi',
              sv: 'Finska',
            },
          },
          {
            value: 'sv',
            label: {
              fi: 'Ruotsi',
              sv: 'Svenska',
            },
          },
        ],
        required: true,
        fieldType: 'radioButton',
      },
      {
        label: {
          fi: 'Onko kyseessä yhteishanke',
          sv: 'Är projektet ett samprojekt',
        },
        fieldClass: 'formField',
        helpText: {
          fi: '',
          sv: '',
        },
        id: 'combined-effort',
        options: [
          {
            value: 'yes',
            label: {
              fi: 'Kyllä',
              sv: 'Ja',
            },
          },
          {
            value: 'no',
            label: {
              fi: 'Ei',
              sv: 'Nej',
            },
          },
        ],
        required: true,
        fieldType: 'radioButton',
      },
      {
        label: {
          fi: 'Muut yhteistyökumppanit',
          sv: 'Övriga samarbetspartner',
        },
        fieldClass: 'formField',
        helpText: {
          fi: '',
          sv: '',
        },
        id: 'other-partners',
        params: {
          maxlength: 1000,
        },
        required: false,
        fieldType: 'textArea',
      },
    ]

    test('returns index of found children', function () {
      expect(
        FormUtil.findChildIndexAccordingToFieldSpecification(
          parentFieldChildrenSpec,
          parentFieldChildren,
          'other-organizations'
        )
      ).toEqual(3)
    })

    test('returns 0 when not found', function () {
      expect(
        FormUtil.findChildIndexAccordingToFieldSpecification(
          parentFieldChildrenSpec,
          parentFieldChildren,
          'nosuch'
        )
      ).toEqual(0)
    })
  })

  test('returns the growing fieldset by the id of a child element', function () {
    const calcId = 'alphakoulutusosiot.alphakoulutusosio-1.koulutettavapaivat'
    const growingFieldSet = {
      id: 'koulutusosiot',
      children: [
        {
          id: 'koulutusosio-1',
          children: [
            {
              id: calcId,
              fieldType: 'vaTraineeDayCalculator',
              fieldClass: 'formField',
            },
          ],
          fieldType: 'growingFieldsetChild',
          fieldClass: 'wrapperElement',
        },
      ],
      fieldType: 'growingFieldset',
      fieldClass: 'wrapperElement',
    }

    const tree: any = [
      {
        id: 'koulutusosiot-theme',
        children: [growingFieldSet],
      },
    ]

    expect(FormUtil.findGrowingParent(tree, calcId)).toEqual(growingFieldSet)
  })

  test('returns predicate for checking if id is same or same if ignoring index', () => {
    _.forEach(
      [
        ['foo', 'foo', true],
        ['foo-1', 'foo-1', true],
        ['foo-1', 'foo-2', true],
        ['foo-2', 'foo-1', true],
        ['foo-1', 'foo', true],
        ['foo', 'foo-1', true],

        ['foo.bar', 'foo.bar', true],

        ['foo.bar-1', 'foo.bar-1', true],
        ['foo.bar', 'foo.bar-1', true],
        ['foo.bar-1', 'foo.bar', true],

        ['foo-1.bar-1', 'foo-1.bar-1', true],

        ['foo-1.bar-1', 'foo.bar-1', true],
        ['foo-1.bar-1', 'foo-1.bar', true],
        ['foo-1.bar-1', 'foo.bar', true],

        ['foo.bar-1', 'foo-1.bar-1', true],
        ['foo-1.bar', 'foo-1.bar-1', true],
        ['foo.bar', 'foo-1.bar-1', true],

        ['foo.bar', 'foo.man', false],
        ['', 'foo', false],
        ['foo', '', false],
        ['', '', true],
        [null, null, true],
        [undefined, undefined, true],
        [null, '', false],
        [null, undefined, false],
        [undefined, null, false],
        [undefined, '', false],
      ],
      ([findId, fieldId, expected]) => {
        expect(
          FormUtil.idIsSameOrSameIfIndexIgnoredPredicate(findId as any)({
            id: fieldId,
          } as any)
        ).toEqual(expected)
      }
    )
  })

  test('returns id without index', function () {
    expect(FormUtil.withOutIndex('foo.man-1.bar_zap-2')).toEqual('foo.man.bar_zap')
  })

  test.describe('Deep-merging field trees', function () {
    test('merges two trees', function () {
      const a: any = {
        children: [
          { id: '1-a' },
          {
            id: '1-c',
            children: [{ id: '2-a' }],
          },
        ],
      }
      const b: any = {
        children: [
          {
            id: '1-c',
            children: [{ id: '2-b' }],
          },
          { id: '1-b' },
        ],
      }
      const c: any = {
        children: [
          { id: '1-a' },
          {
            id: '1-c',
            children: [{ id: '2-a' }, { id: '2-b' }],
          },
          { id: '1-b' },
        ],
      }
      expect(FormUtil.mergeDeepFieldTrees(a, b)).toEqual(c)
    })

    test('returns new copy', function () {
      const a: any = { children: [{ id: '1-a' }] }
      const aCopy = _.cloneDeep(a)
      const b: any = { children: [{ id: '1-b' }] }
      const bCopy = _.cloneDeep(b)
      const c = FormUtil.mergeDeepFieldTrees(a, b)
      expect(c).not.toEqual(a)
      expect(c).not.toEqual(b)
      expect(a).toEqual(aCopy)
      expect(b).toEqual(bCopy)
    })

    test('ignores empty source object', function () {
      const tree: any = {
        children: [
          { id: '1-a' },
          {
            id: '1-c',
            children: [{ id: '2-a' }],
          },
        ],
      }
      expect(FormUtil.mergeDeepFieldTrees(tree, {})).toEqual(tree)
    })

    test('merges three trees', function () {
      const a: any = {
        children: [
          { id: '1-a' },
          {
            id: '1-d',
            children: [{ id: '2-a' }, { id: '2-d' }],
          },
        ],
      }
      const b: any = {
        children: [
          {
            id: '1-d',
            children: [
              { id: '2-b' },
              {
                id: '2-d',
                children: [{ id: '3-b' }],
              },
            ],
          },
          { id: '1-b' },
        ],
      }
      const c: any = {
        children: [
          { id: '1-c' },
          {
            id: '1-d',
            children: [
              {
                id: '2-d',
                children: [{ id: '3-c' }],
              },
              { id: '2-c' },
            ],
          },
        ],
      }
      const d = {
        children: [
          { id: '1-a' },
          {
            id: '1-d',
            children: [
              { id: '2-a' },
              {
                id: '2-d',
                children: [{ id: '3-b' }, { id: '3-c' }],
              },
              { id: '2-b' },
              { id: '2-c' },
            ],
          },
          { id: '1-b' },
          { id: '1-c' },
        ],
      }
      expect(FormUtil.mergeDeepFieldTrees(a, b, c)).toEqual(d)
    })
  })
})
