import React, { Component } from 'react'
import _ from 'lodash'

export default class HakemusSearchTextEdit extends Component {

  render() {
    const controller = this.props.controller
    const allowEditing = this.props.allowEditing
    return <div id="hakemus-search-text-edit-container">
             <label className="search-text-edit-label" htmlFor="arvio-search-text-edit">
               Hakusanat:
             </label>
             <input type="text"
                    id="arvio-search-text-edit"
                    className="search-text-edit"
                    placeholder="Lisää hakusanoja arvioon"
                    disabled={!allowEditing}/>
           </div>
  }
}
