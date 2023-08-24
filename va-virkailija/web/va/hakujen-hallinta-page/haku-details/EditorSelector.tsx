import React from 'react'
import ClassNames from 'classnames'

import HelpTooltip from '../../common-components/HelpTooltip'
import { useHakujenHallintaSelector } from '../hakujenHallintaStore'
import { selectLoadedInitialData } from '../hakuReducer'
import { NavLinkWithQuery } from '../../NavLinkWithQuery'
import { useLocation } from 'react-router-dom'
import { useCurrentAvustushaku } from '../useAvustushaku'

export const EditorSelector = ({ children }: { children: React.ReactNode }) => {
  const avustushaku = useCurrentAvustushaku()
  const { helpTexts } = useHakujenHallintaSelector(selectLoadedInitialData)
  const { pathname } = useLocation()
  const isSelected = ({ isActive }: { isActive: boolean }): string | undefined =>
    ClassNames({ selected: isActive })
  return (
    <section id="editor-section">
      <div id="editor-subtab-selector" className="section-container">
        <NavLinkWithQuery
          to="haku-editor"
          data-test-id="haun-tiedot-välilehti"
          className={isSelected}
        >
          Haun tiedot
          <HelpTooltip
            content={helpTexts['hakujen_hallinta__haun_tiedot___valilehden_infopallo']}
            direction="left"
          />
        </NavLinkWithQuery>
        <NavLinkWithQuery
          to="form-editor"
          data-test-id="hakulomake-välilehti"
          className={isSelected}
        >
          Hakulomake
          <HelpTooltip content={helpTexts['hakujen_hallinta__hakulomake___valilehden_infopallo']} />
        </NavLinkWithQuery>
        <NavLinkWithQuery to="decision" className={isSelected} data-test-id="päätös-välilehti">
          Päätös
          <HelpTooltip
            content={helpTexts['hakujen_hallinta__päätös___välilehden_infopallo_välilehtiriville']}
          />
        </NavLinkWithQuery>
        <NavLinkWithQuery
          to="valiselvitys"
          className={isSelected}
          data-test-id="väliselvitys-välilehti"
        >
          Väliselvitys
          <HelpTooltip
            content={
              helpTexts['hakujen_hallinta__väliselvitys___välilehden_infopallo_välilehtiriville']
            }
          />
        </NavLinkWithQuery>
        <NavLinkWithQuery
          to="loppuselvitys"
          className={isSelected}
          data-test-id="loppuselvitys-välilehti"
        >
          Loppuselvitys
          <HelpTooltip
            content={
              helpTexts['hakujen_hallinta__loppuselvitys___välilehden_infopallo_välilehtiriville']
            }
          />
        </NavLinkWithQuery>
        <NavLinkWithQuery
          to="maksatukset"
          className={({ isActive }) =>
            avustushaku.status !== 'published' && avustushaku.status !== 'resolved'
              ? 'disabled'
              : ClassNames({ selected: isActive })
          }
        >
          Maksatukset
          <HelpTooltip
            content={
              helpTexts['hakujen_hallinta__maksatus___välilehden_infopallo_välilehtiriville']
            }
            direction="right"
          />
        </NavLinkWithQuery>
      </div>
      <div
        className={
          pathname === '/admin/maksatukset' ? 'maksatukset-container' : 'section-container'
        }
      >
        {children}
      </div>
    </section>
  )
}
