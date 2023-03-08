import React from 'react'
import ClassNames from 'classnames'

import { HakuEdit } from './HakuEdit'
import FormEditorContainer from './FormEditorContainer'
import DecisionEditor from './DecisionEditor'
import { SelvitysFormEditor } from './SelvitysFormEditor'
import HelpTooltip from '../HelpTooltip'
import { HakujenHallintaSubTab } from '../types'
import { Maksatukset } from './Maksatukset'
import {
  useHakujenHallintaDispatch,
  useHakujenHallintaSelector,
} from '../hakujenHallinta/hakujenHallintaStore'
import {
  selectSelectedAvustushaku,
  selectEditorSubTab,
  selectLoadedInitialData,
} from '../hakujenHallinta/hakuReducer'

export const EditorSelector = () => {
  const avustushaku = useHakujenHallintaSelector(selectSelectedAvustushaku)
  const subTab = useHakujenHallintaSelector((state) => state.haku.subTab)
  const { helpTexts } = useHakujenHallintaSelector(selectLoadedInitialData)
  const dispatch = useHakujenHallintaDispatch()
  let subTabContent
  switch (subTab) {
    case 'haku-editor':
      subTabContent = <HakuEdit />
      break
    case 'form-editor':
      subTabContent = <FormEditorContainer />
      break
    case 'decision':
      subTabContent = <DecisionEditor />
      break
    case 'valiselvitys':
    case 'loppuselvitys':
      subTabContent = <SelvitysFormEditor selvitysType={subTab} />
      break
    case 'maksatukset':
      subTabContent = <Maksatukset />
      break
    default:
      throw new Error(`Bad subTab selection '${subTab}'`)
  }

  function createSubTabSelector(subTabToSelect: HakujenHallintaSubTab) {
    return (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      e.preventDefault()
      dispatch(selectEditorSubTab(subTabToSelect))
    }
  }

  return (
    <section id="editor-section">
      <div id="editor-subtab-selector" className="section-container">
        <span
          onClick={createSubTabSelector('haku-editor')}
          data-test-id="haun-tiedot-välilehti"
          className={ClassNames({ selected: subTab === 'haku-editor' })}
        >
          Haun tiedot
          <HelpTooltip
            content={helpTexts['hakujen_hallinta__haun_tiedot___valilehden_infopallo']}
            direction="left"
          />
        </span>
        <span
          onClick={createSubTabSelector('form-editor')}
          className={ClassNames({ selected: subTab === 'form-editor' })}
        >
          Hakulomake
          <HelpTooltip content={helpTexts['hakujen_hallinta__hakulomake___valilehden_infopallo']} />
        </span>
        <span
          onClick={createSubTabSelector('decision')}
          className={ClassNames({ selected: subTab === 'decision' })}
          data-test-id="päätös-välilehti"
        >
          Päätös
          <HelpTooltip
            content={helpTexts['hakujen_hallinta__päätös___välilehden_infopallo_välilehtiriville']}
          />
        </span>
        <span
          onClick={createSubTabSelector('valiselvitys')}
          className={ClassNames({ selected: subTab === 'valiselvitys' })}
          data-test-id="väliselvitys-välilehti"
        >
          Väliselvitys
          <HelpTooltip
            content={
              helpTexts['hakujen_hallinta__väliselvitys___välilehden_infopallo_välilehtiriville']
            }
          />
        </span>
        <span
          onClick={createSubTabSelector('loppuselvitys')}
          className={ClassNames({ selected: subTab === 'loppuselvitys' })}
          data-test-id="loppuselvitys-välilehti"
        >
          Loppuselvitys
          <HelpTooltip
            content={
              helpTexts['hakujen_hallinta__loppuselvitys___välilehden_infopallo_välilehtiriville']
            }
          />
        </span>
        <span
          onClick={createSubTabSelector('maksatukset')}
          className={
            avustushaku.status !== 'published' && avustushaku.status !== 'resolved'
              ? 'disabled'
              : ClassNames({ selected: subTab === 'maksatukset' })
          }
        >
          Maksatukset
          <HelpTooltip
            content={
              helpTexts['hakujen_hallinta__maksatus___välilehden_infopallo_välilehtiriville']
            }
            direction="right"
          />
        </span>
      </div>
      <div className={subTab !== 'maksatukset' ? 'section-container' : 'maksatukset-container'}>
        {subTabContent}
      </div>
    </section>
  )
}
