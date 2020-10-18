import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import * as Bacon from 'baconjs'
import * as queryString from 'query-string'

import HttpUtil from 'soresu-form/web/HttpUtil'

import 'soresu-form/web/form/style/main.less'
import '../style/main.less'
import {
  AvustuksenKayttoajanPidennys,
  AvustuksenKayttoajanPidennysInput
} from './components/jatkoaika/AvustuksenKayttoajanPidennys'
import {TopBar} from './components/TopBar'
import {Language} from './types'
import {translations} from './translations'
import {TranslationContext, useTranslations} from './TranslationContext'
import {haeKayttoajanPidennysta} from './client'

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

interface ContactPersonEditProps {
  avustushaku?: any
  hakemus?: any
}

function getAnswerFromHakemus(hakemus: any, keyName: string) {
  const answer = hakemus?.submission?.answers?.value?.find(({key}: {key: string}) => key === keyName)
  return answer?.value || ''
}

function ContactPersonEdit(props: ContactPersonEditProps) {
  const { avustushaku, hakemus } = props
  const { t } = useTranslations()
  return (
  <section>
    <div className="muutoshaku__page-title">
      <h1 className="muutoshaku__title">{t.contactPersonEdit.haku}: <span data-test-id="avustushaku-name">{avustushaku?.content?.name?.[lang]}</span></h1>
      <span className="va-register-number">
        <span className="muutoshaku__register-number">{t.contactPersonEdit.registerNumberTitle}: </span>
        <span data-test-id="register-number">{avustushaku?.["register-number"]}</span>
      </span>
    </div>
    <div className="muutoshaku__form">
      <div className="muutoshaku__form-row">
        <div className="muutoshaku__form-cell">
          <div>{t.contactPersonEdit.hanke}</div>
          <div data-test-id="project-name">{getAnswerFromHakemus(hakemus, 'project-name')}</div>
        </div>
      </div>
      <div className="muutoshaku__form-row">
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__contact-person">{t.contactPersonEdit.contactPerson}</label>
          <input id="muutoshaku__contact-person" type="text" defaultValue={getAnswerFromHakemus(hakemus, "applicant-name")} />
        </div>
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__email">{t.contactPersonEdit.email}</label>
          <input id="muutoshaku__email" type="text" defaultValue={getAnswerFromHakemus(hakemus, 'primary-email')} />
        </div>
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__phone">{t.contactPersonEdit.phone}</label>
          <input id="muutoshaku__phone" type="text" defaultValue={getAnswerFromHakemus(hakemus, "textField-0")}/>
        </div>
      </div>
    </div>
  </section>
  )
}

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
  hakemus?: any
}

let initialState: MuutoshakemusProps = {
  status: 'LOADING',
  environment: undefined,
  avustushaku: undefined,
  hakemus: undefined
}

const MuutoshakemusApp = () => {
  const [state, setState] = useState<MuutoshakemusProps>(initialState)
  const [kayttoaika, setKayttoaika] = useState<AvustuksenKayttoajanPidennysInput>()
  const [hasUnsavedChanges, setUnsavedChanges] = useState(false)

  useEffect(() => {
    const fetchProps = async () => {
      Bacon
        .combineTemplate({
          environment: Bacon.fromPromise(HttpUtil.get(`/environment`)),
          avustushaku: Bacon.fromPromise(HttpUtil.get(`/api/avustushaku/${avustushakuId}`)),
          hakemus: Bacon.fromPromise(HttpUtil.get(`/api/avustushaku/${avustushakuId}/hakemus/${userKey}`))
        })
        .onValue((values: any) => {
          setState({ status: 'LOADED', ...values })
        })
    }
    fetchProps()
  }, [])

  const handleKayttoajanPidennysChange = (inputs: AvustuksenKayttoajanPidennysInput) => {
    setUnsavedChanges(true)
    setKayttoaika(inputs)
  }

  async function handleSendButton() {
    try {
      if (kayttoaika) {
        await haeKayttoajanPidennysta({
          avustushakuId,
          userKey,
          params: kayttoaika,
        })
        setUnsavedChanges(false)
        // FIXME: Bugi: tila on voinut muuttua tallennuksen aikana (näppäinpainalluksia)
        // FIXME: Tallenna se mitä lähetettiin ja vertaa siihen

        // TODO: Näytä toast tms. että tallennus onnistunut
      }
    } catch (e) {
      setUnsavedChanges(true)
      // TODO: Näytä että tallennus epäonnistui
      // TODO: Lähetä virheet alaspäin lapsikomponenteille
    }
  }

  const translationContext = {
    t: translations[lang],
    lang
  }

  return (
    <>
      {status === 'LOADING'
        ? <p>{translations[lang].loading}</p>
        : <TranslationContext.Provider value={translationContext}>
            <AppShell env={state.environment?.name || ''} onSend={handleSendButton}>
              <ContactPersonEdit avustushaku={state.avustushaku} hakemus={state.hakemus}/>
              <ApplicationEdit />
              <AvustuksenKayttoajanPidennys
                onChange={handleKayttoajanPidennysChange}
                nykyinenPaattymisaika={new Date()} />
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
  <MuutoshakemusApp />,
  document.getElementById('app')
)
