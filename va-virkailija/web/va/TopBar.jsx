import React from 'react'
import ClassNames from 'classnames'

import EnvironmentInfo from 'va-common/web/va/EnvironmentInfo.jsx'

export default class TopBar extends React.Component {
  render() {
    const environment = this.props.environment
    const state = this.props.state
    const controls = state ? <TopBarControls state={state}/> : ""
    return <section id="topbar">
      <div id="top-container">
        <img id="logo" src="/img/logo.png"/>
        <div id="server-info"><EnvironmentInfo environment={environment}/></div>
        <TopBarTabs disabled={!state} activeTab={this.props.activeTab}/>
        {controls}
      </div>
    </section>
  }
}

class TopBarTabs extends React.Component {
  render() {
    const activeTab = this.props.activeTab
    const disabled = this.props.disabled
    return (
      <div id="tabs">
        <TopBarTab id="arviointi" label="Hakemusten arviointi" href="/" disabled={disabled} activeTab={activeTab}/>
        <TopBarTab id="admin" label="Hakujen hallinta" href="/admin/" disabled={disabled} activeTab={activeTab}/>
      </div>
    )
  }
}

class TopBarTab extends React.Component {
  render() {
    const id = this.props.id
    const label = this.props.label
    const href = this.props.href
    const active = id === this.props.activeTab
    const disabled = this.props.disabled
    const classNames = ClassNames("tab", {active: active})
    if(disabled) {
      return <h1 id={id} className={classNames}>{label}</h1>
    }
    return <a href={href} id={id}className={classNames}>{label}</a>
  }
}

class TopBarControls extends React.Component {

  getStatus(errorId, okStatus) {
    switch (errorId) {
      case "": return okStatus
      case "validation-error": return <span className="error">Jossain kentässä puutteita. Tarkasta arvot.</span>
      default: return <span className="error">Virhe tallennuksessa. Lataa sivu uudelleen.</span>
    }
  }

  render() {
    const state = this.props.state
    const user = state.userInfo
    const username = user["first-name"] + " " + user["surname"]

    const saveStatus = state.saveStatus
    const okStatus = saveStatus.saveInProgress ?
        <span className="info">Tallennetaan</span> :
        <span className="info" hidden={!saveStatus.saveTime || saveStatus.serverError !== ""}>Kaikki tiedot tallennettu</span>
    const status = this.getStatus(saveStatus.serverError, okStatus)

    return (
      <div id="form-controls">
        <div className="status">{status}</div>
        <div className="user">{username}</div>
        <form action="/login/logout" name="logout" method="post">
          <button type="submit">Kirjaudu ulos</button>
        </form>
      </div>
    )
  }
}
