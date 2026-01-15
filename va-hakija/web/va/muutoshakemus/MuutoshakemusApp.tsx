import React from 'react'
import { createRoot } from 'react-dom/client'
import queryString from 'query-string'
// @ts-ignore react-widgets-moment doesn't have proper types
import MomentLocalizer from 'react-widgets-moment'
import Localization from 'react-widgets/Localization'
import moment from 'moment'

import 'soresu-form/web/form/style/theme.css'

import {
  getTranslationContext,
  TranslationContext,
} from 'soresu-form/web/va/i18n/TranslationContext'
import { Language } from 'soresu-form/web/va/i18n/translations'
import { MuutoshakemusComponent } from './Muutoshakemus'
import { Paatos } from './Paatos'

export type Query = {
  lang?: Language
  'user-key'?: string
  'avustushaku-id'?: string
}

function getLanguage(s: unknown): Language {
  if (s === 'sv') return 'sv'
  return 'fi'
}

const query = queryString.parse(location.search) as Query
const lang = getLanguage(query.lang)
const translationContext = getTranslationContext(lang)

if (lang === 'fi') {
  moment.locale(lang)
} else {
  moment.locale(`${lang}-with-finnish-date-format`, {
    parentLocale: lang,
    longDateFormat: {
      LT: 'HH.mm',
      LTS: 'HH.mm.ss',
      L: 'DD.MM.YYYY',
      LL: 'Do MMMM YYYY',
      LLL: 'Do MMMM YYYY, HH.mm',
      LLLL: 'dddd, Do MMMM YYYY, HH.mm',
      l: 'D.M.YYYY',
      ll: 'Do MMM YYYY',
      lll: 'Do MMM YYYY, HH.mm',
      llll: 'ddd, Do MMM YYYY, HH.mm',
    },
  })
}
const localizer = new MomentLocalizer(moment)

const app = (
  <TranslationContext.Provider value={translationContext}>
    <Localization date={localizer} messages={translationContext.t.calendar}>
      {location.pathname.endsWith('/paatos') ? (
        <Paatos query={query} />
      ) : (
        <MuutoshakemusComponent query={query} />
      )}
    </Localization>
  </TranslationContext.Provider>
)

const container = document.getElementById('app')
const root = createRoot(container!)
root.render(app)
