import React, { useEffect, useState } from 'react'
import * as queryString from 'query-string'
import { omit } from 'lodash'

import HttpUtil from 'soresu-form/web/HttpUtil'

import {AvustuksenKayttoajanPidennys} from './components/jatkoaika/AvustuksenKayttoajanPidennys'
import {ContactPerson} from './components/contact-person/ContactPerson'
import {TopBar} from './components/TopBar'
import {Hakemus, hakemusSchema, Language} from './types'
import {translations} from './translations'
import {TranslationContext} from './TranslationContext'
import {postMuutoshakemus} from './client'
import {AppContext, ChangingContactPersonDetails} from './store/context'
import {Types} from './store/reducers'
import OriginalHakemusIframe from './OriginalHakemusIframe'

import 'soresu-form/web/form/style/main.less'
import '../style/main.less'

function isRequired<T>(val: T): val is Required<T> {
  return !Object.values(val).some((value) => !value)
}

function isValidYhteyshenkilo(henkilo?: Partial<ChangingContactPersonDetails>): henkilo is Required<ChangingContactPersonDetails> {
  if (!henkilo) return false
  return isRequired(omit(henkilo, ['validationError']))
}

function validateLanguage(s: unknown): Language {
  if (s !== 'fi' && s !== 'sv') {
    throw new Error(`Unrecognized language: ${s}`)
  }
  return s
}

type EnvironmentApiResponse = {
  name: string
}

type MuutoshakemusProps = {
  status: 'LOADED' | 'LOADING'
  avustushaku?: any
  environment?: EnvironmentApiResponse
  hakemus?: Hakemus
  hakemusJson?: any
}

let initialState: MuutoshakemusProps = {
  status: 'LOADING',
  environment: undefined,
  avustushaku: undefined,
  hakemus: undefined,
  hakemusJson: undefined
}

export const Muutoshakemus = () => {
  const query = queryString.parse(location.search)
  const lang = validateLanguage(query.lang) || 'fi'
  const userKey = query['user-key']
  const avustushakuId = query['avustushaku-id']
  const { dispatch, state: formState } = React.useContext(AppContext)
  const [state, setState] = useState<MuutoshakemusProps>(initialState)

  useEffect(() => {
    const fetchProps = async () => {
      try {
        const environmentP = HttpUtil.get(`/environment`)
        const avustushakuP = HttpUtil.get(`/api/avustushaku/${avustushakuId}`)
        const hakemusJsonP = HttpUtil.get(`/api/avustushaku/${avustushakuId}/hakemus/${userKey}`)
        const hakemusP = HttpUtil.get(`/api/avustushaku/${avustushakuId}/hakemus/${userKey}/normalized`)

        const [environment, avustushaku, hakemusJson, hakemus] = await Promise.all([environmentP, avustushakuP, hakemusJsonP, hakemusP])

        dispatch({
          type: Types.InitialState,
          payload: {
            yhteyshenkilo: {
              name: hakemus["contact-person"],
              email: hakemus["contact-email"],
              phone: hakemus["contact-phone"],
            }
          }
        })

        dispatch({
          type: Types.ContactPersonFormChange,
          payload: {
            formState: {
              name: hakemus["contact-person"],
              email: hakemus["contact-email"],
              phone: hakemus["contact-phone"],
            }
          }
        })

        setState({environment, avustushaku, hakemusJson, hakemus, status: 'LOADED'})
      } catch (err) {
        console.log(err)
        throw err
      }
    }
    fetchProps()
  }, [])

  async function handleSendButton() {
    const { jatkoaika, yhteyshenkilo } = formState
    const henkilo = isValidYhteyshenkilo(yhteyshenkilo) ? yhteyshenkilo : undefined

    try {
      await postMuutoshakemus({
        avustushakuId,
        userKey,
        jatkoaika: jatkoaika,
        yhteyshenkilo: henkilo
      })
      dispatch({
        type: Types.SubmitSuccess,
        payload: {
          jatkoaika: jatkoaika,
          yhteyshenkilo: henkilo
        }
      })
    } catch (e) {
      dispatch({
        type: Types.SubmitFailure,
        payload: { error: e }
      })
    }
  }

  const translationContext = {
    t: translations[lang],
    lang
  }

  return (
    <>
      {state.status === 'LOADING'
        ? <p>{translations[lang].loading}</p>
        : <TranslationContext.Provider value={translationContext}>
            <AppShell env={state.environment?.name || ''} onSend={handleSendButton}>
              <ContactPerson
                avustushakuName={state.avustushaku.content.name[lang]}
                projectName={hakemusSchema.validateSync(state.hakemus)["project-name"]}
                registerNumber={state.avustushaku["register-number"]}
                lang={lang} />
              <AvustuksenKayttoajanPidennys
                nykyinenPaattymisPaiva={new Date()} />
              <OriginalHakemusIframe avustushakuId={avustushakuId} userKey={userKey} />
            </AppShell>
          </TranslationContext.Provider>
      }
    </>
  )
}

type AppShellProps = {
  env: string
  children?: JSX.Element[]
  onSend: () => void
}

function AppShell({ children, env, onSend }: AppShellProps) {
  return (
    <div>
      <TopBar env={env} onSend={onSend} />
      <section className="soresu-form" id="container">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </section>
    </div>
  )
}

type ErrorBoundaryProps = React.PropsWithChildren<void>

type ErrorBoundaryState
  = { hasError: false }
  | { hasError: true, error: Error }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render () {
    if (this.state.hasError) {
      return <div>
        <h1>Erhe on tapahtunut</h1>
        <pre>{this.state.error.stack}</pre>
      </div>
    }

    return this.props.children
  }
}
