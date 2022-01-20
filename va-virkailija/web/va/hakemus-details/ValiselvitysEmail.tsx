import React, { useState } from 'react'
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

function initialMessage(props: ValiselvitysEmailProps) {
  const { avustushaku, hakemus, lang, translations, userInfo, valiselvitys } = props
  const translator = new Translator(translations)
  return translator.translate("valiselvitys-default-message", lang, "", {
    "selvitys-type-lowercase":  translator.translate('valiselvitys', lang),
    "selvitys-type-capitalized": _.capitalize(translator.translate('valiselvitys', lang)),
    "project-name": valiselvitys["project-name"] ?? hakemus["project-name"] ?? "",
    "avustushaku-name": avustushaku?.content?.name?.[lang || 'fi'] ?? '',
    "sender-name": NameFormatter.onlyFirstForename(userInfo["first-name"]) + " " + userInfo["surname"],
    "sender-email": userInfo.email
  })
}

function initialSubject(props: ValiselvitysEmailProps) {
  const { lang, translations, valiselvitys } = props
  const translator = new Translator(translations)
  return translator.translate("default-subject", lang, "", {
    "selvitys-type-capitalized": _.capitalize(translator.translate('valiselvitys', lang)),
    "register-number": valiselvitys["register-number"]
  })
}

function initialRecipientEmails(props: ValiselvitysEmailProps) {
  const { hakemus, valiselvitys } = props
  const foundRecipientEmail = findRecipientEmail(valiselvitys.answers || [], hakemus.answers) || ""
  return foundRecipientEmail.length > 0
  ? [makeRecipientEmail(foundRecipientEmail)]
  : []
}

export const ValiselvitysEmail = (props: ValiselvitysEmailProps) => {
  const { avustushaku, controller, lang, valiselvitys } = props
  const [message, setMessage] = useState<string>(initialMessage(props))
  const [subject, setSubject] = useState<string>(initialSubject(props))
  const [recipientEmails, setRecipientEmails] = useState<Email[]>(initialRecipientEmails(props))

  function onRecipientEmailChange(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    const oldEmails = recipientEmails
    let newEmails
    if (index === oldEmails.length) {
      newEmails = oldEmails.concat(makeRecipientEmail(value))
    } else {
      newEmails = _.clone(oldEmails)
      newEmails[index] = makeRecipientEmail(value)
    }

    setRecipientEmails(newEmails)
  }

  function onRecipientEmailRemove(index: number) {
    const oldEmails = recipientEmails
    const numOldEmails = oldEmails.length
    const newEmails = []

    for (let idx = 0; idx < numOldEmails; idx += 1) {
      if (idx !== index) {
        newEmails.push(oldEmails[idx])
      }
    }

    setRecipientEmails(newEmails)
  }

  function onSendMessage() {
    const request = {
      message,
      "selvitys-hakemus-id": valiselvitys.id,
      to: _.map(recipientEmails, email => email.value),
      subject
    }
    const url = `/api/avustushaku/${avustushaku.id}/selvitys/valiselvitys/send`

    HttpUtil.post(url, request)
      .then(() => {
        controller.loadSelvitys()
        controller.refreshHakemukset(avustushaku.id)
        return null
      })
      .catch(error => {
        console.error(`Error in sending selvitys email, POST ${url}`, error)
      })
  }

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
            <th className={ClassNames("selvitys-email-header__header", { "selvitys-email-header__header--for-value-input": !sentSelvitysEmail })}>
              Vastaanottajat:
            </th>
            <td className="selvitys-email-header__value">
              {sentSelvitysEmail
                ? <a href={'mailto:' + sentSelvitysEmail.to.join(",")}>
                    {_.map(sentSelvitysEmail.to, email => <div key={email}>{email}</div>)}
                  </a>
                : _.map(recipientEmails.concat(makeEmptyRecipientEmail()), (email, index) =>
                    <div key={index} className="selvitys-email-header__value-input-container">
                      <input type="text"
                              className={ClassNames("selvitys-email-header__value-input", {
                                "selvitys-email-header__value-input--error": !email.isValid
                              })}
                              value={email.value}
                              onChange={_.partial(onRecipientEmailChange, index)}/>
                      {index < recipientEmails.length && (
                        <button type="button"
                                className="selvitys-email-header__remove-value-input-button soresu-remove"
                                tabIndex={-1}
                                onClick={_.partial(onRecipientEmailRemove, index)}/>
                      )}
                    </div>
                  )
                }
            </td>
          </tr>
          <tr>
            <th className="selvitys-email-header__header">Aihe:</th>
            <td className="selvitys-email-header__value">
              {sentSelvitysEmail
                ? sentSelvitysEmail.subject
                : <input id="selvitys-email-title" className="selvitys-email-header__value-input" type="text" value={subject} onChange={e => setSubject(e.target.value)}/>
              }
            </td>
          </tr>
        </tbody>
      </table>
      {sentSelvitysEmail
        ? <div className="selvitys-email-message selvitys-email-message--sent">{sentSelvitysEmail.message}</div>
        : <div>
            <textarea className="selvitys-email-message selvitys-email-message--unsent" value={message} onChange={e => setMessage(e.target.value)}/>
            <button id="submit-selvitys" onClick={onSendMessage} disabled={!recipientEmails.length || !areAllEmailsValid}>Lähetä viesti</button>
          </div>
      }
    </div>
  )
}
