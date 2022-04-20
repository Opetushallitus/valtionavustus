import React, {useEffect, useState} from "react";
import ReactDOM from "react-dom";
import HttpUtil from "soresu-form/web/HttpUtil";

import './style/main.less'
import {Koodienhallinta} from "./koodienhallinta/Koodienhallinta";
import {UserInfo} from "./types";
import {EnvironmentApiResponse} from "soresu-form/web/va/types/environment";
import { HeaderContainer } from "./NewHeader";



interface Data {
  environment: EnvironmentApiResponse
  userInfo: UserInfo
}

const KoodienhallintaApp = () => {
  const [data, setData] = useState<Data>()
  useEffect(() => {
    async function fetchNeeded() {
      const [environment, userInfo] = await Promise.all([
        HttpUtil.get(`/environment`),
        HttpUtil.get(`/api/userinfo`)
      ])
      setData({environment, userInfo})
    }
    fetchNeeded()
  }, [])
  if (!data) {
    return null
  }
  const { environment, userInfo } = data
  const saveStatus = {
    saveInProgress: false,
    saveTime: null,
    serverError: ""
  }
  return <>
    <HeaderContainer activeTab='va-code-values' environment={environment} userInfo={userInfo} saveStatus={saveStatus} />
    <Koodienhallinta />
  </>
}

ReactDOM.render(<KoodienhallintaApp />,  document.getElementById('app'))
