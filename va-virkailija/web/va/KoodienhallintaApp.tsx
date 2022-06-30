import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import HttpUtil from "soresu-form/web/HttpUtil";

import "./style/main.less";
import { Koodienhallinta } from "./koodienhallinta/Koodienhallinta";
import { UserInfo } from "./types";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";
import { HeaderContainer } from "./Header";

interface Data {
  environment: EnvironmentApiResponse;
  userInfo: UserInfo;
}

const KoodienhallintaApp = () => {
  const [data, setData] = useState<Data>();
  useEffect(() => {
    async function fetchNeeded() {
      const [environment, userInfo] = await Promise.all([
        HttpUtil.get(`/environment`),
        HttpUtil.get(`/api/userinfo`),
      ]);
      setData({ environment, userInfo });
    }
    fetchNeeded();
  }, []);
  if (!data) {
    return null;
  }
  const { environment, userInfo } = data;
  return (
    <>
      <HeaderContainer
        activeTab="va-code-values"
        environment={environment}
        userInfo={userInfo}
      />
      <Koodienhallinta />
    </>
  );
};

const app = document.getElementById("app");
const root = createRoot(app!);
root.render(<KoodienhallintaApp />);
