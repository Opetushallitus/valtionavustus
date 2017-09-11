import { expect } from 'chai'
import _ from 'lodash'
import FormUtil from '../form/FormUtil'

describe('Form util', function() {
  it('returns first field matching id', function() {
    const tree = {
      children: [
        {
          id: "foo1",
          children: [
            {id: "foo2", content: "cont"}
          ]
        },
        {id: "foo3"}
      ]
    }
    expect(FormUtil.findField(tree, "foo2")).to.eql({id: "foo2", content: "cont"})
  })

  it('returns first field matching type', function() {
    const tree = {
      children: [
        {
          id: "foo1",
          children: [
            {id: "foo2", fieldType: "vaBudget"}
          ]
        },
        {id: "foo3"}
      ]
    }
    expect(FormUtil.findFieldByFieldType(tree, "vaBudget")).to.eql({id: "foo2", fieldType: "vaBudget"})
  })

  describe("Finding first matching field, ignoring id's index suffix", function() {
    it('returns object when ids match exactly', function() {
      const tree = {
        children: [
          {
            id: "foo1",
            children: [
              {id: "foo2", content: "cont"}
            ]
          },
          {id: "foo3"}
        ]
      }
      expect(FormUtil.findFieldIgnoringIndex(tree, "foo2")).to.eql({id: "foo2", content: "cont"})
    })

    it('returns object when ids match, sans index suffix', function() {
      const tree = {
        children: [
          {
            id: "foo1",
            children: [
              {id: "foo2-2", content: "cont"}
            ]
          },
          {id: "foo3"}
        ]
      }
      expect(FormUtil.findFieldIgnoringIndex(tree, "foo2")).to.eql({id: "foo2-2", content: "cont"})
    })
  })

  describe("Finding index of first matching field, ignoring id's index suffix", function() {
    it('returns object when ids match exactly', function() {
      const tree = {
        children: [
          {
            id: "foo1",
            children: [
              {id: "foo2", content: "cont"}
            ]
          },
          {id: "foo3"}
        ]
      }
      expect(FormUtil.findFieldIndex(tree, "foo2")).to.equal(4)
    })

    it('returns index when ids match, sans index suffix', function() {
      const tree = {
        children: [
          {
            id: "foo1",
            children: [
              {id: "foo2-2", content: "cont"}
            ]
          },
          {id: "foo3"}
        ]
      }
      expect(FormUtil.findFieldIndex(tree, "foo2")).to.equal(4)
    })
  })

  it('returns first field having child with matching id', function() {
    const tree = {
      children: [
        {
          id: "foo1",
          children: [
            {id: "foo21", content: "cont"},
            {id: "foo22", content: "cont"}
          ]
        }
      ]
    }
    expect(FormUtil.findFieldWithDirectChild(tree, "foo22")).to.eql({
      id: "foo1",
      children: [
        {id: "foo21", content: "cont"},
        {id: "foo22", content: "cont"}
      ]
    })
  })

  it('returns the growing fieldset by the id of a child element', function() {
    const calcId = "alphakoulutusosiot.alphakoulutusosio-1.koulutettavapaivat"
    const growingFieldSet = {
      id: "koulutusosiot",
      children: [
        {
          id: "koulutusosio-1",
          children: [
            {
              id: calcId,
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

    const tree = [
      {
        id: "koulutusosiot-theme",
        children: [growingFieldSet]
      }
    ]

    expect(FormUtil.findGrowingParent(tree, calcId)).to.equal(growingFieldSet)
  })

  it('returns id without index', function() {
    expect(FormUtil.withOutIndex('foo.man-1.bar_zap-2')).to.equal('foo.man.bar_zap')
  })

  describe('Deep-merging field trees', function() {
    it('merges two trees', function() {
      const a = {
        children: [
          {id: "1-a"},
          {
            id: "1-c",
            children: [
              {id: "2-a"}
            ]
          }
        ]
      }
      const b = {
        children: [
          {
            id: "1-c",
            children: [{id: "2-b"}]
          },
          {id: "1-b"}
        ]
      }
      const c = {
        children: [
          {id: "1-a"},
          {
            id: "1-c",
            children: [{id: "2-a"}, {id: "2-b"}]
          },
          {id: "1-b"}
        ]
      }
      expect(FormUtil.mergeDeepFieldTrees(a, b)).to.eql(c)
    })

    it('returns new copy', function() {
      const a = {children: [{id: "1-a"}]}
      const aCopy = _.cloneDeep(a)
      const b = {children: [{id: "1-b"}]}
      const bCopy = _.cloneDeep(b)
      const c = FormUtil.mergeDeepFieldTrees(a, b)
      expect(c).not.to.equal(a)
      expect(c).not.to.equal(b)
      expect(a).to.eql(aCopy)
      expect(b).to.eql(bCopy)
    })

    it('ignores empty source object', function() {
      const tree = {
        children: [
          {id: "1-a"},
          {
            id: "1-c",
            children: [
              {id: "2-a"}
            ]
          }
        ]
      }
      expect(FormUtil.mergeDeepFieldTrees(tree, {})).to.eql(tree)
    })

    it('merges three trees', function() {
      const a = {
        children: [
          {id: "1-a"},
          {
            id: "1-d",
            children: [
              {id: "2-a"},
              {id: "2-d"}
            ]
          }
        ]
      }
      const b = {
        children: [
          {
            id: "1-d",
            children: [
              {id: "2-b"},
              {
                id: "2-d",
                children: [{id: "3-b"}]
              }
            ]
          },
          {id: "1-b"}
        ]
      }
      const c = {
        children: [
          {id: "1-c"},
          {
            id: "1-d",
            children: [
              {
                id: "2-d",
                children: [{id: "3-c"}]
              },
              {id: "2-c"}
            ]
          }
        ]
      }
      const d = {
        children: [
          {id: "1-a"},
          {
            id: "1-d",
            children: [
              {id: "2-a"},
              {
                id: "2-d",
                children: [
                  {id: "3-b"},
                  {id: "3-c"}
                ]
              },
              {id: "2-b"},
              {id: "2-c"}
            ]
          },
          {id: "1-b"},
          {id: "1-c"}
        ]
      }
      expect(FormUtil.mergeDeepFieldTrees(a, b, c)).to.eql(d)
    })
  })
})
