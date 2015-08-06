import React from 'react'
import QueryString from 'query-string'
import Bacon from 'baconjs'

import style from '../form/style/main.less'
import loginStyle from './style/va-login.less'

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
    this.state = {email: ""}
  }

  handleEmailChange(event) {
    this.setState({
      email: event.target.value
    })
  }

  render() {
    const model = this.props.model
    const lang = model.lang
    const translations = model.translations
    const content = model.avustushaku.content
    const email = this.state.email
    function doSubmit() {
      const url = urlCreator.newEntityApiUrl(model)
      try {
        HttpUtil.put(url, {
              value: [{key:"primary-email", value: email},{key:"language", value: lang}]
            })
            .then(function(response) {
              console.log("Hakemus created. Response=", JSON.stringify(response))
            })
            .catch(function(response) {
              console.error("PUT error to", url, ". Response=", JSON.stringify(response))
            })
      }
      catch(error) {
        console.error("PUT error to", url, ". Error=", error)
      }
    }

    return <div>
      <VaLoginTopbar translations={translations} lang={lang} />
      <section id="container" className="soresu-fieldset">
        <H1InfoElement htmlId="name" lang={lang} values={content} />
        <EndOfDateRangeInfoElement htmlId="duration" translations={translations} translationKey="label" lang={lang} values={content} />
        <h2><LocalizedString translations={translations.login} translationKey="heading" lang={lang} /></h2>
        <EmailTextField htmlId="primary-email" onChange={this.handleEmailChange.bind(this)} translations={translations.login} value={email} translationKey="contact-email" lang={lang} required="true" size="small" maxLength="80" />
        <TextButton htmlId="submit" onClick={doSubmit} translations={translations.login} translationKey="submit" lang={lang} />
        <div className="message-container"><LocalizedString className="message" translations={translations.login} translationKey="message" lang={lang} /></div>
      </section>
    </div>
  }
}

const urlCreator = new VaUrlCreator()
const query = QueryString.parse(location.search)
const translationsP = Bacon.fromPromise(HttpUtil.get("/translations.json"))
const avustusHakuP = Bacon.fromPromise(HttpUtil.get(urlCreator.avustusHakuApiUrl(query.avustushaku || 1)))

const initialStateTemplate = {
  translations: translationsP,
  lang: query.lang || "fi",
  avustushaku: avustusHakuP
}
const initialState = Bacon.combineTemplate(initialStateTemplate)

initialState.onValue(function(state) {
  const properties = { model: state}
  React.render(React.createElement(VaLogin, properties), document.getElementById('app'))
})
