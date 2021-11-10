import React from 'react'
import moment from 'moment'

import {MuutosTaloudenKayttosuunnitelmaan} from './muutoshakemus/MuutosTaloudenKayttosuunnitelmaan'
import {Muutoshakemus, Talousarvio} from './types/muutoshakemus'
import {useTranslations} from "./i18n/TranslationContext"
import {
  fiLongFormat,
  parseDateStringToMoment
} from 'va-common/web/va/i18n/dateformat'

import './OsiokohtainenMuutoshakemusValues.less'
import {isAcceptedWithChanges} from "./Muutoshakemus";
import {OsioPaatos} from "./OsioPaatos";

export const datetimeFormat = 'D.M.YYYY [klo] HH.mm'

type OsiokohtainenMuutoshakemusValuesProps = {
  currentTalousarvio: Talousarvio
  muutoshakemus: Muutoshakemus
  hakijaUrl?: string
  projectEndDate?: string
}

export const OsiokohtainenMuutoshakemusValues = (props: OsiokohtainenMuutoshakemusValuesProps) => {
  const {currentTalousarvio, muutoshakemus, hakijaUrl, projectEndDate} = props
  const {t} = useTranslations()
  const a = muutoshakemus
  const paatosUrl = `${hakijaUrl}muutoshakemus/paatos?user-key=${a['paatos-user-key']}`
  const talousarvio = muutoshakemus["paatos-talousarvio"]?.length ? muutoshakemus["paatos-talousarvio"] : muutoshakemus.talousarvio
  return (
    <React.Fragment>
      {a.status !== undefined && a.status !== 'new' &&
      <section className="osiokohtainen-muutoshakemus-section" data-test-id="muutoshakemus-paatos">
        <div className="osiokohtainen-muutoshakemus__paatos-info">
          <div className="osiokohtainen-muutoshakemus__kasitelty-date">
            {a['paatos-sent-at']
              ? `${t.email.paatos.status.sent} ${moment(a['paatos-sent-at']).format(datetimeFormat)}`
              : t.email.paatos.status.pending
            }
          </div>
          <a href={paatosUrl} target="_blank" rel="noopener noreferrer"
             className="osiokohtainen-muutoshakemus__paatos-link">{t.muutoshakemus.paatos.paatosDokumentti}</a>
        </div>
      </section>
      }
      <section className="osiokohtainen-muutoshakemus__osiot-container">
        {muutoshakemus['haettu-kayttoajan-paattymispaiva'] &&
          <PaattymispaivaValues muutoshakemus={muutoshakemus} projectEndDate={projectEndDate}/>
        }
        {!!talousarvio.length &&
          <div className="osiokohtainen-muutoshakemus__osio-container">
            <h2 className="osiokohtainen-muutoshakemus__sub-title">{t.muutoshakemus.paatos.budjetti}</h2>
            <MuutosTaloudenKayttosuunnitelmaan
              currentTalousarvio={currentTalousarvio}
              newTalousarvio={talousarvio}
              status={muutoshakemus["paatos-status-talousarvio"]}
              reason={muutoshakemus["talousarvio-perustelut"]}/>
          </div>
        }
        {muutoshakemus['haen-sisaltomuutosta'] && (
          <SisaltoPaatosValues muutoshakemus={muutoshakemus} />
        )}
        {muutoshakemus['paatos-reason'] && (
          <div className="osiokohtainen-muutoshakemus__accepted-changes">
            <h2 className="osiokohtainen-muutoshakemus__sub-title">{t.muutoshakemus.paatos.perustelut}</h2>
            <div>{muutoshakemus['paatos-reason']}</div>
          </div>
        )}
      </section>
    </React.Fragment>
  )
}

function formatDate(date?: string) {
  const d = parseDateStringToMoment(date)

  return d && d.isValid() ? d.format(fiLongFormat) : ''
}

type SisaltoPaatosProps = {
  muutoshakemus: Muutoshakemus
}

