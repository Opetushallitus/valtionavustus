import React from 'react'
import Immutable from 'seamless-immutable'
import _ from 'lodash'
import ClassNames from 'classnames'

import HttpUtil from 'soresu-form/web/HttpUtil'
import JsUtil from 'soresu-form/web/JsUtil'
import SyntaxValidator from 'soresu-form/web/form/SyntaxValidator'
import Translator from 'soresu-form/web/form/Translator'
import NameFormatter from 'soresu-form/web/va/util/NameFormatter'
import { Answer, Avustushaku, Field, Hakemus, Selvitys, UserInfo } from 'soresu-form/web/va/types'
import { Language } from 'soresu-form/web/va/i18n/translations'

import HakemustenArviointiController from '../HakemustenArviointiController'

const emailNotificationFieldType = "vaEmailNotification"
const legacyEmailFieldIds = Immutable(["organization-email", "primary-email", "signature-email"])

interface ValiselvitysEmailProps {
  controller: HakemustenArviointiController
  avustushaku: Avustushaku
  hakemus: Hakemus
  valiselvitys: Selvitys
  lang?: Language
  userInfo: UserInfo
  translations: any
}

type Email = { value: string, isValid: boolean }

interface SelvitysEmailState {
  currentValiselvitysId: number
  message: string
  subject: string
  recipientEmails: Email[]
}

const isNonEmptyEmailField = (field: Field) =>
  (field.fieldType === emailNotificationFieldType || _.includes(legacyEmailFieldIds, field.key)) &&
  !_.isEmpty(field.value)

const findFirstPreferredEmail = (emailFields: Field[]) => {
  if (!emailFields.length) {
    return null
  }

  const preferred = _.find(emailFields, f => f.fieldType === emailNotificationFieldType)

  if (preferred) {
    return preferred.value
  }

  return emailFields[0].value
}

const findRecipientEmail = (selvitysAnswers: Answer[], hakemusAnswers: Answer[]) =>
  findFirstPreferredEmail(JsUtil.flatFilter(selvitysAnswers, isNonEmptyEmailField)) ||
    findFirstPreferredEmail(JsUtil.flatFilter(hakemusAnswers, isNonEmptyEmailField))

const isValidEmail = (email: string) => !SyntaxValidator.validateEmail(email)

const makeRecipientEmail = (value = "") => ({value, isValid: isValidEmail(value)})

const makeEmptyRecipientEmail = () => ({value: "", isValid: true})

