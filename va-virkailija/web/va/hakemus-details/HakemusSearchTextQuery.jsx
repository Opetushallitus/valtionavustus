import React, { Component } from 'react'
import _ from 'lodash'

export default class HakemusSearchTextQuery extends Component {

  render() {
    const controller = this.props.controller
    const onChange = (e) => {
      controller.setFilter("search-text", e.target.value)
    }
    return <div id="hakemus-search-text-container">
             <input className="comment-input" id="arvio-search-text-query"
                    placeholder="Hae arvion hakusanoilla"
                    onChange={onChange} />
           </div>
  }
}
