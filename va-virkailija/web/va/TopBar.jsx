import React from 'react'

export default class VaLogin extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <section id="topbar">
      <div id="top-container">
        <img id="logo" src="img/logo.png"/>
        <h1 id="topic">{this.props.title}</h1>
      </div>
    </section>
  }
}