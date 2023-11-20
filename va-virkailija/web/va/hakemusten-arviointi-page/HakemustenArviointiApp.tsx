import React, { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  matchRoutes,
  Navigate,
  Outlet,
  useParams,
  useRoutes,
  useSearchParams,
} from 'react-router-dom'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { Hakemus } from 'soresu-form/web/va/types'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

import { HeaderContainer } from '../common-components/Header'
import {
  InitialData,
  InitialDataProvider,
  useEnvironment,
  useUserInfo,
} from '../initial-data-context'
import AvustushakuDropdown from './avustushaku-dropdown/AvustushakuDropdown'
import HakemusDetails from './hakemus-details/HakemusDetails'
import { MODAL_ROOT_ID } from './hakemus-details/Modal'
import { HakemusHakijaSidePreviewLink } from './hakemus-details/HakemusHakijaSidePreviewLink'
import HakemusDecisionLink from './hakemus-details/HakemusDecisionLink'
import { HakemusArviointiTab } from './hakemus-details/arviointi-tab/HakemusArviointiTab'
import VäliselvitysTab from './hakemus-details/valiselvitys-tab/VäliselvitysTab'
import LoppuselvitysTab from './hakemus-details/loppuselvitys-tab/LoppuselvitysTab'
import MuutoshakemusTab from './hakemus-details/muutoshakemus-tab/MuutoshakemusTab'
import SeurantaTab from './hakemus-details/seuranta-tab/SeurantaTab'
import { ViestiHankkeelleTab } from './hakemus-details/viesti-tab/ViestiHankkeelleTab'
import HakemusFilter from './hakemus-filter/HakemusFilter'
import { AvustushakuDetails } from './hakemus-list/AvustushakuDetails'
import HakemusListing from './hakemus-list/HakemusListing'
import { Switch } from './hakemus-list/Switch'
import store, { useHakemustenArviointiSelector } from './arviointiStore'
import { initialize } from './arviointiReducer'

import './../style/main.less'
import './hakemusten-arviointi.less'
import { UserInfo } from '../types'
import LoadingSitePage from '../common-components/LoadingSitePage'

const SHOW_ALL = 'showAll' as const
const SHOW_ADDITIONAL_INFO = 'showAdditionalInfo' as const

const setUrlParams = (key: string, value: boolean) => {
  const searchParams = new URLSearchParams(location.search)
  searchParams.set(key, String(value))
  const newUrl = `${location.pathname}?${searchParams.toString()}`
  history.replaceState(null, document.title, newUrl)
}

const unwantedHakemukset = ({ status }: Hakemus) => {
  return (
    status === 'submitted' ||
    status === 'pending_change_request' ||
    status === 'officer_edit' ||
    status === 'applicant_edit'
  )
}

