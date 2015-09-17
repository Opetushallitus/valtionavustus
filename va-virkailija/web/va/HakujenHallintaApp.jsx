import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import Bacon from 'baconjs'

import HttpUtil from 'va-common/web/HttpUtil.js'

import Dispatcher from 'va-common/web/Dispatcher'

import TopBar from './TopBar.jsx'

import virkailija from './style/virkailija.less'
import topbar from './style/topbar.less'

export default class AdminApp extends Component {
  render() {
    const model = this.props.model
    const environment =  model.environment
    const user = model.userInfo
    const username = user["first-name"] + " " + user["surname"]
    return (
      <section>
        <TopBar activeTab="admin" environment={environment} user={username}/>
        <section id="container">
        </section>
      </section>
    )
  }
}

const environmentP = Bacon.fromPromise(HttpUtil.get("/environment"))

const initialStateTemplate = {
  environment: environmentP,
  userInfo: Bacon.fromPromise(HttpUtil.get("/api/userinfo"))
}

const initialState = Bacon.combineTemplate(initialStateTemplate)

initialState.onValue(function(state) {
  const properties = { model: state }
  React.render(React.createElement(AdminApp, properties), document.getElementById('app'))
})
