import React, { Component } from 'react'
import _ from 'lodash'

import DateUtil from 'soresu-form/web/form/DateUtil'

import NameFormatter from 'va-common/web/va/util/NameFormatter.js'

export default class HakemusComments extends Component {

  checkComments() {
    const loadingComments = this.props.loadingComments
    if (!loadingComments && this.props.hakemus.id) {
      this.props.controller.loadComments()
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (this.props.hakemus.id !== nextProps.hakemus.id) {
      this.checkComments()
    }
    return true
  }

  componentWillMount() {
    this.checkComments()
  }

  render() {
    const controller = this.props.controller
    const allowHakemusCommenting = this.props.allowHakemusCommenting
    var commentsToRender = []
    const commentsInState = this.props.comments
    if (_.isArray(commentsInState)) {
      commentsToRender = commentsInState
    }
    const commentComponents = _.map(commentsToRender, c => <Comment comment={c} key={c.id}/>)
    return <div id="hakemus-comment-container">
             <div className="comment-list">
               {commentComponents}
              </div>
              <textarea rows="2" className="comment-input" id="comment-input"
                     placeholder="Kommentoi" onKeyDown={this.onKeyDown(controller)}
                     hidden={!allowHakemusCommenting} disabled={!allowHakemusCommenting}/>
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

class Comment extends Component {
  render() {
    const comment = this.props.comment
    const firstName = NameFormatter.onlyFirstForename(comment.first_name)
    const lastName = comment.last_name
    const commentLine = NameFormatter.shorten(firstName, lastName) + ': ' + comment.comment
    const dateTime = new Date(comment.created_at)
    const dateTimeString = DateUtil.asDateString(dateTime) + ' ' + DateUtil.asTimeString(dateTime)
    const toolTipString = firstName + ' ' + lastName + ' ' + dateTimeString + ': ' +
        comment.comment
    return <div className="single-comment" title={toolTipString} >
            <div>{commentLine}</div>
            <div className="comment-datetime">{dateTimeString}</div>
           </div>
  }
}
