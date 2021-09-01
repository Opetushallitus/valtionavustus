import React, { useState } from 'react'
import moment from 'moment'

import { MuutoshakemusValues, datetimeFormat } from 'va-common/web/va/MuutoshakemusValues'
import { getTalousarvio, getProjectEndDate } from 'va-common/web/va/Muutoshakemus'

import { MuutoshakemusForm } from './MuutoshakemusForm'
import { MuutoshakemusTabs } from './MuutoshakemusTabs'

import './Muutoshakemus.less'

export const Muutoshakemus = ({ environment, avustushaku, muutoshakemukset, hakemusVersion, controller, userInfo, presenter, isPresentingOfficer }) => {
  const hakemus = hakemusVersion.normalizedData
  const [a, setActiveMuutoshakemus] = useState(muutoshakemukset[0])
  const isAccepted = a.status === 'accepted' || a.status === 'accepted_with_changes'
  const projectEndDate = getProjectEndDate(avustushaku, muutoshakemukset, a)
  const currentTalousarvio = getTalousarvio(muutoshakemukset, hakemus && hakemus.talousarvio, isAccepted ? a : undefined)

  return (
    <React.Fragment>
      {muutoshakemukset.length > 1 && <MuutoshakemusTabs muutoshakemukset={muutoshakemukset} activeMuutoshakemus={a} setActiveMuutoshakemus={setActiveMuutoshakemus} />}
      <h2>Muutoshakemus {moment(a['created-at']).format(datetimeFormat)}</h2>
      <div data-test-id="muutoshakemus-sisalto">
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
                                hakemusVersion={hakemusVersion}
                                controller={controller}
                                userInfo={userInfo}
                                presenter={presenter}
                                isPresentingOfficer={isPresentingOfficer}
                                projectEndDate={projectEndDate} />}
      </div>
    </React.Fragment>
  )
}
