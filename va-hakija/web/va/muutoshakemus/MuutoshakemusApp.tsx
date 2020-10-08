import * as React from "react";
import * as ReactDOM from "react-dom";

const queryString = require('query-string')

export type Language = 'fi' | 'sv'
export function validateLanguage(s: unknown): Language {
  if (s === 'sv') return 'sv'
    return 'fi'
}

const translations = {
  contactPersonEdit: {
    haku: {
      fi: 'HAKU',
      sv: 'HAKU'
    }
  }
}

const query = queryString.parse(location.search)
const lang = validateLanguage(query.lang) || 'fi'

export interface AppProps {
  lang: Language,
}

export interface ContactPersonEditProps {
  lang: Language
}

export function ContactPersonEdit (props: ContactPersonEditProps) {
  const lang = props.lang

  return <>
    <h3>{translations.contactPersonEdit.haku[lang]}: INNOVATIIVISET OPPIMISYMPÄRISTÖT</h3>
  </>
}

export function App(props: AppProps) {
  return (
    <ContactPersonEdit lang={props.lang}/>
  );
}

ReactDOM.render(
  <App lang={lang} />,
  document.getElementById("app")
  );
