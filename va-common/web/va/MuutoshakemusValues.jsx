import React from 'react'
import moment from 'moment'

import { MuutoshakemusStatuses } from './hakemus-statuses'
import { getLatestApprovedMuutoshakemusDate } from './Muutoshakemus'

import './MuutoshakemusValues.less'

export const datetimeFormat = 'D.M.YYYY [klo] HH.mm'

export const MuutoshakemusValues = ({ muutoshakemus, hakijaUrl, simplePaatos, previousMuutoshakemuses, hankkeenPaattymispaiva }) => {
  const a = muutoshakemus
  const paatosUrl = `${hakijaUrl}muutoshakemus/paatos?user-key=${a['paatos-user-key']}`
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
                    ? `Päätös lähetetty hakijalle ${moment(a['paatos-sent-at']).format(datetimeFormat)}`
                    : 'Päätöstä ei ole vielä lähetetty hakijalle'
                  }
                </h3>
                <h3 className="muutoshakemus__header">Päätösdokumentti:</h3>
                <a href={paatosUrl} target="_blank" rel="noopener noreferrer" className="muutoshakemus__paatos-link">{paatosUrl}</a>
              </div>
          }
        </section>
      }

      <PaattymispaivaValues
        muutoshakemus={muutoshakemus}
        previousMuutoshakemuses={previousMuutoshakemuses}
        hankkeenPaattymispaiva={hankkeenPaattymispaiva} />

    </React.Fragment>
  )
}

function formatDate(date) {
  if (!date) return ''
  const parsedDate = moment(date)

  return parsedDate.isValid ? parsedDate.format('DD.MM.YYYY') : ''
}

const PaattymispaivaValues = ({ muutoshakemus, previousMuutoshakemuses, hankkeenPaattymispaiva }) => {
  if (!muutoshakemus['haettu-kayttoajan-paattymispaiva']) return null

  function getPaattymispaiva() {
    const latestApprovedMuutoshakemusDate = getLatestApprovedMuutoshakemusDate(previousMuutoshakemuses)

    if (latestApprovedMuutoshakemusDate && latestApprovedMuutoshakemusDate.isValid()) {
      return latestApprovedMuutoshakemusDate.format('DD.MM.YYYY')
    }
    if (hankkeenPaattymispaiva && hankkeenPaattymispaiva.isValid()) {
      return hankkeenPaattymispaiva.format('DD.MM.YYYY')
    }
    return ''
  }

  const isAcceptedWithChanges = muutoshakemus.status === 'accepted_with_changes'

  const currentEndDateTitle = isAcceptedWithChanges ? 'Vanha päättymisaika' : 'Voimassaoleva päättymisaika'
  const newEndDateTitle = isAcceptedWithChanges ? 'Hyväksytty muutos' : 'Haettu muutos'
  const newEndDateValue = isAcceptedWithChanges ? muutoshakemus['paatos-hyvaksytty-paattymispaiva'] : muutoshakemus['haettu-kayttoajan-paattymispaiva']
  const perustelut = muutoshakemus['kayttoajan-pidennys-perustelut']


  return (
    <section className="muutoshakemus-section">
      <div className="muutoshakemus-row muutoshakemus__project-end-row">
        <div>
          <h3 className="muutoshakemus__header">{currentEndDateTitle}</h3>
          <div>{getPaattymispaiva()}</div>
        </div>
        <div>
          <h3 className="muutoshakemus__header">{newEndDateTitle}</h3>
          <div data-test-id="muutoshakemus-jatkoaika">{formatDate(newEndDateValue)}</div>
        </div>
      </div>
      <div className="muutoshakemus-row">
        <h4 className="muutoshakemus__header">Hakijan perustelut</h4>
        <div className="muutoshakemus__reason" data-test-id="muutoshakemus-jatkoaika-perustelu">{perustelut}</div>
      </div>
    </section>
  )
}
