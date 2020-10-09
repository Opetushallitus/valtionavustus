import * as React from "react";
import * as ReactDOM from "react-dom";
// @ts-ignore
import HttpUtil from "soresu-form/web/HttpUtil"
// @ts-ignore
import * as Bacon from "baconjs"

import '../style/main.less'
// imported for styles
import 'soresu-form/web/form/Form.jsx'

const queryString = require('query-string')

export type Language = 'fi' | 'sv'
export function validateLanguage(s: unknown): Language {
  if (s === 'sv') return 'sv'
    return 'fi'
}

const translationsFi = {
  hakemus: 'Hakemus',
  loading: 'Ladataan lomaketta...',
  contactPersonEdit: {
    haku: 'HAKU',
    registerNumberTitle: 'Asianumero',
    hanke: 'Hanke',
    contactPerson: 'Yhteyshenkilö',
    email: 'Sähköposti',
    phone: 'Puhelin'
  }
}

type Translations = typeof translationsFi

const translationsSv: Translations = {
  hakemus: 'Ansökan',
  loading: translationsFi.loading,
  contactPersonEdit: {
    haku: translationsFi.contactPersonEdit.haku,
    registerNumberTitle: translationsFi.contactPersonEdit.registerNumberTitle,
    hanke: translationsFi.contactPersonEdit.hanke,
    contactPerson: translationsFi.contactPersonEdit.contactPerson,
    email: translationsFi.contactPersonEdit.email,
    phone: translationsFi.contactPersonEdit.phone
  }
}

const translations: { [key in Language]: typeof translationsFi } = {
  fi: translationsFi,
  sv: translationsSv
}

const query = queryString.parse(location.search)
const lang = validateLanguage(query.lang) || 'fi'
// const userKey = query["user-key"]
const avustushakuId = query["avustushaku-id"]

export interface AppProps {
  lang: Language,
}

export interface ContactPersonEditProps {
  lang: Language
  avustushaku?: any
}

export function ContactPersonEdit (props: ContactPersonEditProps) {
  const { lang, avustushaku } = props

  return (<section>
    <section id="contact-person-edit-title">
      <h1>{translations[lang].contactPersonEdit.haku}: <span data-test-id="avustushaku-name">{avustushaku?.content?.name?.[lang]}</span></h1>
      <section className="va-register-number">
        <span className="title">
          {translations[lang].contactPersonEdit.registerNumberTitle}:
        </span>
        <span className="value">{avustushaku?.["register-number"]}</span>
      </section>
    </section>
    <table>
      <thead>
      </thead>
      <tbody>
        <tr>
          <td>
           {translations[lang].contactPersonEdit.hanke} 
          </td>
        </tr>
        <tr>
          <td>
           TODO: ensure that tests fill project-name field 
          </td>
        </tr>
        <tr>
          <td>
           {translations[lang].contactPersonEdit.contactPerson} 
          </td>
          <td>
           {translations[lang].contactPersonEdit.email} 
          </td>
          <td>
           {translations[lang].contactPersonEdit.phone} 
          </td>
        </tr>
        <tr>
          <td>
           <input type="text"></input>
          </td>
          <td>
           <input type="text"></input>
          </td>
          <td>
           <input type="text"></input>
          </td>
        </tr>
      </tbody>
    </table>
    </section>
  )
}

type EnvironmentApiResponse = {
  name: string
}

type AppState = {
  status: 'LOADING'
} | {
  status: 'LOADED'
  avustushaku: any
  environment: EnvironmentApiResponse
}
class App extends React.Component<AppProps, AppState>  {
  unsubscribe: Function

  constructor(props: AppProps) {
    super(props)

    this.state = { status: "LOADING" }

    const initialState = Bacon.combineTemplate({
      environment: Bacon.fromPromise(HttpUtil.get(`/environment`)),
      avustushaku: Bacon.fromPromise(HttpUtil.get(`/api/avustushaku/${avustushakuId}`)),
    })

    this.unsubscribe = initialState.onValue(({ avustushaku, environment }: any) =>
      this.setState({ status: "LOADED", avustushaku, environment })
    )
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  render() {
    const {state, props} = this

    if (state.status === "LOADING")
      return <p>{translations[props.lang].loading}</p>

    return (
      <AppShell lang={lang} env={state.environment.name}>
        <ContactPersonEdit lang={props.lang} avustushaku={state.avustushaku}/>
        <Debug json={state} />
      </AppShell>
    )
  }
}

type AppShellProps = {
  lang: Language,
  env: string
  children?: JSX.Element[]
}

function AppShell({ children, lang, env }: AppShellProps) {
  return (
    <div>
      <TopBar env={env} lang={lang} />
      <section id="container">
        {children}
      </section>
    </div>
  )
}

type TopBarProps = { lang: Language, env: string }
function TopBar({ env }: TopBarProps) {
  return (
    <section id="topbar">
      <div id="top-container">
        <img id="logo" src="img/logo-240x68@2x.png" width="240" height="68" alt="Opetushallitus / Utbildningsstyrelsen" />
        <div className="topbar-right">
          <div className="topbar-title-and-save-status">
            <h1 id="topic">{translations[lang].hakemus}</h1>
          </div>
          <div>
            <div className="important-info">
              <div className="environment-info">
                <div className="environment-info__name">{env}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
type DebugProps = { json: object }
function Debug({ json }: DebugProps) {
  return <pre>{JSON.stringify(json, null, 2)}</pre>
}

ReactDOM.render(
  <App lang={lang} />,
  document.getElementById("app")
  );
