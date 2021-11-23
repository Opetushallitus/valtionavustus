import React from 'react'
import moment from 'moment'

import { MuutosTaloudenKayttosuunnitelmaan } from './muutoshakemus/MuutosTaloudenKayttosuunnitelmaan'
import {MuutoshakemusSection} from "./MuutoshakemusSection";
import {isAcceptedWithChanges} from "./Muutoshakemus";
import {OsioPaatos} from "./OsioPaatos";
import { Muutoshakemus, Talousarvio } from './types/muutoshakemus'
import { useTranslations } from "./i18n/TranslationContext"
import { fiLongFormat, parseDateStringToMoment } from 'va-common/web/va/i18n/dateformat'

import './MuutoshakemusValues.less'

export const datetimeFormat = 'D.M.YYYY [klo] HH.mm'

type MuutoshakemusValuesProps = {
  currentTalousarvio: Talousarvio
  muutoshakemus: Muutoshakemus
  hakijaUrl?: string
  projectEndDate?: string
}

export const MuutoshakemusValues = (props: MuutoshakemusValuesProps) => {
  const { currentTalousarvio, muutoshakemus, hakijaUrl, projectEndDate } = props
  const { t } = useTranslations()
  const a = muutoshakemus
  const paatosUrl = `${hakijaUrl}muutoshakemus/paatos?user-key=${a['paatos-user-key']}`
  const talousarvio = muutoshakemus["paatos-talousarvio"]?.length ? muutoshakemus["paatos-talousarvio"] : muutoshakemus.talousarvio
  const hasAnyPaatos = !!muutoshakemus["paatos-status-jatkoaika"] || !!muutoshakemus["paatos-status-talousarvio"] || !!muutoshakemus["paatos-status-sisaltomuutos"]
  return (
    <React.Fragment>
      {hasAnyPaatos &&
        <section className="muutoshakemus-section"
               data-test-id="muutoshakemus-paatos">
            <div className="muutoshakemus__paatos">
                <h2>
                  <span data-test-id="paatos-status-text">Käsitelty</span>
                  {a['paatos-created-at'] && ` ${moment(a['paatos-created-at']).format(datetimeFormat)}`}
                </h2>
                <h3 className="muutoshakemus__header">
                  {a['paatos-sent-at']
                    ? `${t.email.paatos.status.sent} ${moment(a['paatos-sent-at']).format(datetimeFormat)}`
                    : t.email.paatos.status.pending
                  }
                </h3>
                <h3 className="muutoshakemus__header">{t.muutoshakemus.paatos.paatosDokumentti}:</h3>
                <a href={paatosUrl} target="_blank" rel="noopener noreferrer" className="muutoshakemus__paatos-link">{paatosUrl}</a>
              </div>
        </section>
      }
      {muutoshakemus['haettu-kayttoajan-paattymispaiva'] && <PaattymispaivaValues muutoshakemus={muutoshakemus} projectEndDate={projectEndDate} />}
      {!!talousarvio.length &&
        <MuutoshakemusSection>
          <h2 className="muutoshakemus-section-title">Budjetti</h2>
          <MuutosTaloudenKayttosuunnitelmaan
            currentTalousarvio={currentTalousarvio}
            newTalousarvio={talousarvio}
            status={muutoshakemus["paatos-status-talousarvio"]}
            reason={muutoshakemus["talousarvio-perustelut"]} />
        </MuutoshakemusSection>
      }
      {muutoshakemus['haen-sisaltomuutosta'] && (
        <MuutoshakemusSection>
          <h2 className="muutoshakemus-section-title">Sisältö ja toteutustapa</h2>
          <div className="muutoshakemus-row">
            <h4 className="muutoshakemus__header">{t.sisaltomuutos.appliedChange}</h4>
            <div className="muutoshakemus-description-box" data-test-id="sisaltomuutos-perustelut">{muutoshakemus['sisaltomuutos-perustelut']}</div>
          </div>
          {muutoshakemus["paatos-status-sisaltomuutos"] && (
            <div className="muutoshakemus-row">
              <OsioPaatos osio="paatos-sisaltomuutos" paatosStatus={muutoshakemus["paatos-status-sisaltomuutos"]} />
            </div>
           )}
        </MuutoshakemusSection>
      )}
      {muutoshakemus["paatos-reason"] && (
        <div className="muutoshakemus-paatos-reason">
          <h2 className="muutoshakemus__header">Päätöksen perustelut</h2>
          <div data-test-id="muutoshakemus-form-paatos-reason">{muutoshakemus["paatos-reason"]}</div>
        </div>
      )}
    </React.Fragment>
  )
}

function formatDate(date?: string) {
  const d = parseDateStringToMoment(date)

  return d && d.isValid() ? d.format(fiLongFormat) : ''
}

type PaattymispaivaValuesProps = {
  muutoshakemus: Muutoshakemus
  projectEndDate?: string
}

const PaattymispaivaValues = (props: PaattymispaivaValuesProps) => {
  const { t } = useTranslations()

  const { muutoshakemus, projectEndDate } = props
  const acceptedWithChanges = isAcceptedWithChanges(muutoshakemus["paatos-status-jatkoaika"])
  const currentEndDateTitle = acceptedWithChanges ? t.muutoshakemus.previousProjectEndDate : t.muutoshakemus.currentProjectEndDate
  const newEndDateTitle = acceptedWithChanges ? t.muutoshakemus.acceptedChange : t.muutoshakemus.appliedChange
  const newEndDateValue = acceptedWithChanges ? muutoshakemus['paatos-hyvaksytty-paattymispaiva'] : muutoshakemus['haettu-kayttoajan-paattymispaiva']
  const perustelut = muutoshakemus['kayttoajan-pidennys-perustelut']

  return (
    <MuutoshakemusSection>
      <h2 className="muutoshakemus-section-title">Käyttöaika</h2>
      <div className="muutoshakemus__project-end-row">
        <div>
          <h3 className="muutoshakemus__header" data-test-id='muutoshakemus-current-end-date-title'>{currentEndDateTitle}</h3>
          <div data-test-id="project-end-date">{projectEndDate}</div>
        </div>
        <div>
          <h3 className="muutoshakemus__header" data-test-id='muutoshakemus-new-end-date-title'>{newEndDateTitle}</h3>
          <div data-test-id="muutoshakemus-jatkoaika">{formatDate(newEndDateValue)}</div>
        </div>
      </div>
      <div className="muutoshakemus-row">
        <h4 className="muutoshakemus__header" data-test-id='muutoshakemus-reasoning-title'>{t.muutoshakemus.applicantReasoning}</h4>
        <div className="muutoshakemus-description-box" data-test-id="muutoshakemus-jatkoaika-perustelu">{perustelut}</div>
      </div>
      {muutoshakemus["paatos-status-jatkoaika"] && (
        <div className="muutoshakemus-row">
          <OsioPaatos osio="paatos-jatkoaika" paatosStatus={muutoshakemus["paatos-status-jatkoaika"]} />
        </div>
       )}
    </MuutoshakemusSection>
  )
}
