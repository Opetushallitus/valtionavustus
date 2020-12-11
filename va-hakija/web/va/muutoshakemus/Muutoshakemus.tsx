import React, { useEffect, useState } from 'react'
import * as queryString from 'query-string'
import momentLocalizer from 'react-widgets-moment'
import moment from 'moment'

import HttpUtil from 'soresu-form/web/HttpUtil'

import {AvustuksenKayttoajanPidennys} from './components/jatkoaika/AvustuksenKayttoajanPidennys'
import {ContactPerson} from './components/contact-person/ContactPerson'
import {TopBar} from './components/TopBar'
import {Language, MuutoshakemusProps} from './types'
import {translations} from './translations'
import {TranslationContext} from './TranslationContext'
import OriginalHakemusIframe from './OriginalHakemusIframe'
import ErrorBoundary from './ErrorBoundary'
import { createFormikHook } from './formik'

import 'soresu-form/web/form/style/main.less'
import '../style/main.less'

moment.locale('fi')
momentLocalizer()

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

let initialState: MuutoshakemusProps = {
  status: 'LOADING',
  environment: undefined,
  avustushaku: undefined,
  hakemus: undefined
}

export const Muutoshakemus = () => {
  const [state, setState] = useState<MuutoshakemusProps>(initialState)
  const f = createFormikHook(userKey, lang)

  useEffect(() => {
    const fetchProps = async () => {
      const environmentP = HttpUtil.get(`/environment`)
      const avustushakuP = HttpUtil.get(`/api/avustushaku/${avustushakuId}`)
      const hakemusP = HttpUtil.get(`/api/avustushaku/${avustushakuId}/hakemus/${userKey}/normalized`)
      const [environment, avustushaku, hakemus] = await Promise.all([environmentP, avustushakuP, hakemusP])
      const currentProjectEnd = moment(hakemus?.['project-end'])

      f.resetForm({
        values: {
          name: hakemus["contact-person"],
          email: hakemus["contact-email"],
          phone: hakemus["contact-phone"],
          haenKayttoajanPidennysta: false,
          haettuKayttoajanPaattymispaiva: currentProjectEnd.isValid() ? currentProjectEnd.toDate() : new Date(),
          kayttoajanPidennysPerustelut: ''
        }
      })

      setState({environment, avustushaku, hakemus, status: 'LOADED'})
    }

    fetchProps()
  }, [])

  const translationContext = {
    t: translations[lang],
    lang
  }

  return (
    state.status === 'LOADING'
      ? <p>{translations[lang].loading}</p>
      : <TranslationContext.Provider value={translationContext}>
          <form onSubmit={f.handleSubmit}>
            <TopBar env={state.environment?.name || ''} f={f} />
            <section className="soresu-form" id="container">
              <ErrorBoundary>
                <ContactPerson
                  avustushakuName={state.avustushaku.content.name[lang]}
                  projectName={state.hakemus?.["project-name"] || ''}
                  registerNumber={state.avustushaku["register-number"]}
                  f={f}
                />
                <AvustuksenKayttoajanPidennys f={f} projectEnd={state.hakemus?.['project-end'] || ''} />
                <OriginalHakemusIframe avustushakuId={avustushakuId} userKey={userKey} />
              </ErrorBoundary>
            </section>
          </form>
        </TranslationContext.Provider>
  )
}
