import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Koodienhallinta } from "./koodienhallinta/Koodienhallinta";
import { HeaderContainer } from "./Header";
import { store } from "./koodienhallinta/store";
import { VaCode } from "./koodienhallinta/VaCode";
import { useGetEnvironmentAndUserInfoQuery } from "./koodienhallinta/apiSlice";
import { TalousarviotilienHallinta } from "./koodienhallinta/TalousarviotilienHallinta";

import "oph-virkailija-style-guide/oph-styles-min.css";
import "./style/main.less";

const KoodienhallintaApp = () => {
  const { data, isSuccess } = useGetEnvironmentAndUserInfoQuery();
  if (!isSuccess) {
    return null;
  }
  const { environment, userInfo } = data;
  const enableTaTilit = !!environment["ta-tilit"]?.["enabled?"];
  return (
    <>
      <HeaderContainer
        activeTab="va-code-values"
        environment={environment}
        userInfo={userInfo}
      />
      <Routes>
        <Route path="/admin-ui/va-code-values/" element={<Koodienhallinta />}>
          <Route index element={<Navigate to="operational-unit" replace />} />
          <Route
            path="operational-unit"
            element={<VaCode valueType="operational-unit" />}
          />
          <Route path="project" element={<VaCode valueType="project" />} />
          <Route path="operation" element={<VaCode valueType="operation" />} />
          {enableTaTilit && (
            <Route path="ta-tilit" element={<TalousarviotilienHallinta />} />
          )}
        </Route>
      </Routes>
    </>
  );
};

const app = document.getElementById("app");
const root = createRoot(app!);
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <KoodienhallintaApp />
    </BrowserRouter>
  </Provider>
);
