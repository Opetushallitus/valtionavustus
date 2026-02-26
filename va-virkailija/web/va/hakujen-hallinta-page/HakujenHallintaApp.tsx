import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import moment from 'moment'
// @ts-ignore react-widgets-moment doesn't have proper types
import MomentLocalizer from 'react-widgets-moment'
import Localization from 'react-widgets/Localization'
import { HeaderContainer, HeaderSaveStatus } from '../common-components/Header'
import { EditorSelector } from './haku-details/EditorSelector'
import { translationsFi } from 'soresu-form/web/va/i18n/translations'
import { HakuListing } from './haku-list/HakuListing'
import store, {
  useHakujenHallintaDispatch,
  useHakujenHallintaSelector,
} from './hakujenHallintaStore'
import { Provider } from 'react-redux'
import { fetchInitialState, selectHaku } from './hakuReducer'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useSearchParams } from 'react-router-dom'
import { HakuEdit } from './haku-details/HakuEdit'
import FormEditorContainer from './haku-details/FormEditorContainer'
import DecisionEditor from './haku-details/DecisionEditor'
import { SelvitysFormEditor } from './haku-details/SelvitysFormEditor'
import { Maksatukset } from './haku-details/Maksatukset'

import 'soresu-form/web/form/style/theme.css'
import '../style/virkailija.css'
import '../style/admin.css'
import LoadingSitePage from '../common-components/LoadingSitePage'
import ErrorBoundary from '../common-components/ErrorBoundary'

moment.locale('fi')
const momentLocalizer = new MomentLocalizer(moment)

const HakujenHallintaApp = () => {
  const state = useHakujenHallintaSelector((state) => state.haku)
  const { saveStatus, loadStatus, initialData } = state
  const { loading: initialDataLoading } = initialData
  const dispatch = useHakujenHallintaDispatch()
  const [searchParams] = useSearchParams()
  const avustushakuId = Number(searchParams.get('avustushaku'))
  useEffect(() => {
    if (!initialDataLoading && avustushakuId) {
      dispatch(selectHaku(avustushakuId))
    }
  }, [avustushakuId, initialDataLoading])
  if (initialDataLoading) {
    return <LoadingSitePage />
  }

  const saveInProgress =
    saveStatus.saveInProgress ||
    saveStatus.savingRoles ||
    saveStatus.savingForm ||
    saveStatus.savingProjects ||
    saveStatus.savingTalousarviotilit ||
    saveStatus.savingManuallyRefactorToOwnActionsAtSomepoint

  const headerSaveStatus: HeaderSaveStatus = {
    loading: loadStatus.loadingAvustushaku,
    loadError: loadStatus.error ? 'avustushaku-load-error' : undefined,
    saveInProgress,
    saveTime: saveStatus.saveTime,
    serverError: saveStatus.serverError,
    sendingMaksatuksetAndTasmaytysraportti: saveStatus.sendingMaksatuksetAndTasmaytysraportti,
    sendingMaksatuksetAndTasmaytysraporttiFailed:
      saveStatus.sendingMaksatuksetAndTasmaytysraporttiFailed,
  }

  return (
    <Localization date={momentLocalizer} messages={translationsFi.calendar}>
      <HeaderContainer
        activeTab="admin"
        environment={initialData.data.environment}
        userInfo={initialData.data.userInfo}
        saveStatus={headerSaveStatus}
        avustushakuId={avustushakuId}
      />
      <section>
        <HakuListing />
        <EditorSelector>
          <Outlet />
        </EditorSelector>
      </section>
    </Localization>
  )
}

const AppRoutes = () => (
  <Routes>
    <Route path="admin" element={<HakujenHallintaApp />}>
      <Route path="haku-editor" element={<HakuEdit />} />
      <Route path="form-editor" element={<FormEditorContainer />} />
      <Route path="decision" element={<DecisionEditor />} />
      <Route path="valiselvitys" element={<SelvitysFormEditor selvitysType="valiselvitys" />} />
      <Route path="loppuselvitys" element={<SelvitysFormEditor selvitysType="loppuselvitys" />} />
      <Route path="maksatukset" element={<Maksatukset />} />
      <Route index element={<Navigate to="/admin/haku-editor" replace />} />
    </Route>
  </Routes>
)

const app = document.getElementById('app')
const root = createRoot(app!)

store.dispatch(fetchInitialState())

root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <Provider store={store}>
        <AppRoutes />
      </Provider>
    </BrowserRouter>
  </ErrorBoundary>
)
