import React, { useState } from 'react'
import moment from 'moment'

import { MuutoshakemusValues, datetimeFormat } from 'va-common/web/va/MuutoshakemusValues'
import { MuutoshakemusForm } from './MuutoshakemusForm'
import { MuutoshakemusTabs } from './MuutoshakemusTabs'
import { getProjectEndDate } from '../../../../va-common/web/va/Muutoshakemus'

import './Muutoshakemus.less'

export const Muutoshakemus = ({ environment, avustushaku, muutoshakemukset, hakemus, controller, userInfo, presenter }) => {
  const [a, setActiveMuutoshakemus] = useState(muutoshakemukset[0])
  const previousMuutoshakemus = muutoshakemukset.filter(i => i["created-at"] < a["created-at"])
  const projectEndDate = getProjectEndDate(avustushaku, previousMuutoshakemus)

  return (
    <React.Fragment>
      {muutoshakemukset.length > 1 && <MuutoshakemusTabs muutoshakemukset={muutoshakemukset} activeMuutoshakemus={a} setActiveMuutoshakemus={setActiveMuutoshakemus} />}
      <h2>Muutoshakemus {moment(a['created-at']).format(datetimeFormat)}</h2>
      <div className="muutoshakemus-content">
        <MuutoshakemusValues
          talousarvio={[]}
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
