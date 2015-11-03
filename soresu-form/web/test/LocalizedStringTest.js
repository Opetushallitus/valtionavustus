import jsdom from 'mocha-jsdom'
import { expect } from 'chai'
import translations from './translations.json'
import ReactDOM from 'react-dom'

describe('Localized string', function() {
  jsdom()

  it('has test', function() {
    var React = require('react')
    var TestUtils = require('react-addons-test-utils')
    var LocalizedString = require('../form/component/LocalizedString')

    var string = TestUtils.renderIntoDocument(
      <LocalizedString translations={translations.form} translationKey="lengthleft" lang="fi" />
    )
    var text = TestUtils.findRenderedDOMComponentWithTag(string, 'span');
    expect(ReactDOM.findDOMNode(text).textContent).to.equal("merkkiä jäljellä")
  })
})