const App = () => {
  const [showAllHakemukset, toggleShowAllHakemukset] = useState(
    () => new URLSearchParams(location.search).get(SHOW_ALL) === 'true'
  )
  const saveStatus = useHakemustenArviointiSelector((state) => state.arviointi.saveStatus)
  const userInfo = useUserInfo()
  const environment = useEnvironment()
  const avustushakuData = useHakemustenArviointiSelector((state) => state.arviointi.avustushakuData)
  const { hakemusId } = useParams()
  const { hakuData } = avustushakuData ?? {}
  const selectedHakemusId = hakemusId ? Number(hakemusId) : undefined
  const { avustushaku, hakemukset = [] } = hakuData ?? {}
  const hakemusList = showAllHakemukset ? hakemukset : hakemukset.filter(unwantedHakemukset)
  const hasSelected = selectedHakemusId !== undefined
  const [searchParams] = useSearchParams()
  const splitView = searchParams.get('splitView') === 'true'
  const [showInfo, setShowInfo] = useState(
    () => new URLSearchParams(location.search).get(SHOW_ADDITIONAL_INFO) === 'true'
  )
  const isResolved = avustushaku?.status === 'resolved'
  const selectedHakemus = selectedHakemusId
    ? hakemusList.find((h) => h.id === selectedHakemusId)
    : undefined
  return (
    <section className={splitView ? 'split-view' : ''}>
      <HeaderContainer
        activeTab="arviointi"
        environment={environment}
        userInfo={userInfo}
        saveStatus={saveStatus}
        avustushakuId={avustushaku?.id}
      />
      <section className="section-container">
        <div id="list-container" className={hasSelected ? 'has-selected' : ''}>
          <div id="list-heading">
            <AvustushakuDropdown />
            <div className="right-side">
              <button
                className="hakemus-btn"
                onClick={() => {
                  const newState = !showInfo
                  setUrlParams(SHOW_ADDITIONAL_INFO, newState)
                  setShowInfo(newState)
                }}
              >
                {showInfo ? 'Piilota' : 'Näytä'} lisätiedot
              </button>
              <HakemusFilter />
              {!isResolved && (
                <Switch
                  checked={showAllHakemukset}
                  onChange={() => {
                    const newState = !showAllHakemukset
                    setUrlParams(SHOW_ALL, newState)
                    toggleShowAllHakemukset(newState)
                  }}
                  label="Näytä keskeneräiset"
                />
              )}
              {avustushaku && (
                <a
                  className="excel-export"
                  href={`/api/avustushaku/${avustushaku.id}/export.xslx`}
                  target="_"
                >
                  Lataa Excel
                </a>
              )}
            </div>
          </div>
          <div>
            {showInfo && avustushakuData && (
              <AvustushakuDetails
                {...avustushakuData}
                acceptedHakemus={hakemusList.find((h) => h.arvio.status === 'accepted')}
              />
            )}
          </div>
          <HakemusListing
            selectedHakemus={selectedHakemus}
            hakemusList={hakemusList}
            isResolved={isResolved}
            splitView={splitView}
            additionalInfoOpen={showInfo}
          />
        </div>
        <Outlet />
        <div hidden={!hasSelected} id="footer">
          {avustushaku && selectedHakemus?.['user-key'] && (
            <>
              <HakemusHakijaSidePreviewLink
                hakemusUserKey={selectedHakemus['user-key']}
                avustushakuId={avustushaku.id}
              />
              <HakemusDecisionLink hakemus={selectedHakemus} avustushaku={avustushaku} />
            </>
          )}
        </div>
      </section>
    </section>
  )
}

const routes = [
  {
    path: 'avustushaku/:avustushakuId?',
    element: <App />,
    children: [
      {
        path: 'hakemus/:hakemusId',
        element: <HakemusDetails />,
        children: [
          {
            element: <HakemusArviointiTab />,
            index: true,
          },
          { path: 'arviointi', element: <HakemusArviointiTab /> },
          { path: 'valiselvitys', element: <VäliselvitysTab /> },
          { path: 'loppuselvitys', element: <LoppuselvitysTab /> },
          { path: 'muutoshakemukset', element: <MuutoshakemusTab /> },
          { path: 'seuranta', element: <SeurantaTab /> },
          { path: 'viesti', element: <ViestiHankkeelleTab /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={`/avustushaku/`} replace /> },
]

function LoadingWrapper() {
  const [initialData, setInitialData] = useState<InitialData | null>(null)
  const routeElement = useRoutes(routes)
  useEffect(() => {
    let unmounted = false
    async function loadData() {
      const [environment, userInfo, helpTexts] = await Promise.all([
        HttpUtil.get<EnvironmentApiResponse>('/environment'),
        HttpUtil.get<UserInfo>('/api/userinfo'),
        HttpUtil.get<Record<string, string>>('/api/help-texts/all'),
      ])
      const initialData = {
        environment,
        userInfo,
        helpTexts,
      }
      if (!unmounted) {
        setInitialData(initialData)
      }
    }
    void loadData()
    return () => {
      unmounted = true
    }
  }, [])

  if (!initialData) {
    return <LoadingSitePage />
  }
  return (
    <InitialDataProvider value={initialData}>
      {routeElement}
      <div id={MODAL_ROOT_ID} />
    </InitialDataProvider>
  )
}

const app = document.getElementById('app')
const root = createRoot(app!)

const initialRouteMatches = matchRoutes(routes, window.location.pathname)
const { avustushakuId, hakemusId } = initialRouteMatches?.[0].params ?? {}
const getAsNumberOrUndefined = (value: unknown): number | undefined => {
  const maybeNum = Number(value)
  return isNaN(maybeNum) ? undefined : maybeNum
}

store.dispatch(
  initialize({
    avustushakuId: getAsNumberOrUndefined(avustushakuId),
    hakemusId: getAsNumberOrUndefined(hakemusId),
  })
)

root.render(
  <BrowserRouter>
    <Provider store={store}>
      <LoadingWrapper />
    </Provider>
  </BrowserRouter>
)
