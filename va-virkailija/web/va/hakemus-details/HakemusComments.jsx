import React, { Component } from 'react'
import _ from 'lodash'

import DateUtil from 'soresu-form/web/DateUtil'

import NameFormatter from 'va-common/web/va/util/NameFormatter'

export default class HakemusComments extends Component {

  constructor(props){
    super(props)
    this.state = {comment:"",added:false}
  }

  checkComments() {
    const loadingComments = this.props.loadingComments
    if (!loadingComments && this.props.hakemus.id) {
      this.props.controller.loadComments()
    }
  }

  shouldComponentUpdate (nextProps) {
    if (this.props.hakemus.id !== nextProps.hakemus.id) {
      this.checkComments()
      this.setState({comment:"",added:false})
    }
    return true
  }

  componentWillMount() {
    this.checkComments()
  }

  render() {
    const controller = this.props.controller
    const userOid = this.props.user["person-oid"]
    const allowHakemusCommenting = this.props.allowHakemusCommenting
    let commentsToRender = []
    const commentsInState = this.props.comments
    if (_.isArray(commentsInState)) {
      commentsToRender = commentsInState
    }

    const handleChange = (event) => this.setState({comment: event.target.value})

    const addComment = () =>{
      controller.addComment(this.state.comment)
      this.setState({comment:"",added:true})
    }

    const commentComponents = commentsToRender.map(c => <Comment comment={c} key={c.id}/>)
    const noComments = commentsToRender.length === 0
    const showComments = this.props.grantState === "resolved" ||
          commentsToRender.find(
            c => !c["person_oid"] || c["person_oid"] === userOid)
    return (
      <div id="hakemus-comment-container" className="hakemus-arviointi-section">
        <label>Kommentit</label>
        {showComments ?
          <div>
            {noComments ?
              <div>Ei kommentteja</div> :
              <div className="comment-list">
                {commentComponents}
              </div>}
          </div> :
          <div>
            Mahdolliset muiden käyttäjien jättämät kommentit näytetään, kun
            olet kirjoittanut oman kommenttisi tai haku on ratkaistu tilassa.
          </div>
        }
        <textarea rows="3" className="comment-input" id="comment-input"
                  value={this.state.comment}
                  onChange={handleChange}
                  hidden={!allowHakemusCommenting} disabled={!allowHakemusCommenting}/>
        <button type="button" disabled={this.state.comment.length === 0} onClick={addComment}>Lisää</button>
        <span hidden={!this.state.added}>Kommentti lisätty</span>
      </div>
    )
  }

}

const Comment = ({comment})=>{
    const firstName = NameFormatter.onlyFirstForename(comment.first_name)
    const lastName = comment.last_name
    const nameShort = NameFormatter.shorten(firstName, lastName)
    const paragraphs = comment.comment.split("\n")

    const dateTime = new Date(comment.created_at)
    const dateTimeString = DateUtil.asDateString(dateTime) + ' ' + DateUtil.asTimeString(dateTime)
    const toolTipString = firstName + ' ' + lastName + ' ' + dateTimeString + ': ' + comment.comment
    return (
      <div className="single-comment" title={toolTipString}>
        <div>{nameShort}: {paragraphs.map((text, index) => <p key={index}>{text}</p>)}</div>
        <div className="comment-datetime">{dateTimeString}</div>
      </div>
    )
}
