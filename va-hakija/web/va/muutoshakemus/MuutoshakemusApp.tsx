import * as React from "react";
import * as ReactDOM from "react-dom";
// @ts-ignore
import HttpUtil from "soresu-form/web/HttpUtil"
// @ts-ignore
import * as Bacon from "baconjs"

const queryString = require('query-string')

export type Language = 'fi' | 'sv'
export function validateLanguage(s: unknown): Language {
  if (s === 'sv') return 'sv'
    return 'fi'
}

const translationsFi = {
  loading: 'Ladataan lomaketta...',
  contactPersonEdit: {
    haku: 'HAKU'
  }
}

type Translations = typeof translationsFi

const translationsSv: Translations = {
  loading: translationsFi.loading,
  contactPersonEdit: {
    haku: translationsFi.contactPersonEdit.haku
  }
}

const translations: { [key in Language]: typeof translationsFi } = {
  fi: translationsFi,
  sv: translationsSv
}

const query = queryString.parse(location.search)
const lang = validateLanguage(query.lang) || 'fi'

export interface AppProps {
  lang: Language,
}

export interface ContactPersonEditProps {
  lang: Language
  avustushaku?: any
}

export function ContactPersonEdit (props: ContactPersonEditProps) {
  const { lang, avustushaku } = props

  return (
    <div>
      <h3>{translations[lang].contactPersonEdit.haku}: {avustushaku?.content?.name?.[lang]}</h3>
    </div>
  )
}

type AppState = {
  status: 'LOADING'
} | {
  status: 'LOADED'
  avustushaku: any
}
class App extends React.Component<AppProps, AppState>  {
  unsubscribe: Function

  constructor(props: AppProps) {
    super(props)

    this.state = { status: "LOADING" }
    const avustushakuId = 2

    const avustushaku = Bacon.fromPromise(HttpUtil.get(`/api/avustushaku/${avustushakuId}`))

    this.unsubscribe = avustushaku.onValue((avustushaku: any) =>
      this.setState({ status: "LOADED", avustushaku })
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
      <div>
        <ContactPersonEdit lang={props.lang} avustushaku={state.avustushaku}/>
        <Debug json={state} />
      </div>
  )
  }
}

type DebugProps = { json: object }
function Debug({ json }: DebugProps) {
  return <pre>{JSON.stringify(json, null, 2)}</pre>
}

ReactDOM.render(
  <App lang={lang} />,
  document.getElementById("app")
  );
