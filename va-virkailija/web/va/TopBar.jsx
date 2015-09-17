import React from 'react'
import ClassNames from 'classnames'

import EnvironmentInfo from 'va-common/web/va/EnvironmentInfo.jsx'

export default class TopBar extends React.Component {
  render() {
    const user = this.props.user
    const environment = this.props.environment
    return <section id="topbar">
      <div id="top-container">
        <img id="logo" src="img/logo.png"/>
        <div id="server-info"><EnvironmentInfo environment={environment}/></div>
        <TopBarTabs disabled={!user} activeTab={this.props.activeTab}/>
        <div hidden={!user} id="form-controls">
          <div className="user">{user}</div>
          <form action="/login/logout" name="logout" method="post">
            <button type="submit">Kirjaudu ulos</button>
          </form>
        </div>
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
        <TopBarTab id="arviointi" label="Hakemusten arviointi" disabled={disabled} activeTab={activeTab}/>
        <TopBarTab id="admin" label="Hakujen hallinta" disabled={disabled} activeTab={activeTab}/>
      </div>
    )
  }
}

class TopBarTab extends React.Component {
  render() {
    const id = this.props.id
    const label = this.props.label
    const active = id === this.props.activeTab
    const disabled = this.props.disabled || active
    const classNames = ClassNames("tab", {active: active})
    return (
      <a id={id} disabled={disabled} className={classNames}>{label}</a>
    )
  }
}
