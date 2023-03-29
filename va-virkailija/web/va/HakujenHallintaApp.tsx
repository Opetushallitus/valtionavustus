import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import moment from 'moment'
// @ts-ignore react-widgets-moment doesn't have proper types
import MomentLocalizer from 'react-widgets-moment'
import Localization from 'react-widgets/Localization'
import { HeaderContainer } from './Header'
import { EditorSelector } from './haku-details/EditorSelector'
import { translationsFi } from 'soresu-form/web/va/i18n/translations'
import { HakuListing } from './haku-list/HakuListing'
import store, {
  useHakujenHallintaDispatch,
  useHakujenHallintaSelector,
} from './hakujenHallinta/hakujenHallintaStore'
import { Provider } from 'react-redux'
import { fetchInitialState, selectHaku } from './hakujenHallinta/hakuReducer'
import { BrowserRouter, Outlet, Route, Routes, useSearchParams } from 'react-router-dom'
import { HakuEdit } from './haku-details/HakuEdit'
import FormEditorContainer from './haku-details/FormEditorContainer'
import DecisionEditor from './haku-details/DecisionEditor'
import { SelvitysFormEditor } from './haku-details/SelvitysFormEditor'
import { Maksatukset } from './haku-details/Maksatukset'

import './style/virkailija.less'
import './style/admin.less'

moment.locale('fi')
const momentLocalizer = new MomentLocalizer(moment)

const HakujenHallintaApp = () => {
  const state = useHakujenHallintaSelector((state) => state.haku)
  const { saveStatus, initialData } = state
  const { loading: initialDataLoading } = initialData
  const dispatch = useHakujenHallintaDispatch()
  const [searchParams] = useSearchParams()
  const avustushakuId = Number(searchParams.get('avustushaku'))
  useEffect(() => {
    if (!initialDataLoading) {
      dispatch(selectHaku(avustushakuId))
    }
  }, [avustushakuId, initialDataLoading])
  if (initialDataLoading) {
    return null
  }
  const { environment, hakuList, userInfo } = initialData.data
  return (
    <Localization date={momentLocalizer} messages={translationsFi.calendar}>
      <HeaderContainer
        activeTab="admin"
        environment={environment}
        userInfo={userInfo}
        saveStatus={saveStatus}
        avustushakuId={avustushakuId}
      />
      <section>
        <HakuListing hakuList={hakuList} />
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
    </Route>
  </Routes>
)

const app = document.getElementById('app')
const root = createRoot(app!)

store.dispatch(fetchInitialState())

root.render(
  <BrowserRouter>
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  </BrowserRouter>
)
