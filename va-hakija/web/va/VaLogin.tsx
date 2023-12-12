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
import SyntaxValidator from 'soresu-form/web/form/SyntaxValidator'
import TextButton from 'soresu-form/web/form/component/TextButton'
import EmailTextField from 'soresu-form/web/form/component/EmailTextField'
import { LegacyTranslations } from 'soresu-form/web/va/types'
import { HakijaAvustusHaku } from 'soresu-form/web/form/types/Form'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

import VaLoginTopbar from './VaLoginTopbar'
import VaUrlCreator from './VaUrlCreator.js'
import { isJotpaAvustushaku, isJotpaHakemusCustomizationEnabled } from './jotpa'

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
  sent: string
  error: string
}

export default class VaLogin extends React.Component<VaLoginProps, VaLoginState> {
  constructor(props: VaLoginProps) {
    super(props)
    this.state = {
      email: '',
      sent: '',
      error: '',
    }
  }

  handleEmailChange(event: React.ChangeEvent<any>) {
    this.setState({
      email: event.target.value,
      sent: '',
    })
  }

  submit(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.FormEvent<HTMLFormElement>
  ) {
    if ('preventDefault' in event) {
      event.preventDefault()
    }
    if (SyntaxValidator.validateEmail(this.state.email)) {
      return
    }
    const url = urlCreator.newEntityApiUrl(this.props.model)
    const vaLogin = this
    const email = this.state.email
    const model = this.props.model
    HttpUtil.put(url, {
      value: [
        { key: 'primary-email', value: email, fieldType: 'emailField' },
        { key: 'language', value: model.lang, fieldType: 'radioButton' },
      ],
    })
      .then(function (response) {
        vaLogin.setState({
          sent: email,
          error: '',
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
        vaLogin.setState({ error: 'error' })
      })
  }

  render() {
    const model = this.props.model
    const lang = model.lang
    const translations = model.translations
    const avustushaku = model.avustushaku
    const environment = model.environment
    const content = avustushaku.content
    const isOpen = avustushaku.phase === 'current'
    const email = this.state.email
    const sent = this.state.sent
    const error = this.state.error
    const emailIsInvalid = () =>
      !!SyntaxValidator.validateEmail(this.state.email) && this.state.email !== ''
    const canSend = () => email === sent || emailIsInvalid()
    const hakemusPreviewUrl = urlCreator.existingSubmissionEditUrl(avustushaku.id, '', lang)

    const useJotpaColour =
      isJotpaAvustushaku(avustushaku) && isJotpaHakemusCustomizationEnabled({ environment })

    return (
      <div>
        <VaLoginTopbar
          environment={environment}
          translations={translations}
          lang={lang}
          avustushaku={avustushaku}
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
            <LocalizedString
              translations={translations.login}
              translationKey="preview"
              lang={lang}
            />{' '}
            <a target="preview" href={hakemusPreviewUrl}>
              <LocalizedString
                translations={translations.login}
                translationKey="preview-link"
                lang={lang}
              />
            </a>
          </p>
          <h2>
            <LocalizedString
              translations={translations.login}
              translationKey="heading"
              lang={lang}
            />
            <HelpTooltip
              content={translations.login.help}
              lang={lang}
              useJotpaColour={useJotpaColour}
              direction="left"
            />
          </h2>
          <form onSubmit={this.submit.bind(this)}>
            <input type="hidden" name="language" value={lang} />
            <EmailTextField
              htmlId="primary-email"
              hasError={emailIsInvalid()}
              onChange={this.handleEmailChange.bind(this)}
              translations={translations.login}
              value={email}
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
              onClick={this.submit.bind(this)}
              translations={translations.login}
              translationKey="submit"
              lang={lang}
              useJotpaColour={useJotpaColour}
            />
            <div className="message-container">
              <LocalizedString
                hidden={sent === ''}
                className="message"
                translations={translations.login}
                translationKey="message"
                lang={lang}
              />
              <LocalizedString
                hidden={error === ''}
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
