import React from 'react'

import TextButton from 'va-common/web/form/component/TextButton.jsx'

export default class VaLogin extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const lang = "fi"
    const translations = {"logout": {"fi": "Kirjaudu ulos"}}
    const user = this.props.user
    return <section id="topbar">
      <div id="top-container">
        <img id="logo" src="img/logo.png"/>
        <h1 id="topic">{this.props.title}</h1>
        <div hidden={!user} id="form-controls">
          <div className="user">{user}</div>
          <form action="/login/logout" name="logout" method="post">
            <TextButton type="submit" htmlId="logout-button" hidden={false} translations={translations} translationKey="logout" lang={lang} />
          </form>
        </div>
      </div>
    </section>
  }
}