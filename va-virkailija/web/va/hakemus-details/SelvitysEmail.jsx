import React from 'react'
import Immutable from 'seamless-immutable'
import _ from 'lodash'
import ClassNames from 'classnames'

import HttpUtil from 'soresu-form/web/HttpUtil'
import JsUtil from 'soresu-form/web/JsUtil'
import SyntaxValidator from 'soresu-form/web/form/SyntaxValidator'
import Translator from 'soresu-form/web/form/Translator'
import NameFormatter from 'va-common/web/va/util/NameFormatter'

const emailNotificationFieldType = "vaEmailNotification"

const legacyEmailFieldIds = Immutable(["organization-email", "primary-email", "signature-email"])

const isNonEmptyEmailField = field =>
  (field.fieldType === emailNotificationFieldType || _.includes(legacyEmailFieldIds, field.key)) &&
  !_.isEmpty(field.value)

const findFirstPreferredEmail = emailFields => {
  if (!emailFields.length) {
    return null
  }

  const preferred = _.find(emailFields, f => f.fieldType === emailNotificationFieldType)

  if (preferred) {
    return preferred.value
  }

  return emailFields[0].value
}

const findRecipientEmail = (selvitysAnswers, hakemusAnswers) =>
  findFirstPreferredEmail(JsUtil.flatFilter(selvitysAnswers, isNonEmptyEmailField)) ||
    findFirstPreferredEmail(JsUtil.flatFilter(hakemusAnswers, isNonEmptyEmailField))

const isValidEmail = email => !SyntaxValidator.validateEmail(email)

const makeState = ({hakemus, selvitysType, selvitysHakemus, avustushaku, userInfo, lang, translations}) => {
  const translator = new Translator(translations)

  const selvitysTypeLowercase = translator.translate(selvitysType, lang)
  const selvitysTypeCapitalized = _.capitalize(translator.translate(selvitysType, lang))
  const avustushakuName = _.get(avustushaku, ["content", "name", lang])
  const projectName = selvitysHakemus["project-name"] || hakemus["project-name"] || ""
  const registerNumber = selvitysHakemus["register-number"]
  const senderName = NameFormatter.onlyFirstForename(userInfo["first-name"]) + " " + userInfo["surname"]
  const senderEmail = userInfo.email
  const recipientEmail = findRecipientEmail(selvitysHakemus.answers, hakemus.answers) || ""

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
    recipientEmail: {
      value: recipientEmail,
      isValid: isValidEmail(recipientEmail)
    }
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
    const value = event.target.value
    this.setState({
      recipientEmail: {
        value,
        isValid: isValidEmail(value)
      }
    })
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
      to: this.state.recipientEmail.value,
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
                <input type="text"
                       className={ClassNames("selvitys-email-header__value-input", {
                         "selvitys-email-header__value-input--error": !recipientEmail.isValid
                       })}
                       value={recipientEmail.value}
                       onChange={this.onRecipientEmailChange}/>
              )}
              </td>
            </tr>
            <tr>
              <th className="selvitys-email-header__header">Aihe:</th>
              <td className="selvitys-email-header__value">
                {sentSelvitysEmail && sentSelvitysEmail.subject}
                {!sentSelvitysEmail && (
                  <input className="selvitys-email-header__value-input" type="text" value={subject} onChange={this.onSubjectChange}/>
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
            <button onClick={this.onSendMessage} disabled={!recipientEmail.isValid}>Lähetä viesti</button>
          </div>
        )}
      </div>
    )
  }
}
