import React from 'react'

export default class VaLogin extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const user = this.props.user
    return <section id="topbar">
      <div id="top-container">
        <img id="logo" src="img/logo.png"/>
        <h1 id="topic">{this.props.title}</h1>
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