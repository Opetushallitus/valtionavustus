import React, { Component } from 'react'

export default class HakemusPreview extends Component {
  render() {
    const hakemus = this.props.hakemus
    const avustushakuId = this.props.avustushakuId
    const previewUrl = hakemus ? "/hakemus-preview/" + avustushakuId + "/" + hakemus.user_key : undefined
    return <iframe src={previewUrl} />
  }
}