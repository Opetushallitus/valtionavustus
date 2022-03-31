import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import TopBar from "./TopBar";
import HttpUtil from "soresu-form/web/HttpUtil";

import './style/topbar.less'
import './style/main.less'
import {Koodienhallinta} from "./koodienhallinta/Koodienhallinta";
import {UserInfo} from "./types";
import {EnvironmentApiResponse} from "soresu-form/web/va/types/environment";



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
  const {environment} = data
  return <>
    <TopBar environment={environment} activeTab="va-code-values" state={{
      userInfo: data.userInfo,
      saveStatus: {
        saveInProgress: false,
        saveTime: null,
        serverError: ""
      }
    }}/>
    <Koodienhallinta />
  </>
}

ReactDOM.render(<KoodienhallintaApp />,  document.getElementById('app'))
