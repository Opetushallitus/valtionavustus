import React, { Component } from 'react'

export default class HakemusPreview extends Component {
  render() {
    const hakemus = this.props.hakemus
    const previewUrl = "http://localhost:8080/avustushaku/1/nayta?avustushaku=1&hakemus=" +
          hakemus.user_key + "&preview=true"
    return <iframe src={previewUrl} />
  }
}