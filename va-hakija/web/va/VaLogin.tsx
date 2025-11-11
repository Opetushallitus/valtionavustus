import { useEffect, useState } from 'react'
import React from 'react'
import { createRoot } from 'react-dom/client'
import QueryString from 'query-string'
import * as Bacon from 'baconjs'

import 'soresu-form/web/form/style/main.less'
import './style/va-login.less'

import HttpUtil from 'soresu-form/web/HttpUtil'
import LocalizedString from 'soresu-form/web/form/component/LocalizedString'
import { DateRangeInfoElement, H1InfoElement } from 'soresu-form/web/form/component/InfoElement'
import HelpTooltip from 'soresu-form/web/form/component/HelpTooltip'
import { isValidEmail } from 'soresu-form/web/form/SyntaxValidator'
import TextButton from 'soresu-form/web/form/component/TextButton'
import EmailTextField from 'soresu-form/web/form/component/EmailTextField'
import { LegacyTranslations } from 'soresu-form/web/va/types'
import { HakijaAvustusHaku } from 'soresu-form/web/form/types/Form'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

import VaLoginTopbar from './VaLoginTopbar'
import VaUrlCreator from './VaUrlCreator.js'
import { isJotpaAvustushaku } from './jotpa'
import { changeFaviconIconTo } from './favicon'

type VaLoginProps = {
  model: {
    avustushaku: HakijaAvustusHaku
    environment: EnvironmentApiResponse
    lang: 'fi' | 'sv'
    translations: LegacyTranslations
  }
}

type VaLoginState = {
  email: string
  sent?: string
  error: boolean
}
export default function VaLogin(props: VaLoginProps) {
  const model = props.model
  const lang = model.lang
  const translations = model.translations
  const avustushaku = model.avustushaku
  const environment = model.environment
  const isJotpaHakemus = isJotpaAvustushaku(avustushaku['operational-unit-code'])

  useEffect(() => {
    setCorrectFavicon()
    return function cleanup() {
      changeFaviconIconTo('oph')
    }
  }, [isJotpaHakemus])

  const [state, setState] = useState<VaLoginState>({
    email: '',
    error: false,
  })

  const setCorrectFavicon = () => {
    if (isJotpaHakemus) {
      changeFaviconIconTo('jotpa')
    } else {
      changeFaviconIconTo('oph')
    }
  }

  const handleEmailChange = (event: React.ChangeEvent<any>) => {
    setState({
      email: event.target.value,
      sent: state.sent,
      error: state.error,
    })
  }

  const submit = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.FormEvent<HTMLFormElement>
  ) => {
    if ('preventDefault' in event) {
      event.preventDefault()
    }
    if (!isValidEmail(state.email)) {
      return
    }
    const url = urlCreator.newEntityApiUrl(props.model)
    const model = props.model
    HttpUtil.put(url, {
      value: [
        { key: 'primary-email', value: state.email, fieldType: 'emailField' },
        { key: 'language', value: model.lang, fieldType: 'radioButton' },
      ],
    })
      .then(function (response) {
        setState({
          email: state.email,
          sent: state.email,
          error: false,
        })
        const hakemusId = response.id
        if (hakemusId) {
          window.location.href = urlCreator.existingSubmissionEditUrl(
            model.avustushaku.id,
            hakemusId,
            model.lang
          )
        }
      })
      .catch(function (error) {
        console.error(`Error in creating new hakemus, PUT ${url}`, error)
        setState({ email: state.email, error: true })
      })
  }

  const content = avustushaku.content
  const isOpen = avustushaku.phase === 'current'

  const emailIsInvalid = () => !isValidEmail(state.email) && state.email !== ''
  const canSend = () => state.email === state.sent || emailIsInvalid()
  const hakemusPreviewUrl = urlCreator.existingSubmissionEditUrl(avustushaku.id, '', lang)

  return (
    <div className={isJotpaHakemus ? 'jotpa-customizations' : ''}>
      <VaLoginTopbar
        environment={environment}
        translations={translations}
        lang={lang}
        isJotpaTopBar={isJotpaHakemus}
      />
      <section id="container" className="soresu-fieldset">
        <H1InfoElement htmlId="name" lang={lang} values={content} />
        <DateRangeInfoElement
          htmlId="duration"
          translations={translations}
          translationKey="label"
          lang={lang}
          values={content}
        />
        <p>
          <LocalizedString
            htmlId="haku-not-open"
            className="text-red"
            translations={translations.login}
            translationKey="notopen"
            lang={lang}
            hidden={isOpen}
          />
        </p>
        <p>
          <LocalizedString translations={translations.login} translationKey="preview" lang={lang} />{' '}
          <a target="preview" href={hakemusPreviewUrl}>
            <LocalizedString
              translations={translations.login}
              translationKey="preview-link"
              lang={lang}
            />
          </a>
        </p>
        <h2>
          <LocalizedString translations={translations.login} translationKey="heading" lang={lang} />
          <HelpTooltip content={translations.login.help} lang={lang} direction="left" />
        </h2>
        <form onSubmit={submit}>
          <input type="hidden" name="language" value={lang} />
          <EmailTextField
            htmlId="primary-email"
            hasError={emailIsInvalid()}
            onChange={handleEmailChange}
            translations={translations.login}
            value={state.email}
            translationKey="contact-email"
            lang={lang}
            required={true}
            disabled={!isOpen}
            size="small"
            maxLength={80}
            field={{
              id: 'dummy',
              fieldType: 'textField',
              fieldClass: 'formField',
            }}
          />
          <TextButton
            htmlId="submit"
            disabled={canSend()}
            onClick={submit}
            translations={translations.login}
            translationKey="submit"
            lang={lang}
            useJotpaColour={isJotpaHakemus}
          />
          <div className="message-container">
            <LocalizedString
              hidden={!state.sent}
              className="message"
              translations={translations.login}
              translationKey="message"
              lang={lang}
            />
            <LocalizedString
              hidden={!state.error}
              className="error"
              translations={translations.errors}
              translationKey="unexpected-submit-error"
              lang={lang}
            />
          </div>
        </form>
      </section>
    </div>
  )
}

const urlCreator = new VaUrlCreator()
const query = QueryString.parse(location.search)
const urlContent = { parsedQuery: query, location: location }
const translationsP = Bacon.fromPromise(HttpUtil.get('/translations.json'))
const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
const avustusHakuP = Bacon.fromPromise(HttpUtil.get(VaUrlCreator.avustusHakuApiUrl(avustusHakuId)))
const environmentP = Bacon.fromPromise(HttpUtil.get(VaUrlCreator.environmentConfigUrl()))

const initialStateTemplate = {
  translations: translationsP,
  lang: VaUrlCreator.chooseInitialLanguage(urlContent),
  avustushaku: avustusHakuP,
  environment: environmentP,
}
const initialState = Bacon.combineTemplate(initialStateTemplate)

const app = document.getElementById('app')
const root = createRoot(app!)

initialState.onValue(function (state) {
  root.render(<VaLogin model={state} />)
})
