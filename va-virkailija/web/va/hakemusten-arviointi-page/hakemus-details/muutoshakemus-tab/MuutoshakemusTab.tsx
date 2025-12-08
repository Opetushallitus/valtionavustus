import React from 'react'

import { Muutoshakemus } from './Muutoshakemus'
import { useHakemustenArviointiSelector } from '../../arviointiStore'
import { getLoadedAvustushakuData } from '../../arviointiReducer'
import { useHakemus } from '../../useHakemus'
import { useEnvironment, useUserInfo } from '../../../initial-data-context'

const MuutoshakemusTab = () => {
  const hakemus = useHakemus()
  const userInfo = useUserInfo()
  const environment = useEnvironment()
  const { hakuData } = useHakemustenArviointiSelector((state) =>
    getLoadedAvustushakuData(state.arviointi)
  )
  const { avustushaku } = hakuData
  const { muutoshakemukset, language } = hakemus
  const lang = language || 'fi'
  const muutoshakemusUrl = `${environment['hakija-server'].url[lang]}muutoshakemus?lang=${lang}&user-key=${hakemus['user-key']}&avustushaku-id=${avustushaku.id}`
  const yhteystietojenMuokkausUrl = `${environment['hakija-server'].url[lang]}avustushaku/${avustushaku.id}/nayta?lang=${lang}&hakemus=${hakemus['user-key']}&modify-application=true`
  return (
    <div id="tab-content" className={hakemus.refused ? 'disabled' : ''}>
      {avustushaku.muutoshakukelpoinen ? (
        <div className="muutoshakemus-link">
          <a href={muutoshakemusUrl} target="_blank" data-test-id="muutoshakemus-link">
            Linkki muutoshakemuslomakkeeseen
          </a>
        </div>
      ) : (
        <div className="muutoshakemus-link">
          <a
            href={yhteystietojenMuokkausUrl}
            target="_blank"
            data-test-id="yhteystietojen-muokkaus-link"
          >
            Linkki yhteystietojen muokkauslomakkeeseen
          </a>
        </div>
      )}
      {muutoshakemukset?.length ? (
        <Muutoshakemus
          environment={environment}
          avustushaku={avustushaku}
          muutoshakemukset={muutoshakemukset}
          hakemusVersion={hakemus}
          userInfo={userInfo}
        />
      ) : (
        <h2>Hankkeella ei ole muutoshakemuksia</h2>
      )}
    </div>
  )
}

export default MuutoshakemusTab
