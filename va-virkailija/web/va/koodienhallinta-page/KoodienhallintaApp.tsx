import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Koodienhallinta } from './Koodienhallinta'
import { HeaderContainer } from '../common-components/Header'
import { store } from './store'
import { VaCode } from './VaCode'
import { useGetEnvironmentAndUserInfoQuery } from '../apiSlice'
import { TalousarviotilienHallinta } from './TalousarviotilienHallinta'

import 'oph-virkailija-style-guide/oph-styles-min.css'
import 'soresu-form/web/form/style/theme.css'
import '../style/main.css'
import LoadingSitePage from '../common-components/LoadingSitePage'
import ErrorBoundary from '../common-components/ErrorBoundary'

const KoodienhallintaApp = () => {
  const { data, isSuccess } = useGetEnvironmentAndUserInfoQuery()
  if (!isSuccess) {
    return <LoadingSitePage />
  }
  const { environment, userInfo } = data
  return (
    <>
      <HeaderContainer activeTab="va-code-values" environment={environment} userInfo={userInfo} />
      <Routes>
        <Route path="/admin-ui/va-code-values/" element={<Koodienhallinta />}>
          <Route index element={<Navigate to="operational-unit" replace />} />
          <Route path="operational-unit" element={<VaCode valueType="operational-unit" />} />
          <Route path="project" element={<VaCode valueType="project" />} />
          <Route path="ta-tilit" element={<TalousarviotilienHallinta />} />
        </Route>
      </Routes>
    </>
  )
}

const app = document.getElementById('app')
const root = createRoot(app!)
root.render(
  <ErrorBoundary>
    <Provider store={store}>
      <BrowserRouter>
        <KoodienhallintaApp />
      </BrowserRouter>
    </Provider>
  </ErrorBoundary>
)
