import React, { useState } from 'react'
import moment from 'moment'

import { MuutoshakemusTabs } from './MuutoshakemusTabs.jsx'

import './Muutoshakemus.less'

export const datetimeFormat = 'D.M.YYYY [klo] HH.mm'

export const Muutoshakemus = ({ muutoshakemukset, hakemus }) => {
  const [a, setActiveMuutoshakemus] = useState(muutoshakemukset[0])
  const projectEndAnswer = hakemus.answers.find(a => a.key === 'project-end')
  
  return (
    <div>
      {muutoshakemukset.length > 1 && <MuutoshakemusTabs muutoshakemukset={muutoshakemukset} activeMuutoshakemus={a} setActiveMuutoshakemus={setActiveMuutoshakemus} />}
      <div>
        <h2>Muutoshakemus {moment(a['created-at']).format(datetimeFormat)}</h2>
        {a['haettu-kayttoajan-paattymispaiva'] && (
          <section className="muutoshakemus-section">
            <div className="muutoshakemus-row muutoshakemus__project-end-row">
              <div>
                <h3>Voimassaoleva päättymisaika</h3>
                <div>{projectEndAnswer && projectEndAnswer.value}</div>
              </div>
              <div>
                <h3>Haettu muutos</h3>
                <div data-test-id="muutoshakemus-jatkoaika">{moment(a['haettu-kayttoajan-paattymispaiva']).format('DD.MM.YYYY')}</div>
              </div>
            </div>
            <div className="muutoshakemus-row">
              <h3>Hakijan perustelut</h3>
              <div data-test-id="muutoshakemus-jatkoaika-perustelu">{a['kayttoajan-pidennys-perustelut']}</div>
            </div>
          </section>
        )}
      </div>
      <div>{JSON.stringify(muutoshakemukset)}</div>
      <div>{JSON.stringify(hakemus)}</div>
    </div>
  )
}
