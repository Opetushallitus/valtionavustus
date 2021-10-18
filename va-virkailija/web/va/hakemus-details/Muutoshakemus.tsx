import React, { useState } from 'react'
import moment from 'moment'

import { MuutoshakemusValues, datetimeFormat } from 'va-common/web/va/MuutoshakemusValues'
import { getTalousarvio, getProjectEndDate } from 'va-common/web/va/Muutoshakemus'
import {EnvironmentApiResponse} from "../../../../va-common/web/va/types/environment";

import { MuutoshakemusForm } from './MuutoshakemusForm'
import { MuutoshakemusTabs } from './MuutoshakemusTabs'

import './Muutoshakemus.less'
import {
  Avustushaku,
  Hakemus,
  UserInfo
} from "../../../../va-common/web/va/types";
import {Muutoshakemus as MuutoshakemusType} from "../../../../va-common/web/va/types/muutoshakemus";
import {OsiokohtainenMuutoshakemusForm} from "./OsiokohtainenMuutoshakemusForm";
import {Role} from "../types";

interface MuutoshakemusProps {
  environment: EnvironmentApiResponse
  avustushaku: Avustushaku
  muutoshakemukset: MuutoshakemusType[]
  hakemusVersion: Hakemus
  controller: any
  userInfo: UserInfo
  presenter: Role | undefined
  isPresentingOfficer: boolean
}

export const Muutoshakemus = ({ environment, avustushaku, muutoshakemukset, hakemusVersion, controller, userInfo, presenter, isPresentingOfficer }: MuutoshakemusProps) => {
  const hakemus = hakemusVersion.normalizedData
  const [a, setActiveMuutoshakemus] = useState(muutoshakemukset[0])
  const isAccepted = a.status === 'accepted' || a.status === 'accepted_with_changes'
  const projectEndDate = getProjectEndDate(avustushaku, muutoshakemukset, a)
  const currentTalousarvio = getTalousarvio(muutoshakemukset, hakemus && hakemus.talousarvio, isAccepted ? a : undefined)
  const osiokohtainenEnabled = environment["muutoshakemus-osiokohtainen-hyvaksynta"]["enabled?"]
  if (osiokohtainenEnabled) {
    const content = a.status === 'new' && hakemus
      ? <OsiokohtainenMuutoshakemusForm
        avustushaku={avustushaku}
        muutoshakemus={a}
        muutoshakemukset={muutoshakemukset}
        hakemus={hakemus}
        hakemusVersion={hakemusVersion}
        controller={controller}
        userInfo={userInfo}
        presenter={presenter}
        projectEndDate={projectEndDate}
        isPresentingOfficer={isPresentingOfficer}
        currentTalousarvio={currentTalousarvio}
        environment={environment} />
      : <MuutoshakemusValues
        currentTalousarvio={currentTalousarvio}
        muutoshakemus={a}
        hakijaUrl={environment['hakija-server'].url.fi}
        projectEndDate={projectEndDate}
        simplePaatos={false} />

    return (
      <React.Fragment>
        {muutoshakemukset.length > 1 && <MuutoshakemusTabs muutoshakemukset={muutoshakemukset} activeMuutoshakemus={a} setActiveMuutoshakemus={setActiveMuutoshakemus} />}
        <h2>Muutoshakemus {moment(a['created-at']).format(datetimeFormat)}</h2>
        <div data-test-id="muutoshakemus-sisalto">
          {content}
        </div>
      </React.Fragment>
    )
  }
  return (
    <React.Fragment>
      {muutoshakemukset.length > 1 && <MuutoshakemusTabs muutoshakemukset={muutoshakemukset} activeMuutoshakemus={a} setActiveMuutoshakemus={setActiveMuutoshakemus} />}
      <h2>Muutoshakemus {moment(a['created-at']).format(datetimeFormat)}</h2>
      <div data-test-id="muutoshakemus-sisalto">
        <MuutoshakemusValues
          currentTalousarvio={currentTalousarvio}
          muutoshakemus={a}
          hakijaUrl={environment['hakija-server'].url.fi}
          projectEndDate={projectEndDate}
          simplePaatos={false} />

        {a.status === 'new' && hakemus && <MuutoshakemusForm
                                environment={environment}
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
