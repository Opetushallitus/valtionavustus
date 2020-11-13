import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom'
import * as queryString from 'query-string'

import HttpUtil from 'soresu-form/web/HttpUtil'

import 'soresu-form/web/form/style/main.less'
import '../style/main.less'
import {AvustuksenKayttoajanPidennys} from './components/jatkoaika/AvustuksenKayttoajanPidennys'
import {ContactPerson} from './components/contact-person/ContactPerson'
import {TopBar} from './components/TopBar'
import {Hakemus, hakemusSchema, Language} from './types'
import {translations} from './translations'
import {TranslationContext, useTranslations} from './TranslationContext'
import {postMuutoshakemus} from './client'
import {
  AppContext,
  AppProvider,
  ChangingContactPersonDetails
} from './store/context'
import {Types} from './store/reducers'
import { omit } from 'lodash'

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

const query = queryString.parse(location.search)
const lang = validateLanguage(query.lang) || 'fi'
const userKey = query['user-key']
const avustushakuId = query['avustushaku-id']

interface ApplicationEditProps {
}
function ApplicationEdit(_props: ApplicationEditProps) {
  const { t } = useTranslations()

  return (
  <section>
    <h1 className="muutoshaku__title">{t.applicationEdit.title}</h1>
    <div className="muutoshaku__form">
      <div className="soresu-checkbox">
        <input type="checkbox" id="content-edit" />
        <label htmlFor="content-edit">{t.applicationEdit.contentEdit}</label>
      </div>
      <div className="muutoshaku__application-edit-cell">
        <label htmlFor="muutoshaku__content-change">{t.applicationEdit.contentEditDetails}</label>
        <textarea id="muutoshaku__content-change" rows={20} />
      </div>
      <div className="soresu-checkbox">
        <input type="checkbox" id="finance-edit" />
        <label htmlFor="finance-edit">{t.applicationEdit.financeEdit}</label>
      </div>
      <div className="muutoshaku__application-edit-cell">
        <table>
          <thead>
            <tr>
              <th>{t.applicationEdit.currentFinanceEstimation}</th>
              <th>{t.applicationEdit.newFinanceEstimation}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th colSpan={2}>{t.applicationEdit.expenses}</th>
            </tr>
            <tr>
              <td>
                <div className="muutoshaku__current-amount">
                  <span>jotain</span>
                  <span>666 €</span>
                </div>
              </td>
              <td>
                <div className="muutoshaku__current-amount">
                  <input className="muutoshaku__currency-input" type="text" />
                  <span>€</span>
                </div>
              </td>
            </tr>
            <tr>
              <th colSpan={2}></th>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th>
                <div className="muutoshaku__current-amount">
                  <span>{t.applicationEdit.expensesInTotal}</span>
                  <span>666 €</span>
                </div>
              </th>
              <th>
                <div className="muutoshaku__current-amount">
                  <span>666</span>
                  <span>€</span>
                </div>
              </th>
            </tr>
          </tfoot>
        </table>
        <label htmlFor="muutoshaku__finance-reasoning">{t.applicationEdit.reasoning}</label>
        <textarea id="muutoshaku__finance-reasoning" rows={5} />
      </div>
    </div>
  </section>
  )
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

const MuutoshakemusApp = () => {
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
              <ApplicationEdit />
              <AvustuksenKayttoajanPidennys
                nykyinenPaattymisPaiva={new Date()} />
              <Debug json={state} />
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
        {children}
      </section>
    </div>
  )
}

type DebugProps = { json: object }
function Debug({ json }: DebugProps) {
  return <pre id="debug-api-response">{JSON.stringify(json, null, 2)}</pre>
}

ReactDOM.render(
  <AppProvider>
    <MuutoshakemusApp />
  </AppProvider>
  ,
  document.getElementById('app')
)
