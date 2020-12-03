import React, { useState } from 'react'
import moment from 'moment'

import { MuutoshakemusForm } from './MuutoshakemusForm'
import { MuutoshakemusTabs } from './MuutoshakemusTabs'
import { MuutoshakemusStatuses } from './hakemus-statuses'

import './Muutoshakemus.less'

export const datetimeFormat = 'D.M.YYYY [klo] HH.mm'

export const Muutoshakemus = ({ muutoshakemukset, hakemus, controller }) => {
  const [a, setActiveMuutoshakemus] = useState(muutoshakemukset[0])
  const projectEndAnswer = hakemus.answers.find(a => a.key === 'project-end')

  return (
    <div>
      {muutoshakemukset.length > 1 && <MuutoshakemusTabs muutoshakemukset={muutoshakemukset} activeMuutoshakemus={a} setActiveMuutoshakemus={setActiveMuutoshakemus} />}
      <h2>Muutoshakemus {moment(a['created-at']).format(datetimeFormat)}</h2>
      <div className="muutoshakemus-content">
        {a.status !== 'new' &&
          <section className="muutoshakemus-section" data-test-id="muutoshakemus-paatos">
            <div className="muutoshakemus__paatos">
              <h2 className="muutoshakemus__paatos-status">
                <span className={`muutoshakemus__paatos-icon muutoshakemus__paatos-icon--${a.status}`}>{MuutoshakemusStatuses.statusToFI(a.status)} TODO</span>
              </h2>
              <h3 className="muutoshakemus__header">Päätös lähetetty hakijalle TODO</h3>
              <h3 className="muutoshakemus__header">Päätösdokumentti:</h3>
              <a>TODO</a>
            </div>
          </section>
        }
        {a['haettu-kayttoajan-paattymispaiva'] &&
          <section className="muutoshakemus-section">
            <div className="muutoshakemus-row muutoshakemus__project-end-row">
              <div>
                <h3 className="muutoshakemus__header">Voimassaoleva päättymisaika</h3>
                <div>{projectEndAnswer && projectEndAnswer.value}</div>
              </div>
              <div>
                <h3 className="muutoshakemus__header">Haettu muutos</h3>
                <div data-test-id="muutoshakemus-jatkoaika">{moment(a['haettu-kayttoajan-paattymispaiva']).format('DD.MM.YYYY')}</div>
              </div>
            </div>
            <div className="muutoshakemus-row">
              <h4 className="muutoshakemus__header">Hakijan perustelut</h4>
              <div data-test-id="muutoshakemus-jatkoaika-perustelu">{a['kayttoajan-pidennys-perustelut']}</div>
            </div>
          </section>
        }
        {a.status === 'new' && <MuutoshakemusForm muutoshakemus={a} hakemus={hakemus} controller={controller} />}
      </div>
    </div>
  )
}
