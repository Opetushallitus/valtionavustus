import React, { useState } from 'react'
import moment from 'moment'

import { MuutoshakemusValues, datetimeFormat } from 'va-common/web/va/MuutoshakemusValues'
import { getTalousarvio, getSecondLatestTalousarvio, getProjectEndDate, getSecondLatestProjectEndDate } from 'va-common/web/va/Muutoshakemus'

import { MuutoshakemusForm } from './MuutoshakemusForm'
import { MuutoshakemusTabs } from './MuutoshakemusTabs'

import './Muutoshakemus.less'

export const Muutoshakemus = ({ environment, avustushaku, muutoshakemukset, hakemus, controller, userInfo, presenter }) => {
  const [a, setActiveMuutoshakemus] = useState(muutoshakemukset[0])
  const previousMuutoshakemus = muutoshakemukset.filter(i => i["created-at"] < a["created-at"])
  const projectEndDate = a.status === 'new' || a.status === 'rejected'
    ? getProjectEndDate(avustushaku, previousMuutoshakemus)
    : getSecondLatestProjectEndDate(avustushaku, previousMuutoshakemus)
  const currentTalousarvio = a.status === 'new' || a.status === 'rejected'
    ? getTalousarvio(muutoshakemukset, hakemus)
    : getSecondLatestTalousarvio(muutoshakemukset, hakemus)

  return (
    <React.Fragment>
      {muutoshakemukset.length > 1 && <MuutoshakemusTabs muutoshakemukset={muutoshakemukset} activeMuutoshakemus={a} setActiveMuutoshakemus={setActiveMuutoshakemus} />}
      <h2>Muutoshakemus {moment(a['created-at']).format(datetimeFormat)}</h2>
      <div className="muutoshakemus-content">
        <MuutoshakemusValues
          currentTalousarvio={currentTalousarvio}
          muutoshakemus={a}
          hakijaUrl={environment['hakija-server'].url.fi}
          projectEndDate={projectEndDate} />

        {a.status === 'new' && <MuutoshakemusForm
                                avustushaku={avustushaku}
                                muutoshakemus={a}
                                muutoshakemukset={muutoshakemukset}
                                hakemus={hakemus}
                                controller={controller}
                                userInfo={userInfo}
                                presenter={presenter}
                                projectEndDate={projectEndDate} />}
      </div>
    </React.Fragment>
  )
}
