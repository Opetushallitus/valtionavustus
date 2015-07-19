const _ = require('lodash')
const verboseAssert = require('assert')
import { assert } from 'chai'
const JsUtil = require('../form/JsUtil.js')
const FormErrorSummary = require('../form/component/FormErrorSummary.jsx')
import {TestUtil} from './TestUtil.js'

const formContent = TestUtil.testFormJson()
var validationErrors = {}

describe('Form full of errors', function() {
  beforeEach(() => {
    const allFields = JsUtil.flatFilter(formContent, x => { return !_.isUndefined(x.id)})
    validationErrors = _(allFields).
      map(field => { return { id: field.id, errors: [ { 'error': 'required' } ] }}).
      indexBy('id').
      mapValues('errors').
      value()
  })

  it('gets its summary calculated', function() {
    const fieldsErrorsAndClosestParents = FormErrorSummary.resolveFieldsErrorsAndClosestParents(validationErrors, formContent)
    assert.lengthOf(fieldsErrorsAndClosestParents, 77)
    const privateFinancingIncomeEntry = JsUtil.flatFilter(fieldsErrorsAndClosestParents, n => { return n && n.field && n.field.id === 'private-financing-income-row.amount' })[0]
    assert.equal(privateFinancingIncomeEntry.closestParent.id, 'private-financing-income-row', JSON.stringify(privateFinancingIncomeEntry))
    assert.equal(privateFinancingIncomeEntry.errors[0].error, 'required', JSON.stringify(privateFinancingIncomeEntry))
  })
})
