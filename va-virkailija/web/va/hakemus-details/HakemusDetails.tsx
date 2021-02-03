import React from 'react'

import { HakemusPreview } from './HakemusPreview'
import { HakemusArviointi } from './HakemusArviointi'
import { Muutoshakemus } from './Muutoshakemus.jsx'
import { Selvitys } from './Selvitys'
import { Seuranta } from './Seuranta'

import './hakemusDetails.less'

interface HakemusDetailsProps {
  hidden: any
  controller: any
  hakemus: any
  avustushaku: any
  hakuData: any
  userInfo: any
  loadingComments: any
  showOthersScores: any
  translations: any
  environment: any
  selectedHakemusAccessControl: any
  subTab: any
  helpTexts: any
}


export const HakemusDetails = ({hidden, controller, hakemus, avustushaku, hakuData, userInfo, loadingComments, showOthersScores, translations, environment, selectedHakemusAccessControl, subTab, helpTexts}: HakemusDetailsProps) => {

    const multibatchEnabled =
          (environment["multibatch-payments"] &&
           environment["multibatch-payments"]["enabled?"]) || false
    const muutoshakemukset = hakemus.muutoshakemukset
    const muutospaatosprosessiEnabled =
          (environment["muutospaatosprosessi"] &&
           environment["muutospaatosprosessi"]["enabled?"]) || false

    const userOid = userInfo["person-oid"]
    const userRole = hakuData.roles.find(r => r.oid === userOid)
    const isPresentingOfficer =
            userOid && userRole && userRole.role === "presenting_officer"
    const presenter = hakuData.roles.find(r => r.role === 'presenting_officer')

    if (hidden) {
      return null
    }

    const onClose = () => {
      document.body.classList.remove('split-view')
      controller.closeHakemusDetail()
    }

    const onToggle = (e) => {
      document.body.classList.toggle('split-view')
      if(document.body.classList.contains('split-view')) {
        const container = document.querySelector('.hakemus-list tbody.has-selected')
        const selected = document.querySelector('#list-container tbody.has-selected .overview-row.selected')
        if (container && selected && selected instanceof HTMLElement ) {
          container.scrollTop = selected.offsetTop - 100
        }
      }
      e.preventDefault()
      return false
    }

    const CloseButton = () => <button id="close-hakemus-button" onClick={onClose}>&times;</button>
    const ToggleButton = () => <button id="toggle-hakemus-list-button" onClick={onToggle}>↕</button>

    const getSubTab = tabName => {
      switch (tabName) {
        case 'arviointi':
          return <HakemusArviointi hakemus={hakemus}
                                   avustushaku={avustushaku}
                                   hakuData={hakuData}
                                   translations={translations}
                                   selectedHakemusAccessControl={selectedHakemusAccessControl}
                                   userInfo={userInfo}
                                   loadingComments={loadingComments}
                                   showOthersScores={showOthersScores}
                                   controller={controller}
                                   environment={environment}
                                   multibatchEnabled={multibatchEnabled}
                                   helpTexts={helpTexts}/>

        case 'valiselvitys':
          return <Selvitys controller={controller} hakemus={hakemus}
                           avustushaku={avustushaku} userInfo={userInfo}
                           translations={translations}
                           selvitysType="valiselvitys"
                           multibatchEnabled={multibatchEnabled}
                           isPresentingOfficer={isPresentingOfficer}
                           environment={environment}
   selvitysLinkHelpText={helpTexts["hankkeen_sivu__väliselvitys___linkki_lomakkeelle"]}
   presenterCommentHelpText={helpTexts["hankkeen_sivu__arviointi___valmistelijan_huomiot"]}/>
        case 'loppuselvitys':
          return <Selvitys controller={controller} hakemus={hakemus}
                           avustushaku={avustushaku} userInfo={userInfo}
                           translations={translations}
                           selvitysType="loppuselvitys"
                           multibatchEnabled={multibatchEnabled}
                           environment={environment} 
                           isPresentingOfficer={isPresentingOfficer}
   selvitysLinkHelpText={helpTexts["hankkeen_sivu__loppuselvitys___linkki_lomakkeelle"]}
   presenterCommentHelpText={helpTexts["hankkeen_sivu__loppuselvitys___valmistelijan_huomiot"]}/>
        case 'muutoshakemukset':
          if (!muutoshakemukset || muutoshakemukset.length === 0)
            return <h2>Hankkeella ei ole muutoshakemuksia</h2>
          else
            return <Muutoshakemus environment={environment} avustushaku={avustushaku} muutoshakemukset={muutoshakemukset} hakemus={hakemus.normalizedData} controller={controller} userInfo={userInfo} presenter={presenter} />
        case 'seuranta':
          return <Seuranta controller={controller} hakemus={hakemus} avustushaku={avustushaku} hakuData={hakuData} translations={translations} helpTexts={helpTexts} environment={environment}/>
        default:
          throw new Error("Bad subTab selection '" + tabName + "'")
      }
    }
    const tab = (name, label, testId?: string) => <span className={subTab === name ? 'selected' : ''} data-test-id={testId} onClick={createSubTabSelector(name)}>{label}</span>

    function createSubTabSelector(subTabToSelect) {
      return e => {
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
          {muutospaatosprosessiEnabled && tab('muutoshakemukset', <MuutoshakemuksetLabel/>)}
          {tab('seuranta', 'Seuranta', 'tab-seuranta')}
        </div>
        <HakemusPreview hakemus={hakemus} avustushaku={avustushaku} hakuData={hakuData} translations={translations} environment={environment}/>
        <div id="hakemus-arviointi" className="fixed-content">
          <div id="tab-content"
               className={hakemus.refused ? "disabled" : ""}>
            {getSubTab(subTab)}
          </div>
        </div>
      </div>
    )
  }
