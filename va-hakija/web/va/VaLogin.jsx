import PolyfillBind from 'va-common/web/polyfill-bind'

import ConsolePolyfill from 'console-polyfill'
import React from 'react'
import QueryString from 'query-string'
import Bacon from 'baconjs'

import common from 'va-common/web/form/style/main.less'
import loginStyle from './style/va-login.less'

import HttpUtil from 'va-common/web/HttpUtil'
import FormUtil from 'va-common/web/form/FormUtil.js'
import LocalizedString from 'va-common/web/form/component/LocalizedString.jsx'
import {DateRangeInfoElement, H1InfoElement} from 'va-common/web/form/component/InfoElement.jsx'
import HelpTooltip from 'va-common/web/form/component/HelpTooltip.jsx'
import TextButton from 'va-common/web/form/component/TextButton.jsx'

import VaLoginTopbar from './VaLoginTopbar.jsx'
import VaUrlCreator from './VaUrlCreator.js'

import SyntaxValidator from '../form/SyntaxValidator.js'
import EmailTextField from '../form/component/EmailTextField.jsx'

export default class VaLogin extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      email: "",
      sent: "",
      error: ""
    }
  }

  handleEmailChange(event) {
    this.setState({
      email: event.target.value,
      sent: ""
    })
  }

  submit(event) {
    event.preventDefault()
    if (SyntaxValidator.validateEmail(this.state.email)) {
      return
    }
    const url = urlCreator.newEntityApiUrl(this.props.model)
    const vaLogin = this
    const email = this.state.email
    const model = this.props.model
    try {
      HttpUtil.put(url, {
        value: [{key:"primary-email", value: email},{key:"language", value: model.lang}]
      })
      .then(function(response) {
        vaLogin.setState({
          sent: email,
          error: ""
        })
        console.log("Hakemus created. Response=", JSON.stringify(response))
        const hakemusId = response.id
        if(hakemusId) {
          window.location = urlCreator.existingSubmissionEditUrl(model.avustushaku.id, hakemusId, model.lang, model.devel)
        }
      })
      .catch(function(response) {
        console.error("PUT error to", url, ". Response=", JSON.stringify(response))
        vaLogin.setState({
          error: "error"
        })
      })
    }
    catch(error) {
      console.error("PUT error to", url, ". Error=", error)
      vaLogin.setState({
        error: "error"
      })
    }
  }

  render() {
    const model = this.props.model
    const lang = model.lang
    const translations = model.translations
    const avustushaku =  model.avustushaku
    const content = avustushaku.content
    const email = this.state.email
    const sent = this.state.sent
    const error = this.state.error
    const emailIsInvalid = () => SyntaxValidator.validateEmail(this.state.email) && this.state.email != ""
    const canSend = () => email === sent || emailIsInvalid()

    return <div>
      <VaLoginTopbar avustushaku={avustushaku} translations={translations} lang={lang} />
      <section id="container" className="soresu-fieldset">
        <H1InfoElement htmlId="name" lang={lang} values={content} />
        <DateRangeInfoElement htmlId="duration" translations={translations} translationKey="label" lang={lang} values={content} />
        <h2><LocalizedString translations={translations.login} translationKey="heading" lang={lang} /><HelpTooltip content={translations.login.help} lang={lang}/></h2>
        <form onSubmit={this.submit.bind(this)}>
          <EmailTextField htmlId="primary-email" hasError={emailIsInvalid()} onChange={this.handleEmailChange.bind(this)} translations={translations.login} value={email} translationKey="contact-email" lang={lang} required="true" size="small" maxLength="80" />
          <TextButton htmlId="submit" disabled={canSend()} onClick={this.submit.bind(this)} translations={translations.login} translationKey="submit" lang={lang} />
          <div className="message-container">
            <LocalizedString hidden={sent === ""} className="message" translations={translations.login} translationKey="message" lang={lang} />
            <LocalizedString hidden={error === ""} className="error" translations={translations.errors} translationKey="unexpected-submit-error" lang={lang} />
          </div>
        </form>
      </section>
    </div>
  }
}

const urlCreator = new VaUrlCreator()
const query = QueryString.parse(location.search)
const urlContent = { parsedQuery: query, location: location }
const translationsP = Bacon.fromPromise(HttpUtil.get("/translations.json"))
const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
const avustusHakuP = Bacon.fromPromise(HttpUtil.get(urlCreator.avustusHakuApiUrl(avustusHakuId)))

const initialStateTemplate = {
  translations: translationsP,
  lang: urlCreator.chooseInitialLanguage(urlContent),
  devel: query.devel,
  avustushaku: avustusHakuP
}
const initialState = Bacon.combineTemplate(initialStateTemplate)

initialState.onValue(function(state) {
  const properties = { model: state }
  React.render(React.createElement(VaLogin, properties), document.getElementById('app'))
})
