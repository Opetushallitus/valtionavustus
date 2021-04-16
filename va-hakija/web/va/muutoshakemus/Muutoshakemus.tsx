import React, { useEffect, useState } from 'react'
import * as queryString from 'query-string'
import momentLocalizer from 'react-widgets-moment'
import moment from 'moment'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { MuutoshakemusValues } from 'va-common/web/va/MuutoshakemusValues'
import { Muutoshakemus, MuutoshakemusProps } from 'va-common/web/va/types/muutoshakemus'
import { getProjectEndDate, getProjectEndMoment, getLatestApprovedTalousarvio } from 'va-common/web/va/Muutoshakemus'

import { MuutoshakemusFormSection } from './components/MuutoshakemusFormSection'
import { AvustuksenKayttoaikaInput } from './components/jatkoaika/AvustuksenKayttoaikaInput'
import { TalousarvioForm } from './components/talous/TalousarvioForm'
import {ContactPerson} from './components/contact-person/ContactPerson'
import {TopBar} from './components/TopBar'
import {Language, translations} from './translations'
import {TranslationContext} from './TranslationContext'
import OriginalHakemusIframe from './OriginalHakemusIframe'
import ErrorBoundary from './ErrorBoundary'
import { createFormikHook, getTalousarvioValues } from './formik'
import {useTranslations} from './TranslationContext'

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

let initialState: MuutoshakemusProps = {
  status: 'LOADING',
  environment: undefined,
  avustushaku: undefined,
  hakemus: undefined,
  muutoshakemukset: []
}

export const MuutoshakemusComponent = () => {
  const query = queryString.parse(location.search)
  const lang = validateLanguage(query.lang) || 'fi'
  const userKey = query['user-key']
  const avustushakuId = query['avustushaku-id']
  const [state, setState] = useState<MuutoshakemusProps>(initialState)
  const f = createFormikHook(userKey, lang)
  const translationContext = { t: translations[lang], lang }
  const existingNewMuutoshakemus = state.muutoshakemukset.find(m => m.status === 'new')

  useEffect(() => {
    const fetchProps = async () => {
      const environmentP = HttpUtil.get(`/environment`)
      const avustushakuP = HttpUtil.get(`/api/avustushaku/${avustushakuId}`)
      const hakemusP = HttpUtil.get(`/api/avustushaku/${avustushakuId}/hakemus/${userKey}/normalized`)
      const muutoshakemuksetP = HttpUtil.get(`/api/avustushaku/${avustushakuId}/hakemus/${userKey}/muutoshakemus`)
      const [environment, avustushaku, hakemus, muutoshakemukset] = await Promise.all([environmentP, avustushakuP, hakemusP, muutoshakemuksetP])
      const currentProjectEnd = getProjectEndMoment(avustushaku, muutoshakemukset)

      f.resetForm({
        values: {
          name: hakemus["contact-person"],
          email: hakemus["contact-email"],
          phone: hakemus["contact-phone"],
          haenKayttoajanPidennysta: false,
          haenMuutostaTaloudenKayttosuunnitelmaan: false,
          haettuKayttoajanPaattymispaiva: currentProjectEnd.isValid() ? currentProjectEnd.toDate() : new Date(),
          kayttoajanPidennysPerustelut: '',
          taloudenKayttosuunnitelmanPerustelut: '',
          talousarvio: getTalousarvioValues(hakemus.talousarvio)
        }
      })

      setState({environment, avustushaku, hakemus, muutoshakemukset, status: 'LOADED'})
    }

    fetchProps()
  }, [])

  useEffect(() => {
    const fetchMuutoshakemukset = async () => {
      if (f.status && f.status.success) {
        const muutoshakemukset: Muutoshakemus[] = await HttpUtil.get(`/api/avustushaku/${avustushakuId}/hakemus/${userKey}/muutoshakemus`)
        setState({ ...state, muutoshakemukset })
      }
    }
    fetchMuutoshakemukset()
  }, [f.status])

  const existingMuutoshakemus = (m: Muutoshakemus, index: number, allMuutoshakemus: Muutoshakemus[]) => {
    const previousMuutoshakemus = allMuutoshakemus.filter(i => i["created-at"] < m["created-at"])
    const projectEndDate = getProjectEndDate(state.avustushaku, previousMuutoshakemus)

    const topic = `${translations[lang].muutoshakemus} ${moment(m['created-at']).format('D.M.YYYY')}`
    const waitingForDecision = m.status === 'new' ? ` - ${translations[lang].waitingForDecision}` : ''
    return (
      <section className="muutoshakemus__section" data-test-class="existing-muutoshakemus" key={index}>
        <h1 className="muutoshakemus__title">{`${topic}${waitingForDecision}`}</h1>
        <div className="muutoshakemus__form">
          <MuutoshakemusValues
            currentTalousarvio={getLatestApprovedTalousarvio(state.hakemus, previousMuutoshakemus)}
            muutoshakemus={m}
            hakijaUrl={state.environment?.['hakija-server'].url[lang]}
            simplePaatos={true}
            projectEndDate={projectEndDate} />
        </div>
      </section>
    )
  }

  const { t } = useTranslations()
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
                {!existingNewMuutoshakemus &&
                  <section className="muutoshakemus__section">
                    <h1 className="muutoshakemus__title">{t.applicationEdit.title}</h1>
                    <div className="muutoshakemus__form">
                      <MuutoshakemusFormSection f={f} name="haenKayttoajanPidennysta" title={t.kayttoajanPidennys.checkboxTitle}>
                        <AvustuksenKayttoaikaInput f={f} projectEnd={getProjectEndDate(state.avustushaku, state.muutoshakemukset)} />
                      </MuutoshakemusFormSection>
                      {state.environment?.budjettimuutoshakemus["enabled?"] &&
                        <MuutoshakemusFormSection f={f} name="haenMuutostaTaloudenKayttosuunnitelmaan" title={t.muutosTaloudenKayttosuunnitelmaan.checkboxTitle}>
                          <TalousarvioForm f={f} talousarvio={state.hakemus?.talousarvio || []} />
                        </MuutoshakemusFormSection>
                      }
                    </div>
                  </section>
                }
                {state.muutoshakemukset.map(existingMuutoshakemus)}
                <OriginalHakemusIframe avustushakuId={avustushakuId} userKey={userKey} />
              </ErrorBoundary>
            </section>
          </form>
        </TranslationContext.Provider>
  )
}
