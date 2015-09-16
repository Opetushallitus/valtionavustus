import React, { Component } from 'react'

import HakemusStatus from "./HakemusStatus.jsx"

export default class HakemusCommentInput extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const hakemus = this.props.hakemus
    return (
      <div id="hakemus-comment-container">
        <textarea id="comment-input" placeholder="Kommentoi" onKeyDown={this.onKeyDown(controller)} >
        </textarea>
      </div>
    )
  }

  onKeyDown(controller) {
    return event => {
      if (event.keyCode === 13) {
        event.preventDefault()
        const newComment = event.target.value
        controller.addComment(newComment)
      }
    }
  }
}
