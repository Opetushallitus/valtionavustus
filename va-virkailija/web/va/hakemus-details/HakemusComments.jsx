import React, { Component } from 'react'
import _ from 'lodash'

import DateUtil from 'soresu-form/web/form/DateUtil'

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
                     placeholder="Kommentoi" onKeyDown={this.onKeyDown(controller)}/>
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
    const firstName = comment.first_name
    const lastNameInitial = comment.last_name ? comment.last_name.charAt(0).toUpperCase() : ''
    const commentLine = firstName + ' ' + lastNameInitial + ': ' + comment.comment
    const dateTime = new Date(comment.created_at)
    const dateTimeString = DateUtil.asDateString(dateTime) + ' ' + DateUtil.asTimeString(dateTime)
    const toolTipString = comment.first_name + ' ' + comment.last_name + ' ' + dateTimeString + ': ' +
        comment.comment
    return <div className="single-comment" title={toolTipString} >
            <div>{commentLine}</div>
            <div className="comment-datetime">{dateTimeString}</div>
           </div>
  }
}
