import React from 'react'
import ReactDOM from 'react-dom'

import { MuutoshakemusComponent } from './Muutoshakemus'
import { Paatos } from './Paatos'
import * as queryString from "query-string"
import {
  getTranslationContextFromQuery,
  TranslationContext
} from "../../../../va-common/web/va/i18n/TranslationContext"

const query = queryString.parse(location.search)
const translationContext = getTranslationContextFromQuery(query)

const app = (
  <TranslationContext.Provider value={translationContext}>
    {location.pathname.endsWith('/paatos') ? <Paatos /> : <MuutoshakemusComponent /> }
  </TranslationContext.Provider>
)
ReactDOM.render(app, document.getElementById('app'))
