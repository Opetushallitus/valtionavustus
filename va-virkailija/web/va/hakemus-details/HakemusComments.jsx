import React, { Component } from 'react'
import _ from 'lodash'

import {BasicInfoComponent} from 'va-common/web/form/component/InfoElement.jsx'
import HakemusStatus from "./HakemusStatus.jsx"

export default class HakemusComments extends Component {
  render() {
    const controller = this.props.controller
    const commentsInState = this.props.comments
    const loadingComments = this.props.loadingComments
    const commentsHaveBeenLoaded = _.isArray(commentsInState)

    var commentsToRender = []
    if (commentsHaveBeenLoaded) {
      commentsToRender = commentsInState
    } else if (!loadingComments) {
      controller.loadComments()
    }
    const commentComponents = _.map(commentsToRender, c => <Comment comment={c} key={c.id}/>)
    return <div id="hakemus-comment-container">
             <div className="comment-list">
               {commentComponents}
              </div>
              <textarea id="comment-input" placeholder="Kommentoi" onKeyDown={this.onKeyDown(controller)}>
              </textarea>
           </div>
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

class Comment {
  render() {
    const comment = this.props.comment
    const firstName = comment.first_name
    const lastNameInitial = comment.last_name ? comment.last_name.charAt(0).toUpperCase() : ''
    const commentLine = firstName + ' ' + lastNameInitial + ': ' + comment.comment
    const dateTime = new Date(comment.created_at)
    const dateTimeString = BasicInfoComponent.asDateString(dateTime) + ' ' + BasicInfoComponent.asTimeString(dateTime)
    const toolTipString = comment.first_name + ' ' + comment.last_name + ' ' + dateTimeString + ': ' +
        comment.comment
    return <div className="single-comment" title={toolTipString} >
            <div>{commentLine}</div>
            <div className="comment-datetime">{dateTimeString}</div>
           </div>
  }
}
