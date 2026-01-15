import React, { useEffect } from 'react'
import { Outlet, useParams, useSearchParams } from 'react-router-dom'

import HakemusPreview from './hakemus-preview-pane/HakemusPreview'
import { useHakemustenArviointiDispatch, useHakemustenArviointiSelector } from '../arviointiStore'
import { selectHakemus } from '../arviointiReducer'
import { NavLinkWithQuery } from '../../NavLinkWithQuery'
import { EnvelopeIcon } from '../../common-components/icons'

import './hakemusDetails.css'

export const HakemusDetails = () => {
  const { hakemusId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const splitView = searchParams.get('splitView') === 'true'
  const selectedHakemusId = Number(hakemusId)
  const dispatch = useHakemustenArviointiDispatch()
  const hakuData = useHakemustenArviointiSelector(
    (state) => state.arviointi.avustushakuData?.hakuData
  )
  const loadingAvustushaku = useHakemustenArviointiSelector(
    (state) => state.arviointi.loadStatus.loadingAvustushaku
  )

  useEffect(() => {
    if (!loadingAvustushaku) {
      dispatch(selectHakemus(selectedHakemusId))
    }
  }, [selectedHakemusId, loadingAvustushaku])

  const onToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    const nextToggle = !splitView
    searchParams.set('splitView', String(nextToggle))
    setSearchParams(searchParams)
    if (nextToggle) {
      const container = document.querySelector('.hakemus-list tbody.has-selected')
      const selected = document.querySelector<HTMLTableRowElement>(
        '#list-container tbody.has-selected .overview-row.selected'
      )
      if (container && selected?.offsetTop) {
        container.scrollTop = selected.offsetTop - 100
      }
    }
    return false
  }
  const avustushaku = hakuData?.avustushaku
  const hakemus = hakuData?.hakemukset.find((h) => h.id === selectedHakemusId)
  if (!avustushaku || !hakemus) {
    return null
  }

  const { muutoshakemukset } = hakemus
  const MuutoshakemuksetLabel = () => (
    <span className="muutoshakemus-tab">
      Muutoshakemukset
      <span
        className={
          muutoshakemukset?.some((m) => m.status === 'new') ? 'muutoshakemukset-warning' : ''
        }
        data-test-id="number-of-pending-muutoshakemukset"
      >
        ({muutoshakemukset ? muutoshakemukset.length : 0})
      </span>
    </span>
  )

  const isLinkActive = ({ isActive }: { isActive: boolean }) => (isActive ? 'selected' : '')

  return (
    <div id="hakemus-details">
      <NavLinkWithQuery id="close-hakemus-button" to={`/avustushaku/${avustushaku.id}`}>
        &times;
      </NavLinkWithQuery>
      <button id="toggle-hakemus-list-button" onClick={onToggle}>
        ↕
      </button>
      <HakemusPreview hakemus={hakemus} avustushaku={avustushaku} hakuData={hakuData} />
      <div className="arviointi-container">
        <div id="editor-subtab-selector" className="fixed-tabs section-container">
          <NavLinkWithQuery to="arviointi" className={isLinkActive}>
            Arviointi
          </NavLinkWithQuery>
          <NavLinkWithQuery to="valiselvitys" className={isLinkActive}>
            Väliselvitys
          </NavLinkWithQuery>
          <NavLinkWithQuery to="loppuselvitys" className={isLinkActive}>
            Loppuselvitys
          </NavLinkWithQuery>
          <NavLinkWithQuery to="muutoshakemukset" className={isLinkActive}>
            <MuutoshakemuksetLabel />
          </NavLinkWithQuery>
          <NavLinkWithQuery to="seuranta" className={isLinkActive} data-test-id="tab-seuranta">
            Seuranta
          </NavLinkWithQuery>
          <NavLinkWithQuery to="viesti" className={isLinkActive}>
            {({ isActive }) => <EnvelopeIcon active={isActive} />}
          </NavLinkWithQuery>
        </div>
        <div id="hakemus-arviointi" className="fixed-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default HakemusDetails
