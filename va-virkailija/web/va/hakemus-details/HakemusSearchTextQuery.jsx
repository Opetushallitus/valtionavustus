import React, { Component } from 'react'
import _ from 'lodash'

export default class HakemusSearchTextEdit extends Component {

  render() {
    const controller = this.props.controller
    return <div id="hakemus-search-text-container">
             <input className="comment-input" id="arvio-search-text-query"
                       placeholder="Hae arvion hakusanoilla" />
           </div>
  }
}
