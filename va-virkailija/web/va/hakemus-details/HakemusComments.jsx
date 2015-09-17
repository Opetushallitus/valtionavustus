import React, { Component } from 'react'
import _ from 'lodash'

import HakemusStatus from "./HakemusStatus.jsx"

export default class HakemusComments extends Component {
  render() {
    const controller = this.props.controller
    const comments = this.props.comments
    const loadingComments = this.props.loadingComments
    if (_.isArray(comments)) {
      return (
        <div id="hakemus-comment-container">
          <textarea id="comment-input" placeholder="Kommentoi" onKeyDown={this.onKeyDown(controller)} >
          </textarea>
        </div>
      )
    } else {
      if (!loadingComments) {
        controller.loadComments()
      }
      return <CommentsLoading/>
    }
  }

  onKeyDown(controller) {
    return event => {
      if (event.keyCode === 13) {
        event.preventDefault()
        const newComment = event.target.value
        controller.addComment(newComment)
        event.target.value = ''
      }
    }
  }
}

class CommentsLoading extends Component {
  render() {
    return <div id="hakemus-comments-loading"/>
  }
}