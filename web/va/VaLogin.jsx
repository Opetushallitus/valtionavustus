import React from 'react'
import QueryString from 'query-string'
import Bacon from 'baconjs'

import style from '../form/style/main.less'
import vaStyle from './style/soresu-va.less'

import VaLoginTopbar from './VaLoginTopbar.jsx'
import VaUrlCreator from './VaUrlCreator.js'

import HttpUtil from '../form/HttpUtil'
import LocalizedString from '../form/component/LocalizedString.jsx'
import EmailTextField from '../form/component/EmailTextField.jsx'
import TextButton from '../form/component/TextButton.jsx'
import {EndOfDateRangeInfoElement, H1InfoElement} from '../form/component/InfoElement.jsx'


export default class VaLogin extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const lang = this.props.lang
    const translations = this.props.translations

    return <div>
      <VaLoginTopbar {...this.props} />
      <section id="container" className="soresu-fieldset">
        <H1InfoElement htmlId="name" lang={ lang} values={this.props.content} />
        <EndOfDateRangeInfoElement htmlId="duration" translations={ translations} translationKey="label" lang={lang} values={this.props.content} />
        <h2><LocalizedString translations={translations.login} translationKey="heading" lang={lang} /></h2>
        <EmailTextField htmlId="primary-email" translations={translations.login} translationKey="contact-email" lang={lang} required="true" size="small" maxLength="80" />
        <TextButton htmlId="submit" translations={translations.login} translationKey="submit" lang={lang} />
      </section>
    </div>
  }
}

const urlCreator = new VaUrlCreator()

const query = QueryString.parse(location.search)
const translationsP = Bacon.fromPromise(HttpUtil.get("/translations.json"))
const avustusHakuP = Bacon.fromPromise(HttpUtil.get(urlCreator.avustusHakuApiUrl(query.avustushaku || 1)))

const initialStateTemplate = { translations: translationsP, lang: query.lang || "fi", avustushaku: avustusHakuP }
const initialState = Bacon.combineTemplate(initialStateTemplate)

initialState.onValue(function(state) {
  const content = state.avustushaku.content
  const properties = { translations: state.translations, lang: state.lang, content: content }
  React.render(React.createElement(VaLogin, properties), document.getElementById('app'))
})
