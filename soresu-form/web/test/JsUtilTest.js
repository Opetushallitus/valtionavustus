import { expect } from 'chai'
import _ from 'lodash'
import JsUtil from '../JsUtil'

describe('Js util', function() {
  it('collects objects matching a predicate', function() {
    const found = JsUtil.flatFilter(Tree, el => /id-\d+/.test(el.id))
    expect(found).to.eql([
      {id: 'id-1'},
      {id: 'id-2'},
      {id: 'id-3', token: Token},
      {id: 'id-4'}
    ])
  })

  it('finds first matching object', function() {
    const object = JsUtil.findFirst(Tree, el => el.token === Token)
    expect(object).to.eql({id: 'id-3', token: Token})
  })

  it('finds index of first matching object', function() {
    const index = JsUtil.findIndexOfFirst(Tree, el => el.token === Token)
    expect(index).to.equal(TraversingStepsToToken - 1)
  })

  describe('finding json node containing id', function() {
    it('finds node', function() {
      const toBeFound = {id: 'id-b', children: [{id: 'id-b1'}, {id: 'id-b2'}]}
      const tree = {a: {id: 'id-a'}, b: toBeFound}
      const node = JsUtil.findJsonNodeContainingId(tree, 'id-b2')
      expect(node).to.equal(toBeFound)
    })

    it('throws exception if json tree contains searched id in different subtrees', function() {
      const tree = {a: {id: 'id'}, b: {id: 'id'}}
      const expectedMsg = 'Cannot handle case with 2 parents ([{"id":"id"},{"id":"id"}]), expected a single one. fieldId=id'
      expect(function() { JsUtil.findJsonNodeContainingId(tree, 'id') }).to.throw(expectedMsg)
    })
  })
})

const Token = 'find me'

const TraversingStepsToToken = 13

const Tree = {
  a1: {
    a2a: [
      {a3a: {id: 'id-1'}},
      {a3b: {id: 'id-2'}}
    ],
    a2b: {id: 'id-foo'}
  },
  b1: [
    {
      b2a: [
        {b3a: {id: 'id-3', token: Token}},
        {b3a: {id: 'id-4'}}
      ]
    }
  ]
}
