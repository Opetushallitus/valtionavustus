import React from 'react'
import moment from 'moment'

import { Muutoshakemus as MuutoshakemusStatuses } from './status'
import { MuutosTaloudenKayttosuunnitelmaan } from './muutoshakemus/MuutosTaloudenKayttosuunnitelmaan'
import { Muutoshakemus, Talousarvio } from './types/muutoshakemus'
import { useTranslations } from "./i18n/TranslationContext"
import { fiLongFormat, parseDateStringToMoment } from 'va-common/web/va/i18n/dateformat'

import './MuutoshakemusValues.less'
import {MuutoshakemusSection} from "./MuutoshakemusSection";
import {isAcceptedWithChanges} from "./Muutoshakemus";

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
      {a.status !== undefined && a.status !== 'new' &&
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
      {muutoshakemus['haettu-kayttoajan-paattymispaiva'] && <PaattymispaivaValues muutoshakemus={muutoshakemus} projectEndDate={projectEndDate} />}
      {!!talousarvio.length &&
        <MuutoshakemusSection>
          <MuutosTaloudenKayttosuunnitelmaan
            currentTalousarvio={currentTalousarvio}
            newTalousarvio={talousarvio}
            status={muutoshakemus["paatos-status-talousarvio"]}
            reason={muutoshakemus["talousarvio-perustelut"]} />
        </MuutoshakemusSection>
      }
      {muutoshakemus['haen-sisaltomuutosta'] && (
        <MuutoshakemusSection>
          <div className="muutoshakemus-row">
            <h4 className="muutoshakemus__header">{t.sisaltomuutos.appliedChange}</h4>
            <div className="muutoshakemus-description-box" data-test-id="sisaltomuutos-perustelut">{muutoshakemus['sisaltomuutos-perustelut']}</div>
          </div>
          {muutoshakemus['hyvaksytyt-sisaltomuutokset'] && (
            <div className="muutoshakemus-row">
              <h4 className="muutoshakemus__header">{t.sisaltomuutos.acceptedChanges}</h4>
              <div className="muutoshakemus-description-box">{muutoshakemus['hyvaksytyt-sisaltomuutokset']}</div>
            </div>
          )}
        </MuutoshakemusSection>
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
        <div className="muutoshakemus-description-box" data-test-id="muutoshakemus-jatkoaika-perustelu">{perustelut}</div>
      </div>
    </MuutoshakemusSection>
  )
}
