import React from 'react'
import _ from 'lodash'

import HttpUtil from 'soresu-form/web/HttpUtil'
import JsUtil from 'soresu-form/web/JsUtil'
import Translator from 'soresu-form/web/form/Translator'
import NameFormatter from 'va-common/web/va/util/NameFormatter'

const findRecipientEmail = answers => {
  const field = JsUtil.findFirst(answers, f => f.key === "primary-email")
  return field ? field.value : ""
}

const makeState = ({hakemus, selvitysType, selvitysHakemus, avustushaku, userInfo, lang, translations}) => {
  const translator = new Translator(translations)

  const selvitysTypeLowercase = translator.translate(selvitysType, lang)
  const selvitysTypeCapitalized = _.capitalize(translator.translate(selvitysType, lang))
  const avustushakuName = _.get(avustushaku, ["content", "name", lang])
  const projectName = selvitysHakemus["project-name"]
  const registerNumber = selvitysHakemus["register-number"]
  const senderName = NameFormatter.onlyFirstForename(userInfo["first-name"]) + " " + userInfo["surname"]
  const senderEmail = userInfo.email
  const recipientEmail = findRecipientEmail(hakemus.answers)

  return {
    message: translator.translate("default-message", lang, "", {
      "selvitys-type-lowercase": selvitysTypeLowercase,
      "selvitys-type-capitalized": selvitysTypeCapitalized,
      "project-name": projectName,
      "avustushaku-name": avustushakuName,
      "sender-name": senderName,
      "sender-email": senderEmail
    }),
    subject: translator.translate("default-subject", lang, "", {
      "selvitys-type-capitalized": selvitysTypeCapitalized,
      "register-number": registerNumber
    }),
    recipientEmail
  }
}

const makeFinnishGenetiveFormOfSelvitysType = selvitysType =>
  selvitysType === 'valiselvitys' ? "väliselvityksen" : "loppuselvityksen"

const makeTitleForSent = selvitysType =>
  `Lähetetty ${makeFinnishGenetiveFormOfSelvitysType(selvitysType)} hyväksyntä`

const makeTitleForUnsent = (selvitysType, lang) => {
  const suffix = lang === 'sv' ? " ruotsiksi" : ""
  return `Lähetä ${makeFinnishGenetiveFormOfSelvitysType(selvitysType)} hyväksyntä${suffix}`
}

export default class SelvitysEmail extends React.Component {
  constructor(props) {
    super(props)
    this.onRecipientEmailChange = this.onRecipientEmailChange.bind(this)
    this.onSubjectChange = this.onSubjectChange.bind(this)
    this.onMessageChange = this.onMessageChange.bind(this)
    this.onSendMessage = this.onSendMessage.bind(this)
    this.state = makeState(props)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.selvitysHakemus.id !== nextProps.selvitysHakemus.id) {
      this.setState(makeState(nextProps))
    }
  }

  onRecipientEmailChange(event) {
    this.setState({recipientEmail: event.target.value})
  }

  onSubjectChange(event) {
    this.setState({subject: event.target.value})
  }

  onMessageChange(event) {
    this.setState({message: event.target.value})
  }

  onSendMessage() {
    const request = {
      message: this.state.message,
      "selvitys-hakemus-id": this.props.selvitysHakemus.id,
      to: this.state.recipientEmail,
      subject: this.state.subject
    }

    const avustushakuId = this.props.avustushaku.id
    const selvitysType = this.props.selvitysType
    const controller = this.props.controller
    const url = `/api/avustushaku/${avustushakuId}/selvitys/${selvitysType}/send`

    HttpUtil.post(url, request)
      .then(res => {
        controller.loadSelvitys()
        controller.refreshHakemukset(avustushakuId)
        return null
      })
      .catch(error => {
        console.error(`Error in sending selvitys email, POST ${url}`, error)
      })
  }

  render() {
    const {
      selvitysHakemus,
      selvitysType,
      lang
    } = this.props

    const {
      message,
      subject,
      recipientEmail
    } = this.state

    const sentSelvitysEmail = selvitysHakemus["selvitys-email"]

    const title = sentSelvitysEmail
      ? makeTitleForSent(selvitysType)
      : makeTitleForUnsent(selvitysType, lang)

    return (
      <div>
        <h2>{title}</h2>
        <table className="selvitys-email-header">
          <tbody>
            {sentSelvitysEmail && (
              <tr>
                <th className="selvitys-email-header__header">Lähetetty:</th>
                <td className="selvitys-email-header__value">{sentSelvitysEmail.send}</td>
              </tr>
            )}
            <tr>
              <th className="selvitys-email-header__header">Lähettäjä:</th>
              <td className="selvitys-email-header__value">no-reply@oph.fi</td>
            </tr>
            <tr>
              <th className="selvitys-email-header__header">Vastaanottaja:</th>
              <td className="selvitys-email-header__value">
              {sentSelvitysEmail && (
                <a href={'mailto:' + sentSelvitysEmail.to}>{sentSelvitysEmail.to}</a>
              )}
              {!sentSelvitysEmail && (
                <input type="text" size="65" value={recipientEmail} onChange={this.onRecipientEmailChange}/>
              )}
              </td>
            </tr>
            <tr>
              <th className="selvitys-email-header__header">Aihe:</th>
              <td className="selvitys-email-header__value">
                {sentSelvitysEmail && sentSelvitysEmail.subject}
                {!sentSelvitysEmail && (
                  <input type="text" size="65" value={subject} onChange={this.onSubjectChange}/>
                )}
              </td>
            </tr>
          </tbody>
        </table>
        {sentSelvitysEmail && (
          <div className="selvitys-email-message selvitys-email-message--sent">{sentSelvitysEmail.message}</div>
        )}
        {!sentSelvitysEmail && (
          <div>
            <textarea className="selvitys-email-message selvitys-email-message--unsent" value={message} onChange={this.onMessageChange}/>
            <button onClick={this.onSendMessage}>Lähetä viesti</button>
          </div>
        )}
      </div>
    )
  }
}
