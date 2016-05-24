import PolyfillBind from 'va-common/web/polyfill-bind'

import ConsolePolyfill from 'console-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import QueryString from 'query-string'
import Bacon from 'baconjs'

import common from 'soresu-form/web/form/style/main.less'
import loginStyle from './style/va-login.less'

import HttpUtil from 'va-common/web/HttpUtil'
import FormUtil from 'soresu-form/web/form/FormUtil.js'
import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'
import {DateRangeInfoElement, H1InfoElement} from 'soresu-form/web/form/component/InfoElement.jsx'
import HelpTooltip from 'soresu-form/web/form/component/HelpTooltip.jsx'

import VaLoginTopbar from './VaLoginTopbar.jsx'
import VaUrlCreator from './VaUrlCreator.js'

import SyntaxValidator from 'soresu-form/web/form/SyntaxValidator.js'
import TextButton from 'soresu-form/web/form/component/TextButton.jsx'
import EmailTextField from 'soresu-form/web/form/component/EmailTextField.jsx'
import {initErrorLogger} from 'va-common/web/va/util/ErrorLogger'
initErrorLogger()

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
        value: [{key:"primary-email", value: email, fieldType: "emailField"},{key:"language", value: model.lang, fieldType: "radioButton"}]
      })
      .then(function(response) {
        vaLogin.setState({
          sent: email,
          error: ""
        })
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
    const environment =  model.environment
    const content = avustushaku.content
    const isOpen = avustushaku.phase === "current"
    const email = this.state.email
    const sent = this.state.sent
    const error = this.state.error
    const emailIsInvalid = () => SyntaxValidator.validateEmail(this.state.email) && this.state.email != ""
    const canSend = () => email === sent || emailIsInvalid()
    const hakemusPreviewUrl = urlCreator.existingSubmissionEditUrl(avustushaku.id, "", lang, model.devel)

    return <div>
      <VaLoginTopbar environment={environment} translations={translations} lang={lang} />
      <section id="container" className="soresu-fieldset">
        <H1InfoElement htmlId="name" lang={lang} values={content} />
        <DateRangeInfoElement htmlId="duration" translations={translations} translationKey="label" lang={lang} values={content} />
        <p><LocalizedString className="text-red" translations={translations.login} translationKey="notopen" lang={lang} hidden={isOpen} /></p>
        <p><LocalizedString translations={translations.login} translationKey="preview" lang={lang} /> <a target="preview" href={hakemusPreviewUrl}><LocalizedString translations={translations.login} translationKey="preview-link" lang={lang} /></a></p>
        <h2><LocalizedString translations={translations.login} translationKey="heading" lang={lang} /><HelpTooltip content={translations.login.help} lang={lang}/></h2>
        <form onSubmit={this.submit.bind(this)}>
          <input type="hidden" name="language" value={lang}/>
          <EmailTextField htmlId="primary-email" hasError={emailIsInvalid()} onChange={this.handleEmailChange.bind(this)} translations={translations.login} value={email} translationKey="contact-email" lang={lang} required="true" disabled={!isOpen} size="small" maxLength="80" />
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
const environmentP = Bacon.fromPromise(HttpUtil.get(urlCreator.environmentConfigUrl()))

const initialStateTemplate = {
  translations: translationsP,
  lang: urlCreator.chooseInitialLanguage(urlContent),
  devel: query.devel,
  avustushaku: avustusHakuP,
  environment: environmentP
}
const initialState = Bacon.combineTemplate(initialStateTemplate)

initialState.onValue(function(state) {
  const properties = { model: state }
  ReactDOM.render(React.createElement(VaLogin, properties), document.getElementById('app'))
})
