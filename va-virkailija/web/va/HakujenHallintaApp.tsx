import React, { useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import moment from 'moment'
// @ts-ignore react-widgets-moment doesn't have proper types
import MomentLocalizer from 'react-widgets-moment'
import Localization from 'react-widgets/Localization'

import { HeaderContainer } from './Header'
import { EditorSelector } from './haku-details/EditorSelector'
import { translationsFi } from 'soresu-form/web/va/i18n/translations'

import './style/virkailija.less'
import './style/admin.less'
import { HakuListing } from './haku-list/HakuListing'
import store, {
  useHakujenHallintaDispatch,
  useHakujenHallintaSelector,
} from './hakujenHallinta/hakujenHallintaStore'
import { Provider } from 'react-redux'
import { Avustushaku, fetchInitialState, selectHaku } from './hakujenHallinta/hakuReducer'

moment.locale('fi')
const momentLocalizer = new MomentLocalizer(moment)

const HakujenHallintaApp = () => {
  const state = useHakujenHallintaSelector((state) => state.haku)
  const { saveStatus, initialData } = state
  const dispatch = useHakujenHallintaDispatch()
  const onClickHaku = useCallback((avustushaku: Avustushaku) => {
    dispatch(selectHaku(avustushaku))
  }, [])
  if (initialData.loading) {
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
        avustushakuId={state.hakuId}
      />
      <section>
        <HakuListing hakuList={hakuList} onClickHaku={onClickHaku} />
        <EditorSelector />
      </section>
    </Localization>
  )
}

const app = document.getElementById('app')
const root = createRoot(app!)

store.dispatch(fetchInitialState())

root.render(
  <Provider store={store}>
    <HakujenHallintaApp />
  </Provider>
)
