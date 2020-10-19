import React, { useEffect, useState } from 'react'
import * as yup from 'yup'
import ReactDOM from 'react-dom'
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
  hakemus: Hakemus
}

function ContactPersonEdit(props: ContactPersonEditProps) {
  const { avustushaku, hakemus } = props

  if (!hakemus) {
    throw new Error('Hakemus is undefined')
  }
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
          <div data-test-id="project-name">{hakemus['project-name']}</div>
        </div>
      </div>
      <div className="muutoshaku__form-row">
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__contact-person">{t.contactPersonEdit.contactPerson}</label>
          <input id="muutoshaku__contact-person" type="text" defaultValue={hakemus["contact-person"]} />
        </div>
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__email">{t.contactPersonEdit.email}</label>
          <input id="muutoshaku__email" type="text" defaultValue={hakemus['contact-email']} />
        </div>
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__phone">{t.contactPersonEdit.phone}</label>
          <input id="muutoshaku__phone" type="text" defaultValue={hakemus['contact-phone']}/>
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

interface Hakemus {
  "user-key": string
  "project-name": string
  "contact-person": string
  "contact-email": string
  "contact-phone": string
}
const hakemusSchema = yup.object().shape<Hakemus>({
  "user-key": yup.string().required(),
  "project-name": yup.string().required(),
  "contact-person": yup.string().required(),
  "contact-email": yup.string().required(),
  "contact-phone": yup.string().required()
}).required()

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
  const [state, setState] = useState<MuutoshakemusProps>(initialState)
  const [kayttoaika, setKayttoaika] = useState<AvustuksenKayttoajanPidennysInput>()
  const [/*_hasUnsavedChanges*/, setUnsavedChanges] = useState(false)

  useEffect(() => {
    const fetchProps = async () => {

      try {
        const environmentP = HttpUtil.get(`/environment`)
        const avustushakuP = HttpUtil.get(`/api/avustushaku/${avustushakuId}`)
        const hakemusJsonP = HttpUtil.get(`/api/avustushaku/${avustushakuId}/hakemus/${userKey}`)
        const hakemusP = HttpUtil.get(`/api/avustushaku/${avustushakuId}/hakemus/${userKey}/normalized`)

        const [environment, avustushaku, hakemusJson, hakemus] = await Promise.all([environmentP, avustushakuP, hakemusJsonP, hakemusP])

        setState({environment, avustushaku, hakemusJson, hakemus, status: 'LOADED'})
      } catch (err) {
        console.log(err)
        throw err
      }
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
          hakemusVersion: state.hakemusJson.version,
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
      {state.status === 'LOADING'
        ? <p>{translations[lang].loading}</p>
        : <TranslationContext.Provider value={translationContext}>
            <AppShell env={state.environment?.name || ''} onSend={handleSendButton}>
              <ContactPersonEdit avustushaku={state.avustushaku} hakemus={hakemusSchema.validateSync(state.hakemus)}/>
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