const SisaltoPaatosValues = (props: SisaltoPaatosProps) => {
  const {t} = useTranslations()
  const {muutoshakemus} = props

  const sisaltomuutosPaatosStatus = muutoshakemus['paatos-status-sisaltomuutos']
  return (
    <>
      <div className="osiokohtainen-muutoshakemus__osio-container">
        <h2
          className="osiokohtainen-muutoshakemus__sub-title">{t.sisaltomuutos.sectionTitle}</h2>
        <div className="muutoshakemus-row">
          <h4
            className="osiokohtainen-muutoshakemus__header">{t.sisaltomuutos.appliedChange}</h4>
          <div className="muutoshakemus-description-box"
               data-test-id="sisaltomuutos-perustelut">{muutoshakemus['sisaltomuutos-perustelut']}</div>
        </div>

        {sisaltomuutosPaatosStatus &&
        <div className="osiokohtainen-muutoshakemus__paatos">
          <OsioPaatos osio={'paatos-sisaltomuutos'}
                      paatosStatus={sisaltomuutosPaatosStatus}/>
        </div>}

        {muutoshakemus['hyvaksytyt-sisaltomuutokset'] && (
          <div className="osiokohtainen-muutoshakemus__osio-accepted-changes">
            <h2 className="osiokohtainen-muutoshakemus__sub-title">{t.sisaltomuutos.acceptedChanges}</h2>
            <div>{muutoshakemus['hyvaksytyt-sisaltomuutokset']}</div>
          </div>
        )}
      </div>


    </>
  )
}

type PaattymispaivaValuesProps = {
  muutoshakemus: Muutoshakemus
  projectEndDate?: string
}

const PaattymispaivaValues = (props: PaattymispaivaValuesProps) => {
  const {t} = useTranslations()

  const {muutoshakemus, projectEndDate} = props
  const jatkoaikaStatus = muutoshakemus['paatos-status-jatkoaika']
  const acceptedWithChanges = isAcceptedWithChanges(jatkoaikaStatus)
  const currentEndDateTitle = acceptedWithChanges ? t.muutoshakemus.previousProjectEndDate : t.muutoshakemus.currentProjectEndDate
  const newEndDateTitle = acceptedWithChanges ? t.muutoshakemus.acceptedChange : t.muutoshakemus.appliedChange
  const newEndDateValue = acceptedWithChanges ? muutoshakemus['paatos-hyvaksytty-paattymispaiva'] : muutoshakemus['haettu-kayttoajan-paattymispaiva']
  const perustelut = muutoshakemus['kayttoajan-pidennys-perustelut']
  const requestedEndDate = muutoshakemus['haettu-kayttoajan-paattymispaiva']

  return (
    <div className="osiokohtainen-muutoshakemus__osio-container">
      <h2 className="osiokohtainen-muutoshakemus__sub-title">{t.muutoshakemus.acceptedChange}</h2>
      <div className="osiokohtainen-muutoshakemus__project-end-row">
        <div>
          <h3 className="osiokohtainen-muutoshakemus__header"
              data-test-id='muutoshakemus-current-end-date-title'>{currentEndDateTitle}</h3>
          <div className="osiokohtainen-muutoshakemus__date" data-test-id="project-end-date">{projectEndDate}</div>
        </div>
        {acceptedWithChanges &&
          <div>
            <h3 className="osiokohtainen-muutoshakemus__header"
                data-test-id='muutoshakemus-new-end-date-title'>{t.muutoshakemus.appliedChange}</h3>
            <div className="osiokohtainen-muutoshakemus__date osiokohtainen-muutoshakemus__overridden-date"
                 data-test-id="muutoshakemus-haettu-aika">{formatDate(requestedEndDate)}</div>
          </div>
        }
        <div>
          <h3 className="osiokohtainen-muutoshakemus__header"
              data-test-id='muutoshakemus-new-end-date-title'>{newEndDateTitle}</h3>
          <div className="osiokohtainen-muutoshakemus__date"
            data-test-id="muutoshakemus-jatkoaika">{formatDate(newEndDateValue)}</div>
        </div>
      </div>
      <h4 className="osiokohtainen-muutoshakemus__header"
          data-test-id='muutoshakemus-reasoning-title'>{t.muutoshakemus.applicantReasoning}</h4>
      <div className="osiokohtainen-muutoshakemus__description-box"
           data-test-id="muutoshakemus-jatkoaika-perustelu">{perustelut}</div>
      {jatkoaikaStatus &&
        <div className="osiokohtainen-muutoshakemus__paatos">
          <OsioPaatos osio={'paatos-jatkoaika'} paatosStatus={jatkoaikaStatus}/>
        </div> }
    </div>
  )
}
