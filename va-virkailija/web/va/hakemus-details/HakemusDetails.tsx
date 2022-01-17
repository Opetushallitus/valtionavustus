import React from 'react'

import HakemusPreview from './HakemusPreview'
import HakemusArviointi from './HakemusArviointi'
import { Muutoshakemus } from './Muutoshakemus'
import Loppuselvitys from './Loppuselvitys'
import Väliselvitys from './Väliselvitys'
import Seuranta from './Seuranta'
import {HakuData, SelectedHakemusAccessControl, UserInfo} from "../types";
import {Avustushaku, Hakemus} from "soresu-form/web/va/types";
import HakemustenArviointiController from "../HakemustenArviointiController";
import {EnvironmentApiResponse} from "soresu-form/web/va/types/environment";

import './hakemusDetails.less'

interface Props {
  hakuData: HakuData
  avustushaku: Avustushaku
  hakemus: Hakemus | undefined
  selectedHakemusAccessControl: SelectedHakemusAccessControl
  translations: any
  userInfo: UserInfo
  showOthersScores: boolean
  subTab: string
  controller: HakemustenArviointiController
  environment: EnvironmentApiResponse
  helpTexts: any
}

export const HakemusDetails = (props: Props) => {
    const {controller, hakemus, avustushaku, hakuData, userInfo,
           showOthersScores, translations, environment,
           selectedHakemusAccessControl, subTab, helpTexts} = props
    const multibatchEnabled = Boolean(environment["multibatch-payments"]?.["enabled?"])

    const userOid = userInfo["person-oid"]
    const userRole = hakuData.roles.find(r => r.oid === userOid)
    const isPresentingOfficer =
            !!userOid && !!userRole && userRole.role === "presenting_officer"
    if (!(typeof hakemus === 'object')) {
      return null
    }
    const muutoshakemukset = hakemus.muutoshakemukset

    const fallbackPresenter = hakuData.roles.find(r => r.role === 'presenting_officer')
    const hakemukselleUkotettuValmistelija = hakuData.roles.find(r => r.id === hakemus.arvio["presenter-role-id"]) || fallbackPresenter
    const isCurrentUserHakemukselleUkotettuValmistelija = hakemukselleUkotettuValmistelija?.oid === userOid

    const onClose = () => {
      document.body.classList.remove('split-view')
      controller.closeHakemusDetail()
    }

    const onToggle = (e: React.MouseEvent) => {
      document.body.classList.toggle('split-view')
      if(document.body.classList.contains('split-view')) {
        const container = document.querySelector('.hakemus-list tbody.has-selected')
        const selected = document.querySelector<HTMLTableRowElement>('#list-container tbody.has-selected .overview-row.selected')
        if (container && selected?.offsetTop) {
          container.scrollTop = selected.offsetTop - 100
        }
      }
      e.preventDefault()
      return false
    }

    const CloseButton = () => <button id="close-hakemus-button" onClick={onClose}>&times;</button>
    const ToggleButton = () => <button id="toggle-hakemus-list-button" onClick={onToggle}>↕</button>

    const getSubTab = (tabName: string) => {
      switch (tabName) {
        case 'arviointi':
          return <HakemusArviointi hakemus={hakemus}
                                   avustushaku={avustushaku}
                                   hakuData={hakuData}
                                   translations={translations}
                                   selectedHakemusAccessControl={selectedHakemusAccessControl}
                                   userInfo={userInfo}
                                   showOthersScores={showOthersScores}
                                   subTab={subTab}
                                   controller={controller}
                                   multibatchEnabled={multibatchEnabled}
                                   helpTexts={helpTexts}/>

        case 'valiselvitys':
          return <Väliselvitys environment={environment} controller={controller} hakemus={hakemus}
                           avustushaku={avustushaku} userInfo={userInfo} presenter={hakemukselleUkotettuValmistelija}
                           translations={translations}
                           multibatchEnabled={multibatchEnabled}
                           isPresentingOfficer={isPresentingOfficer}
                           selvitysLinkHelpText={helpTexts["hankkeen_sivu__väliselvitys___linkki_lomakkeelle"]}
                           presenterCommentHelpText={helpTexts["hankkeen_sivu__arviointi___valmistelijan_huomiot"]}/>
        case 'loppuselvitys':
          return <Loppuselvitys environment={environment} controller={controller} hakemus={hakemus}
                           avustushaku={avustushaku} userInfo={userInfo} presenter={hakemukselleUkotettuValmistelija}
                           translations={translations}
                           multibatchEnabled={multibatchEnabled}
                           isPresentingOfficer={isPresentingOfficer}
                           selvitysLinkHelpText={helpTexts["hankkeen_sivu__loppuselvitys___linkki_lomakkeelle"]}
                           presenterCommentHelpText={helpTexts["hankkeen_sivu__loppuselvitys___valmistelijan_huomiot"]}/>
        case 'muutoshakemukset':
          if (!muutoshakemukset || muutoshakemukset.length === 0)
            return <h2>Hankkeella ei ole muutoshakemuksia</h2>
          else
            return <Muutoshakemus environment={environment} avustushaku={avustushaku} muutoshakemukset={muutoshakemukset} hakemusVersion={hakemus} controller={controller} userInfo={userInfo} presenter={hakemukselleUkotettuValmistelija} isCurrentUserHakemukselleUkotettuValmistelija={isCurrentUserHakemukselleUkotettuValmistelija} />
        case 'seuranta':
          return <Seuranta controller={controller} hakemus={hakemus} avustushaku={avustushaku} muutoshakemukset={muutoshakemukset} hakuData={hakuData} translations={translations} helpTexts={helpTexts}/>
        default:
          throw new Error("Bad subTab selection '" + tabName + "'")
      }
    }
    const tab = (name: string, label: string | JSX.Element, testId?: string) => <span className={subTab === name ? 'selected' : ''} data-test-id={testId} onClick={createSubTabSelector(name)}>{label}</span>

    function createSubTabSelector(subTabToSelect: string) {
      return (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        e.preventDefault()
        controller.selectEditorSubtab(subTabToSelect)
      }
    }

    function hasNewMuutoshakemus() {
      return muutoshakemukset && muutoshakemukset.some(m => m.status === 'new')
    }

    const MuutoshakemuksetLabel = () =>
      <span className='muutoshakemus-tab'>Muutoshakemukset
        <span className={hasNewMuutoshakemus() ? 'muutoshakemukset-warning' : ''}>
          (<span data-test-id="number-of-pending-muutoshakemukset">{muutoshakemukset ? muutoshakemukset.length : 0}</span>)
        </span>
      </span>

    return (
      <div id="hakemus-details">
        <CloseButton/>
        <ToggleButton/>
        <div id="editor-subtab-selector"
             className="fixed-tabs section-container">
          {tab('arviointi', 'Arviointi')}
          {tab('valiselvitys', 'Väliselvitys')}
          {tab('loppuselvitys', 'Loppuselvitys')}
          {tab('muutoshakemukset', <MuutoshakemuksetLabel/>)}
          {tab('seuranta', 'Seuranta', 'tab-seuranta')}
        </div>
        <HakemusPreview hakemus={hakemus} avustushaku={avustushaku} hakuData={hakuData} translations={translations}/>
        <div id="hakemus-arviointi" className="fixed-content">
          <div id="tab-content"
               className={hakemus.refused ? "disabled" : ""}>
            {getSubTab(subTab)}
          </div>
        </div>
      </div>
    )
}

export default HakemusDetails
