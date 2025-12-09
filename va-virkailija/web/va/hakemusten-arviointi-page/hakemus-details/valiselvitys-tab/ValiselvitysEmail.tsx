import React, { useState } from 'react'
import ClassNames from 'classnames'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { isValidEmail } from 'soresu-form/web/form/SyntaxValidator'
import Translator from 'soresu-form/web/form/Translator'
import NameFormatter from 'soresu-form/web/va/util/NameFormatter'
import { Avustushaku, Hakemus, Selvitys } from 'soresu-form/web/va/types'
import { Language } from 'soresu-form/web/va/i18n/translations'
import translations from '../../../../../../server/resources/public/translations.json'

import { UserInfo } from '../../../types'
import { useHakemustenArviointiDispatch } from '../../arviointiStore'
import { refreshHakemus } from '../../arviointiReducer'
import { initialRecipientEmails } from '../emailRecipients'

interface ValiselvitysEmailProps {
  avustushaku: Avustushaku
  hakemus: Hakemus
  valiselvitys: Selvitys
  lang: Language
  userInfo: UserInfo
}

type Email = { value: string; isValid: boolean }

const makeFormRecipientEmail = (value = '') => {
  return {
    value,
    isValid: isValidEmail(value),
  }
}
const makeEmptyRecipientEmail = () => ({ value: '', isValid: true })
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function initialMessage(props: ValiselvitysEmailProps) {
  const { avustushaku, hakemus, lang, userInfo, valiselvitys } = props
  const translator = new Translator(translations['selvitys-email'])
  return translator.translate('valiselvitys-default-message', lang, '', {
    'selvitys-type-lowercase': translator.translate('valiselvitys', lang),
    'selvitys-type-capitalized': capitalize(translator.translate('valiselvitys', lang)),
    'project-name': valiselvitys['project-name'] || hakemus['project-name'] || '',
    'avustushaku-name': avustushaku?.content?.name?.[lang] || '',
    'sender-name':
      NameFormatter.onlyFirstForename(userInfo['first-name']) + ' ' + userInfo['surname'],
    'sender-email': userInfo.email,
  })
}

function initialSubject(props: ValiselvitysEmailProps) {
  const { lang, valiselvitys } = props
  const translator = new Translator(translations['selvitys-email'])
  return translator.translate('default-subject', lang, '', {
    'selvitys-type-capitalized': capitalize(translator.translate('valiselvitys', lang)),
    'register-number': valiselvitys['register-number'] || '',
  })
}

export const ValiselvitysEmail = (props: ValiselvitysEmailProps) => {
  const { avustushaku, lang, valiselvitys, hakemus } = props
  const dispatch = useHakemustenArviointiDispatch()
  const [message, setMessage] = useState<string>(initialMessage(props))
  const [subject, setSubject] = useState<string>(initialSubject(props))
  const [recipientEmails, setRecipientEmails] = useState<Email[]>(
    initialRecipientEmails(hakemus, hakemus.normalizedData).map(makeFormRecipientEmail)
  )

  function onRecipientEmailChange(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    const newRecipients = new Array(...recipientEmails)
    newRecipients.splice(index, 1, makeFormRecipientEmail(value))
    setRecipientEmails(newRecipients)
  }

  function onRecipientEmailRemove(index: number) {
    const newRecipients = new Array(...recipientEmails)
    newRecipients.splice(index, 1)
    setRecipientEmails(newRecipients)
  }

  async function onSendMessage() {
    const request = {
      message,
      'selvitys-hakemus-id': valiselvitys.id,
      to: recipientEmails.map((email) => email.value),
      subject,
    }
    const url = `/api/avustushaku/${avustushaku.id}/selvitys/valiselvitys/send`

    try {
      await HttpUtil.post(url, request)
      await dispatch(
        refreshHakemus({
          hakemusId: hakemus.id,
        })
      )
    } catch (error) {
      console.error(`Error in sending selvitys email, POST ${url}`, error)
    }
  }

  const sentSelvitysEmail = valiselvitys['selvitys-email']
  const title = sentSelvitysEmail
    ? 'Lähetetty väliselvityksen hyväksyntä'
    : `Lähetä väliselvityksen hyväksyntä${lang === 'sv' ? ' ruotsiksi' : ''}`
  const areAllEmailsValid = !recipientEmails.some((email) => !email.isValid)

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
            <th
              className={ClassNames('selvitys-email-header__header', {
                'selvitys-email-header__header--for-value-input': !sentSelvitysEmail,
              })}
            >
              Vastaanottajat:
            </th>
            <td className="selvitys-email-header__value">
              {sentSelvitysEmail ? (
                <a href={'mailto:' + sentSelvitysEmail.to.join(',')}>
                  {sentSelvitysEmail.to.map((email) => (
                    <div key={email}>{email}</div>
                  ))}
                </a>
              ) : (
                recipientEmails.concat(makeEmptyRecipientEmail()).map((email, index) => (
                  <div key={index} className="selvitys-email-header__value-input-container">
                    <input
                      type="text"
                      className={ClassNames('selvitys-email-header__value-input', {
                        'selvitys-email-header__value-input--error': !email.isValid,
                      })}
                      value={email.value}
                      onChange={(e) => onRecipientEmailChange(index, e)}
                    />
                    {index < recipientEmails.length && (
                      <button
                        type="button"
                        className="selvitys-email-header__remove-value-input-button soresu-remove"
                        tabIndex={-1}
                        onClick={() => onRecipientEmailRemove(index)}
                      />
                    )}
                  </div>
                ))
              )}
            </td>
          </tr>
          <tr>
            <th className="selvitys-email-header__header">Aihe:</th>
            <td className="selvitys-email-header__value">
              {sentSelvitysEmail ? (
                sentSelvitysEmail.subject
              ) : (
                <input
                  id="selvitys-email-title"
                  className="selvitys-email-header__value-input"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              )}
            </td>
          </tr>
        </tbody>
      </table>
      {sentSelvitysEmail ? (
        <div className="selvitys-email-message selvitys-email-message--sent">
          {sentSelvitysEmail.message}
        </div>
      ) : (
        <div>
          <textarea
            className="selvitys-email-message selvitys-email-message--unsent"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            id="submit-selvitys"
            onClick={onSendMessage}
            disabled={!recipientEmails.length || !areAllEmailsValid}
          >
            Lähetä viesti
          </button>
        </div>
      )}
    </div>
  )
}