const makeState = ({hakemus, valiselvitys, avustushaku, userInfo, lang, translations}: ValiselvitysEmailProps) => {
  const translator = new Translator(translations)

  const selvitysTypeLowercase = translator.translate('valiselvitys', lang)
  const selvitysTypeCapitalized = _.capitalize(translator.translate('valiselvitys', lang))
  const avustushakuName = _.get(avustushaku, ["content", "name", lang || 'fi'])
  const projectName = valiselvitys["project-name"] || hakemus["project-name"] || ""
  const registerNumber = valiselvitys["register-number"]
  const senderName = NameFormatter.onlyFirstForename(userInfo["first-name"]) + " " + userInfo["surname"]
  const senderEmail = userInfo.email
  const foundRecipientEmail = findRecipientEmail(valiselvitys.answers || [], hakemus.answers) || ""

  const recipientEmails = foundRecipientEmail.length > 0
    ? [makeRecipientEmail(foundRecipientEmail)]
    : []

  return {
    currentValiselvitysId: valiselvitys.id,
    message: translator.translate("valiselvitys-default-message", lang, "", {
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
    recipientEmails
  }
}

export default class ValiselvitysEmail extends React.Component<ValiselvitysEmailProps, SelvitysEmailState> {
  constructor(props: ValiselvitysEmailProps) {
    super(props)
    this.onRecipientEmailChange = this.onRecipientEmailChange.bind(this)
    this.onRecipientEmailRemove = this.onRecipientEmailRemove.bind(this)
    this.onSubjectChange = this.onSubjectChange.bind(this)
    this.onMessageChange = this.onMessageChange.bind(this)
    this.onSendMessage = this.onSendMessage.bind(this)
    this.state = makeState(props)
  }

  static getDerivedStateFromProps(props: ValiselvitysEmailProps, state: SelvitysEmailState) {
    if (props.valiselvitys.id !== state.currentValiselvitysId) {
      return makeState(props)
    } else {
      return null
    }
  }

  onRecipientEmailChange(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value

    this.setState(oldState => {
      const oldEmails = oldState.recipientEmails

      let newEmails

      if (index === oldEmails.length) {
        newEmails = oldEmails.concat(makeRecipientEmail(value))
      } else {
        newEmails = _.clone(oldEmails)
        newEmails[index] = makeRecipientEmail(value)
      }

      return {
        recipientEmails: newEmails
      }
    })
  }

  onRecipientEmailRemove(index: number) {
    this.setState(oldState => {
      const oldEmails = oldState.recipientEmails
      const numOldEmails = oldEmails.length
      const newEmails = []

      for (let idx = 0; idx < numOldEmails; idx += 1) {
        if (idx !== index) {
          newEmails.push(oldEmails[idx])
        }
      }

      return {
        recipientEmails: newEmails
      }
    })
  }

  onSubjectChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({subject: event.target.value})
  }

  onMessageChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    this.setState({message: event.target.value})
  }

  onSendMessage() {
    const request = {
      message: this.state.message,
      "selvitys-hakemus-id": this.props.valiselvitys.id,
      to: _.map(this.state.recipientEmails, email => email.value),
      subject: this.state.subject
    }

    const avustushakuId = this.props.avustushaku.id
    const controller = this.props.controller
    const url = `/api/avustushaku/${avustushakuId}/selvitys/valiselvitys/send`

    HttpUtil.post(url, request)
      .then(() => {
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
      valiselvitys,
      lang
    } = this.props

    const {
      message,
      subject,
      recipientEmails
    } = this.state

    const sentSelvitysEmail = valiselvitys["selvitys-email"]

    const title = sentSelvitysEmail
      ? "Lähetetty väliselvityksen hyväksyntä"
      : `Lähetä väliselvityksen hyväksyntä${lang === 'sv' ? ' ruotsiksi': ''}`

    const areAllEmailsValid = !_.some(recipientEmails, email => !email.isValid)

    return (
      <div data-test-id="selvitys-email">
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
              <th className={ClassNames("selvitys-email-header__header", {
                "selvitys-email-header__header--for-value-input": !sentSelvitysEmail
              })}>Vastaanottajat:</th>
              <td className="selvitys-email-header__value">
                {sentSelvitysEmail && (
                  <a href={'mailto:' + sentSelvitysEmail.to.join(",")}>
                    {_.map(sentSelvitysEmail.to, email => <div key={email}>{email}</div>)}
                  </a>
                )}
                {!sentSelvitysEmail && _.map(recipientEmails.concat(makeEmptyRecipientEmail()), (email, index) =>
                  <div key={index} className="selvitys-email-header__value-input-container">
                    <input type="text"
                           className={ClassNames("selvitys-email-header__value-input", {
                             "selvitys-email-header__value-input--error": !email.isValid
                           })}
                           value={email.value}
                           onChange={_.partial(this.onRecipientEmailChange, index)}/>
                    {index < recipientEmails.length && (
                      <button type="button"
                              className="selvitys-email-header__remove-value-input-button soresu-remove"
                              tabIndex={-1}
                              onClick={_.partial(this.onRecipientEmailRemove, index)}/>
                    )}
                  </div>
                )}
              </td>
            </tr>
            <tr>
              <th className="selvitys-email-header__header">Aihe:</th>
              <td className="selvitys-email-header__value">
                {sentSelvitysEmail && sentSelvitysEmail.subject}
                {!sentSelvitysEmail && (
                  <input id="selvitys-email-title" className="selvitys-email-header__value-input" type="text" value={subject} onChange={this.onSubjectChange}/>
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
            <button id="submit-selvitys" onClick={this.onSendMessage} disabled={!recipientEmails.length || !areAllEmailsValid}>Lähetä viesti</button>
          </div>
        )}
      </div>
    )
  }
}
