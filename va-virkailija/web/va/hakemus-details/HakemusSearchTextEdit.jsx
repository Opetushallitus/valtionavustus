import React, { Component } from 'react'
import _ from 'lodash'

export default class HakemusSearchTextEdit extends Component {

  render() {
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    console.log("Arvio", hakemus.arvio)
    const value = _.get(hakemus.arvio, "search-text", "")
    const allowEditing = this.props.allowEditing
    const onChange = (e) => {
      allowEditing ? controller.setHakemusSearchText(hakemus, e.target.value) : null
    }
    return <div id="hakemus-search-text-edit-container">
             <label className="search-text-edit-label" htmlFor="arvio-search-text-edit">
               Hakusanat:
             </label>
             <input type="text"
                    id="arvio-search-text-edit"
                    className="search-text-edit"
                    placeholder="Hakusanat"
                    maxLength="32"
                    value={value}
                    onChange={onChange}
                    disabled={!allowEditing}/>
           </div>
  }
}
