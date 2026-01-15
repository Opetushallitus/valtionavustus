import './MuutoshakemusTabs.css'

import React from 'react'
import moment from 'moment'
import { fiShortFormat } from 'soresu-form/web/va/i18n/dateformat'
import { Muutoshakemus } from 'soresu-form/web/va/types/muutoshakemus'

interface MuutoshakemusTabsProps {
  muutoshakemukset: Muutoshakemus[]
  activeMuutoshakemus: Muutoshakemus
  setActiveMuutoshakemus: (muutoshakemusId: number) => void
}

export const MuutoshakemusTabs = ({
  muutoshakemukset,
  activeMuutoshakemus,
  setActiveMuutoshakemus,
}: MuutoshakemusTabsProps) => {
  console.log(muutoshakemukset)
  return (
    <div className="muutoshakemus-tabs">
      {muutoshakemukset.map((m, index) => (
        <button
          key={`muutoshakemus-tab-${m.id}`}
          className={`muutoshakemus-tabs__tab ${m.id === activeMuutoshakemus.id ? 'active' : ''}`}
          onClick={() => setActiveMuutoshakemus(m.id)}
          data-test-id={`muutoshakemus-tab-${index}`}
        >
          Muutoshakemus {moment(m['created-at']).format(fiShortFormat)}
        </button>
      ))}
    </div>
  )
}
