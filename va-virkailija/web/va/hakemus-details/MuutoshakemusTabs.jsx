import React from 'react'
import moment from 'moment'
import { fiShortFormat } from 'soresu-form/web/va/i18n/dateformat'

import './MuutoshakemusTabs.less'

export const MuutoshakemusTabs = ({ muutoshakemukset, activeMuutoshakemus, setActiveMuutoshakemus }) => {
  return (
    <div className='muutoshakemus-tabs'>
      {muutoshakemukset.map((m, index) => (
        <button
          key={`muutoshakemus-tab-${index}`}
          className={`muutoshakemus-tabs__tab ${m.id === activeMuutoshakemus.id ? 'active' : ''}`}
          onClick={() => setActiveMuutoshakemus(m)}
          data-test-id={`muutoshakemus-tab-${m.id}`}
        >
          Muutoshakemus {moment(m['created-at']).format(fiShortFormat)}
        </button>
      ))}
    </div>
  )
}
