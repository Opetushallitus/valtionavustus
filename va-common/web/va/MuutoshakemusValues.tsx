import React from 'react'
import moment from 'moment'

import { Muutoshakemus as MuutoshakemusStatuses } from './status'
import { MuutosTaloudenKayttosuunnitelmaan } from './muutoshakemus/MuutosTaloudenKayttosuunnitelmaan'
import { Muutoshakemus, Talousarvio } from './types/muutoshakemus'
import { useTranslations } from "./i18n/TranslationContext"

import './MuutoshakemusValues.less'

export const datetimeFormat = 'D.M.YYYY [klo] HH.mm'

type MuutoshakemusValuesProps = {
  currentTalousarvio: Talousarvio
  muutoshakemus: Muutoshakemus
  hakijaUrl?: string
  simplePaatos: boolean
  projectEndDate?: string
}

export const MuutoshakemusValues = (props: MuutoshakemusValuesProps) => {
  const { currentTalousarvio, muutoshakemus, hakijaUrl, simplePaatos, projectEndDate } = props
  const { t } = useTranslations()
  const a = muutoshakemus
  const paatosUrl = `${hakijaUrl}muutoshakemus/paatos?user-key=${a['paatos-user-key']}`
  const talousarvio = muutoshakemus["paatos-talousarvio"]?.length ? muutoshakemus["paatos-talousarvio"] : muutoshakemus.talousarvio
  return (
    <React.Fragment>
      {a.status !== 'new' &&
        <section className="muutoshakemus-section" data-test-id="muutoshakemus-paatos">
          {simplePaatos
            ? <h1 className="muutoshakemus__paatos-status">
                <span className={`muutoshakemus__paatos-icon muutoshakemus__paatos-icon--${a.status}`}>
                  <span data-test-id="paatos-status-text">{MuutoshakemusStatuses.statusToFI(a.status)}</span>
                  {a['paatos-created-at'] && ` ${moment(a['paatos-created-at']).format(datetimeFormat)}`}
                </span>
              </h1>
            : <div className="muutoshakemus__paatos">
                <h2 className="muutoshakemus__paatos-status">
                  <span className={`muutoshakemus__paatos-icon muutoshakemus__paatos-icon--${a.status}`}>
                    <span data-test-id="paatos-status-text">{MuutoshakemusStatuses.statusToFI(a.status)}</span>
                    {a['paatos-created-at'] && ` ${moment(a['paatos-created-at']).format(datetimeFormat)}`}
                  </span>
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
          }
        </section>
      }
      {!!talousarvio.length &&
        <MuutosTaloudenKayttosuunnitelmaan
          currentTalousarvio={currentTalousarvio}
          newTalousarvio={talousarvio}
          status={muutoshakemus.status}
          reason={muutoshakemus["talousarvio-perustelut"]}
          lang={'fi'} />
      }
      {muutoshakemus['haettu-kayttoajan-paattymispaiva'] &&
        <PaattymispaivaValues
        muutoshakemus={muutoshakemus}
        projectEndDate={projectEndDate} />
      }
    </React.Fragment>
  )
}

function formatDate(date?: string) {
  if (!date) return ''
  const parsedDate = moment(date)
  return parsedDate.isValid() ? parsedDate.format('DD.MM.YYYY') : ''
}

type PaattymispaivaValuesProps = {
  muutoshakemus: Muutoshakemus
  projectEndDate?: string
}

const PaattymispaivaValues = (props: PaattymispaivaValuesProps) => {
  const { t } = useTranslations()

  const { muutoshakemus, projectEndDate } = props
  const isAcceptedWithChanges = muutoshakemus.status === 'accepted_with_changes'
  const currentEndDateTitle = isAcceptedWithChanges ? t.muutoshakemus.previousProjectEndDate : t.muutoshakemus.currentProjectEndDate
  const newEndDateTitle = isAcceptedWithChanges ? t.muutoshakemus.acceptedChange : t.muutoshakemus.appliedChange
  const newEndDateValue = isAcceptedWithChanges ? muutoshakemus['paatos-hyvaksytty-paattymispaiva'] : muutoshakemus['haettu-kayttoajan-paattymispaiva']
  const perustelut = muutoshakemus['kayttoajan-pidennys-perustelut']

  return (
    <section className="muutoshakemus-section">
      <div className="muutoshakemus-row muutoshakemus__project-end-row">
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
        <div className="muutoshakemus__reason" data-test-id="muutoshakemus-jatkoaika-perustelu">{perustelut}</div>
      </div>
    </section>
  )
}
